import type { JSX } from 'react'
import { fr } from '../i18n/fr'

interface ScenarioStripProps {
  title: string
  cursor: number
  total: number
  nextCall?: string
  done: boolean
  empty: boolean
  onNext: () => void
  onQuit: () => void
  onReplay: () => void
  onClose: () => void
  disabled: boolean
}

export function ScenarioStrip({
  title,
  cursor,
  total,
  nextCall,
  done,
  empty,
  onNext,
  onQuit,
  onReplay,
  onClose,
  disabled,
}: ScenarioStripProps): JSX.Element {
  return (
    <section className="scenario-strip">
      <div className="scenario-strip-info">
        <span className="scenario-strip-label">{fr.scenarios.current}</span>
        <span className="scenario-strip-title" title={title}>
          {title}
        </span>
      </div>

      <div className="scenario-strip-middle">
        {empty ? (
          <span className="scenario-strip-empty">{fr.scenarios.emptyShort}</span>
        ) : done ? (
          <span className="scenario-strip-done">
            {fr.scenarios.finished} <span aria-hidden="true">✓</span>
          </span>
        ) : (
          <>
            <span className="scenario-dots" aria-hidden="true">
              {Array.from({ length: total }, (_, index) => (
                <span
                  key={index}
                  className={
                    index < cursor
                      ? 'scenario-dot done'
                      : index === cursor
                        ? 'scenario-dot current'
                        : 'scenario-dot'
                  }
                >
                  {index < cursor ? '●' : index === cursor ? '◉' : '○'}
                </span>
              ))}
            </span>
            {nextCall ? (
              <span className="scenario-strip-next">
                {fr.scenarios.nextShort} : <code>{nextCall}</code>
              </span>
            ) : null}
          </>
        )}
      </div>

      <div className="scenario-strip-actions">
        {empty ? (
          <button type="button" className="secondary-button small" onClick={onClose}>
            {fr.scenarios.close}
          </button>
        ) : done ? (
          <>
            <button type="button" className="primary-button small" onClick={onReplay}>
              {fr.scenarios.replay}
            </button>
            <button type="button" className="secondary-button small" onClick={onClose}>
              {fr.scenarios.close}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="primary-button scenario-next"
              onClick={onNext}
              disabled={disabled}
            >
              {fr.scenarios.next} <span aria-hidden="true">▸</span>
            </button>
            <button
              type="button"
              className="scenario-quit"
              onClick={onQuit}
              title={fr.scenarios.quit}
              aria-label={fr.scenarios.quit}
            >
              ✕
            </button>
          </>
        )}
      </div>
    </section>
  )
}
