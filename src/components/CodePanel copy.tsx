/**
 * algo.viz — Code Panel
 * =======================
 * Left-side panel showing syntax-highlighted source code.
 * Active lines are highlighted and auto-scrolled into view.
 */

import { useRef, useEffect } from 'react'
import { tokenizeLine } from '../lib/syntaxHighlighter'

type CodePanelProps = {
  codeLines: string[]
  activeLines: number[]
  language: string
}

function SyntaxLine({ line, language }: { line: string; language: string }) {
  if (!line.trim()) return <span>&nbsp;</span>
  return <>{tokenizeLine(line, language).map((t, idx) => (
    <span key={idx} style={{ color: t.color }}>{t.text}</span>
  ))}</>
}

export function CodePanel({ codeLines, activeLines, language }: CodePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeLineRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to keep active line visible
  useEffect(() => {
    if (!activeLineRef.current || !containerRef.current) return
    const container = containerRef.current
    const activeLine = activeLineRef.current
    const containerRect = container.getBoundingClientRect()
    const lineRect = activeLine.getBoundingClientRect()

    // Only scroll if the active line is outside the visible area
    if (lineRect.top < containerRect.top || lineRect.bottom > containerRect.bottom) {
      activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeLines])

  return (
    <div style={{
      width: 320, minWidth: 260, flexShrink: 0,
      borderRight: '1px solid var(--border)',
      background: 'var(--surface)',
      backdropFilter: 'blur(20px)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Panel header */}
      <div style={{
        padding: '14px 18px 10px',
        fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
        color: 'var(--text3)', textTransform: 'uppercase',
        borderBottom: '1px solid var(--border)',
        fontFamily: 'Syne, sans-serif',
      }}>
        Source Code
      </div>

      {/* Code lines */}
      <div ref={containerRef} style={{ padding: '12px 0', flex: 1, overflow: 'auto' }}>
        {codeLines.map((line, i) => {
          const ln = i + 1
          const isActive = activeLines.includes(ln)
          // Attach ref to the first active line for scroll targeting
          const isFirstActive = isActive && !activeLines.slice(0, activeLines.indexOf(ln)).length

          return (
            <div
              key={ln}
              ref={isFirstActive ? activeLineRef : undefined}
              className="code-line"
              style={{
                display: 'flex', alignItems: 'stretch',
                background: isActive ? 'var(--code-active-bg)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--code-active-bar)' : '2px solid transparent',
                transition: 'all 0.25s',
              }}
            >
              {/* Line number */}
              <span style={{
                width: 36, textAlign: 'right', paddingRight: 12,
                fontSize: 11, lineHeight: '1.85',
                color: isActive ? 'rgba(187,154,247,0.7)' : 'var(--text3)',
                fontFamily: 'JetBrains Mono, monospace',
                userSelect: 'none', flexShrink: 0,
                transition: 'color 0.25s',
              }}>
                {ln}
              </span>

              {/* Code content */}
              <span style={{
                fontSize: 12, lineHeight: '1.85', whiteSpace: 'pre',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: isActive ? '700' : '400',
                transition: 'font-weight 0.2s',
                paddingRight: 16,
              }}>
                <SyntaxLine line={line} language={language} />
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
