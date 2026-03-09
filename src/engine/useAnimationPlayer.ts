/**
 * Study AI — useAnimationPlayer Hook
 * =====================================
 * React hook that manages animation playback.
 * Handles play/pause/step/seek/speed with auto-advance via setInterval.
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear interval helper
  const clearAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Next frame (used by auto-play)
  const advanceFrame = useCallback(() => {
    dispatch({ type: 'next_frame' });
  }, []);

  // Auto-play effect: start/stop interval based on mode + speed
  useEffect(() => {
    clearAutoPlay();

    if (state.mode === 'playing' && state.timeline && state.currentFrame) {
      // Duration for current frame, adjusted by speed
      const baseDuration = state.currentFrame.duration;
      const adjustedDuration = Math.max(100, baseDuration / state.speed);

      intervalRef.current = setInterval(() => {
        advanceFrame();
      }, adjustedDuration);
    }

    return clearAutoPlay;
  }, [state.mode, state.speed, state.currentFrameIndex, clearAutoPlay, advanceFrame, state.timeline, state.currentFrame]);

  // Stop auto-play when finished
  useEffect(() => {
    if (state.mode === 'finished') {
      clearAutoPlay();
    }
  }, [state.mode, clearAutoPlay]);

  // ── Public API ──

  const load = useCallback((timeline: AnimationTimeline) => {
    clearAutoPlay();
    dispatch({ type: 'load', timeline });
  }, [clearAutoPlay]);

  const play = useCallback(() => {
    dispatch({ type: 'play' });
  }, []);

  const pause = useCallback(() => {
    clearAutoPlay();
    dispatch({ type: 'pause' });
  }, [clearAutoPlay]);

  const togglePlay = useCallback(() => {
    if (state.mode === 'playing') {
      clearAutoPlay();
    }
    dispatch({ type: 'toggle_play' });
  }, [state.mode, clearAutoPlay]);

  const nextFrame = useCallback(() => {
    clearAutoPlay();
    dispatch({ type: 'pause' });
    dispatch({ type: 'next_frame' });
  }, [clearAutoPlay]);

  const prevFrame = useCallback(() => {
    clearAutoPlay();
    dispatch({ type: 'prev_frame' });
  }, [clearAutoPlay]);

  const goToFrame = useCallback((index: number) => {
    clearAutoPlay();
    dispatch({ type: 'go_to_frame', index });
  }, [clearAutoPlay]);

  const setSpeed = useCallback((speed: PlaybackSpeed) => {
    dispatch({ type: 'set_speed', speed });
  }, []);

  const reset = useCallback(() => {
    clearAutoPlay();
    dispatch({ type: 'reset' });
  }, [clearAutoPlay]);

  return {
    state,
    load,
    play,
    pause,
    togglePlay,
    nextFrame,
    prevFrame,
    goToFrame,
    setSpeed,
    reset,
  };
}