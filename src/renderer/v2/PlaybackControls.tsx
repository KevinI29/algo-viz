/**
 * Study AI — Playback Controls (v2)
 * ====================================
 * Play/pause, step forward/back, speed control, progress dots.
 */

import type { PlayerState, PlaybackSpeed } from '../../engine/types';

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 1.5, 2, 3];

type Props = {
  state: PlayerState;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onGoToFrame: (index: number) => void;
  onSetSpeed: (speed: PlaybackSpeed) => void;
};

export function PlaybackControls({
  state, onTogglePlay, onNext, onPrev, onGoToFrame, onSetSpeed,
}: Props) {
  const { mode, speed, currentFrameIndex, totalFrames, isFirstFrame, isLastFrame } = state;

  const speedIndex = SPEEDS.indexOf(speed);
  function cycleSpeed() {
    const next = SPEEDS[(speedIndex + 1) % SPEEDS.length];
    onSetSpeed(next);
  }

  const playIcon = mode === 'playing' ? '⏸' : mode === 'finished' ? '↻' : '▶';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 0',
    }}>
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 5, flex: 1, flexWrap: 'wrap' }}>
        {Array.from({ length: Math.min(totalFrames, 40) }, (_, i) => {
          // If more than 40 frames, sample
          const frameIdx = totalFrames > 40
            ? Math.round(i * (totalFrames - 1) / 39)
            : i;
          const isActive = frameIdx === currentFrameIndex;
          const isVisited = frameIdx < currentFrameIndex;

          return (
            <button
              key={i}
              onClick={() => onGoToFrame(frameIdx)}
              style={{
                width: 7, height: 7, borderRadius: '50%', padding: 0,
                border: `1.5px solid ${isActive ? '#73daca' : isVisited ? '#bb9af7' : 'rgba(65,72,104,0.5)'}`,
                background: isActive ? '#73daca' : isVisited ? '#bb9af7' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title={`Frame ${frameIdx}`}
            />
          );
        })}
      </div>

      {/* Play/Pause */}
      <button
        onClick={onTogglePlay}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: `1.5px solid ${mode === 'playing' ? '#73daca' : 'rgba(65,72,104,0.65)'}`,
          background: mode === 'playing' ? 'rgba(115,218,202,0.12)' : 'rgba(26,20,46,0.9)',
          color: '#73daca', cursor: 'pointer', fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', padding: 0, lineHeight: 1,
          boxShadow: mode === 'playing' ? '0 0 12px rgba(115,218,202,0.2)' : 'none',
        }}
      >
        {playIcon}
      </button>

      {/* Speed */}
      <button
        onClick={cycleSpeed}
        style={{
          padding: '4px 10px', borderRadius: 14,
          border: '1px solid rgba(65,72,104,0.35)',
          background: 'rgba(26,20,46,0.6)',
          color: '#565f89', cursor: 'pointer',
          fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
          transition: 'all 0.2s',
        }}
      >
        {speed}x
      </button>

      {/* Prev / Next */}
      <button
        onClick={onPrev}
        disabled={isFirstFrame}
        style={{
          width: 34, height: 34, borderRadius: '50%',
          border: '1px solid rgba(65,72,104,0.65)',
          background: 'rgba(26,20,46,0.8)',
          color: '#73daca', cursor: isFirstFrame ? 'not-allowed' : 'pointer',
          fontSize: 15, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: isFirstFrame ? 0.25 : 1,
          transition: 'all 0.2s', padding: 0,
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        &lt;
      </button>
      <button
        onClick={onNext}
        disabled={isLastFrame}
        style={{
          width: 34, height: 34, borderRadius: '50%',
          border: '1px solid rgba(65,72,104,0.65)',
          background: 'rgba(26,20,46,0.8)',
          color: '#73daca', cursor: isLastFrame ? 'not-allowed' : 'pointer',
          fontSize: 15, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: isLastFrame ? 0.25 : 1,
          transition: 'all 0.2s', padding: 0,
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        &gt;
      </button>

      {/* Frame counter */}
      <span style={{
        fontSize: 11, color: '#565f89',
        fontFamily: 'JetBrains Mono, monospace',
        minWidth: 50, textAlign: 'right',
      }}>
        {currentFrameIndex + 1}/{totalFrames}
      </span>
    </div>
  );
}