import { fr } from '../../i18n/fr'
import { deriveCircular } from './memory'
import type { ArraySnapshot, ArraySlotState, CircularState } from './memory'

const DEG = Math.PI / 180
const V = fr.staticStructures.viz

/** Geometry from the File 3 mockup. All distances are SVG world units. */
export const RING_TRACK_RADIUS = 150
export const RING_OUTER_RADIUS = 144
export const RING_INNER_RADIUS = 80
export const RING_HOLE_RADIUS = 74
export const RING_VALUE_RADIUS = 112
export const RING_BADGE_RADIUS = 96
export const RING_BADGE_SHIFT = 36
export const RING_INDEX_RADIUS = 164
export const RING_INDEX_W = 26
export const RING_INDEX_H = 22
export const RING_POINTER_W = 84
export const RING_POINTER_H = 32
export const RING_POINTER_CONNECTED_H = 26
export const RING_POINTER_START_RADIUS = 194
export const RING_POINTER_MAX_RADIUS = 324
export const RING_POINTER_GAP = 4
/** Room for a visible arrowhead between a connected pill and the index. */
export const RING_POINTER_CONNECTED_GAP = 10
/** Arrow tip clearance above the index pill, in world units. */
export const RING_ARROW_GAP = 4
export const RING_WRAP_RADIUS = RING_INDEX_RADIUS
export const RING_WRAP_GAP = 3
export const RING_WRAP_CHIP_H = 26
export const RING_WRAP_CHIP_MIN_W = 118
export const RING_CHIP_MAX_RADIUS = 336
export const RING_CANVAS = { x: -360, y: -360, width: 720, height: 720 }
/** The HUD sits above the ring canvas; fit the ring in the space below it. */
export const RING_FIT_INSETS = { top: 64, right: 4, bottom: 8, left: 4 }

export interface RingPoint {
  x: number
  y: number
}

export interface RingRect {
  x: number
  y: number
  width: number
  height: number
}

export interface RingSlotGeometry {
  index: number
  state: ArraySlotState
  angle: number
  sectorPath: string
  text: string | null
  fontSize: number
  valuePoint: RingPoint
  valueBox: RingRect | null
  label: string | null
  labelPoint: RingPoint | null
  labelBox: RingRect | null
  rank: number | null
  badgePoint: RingPoint | null
  badgeBox: RingRect | null
  indexRect: RingRect
  head: boolean
  tail: boolean
}

export interface RingConnector {
  from: RingPoint
  to: RingPoint
  tone: 'gold' | 'success'
}

export interface RingPointerGeometry {
  key: 'av' | 'ar' | 'both'
  text: string
  tone: 'gold' | 'success' | 'both'
  rect: RingRect
  fontSize: number
  dashed: boolean
  connectors: RingConnector[]
}

export interface RingWrapGeometry {
  startAngle: number
  endAngle: number
  radius: number
  path: string
  start: RingPoint
  end: RingPoint
  applied: boolean
  chipText: string
  chipPoint: RingPoint
  chipRect: RingRect
}

export interface RingGeometry {
  circular: CircularState
  max: number
  taille: number
  free: number
  full: boolean
  empty: boolean
  one: boolean
  av: number
  ar: number
  valueFontSize: number
  slots: RingSlotGeometry[]
  pointers: RingPointerGeometry[]
  wrap: RingWrapGeometry | null
  bounds: RingRect
}

export interface RingGeometryOptions {
  idle?: boolean
}

function polar(angle: number, radius: number): RingPoint {
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
}

export function slotAngle(index: number, max: number): number {
  return -Math.PI / 2 + (index * Math.PI * 2) / max
}

export function sectorHalfSpan(max: number): number {
  return Math.PI / max - 2.5 * DEG
}

function centeredRect(center: RingPoint, width: number, height: number): RingRect {
  return {
    x: center.x - width / 2,
    y: center.y - height / 2,
    width,
    height,
  }
}

export function rectGap(left: RingRect, right: RingRect): number {
  const dx = Math.max(
    left.x - (right.x + right.width),
    right.x - (left.x + left.width),
    0,
  )
  const dy = Math.max(
    left.y - (right.y + right.height),
    right.y - (left.y + left.height),
    0,
  )
  return Math.hypot(dx, dy)
}

export function rectInside(rect: RingRect, bounds: RingRect): boolean {
  return (
    rect.x >= bounds.x &&
    rect.y >= bounds.y &&
    rect.x + rect.width <= bounds.x + bounds.width &&
    rect.y + rect.height <= bounds.y + bounds.height
  )
}

function pointInsideRect(point: RingPoint, rect: RingRect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

/** Angle where the wrap circle leaves the index pill, keeping a small gap. */
function wrapEdgeAngle(base: number, direction: 1 | -1, rect: RingRect): number {
  const padded = expand(rect, RING_WRAP_GAP)
  let low = 0
  let high = 20 * DEG
  for (let step = 0; step < 24; step += 1) {
    const mid = (low + high) / 2
    if (pointInsideRect(polar(base + direction * mid, RING_WRAP_RADIUS), padded)) {
      low = mid
    } else {
      high = mid
    }
  }
  return base + direction * high
}

export function textWidth(text: string, fontSize: number): number {
  return Math.max(fontSize * 0.6, text.length * fontSize * 0.64)
}

export function textBox(center: RingPoint, text: string, fontSize: number): RingRect {
  return centeredRect(center, textWidth(text, fontSize), fontSize * 1.18)
}

export function ringValueFontSize(max: number, length = 1): number {
  const base = max <= 5 ? 30 : max === 6 ? 26 : max === 7 ? 23 : 21
  if (length > 2) return Math.max(18, Math.min(base, 20))
  return base
}

function annularSectorPath(angle: number, max: number): string {
  const half = sectorHalfSpan(max)
  const outerStart = polar(angle - half, RING_OUTER_RADIUS)
  const outerEnd = polar(angle + half, RING_OUTER_RADIUS)
  const innerEnd = polar(angle + half, RING_INNER_RADIUS)
  const innerStart = polar(angle - half, RING_INNER_RADIUS)
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${RING_OUTER_RADIUS} ${RING_OUTER_RADIUS} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${RING_INNER_RADIUS} ${RING_INNER_RADIUS} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

/** Point where the inward radial line leaves a pill rectangle. */
function radialExit(rect: RingRect, angle: number): RingPoint {
  const center = {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  }
  const cos = Math.abs(Math.cos(angle))
  const sin = Math.abs(Math.sin(angle))
  const tx = cos < 1e-6 ? Number.POSITIVE_INFINITY : rect.width / 2 / cos
  const ty = sin < 1e-6 ? Number.POSITIVE_INFINITY : rect.height / 2 / sin
  const distance = Math.min(tx, ty)
  return {
    x: center.x - Math.cos(angle) * distance,
    y: center.y - Math.sin(angle) * distance,
  }
}

function placePointer(
  angle: number,
  width: number,
  height: number,
  obstacles: RingRect[],
  gap: number,
): { rect: RingRect; radius: number } {
  let radius = RING_POINTER_START_RADIUS
  while (radius <= RING_POINTER_MAX_RADIUS) {
    const rect = centeredRect(polar(angle, radius), width, height)
    if (
      rectInside(rect, RING_CANVAS) &&
      obstacles.every((obstacle) => rectGap(rect, obstacle) >= gap)
    ) {
      return { rect, radius }
    }
    radius += 1
  }
  const rect = centeredRect(polar(angle, RING_POINTER_MAX_RADIUS), width, height)
  return { rect, radius: RING_POINTER_MAX_RADIUS }
}

/** Point on the outward radial side of a pill, `gap` units beyond its edge. */
function radialTarget(rect: RingRect, angle: number, gap: number): RingPoint {
  const center = {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  }
  const cos = Math.abs(Math.cos(angle))
  const sin = Math.abs(Math.sin(angle))
  const tx = cos < 1e-6 ? Number.POSITIVE_INFINITY : (rect.width / 2 + gap) / cos
  const ty = sin < 1e-6 ? Number.POSITIVE_INFINITY : (rect.height / 2 + gap) / sin
  const distance = Math.min(tx, ty)
  return {
    x: center.x + Math.cos(angle) * distance,
    y: center.y + Math.sin(angle) * distance,
  }
}

function pointerConnectors(
  rect: RingRect,
  angle: number,
  tones: Array<'gold' | 'success'>,
  indexRect: RingRect,
): RingConnector[] {
  const inner = radialExit(rect, angle)
  const target = radialTarget(indexRect, angle, RING_ARROW_GAP)
  if (tones.length === 1) {
    return [{ from: inner, to: target, tone: tones[0]! }]
  }
  const perpendicular = { x: -Math.sin(angle), y: Math.cos(angle) }
  return tones.map((tone, index) => {
    const offset = index === 0 ? -4 : 4
    return {
      from: {
        x: inner.x + perpendicular.x * offset,
        y: inner.y + perpendicular.y * offset,
      },
      to: {
        x: target.x + perpendicular.x * offset,
        y: target.y + perpendicular.y * offset,
      },
      tone,
    }
  })
}

function rectCenterDistance(rect: RingRect): number {
  const dx = Math.max(rect.x, 0, -(rect.x + rect.width))
  const dy = Math.max(rect.y, 0, -(rect.y + rect.height))
  return Math.hypot(dx, dy)
}

function placeChip(
  angle: number,
  width: number,
  obstacles: RingRect[],
): RingRect {
  let radius = RING_WRAP_RADIUS + RING_WRAP_CHIP_H / 2 + 12
  while (radius <= RING_CHIP_MAX_RADIUS) {
    const rect = centeredRect(polar(angle, radius), width, RING_WRAP_CHIP_H)
    if (
      rectInside(rect, RING_CANVAS) &&
      rectCenterDistance(rect) >= RING_WRAP_RADIUS + 10 &&
      obstacles.every((obstacle) => rectGap(rect, obstacle) >= 8)
    ) {
      return rect
    }
    radius += 2
  }
  return centeredRect(polar(angle, RING_CHIP_MAX_RADIUS), width, RING_WRAP_CHIP_H)
}

function buildWrap(
  max: number,
  applied: boolean,
  pointers: RingPointerGeometry[],
  indexRects: RingRect[],
): RingWrapGeometry {
  const sourceRect = indexRects[max - 1]!
  const destinationRect = indexRects[0]!
  const startAngle = wrapEdgeAngle(slotAngle(max - 1, max), 1, sourceRect)
  const endAngle = wrapEdgeAngle(
    slotAngle(0, max) + Math.PI * 2,
    -1,
    destinationRect,
  )
  const centerAngle = (startAngle + endAngle) / 2
  const start = polar(startAngle, RING_WRAP_RADIUS)
  const end = polar(endAngle, RING_WRAP_RADIUS)
  const chipText = V.wrapFormula(max - 1, max, 0)
  const chipWidth = Math.max(
    RING_WRAP_CHIP_MIN_W,
    Math.ceil(textWidth(chipText, 12) + 20),
  )
  const chipRect = placeChip(
    centerAngle,
    chipWidth,
    [...pointers.map((pointer) => pointer.rect), ...indexRects],
  )
  const chipPoint = {
    x: chipRect.x + chipRect.width / 2,
    y: chipRect.y + chipRect.height / 2,
  }
  return {
    startAngle,
    endAngle,
    radius: RING_WRAP_RADIUS,
    path: `M ${start.x} ${start.y} A ${RING_WRAP_RADIUS} ${RING_WRAP_RADIUS} 0 0 1 ${end.x} ${end.y}`,
    start,
    end,
    applied,
    chipText,
    chipPoint,
    chipRect,
  }
}

export function wrapArcPoints(wrap: RingWrapGeometry, count = 120): RingPoint[] {
  const points: RingPoint[] = []
  for (let index = 0; index <= count; index += 1) {
    const ratio = index / count
    const angle = wrap.startAngle + (wrap.endAngle - wrap.startAngle) * ratio
    points.push(polar(angle, wrap.radius))
  }
  return points
}

function unionRects(rects: RingRect[]): RingRect {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  for (const rect of rects) {
    minX = Math.min(minX, rect.x)
    minY = Math.min(minY, rect.y)
    maxX = Math.max(maxX, rect.x + rect.width)
    maxY = Math.max(maxY, rect.y + rect.height)
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  }
}

function expand(rect: RingRect, amount: number): RingRect {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    width: rect.width + amount * 2,
    height: rect.height + amount * 2,
  }
}

function buildPointer(
  key: 'av' | 'ar',
  index: number,
  angle: number,
  obstacles: RingRect[],
  indexRect: RingRect,
  dashed = false,
): RingPointerGeometry {
  const text = `${key} = ${index}`
  const placement = placePointer(
    angle,
    RING_POINTER_W,
    dashed ? RING_POINTER_H : RING_POINTER_CONNECTED_H,
    obstacles,
    dashed ? RING_POINTER_GAP : RING_POINTER_CONNECTED_GAP,
  )
  return {
    key,
    text,
    tone: key === 'av' ? 'gold' : 'success',
    rect: placement.rect,
    fontSize: 15,
    dashed,
    connectors: dashed
      ? []
      : pointerConnectors(
          placement.rect,
          angle,
          [key === 'av' ? 'gold' : 'success'],
          indexRect,
        ),
  }
}

/**
 * Builds the circular ring layout for File 3. Returns `null` for every other
 * structure, which keeps the linear visualisations untouched.
 */
interface RingMarkers {
  empty: boolean
  one: boolean
  av: number
  ar: number
}

function buildPointers(
  markers: RingMarkers,
  max: number,
  indexRects: RingRect[],
): RingPointerGeometry[] {
  const pointers: RingPointerGeometry[] = []
  if (markers.empty) {
    // Left/right keeps the undefined pointers away from the index 0 pill.
    const first = buildPointer(
      'av',
      markers.av,
      Math.PI,
      indexRects,
      indexRects[0]!,
      true,
    )
    pointers.push(first)
    pointers.push(
      buildPointer(
        'ar',
        markers.ar,
        0,
        [...indexRects, first.rect],
        indexRects[0]!,
        true,
      ),
    )
    return pointers
  }

  if (markers.one) {
    const index = markers.av
    const angle = slotAngle(index, max)
    const text = `av = ar = ${index}`
    const width = Math.max(118, Math.ceil(textWidth(text, 13) + 18))
    const placement = placePointer(
      angle,
      width,
      RING_POINTER_CONNECTED_H,
      indexRects,
      RING_POINTER_CONNECTED_GAP,
    )
    pointers.push({
      key: 'both',
      text,
      tone: 'both',
      rect: placement.rect,
      fontSize: 13,
      dashed: false,
      connectors: pointerConnectors(
        placement.rect,
        angle,
        ['gold', 'success'],
        indexRects[index]!,
      ),
    })
    return pointers
  }

  const first = buildPointer(
    'av',
    markers.av,
    slotAngle(markers.av, max),
    indexRects,
    indexRects[markers.av]!,
  )
  pointers.push(first)
  pointers.push(
    buildPointer(
      'ar',
      markers.ar,
      slotAngle(markers.ar, max),
      [...indexRects, first.rect],
      indexRects[markers.ar]!,
    ),
  )
  return pointers
}

const fitBoundsCache = new Map<number, RingRect>()

/**
 * Worst-case ring bounds for one capacity, symmetric around the ring origin.
 * The camera is fitted once from this box so the ring never moves while the
 * user steps through an operation.
 */
export function ringFitBounds(max: number): RingRect {
  const cached = fitBoundsCache.get(max)
  if (cached) return cached

  const indexRects = Array.from({ length: max }, (_, index) =>
    centeredRect(polar(slotAngle(index, max), RING_INDEX_RADIUS), RING_INDEX_W, RING_INDEX_H),
  )
  const rects: RingRect[] = [
    { x: -RING_TRACK_RADIUS - 4, y: -RING_TRACK_RADIUS - 4, width: (RING_TRACK_RADIUS + 4) * 2, height: (RING_TRACK_RADIUS + 4) * 2 },
    { x: -RING_WRAP_RADIUS - 4, y: -RING_WRAP_RADIUS - 4, width: (RING_WRAP_RADIUS + 4) * 2, height: (RING_WRAP_RADIUS + 4) * 2 },
    ...indexRects.map((rect) => expand(rect, 3)),
  ]

  const collect = (markers: RingMarkers, wrap: boolean): void => {
    const pointers = buildPointers(markers, max, indexRects)
    rects.push(...pointers.map((pointer) => expand(pointer.rect, 4)))
    if (wrap) {
      rects.push(expand(buildWrap(max, false, pointers, indexRects).chipRect, 4))
    }
  }

  collect({ empty: true, one: false, av: -1, ar: -1 }, false)
  for (let index = 0; index < max; index += 1) {
    collect({ empty: false, one: true, av: index, ar: index }, index === max - 1)
  }
  for (let av = 0; av < max; av += 1) {
    for (let ar = 0; ar < max; ar += 1) {
      if (av === ar) continue
      collect({ empty: false, one: false, av, ar }, ar === 0 || ar === max - 1)
    }
  }

  const union = unionRects(rects)
  const halfX = Math.max(Math.abs(union.x), Math.abs(union.x + union.width))
  const halfY = Math.max(Math.abs(union.y), Math.abs(union.y + union.height))
  const bounds = {
    x: -halfX,
    y: -halfY,
    width: halfX * 2,
    height: halfY * 2,
  }
  fitBoundsCache.set(max, bounds)
  return bounds
}

export function ringGeometry(
  snapshot: ArraySnapshot,
  options: RingGeometryOptions = {},
): RingGeometry | null {
  if (snapshot.profile !== 'file-circulaire') return null
  const circular = snapshot.circular ?? deriveCircular(snapshot)
  const max = circular.max
  const empty = circular.taille === 0
  const full = circular.taille === max
  const one = circular.taille === 1
  const rankByIndex = new Map(circular.order.map((index, rank) => [index, rank + 1]))
  const indexRects = circular.elements.map((element) =>
    centeredRect(polar(slotAngle(element.index, max), RING_INDEX_RADIUS), RING_INDEX_W, RING_INDEX_H),
  )

  const slots: RingSlotGeometry[] = circular.elements.map((element) => {
    const angle = slotAngle(element.index, max)
    const rank = rankByIndex.get(element.index) ?? null
    const valueText = element.value === null ? null : String(element.value)
    const fontSize =
      element.state === 'free' ? 12 : ringValueFontSize(max, valueText?.length ?? 1)
    const valuePoint = polar(angle, RING_VALUE_RADIUS)
    const label =
      element.state === 'free'
        ? V.free
        : element.state === 'stale'
          ? V.staleShort
          : null
    const labelPoint = label
      ? polar(angle, element.state === 'free' ? RING_VALUE_RADIUS : 88)
      : null
    const badgePoint = rank === null ? null : polar(angle - RING_BADGE_SHIFT / RING_BADGE_RADIUS, RING_BADGE_RADIUS)
    return {
      index: element.index,
      state: element.state,
      angle,
      sectorPath: annularSectorPath(angle, max),
      text: element.state === 'free' ? null : valueText,
      fontSize,
      valuePoint,
      valueBox:
        element.state === 'free' || valueText === null
          ? null
          : textBox(valuePoint, valueText, fontSize),
      label,
      labelPoint,
      labelBox:
        label && labelPoint ? textBox(labelPoint, label, element.state === 'free' ? 12 : 8.5) : null,
      rank,
      badgePoint,
      badgeBox: badgePoint ? centeredRect(badgePoint, 20, 20) : null,
      indexRect: indexRects[element.index]!,
      head: !empty && element.index === circular.av,
      tail: !empty && element.index === circular.ar,
    }
  })

  const pointers = buildPointers(
    { empty, one, av: circular.av, ar: circular.ar },
    max,
    indexRects,
  )

  const formula = circular.formula
  const wrapped = formula?.wrapped === true
  const idlePreview =
    !wrapped &&
    options.idle === true &&
    !empty &&
    circular.ar === max - 1
  const wrap = wrapped
    ? buildWrap(max, formula?.applied ?? false, pointers, indexRects)
    : idlePreview
      ? buildWrap(max, false, pointers, indexRects)
      : null

  const rects: RingRect[] = [
    { x: -RING_TRACK_RADIUS - 4, y: -RING_TRACK_RADIUS - 4, width: (RING_TRACK_RADIUS + 4) * 2, height: (RING_TRACK_RADIUS + 4) * 2 },
    { x: -RING_WRAP_RADIUS - 4, y: -RING_WRAP_RADIUS - 4, width: (RING_WRAP_RADIUS + 4) * 2, height: (RING_WRAP_RADIUS + 4) * 2 },
    ...indexRects.map((rect) => expand(rect, 3)),
    ...pointers.map((pointer) => expand(pointer.rect, 4)),
    ...(wrap ? [expand(wrap.chipRect, 4)] : []),
  ]

  return {
    circular,
    max,
    taille: circular.taille,
    free: max - circular.taille,
    full,
    empty,
    one,
    av: circular.av,
    ar: circular.ar,
    valueFontSize: ringValueFontSize(max),
    slots,
    pointers,
    wrap,
    bounds: unionRects(rects),
  }
}

export function ringContentBounds(
  snapshot: ArraySnapshot,
  options: RingGeometryOptions = {},
): RingRect | null {
  return ringGeometry(snapshot, options)?.bounds ?? null
}
