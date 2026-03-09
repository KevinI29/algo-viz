/**
 * Study AI — Animation Template Types
 * =====================================
 * Defines the output of template mappers: AnimationFrames.
 * These are what the renderer actually draws.
 *
 * An AnimationFrame is a complete snapshot of what the screen looks like
 * at one point in time, plus the transitions to animate FROM the previous frame.
 */

// =============================================================================
// ENTITY STATE — what's on screen
// =============================================================================

export type BarState = {
  entityType: 'bar';
  id: string;
  value: number;
  index: number;
  color: string;           // hex color
  opacity: number;
  highlighted: boolean;
  sorted: boolean;
};

export type StagingState = {
  entityType: 'staging';
  id: string;
  label: string;           // "temp", "key", "pivot"
  value: number | null;    // null = empty
  barColor: string;
  visible: boolean;
};

export type NodeState = {
  entityType: 'node';
  id: string;
  value: number;
  color: string;
  opacity: number;
  highlighted: boolean;
  visited: boolean;
};

export type ArrowState = {
  entityType: 'arrow';
  id: string;
  fromId: string;
  toId: string;
  opacity: number;
};

export type PointerState = {
  entityType: 'pointer';
  id: string;
  name: string;
  targetIndex: number;     // which node/cell it points at (-1 = off-screen)
  color: string;
  visible: boolean;
};

export type QueueDisplayState = {
  entityType: 'queue_display';
  id: string;
  label: string;           // "queue" or "results"
  values: number[];
};

export type StackContainerState = {
  entityType: 'stack_container';
  id: string;
  items: string[];          // stack contents, bottom to top
};

export type StringDisplayState = {
  entityType: 'string_display';
  id: string;
  chars: string[];
  scanIndex: number;        // which char the arrow points at (-1 = none)
  matchedIndices: number[]; // indices of matched characters (dimmed)
};

export type TextAnnotationState = {
  entityType: 'text_annotation';
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
};

export type EntityState =
  | BarState
  | StagingState
  | NodeState
  | ArrowState
  | PointerState
  | QueueDisplayState
  | StackContainerState
  | StringDisplayState
  | TextAnnotationState;

// =============================================================================
// TRANSITIONS — how to animate between frames
// =============================================================================

export type Transition =
  | { type: 'bar_lift';       barId: string; toStaging: string }
  | { type: 'bar_drop';       barId: string; fromStaging: string; toIndex: number }
  | { type: 'bar_slide';      barId: string; fromIndex: number; toIndex: number }
  | { type: 'bar_recolor';    barId: string; fromColor: string; toColor: string }
  | { type: 'pointer_slide';  pointerId: string; fromIndex: number; toIndex: number }
  | { type: 'pointer_off';    pointerId: string }
  | { type: 'node_highlight'; nodeId: string; color: string }
  | { type: 'node_visit';     nodeId: string }
  | { type: 'value_fly';      value: number; fromId: string; toId: string }
  | { type: 'stack_push';     char: string }
  | { type: 'stack_pop';      char: string }
  | { type: 'scan_move';      toIndex: number }
  | { type: 'list_append';    listId: string; value: number }
  | { type: 'list_remove';    listId: string; index: number }
  | { type: 'fade_in';        entityId: string }
  | { type: 'fade_out';       entityId: string }
  | { type: 'none' };

// =============================================================================
// ANIMATION FRAME — one moment in the animation
// =============================================================================

export type AnimationFrame = {
  seq: number;                          // 0-based sequence number
  entities: Record<string, EntityState>; // complete entity snapshot
  transitions: Transition[];             // how to animate from previous frame
  codeLine?: number;                     // which code line is active (1-based)
  codeEmphasis?: 'normal' | 'bold';
  explanation?: string;                  // text shown to user
  phase?: string;                        // current phase name
  duration: number;                      // suggested ms for this frame
  isExampleBoundary?: boolean;           // true on example.start
  exampleLabel?: string;                 // "Example 1: Odd-length list"
};

// =============================================================================
// ANIMATION TIMELINE — the complete compiled animation
// =============================================================================

export type AnimationTimeline = {
  meta: {
    concept: string;
    visualTemplate: string;
    codePosition: string;
    frameCount: number;
    estimatedDuration: number;           // total ms
  };
  code?: {
    source: string;
    language: string;
  };
  frames: AnimationFrame[];
  setupExplanation: string;
  insightText: string;
  complexityNote?: string;
};