import type { TimeSeriesPoint, ThroughputPoint, ProcessingError, SeverityBreakdown, SourceTopEntry, TimeRange } from "../types";


function generateTimeSeries(
  points: number,
  intervalMs: number,
  baseValue: number,
  variance: number
): TimeSeriesPoint[] {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => ({
    timestamp: new Date(now - (points - i) * intervalMs).toISOString(),
    value: Math.max(0, Math.round(baseValue + (Math.random() - 0.5) * 2 * variance)),
  }));
}

const SERIES_CONFIG: Record<
  TimeRange,
  { points: number; intervalMs: number }
> = {
  "1h": { points: 60, intervalMs: 60_000 },
  "6h": { points: 72, intervalMs: 300_000 },
  "24h": { points: 96, intervalMs: 900_000 },
  "7d": { points: 168, intervalMs: 3_600_000 },
  "30d": { points: 180, intervalMs: 14_400_000 },
};

export function getEventVolumeSeries(range: TimeRange): TimeSeriesPoint[] {
  const { points, intervalMs } = SERIES_CONFIG[range];
  return generateTimeSeries(points, intervalMs, 683, 120);
}

export function getCriticalEventSeries(range: TimeRange): TimeSeriesPoint[] {
  const { points, intervalMs } = SERIES_CONFIG[range];
  return generateTimeSeries(points, intervalMs, 8, 5);
}

export function getErrorRateSeries(range: TimeRange): TimeSeriesPoint[] {
  const { points, intervalMs } = SERIES_CONFIG[range];
  return generateTimeSeries(points, intervalMs, 15, 12).map((p) => ({
    ...p,
    value: Math.round(p.value * 0.01 * 1000) / 1000,
  }));
}

export function getParseSuccessSeries(range: TimeRange): TimeSeriesPoint[] {
  const { points, intervalMs } = SERIES_CONFIG[range];
  return generateTimeSeries(points, intervalMs, 9847, 100).map((p) => ({
    ...p,
    value: Math.min(10000, Math.max(9500, p.value)),
  }));
}

export function getThroughputSeries(range: TimeRange): ThroughputPoint[] {
  const { points, intervalMs } = SERIES_CONFIG[range];
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => {
    const timestamp = new Date(now - (points - i) * intervalMs).toISOString();
    // Base ingested ~ 680-720
    const ingested = Math.max(0, Math.round(700 + (Math.random() - 0.5) * 150));
    // Processed is usually close to ingested but slightly lower
    const processed = Math.round(ingested * (0.95 + Math.random() * 0.04));
    // Output is what makes it through validation/enrichment
    const output = Math.round(processed * (0.98 + Math.random() * 0.01));
    return {
      time: timestamp,
      ingested,
      processed,
      output,
    };
  });
}

export function getRecentErrors(count = 10): ProcessingError[] {
  const errors: ProcessingError[] = [
    { id: "err_1", timestamp: new Date(Date.now() - 4000).toISOString(), source_id: "src_001", stage: "parser_match", error: "No parser matched format syslog_rfc5424", raw_preview: "Aug 27 17:14:32 dc-edge-fw-01 %ASA-3-106023: Deny tcp..." },
    { id: "err_2", timestamp: new Date(Date.now() - 15000).toISOString(), source_id: "src_004", parser_id: "parser_snort_fast", stage: "field_extraction", error: "Regex mismatch on group 'sig_id'", raw_preview: "[**] [1:1000001:1] SQL Injection Attempt [**] [Priority: 1]" },
    { id: "err_3", timestamp: new Date(Date.now() - 45000).toISOString(), source_id: "src_006", parser_id: "parser_mysql_audit", stage: "schema_validation", error: "Missing required field: action", raw_preview: '{"audit_record":{"name":"Query","status":0,"sql_text":"SELECT * FROM users"}}' },
    { id: "err_4", timestamp: new Date(Date.now() - 62000).toISOString(), source_id: "src_011", stage: "format_detection", error: "Malformed JSON payload", raw_preview: '{"event": "login_failed", "user": "admin", "ip": "10.0.0.1"' },
    { id: "err_5", timestamp: new Date(Date.now() - 120000).toISOString(), source_id: "src_008", parser_id: "parser_auth0_webtask", stage: "normalization", error: "Invalid timestamp format", raw_preview: '{"date":"27-08-2026","type":"s","client_id":"APP123"}' },
  ];
  // Pad if needed
  while (errors.length < count) {
    errors.push({ ...errors[Math.floor(Math.random() * errors.length)], id: `err_${errors.length + 1}`, timestamp: new Date(Date.now() - Math.random() * 300000).toISOString() });
  }
  return errors.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, count);
}

export const SEVERITY_BREAKDOWN: SeverityBreakdown = {
  critical: 234,
  high: 1_847,
  medium: 8_312,
  low: 19_204,
  info: 12_295_000,
  unknown: 104,
};

export const TOP_SOURCES: SourceTopEntry[] = [
  {
    source_id: "src_010",
    source_name: "Custom App — Payments Service",
    source_type: "application",
    event_count: 4_712,
    percentage: 31.2,
    trend: "up",
  },
  {
    source_id: "src_002",
    source_name: "Nginx Web Gateway — PROD",
    source_type: "web_server",
    event_count: 3_047,
    percentage: 20.2,
    trend: "stable",
  },
  {
    source_id: "src_012",
    source_name: "Splunk UF — Server Farm",
    source_type: "custom",
    event_count: 1_205,
    percentage: 8.0,
    trend: "up",
  },
  {
    source_id: "src_001",
    source_name: "Cisco ASA — DC-EDGE-01",
    source_type: "network_device",
    event_count: 1_140,
    percentage: 7.6,
    trend: "stable",
  },
  {
    source_id: "src_005",
    source_name: "AWS CloudTrail — Prod",
    source_type: "cloud",
    event_count: 1_070,
    percentage: 7.1,
    trend: "up",
  },
];
