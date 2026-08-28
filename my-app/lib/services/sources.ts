import { fetchJson } from "./api";
import type { LogSource } from "../types";

const MOCK_DELAY = () =>
  new Promise((r) => setTimeout(r, Math.random() * 80 + 30));

export async function fetchSources(): Promise<LogSource[]> {
  await MOCK_DELAY();
  return fetchJson<LogSource[]>("/api/sources");
}

export async function getSourceById(id: string): Promise<LogSource | null> {
  await MOCK_DELAY();
  try {
    return await fetchJson<LogSource>(`/api/sources/${id}`);
  } catch {
    return null;
  }
}

export async function getActiveSources(): Promise<LogSource[]> {
  const sources = await fetchSources();
  return sources.filter((s) => s.status === "active");
}
