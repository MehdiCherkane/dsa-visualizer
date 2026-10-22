import type { JSX } from 'react'
import './SiteBackdrop.css'

/**
 * Site-wide decoration: a faint 3D still life of the course structures
 * (doubly linked list, binary tree, graph, stacks) that floats behind the
 * page. It is painted with the theme tokens, so it follows light and dark.
 */
export function SiteBackdrop(): JSX.Element {
  return (
    <div className="site-backdrop">
      <svg
        viewBox="0 0 800 560"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id="bd-glow-blue" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" className="bd-stop-blue" stopOpacity="0.34" />
            <stop offset="1" className="bd-stop-blue" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bd-glow-purple" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" className="bd-stop-purple" stopOpacity="0.3" />
            <stop offset="1" className="bd-stop-purple" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bd-glow-orange" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" className="bd-stop-orange" stopOpacity="0.24" />
            <stop offset="1" className="bd-stop-orange" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="bd-ball-green" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" className="bd-stop-green" stopOpacity="0.5" />
            <stop offset="0.55" className="bd-stop-green" stopOpacity="1" />
            <stop offset="1" className="bd-stop-green" stopOpacity="0.75" />
          </radialGradient>
          <radialGradient id="bd-ball-purple" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" className="bd-stop-purple" stopOpacity="0.5" />
            <stop offset="0.55" className="bd-stop-purple" stopOpacity="1" />
            <stop offset="1" className="bd-stop-purple" stopOpacity="0.75" />
          </radialGradient>
          <radialGradient id="bd-ball-orange" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" className="bd-stop-orange" stopOpacity="0.55" />
            <stop offset="0.55" className="bd-stop-orange" stopOpacity="1" />
            <stop offset="1" className="bd-stop-orange" stopOpacity="0.75" />
          </radialGradient>

          <filter id="bd-blur" x="-30%" y="-150%" width="160%" height="400%">
            <feGaussianBlur stdDeviation="7" />
          </filter>

          <marker
            id="bd-arrow-next"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path className="bd-fill-next" d="M0,0 L10,5 L0,10 Z" />
          </marker>
          <marker
            id="bd-arrow-prev"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path className="bd-fill-prev" d="M0,0 L10,5 L0,10 Z" />
          </marker>

          {/* 3D cell: front 64x44 with a (14,-11) extrusion, coloured by `color` */}
          <g id="bd-cell">
            <polygon points="0,0 14,-11 78,-11 64,0" fill="currentColor" />
            <polygon points="0,0 14,-11 78,-11 64,0" fill="#fff" opacity="0.45" />
            <polygon points="64,0 78,-11 78,33 64,44" fill="currentColor" />
            <polygon points="64,0 78,-11 78,33 64,44" fill="#000" opacity="0.3" />
            <rect width="64" height="44" fill="currentColor" />
            <rect width="64" height="16" fill="#fff" opacity="0.12" />
            <rect className="bd-cell-edge" width="64" height="44" fill="none" strokeWidth="1.5" />
          </g>
        </defs>

        {/* soft glows */}
        <circle cx="400" cy="300" r="290" fill="url(#bd-glow-blue)" />
        <circle cx="620" cy="130" r="200" fill="url(#bd-glow-purple)" />
        <circle cx="130" cy="450" r="170" fill="url(#bd-glow-orange)" />

        {/* orbit */}
        <ellipse
          className="bd-orbit"
          cx="400"
          cy="370"
          rx="360"
          ry="120"
          fill="none"
          strokeWidth="1.5"
        />

        {/* doubly linked list */}
        <g>
          <g className="bd-shadow" filter="url(#bd-blur)">
            <ellipse cx="190" cy="412" rx="70" ry="9" />
            <ellipse cx="400" cy="412" rx="70" ry="9" />
            <ellipse cx="610" cy="412" rx="70" ry="9" />
          </g>

          <g fill="none" strokeWidth="3.5" strokeLinecap="round">
            <g className="bd-next-line">
              <line x1="248" y1="345" x2="342" y2="345" markerEnd="url(#bd-arrow-next)" />
              <line x1="458" y1="345" x2="552" y2="345" markerEnd="url(#bd-arrow-next)" />
            </g>
            <g className="bd-prev-line">
              <line x1="342" y1="374" x2="248" y2="374" markerEnd="url(#bd-arrow-prev)" />
              <line x1="552" y1="374" x2="458" y2="374" markerEnd="url(#bd-arrow-prev)" />
            </g>
          </g>

          <use
            href="#bd-cell"
            className="bd-cell-cool"
            transform="translate(140 330) scale(1.25)"
          />
          <use
            href="#bd-cell"
            className="bd-cell-cool"
            transform="translate(350 330) scale(1.25)"
          />
          <use
            href="#bd-cell"
            className="bd-cell-cool"
            transform="translate(560 330) scale(1.25)"
          />

          <g className="bd-divider-line" strokeWidth="2">
            <line x1="160" y1="330" x2="160" y2="385" />
            <line x1="200" y1="330" x2="200" y2="385" />
            <line x1="370" y1="330" x2="370" y2="385" />
            <line x1="410" y1="330" x2="410" y2="385" />
            <line x1="580" y1="330" x2="580" y2="385" />
            <line x1="620" y1="330" x2="620" y2="385" />
          </g>
          <g className="bd-fill-prev">
            <circle cx="150" cy="357" r="4.5" />
            <circle cx="360" cy="357" r="4.5" />
            <circle cx="570" cy="357" r="4.5" />
          </g>
          <g className="bd-fill-next">
            <circle cx="210" cy="357" r="4.5" />
            <circle cx="420" cy="357" r="4.5" />
            <circle cx="630" cy="357" r="4.5" />
          </g>
          <g className="bd-value" textAnchor="middle">
            <text x="180" y="367">9</text>
            <text x="390" y="367">2</text>
            <text x="600" y="367">5</text>
          </g>
        </g>

        {/* binary tree */}
        <g className="bd-float-1">
          <g className="bd-edge-green" strokeWidth="3" strokeLinecap="round">
            <line x1="600" y1="110" x2="548" y2="170" />
            <line x1="600" y1="110" x2="652" y2="170" />
            <line x1="548" y1="170" x2="520" y2="228" />
            <line x1="548" y1="170" x2="576" y2="228" />
            <line x1="652" y1="170" x2="680" y2="228" />
          </g>
          <g fill="url(#bd-ball-green)">
            <circle cx="600" cy="110" r="24" />
            <circle cx="548" cy="170" r="20" />
            <circle cx="652" cy="170" r="20" />
            <circle cx="520" cy="228" r="16" />
            <circle cx="576" cy="228" r="16" />
            <circle cx="680" cy="228" r="16" />
          </g>
          <g className="bd-node-label" textAnchor="middle">
            <text x="600" y="116">8</text>
            <text x="548" y="176">3</text>
            <text x="652" y="176">10</text>
          </g>
        </g>

        {/* graph */}
        <g className="bd-float-2">
          <g className="bd-edge-purple" strokeWidth="2.5" strokeLinecap="round">
            <line x1="130" y1="120" x2="215" y2="85" />
            <line x1="215" y1="85" x2="290" y2="150" />
            <line x1="130" y1="120" x2="175" y2="205" />
            <line x1="215" y1="85" x2="175" y2="205" />
            <line x1="290" y1="150" x2="175" y2="205" />
          </g>
          <g fill="url(#bd-ball-purple)">
            <circle cx="130" cy="120" r="19" />
            <circle cx="215" cy="85" r="22" />
            <circle cx="290" cy="150" r="17" />
            <circle cx="175" cy="205" r="20" />
          </g>
        </g>

        {/* small stacks of cells */}
        <g className="bd-float-3">
          <use
            href="#bd-cell"
            className="bd-cell-warm"
            transform="translate(60 440) scale(0.7)"
          />
          <use
            href="#bd-cell"
            className="bd-cell-warm"
            transform="translate(60 409) scale(0.7)"
          />
        </g>
        <g className="bd-float-4">
          <use
            href="#bd-cell"
            className="bd-cell-cool"
            transform="translate(690 440) scale(0.6)"
          />
          <use
            href="#bd-cell"
            className="bd-cell-cool"
            transform="translate(729 440) scale(0.6)"
          />
        </g>

        {/* accent orbs */}
        <g className="bd-float-3">
          <circle cx="330" cy="70" r="11" fill="url(#bd-ball-orange)" />
          <circle cx="745" cy="320" r="9" fill="url(#bd-ball-green)" />
        </g>
        <g className="bd-float-1">
          <circle cx="35" cy="300" r="10" fill="url(#bd-ball-purple)" />
          <circle cx="430" cy="500" r="8" fill="url(#bd-ball-orange)" />
        </g>
      </svg>
    </div>
  )
}
