import type { JSX } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { pluginForChapter } from '../registry'
import { fr } from '../i18n/fr'
import { chapterHash, navigate } from '../ui/useHashRoute'
import { ExercicesShell } from './ExercicesShell'
import { CodeBlock } from './CodeBlock'
import { RichText } from './RichText'
import { exercisePdfHref } from './pdf'
import { readExerciseProgress, writeExerciseProgress } from './progress'
import { ExerciseIcon } from './ExerciseIcon'
import type { Exercise } from './types'

interface ExerciseSheetPageProps {
  exercise: Exercise
  theme: 'light' | 'dark'
  onTheme: () => void
}

export function ExerciseSheetPage({
  exercise,
  theme,
  onTheme,
}: ExerciseSheetPageProps): JSX.Element {
  const questions = exercise.questions
  const initialProgress = useMemo(() => readExerciseProgress(exercise.id, questions), [
    exercise.id,
    questions,
  ])
  const [questionIndex, setQuestionIndex] = useState(initialProgress.question)
  const [revealedIds, setRevealedIds] = useState<string[]>(initialProgress.revealed)

  const total = questions.length
  const question = questions[questionIndex] ?? questions[0]
  const questionNumber = questionIndex + 1
  const revealed = question ? revealedIds.includes(question.id) : false
  const solutionId = question ? `exercices-solution-${exercise.id}-${question.id}` : 'exercices-solution'

  const goTo = useCallback(
    (next: number): void => {
      if (next < 0 || next >= total) return
      if (next === questionIndex) return
      const current = questions[questionIndex]
      setRevealedIds((ids) => (current ? ids.filter((id) => id !== current.id) : ids))
      setQuestionIndex(next)
    },
    [questions, questionIndex, total],
  )

  const toggleSolution = useCallback((): void => {
    if (!question) return
    setRevealedIds((ids) =>
      ids.includes(question.id) ? ids.filter((id) => id !== question.id) : [...ids, question.id],
    )
  }, [question])

  useEffect(() => {
    writeExerciseProgress(exercise.id, questionIndex, revealedIds, questions)
  }, [exercise.id, questionIndex, revealedIds, questions])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented) return
      if (event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        if (target.isContentEditable) return
        if (target.closest('pre, textarea, input, select, [contenteditable="true"]')) return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        navigate('#/')
        return
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        const next = questionIndex + (event.key === 'ArrowRight' ? 1 : -1)
        if (next < 0 || next >= total) return
        goTo(next)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goTo, questionIndex, total])

  if (total === 0) {
    return (
      <ExercicesShell
        eyebrow={fr.exercices.eyebrow}
        title={fr.exercices.title}
        theme={theme}
        onTheme={onTheme}
      >
        <p className="exercices-empty">{fr.exercices.empty}</p>
      </ExercicesShell>
    )
  }

  const plugin = pluginForChapter(exercise.chapter)

  return (
    <ExercicesShell
      eyebrow={fr.exercices.sheetEyebrow}
      title={exercise.title}
      theme={theme}
      onTheme={onTheme}
    >
      <div className="exercices-main exercices-sheet-main">
        <div className="exercices-sheet-top">
          <a
            className="exercices-back-link"
            href="#/exercices"
            onClick={(event) => {
              event.preventDefault()
              navigate('#/exercices')
            }}
          >
            {fr.exercices.backExercises}
          </a>
          <div className="exercices-sheet-actions">
            <a className="ghost-button" href={exercisePdfHref(exercise.id)} target="_blank" rel="noreferrer">
              {fr.exercices.openPdf}
            </a>
            {plugin ? (
              <a className="ghost-button" href={chapterHash(plugin.chapter)}>
                {fr.exercices.simulate}
              </a>
            ) : null}
          </div>
        </div>

        <section className="exercices-intro">
          <div className="exercices-intro-copy">
            <p className="exercices-hero-eyebrow">{fr.exercices.eyebrow}</p>
            <h1 className="exercices-hero-title">{exercise.title}</h1>
            <div className="exercices-intro-meta">
              <span className="exercise-card-chip">{fr.exercices.questionCount(total)}</span>
              <span>{fr.menu.chapterLabel(exercise.chapter)}</span>
            </div>
            {exercise.intro ? (
              <RichText text={exercise.intro} className="exercices-intro-text" />
            ) : null}
          </div>
        </section>

        <aside className="exercices-callout" role="note">
          <p>{fr.exercices.callout}</p>
        </aside>

        <section
          className="exercices-workspace"
          aria-label={fr.exercices.questionRegionAria(question.title)}
        >
          <div className="exercices-statement-card">
            <div className="exercices-question-head">
              <span className="exercices-question-count">{fr.exercices.questionProgress(questionNumber, total)}</span>
              <h2 className="exercices-question-title">{question.title}</h2>
            </div>

            <ol className="exercices-stepper" aria-label={fr.exercices.stepperLabel}>
              {questions.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={index === questionIndex ? 'active' : ''}
                    onClick={() => goTo(index)}
                    aria-current={index === questionIndex ? 'step' : undefined}
                    aria-label={fr.exercices.stepAria(index + 1, total)}
                  >
                    {index + 1}
                  </button>
                </li>
              ))}
            </ol>

            <div
              className="exercices-progress"
              role="progressbar"
              aria-label={fr.exercices.progressAria}
              aria-valuemin={1}
              aria-valuemax={total}
              aria-valuenow={questionNumber}
              aria-valuetext={fr.exercices.questionProgress(questionNumber, total)}
            >
              <span
                className="exercices-progress-fill"
                style={{ width: `${Math.max(0, Math.min(100, (questionNumber / total) * 100))}%` }}
              />
            </div>

            <div className="exercices-question-body">
              <RichText text={question.statement} className="exercices-statement-text" />

              {question.hints && question.hints.length > 0 ? (
                <details className="exercices-hints">
                  <summary>{fr.exercices.hintsTitle}</summary>
                  <ul>
                    {question.hints.map((hint) => (
                      <li key={hint}>{hint}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>

            <div className="exercices-nav">
              <button
                type="button"
                className="secondary-button"
                onClick={() => goTo(questionIndex - 1)}
                disabled={questionIndex === 0}
              >
                {fr.exercices.previous}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => goTo(questionIndex + 1)}
                disabled={questionIndex >= total - 1}
              >
                {fr.exercices.next}
              </button>
            </div>
          </div>

          <div className="exercices-code-column">
            <section className="exercices-solution" aria-labelledby={`${solutionId}-title`}>
              <header className="exercices-solution-head">
                <div className="exercices-solution-head-text">
                  <span className="exercices-code-kicker">{fr.exercices.solutionKicker}</span>
                  <h3 id={`${solutionId}-title`} className="exercices-solution-title">
                    {fr.exercices.solutionTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  className={revealed ? 'secondary-button' : 'primary-button'}
                  onClick={toggleSolution}
                  aria-expanded={revealed}
                  aria-controls={solutionId}
                >
                  {revealed ? fr.exercices.hideSolution : fr.exercices.showSolution}
                </button>
              </header>

              {revealed && question ? (
                <div className="exercices-solution-body" id={solutionId}>
                  <p className="exercices-solution-warning" role="note">
                    {fr.exercices.solutionWarning}
                  </p>
                  <CodeBlock
                    code={question.solutionCode}
                    ariaLabel={fr.exercices.codeAria(question.title)}
                  />
                  {question.solutionNotes ? (
                    <div className="exercices-solution-notes">
                      <h4>{fr.exercices.solutionNoteTitle}</h4>
                      <p>{question.solutionNotes}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {!revealed ? (
                <div className="exercices-solution-hidden">
                  <ExerciseIcon className="exercices-solution-hidden-icon" />
                  <p>{fr.exercices.solutionHiddenText}</p>
                </div>
              ) : null}
            </section>
          </div>
        </section>

        <p className="exercices-announcer exercices-sr-only" aria-live="polite" aria-atomic="true">
          {fr.exercices.questionAnnouncement(questionNumber, total)}
        </p>
      </div>
    </ExercicesShell>
  )
}
