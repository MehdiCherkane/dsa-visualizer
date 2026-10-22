import type { JSX } from 'react'

/**
 * Menu illustration: the chapter 4 doubly linked list, redrawn with the app
 * node / cell / arrow / pin tokens so it follows both themes.
 * Purely decorative — the menu text and card carry the same information.
 */
const NODES = [
  { x: 86, value: 9 },
  { x: 300, value: 2 },
  { x: 514, value: 5 },
] as const

const NODE_W = 180
const TOP = 76
const BOTTOM = TOP + 70
const CENTER = TOP + 35
const DEPTH_X = 22
const DEPTH_Y = 18
const BACK_TOP = TOP - DEPTH_Y

const PREV_CENTER = 30
const VALUE_CENTER = 90
const NEXT_CENTER = 150

const NULL_TOP = BOTTOM + 18
const NULL_W = 54
const NULL_H = 24

function NullBlock({ x }: { x: number }): JSX.Element {
  return (
    <g>
      <rect className="ma-null" x={x} y={NULL_TOP} width={NULL_W} height={NULL_H} rx="4" />
      <rect className="ma-edge" x={x} y={NULL_TOP} width={NULL_W} height={NULL_H} rx="4" />
      <text className="ma-null-text" x={x + NULL_W / 2} y={NULL_TOP + 16}>
        NULL
      </text>
    </g>
  )
}

export function MenuIllustration(): JSX.Element {
  return (
    <svg
      className="menu-illustration"
      viewBox="0 0 720 260"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <marker
          id="menu-illus-next"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="10"
          markerHeight="10"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path className="ma-next-fill" d="M0,0 L10,5 L0,10 Z" />
        </marker>
        <marker
          id="menu-illus-prev"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="10"
          markerHeight="10"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path className="ma-prev-fill" d="M0,0 L10,5 L0,10 Z" />
        </marker>
        <marker
          id="menu-illus-pin"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="10"
          markerHeight="10"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path className="ma-pin-fill" d="M0,0 L10,5 L0,10 Z" />
        </marker>
      </defs>

      {/* soft ground shadow */}
      <g className="ma-shadow">
        {NODES.map((node) => (
          <ellipse key={node.x} cx={node.x + NODE_W / 2} cy={BOTTOM + 4} rx={86} ry={5.5} />
        ))}
      </g>

      {/* debut pin */}
      <rect className="ma-pin-box" x="4" y={CENTER - 13} width="62" height="26" rx="8" />
      <text className="ma-pin-text" x="35" y={CENTER + 4}>
        debut
      </text>
      <line
        className="ma-pin-stem"
        x1="66"
        y1={CENTER}
        x2="82"
        y2={CENTER}
        markerEnd="url(#menu-illus-pin)"
      />

      {/* nodes: precedent | valeur | suivant */}
      {NODES.map((node) => (
        <g key={node.x}>
          <polygon
            className="ma-ink-side"
            points={[
              `${node.x + NODE_W},${TOP}`,
              `${node.x + NODE_W + DEPTH_X},${BACK_TOP}`,
              `${node.x + NODE_W + DEPTH_X},${BOTTOM - DEPTH_Y}`,
              `${node.x + NODE_W},${BOTTOM}`,
            ].join(' ')}
          />
          <polygon
            className="ma-ink-top"
            points={[
              `${node.x},${TOP}`,
              `${node.x + DEPTH_X},${BACK_TOP}`,
              `${node.x + NODE_W + DEPTH_X},${BACK_TOP}`,
              `${node.x + NODE_W},${TOP}`,
            ].join(' ')}
          />
          <rect className="ma-front" x={node.x} y={TOP} width={NODE_W} height={70} />
          <rect className="ma-cell-prev" x={node.x} y={TOP} width="60" height="70" />
          <rect className="ma-cell-value" x={node.x + 60} y={TOP} width="60" height="70" />
          <rect className="ma-cell-next" x={node.x + 120} y={TOP} width="60" height="70" />
          <line className="ma-sep" x1={node.x + 60} y1={TOP} x2={node.x + 60} y2={BOTTOM} />
          <line className="ma-sep" x1={node.x + 120} y1={TOP} x2={node.x + 120} y2={BOTTOM} />
          <rect className="ma-edge" x={node.x} y={TOP} width={NODE_W} height={70} />
          <text className="ma-value" x={node.x + VALUE_CENTER} y={CENTER + 10}>
            {node.value}
          </text>
        </g>
      ))}

      {/* suivant: solid arrows */}
      <g className="ma-next-line">
        <line
          x1={NODES[0].x + 184}
          y1={CENTER}
          x2={NODES[1].x - 4}
          y2={CENTER}
          markerEnd="url(#menu-illus-next)"
        />
        <line
          x1={NODES[1].x + 184}
          y1={CENTER}
          x2={NODES[2].x - 4}
          y2={CENTER}
          markerEnd="url(#menu-illus-next)"
        />
        <line
          x1={NODES[2].x + NEXT_CENTER}
          y1={BOTTOM}
          x2={NODES[2].x + NEXT_CENTER}
          y2={BOTTOM + 14}
          markerEnd="url(#menu-illus-next)"
        />
      </g>

      {/* precedent: dashed arrows */}
      <g className="ma-prev-line">
        <path
          d={`M${NODES[1].x + PREV_CENTER},${BOTTOM} C${NODES[1].x + PREV_CENTER},${BOTTOM + 44} ${NODES[0].x + 52},${BOTTOM + 44} ${NODES[0].x + 52},${BOTTOM + 4}`}
          markerEnd="url(#menu-illus-prev)"
        />
        <path
          d={`M${NODES[2].x + PREV_CENTER},${BOTTOM} C${NODES[2].x + PREV_CENTER},${BOTTOM + 44} ${NODES[1].x + 52},${BOTTOM + 44} ${NODES[1].x + 52},${BOTTOM + 4}`}
          markerEnd="url(#menu-illus-prev)"
        />
        <line
          x1={NODES[0].x + PREV_CENTER}
          y1={BOTTOM}
          x2={NODES[0].x + PREV_CENTER}
          y2={BOTTOM + 14}
          markerEnd="url(#menu-illus-prev)"
        />
      </g>

      {/* NULL end blocks */}
      <NullBlock x={NODES[0].x + PREV_CENTER - NULL_W / 2} />
      <NullBlock x={NODES[2].x + NEXT_CENTER - NULL_W / 2} />

      {/* legend */}
      <g>
        <rect className="ma-cell-prev ma-swatch" x="236" y="222" width="12" height="12" />
        <text className="ma-legend" x="254" y="232">
          precedent
        </text>
        <rect className="ma-cell-value ma-swatch" x="340" y="222" width="12" height="12" />
        <text className="ma-legend" x="358" y="232">
          valeur
        </text>
        <rect className="ma-cell-next ma-swatch" x="422" y="222" width="12" height="12" />
        <text className="ma-legend" x="440" y="232">
          suivant
        </text>
      </g>
    </svg>
  )
}
