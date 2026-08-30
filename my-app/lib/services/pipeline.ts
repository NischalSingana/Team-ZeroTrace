import { fetchJson } from "./api";
import type { PipelineMetrics } from "../types";

const MOCK_DELAY = () =>
  new Promise((r) => setTimeout(r, Math.random() * 80 + 30));

export async function getPipelineMetrics(): Promise<PipelineMetrics> {
  await MOCK_DELAY();
  return fetchJson<PipelineMetrics>("/api/pipeline/metrics");
}

export async function pauseStream(): Promise<void> {
  await fetchJson("/api/pipeline/stream/pause", { method: "POST" });
}

export async function resumeStream(): Promise<void> {
  await fetchJson("/api/pipeline/stream/resume", { method: "POST" });
}

export async function restartStream(): Promise<void> {
  await fetchJson("/api/pipeline/stream/restart", { method: "POST" });
}

export async function getStreamState(): Promise<{ is_streaming: boolean; status: string }> {
  return fetchJson<{ is_streaming: boolean; status: string }>("/api/pipeline/stream/state");
}
