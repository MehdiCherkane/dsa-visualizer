import type { BaseSnapshot, PointerValue } from '../../core/types'

export type VizOrientation = 'horizontal' | 'vertical'
export type VizLayoutMode = 'row' | 'ring'
export type VizField = 'suivant' | 'precedent'
export type VizLane = 'row' | 'heap'
export type GlobalPlacement = 'left' | 'top' | 'bottom' | 'row'

export interface VizNode {
  id: number
  address: string
  slot: number
  lane: VizLane
  freed: boolean
  value: string
  subvalue?: string
  uninit: boolean
  pointer: PointerValue
  pointerUninit: boolean
}

export interface VizGlobal {
  name: string
  value: PointerValue
  placement?: GlobalPlacement
}

export interface GlobalCellPlacement {
  rect: Rect
  placement: GlobalPlacement
}

export interface VizPin {
  name: string
  value: PointerValue
  alias?: boolean
}

export interface LinkedModel<S extends BaseSnapshot> {
  orientation: VizOrientation
  field: VizField
  fieldLabel: string
  rowLabel: string
  /** When true, the last `suivant` wraps back to the head and the nodes form a ring. */
  circular?: boolean
  emptyText: string
  emptyInsert: string
  ariaLabel: string
  showHeap?: boolean
  nodes: (snapshot: S) => VizNode[]
  globals: (snapshot: S) => VizGlobal[]
  pins: (snapshot: S) => VizPin[]
}

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

export interface NullStub {
  start: Point
  end: Point
  path: string
  label: Point
  labelAnchor?: 'start' | 'end' | 'middle'
  orientation: 'horizontal' | 'vertical'
}

export const NODE_W = 214
export const NODE_H = 86
export const VALUE_W = 132
export const FIELD_W = NODE_W - VALUE_W
export const NODE_RX = 14

export const PAD_L = 206
export const SLIDE = 300
export const ROW_Y = 330
export const HEAP_Y = 92

export const STACK_X = 340
export const STACK_TOP = 160
export const STACK_SLIDE = 138
export const HEAP_STACK_X = 760

export const GLOBAL_W = 132
export const GLOBAL_H = 44
export const GLOBAL_X = 26
export const NULL_STUB = 64
export const NULL_DOWN = 52

export const FIT_PADDING = 56
export const MIN_AUTO_K = 0.25
export const MAX_AUTO_K = 1.25
export const MIN_K = 0.25
export const MAX_K = 4

export const RING_CX = 640
export const RING_CY = 520
export const RING_MIN_RADIUS = 250
/** Minimum breathing room between two ring nodes. */
export const RING_NODE_GAP = 46
/** Horizontal/vertical padding of the decorative band around the ring. */
export const RING_BAND_PAD_X = 68
export const RING_BAND_PAD_Y = 44
/** Distance between the outer node border and the first arrow lane. */
export const RING_OUTER_PAD = 38

export interface RingGeometry {
  cx: number
  cy: number
  /** Horizontal and vertical radii of the ellipse through the node centres. */
  rx: number
  ry: number
  /** Largest radius, kept for arrow routing and bounds checks. */
  radius: number
  count: number
  startAngle: number
  step: number
}

export interface RingBandGeometry {
  cx: number
  cy: number
  rx: number
  ry: number
  rect: Rect
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Rings of four, six or eight start on a flat top edge (four nodes form the
 * square of the reference drawing); other rings keep a single node at the top.
 */
export function ringStartAngle(count: number): number {
  if (count === 4) return (-3 * Math.PI) / 4
  if (count === 6) return (-2 * Math.PI) / 3
  if (count === 8) return (-5 * Math.PI) / 8
  return -Math.PI / 2
}

function ringPoints(
  count: number,
  rx: number,
  ry: number,
  startAngle: number,
): Point[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = startAngle + (index * Math.PI * 2) / count
    return { x: Math.cos(angle) * rx, y: Math.sin(angle) * ry }
  })
}

function ringRectsClear(
  count: number,
  rx: number,
  ry: number,
  startAngle: number,
): boolean {
  const points = ringPoints(count, rx, ry, startAngle)
  for (let first = 0; first < points.length; first += 1) {
    for (let second = first + 1; second < points.length; second += 1) {
      const dx = Math.abs(points[first]!.x - points[second]!.x)
      const dy = Math.abs(points[first]!.y - points[second]!.y)
      if (dx < NODE_W + RING_NODE_GAP && dy < NODE_H + RING_NODE_GAP) {
        return false
      }
    }
  }
  return true
}

export function ringGeometry(nodes: VizNode[]): RingGeometry | null {
  const count = nodes.filter((node) => node.lane === 'row').length
  if (count === 0) return null
  const startAngle = ringStartAngle(count)
  const step = count === 1 ? 0 : (Math.PI * 2) / count
  if (count === 1) {
    return {
      cx: RING_CX,
      cy: RING_CY,
      rx: 0,
      ry: 0,
      radius: 0,
      count,
      startAngle,
      step,
    }
  }

  // Grow the ellipse until every pair of node rectangles is separated by at
  // least one axis. Wide cards need more room than a simple chord formula
  // gives them, especially near the top of a pointy ring.
  let rx = count === 2 ? 0 : RING_MIN_RADIUS
  let ry = count === 2 ? 190 : rx * 0.8
  while (count > 2 && rx < 900 && !ringRectsClear(count, rx, ry, startAngle)) {
    rx += 8
    ry = rx * 0.8
  }
  return {
    cx: RING_CX,
    cy: RING_CY,
    rx,
    ry,
    radius: Math.max(rx, ry),
    count,
    startAngle,
    step,
  }
}

export function ringBand(ring: RingGeometry): RingBandGeometry {
  const rx = ring.rx + NODE_W / 2 + RING_BAND_PAD_X
  const ry = ring.ry + NODE_H / 2 + RING_BAND_PAD_Y
  return {
    cx: ring.cx,
    cy: ring.cy,
    rx,
    ry,
    rect: {
      x: ring.cx - rx,
      y: ring.cy - ry,
      width: rx * 2,
      height: ry * 2,
    },
  }
}

/** Fixed elliptical band used when the circular list is empty. */
export function emptyRingBand(): RingBandGeometry {
  const rect: Rect = { x: 150, y: 300, width: 600, height: 220 }
  return {
    cx: rect.x + rect.width / 2,
    cy: rect.y + rect.height / 2,
    rx: rect.width / 2,
    ry: rect.height / 2,
    rect,
  }
}

/**
 * Ring nodes keep their cards axis-aligned. The field cell is flipped on the
 * left half and on the lower half so reciprocal links leave on opposite sides.
 */
export function isRingNodeFlipped(point: Point, ring: RingGeometry | null): boolean {
  if (!ring) return false
  const center = nodeCenter(point)
  return center.x < ring.cx - 0.5 || center.y > ring.cy + 0.5
}

export function layoutNodes(
  nodes: VizNode[],
  orientation: VizOrientation,
  mode: VizLayoutMode = 'row',
): Map<number, Point> {
  const layout = new Map<number, Point>()
  if (orientation === 'horizontal' && mode === 'ring') {
    const row = nodes
      .filter((node) => node.lane === 'row')
      .slice()
      .sort((first, second) => first.slot - second.slot)
    const ring = ringGeometry(nodes)
    if (ring) {
      row.forEach((node, index) => {
        const angle =
          row.length === 1
            ? 0
            : ring.startAngle + (index * Math.PI * 2) / row.length
        const cx = ring.cx + Math.cos(angle) * ring.rx
        const cy = ring.cy + Math.sin(angle) * ring.ry
        layout.set(node.id, { x: cx - NODE_W / 2, y: cy - NODE_H / 2 })
      })

      const heap = nodes
        .filter((node) => node.lane === 'heap')
        .slice()
        .sort((first, second) => first.id - second.id)
      if (heap.length > 0) {
        const rowXs = row
          .map((node) => layout.get(node.id)?.x)
          .filter((x): x is number => x !== undefined)
        const left = rowXs.length > 0 ? Math.min(...rowXs) : RING_CX
        const stackHeight = heap.length * NODE_H + (heap.length - 1) * 24
        const top = ring.cy - stackHeight / 2
        heap.forEach((node, index) => {
          layout.set(node.id, {
            x: left - RING_BAND_PAD_X - 56 - NODE_W,
            y: top + index * (NODE_H + 24),
          })
        })
      }
      return layout
    }
  }

  for (const node of nodes) {
    if (orientation === 'horizontal') {
      layout.set(node.id, {
        x: PAD_L + node.slot * SLIDE,
        y: node.lane === 'heap' ? HEAP_Y : ROW_Y,
      })
    } else {
      layout.set(node.id, {
        x: node.lane === 'heap' ? HEAP_STACK_X : STACK_X,
        y: STACK_TOP + node.slot * STACK_SLIDE,
      })
    }
  }
  return layout
}

export function globalCellGeometry(
  index: number,
  count: number,
  orientation: VizOrientation,
): Rect {
  if (orientation === 'vertical') {
    return {
      x: 76,
      y: STACK_TOP - 8 + index * (GLOBAL_H + 18),
      width: GLOBAL_W,
      height: GLOBAL_H,
    }
  }
  const total = Math.max(1, count)
  const baseY = ROW_Y + (NODE_H - GLOBAL_H) / 2
  return {
    x: GLOBAL_X,
    y: baseY + (index - (total - 1) / 2) * (GLOBAL_H + 20),
    width: GLOBAL_W,
    height: GLOBAL_H,
  }
}

export function globalAnchor(cell: Rect): Point {
  return { x: cell.x + cell.width, y: cell.y + cell.height / 2 }
}

export function layoutGlobals(
  globals: VizGlobal[],
  nodes: VizNode[],
  layout: Map<number, Point>,
  orientation: VizOrientation,
  ring: RingGeometry | null = null,
): Map<string, GlobalCellPlacement> {
  const result = new Map<string, GlobalCellPlacement>()
  const row = nodes
    .filter((node) => node.lane === 'row')
    .slice()
    .sort((a, b) => a.slot - b.slot)
  const ordered = row.length > 0 ? row : nodes.slice().sort((a, b) => a.slot - b.slot)
  const firstPoint = ordered.length > 0 ? layout.get(ordered[0]!.id) : undefined
  const lastPoint =
    ordered.length > 0 ? layout.get(ordered[ordered.length - 1]!.id) : undefined

  if (nodes.length === 0) {
    const bounds = emptyBounds(orientation)
    const bandTop = orientation === 'horizontal' ? ROW_Y - 84 : STACK_TOP - 92
    const centerX = orientation === 'horizontal' ? bounds.x + bounds.width / 2 : STACK_X + NODE_W / 2
    const y = orientation === 'horizontal' ? bandTop - GLOBAL_H - 16 : bandTop + 18
    const rowGlobals =
      orientation === 'vertical'
        ? globals.filter((global) => global.placement === 'row')
        : []
    const centeredGlobals = globals.filter((global) => !rowGlobals.includes(global))
    const total =
      Math.max(1, centeredGlobals.length) * GLOBAL_W +
      Math.max(0, centeredGlobals.length - 1) * 16
    let x = centerX - total / 2
    for (const global of centeredGlobals) {
      result.set(global.name, {
        rect: { x, y, width: GLOBAL_W, height: GLOBAL_H },
        placement: 'top',
      })
      x += GLOBAL_W + 16
    }
    rowGlobals.forEach((global, index) => {
      result.set(global.name, {
        rect: {
          x: STACK_X + (NODE_W - GLOBAL_W) / 2,
          y: STACK_TOP - 8 + index * (GLOBAL_H + 18),
          width: GLOBAL_W,
          height: GLOBAL_H,
        },
        placement: 'row',
      })
    })
    return result
  }

  const rowGlobals =
    orientation === 'vertical' ? globals.filter((global) => global.placement === 'row') : []
  rowGlobals.forEach((global, index) => {
    result.set(global.name, {
      rect: {
        x: STACK_X + (NODE_W - GLOBAL_W) / 2,
        y: STACK_TOP - 8 + index * (GLOBAL_H + 18),
        width: GLOBAL_W,
        height: GLOBAL_H,
      },
      placement: 'row',
    })
  })
  const leftGlobals = globals.filter(
    (global) =>
      global.placement !== 'top' &&
      global.placement !== 'bottom' &&
      global.placement !== 'row',
  )
  leftGlobals.forEach((global, index) => {
    result.set(global.name, {
      rect: globalCellGeometry(index, leftGlobals.length, orientation),
      placement: 'left',
    })
  })

  for (const global of globals) {
    if (global.placement === 'top' && firstPoint) {
      result.set(global.name, {
        rect: {
          x:
            orientation === 'horizontal'
              ? ring
                ? firstPoint.x + (NODE_W - GLOBAL_W) / 2
                : firstPoint.x - GLOBAL_W - 12
              : firstPoint.x + (NODE_W - GLOBAL_W) / 2,
          y:
            orientation === 'horizontal'
              ? ring
                ? firstPoint.y - GLOBAL_H - 28
                : ROW_Y - 84 - GLOBAL_H - 14
              : firstPoint.y - GLOBAL_H - 28,
          width: GLOBAL_W,
          height: GLOBAL_H,
        },
        placement: 'top',
      })
    }
  }

  for (const global of globals) {
    if (global.placement === 'bottom' && lastPoint) {
      result.set(global.name, {
        rect: {
          x: lastPoint.x + (NODE_W - GLOBAL_W) / 2,
          y: lastPoint.y + NODE_H + 28,
          width: GLOBAL_W,
          height: GLOBAL_H,
        },
        placement: 'bottom',
      })
    }
  }

  for (const global of globals) {
    if (result.has(global.name)) continue
    const index = leftGlobals.length
    result.set(global.name, {
      rect: globalCellGeometry(index, Math.max(1, index + 1), orientation),
      placement: 'left',
    })
  }
  return result
}

export function nodeCenter(point: Point): Point {
  return { x: point.x + NODE_W / 2, y: point.y + NODE_H / 2 }
}

export function nodeLeft(point: Point): Point {
  return { x: point.x, y: point.y + NODE_H / 2 }
}

export function pointerAnchor(
  point: Point,
  _field: VizField,
  orientation: VizOrientation,
  flipped = false,
): Point {
  if (orientation === 'horizontal') {
    return {
      x: flipped ? point.x + FIELD_W / 2 : point.x + VALUE_W + FIELD_W / 2,
      y: point.y + NODE_H / 2,
    }
  }
  return {
    x: point.x + VALUE_W + FIELD_W / 2,
    y: point.y + NODE_H,
  }
}

export function fieldTarget(point: Point, _field: VizField, orientation: VizOrientation): Point {
  if (orientation === 'horizontal') {
    return nodeLeft(point)
  }
  const fieldX = point.x + VALUE_W + FIELD_W / 2
  return { x: fieldX, y: point.y }
}

function curve(start: Point, end: Point, lift: number): string {
  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2 - lift
  return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`
}

export function routeField(
  sourcePoint: Point,
  target: VizNode | null,
  targetPoint: Point | null,
  field: VizField,
  orientation: VizOrientation,
  sameLane: boolean,
  slotDelta: number,
  circular = false,
): { path: string; tail: Point; tip: Point; nullStub?: NullStub } {
  const tail = pointerAnchor(sourcePoint, field, orientation)
  if (!target || !targetPoint) {
    if (orientation === 'horizontal') {
      const end = { x: tail.x + NULL_STUB, y: tail.y }
      return {
        path: `M ${tail.x} ${tail.y} L ${end.x} ${end.y}`,
        tail,
        tip: end,
        nullStub: {
          start: tail,
          end,
          path: `M ${tail.x} ${tail.y} L ${end.x} ${end.y}`,
          label: { x: end.x + 20, y: end.y + 27 },
          orientation: 'horizontal',
        },
      }
    }
    const end = { x: tail.x, y: tail.y + NULL_DOWN }
    return {
      path: `M ${tail.x} ${tail.y} L ${end.x} ${end.y}`,
      tail,
      tip: end,
      nullStub: {
        start: tail,
        end,
        path: `M ${tail.x} ${tail.y} L ${end.x} ${end.y}`,
        label: { x: end.x, y: end.y + 27 },
        orientation: 'vertical',
      },
    }
  }

  // A circular list closes above the row: the last node points back to the
  // first, and a single node loops over itself. Both use a cubic arc so the
  // arrow lands on the target from above instead of crossing the nodes.
  if (circular && sameLane && orientation === 'horizontal' && slotDelta <= 0) {
    const self = slotDelta === 0
    const tip = self
      ? fieldTarget(targetPoint, field, orientation)
      : { x: targetPoint.x + NODE_W / 2, y: targetPoint.y }
    const lift = 180
    const spread = self ? 92 : 64
    return {
      path: `M ${tail.x} ${tail.y} C ${tail.x + spread} ${tail.y - lift}, ${tip.x - spread} ${tip.y - lift}, ${tip.x} ${tip.y}`,
      tail,
      tip,
    }
  }

  const tip = fieldTarget(targetPoint, field, orientation)
  if (sameLane && orientation === 'horizontal' && slotDelta === 1) {
    return { path: `M ${tail.x} ${tail.y} L ${tip.x} ${tip.y}`, tail, tip }
  }
  if (sameLane && orientation === 'vertical' && slotDelta === 1) {
    return { path: `M ${tail.x} ${tail.y} L ${tip.x} ${tip.y}`, tail, tip }
  }
  if (orientation === 'horizontal') {
    return { path: curve(tail, tip, 56), tail, tip }
  }
  const side = tip.x >= tail.x ? 1 : -1
  const midY = (tail.y + tip.y) / 2
  return {
    path: `M ${tail.x} ${tail.y} C ${tail.x + side * 52} ${midY}, ${tip.x + side * 52} ${midY}, ${tip.x} ${tip.y}`,
    tail,
    tip,
  }
}

export function exactNodeRect(point: Point): Rect {
  return { x: point.x, y: point.y, width: NODE_W, height: NODE_H }
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
  const t = enter >= 0 ? enter : exit
  if (!Number.isFinite(t)) return { ...from }
  return { x: from.x + dx * t, y: from.y + dy * t }
}

function normalizeAngle(angle: number): number {
  return ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
}

/**
 * Route a `suivant` arrow around the outside of the ring. Both endpoint
 * tangents leave/enter the cards from the ring side, so the arrow reads as a
 * segment of the circle instead of a chord crossing its middle.
 */
export function routeRingField(
  source: VizNode,
  target: VizNode | null,
  sourcePoint: Point,
  targetPoint: Point | null,
  field: VizField,
  ring: RingGeometry,
  sourceFlipped = false,
): { path: string; tail: Point; tip: Point; nullStub?: NullStub } {
  const tail = pointerAnchor(sourcePoint, field, 'horizontal', sourceFlipped)
  if (!target || !targetPoint) {
    const direction = sourceFlipped ? -1 : 1
    const end = { x: tail.x + direction * NULL_STUB, y: tail.y }
    return {
      path: `M ${tail.x} ${tail.y} L ${end.x} ${end.y}`,
      tail,
      tip: end,
      nullStub: {
        start: tail,
        end,
        path: `M ${tail.x} ${tail.y} L ${end.x} ${end.y}`,
        label: { x: end.x + direction * 20, y: end.y + 27 },
        labelAnchor: direction > 0 ? 'start' : 'end',
        orientation: 'horizontal',
      },
    }
  }

  // A single-node ring points to itself. Loop around the outside of the card
  // instead of above it, leaving the space above free for the `debut` cell.
  if (source.id === target.id || ring.count === 1) {
    const direction = sourceFlipped ? -1 : 1
    const borderX = sourceFlipped ? sourcePoint.x : sourcePoint.x + NODE_W
    const tip = { x: borderX - direction * 18, y: sourcePoint.y }
    const first = { x: tail.x + direction * 104, y: tail.y - 16 }
    const second = { x: tip.x + direction * 104, y: tip.y - 26 }
    return {
      path: `M ${tail.x} ${tail.y} C ${first.x} ${first.y}, ${second.x} ${second.y}, ${tip.x} ${tip.y}`,
      tail,
      tip,
    }
  }

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
  const clockwise = normalizeAngle(targetAngle - sourceAngle)
  let delta = clockwise > Math.PI ? clockwise - Math.PI * 2 : clockwise
  if (ring.count === 2) {
    // The two nodes are a vertical pair; pick the side of the source dot so
    // the two reciprocal links wrap around opposite sides of the ring.
    const tailRight = tail.x >= sourceCenter.x
    const plusMidpoint = sourceAngle + Math.PI / 2
    const plusRight = Math.cos(plusMidpoint) >= 0
    delta = tailRight === plusRight ? Math.PI : -Math.PI
  }
  const midpoint = sourceAngle + delta / 2
  const gap = {
    x:
      ring.cx +
      Math.cos(midpoint) * (ring.rx + NODE_W / 2 + RING_OUTER_PAD),
    y:
      ring.cy +
      Math.sin(midpoint) * (ring.ry + NODE_H / 2 + RING_OUTER_PAD),
  }
  const exit = borderPoint(sourceCenter, gap, exactNodeRect(sourcePoint))
  const entry = borderPoint(gap, targetCenter, exactNodeRect(targetPoint))
  const startControl = {
    x: exit.x + (gap.x - exit.x) * 0.55,
    y: exit.y + (gap.y - exit.y) * 0.55,
  }
  const endControl = {
    x: gap.x + (gap.x - entry.x) * 0.25,
    y: gap.y + (gap.y - entry.y) * 0.25,
  }
  return {
    path: `M ${tail.x} ${tail.y} C ${startControl.x} ${startControl.y}, ${endControl.x} ${endControl.y}, ${entry.x} ${entry.y}`,
    tail,
    tip: entry,
  }
}

export function routeGlobal(
  cell: Rect,
  target: VizNode | null,
  targetPoint: Point | null,
  index: number,
  orientation: VizOrientation,
  placement: GlobalPlacement = 'left',
): {
  path: string
  start: Point
  tip: Point
  nullStub?: NullStub
  marker: 'gold' | 'alert' | 'success'
} {
  if (placement === 'bottom' && target && targetPoint) {
    const start = { x: cell.x + cell.width / 2, y: cell.y }
    const tip = { x: targetPoint.x + NODE_W / 2, y: targetPoint.y + NODE_H }
    return {
      path: `M ${start.x} ${start.y} L ${tip.x} ${tip.y}`,
      start,
      tip,
      marker: 'gold',
    }
  }
  if (placement === 'top' && target && targetPoint) {
    const start = { x: cell.x + cell.width / 2, y: cell.y + cell.height }
    const tip = { x: targetPoint.x + NODE_W / 2, y: targetPoint.y }
    return {
      path: `M ${start.x} ${start.y} L ${tip.x} ${tip.y}`,
      start,
      tip,
      marker: 'gold',
    }
  }
  if (placement === 'top' || placement === 'bottom') {
    const start = { x: cell.x + cell.width / 2, y: cell.y + cell.height }
    const end = { x: start.x, y: start.y + 54 }
    return {
      path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
      start,
      tip: end,
      marker: 'gold',
      nullStub: {
        start,
        end,
        path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
        label: { x: end.x, y: end.y + 26 },
        orientation: 'vertical',
      },
    }
  }
  const start = globalAnchor(cell)
  if (!target || !targetPoint) {
    if (orientation === 'horizontal') {
      const end = { x: start.x + 54, y: start.y }
      return {
        path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
        start,
        tip: end,
        marker: 'gold',
        nullStub: {
          start,
          end,
          path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
          label: { x: end.x + 18, y: end.y + 26 },
          orientation: 'horizontal',
        },
      }
    }
    const end = { x: start.x, y: start.y + 54 }
    return {
      path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
      start,
      tip: end,
      marker: 'gold',
      nullStub: {
        start,
        end,
        path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
        label: { x: end.x, y: end.y + 26 },
        orientation: 'vertical',
      },
    }
  }

  const tip = nodeLeft(targetPoint)
  const below = index % 2 === 1
  const bend = orientation === 'vertical' ? 0 : below ? 64 : -44
  const midX = start.x + (tip.x - start.x) * 0.48
  const c1 = { x: midX, y: start.y + bend }
  const c2 = { x: midX, y: tip.y + bend }
  return {
    path: `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${tip.x} ${tip.y}`,
    start,
    tip,
    marker: 'gold',
  }
}

export function nodeRect(point: Point): Rect {
  return { x: point.x - 4, y: point.y - 28, width: NODE_W + 8, height: NODE_H + 42 }
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

export function emptyBounds(orientation: VizOrientation): Rect {
  return orientation === 'horizontal'
    ? { x: 90, y: 200, width: 720, height: 340 }
    : { x: 180, y: 40, width: 860, height: 320 }
}

export function contentBounds(
  nodes: VizNode[],
  globals: VizGlobal[],
  pins: VizPin[],
  orientation: VizOrientation,
  ring: RingGeometry | null = null,
): Rect {
  const layout = layoutNodes(nodes, orientation, ring ? 'ring' : 'row')
  const rects: Rect[] = [emptyBounds(orientation)]
  if (ring) rects.push(ringBand(ring).rect)
  for (const node of nodes) {
    const point = layout.get(node.id)
    if (!point) continue
    rects.push(nodeRect(point))
    if (node.pointer.kind === 'null') {
      if (orientation === 'horizontal') {
        if (ring) {
          rects.push({
            x: point.x - NULL_STUB - 26,
            y: point.y - 26,
            width: NODE_W + (NULL_STUB + 26) * 2,
            height: NODE_H + 52,
          })
        } else {
          rects.push({
            x: point.x + NODE_W,
            y: point.y + NODE_H / 2 - 22,
            width: NULL_STUB + 74,
            height: 62,
          })
        }
      } else {
        rects.push({
          x: point.x + VALUE_W - 18,
          y: point.y + NODE_H,
          width: FIELD_W + 44,
          height: NULL_DOWN + 58,
        })
      }
    }
  }
  for (const { rect: cell } of layoutGlobals(
    globals,
    nodes,
    layout,
    orientation,
    ring,
  ).values()) {
    rects.push({ x: cell.x - 8, y: cell.y - 26, width: cell.width + 16, height: cell.height + 70 })
  }
  for (const pin of pins) {
    const target =
      pin.value.kind === 'node' ? layout.get(pin.value.id) ?? null : null
    if (target) {
      if (ring) {
        rects.push({
          x: target.x - 170,
          y: target.y - 110,
          width: NODE_W + 340,
          height: NODE_H + 220,
        })
      } else {
        rects.push({ x: target.x - 110, y: target.y - 84, width: NODE_W + 220, height: NODE_H + 110 })
      }
    }
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
  return { k, x: width / 2 - centerX * k, y: height / 2 - centerY * k }
}

export function cameraAtOne(bbox: Rect, size: Size): Camera {
  const centerX = bbox.x + bbox.width / 2
  const centerY = bbox.y + bbox.height / 2
  return { k: 1, x: size.width / 2 - centerX, y: size.height / 2 - centerY }
}

export function worldPoint(camera: Camera, screen: Point): Point {
  return { x: (screen.x - camera.x) / camera.k, y: (screen.y - camera.y) / camera.k }
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
  return { k, x: cursor.x - anchor.x * k, y: cursor.y - anchor.y * k }
}

export function screenPoint(camera: Camera, world: Point): Point {
  return { x: world.x * camera.k + camera.x, y: world.y * camera.k + camera.y }
}
