/**
 * Study AI — Lesson Plan Types
 * ==============================
 * The contract between the LLM "teacher" (backend/prompts/teacher.ts) and the
 * frontend engine. A LessonPlan picks a simulator, supplies example data, and
 * carries the explanations shown alongside the animation.
 *
 * Animation/frame types live in ../templates/types.ts.
 */

// =============================================================================
// IDS
// =============================================================================

export type VisualTemplate = 'sorting' | 'tree' | 'linked_list' | 'stack';

export type SimulatorId =
  | 'sorting.bubble'
  | 'sorting.insertion'
  | 'sorting.selection'
  | 'tree.bfs'
  | 'tree.dfs_preorder'
  | 'tree.dfs_inorder'
  | 'linked_list.find_middle'
  | 'linked_list.reverse'
  | 'linked_list.detect_cycle'
  | 'stack.valid_parentheses'
  | 'stack.evaluate_postfix';

export type CodePosition = 'alongside' | 'after' | 'none';

export type LessonCategory = 'sorting' | 'tree' | 'linked_list' | 'stack' | 'general';

// =============================================================================
// EXAMPLE DATA — one shape per simulator data type
// =============================================================================

export type SortingData = {
  type: 'sorting';
  array: number[];
};

export type TreeNodeData = {
  id: string;
  value: number;
  left?: TreeNodeData;
  right?: TreeNodeData;
};

export type TreeData = {
  type: 'tree';
  root: TreeNodeData;
};

export type LinkedListData = {
  type: 'linked_list';
  values: number[];
  pointers: Record<string, number>;   // initial pointer positions, e.g. { slow: 0, fast: 0 }
  cycleAt?: number;                   // detect_cycle: index the tail links back to
};

export type StackData = {
  type: 'stack';
  input: string;
};

export type ExampleData = SortingData | TreeData | LinkedListData | StackData;

export type DataType = ExampleData['type'];

// =============================================================================
// LESSON PLAN
// =============================================================================

export type LessonExample = {
  label: string;                      // "Example 2: Even-length list"
  data: ExampleData;
};

export type LessonPlan = {
  simulator: SimulatorId | null;      // null → no simulator matches (text / future Pyodide path)
  visualTemplate: VisualTemplate;
  codePosition: CodePosition;
  concept: string;
  category: LessonCategory;
  textOnly?: boolean;
  exampleData: ExampleData;
  additionalExamples?: LessonExample[];
  code?: {
    source: string;
    language: string;
  };
  title: string;
  setupExplanation: string;
  phaseExplanations?: Record<string, string>;
  insightText: string;
  complexityNote?: string;
};
