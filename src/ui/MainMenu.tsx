import type { JSX } from 'react'
import { config } from '../config'
import { fr } from '../i18n/fr'
import { getExercices } from '../exercices'
import type { Exercise } from '../exercices/types'
import { BrandMark } from './BrandMark'
import { ChapterIcon } from './ChapterIcon'
import { CreditsMenu } from './CreditsMenu'
import { MenuScene } from './MenuScene'
import { PresaDownload } from './PresaDownload'
import { SiteFooter } from './SiteFooter'
import { ThemeToggle } from './ThemeToggle'
import { ZelligeFrieze } from './ZelligeFrieze'
import { chapterHash, exerciseHash, navigate, EXERCICES_HASH } from './useHashRoute'
import { ExerciseIcon } from '../exercices/ExerciseIcon'
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
  exercices?: readonly Exercise[]
}

function ArrowIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" focusable="false">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function scrollToChapters(): void {
  document.getElementById('menu-chapters')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function MainMenu({
  plugins,
  theme,
  onTheme,
  exercices,
}: MainMenuProps): JSX.Element {
  const open = (chapter: number): void => navigate(chapterHash(chapter))
  const exercises = exercices ?? getExercices()
  const [titleLead, ...titleRest] = fr.menu.title.split(' ')
  const titleAccent = titleRest.join(' ')
  const entries = [
    ...plugins.map((plugin) => ({
      kind: 'plugin' as const,
      chapter: plugin.chapter,
      plugin,
    })),
    ...fr.menu.soonItems.map((item) => ({
      kind: 'soon' as const,
      chapter: item.chapter,
      item,
    })),
  ].sort((first, second) => first.chapter - second.chapter)

  return (
    <div className="app menu-app">
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
          <a
            className="menu-exercices-link"
            href={EXERCICES_HASH}
            aria-label={fr.exercices.menuLinkAria}
            title={fr.exercices.menuLinkAria}
            onClick={(event) => {
              event.preventDefault()
              navigate(EXERCICES_HASH)
            }}
          >
            <ExerciseIcon />
            <span>{fr.exercices.menuLink}</span>
          </a>
          <ThemeToggle theme={theme} onTheme={onTheme} />
          <PresaDownload />
          <CreditsMenu />
        </div>
      </header>

      <main className="menu-main" aria-labelledby="menu-title">
        <section className="menu-hero">
          <ZelligeFrieze />
          <div className="menu-hero-copy">
            <p className="menu-eyebrow">{fr.menu.eyebrow}</p>
            <h1 id="menu-title" className="menu-title">
              <span>{titleLead}</span>{' '}
              {titleAccent ? <span className="menu-title-accent">{titleAccent}</span> : null}
            </h1>
            <p className="menu-subtitle">{fr.menu.subtitle}</p>
            <button type="button" className="menu-hero-cta" onClick={scrollToChapters}>
              {fr.menu.explore}
              <ArrowIcon />
            </button>
          </div>
          <MenuScene />
        </section>

        <section className="menu-section" aria-labelledby="menu-chapters">
          <div className="menu-section-head">
            <div>
              <p className="menu-section-eyebrow">{fr.menu.chapters}</p>
              <h2 id="menu-chapters" className="menu-section-title">
                {fr.menu.choose}
              </h2>
            </div>
            <p className="menu-section-note">{fr.menu.chooseHint}</p>
          </div>
          <ul className="chapter-grid">
            {entries.map((entry) =>
              entry.kind === 'plugin' ? (
                <li key={entry.plugin.id}>
                  <a
                    className="chapter-card"
                    href={chapterHash(entry.plugin.chapter)}
                    aria-label={fr.menu.openAria(entry.plugin.title)}
                    onClick={(event) => {
                      event.preventDefault()
                      open(entry.plugin.chapter)
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return
                      event.preventDefault()
                      open(entry.plugin.chapter)
                    }}
                  >
                    <span className="chapter-card-num" aria-hidden="true">
                      {String(entry.plugin.chapter).padStart(2, '0')}
                    </span>
                    <ChapterIcon chapter={entry.plugin.chapter} />
                    <div className="chapter-card-body">
                      <span className="chapter-chip">
                        {fr.menu.chapterLabel(entry.plugin.chapter)}
                      </span>
                      <h3 className="chapter-card-title">{entry.plugin.title}</h3>
                      <p className="chapter-card-description">{entry.plugin.description}</p>
                    </div>
                    <div className="chapter-card-foot">
                      <span className="chapter-card-cta">{fr.menu.open}</span>
                      <span className="chapter-card-go" aria-hidden="true">
                        <ArrowIcon />
                      </span>
                    </div>
                  </a>
                </li>
              ) : (
                <li key={`soon-${entry.item.chapter}`}>
                  <div
                    className="chapter-card is-soon"
                    aria-disabled="true"
                    aria-label={fr.menu.soonAria(entry.item.title)}
                  >
                    <span className="chapter-card-num" aria-hidden="true">
                      {String(entry.item.chapter).padStart(2, '0')}
                    </span>
                    <ChapterIcon chapter={entry.item.chapter} />
                    <div className="chapter-card-body">
                      <span className="chapter-chip">
                        {fr.menu.chapterLabel(entry.item.chapter)}
                      </span>
                      <h3 className="chapter-card-title">{entry.item.title}</h3>
                      <p className="chapter-card-description">{entry.item.description}</p>
                    </div>
                    <div className="chapter-card-foot">
                      <span className="chapter-card-cta">{fr.menu.soon}</span>
                      <span className="chapter-card-go" aria-hidden="true">
                        <ArrowIcon />
                      </span>
                    </div>
                  </div>
                </li>
              ),
            )}
          </ul>
        </section>

        {exercises.length > 0 ? (
          <section
            className="menu-section menu-exercices-section"
            aria-labelledby="menu-exercices-title"
          >
            <div className="menu-section-head">
              <div>
                <p className="menu-section-eyebrow">{fr.exercices.menuCardEyebrow}</p>
                <h2 id="menu-exercices-title" className="menu-section-title">
                  {fr.exercices.menuCardTitle}
                </h2>
              </div>
              <p className="menu-section-note">{fr.exercices.menuCardDescription}</p>
            </div>
            <ul className="exercise-list">
              {exercises.map((exercise) => (
                <li key={exercise.id}>
                  <a
                    className="exercise-card"
                    href={exerciseHash(exercise.id)}
                    aria-label={fr.exercices.menuCardAria(exercise.title)}
                    onClick={(event) => {
                      event.preventDefault()
                      navigate(exerciseHash(exercise.id))
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return
                      event.preventDefault()
                      navigate(exerciseHash(exercise.id))
                    }}
                  >
                    <span className="exercise-card-icon">
                      <ExerciseIcon />
                    </span>
                    <div className="exercise-card-body">
                      <span className="exercise-card-kicker">{fr.exercices.sheetEyebrow}</span>
                      <h3 className="exercise-card-title">{exercise.title}</h3>
                      <p className="exercise-card-text">
                        {fr.exercices.questionCount(exercise.questions.length)} ·{' '}
                        {fr.menu.chapterLabel(exercise.chapter)}
                      </p>
                    </div>
                    <span className="exercise-card-cta">
                      {fr.exercices.openExercise}
                      <ArrowIcon />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  )
}
