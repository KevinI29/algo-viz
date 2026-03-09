/**
 * Study AI — Simulator Registry
 * ===============================
 * Maps simulator names (from LessonPlan.simulator) to generator functions.
 * Each entry knows what data shape it expects and which generator to run.
 */

import type { SimEvent } from './events';
import type {
  SortingData, TreeData, LinkedListData, StackData,
} from '../router/types';
import { bubbleSort, insertionSort, selectionSort } from './sorting';
import { bfs, dfsPreorder, dfsInorder } from './tree-traversal';
import { findMiddle, reverseList, detectCycle } from './linked-list';
import { validParentheses, evaluatePostfix } from './stack-queue';

// =============================================================================
// REGISTRY TYPE
// =============================================================================

type SimulatorEntry = {
  name: string;
  dataType: string;                           // must match exampleData.type
  run: (data: any) => Generator<SimEvent>;    // generator factory
};

// =============================================================================
// THE REGISTRY
// =============================================================================

const registry: Record<string, SimulatorEntry> = {
  // Sorting
  'sorting.bubble': {
    name: 'Bubble Sort',
    dataType: 'sorting',
    run: (data: SortingData) => bubbleSort(data.array),
  },
  'sorting.insertion': {
    name: 'Insertion Sort',
    dataType: 'sorting',
    run: (data: SortingData) => insertionSort(data.array),
  },
  'sorting.selection': {
    name: 'Selection Sort',
    dataType: 'sorting',
    run: (data: SortingData) => selectionSort(data.array),
  },

  // Tree Traversal
  'tree.bfs': {
    name: 'BFS (Breadth-First Search)',
    dataType: 'tree',
    run: (data: TreeData) => bfs(data.root),
  },
  'tree.dfs_preorder': {
    name: 'DFS Pre-order',
    dataType: 'tree',
    run: (data: TreeData) => dfsPreorder(data.root),
  },
  'tree.dfs_inorder': {
    name: 'DFS In-order',
    dataType: 'tree',
    run: (data: TreeData) => dfsInorder(data.root),
  },

  // Linked List
  'linked_list.find_middle': {
    name: 'Find Middle Node',
    dataType: 'linked_list',
    run: (data: LinkedListData) => findMiddle(data.values),
  },
  'linked_list.reverse': {
    name: 'Reverse Linked List',
    dataType: 'linked_list',
    run: (data: LinkedListData) => reverseList(data.values),
  },
  'linked_list.detect_cycle': {
    name: 'Detect Cycle',
    dataType: 'linked_list',
    run: (data: LinkedListData) => detectCycle(data.values),
  },

  // Stack / Queue
  'stack.valid_parentheses': {
    name: 'Valid Parentheses',
    dataType: 'stack',
    run: (data: StackData) => validParentheses(data.input),
  },
  'stack.evaluate_postfix': {
    name: 'Evaluate Postfix',
    dataType: 'stack',
    run: (data: StackData) => evaluatePostfix(data.input.split(' ')),
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Look up a simulator by name.
 * Returns null if not found.
 */
export function getSimulator(name: string): SimulatorEntry | null {
  return registry[name] ?? null;
}

/**
 * Check if a simulator exists for a given name.
 */
export function hasSimulator(name: string): boolean {
  return name in registry;
}

/**
 * List all registered simulator names.
 */
export function listSimulators(): string[] {
  return Object.keys(registry);
}