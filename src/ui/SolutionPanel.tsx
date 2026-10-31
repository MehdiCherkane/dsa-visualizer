import type { JSX } from 'react'
import { fr } from '../i18n/fr'
import type { Question } from '../exercices/types'
import { LockIcon } from './ExercicesIcon'
import { RichText } from './RichText'
import { tokenizeC } from './tokenizer'

interface SolutionPanelProps {
  question: Question
  revealed: boolean
  onReveal: () => void
  onHide: () => void
}

export function SolutionPanel({
  question,
  revealed,
  onReveal,
  onHide,
}: SolutionPanelProps): JSX.Element {
  const titleId = `solution-title-${question.id}`
  const bodyId = `solution-body-${question.id}`
  const codeId = `solution-code-${question.id}`
  const lines = question.solutionCode.replace(/\n$/, '').split('\n')

  return (
    <section className="panel solution-panel" aria-labelledby={titleId}>
      <header className="panel-header solution-header">
        <div className="solution-heading">
          <span className="code-lang-badge" aria-hidden="true">
            C
          </span>
          <div>
            <h2 id={titleId} className="solution-title">
              {fr.exercices.solutionTitle}
            </h2>
            <span className="solution-subtitle">{fr.exercices.solutionIntro}</span>
          </div>
        </div>
        <button
          type="button"
          className={revealed ? 'ghost-button small solution-toggle' : 'primary-button small solution-toggle'}
          onClick={revealed ? onHide : onReveal}
          aria-expanded={revealed}
          aria-controls={bodyId}
        >
          {revealed ? fr.exercices.hideSolution : fr.exercices.showSolution}
        </button>
      </header>

      <div className="solution-mandatory">
        <p>{fr.exercices.mandatoryBefore}</p>
        <p className="solution-mandatory-compare">{fr.exercices.mandatoryCompare}</p>
      </div>

      <div className="solution-body" id={bodyId}>
        {revealed ? (
          <>
            <div className="solution-code-meta">
              <span>{fr.exercices.codeLines(lines.length)}</span>
            </div>
            <div
              className="code-body solution-code-body"
              id={codeId}
              role="region"
              aria-label={fr.exercices.codeSectionAria(question.title)}
            >
              {lines.map((line, index) => (
                <div className="code-line solution-code-line" key={`${question.id}-${index}`}>
                  <span className="line-number">{index + 1}</span>
                  <code className="line-code">
                    {tokenizeC(line).map((token, tokenIndex) => (
                      <span key={`${index}-${tokenIndex}`} className={`token token-${token.kind}`}>
                        {token.text}
                      </span>
                    ))}
                  </code>
                </div>
              ))}
            </div>
            {question.solutionNotes ? (
              <div className="solution-notes">
                <strong>{fr.exercices.solutionNotes}</strong>
                <p>
                  <RichText text={question.solutionNotes} />
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <div className="solution-hidden">
            <span className="solution-hidden-icon" aria-hidden="true">
              <LockIcon />
            </span>
            <p>{fr.exercices.solutionHidden}</p>
          </div>
        )}
      </div>
    </section>
  )
}
