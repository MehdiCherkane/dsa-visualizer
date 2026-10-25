import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'
import { config } from '../config'
import { fr } from '../i18n/fr'

export function Shortcuts(): JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent): void => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setOpen(false)
      requestAnimationFrame(() => triggerRef.current?.focus())
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="shortcuts" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={open ? 'header-icon-button active' : 'header-icon-button'}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="shortcuts-popover"
        title={fr.header.shortcutsHelp}
        aria-label={fr.header.shortcutsHelp}
      >
        <span aria-hidden="true">?</span>
      </button>
      {open ? (
        <div id="shortcuts-popover" className="shortcuts-popover" role="dialog" aria-label={fr.shortcuts.title}>
          <p className="shortcuts-title">{fr.shortcuts.title}</p>
          <p className="shortcuts-hint">{fr.shortcuts.hint}</p>
          {fr.shortcuts.rows.map((row) => (
            <div key={row.label} className="shortcuts-row">
              <span>{row.label}</span>
              <span className="badge-row">
                {row.keys.map((key) => (
                  <kbd key={key} className="keycap">
                    {key}
                  </kbd>
                ))}
              </span>
            </div>
          ))}
          <div className="shortcuts-about">
            <p className="shortcuts-about-title">{fr.header.about}</p>
            <p>{config.institution}</p>
            <p>{config.source}</p>
            <div className="shortcuts-credits">
              <p className="shortcuts-credits-title">{fr.credits.title} :</p>
              {fr.credits.names.map((name) => (
                <p key={name}>{name}</p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
