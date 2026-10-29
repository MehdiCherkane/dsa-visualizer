import type { JSX, KeyboardEvent, MouseEvent } from 'react'
import { fr } from '../i18n/fr'
import { exerciseHash, navigate } from '../ui/useHashRoute'
import { ExercicesShell } from './ExercicesShell'
import { ExerciseIcon } from './ExerciseIcon'
import type { Exercise } from './types'

interface ExercicesPageProps {
  exercises: readonly Exercise[]
  theme: 'light' | 'dark'
  onTheme: () => void
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

function preview(intro?: string): string {
  if (!intro) return fr.exercices.menuCardDescription
  const prose = intro
    .split('```')
    .filter((_, index) => index % 2 === 0)
    .join(' ')
    .replace(/`[^`]*`/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const sentence = prose.endsWith('.') ? prose : `${prose}.`
  return sentence.length > 180 ? `${sentence.slice(0, 180).trimEnd()}…` : sentence
}

export function ExercicesPage({ exercises, theme, onTheme }: ExercicesPageProps): JSX.Element {
  const open = (exercise: Exercise): void => {
    navigate(exerciseHash(exercise.id))
  }

  const goToExercise = (event: MouseEvent<HTMLAnchorElement>, exercise: Exercise): void => {
    event.preventDefault()
    open(exercise)
  }

  const onCardKeyDown = (event: KeyboardEvent<HTMLAnchorElement>, exercise: Exercise): void => {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return
    event.preventDefault()
    open(exercise)
  }

  const totalQuestions = exercises.reduce((sum, exercise) => sum + exercise.questions.length, 0)

  return (
    <ExercicesShell
      eyebrow={fr.exercices.eyebrow}
      title={fr.exercices.title}
      theme={theme}
      onTheme={onTheme}
    >
      <aside className="exercices-callout" role="note">
        <p>{fr.exercices.callout}</p>
      </aside>

      <section className="exercices-hero">
        <div className="exercices-hero-copy">
          <p className="exercices-hero-eyebrow">{fr.exercices.menuCardEyebrow}</p>
          <h1 className="exercices-hero-title">{fr.exercices.title}</h1>
          <p className="exercices-hero-lead">{fr.exercices.lead}</p>
          <div className="exercices-hero-stats">
            <span className="exercices-stat">
              <strong>{exercises.length}</strong> {fr.exercices.menuCardCount(exercises.length)}
            </span>
            <span className="exercices-stat">
              <strong>{totalQuestions}</strong> {fr.exercices.questionCount(totalQuestions)}
            </span>
          </div>
        </div>
        <div className="exercices-hero-art" aria-hidden="true">
          <ExerciseIcon className="exercices-hero-icon" />
        </div>
      </section>

      <section className="menu-section exercices-list-section" aria-labelledby="exercices-list-title">
        <div className="menu-section-head">
          <div>
            <p className="menu-section-eyebrow">{fr.exercices.sheetEyebrow}</p>
            <h2 id="exercices-list-title" className="menu-section-title">
              {fr.exercices.listTitle}
            </h2>
          </div>
          <p className="menu-section-note">{fr.exercices.listHint}</p>
        </div>

        <ul className="exercise-list">
          {exercises.map((exercise) => (
            <li key={exercise.id}>
              <a
                className="exercise-card"
                href={exerciseHash(exercise.id)}
                aria-label={fr.exercices.menuCardAria(exercise.title)}
                onClick={(event) => goToExercise(event, exercise)}
                onKeyDown={(event) => onCardKeyDown(event, exercise)}
              >
                <span className="exercise-card-icon">
                  <ExerciseIcon />
                </span>
                <div className="exercise-card-body">
                  <span className="exercise-card-kicker">{fr.exercices.menuCardEyebrow}</span>
                  <h3 className="exercise-card-title">{exercise.title}</h3>
                  <p className="exercise-card-text">{preview(exercise.intro)}</p>
                  <div className="exercise-card-meta">
                    <span className="exercise-card-chip">
                      {fr.exercices.questionCount(exercise.questions.length)}
                    </span>
                    <span>{fr.menu.chapterLabel(exercise.chapter)}</span>
                  </div>
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
    </ExercicesShell>
  )
}
