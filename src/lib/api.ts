/**
 * Safe API utilities for VoiceToWebsite.com
 * Never throws "Unexpected end of JSON input" — always surfaces the real error
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: unknown,
    public cause?: Error,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Fetches JSON safely. Never throws "Unexpected end of JSON input".
 * Always surfaces the real status + body snippet for debugging.
 */
export async function fetchJSON<T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { timeoutMs = 45000, ...init } = options;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json',
        ...(init.body && typeof init.body === 'string'
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(init.headers || {}),
      },
    });
  } catch (e) {
    clearTimeout(timer);
    if ((e as Error).name === 'AbortError') {
      throw new ApiError(
        `Request timed out after ${timeoutMs}ms`,
        undefined,
        undefined,
        e as Error,
      );
    }
    throw new ApiError(
      `Network error: ${(e as Error).message}`,
      undefined,
      undefined,
      e as Error,
    );
  }
  clearTimeout(timer);

  // Read body as text first (works for empty, HTML, JSON, anything)
  const text = await res.text();

  // Empty body
  if (!text || !text.trim()) {
    throw new ApiError(
      `Empty response body (HTTP ${res.status} ${res.statusText || ''}).\n` +
        `The API returned no content — check server logs or network tab.`,
      res.status,
    );
  }

  // Try to parse JSON
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    const snippet = text.slice(0, 300).replace(/\s+/g, ' ');
    throw new ApiError(
      `Non-JSON response (HTTP ${res.status}):\n${snippet}`,
      res.status,
      text,
      e as Error,
    );
  }

  // Non-2xx with parsed JSON error body
  if (!res.ok) {
    const errorData = data as { error?: string; message?: string; details?: string };
    const msg =
      errorData?.error ||
      errorData?.message ||
      `API error (HTTP ${res.status})`;
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}

/**
 * Type-safe wrapper for common patterns
 */
export async function postJSON<TResponse = unknown, TBody = unknown>(
  url: string,
  body: TBody,
  options: Omit<FetchOptions, 'method' | 'body'> = {},
): Promise<TResponse> {
  return fetchJSON<TResponse>(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
}
