import type { CSSProperties, JSX } from 'react'
import patternUrl from './zellige-pattern.webp?inline'
import './SiteBackdrop.css'

/**
 * Moroccan zellige frieze along the left and right edges of every page. It sits
 * behind the content and fades towards the middle so the centre stays quiet.
 */
export function ZelligeBackdrop(): JSX.Element {
  return (
    <div className="site-backdrop">
      <ZelligeLayer />
    </div>
  )
}

function ZelligeLayer(): JSX.Element {
  return (
    <div className="site-backdrop-zellige" aria-hidden="true">
      <div
        className="site-backdrop-zellige-tile"
        style={{ '--zl-pattern': `url("${patternUrl}")` } as CSSProperties}
      />
    </div>
  )
}
