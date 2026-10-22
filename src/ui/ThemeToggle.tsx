import type { JSX } from 'react'
import { fr } from '../i18n/fr'

interface ThemeToggleProps {
  theme: 'light' | 'dark'
  onTheme: () => void
}

export function ThemeToggle({ theme, onTheme }: ThemeToggleProps): JSX.Element {
  const label = theme === 'light' ? fr.header.themeDark : fr.header.themeLight
  return (
    <button
      type="button"
      className="header-icon-button"
      onClick={onTheme}
      title={label}
      aria-label={label}
    >
      <ThemeIcon theme={theme} />
    </button>
  )
}

function ThemeIcon({ theme }: { theme: 'light' | 'dark' }): JSX.Element {
  if (theme === 'light') {
    return (
      <svg viewBox="0 0 20 20" className="button-icon" aria-hidden="true">
        <path
          d="M15.7 12.3A6.2 6.2 0 0 1 7.7 4.3a6.3 6.3 0 1 0 8 8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 20 20" className="button-icon" aria-hidden="true">
      <circle cx="10" cy="10" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10 2.5v1.6M10 15.9v1.6M2.5 10h1.6M15.9 10h1.6M4.7 4.7l1.1 1.1M14.2 14.2l1.1 1.1M15.3 4.7l-1.1 1.1M5.8 14.2l-1.1 1.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
