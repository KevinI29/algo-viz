/**
 * algo.viz — Lesson Plan Generation Tests (stub provider, no network)
 */

import { describe, it, expect } from 'vitest';
import { extractJSON, generateLessonPlan } from './teach';
import type { AIProvider, ProviderMessage } from './providers/types';

const VALID_PLAN = {
  simulator: 'sorting.bubble',
  visualTemplate: 'sorting',
  codePosition: 'alongside',
  concept: 'Bubble Sort',
  category: 'sorting',
  exampleData: { type: 'sorting', array: [4, 2, 6] },
  title: 'Bubble Sort',
  setupExplanation: 'Swap neighbours.',
  insightText: 'O(n²).',
};

/** Provider that replays canned responses and records every call. */
function stubProvider(responses: string[]) {
  const calls: ProviderMessage[][] = [];
  const provider: AIProvider = {
    name: 'stub',
    model: 'stub-1',
    async complete(messages) {
      calls.push(messages);
      const text = responses[calls.length - 1];
      if (text === undefined) throw new Error('unexpected extra call');
      return { text, model: 'stub-1', provider: 'stub' };
    },
  };
  return { provider, calls };
}

describe('extractJSON', () => {
  it.each([
    ['{"a":1}', '{"a":1}'],
    ['```json\n{"a":1}\n```', '{"a":1}'],
    ['```\n{"a":1}\n```', '{"a":1}'],
    ['Here is the plan:\n{"a":1}\nHope it helps!', '{"a":1}'],
    ['no json here', 'no json here'],
  ])('%j → %j', (input, expected) => {
    expect(extractJSON(input)).toBe(expected);
  });
});

describe('generateLessonPlan', () => {
  it('returns a valid plan on the first attempt', async () => {
    const { provider, calls } = stubProvider([JSON.stringify(VALID_PLAN)]);
    const result = await generateLessonPlan(provider, 'Bubble Sort', 'concept');
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(1);
    expect(calls).toHaveLength(1);
  });

  it('retries with the validation error and accepts the fix', async () => {
    const bad = JSON.stringify({ ...VALID_PLAN, simulator: 'graph.dijkstra' });
    const { provider, calls } = stubProvider([bad, JSON.stringify(VALID_PLAN)]);

    const result = await generateLessonPlan(provider, 'Bubble Sort', 'concept');

    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(2);
    const retryMessages = calls[1];
    expect(retryMessages.at(-2)).toEqual({ role: 'assistant', content: bad });
    expect(retryMessages.at(-1)?.content).toMatch(/unknown id "graph\.dijkstra"/);
  });

  it('retries on non-JSON output', async () => {
    const { provider, calls } = stubProvider(['Sorry, I cannot.', JSON.stringify(VALID_PLAN)]);
    const result = await generateLessonPlan(provider, 'Bubble Sort', 'concept');
    expect(result.ok).toBe(true);
    expect(calls[1].at(-1)?.content).toMatch(/not valid JSON/);
  });

  it('gives up after one retry', async () => {
    const bad = JSON.stringify({ ...VALID_PLAN, exampleData: { type: 'sorting', array: [] } });
    const { provider, calls } = stubProvider([bad, bad]);
    const result = await generateLessonPlan(provider, 'Bubble Sort', 'concept');
    expect(result.ok).toBe(false);
    expect(calls).toHaveLength(2);
  });

  it('never returns the LLM template when it disagrees with the simulator', async () => {
    const { provider } = stubProvider([JSON.stringify({ ...VALID_PLAN, visualTemplate: 'stack' })]);
    const result = await generateLessonPlan(provider, 'Bubble Sort', 'concept');
    expect(result.ok && result.plan.visualTemplate).toBe('sorting');
  });
});
