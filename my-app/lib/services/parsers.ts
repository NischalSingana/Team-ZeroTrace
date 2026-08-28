import { fetchJson } from "./api";
import type { Parser } from "../types";

const MOCK_DELAY = () =>
  new Promise((r) => setTimeout(r, Math.random() * 80 + 30));

export async function fetchParsers(): Promise<Parser[]> {
  await MOCK_DELAY();
  return fetchJson<Parser[]>("/api/parsers");
}

export async function getParserById(id: string): Promise<Parser | null> {
  await MOCK_DELAY();
  try {
    return await fetchJson<Parser>(`/api/parsers/${id}`);
  } catch {
    return null;
  }
}

export async function createParser(parser: Partial<Parser>): Promise<Parser> {
  await MOCK_DELAY();
  return fetchJson<Parser>("/api/parsers", {
    method: "POST",
    body: JSON.stringify(parser),
  });
}
