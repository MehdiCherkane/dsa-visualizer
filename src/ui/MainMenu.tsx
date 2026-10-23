import type { JSX } from 'react'
import { config } from '../config'
import { fr } from '../i18n/fr'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from './ThemeToggle'
import { chapterHash, navigate } from './useHashRoute'
import './MainMenu.css'

/** Metadata-only view of a registered plugin: the menu knows nothing about snapshots. */
export interface MenuPlugin {
  id: string
  chapter: number
  title: string
  description: string
}

interface MainMenuProps {
  plugins: readonly MenuPlugin[]
  theme: 'light' | 'dark'
  onTheme: () => void
}

export function MainMenu({ plugins, theme, onTheme }: MainMenuProps): JSX.Element {
  const open = (chapter: number): void => navigate(chapterHash(chapter))

  return (
    <div className="app menu-app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <BrandMark />
          </span>
          <div className="brand-copy">
            <div className="brand-meta menu-brand-meta">
              {config.course} · {config.school} · {config.institutionName}
            </div>
          </div>
        </div>

        <div className="header-actions">
          <ThemeToggle theme={theme} onTheme={onTheme} />
        </div>
      </header>

      <main className="menu-main" aria-labelledby="menu-title">
        <section className="menu-hero">
          <div className="menu-hero-copy">
            <p className="menu-eyebrow">{fr.menu.eyebrow}</p>
            <h1 id="menu-title" className="menu-title">
              {fr.menu.title}
            </h1>
            <p className="menu-subtitle">{fr.menu.subtitle}</p>
          </div>
        </section>

        <section className="menu-section" aria-labelledby="menu-chapters">
          <h2 id="menu-chapters" className="menu-section-title">
            {fr.menu.chapters}
          </h2>
          <ul className="chapter-grid">
            {plugins.map((plugin) => (
              <li key={plugin.id}>
                <a
                  className="chapter-card"
                  href={chapterHash(plugin.chapter)}
                  aria-label={fr.menu.openAria(plugin.title)}
                  onClick={(event) => {
                    event.preventDefault()
                    open(plugin.chapter)
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return
                    event.preventDefault()
                    open(plugin.chapter)
                  }}
                >
                  <span className="chapter-card-head">
                    <span className="chapter-chip">{fr.menu.chapterLabel(plugin.chapter)}</span>
                    <span className="chapter-card-open" aria-hidden="true">
                      {fr.menu.open}
                    </span>
                  </span>
                  <span className="chapter-card-title">{plugin.title}</span>
                  <span className="chapter-card-description">{plugin.description}</span>
                  <span className="chapter-card-hint">{fr.menu.cardHint}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {fr.menu.soonItems.length > 0 ? (
          <section className="menu-section" aria-labelledby="menu-soon">
            <h2 id="menu-soon" className="menu-section-title">
              {fr.menu.soonTitle}
            </h2>
            <ul className="chapter-grid is-soon-grid">
              {fr.menu.soonItems.map((item) => (
                <li key={item.chapter}>
                  <div
                    className="chapter-card is-soon"
                    aria-disabled="true"
                    aria-label={fr.menu.soonAria(item.title)}
                  >
                    <span className="chapter-card-head">
                      <span className="chapter-chip">{fr.menu.chapterLabel(item.chapter)}</span>
                      <span className="chapter-card-soon">{fr.menu.soon}</span>
                    </span>
                    <span className="chapter-card-title">{item.title}</span>
                    <span className="chapter-card-description">{item.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      <footer className="menu-footer">
        <span>
          {config.institution}
          <span className="menu-footer-source"> · {config.source}</span>
        </span>
        <span className="menu-footer-offline">{fr.menu.footer}</span>
      </footer>
    </div>
  )
}
