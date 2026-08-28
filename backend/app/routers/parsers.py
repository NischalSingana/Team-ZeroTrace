"""Parsers Router"""
from sqlalchemy import select
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.models import Parser
from app.schemas import ParserOut, ParserCreate, ApiResponse

router = APIRouter()


@router.get("", response_model=ApiResponse)
async def list_parsers(db=Depends(get_db)):
    stmt = select(Parser).order_by(Parser.created_at.desc())
    result = await db.execute(stmt)
    parsers = result.scalars().all()
    return ApiResponse(data=[ParserOut.model_validate(p).model_dump() for p in parsers])


@router.get("/{parser_id}", response_model=ApiResponse)
async def get_parser(parser_id: str, db=Depends(get_db)):
    stmt = select(Parser).where(Parser.id == parser_id)
    result = await db.execute(stmt)
    parser = result.scalar_one_or_none()
    if not parser:
        raise HTTPException(status_code=404, detail="Parser not found")
    return ApiResponse(data=ParserOut.model_validate(parser).model_dump())


@router.post("", response_model=ApiResponse)
async def create_parser(parser: ParserCreate, db=Depends(get_db)):
    db_parser = Parser(**parser.model_dump())
    db.add(db_parser)
    await db.commit()
    await db.refresh(db_parser)
    return ApiResponse(data=ParserOut.model_validate(db_parser).model_dump())


@router.patch("/{parser_id}", response_model=ApiResponse)
async def update_parser(parser_id: str, update: ParserCreate, db=Depends(get_db)):
    stmt = select(Parser).where(Parser.id == parser_id)
    result = await db.execute(stmt)
    parser = result.scalar_one_or_none()
    if not parser:
        raise HTTPException(status_code=404, detail="Parser not found")
    
    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(parser, key, value)
    
    await db.commit()
    await db.refresh(parser)
    return ApiResponse(data=ParserOut.model_validate(parser).model_dump())


@router.delete("/{parser_id}", response_model=ApiResponse)
async def delete_parser(parser_id: str, db=Depends(get_db)):
    stmt = select(Parser).where(Parser.id == parser_id)
    result = await db.execute(stmt)
    parser = result.scalar_one_or_none()
    if not parser:
        raise HTTPException(status_code=404, detail="Parser not found")
    await db.delete(parser)
    await db.commit()
    return ApiResponse(data={"deleted": True})
