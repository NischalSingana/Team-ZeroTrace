import asyncio
import json
import os
import random
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

from app.database import AsyncSessionLocal
from app.models import Event, AnomalyAlert
from sqlalchemy import delete

# State tracking
class StreamState:
    def __init__(self):
        self.is_streaming: bool = True
        self.file_path: str = "data/stream.log"
        self.offset: int = 0
        os.makedirs("data", exist_ok=True)
        # Ensure file exists
        if not os.path.exists(self.file_path):
            with open(self.file_path, 'a') as f:
                pass

stream_state = StreamState()

def _make_event_id():
    return f"evt_{uuid.uuid4().hex[:8]}"

def _random_ip():
    return f"{random.randint(1, 223)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"

def generate_log_line() -> Dict[str, Any]:
    severities = ["critical", "high", "medium", "low", "info", "info", "info", "low", "medium"]
    categories = ["authentication", "http", "network_connection", "audit", "system", "authorization", "threat_detection", "network_denial"]
    actions = ["LOGON", "REQUEST", "CONNECT", "UPDATE", "DELETE", "QUERY", "DENY", "ALLOW", "THREAT_BLOCKED"]
    outcomes = ["success", "success", "success", "failure", "success"]
    sources = ["src_001", "src_002", "src_003", "src_004", "src_005", "src_007", "src_008", "src_009", "src_010"]
    parsers = ["parser_cisco_asa", "parser_nginx_combined", "parser_winevtx", "parser_cef_generic", "parser_aws_cloudtrail", "parser_k8s_audit", "parser_postgres_log", "parser_snort", "parser_json_generic"]
    
    ts = datetime.now(timezone.utc)
    src = random.choice(sources)
    parser = random.choice(parsers)
    severity = random.choice(severities)
    category = random.choice(categories)
    action = random.choice(actions)
    outcome = random.choice(outcomes)
    event_id = _make_event_id()
    
    return {
        "id": event_id,
        "timestamp": ts.isoformat(),
        "ingested_at": (ts + timedelta(milliseconds=random.randint(10, 100))).isoformat(),
        "processed_at": (ts + timedelta(milliseconds=random.randint(50, 500))).isoformat(),
        "source_id": src,
        "source_name": f"Source {src}",
        "source_type": random.choice(["network_device", "web_server", "endpoint", "cloud", "security_tool", "application"]),
        "severity": severity,
        "category": category,
        "action": action,
        "outcome": outcome,
        "actor": {"ip": _random_ip(), "user": f"user_{random.randint(1, 100)}" if random.random() > 0.5 else None},
        "target": {"ip": _random_ip(), "port": random.choice([80, 443, 22, 3306, 5432])},
        "tags": [category, action.lower(), outcome],
        "raw_ref": f"raw/{ts.year}/{ts.month:02d}/{ts.day:02d}/{src}/{event_id}.raw",
        "raw_preview": f"Sample log event from {src} — action={action} outcome={outcome}",
        "raw_format": random.choice(["syslog_rfc5424", "json", "cef", "syslog_rfc3164"]),
        "parser_id": parser,
        "parser_version": "1.0.0",
        "parser_confidence": round(random.uniform(0.92, 0.999), 4),
        "schema_coverage": round(random.uniform(0.80, 0.96), 2),
    }

async def background_writer():
    """Continuously writes new log lines to the stream.log file."""
    while True:
        try:
            log_entry = generate_log_line()
            with open(stream_state.file_path, "a") as f:
                f.write(json.dumps(log_entry) + "\n")
        except Exception as e:
            print(f"[Writer] Error writing log: {e}")
        await asyncio.sleep(random.uniform(0.5, 2.0))

async def process_log_line(line: str):
    """Parses a log line and inserts it into the database as an Event."""
    try:
        data = json.loads(line)
        # Parse datetime fields
        for field in ["timestamp", "ingested_at", "processed_at"]:
            if field in data and data[field]:
                data[field] = datetime.fromisoformat(data[field])
        
        async with AsyncSessionLocal() as session:
            db_event = Event(
                id=data["id"],
                timestamp=data["timestamp"],
                ingested_at=data["ingested_at"],
                processed_at=data["processed_at"],
                source_id=data["source_id"],
                source_name=data["source_name"],
                source_type=data["source_type"],
                severity=data["severity"],
                category=data["category"],
                action=data["action"],
                outcome=data["outcome"],
                actor=data["actor"],
                target=data["target"],
                tags=data["tags"],
                raw_ref=data["raw_ref"],
                raw_preview=data["raw_preview"],
                raw_format=data["raw_format"],
                parser_id=data["parser_id"],
                parser_version=data["parser_version"],
                parser_confidence=data["parser_confidence"],
                schema_coverage=data["schema_coverage"],
                lineage=[
                    {"stage": "ingest", "status": "success", "duration_ms": 0.8, "detail": "Event received", "timestamp": data["timestamp"].isoformat()},
                    {"stage": "storage", "status": "success", "duration_ms": 4.1, "detail": "Stored", "timestamp": data["processed_at"].isoformat()},
                ],
                downstream=[],
                extra_fields={}
            )
            session.add(db_event)
            
            # Generate occasional AnomalyAlert for high/critical events to populate Detections
            if data["severity"] in ["high", "critical"] and random.random() < 0.05:
                alert = AnomalyAlert(
                    id=f"alert_{uuid.uuid4().hex[:8]}",
                    alert_type="ml_outlier" if random.random() > 0.5 else "rule_trigger",
                    severity=data["severity"],
                    source_id=data["source_id"],
                    source_name=data["source_name"],
                    title=f"Suspicious activity on {data['source_name']}",
                    description=f"Automated detection triggered by event: {data['action']}",
                    score=round(random.uniform(70.0, 99.0), 1),
                    event_count=random.randint(5, 50),
                    sample_event_id=db_event.id
                )
                session.add(alert)

            await session.commit()
    except Exception as e:
        print(f"[Ingester] Error processing line: {e}")

async def background_ingester():
    """Reads from stream.log at the current offset when streaming is active."""
    while True:
        if not stream_state.is_streaming:
            await asyncio.sleep(1)
            continue
            
        try:
            with open(stream_state.file_path, "r") as f:
                f.seek(stream_state.offset)
                line = f.readline()
                
                if not line:
                    # EOF reached, wait for more data
                    await asyncio.sleep(1)
                    continue
                
                # We have a line, update offset and process it
                stream_state.offset = f.tell()
                await process_log_line(line)
                
        except Exception as e:
            print(f"[Ingester] Error reading file: {e}")
            await asyncio.sleep(2)

async def pause_stream():
    stream_state.is_streaming = False
    return {"status": "paused"}

async def resume_stream():
    stream_state.is_streaming = True
    return {"status": "streaming"}

async def restart_stream():
    stream_state.is_streaming = False
    
    # Clear the file
    open(stream_state.file_path, "w").close()
    stream_state.offset = 0
    
    # Clear events from the database
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(delete(Event))
            await session.commit()
    except Exception as e:
        print(f"[Restart] Error clearing events: {e}")
        
    stream_state.is_streaming = True
    return {"status": "restarted"}
