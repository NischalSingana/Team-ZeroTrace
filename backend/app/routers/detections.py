"""Detections Router"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models import AnomalyAlert
from app.schemas import ApiResponse, AnomalyAlertOut

router = APIRouter()

@router.get("/queue")
async def detection_queue(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Fetch recent anomaly alerts."""
    stmt = (
        select(AnomalyAlert)
        .order_by(desc(AnomalyAlert.detected_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    alerts = result.scalars().all()
    
    return ApiResponse(
        data=[AnomalyAlertOut.model_validate(a).model_dump() for a in alerts]
    )
