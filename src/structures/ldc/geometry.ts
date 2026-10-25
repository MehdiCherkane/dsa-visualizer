import type { PointerValue } from '../../core/types'
import type { LdcNode, PointerField } from './memory'

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Size {
  width: number
  height: number
}

export interface Camera {
  x: number
  y: number
  k: number
}

export const NODE_W = 220
export const NODE_H = 100
export const CELL_W = NODE_W / 3
export const GAP = 72
export const SLIDE = NODE_W + GAP
export const PAD_L = 132
export const ROW_Y = 338
export const EMPTY_ROW_Y = 304
export const HEAP_Y = 92
export const SUIVANT_LANE = 0.38
export const PRECEDENT_LANE = 0.72
export const NULL_STUB = 64
export const PIN_NULL_STUB = 32
export const PIN_NULL_LIFT = 64
export const FIT_PADDING = 56
export const MIN_AUTO_K = 0.25
export const MAX_AUTO_K = 1.3
export const MIN_K = 0.25
export const MAX_K = 4
export const PIN_TAG_H = 24
export const PIN_GAP = 8
export const PIN_MAX_FAN = NODE_W + 44
export const PIN_DEBUT_CLEARANCE = 10
export const ROW_BAND_TOP = 246
export const ROW_BAND_BOTTOM = ROW_Y + NODE_H + 46
export const HEAP_BAND_TOP = 8
export const HEAP_BAND_BOTTOM = HEAP_Y + NODE_H + 46
export const CIRCLE_HEAP_GAP = 56
export const CIRCLE_HEAP_STACK_GAP = 24
export const CIRCLE_HEAP_HEADER = 44
export const CIRCLE_HEAP_FOOTER = 20
export const BAND_PAD = 28
export const EMPTY_BAND_TOP = 200
export const EMPTY_BAND_HEIGHT = 146
export const EMPTY_BAND_EXTRA = 36
export const EMPTY_BAND_MIN_WIDTH = 480
export const EMPTY_NULL_X = PAD_L - 24
export const DEBUT_CELL_W = 124
export const DEBUT_CELL_H = 44
export const DEBUT_CELL_GAP = 60
export const DEBUT_DOT_X = DEBUT_CELL_W / 2
export const DEBUT_DOT_Y = DEBUT_CELL_H

export type LayoutMode = 'row' | 'circle'

export const CIRCLE_CX = 640
export const CIRCLE_CY = 560
/** A three-node ring needs more room than the compact formula below gives it. */
export const CIRCLE_MIN_RADIUS = 200

export interface CircleGeometry {
  cx: number
  cy: number
  radius: number
  count: number
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function circleGeometry(nodes: LdcNode[]): CircleGeometry | null {
  const count = nodes.filter((node) => node.lane === 'row').length
  if (count === 0) return null
  const radius =
    count === 1
      ? 0
      : Math.max(
          count >= 3 ? CIRCLE_MIN_RADIUS : 160,
          (NODE_W / 2 + 26) / Math.sin(Math.PI / count),
        )
  return { cx: CIRCLE_CX, cy: CIRCLE_CY, radius, count }
}

export function layoutNodes(
  nodes: LdcNode[],
  mode: LayoutMode = 'row',
): Map<number, Point> {
  const layout = new Map<number, Point>()

  if (mode === 'circle') {
    const row = nodes
      .filter((node) => node.lane === 'row')
      .slice()
      .sort((a, b) => a.slot - b.slot)
    const ring = circleGeometry(nodes)
    row.forEach((node, index) => {
      const angle =
        row.length === 1 ? 0 : -Math.PI / 2 + (index * Math.PI * 2) / row.length
      const radius = ring?.radius ?? 0
      const cx = CIRCLE_CX + Math.cos(angle) * radius
      const cy = CIRCLE_CY + Math.sin(angle) * radius
      layout.set(node.id, { x: cx - NODE_W / 2, y: cy - NODE_H / 2 })
    })
    const heap = nodes
      .filter((node) => node.lane === 'heap')
      .slice()
      .sort((first, second) => first.id - second.id)
    if (heap.length > 0) {
      const stackHeight =
        heap.length * NODE_H + (heap.length - 1) * CIRCLE_HEAP_STACK_GAP
      let x: number
      let top: number
      if (ring) {
        const ringLeft = CIRCLE_CX - (ring.radius + NODE_W / 2 + 26)
        x = ringLeft - CIRCLE_HEAP_GAP - NODE_W
        top = CIRCLE_CY - stackHeight / 2
      } else {
        // While the list is still empty, anchor the heap band left of the
        // fixed empty-list band instead of centering it under the ring.
        const band = emptyListBand()
        const heapBandWidth = NODE_W + 8 + BAND_PAD * 2
        const heapBandX = band.x - BAND_PAD - heapBandWidth
        x = heapBandX + BAND_PAD
        const heapBandHeight =
          stackHeight + 34 + CIRCLE_HEAP_HEADER + CIRCLE_HEAP_FOOTER
        const heapBandTop = band.y + (band.height - heapBandHeight) / 2
        top = heapBandTop + CIRCLE_HEAP_HEADER + 30
      }
      heap.forEach((node, index) => {
        layout.set(node.id, {
          x,
          y: top + index * (NODE_H + CIRCLE_HEAP_STACK_GAP),
        })
      })
    }
    return layout
  }

  for (const node of nodes) {
    layout.set(node.id, {
      x: PAD_L + node.slot * SLIDE,
      y: node.lane === 'heap' ? HEAP_Y : ROW_Y,
    })
  }
  return layout
}

/** Bounds of the left-side heap band used by the chapter 5 circular layout. */
export function circleHeapBand(nodes: LdcNode[]): Rect | null {
  const heap = nodes.filter((node) => node.lane === 'heap')
  if (heap.length === 0) return null
  const layout = layoutNodes(nodes, 'circle')
  const nodeRects = heap.flatMap((node) => {
    const point = layout.get(node.id)
    return point ? [nodeBounds(point)] : []
  })
  if (nodeRects.length === 0) return null
  const content = unionBounds(nodeRects)
  return {
    x: content.x - BAND_PAD,
    y: content.y - CIRCLE_HEAP_HEADER,
    width: content.width + BAND_PAD * 2,
    height: content.height + CIRCLE_HEAP_HEADER + CIRCLE_HEAP_FOOTER,
  }
}

/**
 * Fixed band drawn around an empty list. It does not depend on the heap so the
 * heap can be placed to its left without either band moving under the other.
 */
export function emptyListBand(): Rect {
  const geometry = debutCellGeometry([], 'circle')
  const labelRect: Rect = {
    x: geometry.label.x - 70,
    y: geometry.label.y - 14,
    width: 140,
    height: 20,
  }
  const route = debutRoute([], { kind: 'null' }, 'circle')
  const content = unionBounds(
    route ? [geometry.cell, labelRect, route.bounds] : [geometry.cell, labelRect],
  )
  return {
    x: content.x - BAND_PAD - EMPTY_BAND_EXTRA,
    y: EMPTY_BAND_TOP,
    width: Math.max(
      EMPTY_BAND_MIN_WIDTH,
      content.width + BAND_PAD * 2 + EMPTY_BAND_EXTRA,
    ),
    height: EMPTY_BAND_HEIGHT,
  }
}

export function laneY(point: Point, field: PointerField): number {
  return point.y + NODE_H * (field === 'suivant' ? SUIVANT_LANE : PRECEDENT_LANE)
}

export function pointerSide(
  field: PointerField,
  flipped = false,
): 'left' | 'right' {
  if (field === 'suivant') return flipped ? 'left' : 'right'
  return flipped ? 'right' : 'left'
}

export function isNodeFlipped(
  point: Point,
  ring: CircleGeometry | null,
): boolean {
  return ring !== null && point.y + NODE_H / 2 > ring.cy + 0.5
}

export function pointerAnchor(
  _node: LdcNode,
  point: Point,
  field: PointerField,
  flipped = false,
): Point {
  const side = pointerSide(field, flipped)
  return {
    x: side === 'right' ? point.x + NODE_W - CELL_W / 2 : point.x + CELL_W / 2,
    y: laneY(point, field),
  }
}

/** Heap nodes keep their field order; only ring nodes are mirrored. */
export function isRowFlipped(
  node: LdcNode,
  point: Point,
  ring: CircleGeometry | null,
): boolean {
  return node.lane === 'row' && isNodeFlipped(point, ring)
}

export function circleNodeRect(point: Point): Rect {
  return { x: point.x, y: point.y, width: NODE_W, height: NODE_H }
}

export function nodeCenter(point: Point): Point {
  return { x: point.x + NODE_W / 2, y: point.y + NODE_H / 2 }
}

/**
 * First border crossed by the ray `from -> toward`. `from` may be inside the
 * rectangle (source exit) or outside it (target entry).
 */
export function borderPoint(from: Point, toward: Point, rect: Rect): Point {
  const dx = toward.x - from.x
  const dy = toward.y - from.y
  const axis = (
    start: number,
    delta: number,
    min: number,
    max: number,
  ): [number, number] | null => {
    if (Math.abs(delta) < 1e-9) {
      return start < min || start > max ? null : [-Infinity, Infinity]
    }
    const first = (min - start) / delta
    const second = (max - start) / delta
    return [Math.min(first, second), Math.max(first, second)]
  }
  const xAxis = axis(from.x, dx, rect.x, rect.x + rect.width)
  const yAxis = axis(from.y, dy, rect.y, rect.y + rect.height)
  if (!xAxis || !yAxis) return { ...from }
  const enter = Math.max(xAxis[0], yAxis[0])
  const exit = Math.min(xAxis[1], yAxis[1])
  if (enter > exit) return { ...from }
  // Inside the rectangle: leave through the far border. Outside: enter
  // through the near border. `from` sits on a dot inside the source node.
  const t = enter >= 0 ? enter : exit
  if (!Number.isFinite(t)) return { ...from }
  return { x: from.x + dx * t, y: from.y + dy * t }
}

function roundedPath(points: Point[], radius: number): string {
  if (points.length < 2) return ''
  const first = points[0]!
  const parts = [`M ${first.x} ${first.y}`]
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1]!
    const current = points[index]!
    const next = points[index + 1]!
    const inLength = Math.hypot(current.x - previous.x, current.y - previous.y)
    const outLength = Math.hypot(next.x - current.x, next.y - current.y)
    if (inLength < 1e-6 || outLength < 1e-6) continue
    const bend = Math.min(radius, inLength / 2, outLength / 2)
    const before = {
      x: current.x + ((previous.x - current.x) * bend) / inLength,
      y: current.y + ((previous.y - current.y) * bend) / inLength,
    }
    const after = {
      x: current.x + ((next.x - current.x) * bend) / outLength,
      y: current.y + ((next.y - current.y) * bend) / outLength,
    }
    parts.push(`L ${before.x} ${before.y}`)
    parts.push(`Q ${current.x} ${current.y} ${after.x} ${after.y}`)
  }
  const last = points[points.length - 1]!
  parts.push(`L ${last.x} ${last.y}`)
  return parts.join(' ')
}

function routeFromPoints(
  kind: ArrowRoute['kind'],
  points: Point[],
  tail: Point,
  tip: Point,
  radius = 16,
): ArrowRoute {
  return {
    kind,
    path: roundedPath(points, radius),
    tail,
    tip,
    bounds: boundsOfPoints(points, 2),
    points,
  }
}

interface YSpan {
  top: number
  bottom: number
}

function mergeSpans(spans: YSpan[]): YSpan[] {
  const sorted = spans.slice().sort((first, second) => first.top - second.top)
  const merged: YSpan[] = []
  for (const span of sorted) {
    const last = merged[merged.length - 1]
    if (last && span.top <= last.bottom + 0.5) {
      last.bottom = Math.max(last.bottom, span.bottom)
    } else {
      merged.push({ ...span })
    }
  }
  return merged
}

/** Free horizontal corridors from the left heap side to the ring centre. */
function leftChannels(
  rowRects: Rect[],
  fromX: number,
  toX: number,
  centerY: number,
): YSpan[] {
  const blocking = rowRects.filter(
    (rect) => rect.x < toX && rect.x + rect.width > fromX,
  )
  if (blocking.length === 0) {
    return [{ top: centerY - 80, bottom: centerY + 80 }]
  }
  const margin = 10
  const blocked = mergeSpans(
    blocking.map((rect) => ({
      top: rect.y - margin,
      bottom: rect.y + rect.height + margin,
    })),
  )
  const minY = Math.min(...blocked.map((span) => span.top))
  const maxY = Math.max(...blocked.map((span) => span.bottom))
  const marginY = 160
  const clear: YSpan[] = []
  let cursor = minY - marginY
  for (const span of blocked) {
    if (span.top > cursor) clear.push({ top: cursor, bottom: span.top })
    cursor = Math.max(cursor, span.bottom)
  }
  clear.push({ top: cursor, bottom: maxY + marginY })
  return clear.filter((span) => span.bottom - span.top >= 24)
}

interface MixedChannels {
  upper: YSpan
  lower: YSpan
  shared: boolean
}

function pickChannels(spans: YSpan[], centerY: number): MixedChannels {
  const containing = spans.find(
    (span) => span.top <= centerY && span.bottom >= centerY,
  )
  if (containing) {
    return { upper: containing, lower: containing, shared: true }
  }
  const above = spans
    .filter((span) => span.bottom <= centerY + 0.5)
    .sort((first, second) => second.bottom - first.bottom)[0]
  const below = spans
    .filter((span) => span.top >= centerY - 0.5)
    .sort((first, second) => first.top - second.top)[0]
  const fallback = above ?? below ?? spans[0] ?? { top: centerY - 40, bottom: centerY + 40 }
  return {
    upper: above ?? fallback,
    lower: below ?? fallback,
    shared: !above || !below,
  }
}

function spanY(span: YSpan, fraction: number): number {
  return span.top + (span.bottom - span.top) * fraction
}

function mixedEntryY(channels: MixedChannels, lane: number): number {
  if (channels.shared) {
    const fraction =
      lane === 0 ? 0.28 : lane === 2 ? 0.4 : lane === 1 ? 0.6 : 0.72
    return spanY(channels.upper, fraction)
  }
  if (lane === 0) return spanY(channels.upper, 0.35)
  if (lane === 2) return spanY(channels.upper, 0.65)
  if (lane === 1) return spanY(channels.lower, 0.65)
  return spanY(channels.lower, 0.35)
}

function mixedHub(lane: number, ring: CircleGeometry): Point {
  switch (lane) {
    case 0:
      return { x: ring.cx - 14, y: ring.cy - 36 }
    case 1:
      return { x: ring.cx - 14, y: ring.cy + 36 }
    case 2:
      return { x: ring.cx + 14, y: ring.cy - 56 }
    default:
      return { x: ring.cx + 14, y: ring.cy + 56 }
  }
}

interface Corridor {
  x: number
  half: number
  left: number
  right: number
}

function corridorFor(
  rowRects: Rect[],
  heapRects: Rect[],
): Corridor | null {
  if (rowRects.length === 0 || heapRects.length === 0) return null
  const heapRight = Math.max(...heapRects.map((rect) => rect.x + rect.width))
  const ringLeft = Math.min(...rowRects.map((rect) => rect.x))
  if (ringLeft - heapRight < 16) return null
  return {
    x: (heapRight + ringLeft) / 2,
    half: (ringLeft - heapRight) / 2,
    left: heapRight,
    right: ringLeft,
  }
}

function mixedLaneX(corridor: Corridor, lane: number): number {
  // Heap-to-row links approach the ring from the right of the corridor;
  // row-to-heap links approach the heap from the left. Keeping those two
  // groups apart stops their final horizontal segments from overlapping.
  const fractions = [0.85, 0.65, 0.35, 0.15]
  const left = corridor.left + 4
  const right = corridor.right - 4
  const width = Math.max(8, right - left)
  return left + width * (fractions[lane] ?? 0.5)
}

function mixedLaneFor(
  source: LdcNode,
  field: PointerField,
): number {
  if (source.lane === 'heap') return field === 'suivant' ? 0 : 1
  return field === 'suivant' ? 2 : 3
}

/** Keep mixed links clear of the two pointer dots on a heap node. */
function mixedHeapEntryY(point: Point, field: PointerField): number {
  return point.y + NODE_H / 2 + (field === 'suivant' ? -36 : 36)
}

/** Keep mixed links clear of the two pointer dots on a ring node. */
function mixedRowEntryY(point: Point, field: PointerField): number {
  return point.y + NODE_H / 2 + (field === 'suivant' ? -30 : 30)
}

function sameRect(first: Rect, second: Rect): boolean {
  return (
    first.x === second.x &&
    first.y === second.y &&
    first.width === second.width &&
    first.height === second.height
  )
}

/** True when a horizontal segment does not cut through a non-endpoint node. */
function horizontalClear(
  y: number,
  fromX: number,
  toX: number,
  rects: Rect[],
  endpoint: Rect,
): boolean {
  const left = Math.min(fromX, toX)
  const right = Math.max(fromX, toX)
  return rects.every((rect) => {
    if (sameRect(rect, endpoint)) return true
    if (y <= rect.y + 4 || y >= rect.y + rect.height - 4) return true
    return rect.x >= right - 4 || rect.x + rect.width <= left + 4
  })
}

function appendHeapExit(
  points: Point[],
  sourcePoint: Point,
  tail: Point,
  laneX: number,
): void {
  const heapRight = sourcePoint.x + NODE_W
  const heapLeft = sourcePoint.x
  const heapBottom = sourcePoint.y + NODE_H
  const centerX = sourcePoint.x + NODE_W / 2
  if (tail.x >= centerX) {
    points.push({ x: heapRight, y: tail.y })
    return
  }
  const sideX = heapLeft - 18
  points.push({ x: heapLeft, y: tail.y })
  points.push({ x: sideX, y: tail.y })
  points.push({ x: sideX, y: heapBottom + 12 })
  points.push({ x: laneX, y: heapBottom + 12 })
}

function appendRowExit(
  points: Point[],
  sourcePoint: Point,
  tail: Point,
  hub: Point,
): void {
  const rect = circleNodeRect(sourcePoint)
  const center = nodeCenter(sourcePoint)
  const inner = borderPoint(center, hub, rect)
  const distance = Math.hypot(inner.x - tail.x, inner.y - tail.y)
  const dotRight = tail.x > center.x + 1
  const dotLeft = tail.x < center.x - 1
  const innerRight = inner.x > center.x + 1
  const innerLeft = inner.x < center.x - 1
  const crossesHorizontally =
    distance > 120 && ((dotRight && innerLeft) || (dotLeft && innerRight))
  if (!crossesHorizontally) {
    points.push(inner)
    return
  }

  // The pointer dot sits on the outer side of the node: leave through that
  // side, round the node above/below, then join the interior hub lane.
  const above = tail.y <= center.y
  const outerX = dotRight ? sourcePoint.x + NODE_W + 24 : sourcePoint.x - 24
  const detourY = above ? sourcePoint.y - 22 : sourcePoint.y + NODE_H + 22
  const innerX = innerRight ? sourcePoint.x + NODE_W + 24 : sourcePoint.x - 24
  const sideX = dotRight ? sourcePoint.x + NODE_W : sourcePoint.x
  points.push({ x: sideX, y: tail.y })
  points.push({ x: outerX, y: tail.y })
  points.push({ x: outerX, y: detourY })
  points.push({ x: innerX, y: detourY })
}

/**
 * Leaves a ring node towards the left corridor. The direct left exit is used
 * when clear; otherwise the arrow rounds the node above or below. Returns
 * false when neither option is free, so the caller can use the interior hub.
 */
function appendRowToLaneExit(
  points: Point[],
  sourcePoint: Point,
  tail: Point,
  laneX: number,
  heapEntryY: number,
  rowRects: Rect[],
  sourceRect: Rect,
): boolean {
  const center = nodeCenter(sourcePoint)
  const detourBelow = heapEntryY >= center.y
  const detourY = detourBelow
    ? sourcePoint.y + NODE_H + 24
    : sourcePoint.y - 24
  if (tail.x < center.x) {
    if (horizontalClear(tail.y, sourcePoint.x, laneX, rowRects, sourceRect)) {
      points.push({ x: sourcePoint.x, y: tail.y })
      points.push({ x: laneX, y: tail.y })
      return true
    }
    if (!horizontalClear(detourY, sourcePoint.x, laneX, rowRects, sourceRect)) {
      return false
    }
    points.push({ x: sourcePoint.x, y: tail.y })
    points.push({ x: sourcePoint.x, y: detourY })
    points.push({ x: laneX, y: detourY })
    return true
  }

  const sideX = sourcePoint.x + NODE_W + 24
  if (!horizontalClear(detourY, sideX, laneX, rowRects, sourceRect)) {
    return false
  }
  points.push({ x: sourcePoint.x + NODE_W, y: tail.y })
  points.push({ x: sideX, y: tail.y })
  points.push({ x: sideX, y: detourY })
  points.push({ x: laneX, y: detourY })
  return true
}

function normalizeAngle(angle: number): number {
  return ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
}

function rowRowGapRoute(
  field: PointerField,
  tail: Point,
  sourcePoint: Point,
  targetPoint: Point,
  ring: CircleGeometry,
  heapBand: Rect | null,
): ArrowRoute {
  const sourceCenter = nodeCenter(sourcePoint)
  const targetCenter = nodeCenter(targetPoint)
  const sourceAngle = Math.atan2(
    sourceCenter.y - ring.cy,
    sourceCenter.x - ring.cx,
  )
  const targetAngle = Math.atan2(
    targetCenter.y - ring.cy,
    targetCenter.x - ring.cx,
  )
  // A ring link is drawn along the shorter angular span. This also keeps
  // temporary non-adjacent links (deletion, reversal) off the nodes that sit
  // on the long side of the ring.
  const clockwise = normalizeAngle(targetAngle - sourceAngle)
  const delta = clockwise > Math.PI ? clockwise - Math.PI * 2 : clockwise
  const midpoint = sourceAngle + delta / 2
  const outer =
    ring.count === 2
      ? Math.max(90, ring.radius - 30)
      : ring.radius + NODE_W / 2 + 26
  const inner = Math.max(36, ring.radius - NODE_W / 2 - 12)
  // Reciprocal links (temporary deletion/reversal states) traverse the same
  // short span in opposite directions. Offset them by travel direction so the
  // two paths never share a lane.
  const forward = delta >= 0
  const radius =
    field === 'suivant'
      ? outer + (forward ? 0 : 22)
      : Math.max(28, inner - (forward ? 0 : 12))
  let gap = {
    x: ring.cx + Math.cos(midpoint) * radius,
    y: ring.cy + Math.sin(midpoint) * radius,
  }

  // On a two-node ring the left outside gap would fall inside the heap band.
  // Pull that one lane back into the free corridor between heap and ring.
  if (
    ring.count === 2 &&
    field === 'suivant' &&
    heapBand &&
    gap.x < heapBand.x + heapBand.width + 8 &&
    gap.y > heapBand.y - 8 &&
    gap.y < heapBand.y + heapBand.height + 8
  ) {
    gap = { x: heapBand.x + heapBand.width + 20, y: ring.cy }
  }

  const exit = borderPoint(sourceCenter, gap, circleNodeRect(sourcePoint))
  const entry = borderPoint(gap, targetCenter, circleNodeRect(targetPoint))
  return {
    kind: 'curve',
    path: `M ${tail.x} ${tail.y} L ${exit.x} ${exit.y} Q ${gap.x} ${gap.y} ${entry.x} ${entry.y}`,
    tail,
    tip: entry,
    bounds: boundsOfPoints([tail, exit, gap, entry], 2),
    points: [tail, exit, gap, entry],
  }
}

/**
 * Point where the node border faces the ring centre. The anchor stays on the
 * node edge (never inside a cell), so the resting link can reach the inner
 * lane without crossing the node it belongs to.
 */
function finalPrecedentAnchor(point: Point, ring: CircleGeometry): Point {
  return borderPoint(
    nodeCenter(point),
    { x: ring.cx, y: ring.cy },
    circleNodeRect(point),
  )
}

/** Project an anchor onto a concentric lane around the ring centre. */
function ringLanePoint(
  anchor: Point,
  ring: CircleGeometry,
  radius: number,
): { point: Point; angle: number } {
  const dx = anchor.x - ring.cx
  const dy = anchor.y - ring.cy
  const distance = Math.hypot(dx, dy)
  if (distance < 1e-6) {
    return { point: { x: ring.cx + radius, y: ring.cy }, angle: 0 }
  }
  const angle = Math.atan2(dy, dx)
  return {
    point: {
      x: ring.cx + (dx / distance) * radius,
      y: ring.cy + (dy / distance) * radius,
    },
    angle,
  }
}

/**
 * Cubic approximation of a circular arc, split in segments of at most 90° so
 * the result stays visually round. The signed delta drives the sweep
 * direction: positive is clockwise in SVG coordinates, negative anticlockwise.
 */
function arcCubicPath(
  center: Point,
  radius: number,
  startAngle: number,
  delta: number,
): { path: string; points: Point[] } {
  const segments = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2)))
  const step = delta / segments
  const control = (4 / 3) * Math.tan(Math.abs(step) / 4) * Math.sign(step)
  const points: Point[] = []
  let path = ''
  let angle = startAngle
  for (let index = 0; index < segments; index += 1) {
    const next = angle + step
    const start = {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    }
    const end = {
      x: center.x + Math.cos(next) * radius,
      y: center.y + Math.sin(next) * radius,
    }
    const first = {
      x: start.x - Math.sin(angle) * radius * control,
      y: start.y + Math.cos(angle) * radius * control,
    }
    const second = {
      x: end.x + Math.sin(next) * radius * control,
      y: end.y - Math.cos(next) * radius * control,
    }
    path += ` C ${first.x} ${first.y}, ${second.x} ${second.y}, ${end.x} ${end.y}`
    points.push(start, end)
    angle = next
  }
  return { path, points }
}

/**
 * Resting state of a circular list: `precedent` links run on an inner lane
 * and join the inner border of each node. Transient animation frames keep the
 * dot-to-border routing, which is why this is only used once the operation is
 * committed.
 */
function finalPrecedentRoute(
  sourcePoint: Point,
  targetPoint: Point,
  ring: CircleGeometry,
): ArrowRoute {
  const sourceAnchor = finalPrecedentAnchor(sourcePoint, ring)
  const targetAnchor = finalPrecedentAnchor(targetPoint, ring)
  // Largest concentric lane that stays clear of the node corners. Two-node
  // rings are constrained vertically; from three nodes on, the width of the
  // diagonal nodes is the limiting dimension. On a two-node ring the outer
  // `suivant` loop also comes close to the centre, hence the 45% cap.
  const laneRadius = Math.max(
    52,
    ring.count === 2
      ? Math.min(ring.radius - NODE_H / 2 - 24, ring.radius * 0.45)
      : ring.radius - NODE_W / 2 - 24,
  )
  const sourceLane = ringLanePoint(sourceAnchor, ring, laneRadius)
  const targetLane = ringLanePoint(targetAnchor, ring, laneRadius)
  // Precedent walks anticlockwise; the short signed span keeps the arc on the
  // side shared by the two neighbouring nodes.
  const delta = -normalizeAngle(sourceLane.angle - targetLane.angle)
  const arc = arcCubicPath(
    { x: ring.cx, y: ring.cy },
    laneRadius,
    sourceLane.angle,
    delta,
  )
  const points = [
    sourceAnchor,
    sourceLane.point,
    ...arc.points,
    targetLane.point,
    targetAnchor,
  ]
  return {
    kind: 'curve',
    path: `M ${sourceAnchor.x} ${sourceAnchor.y} L ${sourceLane.point.x} ${sourceLane.point.y}${arc.path} L ${targetAnchor.x} ${targetAnchor.y}`,
    tail: sourceAnchor,
    tip: targetAnchor,
    bounds: boundsOfPoints(points, 2),
    points,
  }
}

function singleRowMixedRoute(
  source: LdcNode,
  field: PointerField,
  tail: Point,
  sourcePoint: Point,
  targetPoint: Point,
  laneX: number,
): ArrowRoute {
  const heapSource = source.lane === 'heap'
  const points: Point[] = [tail]
  if (heapSource) {
    appendHeapExit(points, sourcePoint, tail, laneX)
    const rowEntryY = mixedRowEntryY(targetPoint, field)
    points.push({ x: laneX, y: rowEntryY })
    const tip = { x: targetPoint.x, y: rowEntryY }
    points.push(tip)
    return routeFromPoints('curve', points, tail, tip)
  }

  const center = nodeCenter(sourcePoint)
  const heapEntryY = mixedHeapEntryY(targetPoint, field)
  if (tail.x < center.x) {
    points.push({ x: sourcePoint.x, y: tail.y })
    points.push({ x: laneX, y: tail.y })
    points.push({ x: laneX, y: heapEntryY })
  } else {
    const above = heapEntryY < center.y
    const sideX = sourcePoint.x + NODE_W + 28
    const detourY = above
      ? sourcePoint.y - 42
      : sourcePoint.y + NODE_H + 42
    points.push({ x: sourcePoint.x + NODE_W, y: tail.y })
    points.push({ x: sideX, y: tail.y })
    points.push({ x: sideX, y: detourY })
    points.push({ x: laneX, y: detourY })
    points.push({ x: laneX, y: heapEntryY })
  }
  const tip = { x: targetPoint.x + NODE_W, y: heapEntryY }
  points.push(tip)
  return routeFromPoints('curve', points, tail, tip)
}

function mixedRoute(
  source: LdcNode,
  field: PointerField,
  tail: Point,
  sourcePoint: Point,
  targetPoint: Point,
  ring: CircleGeometry,
  rowRects: Rect[],
  heapRects: Rect[],
): ArrowRoute | null {
  const corridor = corridorFor(rowRects, heapRects)
  if (!corridor) return null
  const lane = mixedLaneFor(source, field)
  const laneX = mixedLaneX(corridor, lane)
  if (ring.count === 1) {
    return singleRowMixedRoute(
      source,
      field,
      tail,
      sourcePoint,
      targetPoint,
      laneX,
    )
  }

  const targetRect = circleNodeRect(targetPoint)
  const sourceRect = circleNodeRect(sourcePoint)
  const rowEntryY = mixedRowEntryY(targetPoint, field)
  const heapEntryY = mixedHeapEntryY(targetPoint, field)
  const points: Point[] = [tail]

  if (source.lane === 'heap') {
    if (horizontalClear(rowEntryY, laneX, targetPoint.x, rowRects, targetRect)) {
      appendHeapExit(points, sourcePoint, tail, laneX)
      points.push({ x: laneX, y: rowEntryY })
      const tip = { x: targetPoint.x, y: rowEntryY }
      points.push(tip)
      return routeFromPoints('curve', points, tail, tip)
    }
    const channels = pickChannels(
      leftChannels(rowRects, corridor.x, ring.cx, ring.cy),
      ring.cy,
    )
    const entryY = mixedEntryY(channels, lane)
    const hub = mixedHub(lane, ring)
    appendHeapExit(points, sourcePoint, tail, laneX)
    points.push({ x: laneX, y: entryY })
    points.push(hub)
    const tip = borderPoint(hub, nodeCenter(targetPoint), targetRect)
    points.push(tip)
    return routeFromPoints('curve', points, tail, tip)
  }

  if (
    appendRowToLaneExit(
      points,
      sourcePoint,
      tail,
      laneX,
      heapEntryY,
      rowRects,
      sourceRect,
    )
  ) {
    points.push({ x: laneX, y: heapEntryY })
    const tip = { x: targetPoint.x + NODE_W, y: heapEntryY }
    points.push(tip)
    return routeFromPoints('curve', points, tail, tip)
  }

  const channels = pickChannels(
    leftChannels(rowRects, corridor.x, ring.cx, ring.cy),
    ring.cy,
  )
  const entryY = mixedEntryY(channels, lane)
  const hub = mixedHub(lane, ring)
  appendRowExit(points, sourcePoint, tail, hub)
  points.push(hub)
  points.push({ x: laneX, y: entryY })
  points.push({ x: laneX, y: heapEntryY })
  const tip = { x: targetPoint.x + NODE_W, y: heapEntryY }
  points.push(tip)
  return routeFromPoints('curve', points, tail, tip)
}

function selfLoopRoute(
  field: PointerField,
  tail: Point,
  sourcePoint: Point,
): ArrowRoute {
  const above = field === 'suivant'
  const center = nodeCenter(sourcePoint)
  const right = tail.x >= center.x
  // Keep the loop tight around the node so it does not share the mixed-link
  // corridor on the left of the ring.
  const sideX = right ? sourcePoint.x + NODE_W + 10 : sourcePoint.x - 10
  const laneY = above ? sourcePoint.y - 14 : sourcePoint.y + NODE_H + 14
  const tipX = sourcePoint.x + NODE_W * (above ? 0.82 : 0.18)
  const tip = {
    x: tipX,
    y: above ? sourcePoint.y : sourcePoint.y + NODE_H,
  }
  const points = [
    tail,
    { x: right ? sourcePoint.x + NODE_W : sourcePoint.x, y: tail.y },
    { x: sideX, y: tail.y },
    { x: sideX, y: laneY },
    { x: tipX, y: laneY },
    tip,
  ]
  return routeFromPoints('curve', points, tail, tip, 12)
}

export interface DebutCellGeometry {
  cell: Rect
  dot: Point
  label: Point
}

export function debutCellGeometry(
  nodes: LdcNode[],
  mode: LayoutMode = 'row',
): DebutCellGeometry {
  const row = nodes
    .filter((node) => !node.freed && node.lane === 'row')
    .slice()
    .sort((a, b) => a.slot - b.slot)
  const first = row[0]
  const firstPoint =
    mode === 'circle' && first ? layoutNodes(nodes, mode).get(first.id) : undefined
  const rowX = firstPoint ? firstPoint.x : first ? PAD_L + first.slot * SLIDE : PAD_L
  const hasHeap = nodes.some((node) => !node.freed && node.lane === 'heap')
  const rowY = firstPoint
    ? firstPoint.y
    : first
      ? ROW_Y
      : mode === 'row' && hasHeap
        ? ROW_Y
        : EMPTY_ROW_Y
  const centerX = rowX + NODE_W / 2
  const cell: Rect = {
    x: centerX - DEBUT_CELL_W / 2,
    y: rowY - DEBUT_CELL_GAP - DEBUT_CELL_H,
    width: DEBUT_CELL_W,
    height: DEBUT_CELL_H,
  }
  return {
    cell,
    dot: {
      x: cell.x + DEBUT_DOT_X,
      y: cell.y + DEBUT_DOT_Y,
    },
    label: {
      x: cell.x + cell.width / 2,
      y: cell.y - 7,
    },
  }
}

export function debutCellBounds(nodes: LdcNode[], mode: LayoutMode = 'row'): Rect {
  const geometry = debutCellGeometry(nodes, mode)
  return unionBounds([
    geometry.cell,
    {
      x: geometry.label.x - 70,
      y: geometry.label.y - 14,
      width: 140,
      height: 20,
    },
  ])
}

export type NullStubDirection = 1 | -1 | 'down'

export interface NullStubGeometry {
  start: Point
  end: Point
  direction: NullStubDirection
  path: string
  label: { x: number; y: number; anchor: 'start' | 'end' | 'middle' }
  bounds: Rect
}

function makeNullStub(start: Point, direction: 1 | -1): NullStubGeometry {
  const end = { x: start.x + direction * NULL_STUB, y: start.y }
  const label = {
    x: end.x + direction * 20,
    y: end.y + 27,
    anchor: (direction > 0 ? 'start' : 'end') as 'start' | 'end',
  }
  const labelWidth = 36
  const labelRect: Rect =
    direction > 0
      ? { x: label.x, y: end.y + 12, width: labelWidth, height: 20 }
      : { x: label.x - labelWidth, y: end.y + 12, width: labelWidth, height: 20 }
  const points: Point[] = [
    start,
    end,
    { x: end.x + direction * 5, y: end.y - 7 },
    { x: end.x + direction * 5, y: end.y + 7 },
    { x: end.x + direction * 10, y: end.y - 3 },
    { x: end.x + direction * 10, y: end.y + 3 },
    { x: labelRect.x, y: labelRect.y },
    { x: labelRect.x + labelRect.width, y: labelRect.y + labelRect.height },
  ]
  return {
    start,
    end,
    direction,
    path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
    label,
    bounds: boundsOfPoints(points, 2),
  }
}

function makeVerticalNullStub(start: Point, length = NULL_STUB): NullStubGeometry {
  const end = { x: start.x, y: start.y + length }
  const label = { x: end.x, y: end.y + 27, anchor: 'middle' as const }
  const labelRect: Rect = {
    x: end.x - 18,
    y: end.y + 12,
    width: 36,
    height: 20,
  }
  const points: Point[] = [
    start,
    end,
    { x: end.x - 11, y: end.y },
    { x: end.x + 11, y: end.y },
    { x: end.x - 3, y: end.y + 10 },
    { x: end.x + 3, y: end.y + 10 },
    { x: labelRect.x, y: labelRect.y },
    { x: labelRect.x + labelRect.width, y: labelRect.y + labelRect.height },
  ]
  return {
    start,
    end,
    direction: 'down',
    path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
    label,
    bounds: boundsOfPoints(points, 2),
  }
}

export function nullStubGeometry(
  node: LdcNode,
  field: PointerField,
  point: Point,
  flipped = false,
): NullStubGeometry {
  return makeNullStub(
    pointerAnchor(node, point, field, flipped),
    field === 'suivant' ? 1 : -1,
  )
}

export function emptyNullStubGeometry(): NullStubGeometry {
  return makeVerticalNullStub({ x: EMPTY_NULL_X, y: EMPTY_ROW_Y })
}

export function nullAnchor(nodes: LdcNode[], layout: Map<number, Point>): Point {
  const row = nodes
    .filter((node) => node.lane === 'row')
    .slice()
    .sort((a, b) => a.slot - b.slot)

  for (let index = row.length - 1; index >= 0; index -= 1) {
    const node = row[index]!
    if (node.suivant.kind === 'null') {
      const point = layout.get(node.id)
      if (point) {
        const anchor = pointerAnchor(node, point, 'suivant')
        return { x: anchor.x + NULL_STUB, y: anchor.y }
      }
    }
  }

  for (const node of row) {
    if (node.precedent.kind === 'null') {
      const point = layout.get(node.id)
      if (point) {
        const anchor = pointerAnchor(node, point, 'precedent')
        return { x: anchor.x - NULL_STUB, y: anchor.y }
      }
    }
  }

  return emptyNullStubGeometry().end
}

export interface ArrowRoute {
  kind: 'straight' | 'curve' | 'reverse' | 'null'
  path: string
  tail: Point
  tip: Point
  bounds: Rect
  /** On-path waypoints, used by collision tests and bounds checks. */
  points: Point[]
  stub?: NullStubGeometry
}

export interface RouteArrowOptions {
  /**
   * Committed circular-list state: use the resting concentric lanes instead of
   * the transient dot-to-border routing. Animation frames never set this.
   */
  finalForm?: boolean
}

export function routeArrow(
  source: LdcNode,
  field: PointerField,
  target: LdcNode | null,
  layout: Map<number, Point>,
  mode: LayoutMode = 'row',
  nodes: LdcNode[] = [],
  options: RouteArrowOptions = {},
): ArrowRoute | null {
  const sourcePoint = layout.get(source.id)
  if (!sourcePoint) return null
  const ring = mode === 'circle' ? circleGeometry(nodes) : null
  const tail = pointerAnchor(
    source,
    sourcePoint,
    field,
    isRowFlipped(source, sourcePoint, ring),
  )

  if (!target) {
    const stub = nullStubGeometry(
      source,
      field,
      sourcePoint,
      isRowFlipped(source, sourcePoint, ring),
    )
    return {
      kind: 'null',
      path: stub.path,
      tail,
      tip: stub.end,
      bounds: stub.bounds,
      points: [tail, stub.end],
      stub,
    }
  }

  const targetPoint = layout.get(target.id)
  if (!targetPoint) return null

  // A one-node circular list points to itself. Chapter 4 never produces this
  // case, but chapter 5 relies on it: draw a visible loop above the node for
  // `suivant` and below it for `precedent`.
  if (source.id === target.id) {
    return selfLoopRoute(field, tail, sourcePoint)
  }

  if (mode === 'circle' && ring) {
    if (
      options.finalForm &&
      field === 'precedent' &&
      source.lane === 'row' &&
      target.lane === 'row' &&
      ring.count >= 2 &&
      nodes.every((node) => node.freed || node.lane === 'row')
    ) {
      return finalPrecedentRoute(sourcePoint, targetPoint, ring)
    }
    if (source.lane === 'row' && target.lane === 'row' && ring.radius > 0) {
      return rowRowGapRoute(
        field,
        tail,
        sourcePoint,
        targetPoint,
        ring,
        circleHeapBand(nodes),
      )
    }
    if (source.lane !== target.lane) {
      const route = mixedRoute(
        source,
        field,
        tail,
        sourcePoint,
        targetPoint,
        ring,
        nodes
          .filter((node) => !node.freed && node.lane === 'row')
          .map((node) => circleNodeRect(layout.get(node.id)!)),
        nodes
          .filter((node) => !node.freed && node.lane === 'heap')
          .map((node) => circleNodeRect(layout.get(node.id)!)),
      )
      if (route) return route
    }
  }

  const sameLane = source.lane === target.lane
  const slotDelta = target.slot - source.slot

  if (sameLane && field === 'suivant' && slotDelta === 1) {
    const tip = { x: targetPoint.x, y: tail.y }
    return {
      kind: 'straight',
      path: `M ${tail.x} ${tail.y} L ${tip.x} ${tip.y}`,
      tail,
      tip,
      bounds: boundsOfPoints([tail, tip], 2),
      points: [tail, tip],
    }
  }

  if (sameLane && field === 'precedent' && slotDelta === -1) {
    const tip = { x: targetPoint.x + NODE_W, y: tail.y }
    return {
      kind: 'straight',
      path: `M ${tail.x} ${tail.y} L ${tip.x} ${tip.y}`,
      tail,
      tip,
      bounds: boundsOfPoints([tail, tip], 2),
      points: [tail, tip],
    }
  }

  const targetIsRight = targetPoint.x > sourcePoint.x
  const reverse =
    sameLane &&
    ((field === 'suivant' && !targetIsRight) ||
      (field === 'precedent' && targetIsRight))

  if (reverse) {
    const above = field === 'suivant'
    const exit = {
      x: sourcePoint.x + (field === 'suivant' ? NODE_W + 32 : -32),
      y: tail.y,
    }
    const tip = {
      x: above ? targetPoint.x + NODE_W / 2 : targetPoint.x + NODE_W * 0.25,
      y: above ? targetPoint.y : targetPoint.y + NODE_H,
    }
    const arcY = above
      ? Math.min(sourcePoint.y, targetPoint.y) - NODE_H * 0.72
      : Math.max(sourcePoint.y, targetPoint.y) + NODE_H * 1.72
    const c1 = { x: exit.x + (field === 'suivant' ? 46 : -46), y: arcY }
    const c2 = { x: tip.x, y: arcY }
    return {
      kind: 'reverse',
      path: `M ${tail.x} ${tail.y} L ${exit.x} ${exit.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${tip.x} ${tip.y}`,
      tail,
      tip,
      bounds: boundsOfPoints([tail, exit, c1, c2, tip], 2),
      points: [tail, exit, c1, c2, tip],
    }
  }

  if (sameLane && Math.abs(slotDelta) > 1) {
    const above = field === 'suivant'
    const exit = {
      x: sourcePoint.x + (field === 'suivant' ? NODE_W + 32 : -32),
      y: tail.y,
    }
    const tip = {
      x: targetIsRight ? targetPoint.x : targetPoint.x + NODE_W,
      y: targetPoint.y + NODE_H * (field === 'suivant' ? SUIVANT_LANE : PRECEDENT_LANE),
    }
    const arcY = above
      ? Math.min(sourcePoint.y, targetPoint.y) - NODE_H * 0.72
      : Math.max(sourcePoint.y, targetPoint.y) + NODE_H * 1.72
    const c1 = { x: exit.x + (field === 'suivant' ? 60 : -60), y: arcY }
    const c2 = { x: tip.x + (targetIsRight ? -60 : 60), y: tip.y }
    return {
      kind: 'curve',
      path: `M ${tail.x} ${tail.y} L ${exit.x} ${exit.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${tip.x} ${tip.y}`,
      tail,
      tip,
      bounds: boundsOfPoints([tail, exit, c1, c2, tip], 2),
      points: [tail, exit, c1, c2, tip],
    }
  }

  const exit = {
    x: sourcePoint.x + (field === 'suivant' ? NODE_W + 32 : -32),
    y: tail.y,
  }

  if (Math.abs(targetPoint.y - sourcePoint.y) > NODE_H) {
    const targetAbove = targetPoint.y < sourcePoint.y
    const tip = {
      x: targetPoint.x + NODE_W / 2,
      y: targetAbove ? targetPoint.y + NODE_H : targetPoint.y,
    }
    const c2 = {
      x: tip.x,
      y: targetAbove ? tip.y + 64 : tip.y - 64,
    }
    const c1 = {
      x: exit.x + (field === 'suivant' ? 72 : -72),
      y: exit.y,
    }
    return {
      kind: 'curve',
      path: `M ${tail.x} ${tail.y} L ${exit.x} ${exit.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${tip.x} ${tip.y}`,
      tail,
      tip,
      bounds: boundsOfPoints([tail, exit, c1, c2, tip], 2),
      points: [tail, exit, c1, c2, tip],
    }
  }

  const targetRight = targetPoint.x + NODE_W / 2 > sourcePoint.x + NODE_W / 2
  const tip = {
    x: targetRight ? targetPoint.x : targetPoint.x + NODE_W,
    y: clamp(tail.y, targetPoint.y + 10, targetPoint.y + NODE_H - 10),
  }
  const c2 = {
    x: tip.x + (targetRight ? -60 : 60),
    y: tip.y,
  }
  const c1 = {
    x: exit.x + (field === 'suivant' ? 80 : -80),
    y: exit.y,
  }
  return {
    kind: 'curve',
    path: `M ${tail.x} ${tail.y} L ${exit.x} ${exit.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${tip.x} ${tip.y}`,
    tail,
    tip,
    bounds: boundsOfPoints([tail, exit, c1, c2, tip], 2),
    points: [tail, exit, c1, c2, tip],
  }
}

export function debutRoute(
  nodes: LdcNode[],
  value: PointerValue,
  mode: LayoutMode = 'row',
): ArrowRoute | null {
  if (value.kind === 'uninit') return null
  const geometry = debutCellGeometry(nodes, mode)
  if (value.kind === 'null') {
    const stub = makeVerticalNullStub(geometry.dot)
    return {
      kind: 'null',
      path: stub.path,
      tail: geometry.dot,
      tip: stub.end,
      bounds: stub.bounds,
      points: [geometry.dot, stub.end],
      stub,
    }
  }

  const target = nodes.find((candidate) => candidate.id === value.id)
  if (!target) return null
  const targetPoint = layoutNodes(nodes, mode).get(target.id)
  if (!targetPoint) return null
  const tip = { x: targetPoint.x + NODE_W / 2, y: targetPoint.y }
  return {
    kind: 'straight',
    path: `M ${geometry.dot.x} ${geometry.dot.y} L ${tip.x} ${tip.y}`,
    tail: geometry.dot,
    tip,
    bounds: boundsOfPoints([geometry.dot, tip], 2),
    points: [geometry.dot, tip],
  }
}

export interface PinInput {
  name: string
  text: string
  target: 'node' | 'null' | 'uninit'
  targetId?: number
}

export interface PinPlacement {
  pin: PinInput
  tag: Rect
  from: Point
  to?: Point
  nullStub?: NullStubGeometry
}

function pinWidth(text: string): number {
  return Math.max(54, text.length * 7.8 + 22)
}

function centerRows(rows: PinInput[][], centerX: number): number[][] {
  return rows.map((row) => {
    const widths = row.map((pin) => pinWidth(pin.text))
    const total = widths.reduce((sum, width) => sum + width, 0) + PIN_GAP * (row.length - 1)
    let cursor = centerX - total / 2
    return row.map((_pin, index) => {
      const width = widths[index]!
      const center = cursor + width / 2
      cursor += width + PIN_GAP
      return center
    })
  })
}

function avoidTagCorridors(
  centers: number[],
  lowerTags: Rect[],
  minX: number,
  maxX: number,
): number[] {
  if (lowerTags.length === 0) return centers
  const forbidden = lowerTags.map((tag) => ({
    min: tag.x - 4,
    max: tag.x + tag.width + 4,
  }))
  const used: number[] = []
  return centers.map((natural) => {
    const candidates: number[] = [natural]
    for (let step = 0; step <= 60; step += 1) {
      candidates.push(minX + ((maxX - minX) * step) / 60)
    }
    candidates.sort((a, b) => Math.abs(a - natural) - Math.abs(b - natural))
    for (const candidate of candidates) {
      if (candidate < minX - 1 || candidate > maxX + 1) continue
      if (forbidden.some((range) => candidate >= range.min && candidate <= range.max)) continue
      if (used.some((value) => Math.abs(value - candidate) < 10)) continue
      used.push(candidate)
      return candidate
    }
    used.push(natural)
    return natural
  })
}

export function layoutPins(
  pins: PinInput[],
  nodes: LdcNode[],
  mode: LayoutMode = 'row',
): PinPlacement[] {
  if (pins.length === 0) return []
  const layout = layoutNodes(nodes, mode)
  const anchor = nullAnchor(nodes, layout)
  const groups = new Map<string, PinInput[]>()
  for (const pin of pins) {
    const key = pin.target === 'node' ? `node:${pin.targetId ?? ''}` : pin.target
    const group = groups.get(key) ?? []
    group.push(pin)
    groups.set(key, group)
  }

  const placements: PinPlacement[] = []
  const firstRowId = nodes
    .filter((candidate) => !candidate.freed && candidate.lane === 'row')
    .slice()
    .sort((a, b) => a.slot - b.slot)[0]?.id

  for (const [key, group] of groups) {
    let centerX = anchor.x
    let baseY = nodes.length === 0 ? EMPTY_ROW_Y - 36 : ROW_Y - 12
    let targetPoint: Point | null = null
    let node: LdcNode | null = null

    if (key.startsWith('node:')) {
      const targetId = Number(key.slice(5))
      node = nodes.find((candidate) => candidate.id === targetId) ?? null
      targetPoint = node ? layout.get(node.id) ?? null : null
      if (!node || !targetPoint) continue
      centerX = targetPoint.x + NODE_W / 2
      baseY = targetPoint.y - 12
    } else if (key === 'null') {
      baseY -= PIN_NULL_LIFT
    }

    const widths = group.map((pin) => pinWidth(pin.text))
    const total = widths.reduce((sum, width) => sum + width, 0) + PIN_GAP * (group.length - 1)
    const rows: PinInput[][] = []
    if (total <= PIN_MAX_FAN) {
      rows.push(group)
    } else {
      for (let index = 0; index < group.length; index += 2) {
        rows.push(group.slice(index, index + 2))
      }
    }

    const rowCenters = centerRows(rows, centerX)
    const lowerTags: Rect[] = []

    rows.forEach((row, rowIndex) => {
      const minX = node ? targetPoint!.x + 8 : anchor.x - PIN_MAX_FAN / 2
      const maxX = node ? targetPoint!.x + NODE_W - 8 : anchor.x + PIN_MAX_FAN / 2
      let centers =
        rowIndex === 0
          ? rowCenters[rowIndex]!
          : avoidTagCorridors(rowCenters[rowIndex]!, lowerTags, minX, maxX)
      if (node && targetPoint && node.id === firstRowId) {
        const rowWidths = row.map((pin) => pinWidth(pin.text))
        const rowLeft = centers[0]! - rowWidths[0]! / 2
        const lastIndex = centers.length - 1
        const rowRight = centers[lastIndex]! + rowWidths[lastIndex]! / 2
        const arrowX = targetPoint!.x + NODE_W / 2
        if (
          arrowX >= rowLeft - PIN_DEBUT_CLEARANCE &&
          arrowX <= rowRight + PIN_DEBUT_CLEARANCE
        ) {
          const shift = arrowX + PIN_DEBUT_CLEARANCE - rowLeft
          centers = centers.map((center) => center + shift)
        }
      }
      const y = baseY - PIN_TAG_H - rowIndex * (PIN_TAG_H + 8)
      row.forEach((pin, index) => {
        const width = pinWidth(pin.text)
        const center = centers[index]!
        const tag: Rect = {
          x: center - width / 2,
          y,
          width,
          height: PIN_TAG_H,
        }
        const from = { x: center, y: y + PIN_TAG_H }
        let to: Point | undefined
        let nullStub: NullStubGeometry | undefined
        if (pin.target === 'node') {
          to = { x: center, y: targetPoint!.y + 1 }
        } else if (pin.target === 'null') {
          nullStub = makeVerticalNullStub(from, PIN_NULL_STUB)
        }
        placements.push({
          pin,
          tag,
          from,
          ...(to === undefined ? {} : { to }),
          ...(nullStub === undefined ? {} : { nullStub }),
        })
        lowerTags.push(tag)
      })
    })
  }

  return placements
}

export function nodeBounds(point: Point): Rect {
  return { x: point.x - 4, y: point.y - 30, width: NODE_W + 8, height: NODE_H + 34 }
}

export function boundsOfPoints(points: Point[], padding = 0): Rect {
  if (points.length === 0) return { x: 0, y: 0, width: 1, height: 1 }
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  for (const point of points) {
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }
  return {
    x: minX - padding,
    y: minY - padding,
    width: Math.max(1, maxX - minX + padding * 2),
    height: Math.max(1, maxY - minY + padding * 2),
  }
}

export function unionBounds(rects: Rect[]): Rect {
  if (rects.length === 0) return { x: 0, y: 0, width: 1, height: 1 }
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

export function snapshotBounds(
  nodes: LdcNode[],
  pins: PinInput[] = [],
  debut: PointerValue = { kind: 'null' },
  mode: LayoutMode = 'row',
): Rect {
  const layout = layoutNodes(nodes, mode)
  const rects: Rect[] = []
  const ring = mode === 'circle' ? circleGeometry(nodes) : null
  if (ring) {
    const radius = ring.radius + NODE_W / 2 + 26
    rects.push({
      x: ring.cx - radius,
      y: ring.cy - radius,
      width: radius * 2,
      height: radius * 2,
    })
  }
  const debutGeometry = debutCellGeometry(nodes, mode)
  rects.push(debutGeometry.cell)
  rects.push({
    x: debutGeometry.label.x - 70,
    y: debutGeometry.label.y - 14,
    width: 140,
    height: 20,
  })
  const debutArrow = debutRoute(nodes, debut, mode)
  if (debutArrow) rects.push(debutArrow.bounds)

  const heapBand = mode === 'circle' ? circleHeapBand(nodes) : null
  if (heapBand) {
    rects.push(heapBand)
    if (!ring) rects.push(emptyListBand())
  }

  for (const node of nodes) {
    const point = layout.get(node.id)
    if (point) rects.push(nodeBounds(point))
  }

  for (const node of nodes) {
    if (node.freed) continue
    const point = layout.get(node.id)
    if (!point) continue
    for (const field of ['suivant', 'precedent'] as const) {
      const pointer = node[field]
      if (pointer.kind === 'uninit') continue
      if (pointer.kind === 'null') {
        rects.push(
          nullStubGeometry(
            node,
            field,
            point,
            isRowFlipped(node, point, ring),
          ).bounds,
        )
        continue
      }
      const target = nodes.find((candidate) => candidate.id === pointer.id) ?? null
      if (!target) continue
      const route = routeArrow(node, field, target, layout, mode, nodes)
      if (route) rects.push(route.bounds)
    }
  }

  for (const placement of layoutPins(pins, nodes, mode)) {
    rects.push(placement.tag)
    if (placement.to) {
      rects.push(boundsOfPoints([placement.from, placement.to], 1))
    }
    if (placement.nullStub) rects.push(placement.nullStub.bounds)
  }

  return unionBounds(rects)
}

export function fitCamera(
  bbox: Rect,
  size: Size,
  padding = FIT_PADDING,
  minK = MIN_AUTO_K,
  maxK = MAX_AUTO_K,
): Camera {
  const width = Math.max(1, size.width)
  const height = Math.max(1, size.height)
  const k = clamp(
    Math.min(width / (bbox.width + 2 * padding), height / (bbox.height + 2 * padding)),
    minK,
    maxK,
  )
  const centerX = bbox.x + bbox.width / 2
  const centerY = bbox.y + bbox.height / 2
  return {
    k,
    x: width / 2 - centerX * k,
    y: height / 2 - centerY * k,
  }
}

export function cameraAtOne(bbox: Rect, size: Size): Camera {
  const centerX = bbox.x + bbox.width / 2
  const centerY = bbox.y + bbox.height / 2
  return {
    k: 1,
    x: size.width / 2 - centerX,
    y: size.height / 2 - centerY,
  }
}

export function worldPoint(camera: Camera, screen: Point): Point {
  return {
    x: (screen.x - camera.x) / camera.k,
    y: (screen.y - camera.y) / camera.k,
  }
}

export function screenPoint(camera: Camera, world: Point): Point {
  return {
    x: world.x * camera.k + camera.x,
    y: world.y * camera.k + camera.y,
  }
}

export function zoomAtCursor(
  camera: Camera,
  cursor: Point,
  factor: number,
  minK = MIN_K,
  maxK = MAX_K,
): Camera {
  const anchor = worldPoint(camera, cursor)
  const k = clamp(camera.k * factor, minK, maxK)
  return {
    k,
    x: cursor.x - anchor.x * k,
    y: cursor.y - anchor.y * k,
  }
}
