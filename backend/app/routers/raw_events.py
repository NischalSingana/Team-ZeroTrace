"""Raw Events Router"""
from sqlalchemy import select
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.models import RawEvent
from app.schemas import RawEventOut, RawEventCreate, ApiResponse

router = APIRouter()


@router.get("/{event_id}", response_model=ApiResponse)
async def get_raw_event(event_id: str, db=Depends(get_db)):
    stmt = select(RawEvent).where(RawEvent.event_id == event_id)
    result = await db.execute(stmt)
    raw = result.scalar_one_or_none()
    if not raw:
        raise HTTPException(status_code=404, detail="Raw event not found")
    return ApiResponse(data=RawEventOut.model_validate(raw).model_dump())


@router.post("", response_model=ApiResponse)
async def create_raw_event(raw: RawEventCreate, db=Depends(get_db)):
    db_raw = RawEvent(**raw.model_dump())
    db.add(db_raw)
    await db.commit()
    await db.refresh(db_raw)
    return ApiResponse(data=RawEventOut.model_validate(db_raw).model_dump())
