/**
 * Study AI — Linked List Simulators
 * ====================================
 * Generator functions for linked list algorithms.
 *
 * The reference video (find middle) shows:
 * - slow/fast pointer labels with arrows pointing at nodes
 * - Pointers slide smoothly along the chain
 * - Multiple examples (odd-length then even-length)
 */

import type { SimEvent } from './events';

// =============================================================================
// FIND MIDDLE NODE (slow/fast pointer technique)
// =============================================================================

/**
 * Floyd's tortoise approach: slow moves 1, fast moves 2.
 * When fast reaches end, slow is at middle.
 */
export function* findMiddle(values: number[]): Generator<SimEvent> {
  const n = values.length;
  if (n === 0) { yield { type: 'll.done' }; return; }

  yield { type: 'phase.start', name: 'setup',
          explanation: `We have a linked list [${values.join(' → ')}]. We'll use two pointers: slow and fast, both starting at node ${values[0]}` };
  yield { type: 'phase.end', name: 'setup' };

  let slow = 0;
  let fast = 0;

  yield { type: 'phase.start', name: 'walk',
          explanation: 'slow moves 1 step at a time, fast moves 2 steps' };

  while (fast < n - 1) {
    // Check if fast can move 2 steps
    if (fast + 2 >= n) {
      // fast can only go to end or past it
      const newFast = Math.min(fast + 2, n);
      if (newFast >= n) {
        yield { type: 'll.pointer_off_end', name: 'fast' };
      } else {
        yield { type: 'll.move_pointer', name: 'fast', fromIndex: fast, toIndex: newFast };
      }
      fast = newFast;

      // slow moves 1
      const newSlow = slow + 1;
      yield { type: 'll.move_pointer', name: 'slow', fromIndex: slow, toIndex: newSlow };
      slow = newSlow;
      break;
    }

    // fast moves 2
    const newFast = fast + 2;
    yield { type: 'll.move_pointer', name: 'fast', fromIndex: fast, toIndex: newFast };
    fast = newFast;

    // slow moves 1
    const newSlow = slow + 1;
    yield { type: 'll.move_pointer', name: 'slow', fromIndex: slow, toIndex: newSlow };
    slow = newSlow;

    // Check if fast reached end
    if (fast >= n - 1) break;
  }

  yield { type: 'phase.end', name: 'walk' };

  yield { type: 'll.highlight_node', index: slow, color: '#9ece6a' };
  yield { type: 'll.found_result', index: slow, value: values[slow] };
  yield { type: 'll.done' };
}

// =============================================================================
// REVERSE LINKED LIST
// =============================================================================

/**
 * Iterative reversal using prev/current/next pointers.
 * Now emits ll.reverse_arrow events so arrows visually flip direction.
 */
export function* reverseList(values: number[]): Generator<SimEvent> {
  const n = values.length;
  if (n <= 1) { yield { type: 'll.done' }; return; }

  yield { type: 'phase.start', name: 'setup',
          explanation: `Reverse [${values.join(' → ')}] using prev, current, and next pointers` };
  yield { type: 'phase.end', name: 'setup' };

  let prev = -1;
  let current = 0;

  yield { type: 'phase.start', name: 'reverse',
          explanation: 'For each node: save next, reverse the link, then advance pointers' };

  for (let step = 0; step < n; step++) {
    const next = current + 1 < n ? current + 1 : -1;

    // Highlight current node
    yield { type: 'll.highlight_node', index: current, color: '#ff9e64' };

    // Step 1: save next pointer
    if (next >= 0) {
      yield { type: 'll.move_pointer', name: 'next', fromIndex: next, toIndex: next };
    }

    // Step 2: REVERSE THE LINK — current.next = prev
    // This is the key visual: the arrow flips direction
    if (prev >= 0) {
      yield { type: 'll.reverse_arrow', fromIndex: prev, toIndex: current };
    }
    yield { type: 'll.highlight_node', index: current, color: '#73daca' };

    // Step 3: advance prev = current
    if (prev >= 0) {
      yield { type: 'll.unhighlight_node', index: prev };
    }
    yield { type: 'll.move_pointer', name: 'prev',
            fromIndex: prev >= 0 ? prev : 0, toIndex: current };

    // Step 4: advance current = next
    prev = current;
    if (next >= 0) {
      yield { type: 'll.move_pointer', name: 'current',
              fromIndex: current, toIndex: next };
      current = next;
    } else {
      yield { type: 'll.pointer_off_end', name: 'current' };
      yield { type: 'll.pointer_off_end', name: 'next' };
      break;
    }
  }

  yield { type: 'phase.end', name: 'reverse' };

  yield { type: 'll.highlight_node', index: n - 1, color: '#9ece6a' };
  yield { type: 'll.found_result', index: n - 1, value: values[n - 1] };
  yield { type: 'll.done' };
}

// =============================================================================
// DETECT CYCLE (Floyd's)
// =============================================================================

export function* detectCycle(values: number[], cycleAt?: number): Generator<SimEvent> {
  const n = values.length;
  const hasCycle = cycleAt !== undefined && cycleAt >= 0 && cycleAt < n;

  yield { type: 'phase.start', name: 'setup',
          explanation: `Check if the linked list has a cycle using slow/fast pointers` };
  yield { type: 'phase.end', name: 'setup' };

  let slow = 0;
  let fast = 0;
  let step = 0;
  const maxSteps = n * 3; // safety limit

  yield { type: 'phase.start', name: 'detect',
          explanation: 'If fast and slow ever meet, there is a cycle' };

  while (step < maxSteps) {
    step++;

    // slow moves 1
    const nextSlow = hasCycle && slow === n - 1 ? cycleAt : slow + 1;
    if (!hasCycle && nextSlow >= n) {
      yield { type: 'll.pointer_off_end', name: 'slow' };
      break;
    }
    yield { type: 'll.move_pointer', name: 'slow', fromIndex: slow, toIndex: nextSlow };
    slow = nextSlow;

    // fast moves 2
    for (let m = 0; m < 2; m++) {
      const nextFast = hasCycle && fast === n - 1 ? cycleAt : fast + 1;
      if (!hasCycle && nextFast >= n) {
        yield { type: 'll.pointer_off_end', name: 'fast' };
        yield { type: 'phase.end', name: 'detect' };
        yield { type: 'll.found_result', index: -1, value: -1 }; // no cycle
        yield { type: 'll.done' };
        return;
      }
      yield { type: 'll.move_pointer', name: 'fast', fromIndex: fast, toIndex: nextFast };
      fast = nextFast;
    }

    // Check if they met
    if (slow === fast) {
      yield { type: 'll.highlight_node', index: slow, color: '#f7768e' };
      yield { type: 'phase.end', name: 'detect' };
      yield { type: 'll.found_result', index: slow, value: values[slow] };
      yield { type: 'll.done' };
      return;
    }
  }

  yield { type: 'phase.end', name: 'detect' };
  yield { type: 'll.done' };
}