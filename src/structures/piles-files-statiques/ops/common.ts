import type { Badge, ParamValues } from '../../../core/types'
import { fr } from '../../../i18n/fr'
import { cellValue } from '../memory'
import type { ArraySnapshot } from '../memory'
import { ArrayRecorder } from './runtime'

export function numberParam(params: ParamValues, name: string): number {
  const value = params[name]
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function textParam(params: ParamValues, name: string): string {
  const value = params[name]
  return typeof value === 'string' ? value : ''
}

export function conditionStep(
  r: ArrayRecorder,
  fn: string,
  line: number,
  expr: string,
  result: boolean,
  reason: string,
  badge?: Badge,
): void {
  r.incrementComparisons()
  r.step(fn, line, fr.captions.condition(expr, result, reason), {
    cond: { expr, result },
    ...(badge ? { badge } : {}),
  })
}

export function cellNumber(snapshot: ArraySnapshot, index: number): number {
  const draw = cellValue(snapshot.cells[index] ?? null)
  return typeof draw === 'number' ? draw : 0
}

export function cellChar(snapshot: ArraySnapshot, index: number): string {
  const draw = cellValue(snapshot.cells[index] ?? null)
  return typeof draw === 'string' ? draw : ''
}
