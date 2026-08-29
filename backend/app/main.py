"""ULPF FastAPI Application"""
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import Depends

from app.config import settings
from app.database import engine, Base
from app.routers import events, sources, parsers, pipeline, health, analytics, ai, demo, raw_events, auth
from app.services.auth_service import get_current_active_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    response.headers["X-Process-Time"] = str(round(process_time, 2))
    return response


# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}


# Include routers
app.include_router(events.router, prefix="/api/events", tags=["Events"], dependencies=[Depends(get_current_active_user)])
app.include_router(sources.router, prefix="/api/sources", tags=["Sources"], dependencies=[Depends(get_current_active_user)])
app.include_router(parsers.router, prefix="/api/parsers", tags=["Parsers"], dependencies=[Depends(get_current_active_user)])
app.include_router(pipeline.router, prefix="/api/pipeline", tags=["Pipeline"], dependencies=[Depends(get_current_active_user)])
app.include_router(health.router, prefix="/api/health", tags=["Health"]) # Unprotected for probes
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"], dependencies=[Depends(get_current_active_user)])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"], dependencies=[Depends(get_current_active_user)])
app.include_router(demo.router, prefix="/api/demo", tags=["Demo"], dependencies=[Depends(get_current_active_user)])
app.include_router(raw_events.router, prefix="/api/raw-events", tags=["Raw Events"], dependencies=[Depends(get_current_active_user)])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"]) # Unprotected for login/register
