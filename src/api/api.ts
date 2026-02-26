/**
 * algo.viz — Frontend API Client
 * ================================
 * All calls to the backend go through this file.
 * Nothing else in the frontend knows the backend URL exists.
 */

import type { IRDocument } from '../ir/ir.types';

const BACKEND_URL = 'http://localhost:3001';

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

export type GenerateResponse =
  | GenerateAnimationResponse
  | GenerateExplanationResponse
  | GenerateErrorResponse;

// =============================================================================
// API CALLS
// =============================================================================

export async function generateConcept(concept: string): Promise<GenerateResponse> {
  const response = await fetch(`${BACKEND_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ concept }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { mode: 'error', error: `Server error ${response.status}: ${text}` };
  }

  return response.json();
}