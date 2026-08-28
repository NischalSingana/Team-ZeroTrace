import { fetchJson } from "./api";
import type { SystemHealth, AnomalyAlert } from "../types";

const MOCK_DELAY = () =>
  new Promise((r) => setTimeout(r, Math.random() * 80 + 30));

export async function getSystemHealth(): Promise<SystemHealth> {
  await MOCK_DELAY();
  return fetchJson<SystemHealth>("/api/health/system");
}

export async function getAnomalyAlerts(): Promise<AnomalyAlert[]> {
  await MOCK_DELAY();
  return fetchJson<AnomalyAlert[]>("/api/health/anomalies");
}
