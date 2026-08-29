"""ULPF FastAPI Application"""
import time
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import Depends

from app.config import settings
from app.database import engine, Base, get_db
from app.routers import events, sources, parsers, pipeline, health, analytics, ai, demo, raw_events, auth, detections
from app.services.auth_service import get_current_active_user


async def _auto_seed():
    """Run demo seed in background after startup."""
    await asyncio.sleep(3)  # Wait for DB to fully settle
    try:
        from app.routers.demo import _seed_sources, _seed_parsers, _seed_events
        from app.services.auth_service import get_password_hash
        from app.models import User
        from sqlalchemy.future import select
        async for db in get_db():
            result = await db.execute(select(User).where(User.username == "admin"))
            if not result.scalar_one_or_none():
                db.add(User(
                    username="admin",
                    email="admin@ulpf.local",
                    hashed_password=get_password_hash("admin"),
                    is_active=True,
                    is_superuser=True
                ))
                await db.commit()
            await _seed_sources(db)
            await _seed_parsers(db)
            await _seed_events(db, 100)
            break
        print("[ULPF] Auto-seed completed successfully.")
    except Exception as e:
        print(f"[ULPF] Auto-seed warning: {e}")

async def _setup_db():
    """Ensure essential objects (admin, sources, parsers) exist on startup."""
    try:
        from app.routers.demo import _seed_sources, _seed_parsers
        from app.services.auth_service import get_password_hash
        from app.models import User
        from sqlalchemy.future import select
        async for db in get_db():
            result = await db.execute(select(User).where(User.username == "admin"))
            if not result.scalar_one_or_none():
                db.add(User(
                    username="admin",
                    email="admin@ulpf.local",
                    hashed_password=get_password_hash("admin"),
                    is_active=True,
                    is_superuser=True
                ))
                await db.commit()
            await _seed_sources(db)
            await _seed_parsers(db)
            break
        print("[ULPF] Database setup completed successfully.")
    except Exception as e:
        print(f"[ULPF] Database setup warning: {e}")



from app.services.stream_service import background_writer, background_ingester

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables first
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    await _setup_db()
    
    # Fire-and-forget background stream tasks (non-blocking)
    asyncio.create_task(background_writer())
    asyncio.create_task(background_ingester())
    
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
app.include_router(detections.router, prefix="/api/detections", tags=["Detections"], dependencies=[Depends(get_current_active_user)])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"], dependencies=[Depends(get_current_active_user)])
app.include_router(demo.router, prefix="/api/demo", tags=["Demo"], dependencies=[Depends(get_current_active_user)])
app.include_router(raw_events.router, prefix="/api/raw-events", tags=["Raw Events"], dependencies=[Depends(get_current_active_user)])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"]) # Unprotected for login/register
