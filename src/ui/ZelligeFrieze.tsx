import type { CSSProperties, JSX } from 'react'
import patternUrl from './zellige-pattern.webp?inline'
import './ZelligeFrieze.css'

/**
 * Zellige frieze painted inside a visualization, faded towards the middle so
 * the structure stays readable. Render it as the first child of a stage.
 */
export function ZelligeFrieze(): JSX.Element {
  return (
    <div className="viz-zellige" aria-hidden="true">
      <div
        className="viz-zellige-tile"
        style={{ '--zl-pattern': `url("${patternUrl}")` } as CSSProperties}
      />
    </div>
  )
}
