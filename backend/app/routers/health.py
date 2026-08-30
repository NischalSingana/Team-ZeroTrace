"""Health Router"""
import time
import random
from fastapi import APIRouter, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import AnomalyAlert
from app.schemas import SystemHealth, SystemMetric, SystemService, AnomalyAlertOut, ApiResponse
from app.config import settings

router = APIRouter()


def _generate_health() -> SystemHealth:
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    metrics = [
        SystemMetric(
            name="kafka_consumer_lag",
            label="Kafka Consumer Lag",
            value=random.randint(2000, 3500),
            unit="msgs",
            threshold_warn=5000,
            threshold_crit=20000,
            status="healthy",
            trend="stable",
            history=[random.randint(1500, 3000) for _ in range(8)],
        ),
        SystemMetric(
            name="db_pool_utilization",
            label="DB Connection Pool",
            value=random.randint(60, 80),
            unit="%",
            threshold_warn=80,
            threshold_crit=95,
            status="healthy",
            trend="stable",
            history=[random.randint(55, 78) for _ in range(8)],
        ),
        SystemMetric(
            name="parse_queue_depth",
            label="Parse Queue Depth",
            value=random.randint(1500, 2200),
            unit="events",
            threshold_warn=10000,
            threshold_crit=50000,
            status="healthy",
            trend="up",
            history=[random.randint(1200, 2000) for _ in range(8)],
        ),
        SystemMetric(
            name="enrichment_service_latency",
            label="Enrichment Latency (p95)",
            value=round(random.uniform(10.0, 15.0), 1),
            unit="ms",
            threshold_warn=10,
            threshold_crit=50,
            status="warning",
            trend="up",
            history=[round(random.uniform(6.0, 13.0), 1) for _ in range(8)],
        ),
        SystemMetric(
            name="cpu_usage",
            label="Parser CPU Usage",
            value=random.randint(50, 70),
            unit="%",
            threshold_warn=80,
            threshold_crit=95,
            status="healthy",
            trend="stable",
            history=[random.randint(45, 68) for _ in range(8)],
        ),
    ]
    
    services = [
        SystemService(name="Kafka Broker", status="up", latency_ms=round(random.uniform(1.5, 3.0), 1), last_checked=now),
        SystemService(name="PostgreSQL", status="up", latency_ms=round(random.uniform(0.5, 1.5), 1), last_checked=now),
        SystemService(name="OpenSearch", status="up", latency_ms=round(random.uniform(2.5, 5.0), 1), last_checked=now),
        SystemService(name="MinIO", status="up", latency_ms=round(random.uniform(0.8, 2.0), 1), last_checked=now),
        SystemService(name="Redis Cache", status="up", latency_ms=round(random.uniform(0.2, 0.6), 1), last_checked=now),
        SystemService(name="Enrichment Service", status=random.choice(["up", "degraded"]), latency_ms=round(random.uniform(10.0, 15.0), 1), last_checked=now),
        SystemService(name="AI Provider", status="up" if settings.AI_ENABLED else "down", latency_ms=round(random.uniform(120, 200), 1), last_checked=now),
        SystemService(name="Schema Validator", status="up", latency_ms=round(random.uniform(0.5, 1.2), 1), last_checked=now),
    ]
    
    overall = "healthy"
    if any(s.status == "down" for s in services):
        overall = "critical"
    elif any(s.status == "degraded" for s in services):
        overall = "degraded"
    elif any(m.status == "warning" for m in metrics):
        overall = "degraded"
    
    return SystemHealth(
        overall_status=overall,
        metrics=metrics,
        services=services,
        last_updated=now,
    )


async def _generate_anomalies(db: AsyncSession) -> list[AnomalyAlertOut]:
    """Return real anomaly alerts from the database."""
    stmt = (
        select(AnomalyAlert)
        .order_by(desc(AnomalyAlert.detected_at))
        .limit(50)
    )
    result = await db.execute(stmt)
    alerts = result.scalars().all()
    return [AnomalyAlertOut.model_validate(a) for a in alerts]


@router.get("/system", response_model=ApiResponse)
async def get_system_health():
    return ApiResponse(data=_generate_health().model_dump())


@router.get("/anomalies", response_model=ApiResponse)
async def get_anomalies(db: AsyncSession = Depends(get_db)):
    alerts = await _generate_anomalies(db)
    return ApiResponse(data=[a.model_dump() for a in alerts])
