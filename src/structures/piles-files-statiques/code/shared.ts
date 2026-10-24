import type { CodeSource } from '../../../core/types'

export interface LabelSpec {
  line: number
  contains: string
}

export type LabelMap = Record<string, LabelSpec>

export interface FunctionCode {
  code: CodeSource
  labels: LabelMap
}

type LabelTarget = string | number

/**
 * Chapter 1 code is declared as line arrays. Labels are resolved from the
 * exact line text, which keeps highlighting tied to the displayed source.
 */
export function makeArrayFunction(
  fn: string,
  lines: string[],
  targets: Record<string, LabelTarget>,
): FunctionCode {
  const lineNumbers: Record<string, number> = {}
  const labels: LabelMap = {}

  for (const [key, target] of Object.entries(targets)) {
    const index = typeof target === 'number'
      ? (target < 0 ? lines.length + target : target)
      : lines.indexOf(target)
    if (index < 0 || index >= lines.length) {
      throw new Error(`Label ${fn}.${key} could not be resolved`)
    }
    lineNumbers[key] = index
    labels[key] = { line: index, contains: lines[index] ?? '' }
  }

  return {
    code: { fn, lines, labels: lineNumbers },
    labels,
  }
}

export function collectArrayCode(functions: FunctionCode[]): Record<string, CodeSource> {
  return Object.fromEntries(functions.map((entry) => [entry.code.fn, entry.code]))
}

export function collectArrayLabels(functions: FunctionCode[]): Record<string, LabelMap> {
  return Object.fromEntries(functions.map((entry) => [entry.code.fn, entry.labels]))
}
