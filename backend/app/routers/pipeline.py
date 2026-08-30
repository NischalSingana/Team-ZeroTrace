"""Pipeline Router"""
import os
import random
import time
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Event
from app.schemas import PipelineMetrics, PipelineStageMetrics, ApiResponse
from app.services.stream_service import pause_stream, resume_stream, restart_stream, stream_state

router = APIRouter()


STAGE_ORDER = [
    "ingest",
    "format_detection",
    "parser_match",
    "field_extraction",
    "normalization",
    "schema_validation",
    "enrichment",
    "output",
]

STAGE_LABELS = {
    "ingest": "Ingest",
    "format_detection": "Format Detection",
    "parser_match": "Parser Match",
    "field_extraction": "Field Extraction",
    "normalization": "Normalization",
    "schema_validation": "Schema Validation",
    "enrichment": "Enrichment",
    "output": "Output",
}


def _idle_metrics() -> PipelineMetrics:
    """Return zeroed pipeline metrics when the stream is paused."""
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    return PipelineMetrics(
        total_events_per_sec=0,
        total_events_today=0,
        parse_success_rate=0.0,
        normalization_coverage=0.0,
        enrichment_rate=0.0,
        error_rate=0.0,
        kafka_consumer_lag=0,
        stages=[
            PipelineStageMetrics(
                stage=stage,
                label=STAGE_LABELS[stage],
                events_per_sec=0,
                avg_latency_ms=0.0,
                p95_latency_ms=0.0,
                error_rate=0.0,
                queue_depth=0,
                active_workers=_active_workers(stage),
                status="idle",
            )
            for stage in STAGE_ORDER
        ],
        last_updated=now,
    )


def _active_workers(stage: str) -> int:
    return {
        "ingest": 8,
        "format_detection": 4,
        "parser_match": 4,
        "field_extraction": 12,
        "normalization": 8,
        "schema_validation": 4,
        "enrichment": 6,
        "output": 4,
    }.get(stage, 4)


def _stage_status(error_rate: float) -> str:
    if error_rate >= 0.05:
        return "error"
    if error_rate >= 0.01:
        return "degraded"
    return "healthy"


async def _generate_pipeline_metrics(db: AsyncSession) -> PipelineMetrics:
    """Derive pipeline metrics from the actual events in the database."""
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=1)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

    # Total events today
    today_count_result = await db.execute(
        select(func.count(Event.id)).where(Event.timestamp >= today_start)
    )
    total_events_today = today_count_result.scalar() or 0

    # Events in the last minute for rate calculations
    window_result = await db.execute(
        select(Event).where(Event.timestamp >= window_start)
    )
    window_events = window_result.scalars().all()

    if not window_events:
        idle = _idle_metrics()
        idle.total_events_today = total_events_today
        return idle

    total_in_window = len(window_events)
    events_per_sec = round(total_in_window / 60.0, 1)

    # Aggregate stats
    confidences = [e.parser_confidence or 0 for e in window_events]
    coverages = [e.schema_coverage or 0 for e in window_events]
    parse_success_rate = sum(1 for c in confidences if c >= 0.5) / total_in_window
    normalization_coverage = sum(coverages) / total_in_window
    error_rate = 1 - parse_success_rate

    # Enrichment rate: events with downstream refs or enrichment tags
    enriched_count = sum(
        1 for e in window_events
        if e.downstream or any("enrich" in (t or "") for t in (e.tags or []))
    )
    enrichment_rate = enriched_count / total_in_window

    # Per-stage metrics derived from event lineage
    stage_stats: dict = {s: {"durations": [], "errors": 0, "count": 0} for s in STAGE_ORDER}

    for event in window_events:
        lineage = event.lineage or []
        for step in lineage:
            stage = step.get("stage")
            if stage not in stage_stats:
                continue
            stage_stats[stage]["count"] += 1
            duration = step.get("duration_ms")
            if isinstance(duration, (int, float)):
                stage_stats[stage]["durations"].append(duration)
            if step.get("status") == "error":
                stage_stats[stage]["errors"] += 1

    stages = []
    for stage in STAGE_ORDER:
        stats = stage_stats[stage]
        count = stats["count"]
        eps = round(count / 60.0, 1) if count else 0
        durations = stats["durations"]
        avg_latency = round(sum(durations) / len(durations), 1) if durations else 0.0
        sorted_durations = sorted(durations)
        p95 = round(sorted_durations[int(len(sorted_durations) * 0.95)] if sorted_durations else 0.0, 1)
        stage_error_rate = stats["errors"] / count if count else 0.0

        stages.append(
            PipelineStageMetrics(
                stage=stage,
                label=STAGE_LABELS[stage],
                events_per_sec=int(eps),
                avg_latency_ms=avg_latency,
                p95_latency_ms=p95,
                error_rate=round(stage_error_rate, 4),
                queue_depth=int(count * random.uniform(1.0, 2.0)) if count else 0,
                active_workers=_active_workers(stage),
                status=_stage_status(stage_error_rate),
            )
        )

    # Kafka lag estimate: events written to stream.log but not yet ingested.
    lag = 0
    try:
        if os.path.exists(stream_state.file_path):
            with open(stream_state.file_path, "r") as f:
                f.seek(stream_state.offset)
                lag = sum(1 for _ in iter(f.readline, ""))
    except Exception:
        lag = 0

    return PipelineMetrics(
        total_events_per_sec=int(events_per_sec),
        total_events_today=total_events_today,
        parse_success_rate=round(parse_success_rate, 4),
        normalization_coverage=round(normalization_coverage, 4),
        enrichment_rate=round(enrichment_rate, 4),
        error_rate=round(error_rate, 4),
        kafka_consumer_lag=lag,
        stages=stages,
        last_updated=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    )


@router.get("/metrics", response_model=ApiResponse)
async def get_metrics(db: AsyncSession = Depends(get_db)):
    if not stream_state.is_streaming:
        return ApiResponse(data=_idle_metrics().model_dump())
    metrics = await _generate_pipeline_metrics(db)
    return ApiResponse(data=metrics.model_dump())


@router.get("/stream/state", response_model=ApiResponse)
async def get_stream_state():
    return ApiResponse(
        data={
            "is_streaming": stream_state.is_streaming,
            "status": "streaming" if stream_state.is_streaming else "paused",
        }
    )


@router.post("/stream/pause")
async def api_pause_stream():
    return await pause_stream()


@router.post("/stream/resume")
async def api_resume_stream():
    return await resume_stream()


@router.post("/stream/restart")
async def api_restart_stream():
    return await restart_stream()
