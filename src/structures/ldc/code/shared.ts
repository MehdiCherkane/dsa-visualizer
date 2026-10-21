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

export function makeFunction(fn: string, raw: string, labels: LabelMap): FunctionCode {
  const lines = raw.replace(/^\n+|\n+$/g, '').split('\n')
  const lineNumbers: Record<string, number> = {}
  for (const [key, spec] of Object.entries(labels)) {
    lineNumbers[key] = spec.line
  }
  return {
    code: { fn, lines, labels: lineNumbers },
    labels,
  }
}

export function collectCode(functions: FunctionCode[]): Record<string, CodeSource> {
  return Object.fromEntries(functions.map((entry) => [entry.code.fn, entry.code]))
}

export function collectLabels(functions: FunctionCode[]): Record<string, LabelMap> {
  return Object.fromEntries(functions.map((entry) => [entry.code.fn, entry.labels]))
}
