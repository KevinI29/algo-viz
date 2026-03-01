/**
 * algo.viz — Syntax Highlighter
 * ===============================
 * Pure TypeScript. Zero React. Zero DOM.
 * Tokenizes a single code line into colored spans.
 * Supports Python and JavaScript/TypeScript.
 */

const PY_KEYWORDS = new Set([
  'def','class','return','if','elif','else','for','while','in','not','and','or',
  'is','None','True','False','import','from','pass','break','continue','lambda',
  'with','as','yield','try','except','finally','raise','del','global','nonlocal',
])
const PY_BUILTINS = new Set([
  'range','len','print','list','dict','set','int','str','float','bool',
  'enumerate','zip','map','filter','sorted','reversed','min','max','sum','abs',
  'type','isinstance','append','extend','pop',
])
const JS_KEYWORDS = new Set([
  'const','let','var','function','return','if','else','for','while','do',
  'switch','case','break','continue','new','delete','typeof','instanceof',
  'in','of','class','extends','import','export','default','null','undefined',
  'true','false','try','catch','finally','throw','async','await','this','super',
])
const JS_BUILTINS = new Set([
  'console','Array','Object','Map','Set','Math','parseInt','parseFloat',
  'Promise','JSON','Number','String','Boolean',
])

export type Token = { text: string; color: string }

export function tokenizeLine(line: string, language: string): Token[] {
  const keywords = language === 'python' ? PY_KEYWORDS : JS_KEYWORDS
  const builtins = language === 'python' ? PY_BUILTINS : JS_BUILTINS
  const tokens: Token[] = []
  let i = 0

  while (i < line.length) {
    // Comment
    if (line[i] === '#' && language === 'python') {
      tokens.push({ text: line.slice(i), color: 'var(--syn-comment)' }); break
    }
    if (line[i] === '/' && line[i+1] === '/' && language !== 'python') {
      tokens.push({ text: line.slice(i), color: 'var(--syn-comment)' }); break
    }
    // String
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i]; let j = i + 1
      while (j < line.length && line[j] !== q) { if (line[j] === '\\') j++; j++ }
      j++
      tokens.push({ text: line.slice(i, j), color: 'var(--syn-string)' })
      i = j; continue
    }
    // Number
    if (/\d/.test(line[i]) && (i === 0 || !/[a-zA-Z_]/.test(line[i-1]))) {
      let j = i
      while (j < line.length && /[\d._]/.test(line[j])) j++
      tokens.push({ text: line.slice(i, j), color: 'var(--syn-number)' })
      i = j; continue
    }
    // Identifier
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i
      while (j < line.length && /\w/.test(line[j])) j++
      const word = line.slice(i, j)
      const color = keywords.has(word) ? 'var(--syn-keyword)'
                  : builtins.has(word)  ? 'var(--syn-builtin)'
                  : /^[A-Z]/.test(word) ? 'var(--syn-builtin)'
                  : 'var(--syn-variable)'
      tokens.push({ text: word, color })
      i = j; continue
    }
    // Punctuation / operator
    tokens.push({ text: line[i], color: 'var(--syn-default)' })
    i++
  }

  return tokens
}
