"""Pipeline Router"""
import time
import random
from fastapi import APIRouter

from app.schemas import PipelineMetrics, PipelineStageMetrics, ApiResponse

router = APIRouter()


def _generate_pipeline_metrics() -> PipelineMetrics:
    stages = [
        PipelineStageMetrics(
            stage="ingest",
            label="Ingest",
            events_per_sec=random.randint(650, 720),
            avg_latency_ms=round(random.uniform(0.6, 1.0), 1),
            p95_latency_ms=round(random.uniform(1.8, 2.5), 1),
            error_rate=round(random.uniform(0.0001, 0.0005), 4),
            queue_depth=random.randint(1000, 1500),
            active_workers=8,
            status="healthy",
        ),
        PipelineStageMetrics(
            stage="format_detection",
            label="Format Detection",
            events_per_sec=random.randint(640, 710),
            avg_latency_ms=round(random.uniform(1.2, 1.8), 1),
            p95_latency_ms=round(random.uniform(2.8, 3.8), 1),
            error_rate=round(random.uniform(0.0005, 0.0015), 4),
            queue_depth=random.randint(700, 1000),
            active_workers=4,
            status="healthy",
        ),
        PipelineStageMetrics(
            stage="parser_match",
            label="Parser Match",
            events_per_sec=random.randint(630, 700),
            avg_latency_ms=round(random.uniform(0.4, 0.8), 1),
            p95_latency_ms=round(random.uniform(1.2, 2.0), 1),
            error_rate=round(random.uniform(0.0008, 0.0020), 4),
            queue_depth=random.randint(300, 600),
            active_workers=4,
            status="healthy",
        ),
        PipelineStageMetrics(
            stage="field_extraction",
            label="Field Extraction",
            events_per_sec=random.randint(620, 690),
            avg_latency_ms=round(random.uniform(2.2, 3.5), 1),
            p95_latency_ms=round(random.uniform(6.0, 10.0), 1),
            error_rate=round(random.uniform(0.0020, 0.0050), 4),
            queue_depth=random.randint(1500, 2300),
            active_workers=12,
            status="healthy",
        ),
        PipelineStageMetrics(
            stage="normalization",
            label="Normalization",
            events_per_sec=random.randint(610, 680),
            avg_latency_ms=round(random.uniform(1.5, 2.5), 1),
            p95_latency_ms=round(random.uniform(3.5, 6.0), 1),
            error_rate=round(random.uniform(0.0001, 0.0005), 4),
            queue_depth=random.randint(500, 800),
            active_workers=8,
            status="healthy",
        ),
        PipelineStageMetrics(
            stage="schema_validation",
            label="Schema Validation",
            events_per_sec=random.randint(605, 675),
            avg_latency_ms=round(random.uniform(0.5, 1.0), 1),
            p95_latency_ms=round(random.uniform(1.2, 2.5), 1),
            error_rate=round(random.uniform(0.0010, 0.0030), 4),
            queue_depth=random.randint(150, 300),
            active_workers=4,
            status="healthy",
        ),
        PipelineStageMetrics(
            stage="enrichment",
            label="Enrichment",
            events_per_sec=random.randint(600, 670),
            avg_latency_ms=round(random.uniform(3.5, 5.5), 1),
            p95_latency_ms=round(random.uniform(10.0, 16.0), 1),
            error_rate=round(random.uniform(0.0003, 0.0010), 4),
            queue_depth=random.randint(800, 1200),
            active_workers=6,
            status=random.choice(["healthy", "degraded"]),
        ),
        PipelineStageMetrics(
            stage="output",
            label="Output",
            events_per_sec=random.randint(595, 665),
            avg_latency_ms=round(random.uniform(4.0, 6.5), 1),
            p95_latency_ms=round(random.uniform(12.0, 18.0), 1),
            error_rate=round(random.uniform(0.00005, 0.0003), 4),
            queue_depth=random.randint(250, 450),
            active_workers=4,
            status="healthy",
        ),
    ]
    
    return PipelineMetrics(
        total_events_per_sec=stages[0].events_per_sec,
        total_events_today=random.randint(35_000_000, 45_000_000),
        parse_success_rate=round(random.uniform(0.97, 0.995), 4),
        normalization_coverage=round(random.uniform(0.85, 0.94), 4),
        enrichment_rate=round(random.uniform(0.80, 0.90), 4),
        error_rate=round(random.uniform(0.005, 0.02), 4),
        kafka_consumer_lag=random.randint(2000, 3500),
        stages=stages,
        last_updated=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    )


@router.get("/metrics", response_model=ApiResponse)
async def get_metrics():
    return ApiResponse(data=_generate_pipeline_metrics().model_dump())
