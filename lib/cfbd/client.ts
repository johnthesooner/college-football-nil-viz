// A thin, typed CollegeFootballData (CFBD) API v2 client.
//
// - Bearer auth (v2 requires a key; free tier = 1k calls/mo).
// - Retry with backoff on 429/5xx; fail fast on 401/403 (a retry won't fix auth).
// - Counts network calls so the ingestion layer can report budget usage.
// - `fetchImpl` is injectable so the pipeline is testable offline (no network).
//
// The API key is read by the caller from process.env and passed in. It is never
// logged, printed, or included in any thrown error message.

export type FetchImpl = typeof fetch;

export interface CfbdClient {
  get<T>(path: string): Promise<T>;
  /** Number of network requests made so far (cache hits are counted by the ingest layer). */
  callCount(): number;
}

export interface ClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: FetchImpl;
  maxRetries?: number;
  backoffMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

export function createClient(opts: ClientOptions): CfbdClient {
  const apiKey = opts.apiKey;
  if (!apiKey) {
    throw new Error("CFBD_API_KEY is required — get a free key at https://collegefootballdata.com/key");
  }
  const baseUrl = opts.baseUrl ?? "https://api.collegefootballdata.com";
  const fetchImpl = opts.fetchImpl ?? fetch;
  const maxRetries = opts.maxRetries ?? 3;
  const backoffMs = opts.backoffMs ?? 1000;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  let calls = 0;

  async function get<T>(path: string): Promise<T> {
    let attempt = 0;
    for (;;) {
      calls += 1;
      const res = await fetchImpl(`${baseUrl}${path}`, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      });

      if (res.ok) return (await res.json()) as T;

      // Auth errors won't resolve on retry — fail fast, and never echo the key.
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          `CFBD ${path} → ${res.status}. Check CFBD_API_KEY is valid and your tier permits this endpoint.`,
        );
      }

      // Throttling / transient server errors → retry with backoff (honor Retry-After).
      if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoffMs * 2 ** attempt;
        attempt += 1;
        await sleep(wait);
        continue;
      }

      const body = await res.text().catch(() => "");
      throw new Error(`CFBD ${path} → ${res.status} ${res.statusText} ${body.slice(0, 200)}`.trim());
    }
  }

  return { get, callCount: () => calls };
}
