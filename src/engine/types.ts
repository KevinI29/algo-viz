/**
 * Study AI — Animation Player Types
 * ====================================
 * Defines the playback state for the animation player.
 */

import type { AnimationTimeline, AnimationFrame } from '../templates/types';

// =============================================================================
// PLAYBACK STATE
// =============================================================================

export type PlaybackMode = 'paused' | 'playing' | 'finished';

export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2 | 3;

export type PlayerState = {
  mode: PlaybackMode;
  speed: PlaybackSpeed;
  currentFrameIndex: number;
  totalFrames: number;
  currentFrame: AnimationFrame | null;
  isFirstFrame: boolean;
  isLastFrame: boolean;
  timeline: AnimationTimeline | null;
  elapsedMs: number;
};

// =============================================================================
// PLAYER ACTIONS
// =============================================================================

export type PlayerAction =
  | { type: 'load'; timeline: AnimationTimeline }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'toggle_play' }
  | { type: 'next_frame' }
  | { type: 'prev_frame' }
  | { type: 'go_to_frame'; index: number }
  | { type: 'set_speed'; speed: PlaybackSpeed }
  | { type: 'reset' };

// =============================================================================
// INITIAL STATE
// =============================================================================

export const INITIAL_PLAYER_STATE: PlayerState = {
  mode: 'paused',
  speed: 1,
  currentFrameIndex: 0,
  totalFrames: 0,
  currentFrame: null,
  isFirstFrame: true,
  isLastFrame: true,
  timeline: null,
  elapsedMs: 0,
};

// =============================================================================
// PLAYER REDUCER
// =============================================================================

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'load': {
      const tl = action.timeline;
      return {
        ...state,
        timeline: tl,
        totalFrames: tl.frames.length,
        currentFrameIndex: 0,
        currentFrame: tl.frames[0] ?? null,
        isFirstFrame: true,
        isLastFrame: tl.frames.length <= 1,
        mode: 'paused',
        elapsedMs: 0,
      };
    }

    case 'play':
      if (state.mode === 'finished') {
        // Replay from start
        return {
          ...state,
          mode: 'playing',
          currentFrameIndex: 0,
          currentFrame: state.timeline?.frames[0] ?? null,
          isFirstFrame: true,
          isLastFrame: false,
          elapsedMs: 0,
        };
      }
      return { ...state, mode: 'playing' };

    case 'pause':
      return { ...state, mode: 'paused' };

    case 'toggle_play':
      if (state.mode === 'playing') return { ...state, mode: 'paused' };
      if (state.mode === 'finished') {
        return playerReducer(state, { type: 'play' });
      }
      return { ...state, mode: 'playing' };

    case 'next_frame': {
      if (!state.timeline) return state;
      const next = state.currentFrameIndex + 1;
      if (next >= state.totalFrames) {
        return {
          ...state,
          mode: 'finished',
          isLastFrame: true,
        };
      }
      return {
        ...state,
        currentFrameIndex: next,
        currentFrame: state.timeline.frames[next],
        isFirstFrame: false,
        isLastFrame: next >= state.totalFrames - 1,
      };
    }

    case 'prev_frame': {
      if (!state.timeline) return state;
      const prev = Math.max(0, state.currentFrameIndex - 1);
      return {
        ...state,
        currentFrameIndex: prev,
        currentFrame: state.timeline.frames[prev],
        isFirstFrame: prev === 0,
        isLastFrame: false,
        mode: 'paused',
      };
    }

    case 'go_to_frame': {
      if (!state.timeline) return state;
      const idx = Math.max(0, Math.min(action.index, state.totalFrames - 1));
      return {
        ...state,
        currentFrameIndex: idx,
        currentFrame: state.timeline.frames[idx],
        isFirstFrame: idx === 0,
        isLastFrame: idx >= state.totalFrames - 1,
        mode: 'paused',
      };
    }

    case 'set_speed':
      return { ...state, speed: action.speed };

    case 'reset':
      return INITIAL_PLAYER_STATE;

    default:
      return state;
  }
}