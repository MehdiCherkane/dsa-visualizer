import type { JSX } from 'react'
import type { BaseSnapshot, CounterLabels, Step } from '../core/types'
import { fr } from '../i18n/fr'
import { PanelFocusButton } from './PanelFocusButton'

interface ConsolePanelProps<S extends BaseSnapshot> {
  step: Step<S>
  id?: string
  focused?: boolean
  counterLabels?: CounterLabels
  onToggleFocus?: () => void
}

export function ConsolePanel<S extends BaseSnapshot>({
  step,
  id,
  focused = false,
  counterLabels,
  onToggleFocus,
}: ConsolePanelProps<S>): JSX.Element {
  const empty = step.console.output.length === 0
  const traversedLabel = counterLabels?.traversed ?? fr.console.traversed
  const comparisonsLabel = counterLabels?.comparisons ?? fr.console.comparisons
  return (
    <section className="panel console-panel" id={id} aria-live="polite">
      <div className="panel-header console-header">
        <span className="panel-title">{fr.console.title}</span>
        <div className="panel-header-actions">
          <div className="console-meta">
            <span className="counter">
              {traversedLabel} : {step.counters.traversed}
            </span>
            <span className="counter">
              {comparisonsLabel} : {step.counters.comparisons}
            </span>
            {step.console.returnValue !== undefined ? (
              <span className="return-badge">
                {fr.console.return} : {step.console.returnValue}
              </span>
            ) : null}
          </div>
          {onToggleFocus ? (
            <PanelFocusButton
              title={fr.console.title}
              focused={focused}
              onToggle={onToggleFocus}
            />
          ) : null}
        </div>
      </div>
      <div className="console-body">
        <pre className={empty ? 'console-output placeholder' : 'console-output'}>
          {empty ? fr.console.empty : step.console.output}
        </pre>
      </div>
    </section>
  )
}
