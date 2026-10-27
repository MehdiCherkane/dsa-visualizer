import type { CSSProperties, JSX } from 'react'
import { StructureScene } from './StructureScene'
import patternUrl from './zellige-pattern.webp?inline'
import './SiteBackdrop.css'

/**
 * Zellige frieze layer on its own. Every chapter page reuses it behind the
 * simulation panels; the menu adds the 3D still life on top of it.
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

/**
 * Site background: a Moroccan zellige frieze along the left and right edges,
 * and the 3D still life of the course structures in the middle. Both layers are
 * painted with the theme tokens and stay behind the page content.
 */
export function SiteBackdrop(): JSX.Element {
  return (
    <div className="site-backdrop">
      <StructureScene />
      <ZelligeLayer />
    </div>
  )
}
