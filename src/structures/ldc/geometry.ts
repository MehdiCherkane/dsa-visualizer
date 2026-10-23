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
export const BAND_PAD = 28
export const EMPTY_BAND_TOP = 200
export const EMPTY_BAND_HEIGHT = 146
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
    for (const node of nodes) {
      if (node.lane === 'heap') {
        layout.set(node.id, { x: CIRCLE_CX - NODE_W / 2, y: HEAP_Y })
      }
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
  const rowY = firstPoint ? firstPoint.y : first || hasHeap ? ROW_Y : EMPTY_ROW_Y
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
): NullStubGeometry {
  return makeNullStub(pointerAnchor(node, point, field), field === 'suivant' ? 1 : -1)
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
  stub?: NullStubGeometry
}

/**
 * Routes a circular link locally around the ring. Every arrow starts at its
 * colored pointer dot, rounds the target on the side facing the source and
 * lands horizontally on the opposite border of that target.
 */
function circularRoute(
  field: PointerField,
  sourcePoint: Point,
  targetPoint: Point,
  ring: CircleGeometry,
): ArrowRoute {
  const outward = field === 'suivant'
  const sourceFlipped = isNodeFlipped(sourcePoint, ring)
  const targetFlipped = isNodeFlipped(targetPoint, ring)
  const startSide = pointerSide(field, sourceFlipped)
  const start = {
    x:
      startSide === 'right'
        ? sourcePoint.x + NODE_W - CELL_W / 2
        : sourcePoint.x + CELL_W / 2,
    y: sourcePoint.y + NODE_H * (outward ? SUIVANT_LANE : PRECEDENT_LANE),
  }

  // The arrow enters the target on the cell side opposite to the source
  // pointer: a forward link lands on the PREC side, a backward link on SUIV.
  const endAtRight = outward ? targetFlipped : !targetFlipped
  const end = {
    x: endAtRight ? targetPoint.x + NODE_W : targetPoint.x,
    y:
      targetPoint.y +
      NODE_H * (outward ? PRECEDENT_LANE : SUIVANT_LANE),
  }

  const sourceSign = startSide === 'right' ? 1 : -1
  const targetSign = endAtRight ? 1 : -1
  const sourceCenterY = sourcePoint.y + NODE_H / 2
  const targetCenterY = targetPoint.y + NODE_H / 2
  const wrapAbove =
    Math.abs(sourceCenterY - targetCenterY) < 1
      ? !outward
      : sourceCenterY < targetCenterY

  // Approach the target from just outside its opposite border, then round the
  // last corner so the tip lands horizontally on the border.
  const margin = 34
  const outside = { x: end.x + targetSign * margin, y: end.y }
  const corner = {
    x: outside.x,
    y: end.y + (wrapAbove ? -margin : margin),
  }
  const delta = { x: corner.x - start.x, y: corner.y - start.y }
  const c1 = {
    x: start.x + delta.x * 0.35 + sourceSign * 26,
    y: start.y + delta.y * 0.35,
  }
  const c2 = {
    x: corner.x,
    y: corner.y + (wrapAbove ? -36 : 36),
  }

  return {
    kind: 'curve',
    path: [
      `M ${start.x} ${start.y}`,
      `C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${corner.x} ${corner.y}`,
      `Q ${outside.x} ${outside.y}, ${end.x} ${end.y}`,
    ].join(' '),
    tail: start,
    tip: end,
    bounds: boundsOfPoints([start, c1, c2, corner, outside, end], 2),
  }
}

export function routeArrow(
  source: LdcNode,
  field: PointerField,
  target: LdcNode | null,
  layout: Map<number, Point>,
  mode: LayoutMode = 'row',
  nodes: LdcNode[] = [],
): ArrowRoute | null {
  const sourcePoint = layout.get(source.id)
  if (!sourcePoint) return null
  const ring = mode === 'circle' ? circleGeometry(nodes) : null
  const tail = pointerAnchor(
    source,
    sourcePoint,
    field,
    isNodeFlipped(sourcePoint, ring),
  )

  if (!target) {
    const stub = nullStubGeometry(source, field, sourcePoint)
    return {
      kind: 'null',
      path: stub.path,
      tail,
      tip: stub.end,
      bounds: stub.bounds,
      stub,
    }
  }

  const targetPoint = layout.get(target.id)
  if (!targetPoint) return null

  // A one-node circular list points to itself. Chapter 4 never produces this
  // case, but chapter 5 relies on it: draw a visible loop above the node for
  // `suivant` and below it for `precedent`.
  if (source.id === target.id) {
    const above = field === 'suivant'
    const exit = {
      x: sourcePoint.x + (above ? NODE_W + 40 : -40),
      y: tail.y,
    }
    const tip = {
      x: sourcePoint.x + NODE_W * (above ? 0.86 : 0.14),
      y: above ? sourcePoint.y : sourcePoint.y + NODE_H,
    }
    const bendY = above ? sourcePoint.y - 64 : sourcePoint.y + NODE_H + 64
    const c1 = { x: exit.x + (above ? 24 : -24), y: bendY }
    const c2 = { x: tip.x, y: bendY }
    return {
      kind: 'curve',
      path: `M ${tail.x} ${tail.y} L ${exit.x} ${exit.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${tip.x} ${tip.y}`,
      tail,
      tip,
      bounds: boundsOfPoints([tail, exit, c1, c2, tip], 2),
    }
  }

  if (
    mode === 'circle' &&
    source.lane === 'row' &&
    target.lane === 'row'
  ) {
    if (ring && ring.radius > 0) {
      return circularRoute(field, sourcePoint, targetPoint, ring)
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
        rects.push(nullStubGeometry(node, field, point).bounds)
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
