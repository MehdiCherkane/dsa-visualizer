import type { JSX } from 'react'
import './SiteBackdrop.css'

/**
 * Site-wide decoration: a faint Moroccan zellige tessellation. The tile is the
 * classic eight-pointed khatam star (two overlapping squares) with its inner
 * octagon, a centre diamond and a small diamond at each crossing. Everything is
 * drawn with the gold accent token, so it follows the light and dark themes.
 */
export function SiteBackdrop(): JSX.Element {
  return (
    <div className="site-backdrop">
      <svg role="presentation" aria-hidden="true" focusable="false">
        <defs>
          <pattern
            id="zl-tile"
            width="200"
            height="200"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(1.2)"
          >
            <g className="zl-star">
              {/* eight-pointed khatam star: outer points at radius 92, notches at 66 */}
              <path d="M192 100 161 125.3 165.1 165.1 125.3 161 100 192 74.7 161 34.9 165.1 39 125.3 8 100 39 74.7 34.9 34.9 74.7 39 100 8 125.3 39 165.1 34.9 161 74.7Z" />
            </g>
            <g className="zl-line">
              {/* octagon joining the star's inner vertices */}
              <path d="M161 125.3 125.3 161 74.7 161 39 125.3 39 74.7 74.7 39 125.3 39 161 74.7Z" />
            </g>
            <g className="zl-glyph">
              {/* centre diamond */}
              <path d="M100 70 130 100 100 130 70 100Z" />
              {/* crossing diamond, shared by the four neighbouring tiles */}
              <path d="M0-19 19 0 0 19-19 0Z" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#zl-tile)" />
      </svg>
    </div>
  )
}
