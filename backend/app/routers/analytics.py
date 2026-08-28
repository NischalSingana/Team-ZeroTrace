"""Analytics Router"""
import time
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Query

from app.schemas import (
    TimeSeriesPoint, ThroughputPoint, SeverityBreakdown,
    SourceTopEntry, ProcessingError, ApiResponse
)

router = APIRouter()


def _generate_series(points: int, base: float, variance: float) -> list[TimeSeriesPoint]:
    now = datetime.utcnow()
    return [
        TimeSeriesPoint(
            timestamp=(now - timedelta(minutes=points - i)).isoformat(),
            value=max(0, round(base + (random.random() - 0.5) * 2 * variance)),
        )
        for i in range(points)
    ]


@router.get("/event-volume")
async def event_volume(
    range: str = Query("1h", regex="^(1h|6h|24h|7d|30d)$"),
):
    points_map = {"1h": 60, "6h": 72, "24h": 96, "7d": 168, "30d": 180}
    points = points_map.get(range, 60)
    return ApiResponse(data=[p.model_dump() for p in _generate_series(points, 680, 120)])


@router.get("/critical-events")
async def critical_events(
    range: str = Query("1h", regex="^(1h|6h|24h|7d|30d)$"),
):
    points_map = {"1h": 60, "6h": 72, "24h": 96, "7d": 168, "30d": 180}
    points = points_map.get(range, 60)
    return ApiResponse(data=[p.model_dump() for p in _generate_series(points, 8, 5)])


@router.get("/error-rate")
async def error_rate(
    range: str = Query("1h", regex="^(1h|6h|24h|7d|30d)$"),
):
    points_map = {"1h": 60, "6h": 72, "24h": 96, "7d": 168, "30d": 180}
    points = points_map.get(range, 60)
    series = _generate_series(points, 15, 12)
    for p in series:
        p.value = round(p.value * 0.01, 3)
    return ApiResponse(data=[p.model_dump() for p in series])


@router.get("/parse-success")
async def parse_success(
    range: str = Query("1h", regex="^(1h|6h|24h|7d|30d)$"),
):
    points_map = {"1h": 60, "6h": 72, "24h": 96, "7d": 168, "30d": 180}
    points = points_map.get(range, 60)
    series = _generate_series(points, 9850, 100)
    for p in series:
        p.value = min(10000, max(9500, p.value))
    return ApiResponse(data=[p.model_dump() for p in series])


@router.get("/throughput")
async def throughput(
    time_range: str = Query("1h", alias="range", regex="^(1h|6h|24h|7d|30d)$"),
):
    points_map = {"1h": 60, "6h": 72, "24h": 96, "7d": 168, "30d": 180}
    points = points_map.get(time_range, 60)
    now = datetime.utcnow()
    data = []
    for i in range(points):
        ts = now - timedelta(minutes=points - i)
        ingested = max(0, round(700 + (random.random() - 0.5) * 150))
        processed = round(ingested * (0.95 + random.random() * 0.04))
        output = round(processed * (0.98 + random.random() * 0.01))
        data.append(ThroughputPoint(time=ts.isoformat(), ingested=ingested, processed=processed, output=output))
    return ApiResponse(data=[d.model_dump() for d in data])


@router.get("/severity-breakdown")
async def severity_breakdown():
    return ApiResponse(data=SeverityBreakdown(
        critical=random.randint(200, 300),
        high=random.randint(1500, 2000),
        medium=random.randint(7000, 9000),
        low=random.randint(18000, 21000),
        info=random.randint(12000000, 13000000),
        unknown=random.randint(80, 120),
    ).model_dump())


@router.get("/top-sources")
async def top_sources():
    return ApiResponse(data=[
        SourceTopEntry(
            source_id="src_010",
            source_name="Custom App — Payments Service",
            source_type="application",
            event_count=random.randint(4000, 5000),
            percentage=31.2,
            trend="up",
        ).model_dump(),
        SourceTopEntry(
            source_id="src_002",
            source_name="Nginx Web Gateway — PROD",
            source_type="web_server",
            event_count=random.randint(2800, 3200),
            percentage=20.2,
            trend="stable",
        ).model_dump(),
        SourceTopEntry(
            source_id="src_012",
            source_name="Splunk UF — Server Farm",
            source_type="custom",
            event_count=random.randint(1000, 1400),
            percentage=8.0,
            trend="up",
        ).model_dump(),
    ])


@router.get("/processing-errors")
async def processing_errors(count: int = Query(10, ge=1, le=100)):
    errors = [
        ProcessingError(
            id="err_1",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - 4000)),
            source_id="src_001",
            stage="parser_match",
            error="No parser matched format syslog_rfc5424",
            raw_preview="Aug 27 17:14:32 dc-edge-fw-01 %ASA-3-106023: Deny tcp...",
        ),
        ProcessingError(
            id="err_2",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - 15000)),
            source_id="src_004",
            parser_id="parser_snort_fast",
            stage="field_extraction",
            error="Regex mismatch on group 'sig_id'",
            raw_preview="[**] [1:1000001:1] SQL Injection Attempt [**] [Priority: 1]",
        ),
    ]
    while len(errors) < count:
        errors.append(ProcessingError(
            id=f"err_{len(errors) + 1}",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - random.randint(1000, 300000))),
            source_id=random.choice(["src_001", "src_002", "src_003", "src_004"]),
            stage=random.choice(["parser_match", "field_extraction", "normalization", "schema_validation"]),
            error=random.choice(["Parse error", "Timeout", "Invalid format", "Missing field"]),
            raw_preview="Sample raw log...",
        ))
    return ApiResponse(data=[e.model_dump() for e in errors[:count]])
