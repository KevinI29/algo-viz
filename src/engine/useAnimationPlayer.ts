/**
 * Study AI — useAnimationPlayer Hook (Phase 5)
 * ================================================
 * Uses setTimeout per-frame instead of setInterval.
 * Each frame gets its own duration (adjusted by speed), ensuring
 * longer frames (like pass_done) actually hold longer.
 */

import { useReducer, useRef, useEffect, useCallback } from 'react';
import type { AnimationTimeline } from '../../templates/types';
import {
  playerReducer,
  INITIAL_PLAYER_STATE,
  type PlayerState,
  type PlaybackSpeed,
} from './types';

type UseAnimationPlayerReturn = {
  state: PlayerState;
  load: (timeline: AnimationTimeline) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  nextFrame: () => void;
  prevFrame: () => void;
  goToFrame: (index: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  reset: () => void;
};

export function useAnimationPlayer(): UseAnimationPlayerReturn {
  const [state, dispatch] = useReducer(playerReducer, INITIAL_PLAYER_STATE);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Schedule next frame advance based on CURRENT frame's duration
  useEffect(() => {
    clearTimer();

    if (state.mode === 'playing' && state.timeline && state.currentFrame) {
      const baseDuration = state.currentFrame.duration;
      // Minimum 150ms so CSS transitions have time to complete
      const adjustedDuration = Math.max(150, baseDuration / state.speed);

      timerRef.current = setTimeout(() => {
        dispatch({ type: 'next_frame' });
      }, adjustedDuration);
    }

    return clearTimer;
  }, [state.mode, state.speed, state.currentFrameIndex, clearTimer, state.timeline, state.currentFrame]);

  // Stop when finished
  useEffect(() => {
    if (state.mode === 'finished') clearTimer();
  }, [state.mode, clearTimer]);

  // ── Public API ──

  const load = useCallback((timeline: AnimationTimeline) => {
    clearTimer();
    dispatch({ type: 'load', timeline });
  }, [clearTimer]);

  const play = useCallback(() => {
    dispatch({ type: 'play' });
  }, []);

  const pause = useCallback(() => {
    clearTimer();
    dispatch({ type: 'pause' });
  }, [clearTimer]);

  const togglePlay = useCallback(() => {
    if (state.mode === 'playing') clearTimer();
    dispatch({ type: 'toggle_play' });
  }, [state.mode, clearTimer]);

  const nextFrame = useCallback(() => {
    clearTimer();
    dispatch({ type: 'pause' });
    dispatch({ type: 'next_frame' });
  }, [clearTimer]);

  const prevFrame = useCallback(() => {
    clearTimer();
    dispatch({ type: 'prev_frame' });
  }, [clearTimer]);

  const goToFrame = useCallback((index: number) => {
    clearTimer();
    dispatch({ type: 'go_to_frame', index });
  }, [clearTimer]);

  const setSpeed = useCallback((speed: PlaybackSpeed) => {
    dispatch({ type: 'set_speed', speed });
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    dispatch({ type: 'reset' });
  }, [clearTimer]);

  return {
    state, load, play, pause, togglePlay,
    nextFrame, prevFrame, goToFrame, setSpeed, reset,
  };
}