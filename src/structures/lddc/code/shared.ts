import type { CodeSource } from '../../../core/types'

/**
 * A label can be declared by line index, by a unique piece of text, or by the
 * nth occurrence of a piece of text (useful when a line such as `return;`
 * appears several times in the same function).
 */
export type LabelQuery =
  | number
  | string
  | {
      text: string
      occurrence?: number
    }

export interface FunctionCode {
  code: CodeSource
  labels: Record<string, { line: number; contains: string }>
}

export function makeFunction(
  fn: string,
  raw: string,
  labels: Record<string, LabelQuery>,
): FunctionCode {
  const lines = raw.replace(/^\n+|\n+$/g, '').split('\n')
  const lineNumbers: Record<string, number> = {}
  const resolved: Record<string, { line: number; contains: string }> = {}

  for (const [key, query] of Object.entries(labels)) {
    const line = resolveLine(fn, key, lines, query)
    const contains = typeof query === 'number' ? lines[line]! : typeof query === 'string' ? query : query.text
    lineNumbers[key] = line
    resolved[key] = { line, contains }
  }

  // Every function closes on its last line; this keeps the caller from having
  // to count lines just to highlight the closing brace.
  if (!resolved.end) {
    const line = lines.length - 1
    lineNumbers.end = line
    resolved.end = { line, contains: lines[line]! }
  }

  return { code: { fn, lines, labels: lineNumbers }, labels: resolved }
}

function resolveLine(fn: string, key: string, lines: string[], query: LabelQuery): number {
  if (typeof query === 'number') {
    if (query < 0 || query >= lines.length) {
      throw new Error(`Label ${fn}.${key} points outside the function (line ${query})`)
    }
    return query
  }

  const text = typeof query === 'string' ? query : query.text
  const occurrence = typeof query === 'string' ? 0 : (query.occurrence ?? 0)
  const matches: number[] = []
  lines.forEach((line, index) => {
    if (line.includes(text)) matches.push(index)
  })

  const line = matches[occurrence]
  if (line === undefined) {
    throw new Error(
      `Label ${fn}.${key}: "${text}" not found${occurrence > 0 ? ` (occurrence ${occurrence})` : ''}`,
    )
  }
  return line
}

export function collectCode(functions: FunctionCode[]): Record<string, CodeSource> {
  return Object.fromEntries(functions.map((entry) => [entry.code.fn, entry.code]))
}

export function collectLabels(
  functions: FunctionCode[],
): Record<string, Record<string, { line: number; contains: string }>> {
  return Object.fromEntries(functions.map((entry) => [entry.code.fn, entry.labels]))
}
