import { useAuthStore } from "../auth-store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export class BackendError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly endpoint?: string,
    public readonly isOffline = false
  ) {
    super(message);
    this.name = "BackendError";
  }
}

export function isOfflineError(err: unknown): boolean {
  return err instanceof BackendError && err.isOffline;
}

export function getApiErrorMessage(err: unknown): string {
  if (err instanceof BackendError) return err.message;
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;

  const token = useAuthStore.getState().token;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      cache: "no-store",
      ...options,
      headers,
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");
      throw new BackendError(
        res.status >= 500
          ? `Server error ${res.status} on ${path}. Please try again shortly.`
          : `API error ${res.status}${err ? `: ${err}` : ""}`,
        res.status,
        path,
        false
      );
    }
    // 204 No Content / empty body: nothing to parse
    const text = await res.text();
    if (!text.trim()) return undefined as T;
    const json = JSON.parse(text);
    return json.data ?? json;
  } catch (err) {
    if (err instanceof BackendError) throw err;

    // Network / DNS / CORS / backend offline
    const isNetworkError =
      err instanceof TypeError ||
      (err instanceof Error && /fetch|network|failed|cors/i.test(err.message));

    if (isNetworkError) {
      throw new BackendError(
        `Could not connect to backend at ${API_BASE || "API base URL"}. Make sure the backend is running.`,
        undefined,
        path,
        true
      );
    }
    throw err;
  }
}

export { fetchJson, API_BASE };
