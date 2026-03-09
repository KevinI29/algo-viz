/**
 * Study AI — V2 API Client
 * ==========================
 * Calls POST /api/teach and returns a LessonPlan.
 */

import type { LessonPlan } from '../router/types';

const BACKEND_URL = 'http://localhost:3001';
const TIMEOUT_MS = 45_000;

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export type TeachResult =
  | { ok: true; plan: LessonPlan }
  | { ok: false; error: string }
  | { ok: false; aborted: true };

// =============================================================================
// API CALL
// =============================================================================

export async function fetchLessonPlan(
  userInput: string,
  inputType: 'concept' | 'code',
  signal?: AbortSignal,
): Promise<TeachResult> {
  const timeoutCtrl = new AbortController();
  const timeout = setTimeout(() => timeoutCtrl.abort(), TIMEOUT_MS);

  const onExtAbort = () => timeoutCtrl.abort();
  signal?.addEventListener('abort', onExtAbort);

  try {
    const res = await fetch(`${BACKEND_URL}/api/teach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput, inputType }),
      signal: timeoutCtrl.signal,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      return { ok: false, error: body.error ?? `Server error ${res.status}` };
    }

    const plan: LessonPlan = await res.json();
    return { ok: true, plan };

  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (signal?.aborted) return { ok: false, aborted: true } as any;
      return { ok: false, error: 'Request timed out — AI took too long' };
    }
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onExtAbort);
  }
}