import type { CSSProperties, JSX } from 'react'
import './MenuScene.css'

const RING = [9, 2, 5, 7, 3, 8, 1, 4]
const STACK = [9, 2, 5]

function Box({
  className = '',
  value,
  topLabel,
}: {
  className?: string
  value?: string
  topLabel?: string
}): JSX.Element {
  return (
    <div className={`menu-scene-box ${className}`}>
      <span className="menu-scene-face is-front">{value}</span>
      <span className="menu-scene-face is-back">{value}</span>
      <span className="menu-scene-face is-right">
        <span className="menu-scene-dot is-next" />
      </span>
      <span className="menu-scene-face is-left">
        <span className="menu-scene-dot is-prev" />
      </span>
      <span className="menu-scene-face is-top">
        {topLabel ? <span className="menu-scene-slab-top-label">{topLabel}</span> : null}
      </span>
      <span className="menu-scene-face is-bottom" />
    </div>
  )
}

/**
 * Decorative hero scene: a slowly rotating ring of cells around a small stack,
 * drawn with the course colours. It is purely visual; the hero copy carries the
 * information.
 */
export function MenuScene(): JSX.Element {
  return (
    <div className="menu-scene" aria-hidden="true">
      <div className="menu-scene-glow" />

      <svg className="menu-scene-rosette" viewBox="0 0 620 620" focusable="false">
        <g className="menu-scene-rosette-lines">
          <circle cx="310" cy="310" r="292" />
          <circle cx="310" cy="310" r="252" className="is-dashed" />
          <rect x="118" y="118" width="384" height="384" />
          <rect x="118" y="118" width="384" height="384" transform="rotate(45 310 310)" />
          <rect
            x="172"
            y="172"
            width="276"
            height="276"
            transform="rotate(22.5 310 310)"
            className="is-blue"
          />
          <rect
            x="172"
            y="172"
            width="276"
            height="276"
            transform="rotate(67.5 310 310)"
            className="is-blue"
          />
        </g>
      </svg>

      <div className="menu-scene-perspective">
        <div className="menu-scene-tilt">
          <div className="menu-scene-ground">
            <svg viewBox="0 0 560 560" focusable="false">
              <g className="menu-scene-ground-lines">
                <rect x="72" y="72" width="416" height="416" />
                <rect x="72" y="72" width="416" height="416" transform="rotate(45 280 280)" />
                <circle cx="280" cy="280" r="226" className="is-dashed" />
              </g>
            </svg>
          </div>

          <div className="menu-scene-spin">
            {RING.map((value, index) => (
              <div
                key={value}
                className="menu-scene-node"
                style={{ '--angle': `${(index * 360) / RING.length}deg` } as CSSProperties}
              >
                <Box className="menu-scene-cube" value={String(value)} />
              </div>
            ))}
          </div>

          <div className="menu-scene-stack">
            {STACK.map((value, index) => (
              <Box
                key={value}
                className={`menu-scene-slab slab-${index + 1}${
                  index === STACK.length - 1 ? ' is-top' : ''
                }`}
                value={String(value)}
                topLabel={index === STACK.length - 1 ? 'sommet' : undefined}
              />
            ))}
          </div>

          <div className="menu-scene-float float-a">
            <Box className="menu-scene-cube menu-scene-mini" />
          </div>
          <div className="menu-scene-float float-b">
            <Box className="menu-scene-cube menu-scene-mini" />
          </div>
          <div className="menu-scene-float float-c">
            <Box className="menu-scene-cube menu-scene-mini" />
          </div>
        </div>
      </div>
    </div>
  )
}
