"""Events Router"""
import time
from typing import Optional
from sqlalchemy import select, func, desc, asc, and_, or_
from sqlalchemy.orm import selectinload
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_db
from app.models import Event, RawEvent
from app.schemas import (
    EventOut, EventCreate, SearchQuery, SearchResult, ApiResponse, PaginatedResponse
)

router = APIRouter()


@router.get("", response_model=ApiResponse)
async def list_events(
    page: int = Query(0, ge=0),
    page_size: int = Query(50, ge=1, le=500),
    source_id: Optional[str] = None,
    severity: Optional[str] = None,
    db=Depends(get_db),
):
    t0 = time.time()
    stmt = select(Event)
    if source_id:
        stmt = stmt.where(Event.source_id == source_id)
    if severity:
        stmt = stmt.where(Event.severity == severity)
    
    # Count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar()
    
    # Paginate
    stmt = stmt.order_by(desc(Event.timestamp)).offset(page * page_size).limit(page_size)
    result = await db.execute(stmt)
    events = result.scalars().all()
    
    return ApiResponse(
        data={
            "events": [EventOut.model_validate(e).model_dump() for e in events],
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": (page + 1) * page_size < total,
            "query_ms": round((time.time() - t0) * 1000),
        }
    )


@router.get("/{event_id}", response_model=ApiResponse)
async def get_event(event_id: str, db=Depends(get_db)):
    stmt = select(Event).where(Event.id == event_id)
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return ApiResponse(data=EventOut.model_validate(event).model_dump())


@router.post("/search", response_model=ApiResponse)
async def search_events(query: SearchQuery, db=Depends(get_db)):
    t0 = time.time()
    stmt = select(Event)
    
    # Text search across multiple fields
    if query.text:
        q = f"%{query.text}%"
        stmt = stmt.where(
            or_(
                Event.action.ilike(q),
                Event.source_name.ilike(q),
                Event.raw_preview.ilike(q),
            )
        )
    
    # Severity filter
    if query.severity:
        stmt = stmt.where(Event.severity.in_(query.severity))
    
    # Source filter
    if query.source_ids:
        stmt = stmt.where(Event.source_id.in_(query.source_ids))
    
    # Category filter
    if query.categories:
        stmt = stmt.where(Event.category.in_(query.categories))
    
    # Count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar()
    
    # Sort
    sort_col = getattr(Event, query.sort_by, Event.timestamp)
    if query.sort_dir == "asc":
        stmt = stmt.order_by(asc(sort_col))
    else:
        stmt = stmt.order_by(desc(sort_col))
    
    # Paginate
    stmt = stmt.offset(query.page * query.page_size).limit(query.page_size)
    result = await db.execute(stmt)
    events = result.scalars().all()
    
    query_ms = round((time.time() - t0) * 1000)
    
    return ApiResponse(
        data=SearchResult(
            events=[EventOut.model_validate(e) for e in events],
            total=total,
            page=query.page,
            page_size=query.page_size,
            query_ms=query_ms,
        ).model_dump()
    )


@router.post("", response_model=ApiResponse)
async def create_event(event: EventCreate, db=Depends(get_db)):
    db_event = Event(**event.model_dump())
    db.add(db_event)
    await db.commit()
    await db.refresh(db_event)
    return ApiResponse(data=EventOut.model_validate(db_event).model_dump())
