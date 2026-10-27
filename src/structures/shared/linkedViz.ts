import type { BaseSnapshot, PointerValue } from '../../core/types'

export type VizOrientation = 'horizontal' | 'vertical'
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

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function layoutNodes(nodes: VizNode[], orientation: VizOrientation): Map<number, Point> {
  const layout = new Map<number, Point>()
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
              ? firstPoint.x - GLOBAL_W - 12
              : firstPoint.x + (NODE_W - GLOBAL_W) / 2,
          y:
            orientation === 'horizontal'
              ? ROW_Y - 84 - GLOBAL_H - 14
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
): Point {
  if (orientation === 'horizontal') {
    return { x: point.x + NODE_W, y: point.y + NODE_H / 2 }
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
  pinAnchor: 'center' | 'right' = 'center',
  includeEmpty = true,
  tightPins = false,
): Rect {
  const layout = layoutNodes(nodes, orientation)
  const rects: Rect[] =
    nodes.length === 0 || includeEmpty ? [emptyBounds(orientation)] : []
  for (const node of nodes) {
    const point = layout.get(node.id)
    if (!point) continue
    rects.push(nodeRect(point))
    if (node.pointer.kind === 'null') {
      if (orientation === 'horizontal') {
        rects.push({
          x: point.x + NODE_W,
          y: point.y + NODE_H / 2 - 22,
          width: NULL_STUB + 74,
          height: 62,
        })
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
  for (const { rect: cell } of layoutGlobals(globals, nodes, layout, orientation).values()) {
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
      rects.push({ x: target.x - 110, y: target.y - 84, width: NODE_W + 220, height: NODE_H + 110 })
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
