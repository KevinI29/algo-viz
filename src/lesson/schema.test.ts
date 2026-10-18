/**
 * Study AI — LessonPlan Validation Tests
 */

import { describe, it, expect } from 'vitest';
import { parseLessonPlan, LESSON_CAPS } from './schema';
import { SIMULATOR_CATALOG, SIMULATOR_IDS } from './catalog';
import { getSimulator } from '../simulator/registry';

// =============================================================================
// FIXTURES
// =============================================================================

function basePlan(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    simulator: 'sorting.bubble',
    visualTemplate: 'sorting',
    codePosition: 'alongside',
    concept: 'Bubble Sort',
    category: 'sorting',
    textOnly: false,
    exampleData: { type: 'sorting', array: [5, 3, 8, 1] },
    code: { source: 'def bubble_sort(a): ...', language: 'python' },
    title: 'How does it work?',
    setupExplanation: 'Swap adjacent elements until sorted.',
    phaseExplanations: { pass_1: 'Compare 5 and 3.' },
    insightText: 'O(n²).',
    complexityNote: 'O(n²) time, O(1) space',
    ...overrides,
  };
}

function expectOk(raw: unknown) {
  const result = parseLessonPlan(raw);
  if (!result.ok) throw new Error(`expected ok, got: ${result.error}`);
  return result.plan;
}

function expectError(raw: unknown, pattern?: RegExp) {
  const result = parseLessonPlan(raw);
  expect(result.ok).toBe(false);
  if (!result.ok && pattern) expect(result.error).toMatch(pattern);
}

const tree = (depth: number, id = 'n'): Record<string, unknown> =>
  depth === 1
    ? { id, value: 1 }
    : { id, value: depth, left: tree(depth - 1, `${id}l`), right: tree(depth - 1, `${id}r`) };

// =============================================================================
// VALID PLANS
// =============================================================================

describe('valid plans', () => {
  it('accepts a sorting plan', () => {
    const plan = expectOk(basePlan());
    expect(plan.simulator).toBe('sorting.bubble');
    expect(plan.exampleData).toEqual({ type: 'sorting', array: [5, 3, 8, 1] });
  });

  it('accepts a tree plan and normalises null children', () => {
    const plan = expectOk(basePlan({
      simulator: 'tree.bfs',
      visualTemplate: 'tree',
      exampleData: { type: 'tree', root: { id: 'n1', value: 1, left: { id: 'n2', value: 2 }, right: null } },
    }));
    expect(plan.exampleData).toEqual({ type: 'tree', root: { id: 'n1', value: 1, left: { id: 'n2', value: 2 } } });
  });

  it('fills missing and duplicate tree ids', () => {
    const plan = expectOk(basePlan({
      simulator: 'tree.bfs',
      exampleData: { type: 'tree', root: { value: 5, left: { value: 5 }, right: { id: 'x', value: 7 } } },
    }));
    const root = plan.exampleData?.type === 'tree' ? plan.exampleData.root : null;
    const ids = [root?.id, root?.left?.id, root?.right?.id];
    expect(new Set(ids).size).toBe(3);
    expect(ids.every(Boolean)).toBe(true);
  });

  it('accepts a linked-list plan and defaults pointers', () => {
    const plan = expectOk(basePlan({
      simulator: 'linked_list.reverse',
      exampleData: { type: 'linked_list', values: [1, 2, 3] },
    }));
    expect(plan.exampleData).toEqual({ type: 'linked_list', values: [1, 2, 3], pointers: {} });
  });

  it('accepts a stack plan with additional examples', () => {
    const plan = expectOk(basePlan({
      simulator: 'stack.valid_parentheses',
      exampleData: { type: 'stack', input: '(())' },
      additionalExamples: [{ label: 'Unbalanced', data: { type: 'stack', input: '(()' } }],
    }));
    expect(plan.additionalExamples).toEqual([{ label: 'Unbalanced', data: { type: 'stack', input: '(()' } }]);
  });

  it('accepts a text-only plan and ignores its example data', () => {
    const plan = expectOk(basePlan({
      simulator: null,
      textOnly: true,
      codePosition: 'none',
      exampleData: { anything: 'goes' },
    }));
    expect(plan.simulator).toBeNull();
    expect(plan.exampleData).toBeUndefined();
  });

  it('treats a missing simulator as text-only', () => {
    const raw = basePlan();
    delete raw.simulator;
    expect(expectOk(raw).simulator).toBeNull();
  });
});

// =============================================================================
// DERIVED / LENIENT FIELDS
// =============================================================================

describe('derived and lenient fields', () => {
  it('derives visualTemplate from the simulator, ignoring the LLM', () => {
    const plan = expectOk(basePlan({ visualTemplate: 'tree' }));
    expect(plan.visualTemplate).toBe('sorting');
  });

  it('falls back on bad cosmetic fields', () => {
    const plan = expectOk(basePlan({ category: 'graphs', codePosition: 'sideways', title: 42 }));
    expect(plan.category).toBe('general');
    expect(plan.codePosition).toBe('after');
    expect(plan.title).toBe('Bubble Sort');
  });

  it('drops a malformed code block instead of failing', () => {
    expect(expectOk(basePlan({ code: 'def f(): pass' })).code).toBeUndefined();
  });
});

// =============================================================================
// REJECTIONS
// =============================================================================

describe('rejections', () => {
  it.each([null, 'a string', 42, [], undefined])('rejects non-object input %j', raw => {
    expectError(raw);
  });

  it('rejects a missing concept', () => {
    expectError(basePlan({ concept: '' }), /concept/);
  });

  it('rejects an unknown simulator', () => {
    expectError(basePlan({ simulator: 'graph.dijkstra' }), /unknown id "graph\.dijkstra"/);
  });

  it('rejects data that does not match the simulator', () => {
    expectError(basePlan({ exampleData: { type: 'stack', input: '()' } }), /needs "sorting" data/);
  });

  it('rejects a simulator plan without example data', () => {
    expectError(basePlan({ exampleData: undefined }), /exampleData/);
  });

  it('rejects a bad additional example', () => {
    expectError(
      basePlan({ additionalExamples: [{ label: 'x', data: { type: 'sorting', array: [1] } }] }),
      /additionalExamples\.0\.data/,
    );
  });
});

describe('size caps', () => {
  const C = LESSON_CAPS;

  it('rejects too many sorting values', () => {
    const array = Array.from({ length: C.sortingMaxLength + 1 }, (_, i) => i);
    expectError(basePlan({ exampleData: { type: 'sorting', array } }), /array/);
  });

  it('accepts exactly the max sorting length', () => {
    const array = Array.from({ length: C.sortingMaxLength }, (_, i) => i);
    expectOk(basePlan({ exampleData: { type: 'sorting', array } }));
  });

  it('rejects out-of-range and non-integer sorting values', () => {
    expectError(basePlan({ exampleData: { type: 'sorting', array: [1, C.sortingMaxValue + 1] } }));
    expectError(basePlan({ exampleData: { type: 'sorting', array: [1, -1] } }));
    expectError(basePlan({ exampleData: { type: 'sorting', array: [1, 2.5] } }));
  });

  it('rejects a tree deeper than the cap', () => {
    expectError(
      basePlan({ simulator: 'tree.bfs', exampleData: { type: 'tree', root: tree(C.treeMaxDepth + 1) } }),
      /depth/,
    );
  });

  it('accepts a full tree at the max depth', () => {
    expectOk(basePlan({ simulator: 'tree.bfs', exampleData: { type: 'tree', root: tree(C.treeMaxDepth) } }));
  });

  it('rejects a linked list longer than the cap', () => {
    const values = Array.from({ length: C.linkedListMaxLength + 1 }, (_, i) => i);
    expectError(basePlan({ simulator: 'linked_list.reverse', exampleData: { type: 'linked_list', values } }));
  });

  it('rejects cycleAt and pointers outside the list', () => {
    expectError(
      basePlan({ simulator: 'linked_list.detect_cycle', exampleData: { type: 'linked_list', values: [1, 2], cycleAt: 2 } }),
      /cycleAt/,
    );
    expectError(
      basePlan({ simulator: 'linked_list.find_middle', exampleData: { type: 'linked_list', values: [1, 2], pointers: { slow: 5 } } }),
      /pointer slow/,
    );
  });

  it('rejects a stack input longer than the cap', () => {
    expectError(basePlan({
      simulator: 'stack.valid_parentheses',
      exampleData: { type: 'stack', input: '('.repeat(C.stackInputMaxLength + 1) },
    }));
  });

  it('rejects too many additional examples', () => {
    const ex = { label: 'x', data: { type: 'sorting', array: [2, 1] } };
    expectError(basePlan({ additionalExamples: Array(C.additionalExamplesMax + 1).fill(ex) }), /additionalExamples/);
  });

  it('rejects an oversized concept', () => {
    expectError(basePlan({ concept: 'x'.repeat(201) }), /concept/);
  });

  it('truncates oversized explanations', () => {
    const plan = expectOk(basePlan({ setupExplanation: 'x'.repeat(C.textMaxLength + 50) }));
    expect(plan.setupExplanation).toHaveLength(C.textMaxLength);
  });

  it('drops an oversized code block instead of failing the plan', () => {
    const plan = expectOk(basePlan({ code: { source: 'x'.repeat(C.codeMaxLength + 1), language: 'python' } }));
    expect(plan.code).toBeUndefined();
  });
});

// =============================================================================
// CATALOG ↔ REGISTRY
// =============================================================================

describe('catalog', () => {
  it.each(SIMULATOR_IDS)('%s matches the registry data type', id => {
    expect(getSimulator(id)?.dataType).toBe(SIMULATOR_CATALOG[id].dataType);
  });
});
