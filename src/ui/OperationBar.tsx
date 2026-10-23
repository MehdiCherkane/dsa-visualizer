import type { JSX } from 'react'
import type { BaseSnapshot, OperationDef, ProfileDef } from '../core/types'
import { fr } from '../i18n/fr'

interface OperationBarProps<S extends BaseSnapshot> {
  profile: ProfileDef<S>
  selectedOp: OperationDef<S> | undefined
  selectedId: string
  paramValues: Record<string, string>
  onSelect: (id: string) => void
  onParam: (name: string, value: string) => void
  onExecute: () => void
  onFinish: () => void
  onCancel: () => void
  operationActive: boolean
  operationFinished: boolean
  listCount: number
  maxed: boolean
}

export function OperationBar<S extends BaseSnapshot>({
  profile,
  selectedOp,
  selectedId,
  paramValues,
  onSelect,
  onParam,
  onExecute,
  onFinish,
  onCancel,
  operationActive,
  operationFinished,
  listCount,
  maxed,
}: OperationBarProps<S>): JSX.Element {
  const showLimit = maxed && !operationActive
  const limitMessage = fr.operation.maxNodes(profile.maxNodes)
  return (
    <section className={showLimit ? 'operation-bar maxed' : 'operation-bar'}>
      <div className="operation-main">
        <label className="field-label">
          <span>{fr.operation.title}</span>
          <select
            value={selectedId}
            onChange={(event) => onSelect(event.target.value)}
            disabled={operationActive}
            aria-label={fr.operation.title}
          >
            {profile.operations.map((operation) => (
              <option key={operation.id} value={operation.id}>
                {operation.label}
              </option>
            ))}
          </select>
        </label>

        {selectedOp?.params.map((param) => (
          <label key={param.name} className="field-label">
            <span>{param.label}</span>
            {param.target && listCount > 0 ? (
              <span
                className="field-hint"
                title={fr.operation.targetHint}
                aria-label={fr.operation.targetHint}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="m5 3 9.5 7.2-4.2.8 2.3 4.6-1.7.9-2.3-4.6-3 2.6Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            ) : null}
            <input
              type={param.kind === 'number' ? 'number' : 'text'}
              value={paramValues[param.name] ?? ''}
              step={param.kind === 'number' ? 1 : undefined}
              onChange={(event) => onParam(param.name, event.target.value)}
              disabled={operationActive}
              aria-label={param.label}
            />
          </label>
        ))}

        <div className="operation-actions">
          <button
            type="button"
            className="primary-button"
            onClick={onExecute}
            disabled={operationActive || maxed || !selectedOp}
            title={showLimit ? limitMessage : undefined}
          >
            {fr.operation.execute}
          </button>
          {operationActive || operationFinished ? (
            <>
              {operationActive ? (
                <button type="button" className="secondary-button" onClick={onFinish}>
                  {fr.operation.finish}
                </button>
              ) : null}
              <button type="button" className="secondary-button" onClick={onCancel}>
                {fr.operation.cancel}
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="operation-info">
        {selectedOp ? (
          <span className="complexity-badge" title={selectedOp.complexityNote}>
            {selectedOp.complexity}
          </span>
        ) : null}
        {operationActive ? (
          <span className="in-progress">{fr.operation.inProgress}</span>
        ) : null}
        {showLimit ? (
          <span className="limit-message" role="status">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 7v3.4M8 4.8h.01" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            {limitMessage}
          </span>
        ) : null}
      </div>
    </section>
  )
}
