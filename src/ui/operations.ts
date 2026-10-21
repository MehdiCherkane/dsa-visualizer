import type { BaseSnapshot, OperationDef, ParamValues, ProfileDef } from '../core/types'

export function defaultOperation<S extends BaseSnapshot>(
  profile: ProfileDef<S>,
): OperationDef<S> | undefined {
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
