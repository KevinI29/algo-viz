/**
 * Study AI — Player Reducer Tests
 */

import { describe, it, expect } from 'vitest';
import { INITIAL_PLAYER_STATE, playerReducer } from './types';
import type { AnimationTimeline } from '../templates/types';

const emptyTimeline: AnimationTimeline = {
  meta: { concept: 'x', visualTemplate: 'sorting', codePosition: 'after', frameCount: 0, estimatedDuration: 0 },
  frames: [],
  setupExplanation: '',
  insightText: '',
};

describe('playerReducer', () => {
  it('does not start playing without a timeline', () => {
    expect(playerReducer(INITIAL_PLAYER_STATE, { type: 'play' }).mode).not.toBe('playing');
    expect(playerReducer(INITIAL_PLAYER_STATE, { type: 'toggle_play' }).mode).not.toBe('playing');
  });

  it('does not start playing an empty timeline', () => {
    const loaded = playerReducer(INITIAL_PLAYER_STATE, { type: 'load', timeline: emptyTimeline });
    expect(playerReducer(loaded, { type: 'play' }).mode).toBe('paused');
    expect(playerReducer(loaded, { type: 'toggle_play' }).mode).toBe('paused');
  });

  it('plays a timeline with frames', () => {
    const timeline: AnimationTimeline = {
      ...emptyTimeline,
      frames: [{ seq: 0, entities: {}, transitions: [], duration: 100 }],
    };
    const loaded = playerReducer(INITIAL_PLAYER_STATE, { type: 'load', timeline });
    expect(playerReducer(loaded, { type: 'play' }).mode).toBe('playing');
  });
});
