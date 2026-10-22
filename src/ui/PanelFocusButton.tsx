import type { JSX } from 'react'
import { fr } from '../i18n/fr'

interface PanelFocusButtonProps {
  title: string
  focused: boolean
  onToggle: () => void
}

export function PanelFocusButton({
  title,
  focused,
  onToggle,
}: PanelFocusButtonProps): JSX.Element {
  const label = focused ? fr.dock.restorePane(title) : fr.dock.focusPane(title)
  return (
    <button
      type="button"
      className="panel-focus-button"
      onClick={onToggle}
      title={label}
      aria-label={label}
      aria-pressed={focused}
    >
      {focused ? <RestoreIcon /> : <FocusIcon />}
    </button>
  )
}

function FocusIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M3 7V3h4M15 7V3h-4M3 11v4h4M15 11v4h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RestoreIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M7 3v4H3M11 3v4h4M7 15v-4H3M11 15v-4h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
