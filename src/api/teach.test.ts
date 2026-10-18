/**
 * Study AI — /api/teach Client Tests (fetch mocked)
 */

import { afterEach, describe, it, expect, vi } from 'vitest';
import { fetchLessonPlan } from './teach';

function mockFetch(body: unknown, status = 200) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchLessonPlan', () => {
  it('returns a validated plan', async () => {
    mockFetch({
      simulator: 'sorting.bubble',
      visualTemplate: 'tree',
      codePosition: 'alongside',
      concept: 'Bubble Sort',
      category: 'sorting',
      exampleData: { type: 'sorting', array: [3, 1, 2] },
      setupExplanation: 'Swap.',
      insightText: 'O(n²).',
    });
    const result = await fetchLessonPlan('Bubble Sort', 'concept');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.plan.visualTemplate).toBe('sorting');
  });

  it('turns a malformed plan into a friendly error', async () => {
    mockFetch({ simulator: 'sorting.bubble', concept: 'Bubble Sort', exampleData: { type: 'sorting', array: 'oops' } });
    const result = await fetchLessonPlan('Bubble Sort', 'concept');
    expect(result).toEqual({ ok: false, error: 'Received an invalid lesson plan. Please try again.' });
  });

  it('surfaces the server error message on non-2xx', async () => {
    mockFetch({ error: 'The AI returned an invalid lesson plan. Please try again.' }, 502);
    const result = await fetchLessonPlan('Bubble Sort', 'concept');
    expect(result).toEqual({ ok: false, error: 'The AI returned an invalid lesson plan. Please try again.' });
  });
});
