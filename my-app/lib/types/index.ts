// ═══════════════════════════════════════════════════════════════════
// ULPF Domain Types
// ═══════════════════════════════════════════════════════════════════

// ── Severity ─────────────────────────────────────────────────────

export type Severity = "critical" | "high" | "medium" | "low" | "info" | "unknown";

// ── Log Source ───────────────────────────────────────────────────

export type SourceType =
  | "network_device"
  | "endpoint"
  | "web_server"
  | "cloud"
  | "database"
  | "application"
  | "security_tool"
  | "container"
  | "syslog"
  | "custom";

export type LogFormat =
  | "syslog_rfc3164"
  | "syslog_rfc5424"
  | "json"
  | "json_lines"
  | "csv"
  | "xml"
  | "cef"
  | "leef"
  | "w3c"
  | "clf"
  | "combined"
  | "windows_evtx"
  | "grok_custom"
  | "multiline"
  | "unknown";

export type SourceStatus = "active" | "inactive" | "error" | "degraded" | "onboarding";
export type SourceTransport = "kafka" | "syslog_tcp" | "syslog_udp" | "file" | "api" | "s3" | "agent";

export interface SourceMetrics {
  events_per_min: number;
  events_per_min_delta: number; // % change vs last interval
  bytes_per_min: number;
  parse_success_rate: number; // 0-1
  error_rate: number; // 0-1
  last_event_at: string; // ISO 8601
  lag_seconds: number; // processing lag
}

export interface LogSource {
  id: string;
  name: string;
  description: string;
  type: SourceType;
  format: LogFormat;
  transport: SourceTransport;
  status: SourceStatus;
  parser_id: string | null;
  tags: string[];
  hostname: string | null;
  ip_address: string | null;
  topic: string | null; // Kafka topic
  metrics: SourceMetrics;
  created_at: string;
  updated_at: string;
  onboarded_by: "manual" | "auto_detect" | "ai_assisted";
}

// ── Parser ────────────────────────────────────────────────────────

export type ParserType = "regex" | "grok" | "json" | "csv" | "xml" | "cef" | "leef" | "python" | "ai_generated";

export interface ParserField {
  source_field: string;
  target_field: string;
  transform?: "epoch_to_iso" | "lowercase" | "trim" | "extract_ip" | "parse_int" | "parse_float";
  required: boolean;
  example_value?: string;
}

export interface ParserPattern {
  id: string;
  name: string;
  pattern: string;
  flags?: string;
  description?: string;
}

export interface Parser {
  id: string;
  name: string;
  description: string;
  type: ParserType;
  format: LogFormat;
  version: string;
  author: string;
  source_count: number; // how many sources use this parser
  patterns: ParserPattern[];
  field_mappings: ParserField[];
  confidence_threshold: number; // 0-1
  avg_confidence: number; // 0-1
  created_at: string;
  updated_at: string;
  is_ai_generated: boolean;
  ai_model?: string;
  test_samples: number;
  accuracy: number; // 0-1 based on test samples
  enabled: boolean;
}

// ── Universal Event Schema (Normalized) ──────────────────────────

export type EventCategory =
  | "authentication"
  | "authorization"
  | "network_connection"
  | "network_denial"
  | "dns"
  | "http"
  | "process_execution"
  | "file_access"
  | "registry_change"
  | "configuration_change"
  | "policy_violation"
  | "threat_detection"
  | "anomaly"
  | "audit"
  | "system"
  | "application"
  | "other";

export type EventOutcome = "success" | "failure" | "partial" | "unknown";

export interface NormalizedActor {
  user?: string;
  process?: string;
  ip?: string;
  hostname?: string;
  domain?: string;
  uid?: string;
  gid?: string;
}

export interface NormalizedTarget {
  resource?: string;
  ip?: string;
  port?: number;
  hostname?: string;
  path?: string;
  url?: string;
  protocol?: string;
}

export interface LineageStep {
  stage:
    | "ingest"
    | "format_detection"
    | "parser_match"
    | "field_extraction"
    | "normalization"
    | "schema_validation"
    | "enrichment"
    | "storage";
  status: "success" | "warning" | "error" | "skipped";
  duration_ms: number;
  detail: string;
  timestamp: string;
  warnings?: string[];
}

export interface AIAssistance {
  model: string;
  confidence: number; // 0-1
  prompt_category: "field_mapping" | "format_detection" | "anomaly_scoring" | "enrichment";
  human_reviewed: boolean;
  reviewed_at?: string;
}

export interface DownstreamRef {
  system: "opensearch" | "minio" | "kafka" | "siem" | "webhook";
  reference: string;
  delivered_at: string;
}

export interface NormalizedEvent {
  id: string;
  // Universal schema fields
  timestamp: string; // ISO 8601 — original event time
  ingested_at: string; // ISO 8601 — when ULPF received it
  processed_at: string; // ISO 8601 — when processing completed
  source_id: string;
  source_name: string;
  source_type: SourceType;
  severity: Severity;
  category: EventCategory;
  action: string;
  outcome: EventOutcome;
  actor: NormalizedActor;
  target: NormalizedTarget;
  tags: string[];
  correlation_id?: string;
  session_id?: string;
  // Raw event preservation
  raw_ref: string; // MinIO object path
  raw_preview: string; // first 512 chars of raw log
  raw_format: LogFormat;
  // Processing lineage
  parser_id: string;
  parser_version: string;
  parser_confidence: number; // 0-1
  lineage: LineageStep[];
  // AI involvement
  ai_assistance?: AIAssistance;
  // Downstream references
  downstream: DownstreamRef[];
  // Additional fields (varies by source type)
  extra_fields: Record<string, string | number | boolean | null>;
  // Normalization coverage (% of universal schema fields populated)
  schema_coverage: number; // 0-1
}

// ── Pipeline ──────────────────────────────────────────────────────

export type PipelineStage =
  | "ingest"
  | "format_detection"
  | "parser_match"
  | "field_extraction"
  | "normalization"
  | "schema_validation"
  | "enrichment"
  | "output";

export interface PipelineStageMetrics {
  stage: PipelineStage;
  label: string;
  events_per_sec: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  error_rate: number; // 0-1
  queue_depth: number;
  active_workers: number;
  status: "healthy" | "degraded" | "error" | "idle";
}

export interface PipelineMetrics {
  total_events_per_sec: number;
  total_events_today: number;
  parse_success_rate: number;
  normalization_coverage: number;
  enrichment_rate: number;
  error_rate: number;
  kafka_consumer_lag: number;
  stages: PipelineStageMetrics[];
  last_updated: string;
}

// ── Anomaly / Detection ───────────────────────────────────────────

export type AnomalyType =
  | "spike"
  | "drop"
  | "pattern_deviation"
  | "new_source"
  | "geo_anomaly"
  | "brute_force"
  | "exfiltration"
  | "lateral_movement"
  | "privilege_escalation"
  | "format_drift";

export interface AnomalyAlert {
  id: string;
  type: AnomalyType;
  severity: Severity;
  source_id: string;
  source_name: string;
  title: string;
  description: string;
  score: number; // 0-1 anomaly score
  detected_at: string;
  resolved_at?: string;
  status: "open" | "investigating" | "resolved" | "false_positive";
  event_count: number;
  sample_event_id?: string;
}

// ── System Health ─────────────────────────────────────────────────

export interface SystemMetric {
  name: string;
  label: string;
  value: number;
  unit: string;
  threshold_warn: number;
  threshold_crit: number;
  status: "healthy" | "warning" | "critical";
  trend: "up" | "down" | "stable";
  history: number[]; // last N readings
}

export interface SystemHealth {
  overall_status: "healthy" | "degraded" | "critical";
  metrics: SystemMetric[];
  services: {
    name: string;
    status: "up" | "down" | "degraded";
    latency_ms: number;
    last_checked: string;
  }[];
  last_updated: string;
}

// ── Analytics ─────────────────────────────────────────────────────

export type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d";

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface ThroughputPoint {
  time: string;
  ingested: number;
  processed: number;
  output: number;
}

export interface ProcessingError {
  id: string;
  timestamp: string;
  source_id: string;
  parser_id?: string;
  stage: string;
  error: string;
  raw_preview: string;
}

export interface SeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  unknown: number;
}

export interface SourceTopEntry {
  source_id: string;
  source_name: string;
  source_type: SourceType;
  event_count: number;
  percentage: number;
  trend: "up" | "down" | "stable";
}

// ── Search ────────────────────────────────────────────────────────

export interface SearchFilter {
  field: string;
  operator: "eq" | "neq" | "contains" | "starts_with" | "gt" | "lt" | "in";
  value: string | number | string[];
}

export interface SearchQuery {
  text?: string;
  filters: SearchFilter[];
  time_range: TimeRange;
  severity?: Severity[];
  source_ids?: string[];
  categories?: EventCategory[];
  parser_ids?: string[];
  page: number;
  page_size: number;
  sort_by: string;
  sort_dir: "asc" | "desc";
}

export interface SearchResult {
  events: NormalizedEvent[];
  total: number;
  page: number;
  page_size: number;
  query_ms: number;
}
