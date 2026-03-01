/**
 * algo.viz — Shared App Types
 * =============================
 * Types shared between App.tsx and its child components.
 * Keeps component props well-typed without circular imports.
 */

import type { AnimationEngine } from '../engine/engine'

export type AppState =
  | { status: 'idle' }
  | { status: 'loading'; concept: string }
  | { status: 'animation'; engine: AnimationEngine }
  | { status: 'explanation'; concept: string; text: string }
  | { status: 'error'; message: string }

export type EngineSnapshot = ReturnType<AnimationEngine['getState']>

export const SUGGESTIONS = [
  'Binary Search', 'Reverse a Linked List', 'Bubble Sort',
  'Stack push & pop', 'BFS on a graph', 'Merge Sort',
  'Quick Sort', 'Two Sum',
]
