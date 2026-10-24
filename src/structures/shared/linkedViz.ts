import type { BaseSnapshot, PointerValue } from '../../core/types'

export type VizOrientation = 'horizontal' | 'vertical'
export type VizField = 'suivant' | 'precedent'
export type VizLane = 'row' | 'heap'
export type GlobalPlacement = 'left' | 'top' | 'bottom'

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
  const firstPoint = row.length > 0 ? layout.get(row[0]!.id) : undefined
  const lastPoint = row.length > 0 ? layout.get(row[row.length - 1]!.id) : undefined

  if (row.length === 0) {
    const bounds = emptyBounds(orientation)
    const bandTop = orientation === 'horizontal' ? ROW_Y - 84 : STACK_TOP - 92
    const centerX = orientation === 'horizontal' ? bounds.x + bounds.width / 2 : STACK_X + NODE_W / 2
    const y = orientation === 'horizontal' ? bandTop - GLOBAL_H - 16 : bandTop + 18
    const total = Math.max(1, globals.length) * GLOBAL_W + Math.max(0, globals.length - 1) * 16
    let x = centerX - total / 2
    for (const global of globals) {
      result.set(global.name, {
        rect: { x, y, width: GLOBAL_W, height: GLOBAL_H },
        placement: 'top',
      })
      x += GLOBAL_W + 16
    }
    return result
  }

  const leftGlobals = globals.filter(
    (global) => global.placement !== 'top' && global.placement !== 'bottom',
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
): Rect {
  const layout = layoutNodes(nodes, orientation)
  const rects: Rect[] = [emptyBounds(orientation)]
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
  for (const pin of pins) {
    const target =
      pin.value.kind === 'node' ? layout.get(pin.value.id) ?? null : null
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
