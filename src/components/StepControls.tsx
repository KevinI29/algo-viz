/**
 * algo.viz — Step Controls
 * ==========================
 * Bottom bar with:
 *   - Previous / Next navigation buttons
 *   - Step explanation text (the learning content)
 *   - Visual progress bar with clickable step dots
 *   - Keyboard shortcut hint
 */

import type { EngineSnapshot } from './types'

type StepControlsProps = {
  engineState: EngineSnapshot
  onPrev: () => void
  onNext: () => void
  onGoToStep: (index: number) => void
}

export function StepControls({ engineState, onPrev, onNext, onGoToStep }: StepControlsProps) {
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
      {/* Progress bar */}
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
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '12px 24px 16px',
        minHeight: 64,
      }}>
        <button onClick={onPrev} disabled={isFirstStep} className="nav-btn">
          ← Prev
        </button>

        <p style={{
          flex: 1, fontSize: 13, color: 'var(--text2)', lineHeight: 1.7,
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {isFirstStep
            ? <span style={{ color: 'var(--text3)' }}>
                Press <span style={{ color: 'var(--purple3)' }}>Next →</span> to begin the walkthrough
              </span>
            : currentStep?.explanation}
        </p>

        <button onClick={onNext} disabled={isLastStep} className="nav-btn">
          Next →
        </button>

        <span style={{
          fontSize: 10, color: 'var(--text3)',
          fontFamily: 'JetBrains Mono, monospace',
          opacity: 0.6,
        }}>
          ← → keys
        </span>
      </div>
    </div>
  )
}
