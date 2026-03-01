/**
 * algo.viz — Frontend API Client
 * ================================
 * All calls to the backend go through this file.
 * Nothing else in the frontend knows the backend URL exists.
 *
 * Features:
 *   - AbortController support to cancel in-flight requests
 *   - 30-second timeout to prevent infinite spinners
 *   - Abort-aware error handling (cancelled requests return cleanly)
 */

import type { IRDocument } from '../ir/ir.types';

const BACKEND_URL = 'http://localhost:3001';
const REQUEST_TIMEOUT_MS = 30_000; // 30 seconds

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export type GenerateAnimationResponse = {
  mode: 'animation';
  document: IRDocument;
};

export type GenerateExplanationResponse = {
  mode: 'explanation';
  text: string;
};

export type GenerateErrorResponse = {
  mode: 'error';
  error: string;
};

export type GenerateAbortedResponse = {
  mode: 'aborted';
};

export type GenerateResponse =
  | GenerateAnimationResponse
  | GenerateExplanationResponse
  | GenerateErrorResponse
  | GenerateAbortedResponse;

// =============================================================================
// API CALLS
// =============================================================================

/**
 * Generate an animation or explanation for a concept.
 *
 * @param concept - The algorithm or concept to explain
 * @param signal  - Optional AbortSignal to cancel the request.
 *                  Pass this from an AbortController in the calling component
 *                  so a new request can cancel a stale one.
 */
export async function generateConcept(
  concept: string,
  signal?: AbortSignal
): Promise<GenerateResponse> {
  // Timeout controller — auto-aborts after REQUEST_TIMEOUT_MS
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);

  // If the caller provided a signal, forward its abort to our timeout controller
  const onExternalAbort = () => timeoutController.abort();
  signal?.addEventListener('abort', onExternalAbort);

  try {
    const response = await fetch(`${BACKEND_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept }),
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      return { mode: 'error', error: `Server error ${response.status}: ${text}` };
    }

    return response.json();
  } catch (err) {
    // Request was cancelled (either by user or by timeout)
    if (err instanceof DOMException && err.name === 'AbortError') {
      // If the external signal triggered the abort, it's a user cancellation
      if (signal?.aborted) {
        return { mode: 'aborted' };
      }
      // Otherwise it was our timeout
      return {
        mode: 'error',
        error: 'Request timed out — the AI took too long to respond. Please try again.',
      };
    }

    // Network or other error
    return {
      mode: 'error',
      error: err instanceof Error ? err.message : 'Unknown network error',
    };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}
