/**
 * algo.viz — Markdown Renderer
 * ==============================
 * Lightweight markdown-to-JSX converter.
 * Handles the subset of markdown the AI actually produces:
 *   - ## and ### headers
 *   - **bold**
 *   - `inline code`
 *   - ```code blocks```
 *   - - bullet lists
 *   - 1. numbered lists
 *   - Paragraphs
 *
 * No external dependencies. Intentionally simple.
 */

import type { ReactNode } from 'react'

type Block =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'code'; language: string; content: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'paragraph'; text: string }

/**
 * Parse markdown text into blocks.
 */
function parseBlocks(text: string): Block[] {
  const lines = text.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.trimStart().startsWith('```')) {
      const language = line.trimStart().slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      blocks.push({ type: 'code', language, content: codeLines.join('\n') })
      continue
    }

    // Heading
    if (line.startsWith('### ')) {
      blocks.push({ type: 'heading', level: 3, text: line.slice(4).trim() })
      i++; continue
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, text: line.slice(3).trim() })
      i++; continue
    }

    // List (bullet or numbered)
    if (/^[\s]*[-*]\s/.test(line) || /^[\s]*\d+[.)]\s/.test(line)) {
      const ordered = /^[\s]*\d+[.)]\s/.test(line)
      const items: string[] = []
      while (i < lines.length && (/^[\s]*[-*]\s/.test(lines[i]) || /^[\s]*\d+[.)]\s/.test(lines[i]))) {
        items.push(lines[i].replace(/^[\s]*[-*]\s|^[\s]*\d+[.)]\s/, '').trim())
        i++
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    // Empty line — skip
    if (!line.trim()) { i++; continue }

    // Paragraph — collect contiguous non-empty lines that aren't special
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('##') &&
      !lines[i].trimStart().startsWith('```') &&
      !/^[\s]*[-*]\s/.test(lines[i]) &&
      !/^[\s]*\d+[.)]\s/.test(lines[i])
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paraLines.join(' ') })
    }
  }

  return blocks
}

/**
 * Render inline markdown (bold, inline code) to JSX.
 */
function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[2]) {
      // **bold**
      parts.push(<strong key={match.index}>{match[2]}</strong>)
    } else if (match[3]) {
      // `inline code`
      parts.push(<code key={match.index}>{match[3]}</code>)
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

/**
 * Render markdown string to JSX elements.
 */
export function MarkdownContent({ text }: { text: string }) {
  const blocks = parseBlocks(text)

  return (
    <div className="explanation-content">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return block.level === 2
              ? <h2 key={i}>{renderInline(block.text)}</h2>
              : <h3 key={i}>{renderInline(block.text)}</h3>

          case 'code':
            return (
              <pre key={i}>
                <code>{block.content}</code>
              </pre>
            )

          case 'list':
            const ListTag = block.ordered ? 'ol' : 'ul'
            return (
              <ListTag key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ListTag>
            )

          case 'paragraph':
            return <p key={i}>{renderInline(block.text)}</p>
        }
      })}
    </div>
  )
}
