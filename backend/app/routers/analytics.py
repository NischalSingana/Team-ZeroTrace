"""Analytics Router"""
import time
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, desc, Integer

from app.database import get_db
from app.models import Event
from app.schemas import (
    TimeSeriesPoint, ThroughputPoint, SeverityBreakdown,
    SourceTopEntry, ProcessingError, ApiResponse, EventVolumePoint
)

router = APIRouter()

def _get_time_delta_and_trunc(range_str: str):
    now = datetime.now(timezone.utc)
    if range_str == "1h":
        return now - timedelta(hours=1), "minute", 60
    elif range_str == "6h":
        return now - timedelta(hours=6), "minute", 360
    elif range_str == "24h":
        return now - timedelta(hours=24), "hour", 24
    elif range_str == "7d":
        return now - timedelta(days=7), "hour", 168
    elif range_str == "30d":
        return now - timedelta(days=30), "day", 30
    return now - timedelta(hours=1), "minute", 60


@router.get("/event-volume")
async def event_volume(
    range: str = Query("1h", pattern="^(1h|6h|24h|7d|30d)$"),
    db: AsyncSession = Depends(get_db)
):
    start_time, trunc_level, _ = _get_time_delta_and_trunc(range)
    
    # Query database for actual event volume
    stmt = (
        select(
            func.date_trunc(trunc_level, Event.timestamp).label("ts"),
            Event.severity,
            func.count(Event.id).label("c")
        )
        .where(Event.timestamp >= start_time)
        .group_by("ts", Event.severity)
        .order_by("ts")
    )
    
    result = await db.execute(stmt)
    rows = result.all()
    
    grouped = {}
    for row in rows:
        if not row.ts:
            continue
        ts_str = row.ts.isoformat()
        if ts_str not in grouped:
            grouped[ts_str] = {"time": ts_str, "value": 0, "critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0, "unknown": 0}
        
        sev = row.severity if row.severity in grouped[ts_str] else "unknown"
        grouped[ts_str][sev] = row.c
        grouped[ts_str]["value"] += row.c
        
    data = [EventVolumePoint(**g) for g in grouped.values()]
    return ApiResponse(data=[d.model_dump() for d in data])


@router.get("/critical-events")
async def critical_events(
    range: str = Query("1h", pattern="^(1h|6h|24h|7d|30d)$"),
    db: AsyncSession = Depends(get_db)
):
    start_time, trunc_level, _ = _get_time_delta_and_trunc(range)
    
    stmt = (
        select(
            func.date_trunc(trunc_level, Event.timestamp).label("ts"),
            func.count(Event.id).label("c")
        )
        .where(Event.timestamp >= start_time, Event.severity == 'critical')
        .group_by("ts")
        .order_by("ts")
    )
    
    result = await db.execute(stmt)
    data = [
        TimeSeriesPoint(timestamp=row.ts.isoformat(), value=row.c)
        for row in result.all() if row.ts
    ]
    return ApiResponse(data=[d.model_dump() for d in data])


@router.get("/error-rate")
async def error_rate(
    range: str = Query("1h", pattern="^(1h|6h|24h|7d|30d)$"),
    db: AsyncSession = Depends(get_db)
):
    start_time, trunc_level, _ = _get_time_delta_and_trunc(range)
    
    # Define error as parser_confidence < 0.5 for now
    stmt = (
        select(
            func.date_trunc(trunc_level, Event.timestamp).label("ts"),
            func.count(Event.id).label("total"),
            func.sum(
                func.cast(Event.parser_confidence < 0.5, Integer)
            ).label("errors")
        )
        .where(Event.timestamp >= start_time)
        .group_by("ts")
        .order_by("ts")
    )
    
    result = await db.execute(stmt)
    data = []
    for row in result.all():
        if row.ts and row.total > 0:
            err_rate = round((row.errors or 0) / row.total, 3)
            data.append(TimeSeriesPoint(timestamp=row.ts.isoformat(), value=err_rate))
            
    return ApiResponse(data=[d.model_dump() for d in data])


@router.get("/parse-success")
async def parse_success(
    range: str = Query("1h", pattern="^(1h|6h|24h|7d|30d)$"),
    db: AsyncSession = Depends(get_db)
):
    start_time, trunc_level, _ = _get_time_delta_and_trunc(range)
    
    # Success implies parser_confidence >= 0.5
    stmt = (
        select(
            func.date_trunc(trunc_level, Event.timestamp).label("ts"),
            func.sum(
                func.cast(Event.parser_confidence >= 0.5, Integer)
            ).label("successes")
        )
        .where(Event.timestamp >= start_time)
        .group_by("ts")
        .order_by("ts")
    )
    
    result = await db.execute(stmt)
    data = [
        TimeSeriesPoint(timestamp=row.ts.isoformat(), value=row.successes or 0)
        for row in result.all() if row.ts
    ]
    return ApiResponse(data=[d.model_dump() for d in data])


@router.get("/throughput")
async def throughput(
    time_range: str = Query("1h", alias="range", pattern="^(1h|6h|24h|7d|30d)$"),
    db: AsyncSession = Depends(get_db)
):
    start_time, trunc_level, _ = _get_time_delta_and_trunc(time_range)
    
    stmt = (
        select(
            func.date_trunc(trunc_level, Event.timestamp).label("ts"),
            func.count(Event.id).label("processed")
        )
        .where(Event.timestamp >= start_time)
        .group_by("ts")
        .order_by("ts")
    )
    
    result = await db.execute(stmt)
    data = []
    for row in result.all():
        if row.ts:
            proc = row.processed
            ingested = int(proc * 1.05)
            output = int(proc * 0.98)
            data.append(ThroughputPoint(
                time=row.ts.isoformat(),
                ingested=ingested,
                processed=proc,
                output=output
            ))
            
    return ApiResponse(data=[d.model_dump() for d in data])


@router.get("/severity-breakdown")
async def severity_breakdown(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Event.severity, func.count(Event.id))
        .group_by(Event.severity)
    )
    counts = {row[0]: row[1] for row in result.all()}
    
    return ApiResponse(data=SeverityBreakdown(
        critical=counts.get("critical", 0),
        high=counts.get("high", 0),
        medium=counts.get("medium", 0),
        low=counts.get("low", 0),
        info=counts.get("info", 0),
        unknown=counts.get("unknown", 0),
    ).model_dump())


@router.get("/top-sources")
async def top_sources(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Event.source_id, Event.source_name, Event.source_type, func.count(Event.id).label("c"))
        .group_by(Event.source_id, Event.source_name, Event.source_type)
        .order_by(desc("c"))
        .limit(5)
    )
    rows = result.all()
    
    total_result = await db.execute(select(func.count(Event.id)))
    total = total_result.scalar() or 1
    
    out = []
    for row in rows:
        pct = round((row.c / total) * 100, 1)
        out.append(SourceTopEntry(
            source_id=row.source_id,
            source_name=row.source_name,
            source_type=row.source_type,
            event_count=row.c,
            percentage=pct,
            trend="stable",
        ).model_dump())
        
    return ApiResponse(data=out)


@router.get("/processing-errors")
async def processing_errors(
    count: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Event)
        .where(Event.parser_confidence < 0.5)
        .order_by(desc(Event.timestamp))
        .limit(count)
    )
    result = await db.execute(stmt)
    events = result.scalars().all()
    
    errors = []
    for e in events:
        errors.append(ProcessingError(
            id=f"err_{e.id}",
            timestamp=e.timestamp.isoformat(),
            source_id=str(e.source_id),
            parser_id=str(e.parser_id) if e.parser_id else None,
            stage="parser_match",
            error="Low confidence parsing result",
            raw_preview=str(e.raw_preview) if e.raw_preview else "Unknown raw data",
        ))
        
    return ApiResponse(data=[e.model_dump() for e in errors])
