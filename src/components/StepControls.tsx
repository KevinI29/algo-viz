/**
 * algo.viz — Step Controls
 * ==========================
 * Bottom bar with:
 *   - Play / Pause auto-advance button
 *   - Previous / Next navigation buttons
 *   - Speed toggle (2s / 3s / 5s)
 *   - Step explanation text (the learning content)
 *   - Visual progress bar with clickable step dots
 *   - Keyboard shortcut hints
 */

import type { EngineSnapshot } from './types'

type StepControlsProps = {
  engineState: EngineSnapshot
  onPrev: () => void
  onNext: () => void
  onGoToStep: (index: number) => void
  isPlaying: boolean
  onTogglePlay: () => void
  speedLabel: string
  onCycleSpeed: () => void
}

export function StepControls({
  engineState, onPrev, onNext, onGoToStep,
  isPlaying, onTogglePlay, speedLabel, onCycleSpeed,
}: StepControlsProps) {
  const { currentStepIndex, totalSteps, isFirstStep, isLastStep, currentStep } = engineState
  const progress = totalSteps > 0 ? (currentStepIndex / totalSteps) * 100 : 0

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '0',
      flexShrink: 0, borderTop: '1px solid var(--border)',
      background: 'rgba(6, 4, 15, 0.9)',
      backdropFilter: 'blur(20px)',
      zIndex: 10,
    }}>
      {/* Progress dots + bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '8px 24px 0',
      }}>
        {Array.from({ length: totalSteps + 1 }, (_, i) => (
          <button
            key={i}
            className="step-dot"
            data-active={i === currentStepIndex ? 'true' : undefined}
            data-visited={i < currentStepIndex ? 'true' : undefined}
            onClick={() => onGoToStep(i)}
            title={i === 0 ? 'Initial state' : `Step ${i}`}
          />
        ))}
        <div className="step-progress-track" style={{ marginLeft: 8 }}>
          <div className="step-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Controls row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 24px 16px',
        minHeight: 64,
      }}>
        {/* Play / Pause */}
        <button
          onClick={onTogglePlay}
          className={`play-btn ${isPlaying ? 'playing' : ''}`}
          title={isPlaying ? 'Pause (space)' : isLastStep ? 'Replay (space)' : 'Play (space)'}
        >
          {isPlaying ? '⏸' : isLastStep ? '↻' : '▶'}
        </button>

        {/* Speed toggle */}
        <button
          onClick={onCycleSpeed}
          className="speed-btn"
          title="Cycle speed"
        >
          {speedLabel}
        </button>

        <button onClick={onPrev} disabled={isFirstStep} className="nav-btn">
          ← Prev
        </button>

        <p className="step-explanation">
          {isFirstStep
            ? <span style={{ color: 'var(--text3)' }}>
                Press <span style={{ color: 'var(--purple3)' }}>▶ Play</span> or <span style={{ color: 'var(--purple3)' }}>Next →</span> to begin
              </span>
            : currentStep?.explanation}
        </p>

        <button onClick={onNext} disabled={isLastStep} className="nav-btn">
          Next →
        </button>

        <span className="keyboard-hint">
          space ← →
        </span>
      </div>
    </div>
  )
}