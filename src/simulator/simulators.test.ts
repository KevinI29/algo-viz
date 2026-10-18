/**
 * Study AI — Simulator Tests
 * ============================
 * Simulators → SimEvents, plus the registry and runner.
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import { bubbleSort, insertionSort, selectionSort } from './sorting';
import { bfs } from './tree-traversal';
import { findMiddle } from './linked-list';
import { validParentheses } from './stack-queue';
import { collectEvents, runSimulator } from './runner';
import { getSimulator, hasSimulator, listSimulators } from './registry';
import type { SimEvent } from './events';
import type { TreeNodeData } from '../router/types';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Replay sort events on a copy of the input, the way the sorting template
 * animates them: lift copies a value into temp, slide copies one slot to
 * another, drop writes temp back. Also checks each event's `value` matches
 * what the replay sees, so the animation can't show a different number.
 */
function replaySort(input: number[], events: SimEvent[]): number[] {
  const arr = [...input];
  let temp: number | null = null;

  for (const e of events) {
    switch (e.type) {
      case 'sort.lift_to_temp':
        expect(e.value).toBe(arr[e.index]);
        temp = arr[e.index];
        break;
      case 'sort.slide':
        expect(e.value).toBe(arr[e.fromIndex]);
        arr[e.toIndex] = arr[e.fromIndex];
        break;
      case 'sort.drop_from_temp':
        expect(temp).not.toBeNull();
        expect(e.value).toBe(temp);
        arr[e.index] = temp!;
        temp = null;
        break;
    }
  }
  return arr;
}

const ascending = (a: number[]) => [...a].sort((x, y) => x - y);

const SORT_INPUTS: number[][] = [
  [4, 2, 6],
  [4, 2, 6, 5, 1, 3],
  [5, 3, 1, 4, 2],
  [3, 1, 4, 1, 5],
  [1, 2, 3, 4],
  [9, 7, 5, 3, 1],
  [2, 2, 1, 1],
  [7],
];

function eventsOfType<T extends SimEvent['type']>(events: SimEvent[], type: T) {
  return events.filter((e): e is Extract<SimEvent, { type: T }> => e.type === type);
}

// =============================================================================
// SORTING
// =============================================================================

describe('bubble sort', () => {
  const events = collectEvents(bubbleSort([4, 2, 6]));

  it('produces events', () => {
    expect(events.length).toBeGreaterThan(0);
  });

  it('emits every sort event type', () => {
    const types = new Set(events.map(e => e.type));
    for (const t of [
      'sort.compare', 'sort.lift_to_temp', 'sort.slide', 'sort.drop_from_temp',
      'sort.mark_sorted', 'sort.done', 'phase.start',
    ] as const) {
      expect(types.has(t)).toBe(true);
    }
  });

  it('compares at least twice for 3 elements', () => {
    expect(eventsOfType(events, 'sort.compare').length).toBeGreaterThanOrEqual(2);
  });

  it('produces many events for 6 elements', () => {
    expect(collectEvents(bubbleSort([4, 2, 6, 5, 1, 3])).length).toBeGreaterThan(20);
  });
});

describe('insertion sort', () => {
  const events = collectEvents(insertionSort([5, 3, 1, 4, 2]));

  it('produces events', () => {
    expect(events.length).toBeGreaterThan(0);
  });

  it('lifts the key, shifts, drops and finishes', () => {
    const types = new Set(events.map(e => e.type));
    expect(types.has('sort.lift_to_temp')).toBe(true);
    expect(types.has('sort.slide')).toBe(true);
    expect(types.has('sort.drop_from_temp')).toBe(true);
    expect(types.has('sort.done')).toBe(true);
  });
});

describe('selection sort', () => {
  const events = collectEvents(selectionSort([3, 1, 4, 1, 5]));

  it('produces events', () => {
    expect(events.length).toBeGreaterThan(0);
  });

  it('emits exactly one done event', () => {
    expect(eventsOfType(events, 'sort.done')).toHaveLength(1);
  });
});

describe('sort events replay to a sorted array', () => {
  const sorts = { bubbleSort, insertionSort, selectionSort };

  for (const [name, sort] of Object.entries(sorts)) {
    for (const input of SORT_INPUTS) {
      it(`${name}([${input.join(', ')}])`, () => {
        const events = collectEvents(sort(input));
        expect(replaySort(input, events)).toEqual(ascending(input));
      });
    }
  }
});

// =============================================================================
// TREE
// =============================================================================

describe('BFS', () => {
  const tree: TreeNodeData = {
    id: 'n47', value: 47,
    left: {
      id: 'n21', value: 21,
      left: { id: 'n18', value: 18 },
      right: { id: 'n27', value: 27 },
    },
    right: {
      id: 'n76', value: 76,
      left: { id: 'n52', value: 52 },
      right: { id: 'n82', value: 82 },
    },
  };
  const events = collectEvents(bfs(tree));

  it('produces events', () => {
    expect(events.length).toBeGreaterThan(0);
  });

  it('emits every tree event type', () => {
    const types = new Set(events.map(e => e.type));
    for (const t of ['tree.enqueue', 'tree.dequeue', 'tree.visit', 'tree.add_result', 'tree.done'] as const) {
      expect(types.has(t)).toBe(true);
    }
  });

  it('visits in level order', () => {
    const order = eventsOfType(events, 'tree.add_result').map(e => e.value);
    expect(order).toEqual([47, 21, 76, 18, 27, 52, 82]);
  });
});

// =============================================================================
// LINKED LIST
// =============================================================================

describe('find middle', () => {
  const events5 = collectEvents(findMiddle([1, 2, 3, 4, 5]));

  it('produces events for an odd-length list', () => {
    expect(events5.length).toBeGreaterThan(0);
  });

  it('finds 3 as the middle of [1,2,3,4,5]', () => {
    const result = eventsOfType(events5, 'll.found_result')[0];
    expect(result).toBeDefined();
    expect(result.value).toBe(3);
  });

  it('finds 3 (second middle) for [1,2,3,4]', () => {
    const result = eventsOfType(collectEvents(findMiddle([1, 2, 3, 4])), 'll.found_result')[0];
    expect(result?.value).toBe(3);
  });

  it('moves pointers', () => {
    expect(eventsOfType(events5, 'll.move_pointer').length).toBeGreaterThanOrEqual(2);
  });
});

// =============================================================================
// STACK
// =============================================================================

describe('valid parentheses', () => {
  const resultFor = (input: string) =>
    eventsOfType(collectEvents(validParentheses(input)), 'stack.result')[0];

  it.each([
    ['(())', true],
    ['()()', true],
    ['(()', false],
    ['{[()]}', true],
  ])('"%s" balanced = %s', (input, balanced) => {
    expect(resultFor(input)?.balanced).toBe(balanced);
  });

  it('"(())" pushes twice and pops twice', () => {
    const events = collectEvents(validParentheses('(())'));
    expect(eventsOfType(events, 'stack.push')).toHaveLength(2);
    expect(eventsOfType(events, 'stack.pop')).toHaveLength(2);
  });
});

// =============================================================================
// REGISTRY
// =============================================================================

describe('registry', () => {
  it('registers all 11 simulators', () => {
    expect(listSimulators().length).toBeGreaterThanOrEqual(9);
    expect(listSimulators()).toHaveLength(11);
  });

  it.each(['sorting.bubble', 'tree.bfs', 'linked_list.find_middle', 'stack.valid_parentheses'])(
    'has %s', id => {
      expect(hasSimulator(id)).toBe(true);
    },
  );

  it('rejects unknown and prototype keys', () => {
    expect(hasSimulator('nonexistent')).toBe(false);
    expect(hasSimulator('toString')).toBe(false);
    expect(getSimulator('constructor')).toBeNull();
  });

  it('returns entries with their data type', () => {
    const sim = getSimulator('sorting.bubble');
    expect(sim).not.toBeNull();
    expect(sim!.dataType).toBe('sorting');
  });
});

// =============================================================================
// RUNNER
// =============================================================================

describe('runner', () => {
  it('runs a simulator', () => {
    const events = runSimulator('sorting.bubble', { type: 'sorting', array: [3, 1, 2] });
    expect(events).not.toBeNull();
    expect(events!.length).toBeGreaterThan(0);
  });

  it('returns null on data type mismatch', () => {
    const bad = runSimulator('sorting.bubble', { type: 'tree', root: { id: 'r', value: 1 } });
    expect(bad).toBeNull();
  });

  it('returns null for an unknown simulator', () => {
    expect(runSimulator('nonexistent', { type: 'sorting', array: [1] })).toBeNull();
  });
});
