/**
 * Study AI — Simulator Registry
 * ===============================
 * Maps simulator names (from LessonPlan.simulator) to generator functions.
 * Each entry knows what data shape it expects and which generator to run.
 */

import type { SimEvent } from './events';
import type {
  DataType, ExampleData, SimulatorId,
  SortingData, TreeData, LinkedListData, StackData,
} from '../router/types';
import { bubbleSort, insertionSort, selectionSort } from './sorting';
import { bfs, dfsPreorder, dfsInorder } from './tree-traversal';
import { findMiddle, reverseList, detectCycle } from './linked-list';
import { validParentheses, evaluatePostfix } from './stack-queue';

// =============================================================================
// REGISTRY TYPE
// =============================================================================

type DataFor<T extends DataType> = Extract<ExampleData, { type: T }>;

type TypedEntry<T extends DataType> = {
  name: string;
  dataType: T;                                     // must match exampleData.type
  run: (data: DataFor<T>) => Generator<SimEvent>;  // generator factory
};

export type SimulatorEntry = { [T in DataType]: TypedEntry<T> }[DataType];

// =============================================================================
// THE REGISTRY
// =============================================================================

const registry: Record<SimulatorId, SimulatorEntry> = {
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
  return hasSimulator(name) ? registry[name] : null;
}

/**
 * Check if a simulator exists for a given name.
 * Uses an own-property check so prototype keys like "toString" don't match.
 */
export function hasSimulator(name: string): name is SimulatorId {
  return Object.hasOwn(registry, name);
}

/**
 * Run a simulator on data whose type has already been checked against
 * entry.dataType. TypeScript can't correlate the two unions, hence the cast.
 */
export function runEntry(entry: SimulatorEntry, data: ExampleData): Generator<SimEvent> {
  if (data.type !== entry.dataType) {
    throw new Error(`Data type mismatch: expected ${entry.dataType}, got ${data.type}`);
  }
  return (entry.run as (d: ExampleData) => Generator<SimEvent>)(data);
}

/**
 * List all registered simulator names.
 */
export function listSimulators(): string[] {
  return Object.keys(registry);
}