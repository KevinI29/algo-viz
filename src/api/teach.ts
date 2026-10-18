/**
 * Study AI — V2 API Client
 * ==========================
 * Calls POST /api/teach and returns a LessonPlan.
 */

import type { LessonPlan } from '../router/types';
import { parseLessonPlan } from '../lesson/schema';

const BACKEND_URL = 'http://127.0.0.1:3001';  // backend binds 127.0.0.1 by default
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

    const raw: unknown = await res.json().catch(() => null);
    const parsed = parseLessonPlan(raw);
    if (!parsed.ok) {
      console.warn('[Teach] Rejected lesson plan from server:', parsed.error);
      return { ok: false, error: 'Received an invalid lesson plan. Please try again.' };
    }
    return { ok: true, plan: parsed.plan };

  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (signal?.aborted) return { ok: false, aborted: true };
      return { ok: false, error: 'Request timed out — AI took too long' };
    }
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onExtAbort);
  }
}