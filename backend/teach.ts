/**
 * algo.viz — Lesson Plan Generation
 * ===================================
 * Prompt → LLM → JSON → validated LessonPlan, with one corrective retry.
 * Kept separate from server.ts so it can be tested with a stub provider.
 */

import type { AIProvider, ProviderMessage } from './providers/types';
import { buildTeachPrompt } from './prompts/teacher';
import { parseLessonPlan } from '../src/lesson/schema';
import type { LessonPlan } from '../src/router/types';

// =============================================================================
// JSON EXTRACTION
// LLMs sometimes wrap JSON in markdown fences or add a sentence around it.
// =============================================================================

export function extractJSON(text: string): string {
  const trimmed = text.trim();

  // Whole response is one ```json ... ``` block
  const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  if (fenced) return fenced[1].trim();

  if (trimmed.startsWith('{')) return trimmed;

  // Fallback: prose around the object — take the outermost braces
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first !== -1 && last > first) return trimmed.slice(first, last + 1);

  return trimmed;
}

type Attempt = { ok: true; plan: LessonPlan } | { ok: false; error: string };

function parseResponse(text: string): Attempt {
  let raw: unknown;
  try {
    raw = JSON.parse(extractJSON(text));
  } catch {
    return { ok: false, error: 'response was not valid JSON' };
  }
  return parseLessonPlan(raw);
}

// =============================================================================
// GENERATE
// =============================================================================

export type GenerateResult =
  | { ok: true; plan: LessonPlan; attempts: number }
  | { ok: false; error: string; attempts: number };

export async function generateLessonPlan(
  provider: AIProvider,
  userInput: string,
  inputType: 'concept' | 'code',
): Promise<GenerateResult> {
  const { system, user } = buildTeachPrompt(userInput, inputType);
  const messages: ProviderMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];

  const first = await provider.complete(messages);
  const firstAttempt = parseResponse(first.text);
  if (firstAttempt.ok) return { ...firstAttempt, attempts: 1 };

  console.error(`[Teach] Invalid lesson plan: ${firstAttempt.error}`);
  console.error('[Teach] Raw:', first.text.slice(0, 500));
  console.log('[Teach] Retrying with validation feedback...');

  const retry = await provider.complete([
    ...messages,
    { role: 'assistant', content: first.text },
    {
      role: 'user',
      content:
        `Your lesson plan was rejected: ${firstAttempt.error}. ` +
        'Fix these problems and return ONLY the corrected raw JSON object. ' +
        'Start with { and end with }. No markdown wrapping.',
    },
  ]);
  const retryAttempt = parseResponse(retry.text);
  if (retryAttempt.ok) return { ...retryAttempt, attempts: 2 };

  console.error(`[Teach] Retry also invalid: ${retryAttempt.error}`);
  return { ok: false, error: retryAttempt.error, attempts: 2 };
}
