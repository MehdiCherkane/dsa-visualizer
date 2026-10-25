import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'
import { fr } from '../i18n/fr'

export function CreditsMenu(): JSX.Element {
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
    <div className="credits-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={open ? 'secondary-button credits-trigger active' : 'secondary-button credits-trigger'}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="credits-popover"
        title={fr.credits.title}
        aria-label={fr.credits.title}
      >
        <span>{fr.credits.title}</span>
        <span className={open ? 'credits-caret open' : 'credits-caret'} aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? (
        <div
          id="credits-popover"
          className="credits-popover"
          role="dialog"
          aria-label={fr.credits.title}
        >
          <p className="credits-popover-title">{fr.credits.title}</p>
          {fr.credits.names.map((name) => (
            <p key={name} className="credits-name">
              {name}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  )
}
