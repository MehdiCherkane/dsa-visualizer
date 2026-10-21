import type { JSX } from 'react'
import type { BaseSnapshot, Step, StructurePlugin, VarValue } from '../core/types'
import { fr } from '../i18n/fr'

interface WatchPanelProps<S extends BaseSnapshot> {
  plugin: StructurePlugin<S>
  step: Step<S>
  stepIndex: number
}

function valueClass(value: VarValue): string {
  if (value.kind === 'null') return 'var-value var-null'
  if (value.kind === 'uninit') return 'var-value var-uninit'
  return 'var-value'
}

export function WatchPanel<S extends BaseSnapshot>({
  plugin,
  step,
  stepIndex,
}: WatchPanelProps<S>): JSX.Element {
  const frame = step.snapshot.frames[step.snapshot.frames.length - 1]
  const activeFrameIndex = step.snapshot.frames.length - 1
  const changedGlobals = new Set(
    step.changes.flatMap((change) =>
      change.kind === 'variable' && change.scope === 'global' ? [change.name] : [],
    ),
  )
  const changedLocals = new Set(
    step.changes.flatMap((change) =>
      change.kind === 'variable' &&
      change.scope === 'local' &&
      change.frameIndex === activeFrameIndex
        ? [change.name]
        : [],
    ),
  )
  const globals = Object.entries(step.snapshot.globals)
  const locals = frame ? Object.entries(frame.vars) : []

  return (
    <section className="panel watch-panel">
      <div className="panel-header">
        <span className="panel-title">{fr.watch.title}</span>
        {step.evals && step.evals.length > 0 ? (
          <span className="panel-subtitle">{fr.watch.evals}</span>
        ) : null}
      </div>
      <div className="watch-body">
        <div className="watch-group">
          <h3 className="watch-group-head">{fr.watch.globals}</h3>
          {globals.length === 0 ? (
            <p className="watch-empty">{fr.watch.empty}</p>
          ) : (
            globals.map(([name, value]) => (
              <div
                key={`${stepIndex}-global-${name}`}
                className={changedGlobals.has(name) ? 'watch-row flash' : 'watch-row'}
              >
                <span className="var-name">{name}</span>
                <span className={valueClass(value)}>{plugin.formatValue(step.snapshot, value)}</span>
              </div>
            ))
          )}
        </div>
        <div className="watch-group">
          <h3 className="watch-group-head">
            {frame ? fr.watch.localsOf(frame.fn) : fr.watch.locals}
          </h3>
          {!frame ? (
            <p className="watch-empty">{fr.watch.noFrame}</p>
          ) : (
            locals.map(([name, value]) => (
              <div
                key={`${stepIndex}-local-${name}`}
                className={changedLocals.has(name) ? 'watch-row flash' : 'watch-row'}
              >
                <span className="var-name">{name}</span>
                <span className={valueClass(value)}>{plugin.formatValue(step.snapshot, value)}</span>
              </div>
            ))
          )}
        </div>
        {step.evals && step.evals.length > 0 ? (
          <div className="eval-chips">
            {step.evals.map((entry) => (
              <span key={`${entry.expr}-${entry.value}`} className="eval-chip">
                <code>{entry.expr}</code>
                <strong>{entry.value}</strong>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
