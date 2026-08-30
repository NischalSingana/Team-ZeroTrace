"""ULPF Pydantic Schemas"""
from datetime import datetime, timezone
from typing import Optional, Literal, Any
from pydantic import BaseModel, Field


# ── Base Response ──────────────────────────────────────────────

class ApiResponse(BaseModel):
    data: Any
    success: bool = True
    error: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class PaginatedResponse(BaseModel):
    data: list[Any]
    total: int
    page: int
    page_size: int
    has_more: bool
    query_ms: int
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ── Source Schemas ─────────────────────────────────────────────

class SourceMetrics(BaseModel):
    events_per_min: int = 0
    events_per_min_delta: float = 0.0
    bytes_per_min: int = 0
    parse_success_rate: float = 0.0
    error_rate: float = 0.0
    last_event_at: Optional[str] = None
    lag_seconds: float = 0.0


class SourceBase(BaseModel):
    name: str
    description: Optional[str] = ""
    type: str
    format: str
    transport: str
    status: str = "active"
    parser_id: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    hostname: Optional[str] = None
    ip_address: Optional[str] = None
    topic: Optional[str] = None
    onboarded_by: str = "manual"


class SourceCreate(SourceBase):
    pass


class SourceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    parser_id: Optional[str] = None
    tags: Optional[list[str]] = None


class SourceOut(SourceBase):
    id: str
    metrics: SourceMetrics = Field(default_factory=SourceMetrics)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Parser Schemas ─────────────────────────────────────────────

class ParserPattern(BaseModel):
    id: str
    name: str
    pattern: str
    flags: Optional[str] = None
    description: Optional[str] = None


class ParserField(BaseModel):
    source_field: str
    target_field: str
    transform: Optional[str] = None
    required: bool = False
    example_value: Optional[str] = None


class ParserBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    type: str
    format: str
    version: str = "1.0.0"
    author: str = "ULPF"
    patterns: list[ParserPattern] = Field(default_factory=list)
    field_mappings: list[ParserField] = Field(default_factory=list)
    confidence_threshold: float = 0.85
    test_samples: int = 0
    accuracy: float = 0.0
    enabled: bool = True
    is_ai_generated: bool = False
    ai_model: Optional[str] = None


class ParserCreate(ParserBase):
    pass


class ParserOut(ParserBase):
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Event Schemas ──────────────────────────────────────────────

class NormalizedActor(BaseModel):
    user: Optional[str] = None
    process: Optional[str] = None
    ip: Optional[str] = None
    hostname: Optional[str] = None
    domain: Optional[str] = None
    uid: Optional[str] = None
    gid: Optional[str] = None


class NormalizedTarget(BaseModel):
    resource: Optional[str] = None
    ip: Optional[str] = None
    port: Optional[int] = None
    hostname: Optional[str] = None
    path: Optional[str] = None
    url: Optional[str] = None
    protocol: Optional[str] = None


class LineageStep(BaseModel):
    stage: str
    status: str
    duration_ms: float
    detail: str
    timestamp: str
    warnings: Optional[list[str]] = None


class AIAssistance(BaseModel):
    model: str
    confidence: float
    prompt_category: str
    human_reviewed: bool
    reviewed_at: Optional[str] = None


class DownstreamRef(BaseModel):
    system: str
    reference: str
    delivered_at: str


class EventBase(BaseModel):
    timestamp: datetime
    source_id: str
    source_name: str
    source_type: str
    severity: str
    category: str
    action: str
    outcome: str = "unknown"
    actor: NormalizedActor = Field(default_factory=NormalizedActor)
    target: NormalizedTarget = Field(default_factory=NormalizedTarget)
    tags: list[str] = Field(default_factory=list)
    raw_format: str
    parser_id: Optional[str] = None
    parser_version: Optional[str] = None
    parser_confidence: float = 0.0
    extra_fields: dict = Field(default_factory=dict)
    schema_coverage: float = 0.0


class EventCreate(EventBase):
    id: Optional[str] = None
    ingested_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    raw_ref: Optional[str] = None
    raw_preview: Optional[str] = None
    lineage: list[LineageStep] = Field(default_factory=list)
    ai_assistance: Optional[AIAssistance] = None
    downstream: list[DownstreamRef] = Field(default_factory=list)


class EventOut(EventCreate):
    id: str  # type: ignore

    class Config:
        from_attributes = True


# ── Search Schemas ─────────────────────────────────────────────

class SearchFilter(BaseModel):
    field: str
    operator: Literal["eq", "neq", "contains", "starts_with", "gt", "lt", "in"]
    value: Any


class SearchQuery(BaseModel):
    text: Optional[str] = None
    filters: list[SearchFilter] = Field(default_factory=list)
    time_range: str = "24h"
    severity: Optional[list[str]] = None
    source_ids: Optional[list[str]] = None
    categories: Optional[list[str]] = None
    parser_ids: Optional[list[str]] = None
    page: int = 0
    page_size: int = 50
    sort_by: str = "timestamp"
    sort_dir: Literal["asc", "desc"] = "desc"


class SearchResult(BaseModel):
    events: list[EventOut]
    total: int
    page: int
    page_size: int
    query_ms: int


# ── Pipeline Schemas ───────────────────────────────────────────

class PipelineStageMetrics(BaseModel):
    stage: str
    label: str
    events_per_sec: int
    avg_latency_ms: float
    p95_latency_ms: float
    error_rate: float
    queue_depth: int
    active_workers: int
    status: str


class PipelineMetrics(BaseModel):
    total_events_per_sec: int
    total_events_today: int
    parse_success_rate: float
    normalization_coverage: float
    enrichment_rate: float
    error_rate: float
    kafka_consumer_lag: int
    stages: list[PipelineStageMetrics]
    last_updated: str


# ── Health Schemas ─────────────────────────────────────────────

class SystemMetric(BaseModel):
    name: str
    label: str
    value: float
    unit: str
    threshold_warn: float
    threshold_crit: float
    status: str
    trend: str
    history: list[float]


class SystemService(BaseModel):
    name: str
    status: str
    latency_ms: float
    last_checked: str


class SystemHealth(BaseModel):
    overall_status: str
    metrics: list[SystemMetric]
    services: list[SystemService]
    last_updated: str


# ── Anomaly Schemas ────────────────────────────────────────────

class AnomalyAlertOut(BaseModel):
    id: str
    alert_type: str
    severity: str
    source_id: Optional[str] = None
    source_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    score: float
    detected_at: datetime
    resolved_at: Optional[datetime] = None
    status: str
    event_count: int
    sample_event_id: Optional[str] = None

    class Config:
        from_attributes = True


# ── AI Mapping Schemas ─────────────────────────────────────────

class AIMappingSuggestion(BaseModel):
    source_field: str
    target_field: str
    confidence: float
    evidence: str
    status: Literal["pending", "approved", "rejected"] = "pending"


class AIAnalyzeRequest(BaseModel):
    raw_log: str
    source_hint: Optional[str] = None


class AIAnalyzeResponse(BaseModel):
    detected_format: str
    format_confidence: float
    suggestions: list[AIMappingSuggestion]


class AIGenerateParserRequest(BaseModel):
    raw_log: str
    suggestions: list[AIMappingSuggestion]
    parser_name: str
    source_type: Optional[str] = None


class AIGenerateParserResponse(BaseModel):
    parser: ParserOut
    validation_result: dict


# ── Analytics Schemas ──────────────────────────────────────────

class TimeSeriesPoint(BaseModel):
    timestamp: str
    value: float


class EventVolumePoint(BaseModel):
    time: str
    value: int = 0
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0
    unknown: int = 0


class ThroughputPoint(BaseModel):
    time: str
    ingested: int
    processed: int
    output: int


class SeverityBreakdown(BaseModel):
    critical: int
    high: int
    medium: int
    low: int
    info: int
    unknown: int


class SourceTopEntry(BaseModel):
    source_id: str
    source_name: str
    source_type: str
    event_count: int
    percentage: float
    trend: str


class ProcessingError(BaseModel):
    id: str
    timestamp: str
    source_id: str
    parser_id: Optional[str] = None
    stage: str
    error: str
    raw_preview: str


# ── Raw Event Schemas ──────────────────────────────────────────

class RawEventCreate(BaseModel):
    event_id: str
    raw_data: str
    storage_path: Optional[str] = None


class RawEventOut(BaseModel):
    id: str
    event_id: str
    raw_data: str
    storage_path: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


# ── Auth & User Schemas ────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserBase(BaseModel):
    username: str
    email: str
    is_active: bool = True
    is_superuser: bool = False


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: str
    created_at: str

    class Config:
        from_attributes = True
