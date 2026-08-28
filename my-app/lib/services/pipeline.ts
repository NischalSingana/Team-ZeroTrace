import { fetchJson } from "./api";
import type { PipelineMetrics } from "../types";

const MOCK_DELAY = () =>
  new Promise((r) => setTimeout(r, Math.random() * 80 + 30));

export async function getPipelineMetrics(): Promise<PipelineMetrics> {
  await MOCK_DELAY();
  return fetchJson<PipelineMetrics>("/api/pipeline/metrics");
}
