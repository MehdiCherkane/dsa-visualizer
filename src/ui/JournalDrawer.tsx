import type { JSX } from 'react'
import { fr } from '../i18n/fr'

interface JournalDrawerProps {
  entries: string[]
  onClose: () => void
  onReset: () => void
}

export function JournalDrawer({ entries, onClose, onReset }: JournalDrawerProps): JSX.Element {
  return (
    <>
      <div
        className="journal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="journal-drawer" aria-label={fr.journal.title}>
        <div className="journal-drawer-header">
          <div className="journal-drawer-title">
            <span className="panel-title">{fr.journal.title}</span>
            <span className="badge-count">{entries.length}</span>
          </div>
          <button type="button" className="ghost-button small" onClick={onReset}>
            {fr.journal.reset}
          </button>
        </div>
        <div className="journal-drawer-body" aria-live="polite">
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
        <div className="journal-drawer-foot">
          <button type="button" className="ghost-button small" onClick={onClose}>
            {fr.journal.close}
          </button>
        </div>
      </aside>
    </>
  )
}
