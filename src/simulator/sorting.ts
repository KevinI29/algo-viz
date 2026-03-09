/**
 * Study AI — Sorting Simulators
 * ===============================
 * Generator functions that run real sorting algorithms and yield SimEvents.
 * Each event maps to a visual transition in the sorting template.
 *
 * Every simulator:
 * - Takes a number[] and yields SimEvent
 * - Never mutates the input (works on a copy)
 * - Yields events in the exact order the video reference shows
 * - Includes line numbers matching the generated Python code
 */

import type { SimEvent } from './events';

// =============================================================================
// BUBBLE SORT
// =============================================================================

/**
 * Bubble sort with temp-variable swap pattern.
 * Matches the reference video: lift → slide → drop for each swap.
 *
 * Generated Python code this maps to:
 *   1: def bubble_sort(my_list):
 *   2:     for i in range(len(my_list) - 1, 0, -1):
 *   3:         for j in range(i):
 *   4:             if my_list[j] > my_list[j+1]:
 *   5:                 temp = my_list[j]
 *   6:                 my_list[j] = my_list[j+1]
 *   7:                 my_list[j+1] = temp
 *   8:     return my_list
 */
export function* bubbleSort(input: number[]): Generator<SimEvent> {
  const a = [...input];
  const n = a.length;

  for (let i = n - 1; i > 0; i--) {
    const passNum = n - i;
    yield { type: 'phase.start', name: `pass_${passNum}`,
            explanation: `Pass ${passNum}: bubble the next largest element into place` };

    for (let j = 0; j < i; j++) {
      yield { type: 'sort.compare', indices: [j, j + 1], line: 4 };

      if (a[j] > a[j + 1]) {
        // temp = my_list[j]
        yield { type: 'sort.lift_to_temp', index: j, value: a[j], line: 5 };
        // my_list[j] = my_list[j+1]
        yield { type: 'sort.slide', fromIndex: j + 1, toIndex: j, value: a[j + 1], line: 6 };
        // my_list[j+1] = temp
        const temp = a[j];
        a[j] = a[j + 1];
        a[j + 1] = temp;
        yield { type: 'sort.drop_from_temp', index: j + 1, value: a[j + 1], line: 7 };
      }
    }

    yield { type: 'sort.mark_sorted', index: i };
    yield { type: 'sort.pass_done', passNumber: passNum };
    yield { type: 'phase.end', name: `pass_${passNum}` };
  }

  // First element is sorted by elimination
  yield { type: 'sort.mark_sorted', index: 0 };
  yield { type: 'sort.done' };
}

// =============================================================================
// INSERTION SORT
// =============================================================================

/**
 * Insertion sort — picks a key, shifts elements right, inserts key.
 *
 * Generated Python code:
 *   1: def insertion_sort(my_list):
 *   2:     for i in range(1, len(my_list)):
 *   3:         key = my_list[i]
 *   4:         j = i - 1
 *   5:         while j >= 0 and my_list[j] > key:
 *   6:             my_list[j+1] = my_list[j]
 *   7:             j -= 1
 *   8:         my_list[j+1] = key
 *   9:     return my_list
 */
export function* insertionSort(input: number[]): Generator<SimEvent> {
  const a = [...input];
  const n = a.length;

  // Index 0 is "sorted" from the start
  yield { type: 'sort.mark_sorted', index: 0 };

  for (let i = 1; i < n; i++) {
    const passNum = i;
    yield { type: 'phase.start', name: `pass_${passNum}`,
            explanation: `Insert ${a[i]} into its correct position in the sorted section` };

    const key = a[i];
    // Lift the key out
    yield { type: 'sort.lift_to_temp', index: i, value: key, line: 3 };

    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      yield { type: 'sort.compare', indices: [j, j + 1], line: 5 };
      // Shift element right
      yield { type: 'sort.slide', fromIndex: j, toIndex: j + 1, value: a[j], line: 6 };
      a[j + 1] = a[j];
      j--;
    }

    // Drop key into correct position
    a[j + 1] = key;
    yield { type: 'sort.drop_from_temp', index: j + 1, value: key, line: 8 };

    // Mark all elements up to i as sorted
    for (let k = 0; k <= i; k++) {
      yield { type: 'sort.mark_sorted', index: k };
    }

    yield { type: 'sort.pass_done', passNumber: passNum };
    yield { type: 'phase.end', name: `pass_${passNum}` };
  }

  yield { type: 'sort.done' };
}

// =============================================================================
// SELECTION SORT
// =============================================================================

/**
 * Selection sort — find minimum, swap into position.
 *
 * Generated Python code:
 *   1: def selection_sort(my_list):
 *   2:     for i in range(len(my_list) - 1):
 *   3:         min_idx = i
 *   4:         for j in range(i + 1, len(my_list)):
 *   5:             if my_list[j] < my_list[min_idx]:
 *   6:                 min_idx = j
 *   7:         if min_idx != i:
 *   8:             temp = my_list[i]
 *   9:             my_list[i] = my_list[min_idx]
 *  10:             my_list[min_idx] = temp
 *  11:     return my_list
 */
export function* selectionSort(input: number[]): Generator<SimEvent> {
  const a = [...input];
  const n = a.length;

  for (let i = 0; i < n - 1; i++) {
    const passNum = i + 1;
    yield { type: 'phase.start', name: `pass_${passNum}`,
            explanation: `Find the smallest unsorted element and place it at position ${i}` };

    let minIdx = i;

    for (let j = i + 1; j < n; j++) {
      yield { type: 'sort.compare', indices: [j, minIdx], line: 5 };
      if (a[j] < a[minIdx]) {
        minIdx = j;
      }
    }

    if (minIdx !== i) {
      yield { type: 'sort.lift_to_temp', index: i, value: a[i], line: 8 };
      yield { type: 'sort.slide', fromIndex: minIdx, toIndex: i, value: a[minIdx], line: 9 };
      const temp = a[i];
      a[i] = a[minIdx];
      a[minIdx] = temp;
      yield { type: 'sort.drop_from_temp', index: minIdx, value: a[minIdx], line: 10 };
    }

    yield { type: 'sort.mark_sorted', index: i };
    yield { type: 'sort.pass_done', passNumber: passNum };
    yield { type: 'phase.end', name: `pass_${passNum}` };
  }

  // Last element sorted by elimination
  yield { type: 'sort.mark_sorted', index: n - 1 };
  yield { type: 'sort.done' };
}
