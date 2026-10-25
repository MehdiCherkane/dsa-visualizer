import type { CSSProperties, JSX } from 'react'
import { fr } from '../../i18n/fr'
import {
  RING_HOLE_RADIUS,
  RING_TRACK_RADIUS,
} from './ringGeometry'
import type {
  RingGeometry,
  RingPointerGeometry,
  RingSlotGeometry,
  RingWrapGeometry,
} from './ringGeometry'

const V = fr.staticStructures.viz

function slotTitle(slot: RingSlotGeometry): string {
  const base = V.ringCase(slot.index)
  if (slot.state === 'free') return `${base} · ${V.free}`
  if (slot.state === 'stale') return `${base} : ${slot.text} · ${V.stale}`
  const roles = [slot.head ? V.head : null, slot.tail ? V.tail : null].filter(Boolean)
  const role = roles.length > 0 ? ` · ${roles.join(' + ')}` : ''
  return `${base} : ${slot.text}${role} · ${V.arrival(slot.rank ?? 0)}`
}

function slotClass(slot: RingSlotGeometry): string {
  if (slot.state === 'free') return 'is-free'
  if (slot.state === 'stale') return 'is-stale'
  if (slot.head && slot.tail) return 'is-used is-one'
  if (slot.head) return 'is-used is-head'
  if (slot.tail) return 'is-used is-tail'
  return 'is-used'
}

function indexClass(slot: RingSlotGeometry): string {
  if (slot.state === 'free') return 'is-free'
  if (slot.state === 'stale') return 'is-stale'
  if (slot.head && slot.tail) return 'is-both'
  if (slot.head) return 'is-head'
  if (slot.tail) return 'is-tail'
  return ''
}

function badgeClass(slot: RingSlotGeometry): string {
  if (slot.head && slot.tail) return 'is-one'
  if (slot.head) return 'is-head'
  if (slot.tail) return 'is-tail'
  return ''
}

function direction(from: { x: number; y: number }, to: { x: number; y: number }): {
  x: number
  y: number
} {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy) || 1
  return { x: dx / length, y: dy / length }
}

function arrowPoints(
  tip: { x: number; y: number },
  heading: { x: number; y: number },
  size = 9,
  half = 4.5,
): string {
  const base = { x: tip.x - heading.x * size, y: tip.y - heading.y * size }
  const perpendicular = { x: -heading.y, y: heading.x }
  return [
    `${tip.x},${tip.y}`,
    `${base.x + perpendicular.x * half},${base.y + perpendicular.y * half}`,
    `${base.x - perpendicular.x * half},${base.y - perpendicular.y * half}`,
  ].join(' ')
}

function PointerShape({
  pointer,
  changed,
}: {
  pointer: RingPointerGeometry
  changed: boolean
}): JSX.Element {
  return (
    <g
      className={`ss-ring-pointer is-${pointer.tone}${pointer.dashed ? ' is-dashed' : ''}${changed ? ' is-changed' : ''}`}
    >
      {pointer.connectors.map((connector, index) => {
        const heading = direction(connector.from, connector.to)
        return (
          <g key={`connector-${index}`}>
            <line
              className={`ss-ring-connector is-${connector.tone}`}
              x1={connector.from.x}
              y1={connector.from.y}
              x2={connector.to.x}
              y2={connector.to.y}
            />
            <polygon
              className={`ss-ring-connector-arrow is-${connector.tone}`}
              points={arrowPoints(connector.to, heading, 8, 4)}
            />
          </g>
        )
      })}
      <rect
        x={pointer.rect.x}
        y={pointer.rect.y}
        width={pointer.rect.width}
        height={pointer.rect.height}
        rx="10"
      />
      <text
        className="ss-ring-pointer-text"
        x={pointer.rect.x + pointer.rect.width / 2}
        y={pointer.rect.y + pointer.rect.height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={pointer.fontSize}
      >
        {pointer.text}
      </text>
      <title>{pointer.text}</title>
    </g>
  )
}

function WrapShape({ wrap }: { wrap: RingWrapGeometry }): JSX.Element {
  const heading = {
    x: -Math.sin(wrap.endAngle),
    y: Math.cos(wrap.endAngle),
  }
  return (
    <g className={`ss-ring-wrap${wrap.applied ? ' is-applied' : ' is-upcoming'}`}>
      <path className="ss-ring-wrap-path" d={wrap.path} />
      <polygon
        className="ss-ring-wrap-arrow"
        points={arrowPoints(wrap.end, heading, 9, 4.5)}
      />
      <g className="ss-ring-wrap-chip">
        <rect
          x={wrap.chipRect.x}
          y={wrap.chipRect.y}
          width={wrap.chipRect.width}
          height={wrap.chipRect.height}
          rx={wrap.chipRect.height / 2}
        />
        <text
          x={wrap.chipPoint.x}
          y={wrap.chipPoint.y}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {wrap.chipText}
        </text>
        <title>{`${V.wrap} · ${wrap.chipText}`}</title>
      </g>
    </g>
  )
}

export function RingView({
  geometry,
  changedIndices,
  changedGlobals,
  motion,
  motionDuration,
}: {
  geometry: RingGeometry
  changedIndices: Set<number>
  changedGlobals: Set<string>
  motion: boolean
  motionDuration: number
}): JSX.Element {
  const status = geometry.empty
    ? V.stateEmptyFile
    : geometry.full
      ? V.stateFullFile
      : V.freeSlots(geometry.free)
  const centreLabel = `${geometry.taille}/${geometry.max} · ${status}`
  const style = { '--ss-motion-duration': `${motionDuration}ms` } as CSSProperties

  return (
    <g
      className="ss-ring-view"
      data-size={geometry.max}
      data-motion={motion ? 'on' : 'off'}
      style={style}
    >
      <circle className="ss-ring-track" r={RING_TRACK_RADIUS} />

      <g className="ss-ring-slots" role="list" aria-label={V.ringSlots}>
        {geometry.slots.map((slot) => (
          <g
            key={`ring-slot-${slot.index}`}
            className={`ss-ring-slot-group${changedIndices.has(slot.index) ? ' is-changed' : ''}`}
            data-index={slot.index}
            data-state={slot.state}
            role="listitem"
            tabIndex={0}
            aria-label={slotTitle(slot)}
          >
            <path className={`ss-ring-slot ${slotClass(slot)}`} d={slot.sectorPath} />
            {slot.state === 'stale' ? (
              <path className="ss-ring-slot-hatch" d={slot.sectorPath} fill="url(#ss-hatch-stale)" />
            ) : null}
            {slot.state === 'free' ? (
              <text
                key={`free-${slot.index}`}
                className="ss-ring-free-label"
                x={slot.valuePoint.x}
                y={slot.valuePoint.y}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {slot.label}
              </text>
            ) : (
              <>
                <text
                  key={`value-${slot.index}-${slot.text}`}
                  className={`ss-ring-value${slot.state === 'stale' ? ' is-stale' : ''}`}
                  x={slot.valuePoint.x}
                  y={slot.valuePoint.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={slot.fontSize}
                >
                  {slot.text}
                </text>
                {slot.state === 'stale' && slot.label && slot.labelPoint ? (
                  <text
                    className="ss-ring-stale-label"
                    x={slot.labelPoint.x}
                    y={slot.labelPoint.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {slot.label}
                  </text>
                ) : null}
                {slot.state === 'stale' && slot.valueBox ? (
                  <line
                    className="ss-ring-strike"
                    x1={slot.valueBox.x + 1}
                    x2={slot.valueBox.x + slot.valueBox.width - 1}
                    y1={slot.valuePoint.y}
                    y2={slot.valuePoint.y}
                  />
                ) : null}
              </>
            )}
            <title>{slotTitle(slot)}</title>
          </g>
        ))}
      </g>

      <g className="ss-ring-highlights" aria-hidden="true">
        {geometry.slots.map((slot) => (
          <path
            key={`ring-highlight-${slot.index}`}
            className="ss-ring-highlight"
            data-index={slot.index}
            d={slot.sectorPath}
          />
        ))}
      </g>

      <g className="ss-ring-centre" aria-hidden="true">
        <circle className="ss-ring-hole" r={RING_HOLE_RADIUS} />
        <svg
          className="ss-ring-centre-icon"
          x={-11}
          y={-46}
          width={22}
          height={22}
          viewBox="0 0 24 24"
        >
          <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
        <text
          className="ss-ring-count"
          y={-4}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {geometry.taille}/{geometry.max}
        </text>
        <text
          className={`ss-ring-status${geometry.empty ? ' is-empty' : geometry.full ? ' is-full' : ''}`}
          y={24}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {status}
        </text>
        <title>{centreLabel}</title>
      </g>

      <g className="ss-ring-badges">
        {geometry.slots.map((slot) =>
          slot.badgePoint && slot.badgeBox && slot.rank !== null ? (
            <g
              key={`ring-badge-${slot.index}`}
              className={`ss-ring-badge ${badgeClass(slot)}`}
            >
              <circle cx={slot.badgePoint.x} cy={slot.badgePoint.y} r="10" />
              <text
                x={slot.badgePoint.x}
                y={slot.badgePoint.y}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {slot.rank}
              </text>
              <title>{V.arrival(slot.rank)}</title>
            </g>
          ) : null,
        )}
      </g>

      <g className="ss-ring-indexes">
        {geometry.slots.map((slot) => (
          <g
            key={`ring-index-${slot.index}`}
            className={`ss-ring-index ${indexClass(slot)}`}
            data-index={slot.index}
          >
            <rect
              x={slot.indexRect.x}
              y={slot.indexRect.y}
              width={slot.indexRect.width}
              height={slot.indexRect.height}
              rx="7"
            />
            <text
              x={slot.indexRect.x + slot.indexRect.width / 2}
              y={slot.indexRect.y + slot.indexRect.height / 2}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {slot.index}
            </text>
          </g>
        ))}
      </g>

      <g className="ss-ring-pointers">
        {geometry.pointers.map((pointer) => (
          <PointerShape
            key={`ring-pointer-${pointer.key}-${pointer.text}`}
            pointer={pointer}
            changed={
              pointer.key === 'both'
                ? changedGlobals.has('av') || changedGlobals.has('ar')
                : changedGlobals.has(pointer.key)
            }
          />
        ))}
      </g>

      {geometry.wrap ? <WrapShape wrap={geometry.wrap} /> : null}
    </g>
  )
}
