import type { PointerValue } from '../../core/types'
import { getNode, rootPointer } from './memory'
import type { TreeNode, TreeSnapshot } from './memory'

export const TREE_NODE_RADIUS = 40
export const TREE_NODE_WIDTH = TREE_NODE_RADIUS * 2
export const TREE_NODE_HEIGHT = TREE_NODE_RADIUS * 2
const HORIZONTAL_GAP = 220
const LEVEL_GAP = 105
const TOP = 96
const SIDE_PADDING = 64
/** Leaves always draw one extra NULL row; keep room for its pill and margin. */
const BOTTOM_PADDING = 24

export interface TreeLayoutNode {
  node: TreeNode
  depth: number
  index: number
  x: number
  y: number
}

export interface TreeLayoutEdge {
  parentId: number
  childId: number
  field: 'gauche' | 'droit'
  path: string
  /** Anchor of the label before the perpendicular offset is applied. */
  labelX: number
  labelY: number
}

export interface TreeEdgeLabel {
  text: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
}

/** Kept in screen pixels so labels never inherit the tree's fit scale. */
const EDGE_LABEL_FONT_PX = 10
const EDGE_LABEL_PAD_X_PX = 5
const EDGE_LABEL_PAD_Y_PX = 3
const EDGE_LABEL_MARGIN_PX = 2
const EDGE_LABEL_CHAR_RATIO = 0.58
const EDGE_LABEL_OFFSETS_PX = [6, 10, 14, 18, 22, 26, 30, 36, 42, 50, 60, 72, 88]

export interface TreeLayoutNull {
  parentId: number
  field: 'gauche' | 'droit'
  x: number
  y: number
  path: string
  uninitialized: boolean
}

export interface TreeLayout {
  width: number
  height: number
  rootX: number | null
  nodes: TreeLayoutNode[]
  edges: TreeLayoutEdge[]
  nulls: TreeLayoutNull[]
}

export interface TreeActiveMetrics {
  depth: number
  degree: number
  value: number | null
}

export interface TreeMetrics {
  size: number
  leaves: number
  height: number
  active: TreeActiveMetrics | null
}

interface Visit {
  id: number
  depth: number
  index: number
}

function asNodeId(pointer: PointerValue): number | null {
  return pointer.kind === 'node' ? pointer.id : null
}

interface Point {
  x: number
  y: number
}

interface Connector {
  path: string
  labelX: number
  labelY: number
}

/**
 * Joins two tree positions from their visible edges, rather than from the
 * centre of the circles.  The shallow curve keeps the direction unambiguous
 * without the abrupt right-angle bends used by the first tree renderer.
 */
function connector(from: Point, to: Point, side: -1 | 1, targetRadius = 0): Connector {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.hypot(dx, dy) || 1
  const unitX = dx / distance
  const unitY = dy / distance
  const start = {
    x: from.x + unitX * (TREE_NODE_RADIUS + 1),
    y: from.y + unitY * (TREE_NODE_RADIUS + 1),
  }
  const end = {
    x: to.x - unitX * targetRadius,
    y: to.y - unitY * targetRadius,
  }
  const control = {
    x: (start.x + end.x) / 2 + side * Math.min(30, Math.abs(dx) * 0.12),
    y: (start.y + end.y) / 2 - 4,
  }
  return {
    path: `M ${start.x} ${start.y} Q ${control.x} ${control.y}, ${end.x} ${end.y}`,
    labelX: (start.x + 2 * control.x + end.x) / 4,
    labelY: (start.y + 2 * control.y + end.y) / 4,
  }
}

export function layoutTree(snapshot: TreeSnapshot): TreeLayout {
  const root = rootPointer(snapshot)
  if (root.kind !== 'node' || !getNode(snapshot, root.id)) {
    return {
      width: 960,
      height: 440,
      rootX: null,
      nodes: [],
      edges: [],
      nulls: [],
    }
  }

  const visits: Visit[] = []
  const seen = new Set<number>()
  const visit = (id: number, depth: number, index: number): void => {
    if (seen.has(id) || depth > 12) return
    const node = getNode(snapshot, id)
    if (!node) return
    seen.add(id)
    visits.push({ id, depth, index })
    const leftId = asNodeId(node.gauche)
    const rightId = asNodeId(node.droit)
    if (leftId !== null) visit(leftId, depth + 1, index * 2)
    if (rightId !== null) visit(rightId, depth + 1, index * 2 + 1)
  }
  visit(root.id, 0, 0)

  const maxDepth = visits.reduce((max, item) => Math.max(max, item.depth), 0)
  const width = Math.max(960, HORIZONTAL_GAP * 2 ** maxDepth + SIDE_PADDING * 2)
  const height = TOP + (maxDepth + 1) * LEVEL_GAP + BOTTOM_PADDING
  const positions = new Map<number, TreeLayoutNode>()
  const nodes = visits.map((item) => {
    const levelSlots = 2 ** item.depth
    const position: TreeLayoutNode = {
      node: getNode(snapshot, item.id)!,
      depth: item.depth,
      index: item.index,
      x: (width * (item.index + 0.5)) / levelSlots,
      y: TOP + item.depth * LEVEL_GAP,
    }
    positions.set(item.id, position)
    return position
  })

  const edges: TreeLayoutEdge[] = []
  const nulls: TreeLayoutNull[] = []
  for (const position of nodes) {
    const parent = position
    const node = parent.node
    for (const field of ['gauche', 'droit'] as const) {
      const pointer = node[field]
      const childId = asNodeId(pointer)
      if (childId !== null) {
        const child = positions.get(childId)
        if (!child) continue
        const side = field === 'gauche' ? -1 : 1
        const edge = connector(parent, child, side, TREE_NODE_RADIUS + 3)
        edges.push({
          parentId: node.id,
          childId,
          field,
          path: edge.path,
          labelX: edge.labelX,
          labelY: edge.labelY,
        })
      } else {
        const childIndex = parent.index * 2 + (field === 'droit' ? 1 : 0)
        const childDepth = parent.depth + 1
        const childSlots = 2 ** childDepth
        const x = (width * (childIndex + 0.5)) / childSlots
        const y = parent.y + LEVEL_GAP
        const side = field === 'gauche' ? -1 : 1
        const edge = connector(parent, { x, y: y - 16 }, side)
        nulls.push({
          parentId: node.id,
          field,
          x,
          y,
          path: edge.path,
          uninitialized: pointer.kind === 'uninit',
        })
      }
    }
  }

  return { width, height, rootX: positions.get(root.id)?.x ?? null, nodes, edges, nulls }
}

interface ScreenRect {
  left: number
  top: number
  right: number
  bottom: number
}

function rectsOverlap(a: ScreenRect, b: ScreenRect, margin = 0): boolean {
  return (
    a.left < b.right + margin &&
    a.right > b.left - margin &&
    a.top < b.bottom + margin &&
    a.bottom > b.top - margin
  )
}

function circleHitsRect(
  cx: number,
  cy: number,
  radius: number,
  rect: ScreenRect,
  margin = 0,
): boolean {
  const closestX = Math.min(Math.max(cx, rect.left), rect.right)
  const closestY = Math.min(Math.max(cy, rect.top), rect.bottom)
  return Math.hypot(cx - closestX, cy - closestY) < radius + margin
}

/**
 * Places the `gauche` / `droit` labels outside the edge and outside every
 * node, NULL pill and other label. Sizes are expressed in screen pixels and
 * converted back to world units, so the pills stay small and readable at
 * every fit scale instead of growing with the tree.
 */
export function placeEdgeLabels(
  layout: TreeLayout,
  renderScale: number,
  labels: Record<'gauche' | 'droit', string>,
): Map<string, TreeEdgeLabel> {
  const scale = Math.max(renderScale, 0.05)
  const positions = new Map(layout.nodes.map((node) => [node.node.id, node]))
  const nodeObstacles = layout.nodes.map((node) => ({
    x: node.x * scale,
    y: node.y * scale,
    radius: TREE_NODE_RADIUS * scale,
  }))
  const nullObstacles = layout.nulls.map((entry) => ({
    left: (entry.x - 27) * scale,
    right: (entry.x + 27) * scale,
    top: (entry.y - 13) * scale,
    bottom: (entry.y + 13) * scale,
  }))
  const placed: ScreenRect[] = []
  const result = new Map<string, TreeEdgeLabel>()

  for (const edge of layout.edges) {
    const parent = positions.get(edge.parentId)
    const child = positions.get(edge.childId)
    if (!parent || !child) continue
    const text = labels[edge.field]
    const dx = child.x - parent.x
    const dy = child.y - parent.y
    const length = Math.hypot(dx, dy) || 1
    const normal = { x: -dy / length, y: dx / length }
    const side = edge.field === 'gauche' ? -1 : 1
    const outward =
      normal.x * side >= 0 ? normal : { x: -normal.x, y: -normal.y }
    const fontPx = EDGE_LABEL_FONT_PX
    const widthPx = text.length * fontPx * EDGE_LABEL_CHAR_RATIO + EDGE_LABEL_PAD_X_PX * 2
    const heightPx = fontPx + EDGE_LABEL_PAD_Y_PX * 2
    const anchorX = edge.labelX * scale
    const anchorY = edge.labelY * scale

    let chosen: ScreenRect | null = null
    let chosenX = anchorX
    let chosenY = anchorY
    for (const direction of [1, -1]) {
      if (chosen) break
      for (const offset of EDGE_LABEL_OFFSETS_PX) {
        const x = anchorX + outward.x * offset * direction
        const y = anchorY + outward.y * offset * direction
        const rect: ScreenRect = {
          left: x - widthPx / 2,
          right: x + widthPx / 2,
          top: y - heightPx / 2,
          bottom: y + heightPx / 2,
        }
        const hitsNode = nodeObstacles.some((node) =>
          circleHitsRect(node.x, node.y, node.radius, rect, EDGE_LABEL_MARGIN_PX),
        )
        const hitsNull = nullObstacles.some((pill) =>
          rectsOverlap(rect, pill, EDGE_LABEL_MARGIN_PX),
        )
        const hitsLabel = placed.some((other) =>
          rectsOverlap(rect, other, EDGE_LABEL_MARGIN_PX),
        )
        if (hitsNode || hitsNull || hitsLabel) continue
        chosen = rect
        chosenX = x
        chosenY = y
        break
      }
    }

    if (!chosen) {
      // The course trees always leave room; keep a safe fallback for future
      // deeper trees rather than drawing a label on a node.
      const offset = EDGE_LABEL_OFFSETS_PX.at(-1) ?? 60
      chosenX = anchorX + outward.x * offset
      chosenY = anchorY + outward.y * offset
      chosen = {
        left: chosenX - widthPx / 2,
        right: chosenX + widthPx / 2,
        top: chosenY - heightPx / 2,
        bottom: chosenY + heightPx / 2,
      }
    }

    placed.push(chosen)
    result.set(`${edge.parentId}:${edge.field}`, {
      text,
      x: chosenX / scale,
      y: chosenY / scale,
      width: widthPx / scale,
      height: heightPx / scale,
      fontSize: fontPx / scale,
    })
  }

  return result
}

export function measureTree(snapshot: TreeSnapshot, activeId: number | null = null): TreeMetrics {
  const root = rootPointer(snapshot)
  if (root.kind !== 'node') return { size: 0, leaves: 0, height: -1, active: null }

  const seen = new Set<number>()
  let size = 0
  let leaves = 0
  let active: TreeActiveMetrics | null = null
  const measure = (id: number, depth: number): number => {
    if (seen.has(id)) return -1
    const node = getNode(snapshot, id)
    if (!node || node.freed) return -1
    seen.add(id)
    size += 1
    const children = (['gauche', 'droit'] as const)
      .map((field) => asNodeId(node[field]))
      .filter((childId): childId is number => childId !== null && getNode(snapshot, childId)?.freed === false)
    if (children.length === 0) leaves += 1
    if (node.id === activeId) {
      active = {
        depth,
        degree: children.length,
        value: node.payload.kind === 'int' ? node.payload.value : null,
      }
    }
    const childHeights = children.map((childId) => measure(childId, depth + 1)).filter((height) => height >= 0)
    return childHeights.length === 0 ? 0 : Math.max(...childHeights) + 1
  }
  const height = measure(root.id, 0)
  return { size, leaves, height, active }
}
