import type { JSX } from 'react'
import type { BaseSnapshot, Step } from '../core/types'
import { fr } from '../i18n/fr'
import { PanelFocusButton } from './PanelFocusButton'

interface ConsolePanelProps<S extends BaseSnapshot> {
  step: Step<S>
  id?: string
  focused?: boolean
  onToggleFocus?: () => void
}

export function ConsolePanel<S extends BaseSnapshot>({
  step,
  id,
  focused = false,
  onToggleFocus,
}: ConsolePanelProps<S>): JSX.Element {
  const empty = step.console.output.length === 0
  return (
    <section className="panel console-panel" id={id} aria-live="polite">
      <div className="panel-header console-header">
        <span className="panel-title">{fr.console.title}</span>
        <div className="panel-header-actions">
          <div className="console-meta">
            <span className="counter">
              {fr.console.traversed} : {step.counters.traversed}
            </span>
            <span className="counter">
              {fr.console.comparisons} : {step.counters.comparisons}
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
