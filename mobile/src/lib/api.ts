import { API_URL } from "./config";
import type { StreamEvent } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

let authToken: string | null = null;
let onUnauthorized: () => void = () => {};

export const setAuthToken = (token: string | null) => { authToken = token; };
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

const NETWORK_MESSAGE = "Can’t reach the server. Check your connection and try again.";

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return authToken ? { "X-SwipePhotos-Token": authToken, ...extra } : extra;
}

async function readError(res: Response): Promise<ApiError> {
  let message = `Something went wrong (${res.status}). Please try again.`;
  try {
    const body = await res.json();
    if (body && typeof body.error === "string") message = body.error;
  } catch { /* not JSON */ }
  if (res.status === 401) onUnauthorized();
  return new ApiError(message, res.status);
}

async function send<T>(path: string, init: RequestInit, timeoutMs = 60_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
  } catch {
    throw new ApiError(NETWORK_MESSAGE);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw await readError(res);
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => send<T>(path, { method: "GET", headers: headers() }),

  post: <T>(path: string, json: Record<string, unknown> = {}, timeoutMs?: number) =>
    send<T>(path, { method: "POST", headers: headers({ "Content-Type": "application/json" }), body: JSON.stringify(json) }, timeoutMs),

  postForm: <T>(path: string, form: FormData, timeoutMs = 120_000) =>
    send<T>(path, { method: "POST", headers: headers(), body: form }, timeoutMs),
};

/**
 * POSTs and delivers each NDJSON line as it arrives (the preview/refine endpoints
 * stream progress). Rejects if the server reports {"status":"error"}.
 */
export async function streamNdjson(
  path: string,
  body: FormData | string,
  onEvent: (event: StreamEvent) => void,
  timeoutMs = 330_000,
): Promise<void> {
  const isJson = typeof body === "string";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let res: Response;
    try {
      res = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: headers(isJson ? { "Content-Type": "application/json" } : {}),
        body,
        signal: controller.signal,
      });
    } catch {
      throw new ApiError(NETWORK_MESSAGE);
    }
    if (!res.ok) throw new ApiError("The server is busy. Please try again.", res.status);
    if (!res.body) throw new ApiError("Streaming isn’t supported on this device.");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const flush = (line: string) => {
      if (!line.trim()) return;
      let event: StreamEvent;
      try { event = JSON.parse(line) as StreamEvent; } catch { return; }
      if (event.status === "error") throw new ApiError(event.error ?? "Generation failed. Please try again.");
      onEvent(event);
    };
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newline = buffer.indexOf("\n");
        while (newline >= 0) {
          flush(buffer.slice(0, newline));
          buffer = buffer.slice(newline + 1);
          newline = buffer.indexOf("\n");
        }
      }
      flush(buffer);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError("The connection was interrupted. Please try again.");
    }
  } finally {
    clearTimeout(timer);
  }
}
