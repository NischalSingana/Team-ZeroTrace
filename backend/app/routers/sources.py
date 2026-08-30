"""Sources Router"""
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.models import Source, Event
from app.schemas import SourceOut, SourceCreate, SourceUpdate, ApiResponse

router = APIRouter()


async def _compute_source_metrics(db, source_id: str):
    """Compute real-time source metrics from the events table."""
    now = datetime.now(timezone.utc)
    last_minute = now - timedelta(minutes=1)
    prev_minute = now - timedelta(minutes=2)

    # Events in last minute
    last_min_stmt = (
        select(func.count(Event.id))
        .where(Event.source_id == source_id, Event.timestamp >= last_minute)
    )
    last_min_count = (await db.execute(last_min_stmt)).scalar() or 0

    # Events in previous minute (for delta)
    prev_min_stmt = (
        select(func.count(Event.id))
        .where(
            Event.source_id == source_id,
            Event.timestamp >= prev_minute,
            Event.timestamp < last_minute,
        )
    )
    prev_min_count = (await db.execute(prev_min_stmt)).scalar() or 0

    # Parse success / error rate in last minute
    quality_stmt = (
        select(
            func.count(Event.id),
            func.sum(func.cast(Event.parser_confidence >= 0.5, func.integer())),
        )
        .where(Event.source_id == source_id, Event.timestamp >= last_minute)
    )
    total, successes = (await db.execute(quality_stmt)).one_or_none() or (0, 0)
    successes = successes or 0
    parse_success_rate = (successes / total) if total else 1.0
    error_rate = 1.0 - parse_success_rate

    # Last event timestamp
    last_event_stmt = (
        select(Event.timestamp)
        .where(Event.source_id == source_id)
        .order_by(Event.timestamp.desc())
        .limit(1)
    )
    last_event_row = (await db.execute(last_event_stmt)).scalar_one_or_none()
    lag_seconds = 0.0
    last_event_at = None
    if last_event_row:
        last_event_at = last_event_row.isoformat()
        lag = (now - last_event_row).total_seconds()
        lag_seconds = max(0.0, round(lag, 1))

    # Approximate bytes per minute (rough heuristic: ~350 bytes/event)
    bytes_per_min = last_min_count * 350

    delta = 0.0
    if prev_min_count > 0:
        delta = round(((last_min_count - prev_min_count) / prev_min_count) * 100, 1)

    return {
        "events_per_min": last_min_count,
        "events_per_min_delta": delta,
        "bytes_per_min": bytes_per_min,
        "parse_success_rate": round(parse_success_rate, 4),
        "error_rate": round(error_rate, 4),
        "last_event_at": last_event_at,
        "lag_seconds": lag_seconds,
    }


@router.get("", response_model=ApiResponse)
async def list_sources(db=Depends(get_db)):
    stmt = select(Source).order_by(Source.created_at.desc())
    result = await db.execute(stmt)
    sources = result.scalars().all()

    out = []
    for source in sources:
        metrics = await _compute_source_metrics(db, source.id)
        source.metrics = metrics
        out.append(SourceOut.model_validate(source).model_dump())

    return ApiResponse(data=out)


@router.get("/{source_id}", response_model=ApiResponse)
async def get_source(source_id: str, db=Depends(get_db)):
    stmt = select(Source).where(Source.id == source_id)
    result = await db.execute(stmt)
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    source.metrics = await _compute_source_metrics(db, source.id)
    return ApiResponse(data=SourceOut.model_validate(source).model_dump())


@router.post("", response_model=ApiResponse)
async def create_source(source: SourceCreate, db=Depends(get_db)):
    db_source = Source(**source.model_dump())
    db.add(db_source)
    await db.commit()
    await db.refresh(db_source)
    db_source.metrics = await _compute_source_metrics(db, db_source.id)
    return ApiResponse(data=SourceOut.model_validate(db_source).model_dump())


@router.patch("/{source_id}", response_model=ApiResponse)
async def update_source(source_id: str, update: SourceUpdate, db=Depends(get_db)):
    stmt = select(Source).where(Source.id == source_id)
    result = await db.execute(stmt)
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(source, key, value)

    await db.commit()
    await db.refresh(source)
    source.metrics = await _compute_source_metrics(db, source.id)
    return ApiResponse(data=SourceOut.model_validate(source).model_dump())


@router.delete("/{source_id}", response_model=ApiResponse)
async def delete_source(source_id: str, db=Depends(get_db)):
    stmt = select(Source).where(Source.id == source_id)
    result = await db.execute(stmt)
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    await db.delete(source)
    await db.commit()
    return ApiResponse(data={"deleted": True})
