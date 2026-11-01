import type { JSX } from 'react'
import presaIcon from '../assets/presa-icon.svg'
import { config } from '../config'
import { fr } from '../i18n/fr'
import { BrandMark } from './BrandMark'
import { SiteFooter } from './SiteFooter'
import { ThemeToggle } from './ThemeToggle'
import { MENU_HASH } from './useHashRoute'
import './PresaPage.css'

const PRESA_REPO_URL = 'https://github.com/HamzaAGOUR/Presa'

interface PresaPageProps {
  theme: 'light' | 'dark'
  onTheme: () => void
}

/** Presentation page for Presa, the Android presentation remote linked from the menu. */
export function PresaPage({ theme, onTheme }: PresaPageProps): JSX.Element {
  return (
    <div className="app presa-app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <BrandMark />
          </span>
          <div className="brand-copy">
            <div className="brand-meta menu-brand-meta">
              {config.course} · {config.institutionName}
            </div>
          </div>
        </div>

        <div className="header-actions">
          <a className="presa-back" href={MENU_HASH} aria-label={fr.presa.back}>
            <BackIcon />
            <span>{fr.presa.back}</span>
          </a>
          <ThemeToggle theme={theme} onTheme={onTheme} />
        </div>
      </header>

      <main className="presa-main">
        <section className="presa-hero">
          <div className="presa-hero-copy">
            <p className="presa-eyebrow">{fr.presa.eyebrow}</p>
            <h1 className="presa-title">Presa</h1>
            <p className="presa-tagline">{fr.presa.tagline}</p>
            <p className="presa-lead">{fr.presa.lead}</p>

            <a
              className="presa-cta"
              href={PRESA_REPO_URL}
              target="_blank"
              rel="noreferrer noopener"
              title={fr.presa.repoHint}
            >
              {fr.presa.repo}
              <ExternalIcon />
            </a>

            <ul className="presa-facts">
              {fr.presa.facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </div>

          <div className="presa-hero-art">
            <span className="presa-art-glow" aria-hidden="true" />
            <img
              className="presa-art-icon"
              src={presaIcon}
              alt={fr.presa.iconAlt}
              width={250}
              height={250}
            />
          </div>
        </section>

        <section className="presa-features" aria-labelledby="presa-features-title">
          <div className="presa-features-head">
            <p className="presa-section-eyebrow">{fr.presa.sectionEyebrow}</p>
            <h2 id="presa-features-title" className="presa-section-title">
              {fr.presa.featuresTitle}
            </h2>
          </div>

          <ul className="presa-feature-grid">
            {fr.presa.features.map((feature, index) => (
              <li className="presa-feature" key={feature.title}>
                <span className="presa-feature-num" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <SiteFooter />
      </main>
    </div>
  )
}

function BackIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M13 8H3m4-4L3 8l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ExternalIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M9.5 2.5H13.5V6.5M13.5 2.5L7.8 8.2M12 9.5V13.5H2.5V4H6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
