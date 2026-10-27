import type { BaseSnapshot, PointerValue } from '../../core/types'

export type VizOrientation = 'horizontal' | 'vertical'
export type VizLayoutMode = 'row' | 'ring'
export type VizField = 'suivant' | 'precedent'
export type VizLane = 'row' | 'heap'
export type GlobalPlacement = 'left' | 'top' | 'top-center' | 'bottom' | 'row'

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
  pinAnchor?: 'center' | 'right'
  fitContent?: boolean
  fitPadding?: number
  adaptiveLabels?: boolean
  directionalMotion?: boolean
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

export interface PinPlacement {
  pin: VizPin
  tag: Rect
  from: Point
  to: Point | null
  dangling: boolean
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
export const STACK_TOP = 180
export const STACK_SLIDE = 120
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
/** Extra room reserved outside the ring band for outward arcs and self-loops. */
export const RING_ROUTE_PAD = 72
/** How far an outward arc runs beyond the outermost card edge. */
export const RING_ARC_OFFSET = 72
/** Corner radius of the rounded outward arcs. */
export const RING_ARC_RADIUS = 40
/** Size of the rectangular self-loop outside a single node. */
export const RING_SELF_LOOP_OUT = 44
export const RING_SELF_LOOP_TOP = 34

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

/** Top-left corner of the card at a given ring slot. */
function ringNodePoint(ring: RingGeometry, index: number): Point {
  const angle =
    ring.count === 1
      ? 0
      : ring.startAngle + (index * Math.PI * 2) / ring.count
  return {
    x: ring.cx + Math.cos(angle) * ring.rx - NODE_W / 2,
    y: ring.cy + Math.sin(angle) * ring.ry - NODE_H / 2,
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

function ringOutwardFlip(point: Point, ring: RingGeometry): boolean {
  const center = nodeCenter(point)
  const dx = center.x - ring.cx
  if (Math.abs(dx) > 0.5) return dx < 0
  return center.y > ring.cy + 0.5
}

/**
 * Pick the field side that shortens the straight link to `targetPoint`.
 * Symmetric cases fall back to the outward rule so reciprocal links still
 * leave on opposite sides of the ring.
 */
function ringShortestFlip(
  point: Point,
  ring: RingGeometry,
  targetPoint: Point,
): boolean {
  const targetRect: Rect = {
    x: targetPoint.x,
    y: targetPoint.y,
    width: NODE_W,
    height: NODE_H,
  }
  const left = pointerAnchor(point, 'suivant', 'horizontal', true)
  const right = pointerAnchor(point, 'suivant', 'horizontal', false)
  const leftTip = closestBorderPoint(left, targetRect)
  const rightTip = closestBorderPoint(right, targetRect)
  const leftLength = Math.hypot(leftTip.x - left.x, leftTip.y - left.y)
  const rightLength = Math.hypot(rightTip.x - right.x, rightTip.y - right.y)
  if (Math.abs(leftLength - rightLength) < 0.5) {
    return ringOutwardFlip(point, ring)
  }
  return leftLength < rightLength
}

/**
 * Ring nodes keep their cards axis-aligned and mirror only the `suivant`
 * field. Small rings use a fixed side pattern so their drawings stay stable:
 * two nodes face each other, three form a triangle and four form a rectangle.
 * Larger rings choose, per node, the side that shortens the link to its
 * successor while keeping the dot on the target side.
 */
export function isRingNodeFlipped(
  point: Point,
  ring: RingGeometry | null,
  targetPoint: Point | null = null,
): boolean {
  if (!ring) return false
  if (ring.count === 1) return false
  const index = ringStepIndex(point, ring)
  if (ring.count === 2) return index >= 1
  if (ring.count === 3) return index >= 1
  if (ring.count === 4) return index >= 2
  if (targetPoint) return ringShortestFlip(point, ring, targetPoint)
  return ringOutwardFlip(point, ring)
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
        layout.set(node.id, ringNodePoint(ring, index))
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

export function pinWidth(name: string, wide = false): number {
  return wide
    ? Math.max(64, name.length * 11 + 24)
    : Math.max(46, name.length * 8 + 20)
}

export function layoutPins(
  pins: VizPin[],
  nodes: VizNode[],
  layout: Map<number, Point>,
  orientation: VizOrientation,
  pinAnchor: 'center' | 'right' = 'center',
): PinPlacement[] {
  const placements: PinPlacement[] = []
  const groups = new Map<number, VizPin[]>()
  const nullPins: VizPin[] = []
  for (const pin of pins) {
    if (pin.value.kind !== 'node') {
      nullPins.push(pin)
      continue
    }
    const list = groups.get(pin.value.id) ?? []
    list.push(pin)
    groups.set(pin.value.id, list)
  }

  for (const [nodeId, group] of groups) {
    const point = layout.get(nodeId)
    const node = nodes.find((candidate) => candidate.id === nodeId)
    if (!point || !node) continue
    const widths = group.map((pin) => pinWidth(pin.name, pinAnchor === 'right'))
    const total = widths.reduce((sum, width) => sum + width + 8, -8)
    let x = point.x + NODE_W / 2 - total / 2
    const side: 'center' | 'right' | 'left' =
      orientation === 'horizontal' && pinAnchor === 'right'
        ? group.some((pin) => pin.name.startsWith('ancien'))
          ? 'left'
          : 'right'
        : 'center'
    const baseY =
      orientation === 'horizontal'
        ? point.y - (side === 'center' ? 38 : 58) - (group.length - 1) * 28
        : point.y + 10
    group.forEach((pin, index) => {
      const width = widths[index] ?? 52
      const tag: Rect =
        orientation === 'horizontal'
          ? {
              x:
                side === 'right'
                  ? point.x + NODE_W + 12
                  : side === 'left'
                    ? point.x - width - 12
                    : x,
              y: baseY + index * 30,
              width,
              height: 24,
            }
          : { x: point.x + NODE_W + 18, y: baseY + index * 30, width, height: 24 }
      placements.push({
        pin,
        tag,
        from:
          orientation === 'horizontal'
            ? side === 'right'
              ? { x: tag.x, y: tag.y + tag.height / 2 }
              : side === 'left'
                ? { x: tag.x + width, y: tag.y + tag.height / 2 }
                : { x: tag.x + width / 2, y: tag.y + tag.height }
            : { x: tag.x, y: tag.y + tag.height / 2 },
        to:
          orientation === 'horizontal'
            ? side === 'right'
              ? { x: point.x + NODE_W, y: point.y + 12 }
              : side === 'left'
                ? { x: point.x, y: point.y + 12 }
                : { x: point.x + NODE_W / 2, y: point.y }
            : { x: point.x + NODE_W, y: point.y + NODE_H / 2 },
        dangling: node.freed,
      })
      x += width + 8
    })
  }

  const row = nodes
    .filter((node) => node.lane === 'row')
    .slice()
    .sort((a, b) => a.slot - b.slot)
  const lastPoint = row.length > 0 ? layout.get(row[row.length - 1]!.id) : undefined
  nullPins.forEach((pin, index) => {
    const width = pinWidth(pin.name, pinAnchor === 'right')
    const point = lastPoint
    const tag: Rect =
      orientation === 'horizontal'
        ? {
            x: (point ? point.x + NODE_W + 70 : PAD_L) + index * 8,
            y: (point ? point.y : ROW_Y) - 44 - index * 28,
            width,
            height: 24,
          }
        : {
            x: (point ? point.x + NODE_W + 18 : STACK_X + NODE_W + 18) + index * 8,
            y: (point ? point.y + NODE_H + 24 : STACK_TOP) + index * 28,
            width,
            height: 24,
          }
    placements.push({
      pin,
      tag,
      from: { x: tag.x + width / 2, y: tag.y + tag.height / 2 },
      to: null,
      dangling: false,
    })
  })

  return placements
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
  const rowFirstPoint = row.length > 0 ? layout.get(row[0]!.id) : undefined
  const rowLastPoint = row.length > 0 ? layout.get(row[row.length - 1]!.id) : undefined
  const firstPoint =
    rowFirstPoint ?? (ordered.length > 0 ? layout.get(ordered[0]!.id) : undefined)

  if (nodes.length === 0) {
    const bounds = emptyBounds(orientation)
    const bandTop = orientation === 'horizontal' ? ROW_Y - 84 : STACK_TOP - 92
    const centerX = orientation === 'horizontal' ? bounds.x + bounds.width / 2 : STACK_X + NODE_W / 2
    const rowGlobals =
      orientation === 'vertical'
        ? globals.filter((global) => global.placement === 'row')
        : []

    if (orientation === 'horizontal') {
      const topGlobals = globals.filter((global) => global.placement !== 'row')
      const total =
        Math.max(1, topGlobals.length) * GLOBAL_W +
        Math.max(0, topGlobals.length - 1) * 16
      let x = centerX - total / 2
      for (const global of topGlobals) {
        result.set(global.name, {
          rect: { x, y: bandTop - GLOBAL_H - 16, width: GLOBAL_W, height: GLOBAL_H },
          placement: global.placement === 'top-center' ? 'top-center' : 'top',
        })
        x += GLOBAL_W + 16
      }
      return result
    }

    const centeredGlobals = globals.filter((global) => !rowGlobals.includes(global))
    const total =
      Math.max(1, centeredGlobals.length) * GLOBAL_W +
      Math.max(0, centeredGlobals.length - 1) * 16
    let x = centerX - total / 2
    for (const global of centeredGlobals) {
      result.set(global.name, {
        rect: { x, y: bandTop + 18, width: GLOBAL_W, height: GLOBAL_H },
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
      global.placement !== 'top-center' &&
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
    if (global.placement !== 'top-center') continue
    const targetPoint =
      global.value.kind === 'node' ? layout.get(global.value.id) : undefined
    const point = targetPoint ?? (global.value.kind === 'null' ? undefined : firstPoint)
    if (point) {
      result.set(global.name, {
        rect: {
          x: point.x + (NODE_W - GLOBAL_W) / 2,
          y: point.y - GLOBAL_H - 28,
          width: GLOBAL_W,
          height: GLOBAL_H,
        },
        placement: 'top-center',
      })
    } else if (orientation === 'horizontal') {
      const bounds = emptyBounds(orientation)
      const heapBottom = nodes
        .filter((node) => node.lane === 'heap')
        .reduce((max, node) => {
          const point = layout.get(node.id)
          return point ? Math.max(max, point.y + NODE_H) : max
        }, Number.NEGATIVE_INFINITY)
      const emptyTop = ROW_Y - 84 - GLOBAL_H - 16
      const y = Number.isFinite(heapBottom)
        ? Math.max(emptyTop, heapBottom + 28)
        : emptyTop
      result.set(global.name, {
        rect: {
          x: bounds.x + bounds.width / 2 - GLOBAL_W / 2,
          y,
          width: GLOBAL_W,
          height: GLOBAL_H,
        },
        placement: 'top-center',
      })
    }
  }

  for (const global of globals) {
    if (global.placement !== 'bottom') continue
    const targetPoint =
      global.value.kind === 'node' ? layout.get(global.value.id) : undefined
    const point = targetPoint ?? rowLastPoint
    if (point) {
      result.set(global.name, {
        rect: {
          x: point.x + (NODE_W - GLOBAL_W) / 2,
          y: point.y + NODE_H + 28,
          width: GLOBAL_W,
          height: GLOBAL_H,
        },
        placement: 'bottom',
      })
    } else if (orientation === 'horizontal') {
      const bounds = emptyBounds(orientation)
      result.set(global.name, {
        rect: {
          x: bounds.x + bounds.width / 2 - GLOBAL_W / 2,
          y: ROW_Y + NODE_H + 28,
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
  orthogonal = false,
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
    if (!orthogonal) return { path: curve(tail, tip, 56), tail, tip }
    const right = tip.x >= tail.x
    if (target.lane === 'heap' && Math.abs(tip.y - tail.y) > 1) {
      const sideX = right ? tail.x + 24 : tail.x - 24
      return {
        path: `M ${tail.x} ${tail.y} L ${sideX} ${tail.y} L ${sideX} ${tip.y} L ${tip.x} ${tip.y}`,
        tail,
        tip,
      }
    }
    const railY = right
      ? Math.max(tail.y, tip.y) + NODE_H / 2 + 28
      : Math.min(tail.y, tip.y) - NODE_H / 2 - 28
    const sideX = tail.x + (right ? 26 : -26)
    const approachX = tip.x + (right ? -26 : 26)
    return {
      path: `M ${tail.x} ${tail.y} L ${sideX} ${tail.y} L ${sideX} ${railY} L ${approachX} ${railY} L ${approachX} ${tip.y} L ${tip.x} ${tip.y}`,
      tail,
      tip,
    }
  }
  if (!orthogonal) {
    const side = tip.x >= tail.x ? 1 : -1
    const midY = (tail.y + tip.y) / 2
    return {
      path: `M ${tail.x} ${tail.y} C ${tail.x + side * 52} ${midY}, ${tip.x + side * 52} ${midY}, ${tip.x} ${tip.y}`,
      tail,
      tip,
    }
  }
  const sideX =
    tip.y >= tail.y ? sourcePoint.x + NODE_W + 24 : sourcePoint.x - 24
  return {
    path: `M ${tail.x} ${tail.y} L ${sideX} ${tail.y} L ${sideX} ${tip.y} L ${tip.x} ${tip.y}`,
    tail,
    tip,
  }
}

function normalizeAngle(angle: number): number {
  return ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
}

/**
 * Simplify consecutive duplicate or collinear orthogonal points.
 */
export function simplifyPoints(points: Point[]): Point[] {
  const result: Point[] = []
  for (const point of points) {
    if (result.length === 0) {
      result.push(point)
      continue
    }
    const last = result[result.length - 1]!
    if (Math.abs(point.x - last.x) < 1e-4 && Math.abs(point.y - last.y) < 1e-4) {
      continue
    }
    if (result.length >= 2) {
      const prev = result[result.length - 2]!
      const dx1 = last.x - prev.x
      const dy1 = last.y - prev.y
      const dx2 = point.x - last.x
      const dy2 = point.y - last.y
      const cross = dx1 * dy2 - dy1 * dx2
      const dot = dx1 * dx2 + dy1 * dy2
      if (Math.abs(cross) < 1e-4 && dot > 0) {
        result[result.length - 1] = point
        continue
      }
    }
    result.push(point)
  }
  return result
}

/**
 * Turns a list of waypoints into an SVG path with smooth, rounded corners.
 */
export function roundedPath(points: Point[], radius = 16): string {
  const compact = simplifyPoints(points)
  if (compact.length < 2) return ''
  if (compact.length === 2 || radius <= 0) {
    return compact
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')
  }

  const first = compact[0]!
  const parts = [`M ${first.x} ${first.y}`]
  for (let index = 1; index < compact.length - 1; index += 1) {
    const previous = compact[index - 1]!
    const current = compact[index]!
    const next = compact[index + 1]!
    const inDx = current.x - previous.x
    const inDy = current.y - previous.y
    const inLength = Math.hypot(inDx, inDy)
    const outDx = next.x - current.x
    const outDy = next.y - current.y
    const outLength = Math.hypot(outDx, outDy)

    if (inLength < 1e-4 || outLength < 1e-4) continue

    const bend = Math.min(radius, inLength / 2, outLength / 2)
    const before = {
      x: current.x - (inDx * bend) / inLength,
      y: current.y - (inDy * bend) / inLength,
    }
    const after = {
      x: current.x + (outDx * bend) / outLength,
      y: current.y + (outDy * bend) / outLength,
    }
    parts.push(`L ${before.x} ${before.y}`)
    parts.push(`Q ${current.x} ${current.y} ${after.x} ${after.y}`)
  }
  const last = compact[compact.length - 1]!
  parts.push(`L ${last.x} ${last.y}`)
  return parts.join(' ')
}

export function orthogonalPath(points: Point[]): string {
  return roundedPath(points, 0)
}

function ringStepIndex(point: Point, ring: RingGeometry): number {
  if (ring.step <= 0) return 0
  const center = nodeCenter(point)
  const angle = Math.atan2(center.y - ring.cy, center.x - ring.cx)
  return (
    Math.round(normalizeAngle(angle - ring.startAngle) / ring.step) %
    ring.count
  )
}

function cardRect(point: Point): Rect {
  return { x: point.x, y: point.y, width: NODE_W, height: NODE_H }
}

function samePoint(first: Point, second: Point): boolean {
  return (
    Math.abs(first.x - second.x) < 0.5 && Math.abs(first.y - second.y) < 0.5
  )
}

/**
 * Closest point on a card border. The arrowhead therefore lands on the side
 * of the target that faces the source dot.
 */
function closestBorderPoint(from: Point, rect: Rect): Point {
  const left = rect.x
  const right = rect.x + rect.width
  const top = rect.y
  const bottom = rect.y + rect.height
  const inside =
    from.x > left && from.x < right && from.y > top && from.y < bottom
  if (inside) {
    const candidates = [
      { distance: from.x - left, point: { x: left, y: from.y } },
      { distance: right - from.x, point: { x: right, y: from.y } },
      { distance: from.y - top, point: { x: from.x, y: top } },
      { distance: bottom - from.y, point: { x: from.x, y: bottom } },
    ]
    candidates.sort((first, second) => first.distance - second.distance)
    return candidates[0]!.point
  }
  return {
    x: clamp(from.x, left, right),
    y: clamp(from.y, top, bottom),
  }
}

/** Liang-Barsky clip: does the segment enter the inside of the card? */
function segmentCrossesRect(
  start: Point,
  end: Point,
  rect: Rect,
  inset = 1,
): boolean {
  const left = rect.x + inset
  const right = rect.x + rect.width - inset
  const top = rect.y + inset
  const bottom = rect.y + rect.height - inset
  if (right <= left || bottom <= top) return false
  const dx = end.x - start.x
  const dy = end.y - start.y
  let enter = 0
  let exit = 1
  const clip = (p: number, q: number): boolean => {
    if (Math.abs(p) < 1e-9) return q >= 0
    const ratio = q / p
    if (p < 0) {
      if (ratio > exit) return false
      if (ratio > enter) enter = ratio
    } else {
      if (ratio < enter) return false
      if (ratio < exit) exit = ratio
    }
    return true
  }
  return (
    clip(-dx, start.x - left) &&
    clip(dx, right - start.x) &&
    clip(-dy, start.y - top) &&
    clip(dy, bottom - start.y)
  )
}

/** Does a straight link pass through a ring card other than its endpoints? */
function crossesForeignRingNode(
  ring: RingGeometry,
  sourcePoint: Point,
  targetPoint: Point,
  start: Point,
  end: Point,
): boolean {
  for (let index = 0; index < ring.count; index += 1) {
    const point = ringNodePoint(ring, index)
    if (samePoint(point, sourcePoint) || samePoint(point, targetPoint)) {
      continue
    }
    if (segmentCrossesRect(start, end, cardRect(point))) return true
  }
  return false
}

function routeRingStraight(
  tail: Point,
  targetPoint: Point,
): { path: string; tail: Point; tip: Point } {
  const tip = closestBorderPoint(tail, cardRect(targetPoint))
  return { path: `M ${tail.x} ${tail.y} L ${tip.x} ${tip.y}`, tail, tip }
}

/**
 * Rounded outer arc: leave the source towards the nearest outside lane, run
 * along it, then enter the target border from the outside. Used for the two
 * opposite sides of a two-node ring and the two slanted sides of a triangle.
 */
function routeRingArc(
  tail: Point,
  sourcePoint: Point,
  targetPoint: Point,
  side: 'left' | 'right',
): { path: string; tail: Point; tip: Point } {
  const sourceRect = cardRect(sourcePoint)
  const targetRect = cardRect(targetPoint)
  const laneX =
    side === 'right'
      ? Math.max(
          sourceRect.x + sourceRect.width,
          targetRect.x + targetRect.width,
        ) + RING_ARC_OFFSET
      : Math.min(sourceRect.x, targetRect.x) - RING_ARC_OFFSET
  const targetCenter = nodeCenter(targetPoint)
  const tip = {
    x: side === 'right' ? targetRect.x + targetRect.width : targetRect.x,
    y: targetCenter.y,
  }
  return {
    path: roundedPath(
      [tail, { x: laneX, y: tail.y }, { x: laneX, y: tip.y }, tip],
      RING_ARC_RADIUS,
    ),
    tail,
    tip,
  }
}

/**
 * Route a `suivant` arrow. Small rings follow the reference drawings:
 * a self-loop for one node, two opposite outer arcs for two nodes, a short
 * bottom link plus two outer arcs for three nodes, and four straight
 * rectangle sides for four nodes. Larger rings use straight dot-to-border
 * links and only fall back to an outer arc when a card blocks the way.
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
    const outX = borderX + direction * RING_SELF_LOOP_OUT
    const topY = sourcePoint.y - RING_SELF_LOOP_TOP
    return {
      path: roundedPath(
        [
          tail,
          { x: outX, y: tail.y },
          { x: outX, y: topY },
          { x: tip.x, y: topY },
          tip,
        ],
        14,
      ),
      tail,
      tip,
    }
  }

  const side = sourceFlipped ? 'left' : 'right'
  if (ring.count === 2) {
    return routeRingArc(tail, sourcePoint, targetPoint, side)
  }
  if (ring.count === 3) {
    const sourceCenter = nodeCenter(sourcePoint)
    const targetCenter = nodeCenter(targetPoint)
    if (Math.abs(sourceCenter.y - targetCenter.y) <= NODE_H / 2) {
      return routeRingStraight(tail, targetPoint)
    }
    return routeRingArc(tail, sourcePoint, targetPoint, side)
  }

  const straight = routeRingStraight(tail, targetPoint)
  if (
    !crossesForeignRingNode(ring, sourcePoint, targetPoint, tail, straight.tip)
  ) {
    return straight
  }
  return routeRingArc(tail, sourcePoint, targetPoint, side)
}

export function routeGlobal(
  cell: Rect,
  target: VizNode | null,
  targetPoint: Point | null,
  _index: number,
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
  if ((placement === 'top' || placement === 'top-center') && target && targetPoint) {
    const start = { x: cell.x + cell.width / 2, y: cell.y + cell.height }
    const tip = { x: targetPoint.x + NODE_W / 2, y: targetPoint.y }
    return {
      path: `M ${start.x} ${start.y} L ${tip.x} ${tip.y}`,
      start,
      tip,
      marker: 'gold',
    }
  }
  if (placement === 'bottom') {
    const start = { x: cell.x + cell.width, y: cell.y + cell.height / 2 }
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
  if (placement === 'top' || placement === 'top-center') {
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
  const right = tip.x >= start.x
  const elbowX = right ? tip.x - 28 : tip.x + 28
  return {
    path: `M ${start.x} ${start.y} L ${elbowX} ${start.y} L ${elbowX} ${tip.y} L ${tip.x} ${tip.y}`,
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
  pinAnchor: 'center' | 'right' = 'center',
  includeEmpty = true,
  tightPins = false,
): Rect {
  const layout = layoutNodes(nodes, orientation, ring ? 'ring' : 'row')
  const rects: Rect[] =
    nodes.length === 0 || includeEmpty ? [emptyBounds(orientation)] : []
  if (ring) {
    const band = ringBand(ring).rect
    rects.push({
      x: band.x - RING_ROUTE_PAD,
      y: band.y - RING_ROUTE_PAD,
      width: band.width + RING_ROUTE_PAD * 2,
      height: band.height + RING_ROUTE_PAD * 2,
    })
  }
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
  for (const placement of layoutPins(pins, nodes, layout, orientation, pinAnchor)) {
    if (tightPins) {
      const tag = placement.tag
      rects.push({ x: tag.x - 4, y: tag.y - 4, width: tag.width + 8, height: tag.height + 8 })
      continue
    }
    const target =
      placement.pin.value.kind === 'node' ? layout.get(placement.pin.value.id) ?? null : null
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
