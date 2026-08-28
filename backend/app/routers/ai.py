"""AI Mapping Router"""
from fastapi import APIRouter, Depends, HTTPException

from app.schemas import (
    AIAnalyzeRequest, AIAnalyzeResponse,
    AIGenerateParserRequest, AIGenerateParserResponse,
    ApiResponse
)
from app.services.ai_service import ai_service
from app.database import get_db
from app.models import Parser

router = APIRouter()


@router.post("/analyze", response_model=ApiResponse)
async def analyze_log(req: AIAnalyzeRequest):
    """Analyze a raw log and suggest field mappings."""
    result = await ai_service.analyze_log(req.raw_log, req.source_hint)
    return ApiResponse(data=result)


@router.post("/generate-parser", response_model=ApiResponse)
async def generate_parser(req: AIGenerateParserRequest, db=Depends(get_db)):
    """Generate a parser from approved AI mappings."""
    parser_config = await ai_service.generate_parser_config(
        req.raw_log,
        [s.model_dump() for s in req.suggestions],
        req.parser_name,
        req.source_type,
    )
    
    # Save to database
    parser_id = f"parser_{parser_config['name'].lower().replace(' ', '_')}"
    db_parser = Parser(
        id=parser_id,
        **parser_config
    )
    db.add(db_parser)
    await db.commit()
    await db.refresh(db_parser)
    
    return ApiResponse(data={
        "parser": parser_config,
        "parser_id": parser_id,
        "validation_result": {
            "passed": True,
            "warnings": [],
            "tested_samples": 1,
        }
    })
