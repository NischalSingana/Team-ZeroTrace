"""Sources Router"""
from sqlalchemy import select, func
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.models import Source
from app.schemas import SourceOut, SourceCreate, SourceUpdate, ApiResponse

router = APIRouter()


@router.get("", response_model=ApiResponse)
async def list_sources(db=Depends(get_db)):
    stmt = select(Source).order_by(Source.created_at.desc())
    result = await db.execute(stmt)
    sources = result.scalars().all()
    return ApiResponse(data=[SourceOut.model_validate(s).model_dump() for s in sources])


@router.get("/{source_id}", response_model=ApiResponse)
async def get_source(source_id: str, db=Depends(get_db)):
    stmt = select(Source).where(Source.id == source_id)
    result = await db.execute(stmt)
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return ApiResponse(data=SourceOut.model_validate(source).model_dump())


@router.post("", response_model=ApiResponse)
async def create_source(source: SourceCreate, db=Depends(get_db)):
    db_source = Source(**source.model_dump())
    db.add(db_source)
    await db.commit()
    await db.refresh(db_source)
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
