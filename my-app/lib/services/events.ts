import { fetchJson } from "./api";
import type { NormalizedEvent, SearchQuery, SearchResult } from "../types";

const MOCK_DELAY = () =>
  new Promise((r) => setTimeout(r, Math.random() * 80 + 30));

export async function fetchEvents(
  page = 0,
  pageSize = 50
): Promise<{ events: NormalizedEvent[]; total: number }> {
  await MOCK_DELAY();
  const data = await fetchJson<{
    events: NormalizedEvent[];
    total: number;
    page: number;
    page_size: number;
  }>(`/api/events?page=${page}&page_size=${pageSize}`);
  return { events: data.events, total: data.total };
}

export async function searchEvents(query: SearchQuery): Promise<SearchResult> {
  const t0 = performance.now();
  await MOCK_DELAY();
  const data = await fetchJson<SearchResult>("/api/events/search", {
    method: "POST",
    body: JSON.stringify(query),
  });
  return { ...data, query_ms: Math.round(performance.now() - t0) };
}

export async function getEventById(
  id: string
): Promise<NormalizedEvent | null> {
  await MOCK_DELAY();
  try {
    return await fetchJson<NormalizedEvent>(`/api/events/${id}`);
  } catch {
    return null;
  }
}

export async function getRecentEvents(
  count = 20
): Promise<NormalizedEvent[]> {
  await MOCK_DELAY();
  const data = await fetchJson<{
    events: NormalizedEvent[];
    total: number;
  }>(`/api/events?page=0&page_size=${count}`);
  return data.events;
}
