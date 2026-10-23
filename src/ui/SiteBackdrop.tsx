import type { CSSProperties, JSX } from 'react'
import { StructureScene } from './StructureScene'
import patternUrl from './zellige-pattern.webp?inline'
import './SiteBackdrop.css'

/**
 * Site background: a Moroccan zellige frieze along the left and right edges,
 * and the 3D still life of the course structures in the middle. Both layers are
 * painted with the theme tokens and stay behind the page content.
 */
export function SiteBackdrop(): JSX.Element {
  return (
    <div className="site-backdrop">
      <StructureScene />
      <div className="site-backdrop-zellige" aria-hidden="true">
        <div
          className="site-backdrop-zellige-tile"
          style={{ '--zl-pattern': `url("${patternUrl}")` } as CSSProperties}
        />
      </div>
    </div>
  )
}
