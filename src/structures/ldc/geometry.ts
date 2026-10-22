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
export const EMPTY_ROW_Y = 300
export const HEAP_Y = 92
export const SUIVANT_LANE = 0.38
export const PRECEDENT_LANE = 0.72
export const NULL_STUB = 64
export const FIT_PADDING = 56
export const MIN_AUTO_K = 0.25
export const MAX_AUTO_K = 1.3
export const MIN_K = 0.25
export const MAX_K = 4
export const PIN_TAG_H = 24
export const PIN_GAP = 8
export const PIN_MAX_FAN = NODE_W + 44
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
export const DEBUT_CELL_GAP = 36
export const DEBUT_DOT_X = DEBUT_CELL_W / 2
export const DEBUT_DOT_Y = DEBUT_CELL_H

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function layoutNodes(nodes: LdcNode[]): Map<number, Point> {
  const layout = new Map<number, Point>()
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

export function pointerAnchor(_node: LdcNode, point: Point, field: PointerField): Point {
  return {
    x: field === 'suivant' ? point.x + NODE_W - CELL_W / 2 : point.x + CELL_W / 2,
    y: laneY(point, field),
  }
}

export interface DebutCellGeometry {
  cell: Rect
  dot: Point
  label: Point
}

export function debutCellGeometry(nodes: LdcNode[]): DebutCellGeometry {
  const row = nodes
    .filter((node) => !node.freed && node.lane === 'row')
    .slice()
    .sort((a, b) => a.slot - b.slot)
  const first = row[0]
  const rowX = first ? PAD_L + first.slot * SLIDE : PAD_L
  const hasHeap = nodes.some((node) => !node.freed && node.lane === 'heap')
  const rowY = first || hasHeap ? ROW_Y : EMPTY_ROW_Y
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

export function debutCellBounds(nodes: LdcNode[]): Rect {
  const geometry = debutCellGeometry(nodes)
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

export interface NullStubGeometry {
  start: Point
  end: Point
  direction: 1 | -1
  path: string
  label: { x: number; y: number; anchor: 'start' | 'end' }
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

export function nullStubGeometry(
  node: LdcNode,
  field: PointerField,
  point: Point,
): NullStubGeometry {
  return makeNullStub(pointerAnchor(node, point, field), field === 'suivant' ? 1 : -1)
}

export function emptyNullStubGeometry(): NullStubGeometry {
  return makeNullStub(
    { x: EMPTY_NULL_X, y: EMPTY_ROW_Y + NODE_H * SUIVANT_LANE },
    1,
  )
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

export function routeArrow(
  source: LdcNode,
  field: PointerField,
  target: LdcNode | null,
  layout: Map<number, Point>,
): ArrowRoute | null {
  const sourcePoint = layout.get(source.id)
  if (!sourcePoint) return null
  const tail = pointerAnchor(source, sourcePoint, field)

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
): ArrowRoute | null {
  if (value.kind === 'uninit') return null
  const geometry = debutCellGeometry(nodes)
  if (value.kind === 'null') {
    const stub = makeNullStub(geometry.dot, 1)
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
  const targetPoint = layoutNodes(nodes).get(target.id)
  if (!targetPoint) return null
  const tip = { x: geometry.dot.x, y: targetPoint.y }
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

export function layoutPins(pins: PinInput[], nodes: LdcNode[]): PinPlacement[] {
  if (pins.length === 0) return []
  const layout = layoutNodes(nodes)
  const anchor = nullAnchor(nodes, layout)
  const groups = new Map<string, PinInput[]>()
  for (const pin of pins) {
    const key = pin.target === 'node' ? `node:${pin.targetId ?? ''}` : pin.target
    const group = groups.get(key) ?? []
    group.push(pin)
    groups.set(key, group)
  }

  const placements: PinPlacement[] = []

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
      const centers =
        rowIndex === 0
          ? rowCenters[rowIndex]!
          : avoidTagCorridors(rowCenters[rowIndex]!, lowerTags, minX, maxX)
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
        if (pin.target === 'node') {
          to = { x: center, y: targetPoint!.y + 1 }
        } else if (pin.target === 'null') {
          to = anchor
        }
        placements.push({ pin, tag, from, to })
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
): Rect {
  const layout = layoutNodes(nodes)
  const rects: Rect[] = []
  const debutGeometry = debutCellGeometry(nodes)
  rects.push(debutGeometry.cell)
  rects.push({
    x: debutGeometry.label.x - 70,
    y: debutGeometry.label.y - 14,
    width: 140,
    height: 20,
  })
  const debutArrow = debutRoute(nodes, debut)
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
      const route = routeArrow(node, field, target, layout)
      if (route) rects.push(route.bounds)
    }
  }

  for (const placement of layoutPins(pins, nodes)) {
    rects.push(placement.tag)
    if (placement.to) {
      rects.push(boundsOfPoints([placement.from, placement.to], 1))
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
