"""Demo Router - Seed data for SIH demonstration"""
import uuid
import random
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.database import get_db
from app.models import Source, Parser, Event, AnomalyAlert, User
from app.services.parser_engine import parse_log
from app.services.auth_service import get_password_hash

router = APIRouter()


SAMPLE_LOGS = {
    "syslog_rfc3164": '<134>Aug 27 17:14:32 firewall01 src=10.0.0.5 dst=8.8.8.8 action=DENY',
    "syslog_rfc5424": '<134>1 2026-08-27T17:14:32.000Z firewall01 %ASA - - - src=10.0.0.5 dst=8.8.8.8 action=DENY',
    "json": '{"src_ip": "10.0.0.10", "dst_ip": "192.168.1.10", "action": "ALLOW", "timestamp": "2026-08-27T17:14:32Z"}',
    "cef": 'CEF:0|Vendor|Product|1.0|100|Login|5|src=10.0.0.1 dst=10.0.0.2 spt=12345 dpt=443 act=ALLOW',
    "leef": 'LEEF:1.0|IBM|QRadar|7.3|CustomEvent|src=10.0.0.1 dst=10.0.0.2',
    "csv": 'timestamp,src_ip,dst_ip,action\n2026-08-27T17:14:32Z,10.0.0.1,192.168.1.1,ALLOW',
    "xml": '<Event><System><EventID>4624</EventID></System><EventData><Data Name="TargetUserName">admin</Data></EventData></Event>',
    "grok_custom": 'USER=admin SRC=10.0.0.1 ACTION=LOGIN STATUS=FAILED',
}


def _make_event_id():
    return f"evt_{uuid.uuid4().hex[:8]}"


def _make_source_id(idx: int):
    return f"src_{idx:03d}"


def _random_timestamp():
    return datetime.now(timezone.utc) - timedelta(seconds=random.randint(0, 86400))


def _random_ip():
    return f"{random.randint(1, 223)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"


async def _seed_sources(db):
    sources_data = [
        {"id": "src_001", "name": "Cisco ASA Firewall — DC-EDGE-01", "type": "network_device", "format": "syslog_rfc5424", "transport": "syslog_tcp", "parser_id": "parser_cisco_asa", "status": "active"},
        {"id": "src_002", "name": "Nginx Web Gateway — PROD", "type": "web_server", "format": "combined", "transport": "kafka", "parser_id": "parser_nginx_combined", "status": "active"},
        {"id": "src_003", "name": "Windows Event Log — DC01", "type": "endpoint", "format": "windows_evtx", "transport": "agent", "parser_id": "parser_winevtx", "status": "active"},
        {"id": "src_004", "name": "Palo Alto NGFW — BRANCH-02", "type": "network_device", "format": "cef", "transport": "syslog_udp", "parser_id": "parser_cef_generic", "status": "active"},
        {"id": "src_005", "name": "AWS CloudTrail — Production Account", "type": "cloud", "format": "json", "transport": "s3", "parser_id": "parser_aws_cloudtrail", "status": "active"},
        {"id": "src_006", "name": "Apache HTTP Server — LEGACY-APP", "type": "web_server", "format": "clf", "transport": "file", "parser_id": "parser_apache_clf", "status": "degraded"},
        {"id": "src_007", "name": "Kubernetes Audit Log — PROD-CLUSTER-01", "type": "container", "format": "json_lines", "transport": "kafka", "parser_id": "parser_k8s_audit", "status": "active"},
        {"id": "src_008", "name": "PostgreSQL Audit — PROD-DB-01", "type": "database", "format": "syslog_rfc3164", "transport": "syslog_tcp", "parser_id": "parser_postgres_log", "status": "active"},
        {"id": "src_009", "name": "Snort IDS — PERIMETER", "type": "security_tool", "format": "syslog_rfc5424", "transport": "syslog_udp", "parser_id": "parser_snort", "status": "active"},
        {"id": "src_010", "name": "Custom App — Payments Service", "type": "application", "format": "json", "transport": "kafka", "parser_id": "parser_json_generic", "status": "active"},
        {"id": "src_011", "name": "Fortinet FortiGate — BRANCH-03", "type": "network_device", "format": "leef", "transport": "syslog_tcp", "parser_id": "parser_leef_generic", "status": "error"},
        {"id": "src_012", "name": "Splunk Universal Forwarder — SERVER-FARM", "type": "custom", "format": "syslog_rfc3164", "transport": "agent", "parser_id": "parser_syslog_generic", "status": "active"},
    ]
    
    for s in sources_data:
        existing = await db.execute(select(Source).where(Source.id == s["id"]))
        if existing.scalar_one_or_none():
            continue
        db_source = Source(
            **s,
            description=f"Demo source: {s['name']}",
            tags=[],
            metrics={
                "events_per_min": random.randint(100, 20000),
                "events_per_min_delta": round(random.uniform(-20, 40), 1),
                "bytes_per_min": random.randint(10000, 10000000),
                "parse_success_rate": round(random.uniform(0.89, 0.999), 4),
                "error_rate": round(random.uniform(0.0001, 0.11), 4),
                "last_event_at": datetime.now(timezone.utc).isoformat(),
                "lag_seconds": round(random.uniform(0.2, 5.0), 1),
            },
            created_at=datetime(2025, 1, 15, 9, 0, 0, tzinfo=timezone.utc),
            updated_at=datetime.now(timezone.utc),
            onboarded_by=random.choice(["manual", "auto_detect", "ai_assisted"]),
        )
        db.add(db_source)
    await db.commit()


async def _seed_parsers(db):
    parsers_data = [
        {"id": "parser_cisco_asa", "name": "Cisco ASA Syslog Parser", "type": "grok", "format": "syslog_rfc5424", "version": "1.4.2", "field_mappings": [{"source_field": "src_ip", "target_field": "actor.ip", "required": True}, {"source_field": "dst_ip", "target_field": "target.ip", "required": True}]},
        {"id": "parser_nginx_combined", "name": "Nginx Combined Log Format Parser", "type": "regex", "format": "combined", "version": "1.1.0", "field_mappings": [{"source_field": "client_ip", "target_field": "actor.ip", "required": True}]},
        {"id": "parser_winevtx", "name": "Windows Event XML Parser", "type": "python", "format": "windows_evtx", "version": "3.0.1", "field_mappings": [{"source_field": "EventID", "target_field": "extra_fields.event_id", "required": True, "transform": "parse_int"}]},
        {"id": "parser_cef_generic", "name": "CEF Generic Parser", "type": "regex", "format": "cef", "version": "1.0.3", "field_mappings": [{"source_field": "src", "target_field": "actor.ip", "required": False}]},
        {"id": "parser_aws_cloudtrail", "name": "AWS CloudTrail JSON Parser", "type": "json", "format": "json", "version": "2.0.0", "is_ai_generated": True, "ai_model": "nvidia/nemotron-3-ultra-550b-a55b:free", "field_mappings": [{"source_field": "eventName", "target_field": "action", "required": True}]},
        {"id": "parser_k8s_audit", "name": "Kubernetes Audit Log Parser", "type": "json", "format": "json_lines", "version": "1.3.0", "field_mappings": [{"source_field": "verb", "target_field": "action", "required": True}]},
        {"id": "parser_json_generic", "name": "Generic JSON Parser", "type": "ai_generated", "format": "json", "version": "1.0.0", "is_ai_generated": True, "ai_model": "nvidia/nemotron-3-ultra-550b-a55b:free", "field_mappings": [{"source_field": "user_id", "target_field": "actor.user", "required": False}]},
        {"id": "parser_postgres_log", "name": "PostgreSQL Log Parser", "type": "regex", "format": "syslog_rfc3164", "version": "1.2.0", "field_mappings": [{"source_field": "pid", "target_field": "extra_fields.pg_pid", "required": False, "transform": "parse_int"}]},
        {"id": "parser_snort", "name": "Snort IDS Alert Parser", "type": "grok", "format": "syslog_rfc5424", "version": "2.1.0", "field_mappings": [{"source_field": "src_ip", "target_field": "actor.ip", "required": True}]},
        {"id": "parser_apache_clf", "name": "Apache CLF Parser", "type": "regex", "format": "clf", "version": "0.9.1", "field_mappings": [{"source_field": "host", "target_field": "actor.ip", "required": True}]},
        {"id": "parser_syslog_generic", "name": "Generic Syslog Parser (RFC 3164)", "type": "grok", "format": "syslog_rfc3164", "version": "1.0.0", "field_mappings": [{"source_field": "message", "target_field": "extra_fields.message", "required": True}]},
        {"id": "parser_leef_generic", "name": "LEEF Generic Parser", "type": "regex", "format": "leef", "version": "1.0.0", "field_mappings": [{"source_field": "src", "target_field": "actor.ip", "required": False}]},
    ]
    
    for p in parsers_data:
        existing = await db.execute(select(Parser).where(Parser.id == p["id"]))
        if existing.scalar_one_or_none():
            continue
        db_parser = Parser(
            **p,
            description=f"Parser for {p['format']} format",
            patterns=[],
            confidence_threshold=0.85,
            test_samples=random.randint(1000, 50000),
            accuracy=round(random.uniform(0.88, 0.999), 4),
            enabled=True,
            created_at=datetime(2024, 10, 1, 10, 0, 0, tzinfo=timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(db_parser)
    await db.commit()


async def _seed_events(db, count: int = 100):
    severities = ["critical", "high", "medium", "low", "info", "info", "info", "low", "medium"]
    categories = ["authentication", "http", "network_connection", "audit", "system", "authorization", "threat_detection", "network_denial"]
    actions = ["LOGON", "REQUEST", "CONNECT", "UPDATE", "DELETE", "QUERY", "DENY", "ALLOW", "THREAT_BLOCKED"]
    outcomes = ["success", "success", "success", "failure", "success"]
    sources = ["src_001", "src_002", "src_003", "src_004", "src_005", "src_007", "src_008", "src_009", "src_010"]
    parsers = ["parser_cisco_asa", "parser_nginx_combined", "parser_winevtx", "parser_cef_generic", "parser_aws_cloudtrail", "parser_k8s_audit", "parser_postgres_log", "parser_snort", "parser_json_generic"]
    
    for i in range(count):
        event_id = _make_event_id()
        ts = _random_timestamp()
        src = random.choice(sources)
        parser = random.choice(parsers)
        severity = random.choice(severities)
        category = random.choice(categories)
        action = random.choice(actions)
        outcome = random.choice(outcomes)
        
        raw_preview = f"Sample log event {i} from {src} — action={action} outcome={outcome}"
        
        event = Event(
            id=event_id,
            timestamp=ts,
            ingested_at=ts + timedelta(milliseconds=random.randint(10, 100)),
            processed_at=ts + timedelta(milliseconds=random.randint(50, 500)),
            source_id=src,
            source_name=f"Source {src}",
            source_type=random.choice(["network_device", "web_server", "endpoint", "cloud", "security_tool", "application"]),
            severity=severity,
            category=category,
            action=action,
            outcome=outcome,
            actor={"ip": _random_ip(), "user": f"user_{random.randint(1, 100)}" if random.random() > 0.5 else None},
            target={"ip": _random_ip(), "port": random.choice([80, 443, 22, 3306, 5432])},
            tags=[category, action.lower(), outcome],
            raw_ref=f"raw/2026/08/27/{src}/{event_id}.raw",
            raw_preview=raw_preview,
            raw_format=random.choice(["syslog_rfc5424", "json", "cef", "syslog_rfc3164"]),
            parser_id=parser,
            parser_version="1.0.0",
            parser_confidence=round(random.uniform(0.92, 0.999), 4),
            lineage=[
                {"stage": "ingest", "status": "success", "duration_ms": 0.8, "detail": "Event received", "timestamp": ts.isoformat()},
                {"stage": "format_detection", "status": "success", "duration_ms": 1.2, "detail": f"Format detected", "timestamp": (ts + timedelta(milliseconds=10)).isoformat()},
                {"stage": "parser_match", "status": "success", "duration_ms": 0.5, "detail": f"Parser: {parser}", "timestamp": (ts + timedelta(milliseconds=20)).isoformat()},
                {"stage": "field_extraction", "status": "success", "duration_ms": 2.3, "detail": "Extracted fields", "timestamp": (ts + timedelta(milliseconds=30)).isoformat()},
                {"stage": "normalization", "status": "success", "duration_ms": 1.8, "detail": "Normalized", "timestamp": (ts + timedelta(milliseconds=50)).isoformat()},
                {"stage": "schema_validation", "status": "success", "duration_ms": 0.6, "detail": "Validated", "timestamp": (ts + timedelta(milliseconds=60)).isoformat()},
                {"stage": "storage", "status": "success", "duration_ms": 4.1, "detail": "Stored", "timestamp": (ts + timedelta(milliseconds=100)).isoformat()},
            ],
            downstream=[
                {"system": "opensearch", "reference": f"ulpf-events/{event_id}", "delivered_at": (ts + timedelta(milliseconds=150)).isoformat()},
            ],
            extra_fields={},
            schema_coverage=round(random.uniform(0.80, 0.96), 2),
        )
        db.add(event)
    
    await db.commit()


@router.post("/seed")
async def seed_demo_data(count: int = 100, db=Depends(get_db)):
    """Seed the database with demo data for SIH presentation."""
    # Seed default admin user
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
    await _seed_events(db, count)
    
    return {
        "success": True,
        "message": f"Seeded demo data: sources, parsers, and {count} events.",
        "seeded": {
            "sources": 12,
            "parsers": 12,
            "events": count,
        }
    }
