import type { BaseSnapshot, OperationDef, ParamValues, ProfileDef } from '../core/types'

export function defaultOperation<S extends BaseSnapshot>(
  profile: ProfileDef<S>,
): OperationDef<S> | undefined {
  if (profile.defaultOperationId) {
    const preferred = profile.operations.find(
      (operation) => operation.id === profile.defaultOperationId,
    )
    if (preferred) return preferred
  }
  return (
    profile.operations.find(
      (operation) => operation.id === 'supprimerValeur' || operation.id === 'radierEtudiant',
    ) ?? profile.operations[0]
  )
}

export function defaultParams<S extends BaseSnapshot>(
  operation: OperationDef<S> | undefined,
): Record<string, string> {
  if (!operation) return {}
  const values: Record<string, string> = {}
  for (const param of operation.params) values[param.name] = String(param.defaultValue)
  return values
}

export function formatCall<S extends BaseSnapshot>(
  operation: OperationDef<S>,
  params: ParamValues | Record<string, string>,
): string {
  const values = operation.params
    .map((param) => params[param.name])
    .filter((value) => value !== undefined && value !== '')
    .map((value) => String(value))
  return `${operation.id}(${values.join(', ')})`
}

/**
 * After an insertion, suggest the next integer so two consecutive manual
 * insertions do not silently reuse the same value (13, 13 / 201, 201).
 */
export function nextInsertParams<S extends BaseSnapshot>(
  operation: OperationDef<S>,
  usedParams: ParamValues | Record<string, string>,
  currentValues: Record<string, string>,
): Record<string, string> | null {
  if (!operation.inserts) return null
  const param = operation.params.find((candidate) => candidate.kind === 'number')
  if (!param) return null
  const used = Number(usedParams[param.name])
  const current = Number(currentValues[param.name])
  if (!Number.isFinite(used) || !Number.isFinite(current) || current !== used) return null
  return { ...currentValues, [param.name]: String(used + 1) }
}
