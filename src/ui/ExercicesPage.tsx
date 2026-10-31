import { useCallback, useEffect, useState } from 'react'
import type { Dispatch, JSX, SetStateAction } from 'react'
import {
  currentQuestionIndex,
  isSolutionRevealed,
  readProgress,
  withCurrentQuestion,
  withSolutionHidden,
  withSolutionRevealed,
  writeProgress,
} from '../exercices/progress'
import type { ExercicesProgress } from '../exercices/progress'
import { exerciseById, exercises, totalQuestionCount } from '../exercices/registry'
import type { Exercise } from '../exercices/types'
import { fr } from '../i18n/fr'
import { BrandMark } from './BrandMark'
import { CreditsMenu } from './CreditsMenu'
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExercicesIcon,
  HomeIcon,
  PdfIcon,
} from './ExercicesIcon'
import { RichText } from './RichText'
import { SiteFooter } from './SiteFooter'
import { SolutionPanel } from './SolutionPanel'
import { ThemeToggle } from './ThemeToggle'
import { EXERCICES_HASH, exerciseHash, navigate } from './useHashRoute'
import '../exercices/exercices.css'

interface ExercicesPageProps {
  exerciseId?: string
  theme: 'light' | 'dark'
  onTheme: () => void
  onMenu: () => void
}

interface SheetProps {
  exercise: Exercise
  progress: ExercicesProgress
  onProgress: Dispatch<SetStateAction<ExercicesProgress>>
}

function MandatoryNotice(): JSX.Element {
  return (
    <aside className="exercices-mandatory" role="note">
      <p>{fr.exercices.mandatoryBefore}</p>
      <p className="exercices-mandatory-compare">{fr.exercices.mandatoryCompare}</p>
    </aside>
  )
}

function HomeButton({ onMenu }: { onMenu: () => void }): JSX.Element {
  return (
    <button
      type="button"
      className="brand-home"
      onClick={onMenu}
      title={fr.menu.homeAria}
      aria-label={fr.menu.homeLabel}
    >
      <HomeIcon />
    </button>
  )
}

function ExercicesHeader({
  exercise,
  theme,
  onTheme,
  onMenu,
}: {
  exercise?: Exercise
  theme: 'light' | 'dark'
  onTheme: () => void
  onMenu: () => void
}): JSX.Element {
  const summary = fr.exercices.summary(exercises.length, totalQuestionCount(exercises))

  return (
    <header className="app-header exercices-header">
      <div className="brand">
        <HomeButton onMenu={onMenu} />
        <span className="brand-mark" aria-hidden="true">
          <BrandMark />
        </span>
        <div className="brand-copy">
          <div className="brand-meta">
            <span className="chapter-chip">{fr.exercices.eyebrow}</span>
            <span className="brand-course">{fr.app.course}</span>
            <span className="brand-sep" aria-hidden="true">
              ·
            </span>
            <span className="brand-institution-name">{summary}</span>
          </div>
          <div className="brand-title-row">
            <h1>{fr.exercices.title}</h1>
            <span className="brand-rule" aria-hidden="true" />
            <span className="brand-credit">
              {exercise ? fr.exercices.chapterLabel(exercise.chapter) : fr.exercices.heading}
            </span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <a
          className="secondary-button exercices-header-link"
          href={EXERCICES_HASH}
          onClick={(event) => {
            event.preventDefault()
            navigate(EXERCICES_HASH)
          }}
        >
          <ExercicesIcon />
          <span>{fr.exercices.backToExercises}</span>
        </a>
        <CreditsMenu />
        <ThemeToggle theme={theme} onTheme={onTheme} />
      </div>
    </header>
  )
}

function ChapterPdfLinks({ chapters }: { chapters: number[] }): JSX.Element {
  return (
    <>
      {chapters.map((chapter) => (
        <a
          key={chapter}
          className="exercices-pdf-link"
          href={`./exercices/chapitre-${chapter}.pdf`}
          target="_blank"
          rel="noreferrer"
          aria-label={fr.exercices.pdfAria(chapter)}
        >
          <PdfIcon />
          <span>{fr.exercices.pdf}</span>
        </a>
      ))}
    </>
  )
}

function ExercicesList({
  progress,
  onOpen,
}: {
  progress: ExercicesProgress
  onOpen: (id: string) => void
}): JSX.Element {
  const chapters = [...new Set(exercises.map((exercise) => exercise.chapter))].sort(
    (first, second) => first - second,
  )

  return (
    <>
      <section className="exercices-hero" aria-labelledby="exercices-heading">
        <div className="exercices-hero-copy">
          <p className="exercices-eyebrow">{fr.exercices.eyebrow}</p>
          <h2 id="exercices-heading">{fr.exercices.heading}</h2>
          <p className="exercices-subtitle">{fr.exercices.subtitle}</p>
          <div className="exercices-hero-meta">
            <span>{fr.exercices.exerciseCount(exercises.length)}</span>
            <span>{fr.exercices.questionCount(totalQuestionCount(exercises))}</span>
          </div>
        </div>
        <div className="exercices-hero-actions">
          <span className="exercices-hero-icon" aria-hidden="true">
            <ExercicesIcon />
          </span>
          <ChapterPdfLinks chapters={chapters} />
        </div>
      </section>

      <section className="exercices-list-section" aria-labelledby="exercices-list-title">
        <div className="exercices-section-head">
          <div>
            <p className="exercices-eyebrow">{fr.exercices.title}</p>
            <h2 id="exercices-list-title">{fr.exercices.listTitle}</h2>
          </div>
          <p className="exercices-section-note">{fr.exercices.listHint}</p>
        </div>

        {exercises.length === 0 ? (
          <p className="exercices-empty">{fr.exercices.empty}</p>
        ) : (
          <ul className="exercices-grid">
            {exercises.map((exercise) => {
              const seen = progress.revealed[exercise.id]?.length ?? 0
              return (
                <li key={exercise.id}>
                  <a
                    className="exercice-card"
                    href={exerciseHash(exercise.id)}
                    aria-label={fr.exercices.openSheetAria(exercise.title)}
                    onClick={(event) => {
                      event.preventDefault()
                      onOpen(exercise.id)
                    }}
                  >
                    <div className="exercice-card-head">
                      <span className="chapter-chip">
                        {fr.exercices.chapterLabel(exercise.chapter)}
                      </span>
                      <span className="exercice-card-icon" aria-hidden="true">
                        <ExercicesIcon />
                      </span>
                    </div>
                    <div className="exercice-card-body">
                      <h3>{exercise.title}</h3>
                      {exercise.intro ? (
                        <p>
                          <RichText text={exercise.intro} />
                        </p>
                      ) : null}
                    </div>
                    <div className="exercice-card-meta">
                      <span>{fr.exercices.questionCount(exercise.questions.length)}</span>
                      <span>
                        {fr.exercices.solutionsSeen(seen, exercise.questions.length)}
                      </span>
                    </div>
                    <div className="exercice-card-foot">
                      <span>{fr.exercices.openSheet}</span>
                      <span className="exercice-card-go" aria-hidden="true">
                        <ArrowRightIcon />
                      </span>
                    </div>
                  </a>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}

function ExerciseStepper({
  exercise,
  index,
  onSelect,
}: {
  exercise: Exercise
  index: number
  onSelect: (index: number) => void
}): JSX.Element {
  return (
    <nav className="exercise-stepper" aria-label={fr.exercices.stepperLabel}>
      <ol>
        {exercise.questions.map((question, questionIndex) => {
          const active = questionIndex === index
          return (
            <li key={question.id}>
              <button
                type="button"
                className={active ? 'exercise-step is-active' : 'exercise-step'}
                onClick={() => onSelect(questionIndex)}
                aria-current={active ? 'step' : undefined}
              >
                <span className="sr-only">{fr.exercices.stepperPrefix} </span>
                <span className="exercise-step-number">{questionIndex + 1}</span>
                <span className="exercise-step-title">
                  <RichText text={question.title} />
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function ExerciseSheet({ exercise, progress, onProgress }: SheetProps): JSX.Element {
  const total = exercise.questions.length
  const index = currentQuestionIndex(progress, exercise.id, total)
  const question = exercise.questions[index] ?? exercise.questions[0]
  const revealed = question
    ? isSolutionRevealed(progress, exercise.id, question.id)
    : false

  const goTo = useCallback(
    (target: number) => {
      const clamped = Math.max(0, Math.min(total - 1, target))
      onProgress((current) => withCurrentQuestion(current, exercise.id, clamped))
    },
    [exercise.id, onProgress, total],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      const target = event.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (
          tag === 'INPUT' ||
          tag === 'SELECT' ||
          tag === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }
      }
      event.preventDefault()
      goTo(event.key === 'ArrowLeft' ? index - 1 : index + 1)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, index])

  if (!question) {
    return <p className="exercices-empty">{fr.exercices.empty}</p>
  }

  const reveal = (): void => {
    onProgress((current) => withSolutionRevealed(current, exercise.id, question.id))
  }
  const hide = (): void => {
    onProgress((current) => withSolutionHidden(current, exercise.id, question.id))
  }

  return (
    <>
      <nav className="exercices-breadcrumb" aria-label={fr.exercices.title}>
        <a
          href={EXERCICES_HASH}
          onClick={(event) => {
            event.preventDefault()
            navigate(EXERCICES_HASH)
          }}
        >
          {fr.exercices.backToExercises}
        </a>
        <span aria-hidden="true">/</span>
        <span>{exercise.title}</span>
      </nav>

      <section className="exercise-sheet-head" aria-labelledby="exercise-sheet-title">
        <div className="exercise-sheet-copy">
          <span className="chapter-chip">{fr.exercices.chapterLabel(exercise.chapter)}</span>
          <h2 id="exercise-sheet-title">{exercise.title}</h2>
          {exercise.intro ? (
            <p className="exercise-sheet-intro">
              <RichText text={exercise.intro} />
            </p>
          ) : null}
          <div className="exercise-sheet-meta">
            <span>{fr.exercices.questionCount(total)}</span>
            <ChapterPdfLinks chapters={[exercise.chapter]} />
          </div>
        </div>
      </section>

      <ExerciseStepper exercise={exercise} index={index} onSelect={goTo} />

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {fr.exercices.questionAnnouncement(index + 1, total, question.title)}
      </p>

      <div className="exercise-layout">
        <section className="panel exercise-question" aria-labelledby="exercise-question-title">
          <header className="panel-header exercise-question-head">
            <div className="exercise-question-heading">
              <span className="exercise-question-count">
                {fr.exercices.questionLabel(index + 1, total)}
              </span>
              <h3 id="exercise-question-title">
                <RichText text={question.title} />
              </h3>
            </div>
            <span className="exercise-question-total">
              {fr.exercices.progressLabel}
            </span>
          </header>

          <div
            className="exercise-progress"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={index + 1}
            aria-label={fr.exercices.progressAria(index + 1, total)}
          >
            <span style={{ width: `${((index + 1) / total) * 100}%` }} />
          </div>

          <div className="exercise-question-body">
            <p className="exercise-statement">
              <RichText text={question.statement} />
            </p>

            {question.hints && question.hints.length > 0 ? (
              <details className="question-hints">
                <summary>
                  <span>{fr.exercices.hints}</span>
                  <small>{fr.exercices.hintsHint}</small>
                </summary>
                <ul>
                  {question.hints.map((hint) => (
                    <li key={hint}>
                      <RichText text={hint} />
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>

          <footer className="exercise-question-nav">
            <button
              type="button"
              className="secondary-button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label={fr.exercices.previousAria}
            >
              <ChevronLeftIcon />
              <span>{fr.exercices.previous}</span>
            </button>
            <span className="exercise-question-position">
              {fr.exercices.questionLabel(index + 1, total)}
            </span>
            <button
              type="button"
              className="primary-button"
              onClick={() => goTo(index + 1)}
              disabled={index === total - 1}
              aria-label={fr.exercices.nextAria}
            >
              <span>{fr.exercices.next}</span>
              <ChevronRightIcon />
            </button>
          </footer>
        </section>

        <SolutionPanel
          question={question}
          revealed={revealed}
          onReveal={reveal}
          onHide={hide}
        />
      </div>
    </>
  )
}

function ExerciseNotFound(): JSX.Element {
  return (
    <section className="panel exercise-not-found" aria-labelledby="exercise-not-found-title">
      <span className="exercise-not-found-icon" aria-hidden="true">
        <ExercicesIcon />
      </span>
      <h2 id="exercise-not-found-title">{fr.exercices.notFound}</h2>
      <p>{fr.exercices.notFoundBody}</p>
      <a
        className="primary-button"
        href={EXERCICES_HASH}
        onClick={(event) => {
          event.preventDefault()
          navigate(EXERCICES_HASH)
        }}
      >
        {fr.exercices.notFoundBack}
      </a>
    </section>
  )
}

export function ExercicesPage({
  exerciseId,
  theme,
  onTheme,
  onMenu,
}: ExercicesPageProps): JSX.Element {
  const [progress, setProgress] = useState<ExercicesProgress>(() => readProgress(exercises))
  const exercise = exerciseId ? exerciseById(exerciseId) : undefined

  useEffect(() => {
    writeProgress(progress)
  }, [progress])

  const openExercise = (id: string): void => {
    navigate(exerciseHash(id))
  }

  return (
    <div className="app has-footer exercices-app">
      <ExercicesHeader
        exercise={exercise}
        theme={theme}
        onTheme={onTheme}
        onMenu={onMenu}
      />

      <main className="exercices-main" id="exercices-main">
        <div className="exercices-wrap">
          <MandatoryNotice />
          {exerciseId ? (
            exercise ? (
              <ExerciseSheet
                key={exercise.id}
                exercise={exercise}
                progress={progress}
                onProgress={setProgress}
              />
            ) : (
              <ExerciseNotFound />
            )
          ) : (
            <ExercicesList progress={progress} onOpen={openExercise} />
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
