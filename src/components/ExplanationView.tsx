/**
 * algo.viz — Explanation View
 * =============================
 * Renders text explanations with markdown formatting.
 * Used when the AI classifies a concept as better explained with text
 * rather than animation.
 */

import { MarkdownContent } from '../lib/markdownRenderer'

type ExplanationViewProps = {
  concept: string
  text: string
}

export function ExplanationView({ concept, text }: ExplanationViewProps) {
  return (
    <div className="fade-in" style={{
      flex: 1, overflow: 'auto', padding: '48px 24px',
      display: 'flex', justifyContent: 'center', zIndex: 1,
    }}>
      <div style={{ maxWidth: 680, width: '100%' }}>
        <h2 style={{
          fontSize: 28, fontWeight: 800, marginBottom: 24,
          fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #e2d9f3, #9d6bff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {concept}
        </h2>
        <MarkdownContent text={text} />
      </div>
    </div>
  )
}
