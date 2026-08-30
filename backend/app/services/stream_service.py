"""Stream service: generates realistic security logs and ingests them into the database.

The stream only produces events while ``is_streaming`` is True. All other pages
(pipeline, overview, detections) should reflect the actual database state rather
than fabricated numbers.
"""
import asyncio
import json
import os
import random
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

from sqlalchemy import delete

from app.database import AsyncSessionLocal
from app.models import Event, AnomalyAlert, RawEvent


# ═══════════════════════════════════════════════════════════════════
# Stream state
# ═══════════════════════════════════════════════════════════════════

class StreamState:
    def __init__(self):
        self.is_streaming: bool = False
        self.file_path: str = "data/stream.log"
        os.makedirs("data", exist_ok=True)
        # Ensure file exists
        if not os.path.exists(self.file_path):
            with open(self.file_path, "a") as f:
                pass
        
        # Start at the end of the file to avoid replaying old logs
        self.offset: int = os.path.getsize(self.file_path) if os.path.exists(self.file_path) else 0

stream_state = StreamState()


def _make_event_id():
    return f"evt_{uuid.uuid4().hex[:8]}"


def _random_ip(public_only: bool = False):
    """Return a plausible IPv4 address."""
    if public_only:
        first_octet = random.choice([1, 2, 3, 4, 5, 8, 9, 13, 17, 18, 32, 37, 45, 46, 50, 52, 53, 55, 62, 64, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223])
    else:
        first_octet = random.randint(1, 223)
    return f"{first_octet}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"


# Real-looking internal / trusted hosts for contrast.
_TRUSTED_HOSTS = [
    ("10.0.1.10", "srv-web-prod-01"),
    ("10.0.1.11", "srv-web-prod-02"),
    ("10.0.2.5", "srv-db-prod-01"),
    ("10.0.2.6", "srv-db-prod-02"),
    ("10.0.3.20", "dc01.corp.local"),
    ("10.0.3.21", "dc02.corp.local"),
    ("10.0.4.15", "k8s-worker-03"),
    ("10.0.4.16", "k8s-master-01"),
    ("10.0.5.50", "vpn-gw-01"),
    ("10.0.6.7", "mail-gw-01"),
]

# Sources that map to real log formats and plausible events.
SOURCES = [
    {"id": "src_001", "name": "Cisco ASA Firewall — DC-EDGE-01", "type": "network_device", "parser": "parser_cisco_asa", "format": "syslog_rfc5424"},
    {"id": "src_002", "name": "Nginx Web Gateway — PROD", "type": "web_server", "parser": "parser_nginx_combined", "format": "combined"},
    {"id": "src_003", "name": "Windows Event Log — DC01", "type": "endpoint", "parser": "parser_winevtx", "format": "windows_evtx"},
    {"id": "src_004", "name": "Palo Alto NGFW — BRANCH-02", "type": "network_device", "parser": "parser_cef_generic", "format": "cef"},
    {"id": "src_005", "name": "AWS CloudTrail — Production Account", "type": "cloud", "parser": "parser_aws_cloudtrail", "format": "json"},
    {"id": "src_007", "name": "Kubernetes Audit Log — PROD-CLUSTER-01", "type": "container", "parser": "parser_k8s_audit", "format": "json_lines"},
    {"id": "src_008", "name": "PostgreSQL Audit — PROD-DB-01", "type": "database", "parser": "parser_postgres_log", "format": "syslog_rfc3164"},
    {"id": "src_009", "name": "Snort IDS — PERIMETER", "type": "security_tool", "parser": "parser_snort", "format": "syslog_rfc5424"},
    {"id": "src_010", "name": "Custom App — Payments Service", "type": "application", "parser": "parser_json_generic", "format": "json"},
]

# Scenario weights: mostly normal traffic, with enough malicious traffic to make
# detections meaningful.
SCENARIOS = [
    "normal_web",
    "failed_login",
    "brute_force",
    "malware_alert",
    "data_exfil",
    "privilege_escalation",
    "dns_tunnel",
    "allowed_ssh",
    "db_query",
    "k8s_api",
]


def _pick_source(scenario: str) -> Dict[str, Any]:
    """Choose a source that makes sense for the scenario."""
    mapping = {
        "normal_web": ["src_002", "src_010"],
        "failed_login": ["src_003", "src_005", "src_007"],
        "brute_force": ["src_003", "src_005"],
        "malware_alert": ["src_009", "src_004"],
        "data_exfil": ["src_002", "src_008", "src_005"],
        "privilege_escalation": ["src_005", "src_007"],
        "dns_tunnel": ["src_004", "src_009"],
        "allowed_ssh": ["src_003", "src_007"],
        "db_query": ["src_008", "src_010"],
        "k8s_api": ["src_007"],
    }
    src_ids = mapping.get(scenario, [s["id"] for s in SOURCES])
    chosen_id = random.choice(src_ids)
    return next(s for s in SOURCES if s["id"] == chosen_id)


def _build_event(scenario: str, source: Dict[str, Any], ts: datetime) -> Dict[str, Any]:
    """Construct a realistic normalized event for the chosen scenario."""
    event_id = _make_event_id()
    trusted_ip, trusted_host = random.choice(_TRUSTED_HOSTS)
    attacker_ip = _random_ip(public_only=True)

    # Defaults
    severity = "info"
    category = "application"
    action = "REQUEST"
    outcome = "success"
    actor_ip = trusted_ip
    actor_user = f"user_{random.randint(1, 200)}"
    target_ip = _random_ip()
    target_port = random.choice([80, 443, 8080])
    raw_preview = ""
    tags = ["normal"]

    if scenario == "normal_web":
        severity = random.choice(["info", "low"])
        category = "http"
        action = "REQUEST"
        outcome = "success"
        actor_ip = _random_ip()
        target_ip = trusted_ip
        target_port = 443
        path = random.choice(["/api/v1/health", "/api/v1/users", "/checkout", "/login", "/static/app.js"])
        status = random.choice([200, 200, 200, 201, 204, 301, 304, 400])
        raw_preview = f'{actor_ip} - - [{ts.strftime("%d/%b/%Y:%H:%M:%S %z")}] "GET {path} HTTP/2.0" {status} {random.randint(200, 5000)}'
        tags = ["http", "web", "success"]

    elif scenario == "failed_login":
        severity = random.choice(["low", "medium"])
        category = "authentication"
        action = "LOGON"
        outcome = "failure"
        actor_ip = attacker_ip
        actor_user = f"user_{random.randint(1, 200)}"
        target_ip = trusted_ip
        target_port = 22 if random.random() > 0.5 else 3389
        raw_preview = f"Authentication failure for {actor_user} from {actor_ip} to {trusted_host} via SSH"
        tags = ["authentication", "failure", "brute_force_candidate"]

    elif scenario == "brute_force":
        severity = "high"
        category = "authentication"
        action = "LOGON"
        outcome = "failure"
        actor_ip = attacker_ip
        actor_user = random.choice(["admin", "root", "administrator", "service_account"])
        target_ip = trusted_ip
        target_port = 22
        raw_preview = f"Multiple failed SSH login attempts for {actor_user} from {actor_ip} to {trusted_host}"
        tags = ["authentication", "brute_force", "failure"]

    elif scenario == "malware_alert":
        severity = "critical"
        category = "threat_detection"
        action = "THREAT_BLOCKED"
        outcome = "success"
        actor_ip = attacker_ip
        target_ip = trusted_ip
        target_port = 443
        raw_preview = f"IDS alert: Malware C2 traffic detected from {actor_ip} to {trusted_host} signature=Malware.C2.Generic"
        tags = ["threat_detection", "malware", "blocked"]

    elif scenario == "data_exfil":
        severity = "high"
        category = "network_connection"
        action = "CONNECT"
        outcome = "success"
        actor_ip = trusted_ip
        target_ip = attacker_ip
        target_port = random.choice([443, 8080, 53])
        raw_preview = f"Large outbound transfer ({random.randint(50, 500)}MB) from {trusted_host} to {target_ip}:{target_port}"
        tags = ["network_connection", "exfiltration", "suspicious"]

    elif scenario == "privilege_escalation":
        severity = "critical"
        category = "authorization"
        action = "UPDATE"
        outcome = "success"
        actor_ip = trusted_ip
        actor_user = random.choice(["devops", "ci_cd", "backup_svc"])
        target_ip = trusted_ip
        target_port = 0
        raw_preview = f"IAM policy change: {actor_user} attached AdminAccess policy to role ProductionAdmin from {actor_ip}"
        tags = ["authorization", "privilege_escalation", "iam"]

    elif scenario == "dns_tunnel":
        severity = "medium"
        category = "dns"
        action = "QUERY"
        outcome = "success"
        actor_ip = trusted_ip
        target_ip = "8.8.8.8"
        target_port = 53
        subdomain = "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=32))
        raw_preview = f"DNS query for {subdomain}.example.com from {trusted_host} ({actor_ip})"
        tags = ["dns", "tunnel_candidate", "suspicious"]

    elif scenario == "allowed_ssh":
        severity = "info"
        category = "authentication"
        action = "LOGON"
        outcome = "success"
        actor_ip = trusted_ip
        actor_user = f"user_{random.randint(1, 200)}"
        target_ip = _random_ip()
        target_port = 22
        raw_preview = f"Accepted publickey for {actor_user} from {actor_ip} port {random.randint(40000, 60000)} ssh2"
        tags = ["authentication", "success", "ssh"]

    elif scenario == "db_query":
        severity = "info"
        category = "audit"
        action = "QUERY"
        outcome = "success"
        actor_ip = trusted_ip
        actor_user = random.choice(["app_reader", "app_writer", "analytics"])
        target_ip = _random_ip()
        target_port = 5432
        raw_preview = f"LOG: statement: SELECT * FROM orders WHERE customer_id = {random.randint(1000, 9999)}"
        tags = ["audit", "database", "success"]

    elif scenario == "k8s_api":
        severity = random.choice(["info", "low"])
        category = "audit"
        action = random.choice(["CREATE", "UPDATE", "DELETE", "GET"])
        outcome = "success"
        actor_ip = trusted_ip
        actor_user = random.choice(["system:serviceaccount:dev:deployer", "alice", "system:kube-proxy"])
        target_ip = trusted_ip
        target_port = 6443
        resource = random.choice(["pods", "services", "secrets", "configmaps", "deployments"])
        raw_preview = f'{{"verb":"{action.lower()}","resource":"{resource}","user":"{actor_user}","sourceIPs":["{actor_ip}"]}}'
        tags = ["audit", "kubernetes", action.lower()]

    parser_confidence = round(random.uniform(0.92, 0.999), 4)
    schema_coverage = round(random.uniform(0.82, 0.96), 2)

    return {
        "id": event_id,
        "timestamp": ts.isoformat(),
        "ingested_at": (ts + timedelta(milliseconds=random.randint(10, 100))).isoformat(),
        "processed_at": (ts + timedelta(milliseconds=random.randint(50, 500))).isoformat(),
        "source_id": source["id"],
        "source_name": source["name"],
        "source_type": source["type"],
        "severity": severity,
        "category": category,
        "action": action,
        "outcome": outcome,
        "actor": {"ip": actor_ip, "user": actor_user if random.random() > 0.2 else None},
        "target": {"ip": target_ip, "port": target_port},
        "tags": tags,
        "raw_ref": f"raw/{ts.year}/{ts.month:02d}/{ts.day:02d}/{source['id']}/{event_id}.raw",
        "raw_preview": raw_preview,
        "raw_format": source["format"],
        "parser_id": source["parser"],
        "parser_version": "1.0.0",
        "parser_confidence": parser_confidence,
        "schema_coverage": schema_coverage,
    }


def generate_log_line() -> Dict[str, Any]:
    """Return one realistic log event."""
    scenario_weights = {
        "normal_web": 40,
        "allowed_ssh": 12,
        "db_query": 10,
        "k8s_api": 8,
        "failed_login": 8,
        "dns_tunnel": 5,
        "brute_force": 4,
        "malware_alert": 3,
        "data_exfil": 2,
        "privilege_escalation": 1,
    }
    scenario = random.choices(
        list(scenario_weights.keys()),
        weights=list(scenario_weights.values()),
        k=1,
    )[0]
    source = _pick_source(scenario)
    ts = datetime.now(timezone.utc)
    return _build_event(scenario, source, ts)


# ═══════════════════════════════════════════════════════════════════
# Background tasks
# ═══════════════════════════════════════════════════════════════════

async def background_writer():
    """Continuously writes new log lines to the stream.log file while streaming."""
    while True:
        try:
            if not stream_state.is_streaming:
                await asyncio.sleep(1)
                continue
            
            # Generate a realistic batch of events
            batch_size = random.randint(30, 80)
            lines = []
            for _ in range(batch_size):
                log_entry = generate_log_line()
                lines.append(json.dumps(log_entry) + "\n")
                
            with open(stream_state.file_path, "a") as f:
                f.writelines(lines)
        except Exception as e:
            print(f"[Writer] Error writing log: {e}")
        await asyncio.sleep(1.0)


def _build_lineage(ts: datetime, processed_at: datetime, parser_id: str) -> list:
    """Build a full pipeline lineage for an event."""
    stages = [
        ("ingest", 0.8, "Event received"),
        ("format_detection", 1.2, "Format detected"),
        ("parser_match", 0.6, f"Parser: {parser_id}"),
        ("field_extraction", 2.4, "Extracted fields"),
        ("normalization", 1.8, "Normalized"),
        ("schema_validation", 0.6, "Validated"),
        ("enrichment", 4.2, "Enriched with threat intel"),
        ("storage", 4.1, "Stored"),
    ]
    lineage = []
    cursor = ts
    for stage, duration_ms, detail in stages:
        cursor = cursor + timedelta(milliseconds=duration_ms)
        lineage.append({
            "stage": stage,
            "status": "success",
            "duration_ms": duration_ms,
            "detail": detail,
            "timestamp": cursor.isoformat(),
        })
    return lineage


async def process_log_line(line: str):
    """Parses a log line and inserts it into the database as an Event."""
    try:
        data = json.loads(line)
        # Parse datetime fields
        for field in ["timestamp", "ingested_at", "processed_at"]:
            if field in data and data[field]:
                data[field] = datetime.fromisoformat(data[field])

        lineage = _build_lineage(
            data["timestamp"], data["processed_at"], data.get("parser_id", "unknown")
        )

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
                lineage=lineage,
                downstream=[
                    {"system": "opensearch", "reference": f"ulpf-events/{data['id']}", "delivered_at": data["processed_at"].isoformat()},
                ],
                extra_fields={},
            )
            session.add(db_event)

            # Generate anomaly alerts for high/critical security events.
            if data["severity"] in ["high", "critical"]:
                alert_type = "rule_trigger"
                title = f"Suspicious activity on {data['source_name']}"
                description = f"{data['action']} detected from {data['actor'].get('ip', 'unknown')}"
                if data["category"] == "authentication":
                    alert_type = "brute_force"
                    title = f"Brute-force attempt against {data['source_name']}"
                    description = f"Repeated failed logins for {data['actor'].get('user', 'unknown')} from {data['actor'].get('ip', 'unknown')}"
                elif data["category"] == "threat_detection":
                    alert_type = "rule_trigger"
                    title = f"Threat blocked by {data['source_name']}"
                    description = f"Malicious traffic detected from {data['actor'].get('ip', 'unknown')}"
                elif data["category"] == "authorization":
                    alert_type = "privilege_escalation"
                    title = f"Privilege escalation on {data['source_name']}"
                    description = f"Sensitive IAM/policy change by {data['actor'].get('user', 'unknown')} from {data['actor'].get('ip', 'unknown')}"
                elif data["category"] == "network_connection":
                    alert_type = "exfiltration"
                    title = f"Potential data exfiltration via {data['source_name']}"
                    description = f"Large outbound connection to {data['target'].get('ip', 'unknown')}"

                alert = AnomalyAlert(
                    id=f"alert_{uuid.uuid4().hex[:8]}",
                    alert_type=alert_type,
                    severity=data["severity"],
                    source_id=data["source_id"],
                    source_name=data["source_name"],
                    title=title,
                    description=description,
                    score=round(random.uniform(0.75, 0.99), 2),
                    event_count=random.randint(5, 50),
                    sample_event_id=db_event.id,
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


# ═══════════════════════════════════════════════════════════════════
# Control endpoints
# ═══════════════════════════════════════════════════════════════════

async def pause_stream():
    stream_state.is_streaming = False
    return {"status": "paused", "is_streaming": False}


async def resume_stream():
    stream_state.is_streaming = True
    return {"status": "streaming", "is_streaming": True}


async def restart_stream():
    stream_state.is_streaming = False

    # Clear the file
    open(stream_state.file_path, "w").close()
    stream_state.offset = 0

    # Clear streamed data from the database
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(delete(Event))
            await session.execute(delete(AnomalyAlert))
            await session.execute(delete(RawEvent))
            await session.commit()
    except Exception as e:
        print(f"[Restart] Error clearing data: {e}")

    stream_state.is_streaming = True
    return {"status": "restarted", "is_streaming": True}
