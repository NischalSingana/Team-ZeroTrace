import { fetchJson } from "./api";

export interface AIMappingSuggestion {
  source_field: string;
  target_field: string;
  confidence: number;
  evidence: string;
  status?: "pending" | "approved" | "rejected";
}

export interface AIAnalyzeResult {
  detected_format: string;
  format_confidence: number;
  suggestions: AIMappingSuggestion[];
  fallback?: boolean;
  error?: string;
}

export async function analyzeLog(
  rawLog: string,
  sourceHint?: string
): Promise<AIAnalyzeResult> {
  return fetchJson<AIAnalyzeResult>("/api/ai/analyze", {
    method: "POST",
    body: JSON.stringify({ raw_log: rawLog, source_hint: sourceHint }),
  });
}

export async function generateParser(
  rawLog: string,
  suggestions: AIMappingSuggestion[],
  parserName: string,
  sourceType?: string
): Promise<{ parser: any; parser_id: string; validation_result: any }> {
  return fetchJson("/api/ai/generate-parser", {
    method: "POST",
    body: JSON.stringify({
      raw_log: rawLog,
      suggestions: suggestions.filter((s) => s.status === "approved"),
      parser_name: parserName,
      source_type: sourceType,
    }),
  });
}
