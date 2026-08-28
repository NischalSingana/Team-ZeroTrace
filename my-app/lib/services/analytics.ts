import { fetchJson } from "./api";
import type {
  TimeRange,
  TimeSeriesPoint,
  SeverityBreakdown,
  SourceTopEntry,
  ThroughputPoint,
  ProcessingError,
} from "../types";

const MOCK_DELAY = () =>
  new Promise((r) => setTimeout(r, Math.random() * 80 + 30));

export async function getEventVolume(range: TimeRange): Promise<TimeSeriesPoint[]> {
  await MOCK_DELAY();
  return fetchJson<TimeSeriesPoint[]>(`/api/analytics/event-volume?range=${range}`);
}

export async function getCriticalEvents(range: TimeRange): Promise<TimeSeriesPoint[]> {
  await MOCK_DELAY();
  return fetchJson<TimeSeriesPoint[]>(`/api/analytics/critical-events?range=${range}`);
}

export async function getErrorRate(range: TimeRange): Promise<TimeSeriesPoint[]> {
  await MOCK_DELAY();
  return fetchJson<TimeSeriesPoint[]>(`/api/analytics/error-rate?range=${range}`);
}

export async function getParseSuccess(range: TimeRange): Promise<TimeSeriesPoint[]> {
  await MOCK_DELAY();
  return fetchJson<TimeSeriesPoint[]>(`/api/analytics/parse-success?range=${range}`);
}

export async function getThroughput(range: TimeRange = "1h"): Promise<ThroughputPoint[]> {
  await MOCK_DELAY();
  return fetchJson<ThroughputPoint[]>(`/api/analytics/throughput?range=${range}`);
}

export async function getProcessingErrors(count = 10): Promise<ProcessingError[]> {
  await MOCK_DELAY();
  return fetchJson<ProcessingError[]>(`/api/analytics/processing-errors?count=${count}`);
}

export async function getSeverityBreakdown(): Promise<SeverityBreakdown> {
  await MOCK_DELAY();
  return fetchJson<SeverityBreakdown>("/api/analytics/severity-breakdown");
}

export async function getTopSources(): Promise<SourceTopEntry[]> {
  await MOCK_DELAY();
  return fetchJson<SourceTopEntry[]>("/api/analytics/top-sources");
}
