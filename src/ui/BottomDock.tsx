import type { JSX } from 'react'
import type { BaseSnapshot, Step, StructurePlugin } from '../core/types'
import { fr } from '../i18n/fr'
import { ConsolePanel } from './ConsolePanel'
import { WatchPanel } from './WatchPanel'

interface BottomDockProps<S extends BaseSnapshot> {
  plugin: StructurePlugin<S>
  step: Step<S>
  stepIndex: number
  journal: string[]
  presentation: boolean
  collapsed: boolean
  summary: string
  onToggle: () => void
  onReset: () => void
}

export function BottomDock<S extends BaseSnapshot>({
  plugin,
  step,
  stepIndex,
  journal,
  presentation,
  collapsed,
  summary,
  onToggle,
  onReset,
}: BottomDockProps<S>): JSX.Element {
  return (
    <section
      className={`bottom-dock${collapsed ? ' collapsed' : ''}${presentation ? ' presentation' : ''}`}
      aria-label={fr.dock.title}
    >
      {collapsed ? (
        <button
          type="button"
          className="dock-collapsed-bar"
          onClick={onToggle}
          aria-expanded={false}
          title={fr.dock.expand}
        >
          <span className="dock-chevron" aria-hidden="true">
            ▴
          </span>
          <span className="dock-handle-label">{fr.dock.title}</span>
          <code className="dock-summary">{summary}</code>
          <span className="keycap">D</span>
        </button>
      ) : (
        <>
          <button
            type="button"
            className="dock-handle"
            onClick={onToggle}
            aria-expanded
            title={fr.dock.collapse}
          >
            <span className="dock-chevron" aria-hidden="true">
              ▾
            </span>
            <span className="dock-handle-label">{fr.dock.title}</span>
            <span className="keycap">D</span>
          </button>
          <div className="dock-panels">
            <WatchPanel plugin={plugin} step={step} stepIndex={stepIndex} />
            <ConsolePanel step={step} />
            {presentation ? null : <JournalPanel entries={journal} onReset={onReset} />}
          </div>
        </>
      )}
    </section>
  )
}

function JournalPanel({
  entries,
  onReset,
}: {
  entries: string[]
  onReset: () => void
}): JSX.Element {
  return (
    <section className="panel journal-panel">
      <div className="panel-header journal-header">
        <div className="journal-title">
          <span className="panel-title">{fr.journal.title}</span>
          {entries.length > 0 ? <span className="badge-count">{entries.length}</span> : null}
        </div>
        <button type="button" className="ghost-button small" onClick={onReset}>
          {fr.journal.reset}
        </button>
      </div>
      <div className="journal-panel-body" aria-live="polite">
        {entries.length === 0 ? (
          <p className="journal-empty">{fr.journal.empty}</p>
        ) : (
          <ol className="journal-list">
            {entries.map((entry, index) => (
              <li
                key={`${index}-${entry}`}
                className={entry === fr.journal.resetMarker ? 'journal-entry reset' : 'journal-entry'}
              >
                <span className="journal-index">{index + 1}</span>
                <code className="journal-call">{entry}</code>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
