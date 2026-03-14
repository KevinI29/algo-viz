/**
 * Study AI — Simulator Event Types
 * ==================================
 * This is the shared language between all simulators and the Pyodide trace compiler.
 * Every animation in the app is driven by a sequence of these events.
 *
 * RULES:
 * - Events are plain objects. No classes, no methods.
 * - Every event has a `type` string that uniquely identifies it.
 * - Events are namespaced by concept: sort.*, tree.*, ll.*, stack.*
 * - Universal events (phase.*, example.*) work across all concepts.
 * - The template mapper consumes these and produces AnimationFrames.
 */

// =============================================================================
// SORTING EVENTS
// =============================================================================

export type SortCompare = {
  type: 'sort.compare';
  indices: [number, number];   // the two indices being compared
  line?: number;               // source code line (1-based)
};

export type SortLiftToTemp = {
  type: 'sort.lift_to_temp';
  index: number;               // which array index the value is lifted from
  value: number;
  line?: number;
};

export type SortSlide = {
  type: 'sort.slide';
  fromIndex: number;
  toIndex: number;
  value: number;
  line?: number;
};

export type SortDropFromTemp = {
  type: 'sort.drop_from_temp';
  index: number;               // destination index
  value: number;
  line?: number;
};

export type SortMarkSorted = {
  type: 'sort.mark_sorted';
  index: number;
};

export type SortPassDone = {
  type: 'sort.pass_done';
  passNumber: number;
};

export type SortDone = {
  type: 'sort.done';
};

// =============================================================================
// TREE EVENTS
// =============================================================================

export type TreeEnqueue = {
  type: 'tree.enqueue';
  nodeId: string;
  value: number;
};

export type TreeDequeue = {
  type: 'tree.dequeue';
  nodeId: string;
  value: number;
};

export type TreeVisit = {
  type: 'tree.visit';
  nodeId: string;
  value: number;
};

export type TreeAddResult = {
  type: 'tree.add_result';
  value: number;
};

export type TreeCheckChild = {
  type: 'tree.check_child';
  parentId: string;
  childId: string | null;      // null = no child
  side: 'left' | 'right';
  value?: number;
};

export type TreeDone = {
  type: 'tree.done';
};

// =============================================================================
// LINKED LIST EVENTS
// =============================================================================

export type LLMovePointer = {
  type: 'll.move_pointer';
  name: string;                // "slow", "fast", "current", "prev"
  fromIndex: number;
  toIndex: number;
};

export type LLHighlightNode = {
  type: 'll.highlight_node';
  index: number;
  color?: string;
};

export type LLUnhighlightNode = {
  type: 'll.unhighlight_node';
  index: number;
};

export type LLFoundResult = {
  type: 'll.found_result';
  index: number;
  value: number;
};

export type LLReverseArrow = {
  type: 'll.reverse_arrow';
  fromIndex: number;          // the arrow originally went fromIndex → toIndex
  toIndex: number;            // now it should go toIndex → fromIndex
};

export type LLPointerOffEnd = {
  type: 'll.pointer_off_end';
  name: string;                // pointer that went past the last node
};

export type LLDone = {
  type: 'll.done';
};

// =============================================================================
// STACK EVENTS
// =============================================================================

export type StackScan = {
  type: 'stack.scan';
  charIndex: number;
  char: string;
};

export type StackPush = {
  type: 'stack.push';
  char: string;
  charIndex: number;           // position in input string
};

export type StackPop = {
  type: 'stack.pop';
  char: string;
};

export type StackMatch = {
  type: 'stack.match';
  openIndex: number;
  closeIndex: number;
};

export type StackNoMatch = {
  type: 'stack.no_match';
  closeIndex: number;
  expected?: string;
};

export type StackResult = {
  type: 'stack.result';
  balanced: boolean;
  reason?: string;             // "stack is empty" / "unmatched ( remaining"
};

export type StackDone = {
  type: 'stack.done';
};

// =============================================================================
// UNIVERSAL EVENTS — work across all concept types
// =============================================================================

export type PhaseStart = {
  type: 'phase.start';
  name: string;                // "pass_1", "walk", "scan"
  explanation?: string;        // text shown to user during this phase
};

export type PhaseEnd = {
  type: 'phase.end';
  name: string;
};

export type ExampleStart = {
  type: 'example.start';
  label: string;               // "Example 1: Odd-length list"
  data: unknown;               // the input data for this example
};

export type ExampleEnd = {
  type: 'example.end';
};

// =============================================================================
// UNION TYPE
// =============================================================================

export type SimEvent =
  // Sorting
  | SortCompare | SortLiftToTemp | SortSlide | SortDropFromTemp
  | SortMarkSorted | SortPassDone | SortDone
  // Tree
  | TreeEnqueue | TreeDequeue | TreeVisit | TreeAddResult
  | TreeCheckChild | TreeDone
  // Linked List
  | LLMovePointer | LLHighlightNode | LLUnhighlightNode
  | LLFoundResult | LLReverseArrow | LLPointerOffEnd | LLDone
  // Stack
  | StackScan | StackPush | StackPop | StackMatch
  | StackNoMatch | StackResult | StackDone
  // Universal
  | PhaseStart | PhaseEnd | ExampleStart | ExampleEnd;