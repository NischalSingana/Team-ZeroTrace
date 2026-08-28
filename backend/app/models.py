"""ULPF SQLAlchemy Models"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Source(Base):
    __tablename__ = "sources"
    
    id = Column(String, primary_key=True, default=lambda: f"src_{uuid.uuid4().hex[:8]}")
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(50), nullable=False)
    format = Column(String(50), nullable=False)
    transport = Column(String(50), nullable=False)
    status = Column(String(20), default="active")
    parser_id = Column(String(100), nullable=True)
    tags = Column(ARRAY(String), default=list)
    hostname = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)
    topic = Column(String(255), nullable=True)
    metrics = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    onboarded_by = Column(String(20), default="manual")


class Parser(Base):
    __tablename__ = "parsers"
    
    id = Column(String, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(50), nullable=False)
    format = Column(String(50), nullable=False)
    version = Column(String(20), default="1.0.0")
    author = Column(String(100), default="ULPF")
    patterns = Column(JSON, default=list)
    field_mappings = Column(JSON, default=list)
    confidence_threshold = Column(Float, default=0.85)
    test_samples = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    enabled = Column(Boolean, default=True)
    is_ai_generated = Column(Boolean, default=False)
    ai_model = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class Event(Base):
    __tablename__ = "events"
    
    id = Column(String, primary_key=True)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    ingested_at = Column(DateTime(timezone=True), default=utc_now)
    processed_at = Column(DateTime(timezone=True), default=utc_now)
    source_id = Column(String, nullable=False, index=True)
    source_name = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)
    action = Column(String(100), nullable=False)
    outcome = Column(String(20), default="unknown")
    actor = Column(JSON, default=dict)
    target = Column(JSON, default=dict)
    tags = Column(ARRAY(String), default=list)
    correlation_id = Column(String(100), nullable=True)
    session_id = Column(String(100), nullable=True)
    raw_ref = Column(String(500), nullable=True)
    raw_preview = Column(Text, nullable=True)
    raw_format = Column(String(50), nullable=False)
    parser_id = Column(String(100), nullable=True, index=True)
    parser_version = Column(String(20), nullable=True)
    parser_confidence = Column(Float, default=0.0)
    lineage = Column(JSON, default=list)
    ai_assistance = Column(JSON, nullable=True)
    downstream = Column(JSON, default=list)
    extra_fields = Column(JSON, default=dict)
    schema_coverage = Column(Float, default=0.0)


class RawEvent(Base):
    __tablename__ = "raw_events"
    
    id = Column(String, primary_key=True)
    event_id = Column(String, nullable=False, index=True)
    raw_data = Column(Text, nullable=False)
    storage_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class AnomalyAlert(Base):
    __tablename__ = "anomaly_alerts"
    
    id = Column(String, primary_key=True)
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    source_id = Column(String, nullable=True, index=True)
    source_name = Column(String(255), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    score = Column(Float, default=0.0)
    detected_at = Column(DateTime(timezone=True), default=utc_now)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="open")
    event_count = Column(Integer, default=0)
    sample_event_id = Column(String, nullable=True)
