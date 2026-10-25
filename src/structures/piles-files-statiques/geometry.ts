import { occupiedIndices, readGlobalInt, tryReadGlobalInt } from './memory'
import type { ArraySnapshot, ArrayTape } from './memory'
import { ringGeometry } from './ringGeometry'

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

/** Optional asymmetric margins, e.g. to keep a floating banner off the array. */
export interface FitInsets {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

export interface Camera {
  x: number
  y: number
  k: number
}

export const CELL_W = 92
export const CELL_H = 92
export const CELL_GAP = 14
export const ARRAY_X = 88
export const ARRAY_Y = 250
export const ROW_W = 5 * CELL_W + 4 * CELL_GAP
export const INDEX_Y = ARRAY_Y + CELL_H + 18
export const MARKER_ROW_Y = ARRAY_Y - 52
export const TAG_H = 30
export const TAPE_Y = ARRAY_Y + CELL_H + 104
export const TAPE_BOX_W = 38
export const TAPE_BOX_H = 44
export const TAPE_GAP = 8
export const FIT_PADDING = 48
export const MIN_AUTO_K = 0.3
export const MAX_AUTO_K = 1.45
export const MIN_K = 0.25
export const MAX_K = 4
export const CAMERA_ANIMATION = 250

export type MarkerTone = 'gold' | 'success' | 'alert' | 'ink'

export interface MarkerGeometry {
  name: string
  text: string
  tone: MarkerTone
  tag: Rect
  tip: Point
  dashed: boolean
}

export interface FifoGeometry {
  path: string
  label: Point
  bounds: Rect
}

export interface WrapGeometry {
  path: string
  label: Point
  bounds: Rect
}

export interface TapeBox {
  index: number
  char: string
  rect: Rect
  current: boolean
  passed: boolean
}

export interface TapeGeometry {
  label: Point
  status: Point
  boxes: TapeBox[]
  total: number
  bounds: Rect
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function arrayWidth(capacity = 5): number {
  return capacity * CELL_W + (capacity - 1) * CELL_GAP
}

export function cellRect(index: number): Rect {
  return {
    x: ARRAY_X + index * (CELL_W + CELL_GAP),
    y: ARRAY_Y,
    width: CELL_W,
    height: CELL_H,
  }
}

export function cellCenter(index: number): Point {
  const rect = cellRect(index)
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
}

export function tagWidth(text: string): number {
  return Math.max(58, Math.ceil(text.length * 7.8) + 22)
}

function marker(
  name: string,
  text: string,
  tagX: number,
  tip: Point,
  tone: MarkerTone,
  dashed: boolean,
): MarkerGeometry {
  const width = tagWidth(text)
  return {
    name,
    text,
    tone,
    dashed,
    tag: { x: tagX - width / 2, y: MARKER_ROW_Y, width, height: TAG_H },
    tip,
  }
}

/** `sommet` points at the top of the top cell, or just before the array at -1. */
export function stackMarker(snapshot: ArraySnapshot): MarkerGeometry {
  const sommet = readGlobalInt(snapshot, 'sommet')
  const index = sommet < 0 ? 0 : Math.min(sommet, snapshot.capacity - 1)
  const x =
    sommet < 0
      ? cellRect(0).x + CELL_W * 0.3
      : cellCenter(index).x
  return marker(
    'sommet',
    `sommet = ${sommet}`,
    x,
    { x, y: ARRAY_Y - 3 },
    'gold',
    sommet < 0,
  )
}

/** For File 2, `ar` is a count, so the marker sits on a cell boundary. */
export function boundaryX(count: number, capacity: number): number {
  if (count <= 0) return ARRAY_X - 3
  if (count >= capacity) return ARRAY_X + arrayWidth(capacity) + 3
  return cellRect(count).x - CELL_GAP / 2
}

export function queueMarkers(snapshot: ArraySnapshot): MarkerGeometry[] {
  if (snapshot.profile === 'file-decalage') {
    const ar = readGlobalInt(snapshot, 'ar')
    const x = boundaryX(ar, snapshot.capacity)
    return [
      marker('ar', `ar = ${ar}`, x, { x, y: ARRAY_Y - 3 }, 'success', ar === 0),
    ]
  }

  const av = tryReadGlobalInt(snapshot, 'av') ?? -1
  const ar = tryReadGlobalInt(snapshot, 'ar') ?? -1
  const result: MarkerGeometry[] = []

  if (av < 0 && ar < 0) {
    const first = cellRect(0)
    result.push(
      marker(
        'av',
        `av = ${av}`,
        first.x - 10,
        { x: first.x + CELL_W * 0.16, y: ARRAY_Y - 3 },
        'gold',
        true,
      ),
    )
    result.push(
      marker(
        'ar',
        `ar = ${ar}`,
        first.x + 82,
        { x: first.x + CELL_W * 0.72, y: ARRAY_Y - 3 },
        'success',
        true,
      ),
    )
    return result
  }

  if (av === ar) {
    const center = cellCenter(av)
    result.push(
      marker(
        'av',
        `av = ${av}`,
        center.x - 40,
        { x: center.x - 16, y: ARRAY_Y - 3 },
        'gold',
        false,
      ),
    )
    result.push(
      marker(
        'ar',
        `ar = ${ar}`,
        center.x + 40,
        { x: center.x + 16, y: ARRAY_Y - 3 },
        'success',
        false,
      ),
    )
    return result
  }

  const avCenter = cellCenter(av)
  result.push(
    marker('av', `av = ${av}`, avCenter.x, { x: avCenter.x, y: ARRAY_Y - 3 }, 'gold', false),
  )
  const arCenter = cellCenter(ar)
  result.push(
    marker('ar', `ar = ${ar}`, arCenter.x, { x: arCenter.x, y: ARRAY_Y - 3 }, 'success', false),
  )
  return result
}

/** FIFO reading direction under the array, for the two non-circular queues. */
export function fifoGeometry(snapshot: ArraySnapshot): FifoGeometry | null {
  if (snapshot.profile === 'pile' || snapshot.profile === 'file-circulaire') return null
  const live = occupiedIndices(snapshot)
  if (live.length < 2) return null
  const first = live[0]
  const last = live[live.length - 1]
  if (first === undefined || last === undefined) return null
  const y = INDEX_Y + 46
  const start = cellCenter(first).x
  const end = cellCenter(last).x
  const labelX = (start + end) / 2
  return {
    path: `M ${start} ${y} H ${end - 6}`,
    label: { x: labelX, y: y - 10 },
    bounds: {
      x: Math.min(start, end) - 18,
      y: y - 28,
      width: Math.abs(end - start) + 36,
      height: 42,
    },
  }
}

/** Circular wrap: the index counter leaves the array on the right and re-enters at 0. */
export function wrapGeometry(): WrapGeometry {
  const startX = ARRAY_X + ROW_W + 6
  const endX = ARRAY_X - 6
  const y = ARRAY_Y + CELL_H / 2
  const bottom = ARRAY_Y + CELL_H + 88
  const centerX = ARRAY_X + ROW_W / 2
  return {
    path: [
      `M ${startX} ${y}`,
      `C ${startX + 54} ${y}, ${ARRAY_X + ROW_W + 54} ${bottom}, ${centerX} ${bottom}`,
      `S ${ARRAY_X - 54} ${bottom}, ${endX} ${y}`,
    ].join(' '),
    label: { x: centerX, y: bottom - 8 },
    bounds: {
      x: ARRAY_X - 66,
      y: ARRAY_Y,
      width: ROW_W + 132,
      height: bottom - ARRAY_Y + 22,
    },
  }
}

export function tapeGeometry(tape: ArrayTape): TapeGeometry {
  const characters = [...tape.text]
  const count = characters.length
  const gap = TAPE_GAP
  const available = ROW_W
  const boxW =
    count === 0
      ? TAPE_BOX_W
      : Math.min(TAPE_BOX_W, Math.max(20, (available - (count - 1) * gap) / count))
  const total = count === 0 ? 0 : count * boxW + (count - 1) * gap
  const startX = ARRAY_X + (ROW_W - total) / 2
  const boxes: TapeBox[] = characters.map((char, index) => ({
    index,
    char,
    rect: {
      x: startX + index * (boxW + gap),
      y: TAPE_Y,
      width: boxW,
      height: TAPE_BOX_H,
    },
    current: tape.status === 'scanning' && index === tape.index,
    passed: index < tape.index,
  }))
  return {
    label: { x: startX, y: TAPE_Y - 16 },
    status: { x: startX + total, y: TAPE_Y - 16 },
    boxes,
    total,
    bounds: {
      x: startX - 12,
      y: TAPE_Y - 42,
      width: Math.max(total, 120) + 24,
      height: TAPE_BOX_H + 58,
    },
  }
}

function markerBounds(markerGeometry: MarkerGeometry): Rect {
  return {
    x: markerGeometry.tag.x - 4,
    y: markerGeometry.tag.y - 4,
    width: markerGeometry.tag.width + 8,
    height: ARRAY_Y - markerGeometry.tag.y + 10,
  }
}

export function contentBounds(
  snapshot: ArraySnapshot,
  options: { idle?: boolean } = {},
): Rect {
  if (snapshot.profile === 'file-circulaire') {
    const ring = ringGeometry(snapshot, options)
    if (ring) return ring.bounds
  }

  const rects: Rect[] = [
    {
      x: ARRAY_X - 18,
      y: ARRAY_Y - 14,
      width: ROW_W + 36,
      height: CELL_H + 28,
    },
    {
      x: ARRAY_X - 16,
      y: INDEX_Y - 5,
      width: ROW_W + 32,
      height: 32,
    },
  ]

  if (snapshot.profile === 'pile') {
    rects.push(markerBounds(stackMarker(snapshot)))
  } else {
    for (const queueMarker of queueMarkers(snapshot)) rects.push(markerBounds(queueMarker))
  }

  const fifo = fifoGeometry(snapshot)
  if (fifo) rects.push(fifo.bounds)
  if (snapshot.tape) rects.push(tapeGeometry(snapshot.tape).bounds)

  return unionBounds(rects)
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

export function fitCamera(
  bbox: Rect,
  size: Size,
  padding = FIT_PADDING,
  minK = MIN_AUTO_K,
  maxK = MAX_AUTO_K,
  insets?: FitInsets,
): Camera {
  const width = Math.max(1, size.width)
  const height = Math.max(1, size.height)
  const left = insets?.left ?? padding
  const right = insets?.right ?? padding
  const top = insets?.top ?? padding
  const bottom = insets?.bottom ?? padding
  const availableW = Math.max(1, width - left - right)
  const availableH = Math.max(1, height - top - bottom)
  const k = clamp(Math.min(availableW / bbox.width, availableH / bbox.height), minK, maxK)
  const centerX = bbox.x + bbox.width / 2
  const centerY = bbox.y + bbox.height / 2
  return {
    k,
    x: left + availableW / 2 - centerX * k,
    y: top + availableH / 2 - centerY * k,
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
