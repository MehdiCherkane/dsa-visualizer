import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { BaseSnapshot, ScenarioDef } from '../core/types'
import { fr, plural } from '../i18n/fr'

interface ScenariosMenuProps<S extends BaseSnapshot> {
  scenarios: ScenarioDef<S>[]
  currentId?: string
  onLoad: (scenario: ScenarioDef<S>) => void
}

export function ScenariosMenu<S extends BaseSnapshot>({
  scenarios,
  currentId,
  onLoad,
}: ScenariosMenuProps<S>): JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handler = (event: PointerEvent): void => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setOpen(false)
      requestAnimationFrame(() => triggerRef.current?.focus())
    }
    document.addEventListener('pointerdown', handler)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', handler)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="scenarios-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="primary-button scenarios-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="scenarios-popover"
      >
        <ScenariosIcon />
        {fr.scenarios.title}
        <span className={open ? 'scenarios-caret open' : 'scenarios-caret'} aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? (
        <div id="scenarios-popover" className="scenario-popover" role="menu">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              role="menuitem"
              className={scenario.id === currentId ? 'scenario-item current' : 'scenario-item'}
              onClick={() => {
                onLoad(scenario)
                setOpen(false)
              }}
            >
              <span className="scenario-item-head">
                <span className="scenario-item-title">{scenario.title}</span>
                <span className="scenario-item-count">
                  {scenario.steps.length > 0
                    ? plural(scenario.steps.length, 'opération', 'opérations')
                    : fr.scenarios.emptyShort}
                </span>
              </span>
              <span className="scenario-item-description">{scenario.description}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ScenariosIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" className="button-icon" aria-hidden="true">
      <path d="M4 5.5h12M4 10h12M4 14.5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="15" cy="14.5" r="1.4" fill="currentColor" />
    </svg>
  )
}
