import type { JSX, MouseEvent, ReactNode } from 'react'
import { config } from '../config'
import { fr } from '../i18n/fr'
import { BrandMark } from '../ui/BrandMark'
import { SiteFooter } from '../ui/SiteFooter'
import { ThemeToggle } from '../ui/ThemeToggle'
import { MENU_HASH, navigate } from '../ui/useHashRoute'
import './exercices.css'

interface ExercicesShellProps {
  eyebrow: string
  title: string
  theme: 'light' | 'dark'
  onTheme: () => void
  showMenuLink?: boolean
  children: ReactNode
}

function BackIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" className="button-icon" aria-hidden="true">
      <path
        d="M12.5 4.5 7 10l5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 10h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function HomeIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" className="button-icon" aria-hidden="true">
      <path
        d="M3.2 9.2 10 3.4l6.8 5.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 8.5v8h10v-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 16.5v-4.1h3.6v4.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Exercise pages reuse the demo shell, tokens and footer. */
export function ExercicesShell({
  eyebrow,
  title,
  theme,
  onTheme,
  showMenuLink = false,
  children,
}: ExercicesShellProps): JSX.Element {
  const home = (): void => {
    navigate(MENU_HASH)
  }
  const goMenu = (event: MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault()
    home()
  }

  return (
    <div className="app has-footer exercices-app">
      <header className="app-header exercices-header">
        <div className="brand">
          <button
            type="button"
            className="brand-home"
            onClick={home}
            title={fr.menu.homeAria}
            aria-label={fr.menu.homeLabel}
          >
            <HomeIcon />
          </button>
          <span className="brand-mark" aria-hidden="true">
            <BrandMark />
          </span>
          <div className="brand-copy">
            <div className="brand-meta">
              <span className="chapter-chip exercices-chip">{eyebrow}</span>
              <span className="brand-course">{config.course}</span>
              <span className="brand-sep brand-institution-sep" aria-hidden="true">
                ·
              </span>
              <span className="brand-institution-name">{config.institutionName}</span>
            </div>
            <div className="brand-title-row">
              <span className="exercices-brand-title">{title}</span>
              <span className="brand-rule" aria-hidden="true" />
              <span className="brand-credit">
                <span className="credit-prefix">{config.creditPrefix} </span>
                <span className="credit-name">{config.professor}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {showMenuLink ? (
            <a
              href={MENU_HASH}
              className="exercices-header-link"
              onClick={goMenu}
              title={fr.exercices.backMenuAria}
              aria-label={fr.exercices.backMenuAria}
            >
              <BackIcon />
              <span>{fr.exercices.backMenu}</span>
            </a>
          ) : null}
          <ThemeToggle theme={theme} onTheme={onTheme} />
        </div>
      </header>

      <main className="exercices-main">{children}</main>

      <SiteFooter />
    </div>
  )
}
