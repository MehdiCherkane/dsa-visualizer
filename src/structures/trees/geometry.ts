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
const LEGEND_CLEARANCE = 66

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
  labelX: number
  labelY: number
}

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
  const height = TOP + maxDepth * LEVEL_GAP + TREE_NODE_HEIGHT + LEGEND_CLEARANCE
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
