/*
 * The single door from the Vibe OS surface to the sovereign Fastify API.
 *
 * One intent in, one verdict out. Only VERIFIED carries an output and an
 * evidence hash; every other outcome is a fail-closed receipt and the caller
 * must render it as such. Nothing is inferred locally: the field names below
 * mirror what the API actually returns (`response`, `evidence_hash`), while
 * `output`/`hash` are accepted so the documented contract keeps working if the
 * server renames them.
 */

export type Verdict = 'VERIFIED' | 'DIVERGENT' | 'UNKNOWN' | 'NOT_EXECUTED';

export type IntentReceipt = {
  status: Verdict;
  verified: boolean;
  output: string | null;
  hash: string | null;
  reason: string | null;
};

/** The published execute endpoint. `/execute` and `/api/execute` are its aliases. */
export const EXECUTE_PATH = '/v1/execute';

/**
 * In the dev stack the API is a separate origin (`VITE_API_URL`) or reached
 * through the Vite `/api` proxy, which rewrites to the Fastify service on
 * port 5000 — the local sovereign API.
 */
const API_BASE_URL = (import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '');

const OFFLINE = 'Local Brain Offline';

function offlineReceipt(reason: string): IntentReceipt {
  return { status: 'UNKNOWN', verified: false, output: null, hash: null, reason: `${OFFLINE} · ${reason}` };
}

export function executeUrl(): string {
  return `${API_BASE_URL}${EXECUTE_PATH}`;
}

export async function submitIntent(intent: string, signal?: AbortSignal): Promise<IntentReceipt> {
  let response: Response;
  try {
    response = await fetch(executeUrl(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ intent }),
      signal,
    });
  } catch (err) {
    return offlineReceipt(err instanceof Error ? err.message : 'request failed');
  }

  // 503 is the fail-closed transport signal; any other non-2xx is also not an
  // answer, so it is reported the same way rather than dressed up as one.
  if (!response.ok) return offlineReceipt(`HTTP ${response.status}`);

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    return offlineReceipt('unreadable response');
  }

  const raw = typeof payload?.status === 'string' ? payload.status : 'UNKNOWN';
  const status: Verdict =
    raw === 'VERIFIED' || raw === 'DIVERGENT' || raw === 'NOT_EXECUTED' ? raw : 'UNKNOWN';
  const output =
    typeof payload?.output === 'string'
      ? payload.output
      : typeof payload?.response === 'string'
        ? payload.response
        : null;
  const hash =
    typeof payload?.hash === 'string'
      ? payload.hash
      : typeof payload?.evidence_hash === 'string'
        ? payload.evidence_hash
        : null;

  const verified = status === 'VERIFIED' && Boolean(output);
  return {
    status: verified ? 'VERIFIED' : status === 'VERIFIED' ? 'UNKNOWN' : status,
    verified,
    output: verified ? output : null,
    hash: verified ? hash : null,
    reason: typeof payload?.reason === 'string' ? payload.reason : null,
  };
}
