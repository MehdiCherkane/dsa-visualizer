import type { BaseSnapshot, PointerValue, StudentValue, VarValue } from '../../core/types'
import { fr } from '../../i18n/fr'

export interface TreeNode {
  id: number
  address: string
  payload: { kind: 'uninit' } | { kind: 'int'; value: number }
  gauche: PointerValue
  droit: PointerValue
  freed: boolean
}

/** Teaching-only state captured with traversal steps. It never changes the C tree. */
export interface TreeTraversalState {
  /** Node ids, in the exact order in which printf has produced them. */
  visitedNodeIds: number[]
  /** The node currently evaluated by the recursive routine, or NULL for the base case. */
  activeNodeId: number | null
}

export type TreeCallPhaseName = 'visite' | 'gauche' | 'droit'
export type TreeCallPhaseState = 'pending' | 'current' | 'done'
export type TreeCallStatus = 'active' | 'wait-left' | 'wait-right'

/** The child slot that produced a call, used to locate the active NULL pill. */
export interface TreeCallSlot {
  parentId: number
  field: 'gauche' | 'droit'
}

/**
 * A frozen debugger-like record used solely to teach the recursive traversal.
 * It is separate from `frames`, whose purpose is the generic Variables panel.
 */
export interface TreeCallFrame {
  id: number
  fn: string
  nodeId: number | null
  /** Set only on a NULL call: the parent/field pair whose child is NULL. */
  nullSlot: TreeCallSlot | null
  line: number
  status: TreeCallStatus
  phases: Array<{
    name: TreeCallPhaseName
    state: TreeCallPhaseState
    value?: number
  }>
}

export interface TreeCallStack {
  frames: TreeCallFrame[]
  maxDepth: number
  maxNonNullDepth: number
}

export interface TreeSnapshot extends BaseSnapshot {
  globals: Record<string, PointerValue>
  nodes: TreeNode[]
  nextNodeId: number
  nextAddressIndex: number
  maxNodes: number
  traversal: TreeTraversalState | null
  callStack: TreeCallStack | null
}

export const MAX_NODES = 6
const FIRST_ADDRESS = 0x1a40
const ADDRESS_STEP = 0x28

export function formatAddress(index: number): string {
  return `0x${(FIRST_ADDRESS + index * ADDRESS_STEP).toString(16).toUpperCase()}`
}

export function clonePointer(value: PointerValue): PointerValue {
  switch (value.kind) {
    case 'node':
      return { kind: 'node', id: value.id }
    case 'null':
      return { kind: 'null' }
    case 'uninit':
      return { kind: 'uninit' }
  }
}

export function cloneVarValue(value: VarValue): VarValue {
  switch (value.kind) {
    case 'node':
    case 'null':
    case 'uninit':
      return clonePointer(value)
    case 'int':
      return { kind: 'int', value: value.value }
    case 'student':
      return { kind: 'student', value: { ...value.value } }
  }
}

export function cloneSnapshot(snapshot: TreeSnapshot): TreeSnapshot {
  return {
    globals: Object.fromEntries(
      Object.entries(snapshot.globals).map(([name, value]) => [name, clonePointer(value)]),
    ),
    frames: snapshot.frames.map((frame) => ({
      fn: frame.fn,
      vars: Object.fromEntries(
        Object.entries(frame.vars).map(([name, value]) => [name, cloneVarValue(value)]),
      ),
    })),
    nodes: snapshot.nodes.map((node) => ({
      ...node,
      payload: { ...node.payload },
      gauche: clonePointer(node.gauche),
      droit: clonePointer(node.droit),
    })),
    nextNodeId: snapshot.nextNodeId,
    nextAddressIndex: snapshot.nextAddressIndex,
    maxNodes: snapshot.maxNodes,
    traversal: snapshot.traversal
      ? {
          visitedNodeIds: [...snapshot.traversal.visitedNodeIds],
          activeNodeId: snapshot.traversal.activeNodeId,
        }
      : null,
    callStack: snapshot.callStack
      ? {
          maxDepth: snapshot.callStack.maxDepth,
          maxNonNullDepth: snapshot.callStack.maxNonNullDepth,
          frames: snapshot.callStack.frames.map((frame) => ({
            ...frame,
            nullSlot: frame.nullSlot ? { ...frame.nullSlot } : null,
            phases: frame.phases.map((phase) => ({ ...phase })),
          })),
        }
      : null,
  }
}

export function emptyTreeSnapshot(): TreeSnapshot {
  return {
    globals: { racine: { kind: 'null' } },
    frames: [],
    nodes: [],
    nextNodeId: 1,
    nextAddressIndex: 0,
    maxNodes: MAX_NODES,
    traversal: null,
    callStack: null,
  }
}

export function createTreeSnapshot(
  values: number[],
  edges: Array<[parentIndex: number, field: 'gauche' | 'droit', childIndex: number]>,
): TreeSnapshot {
  const snapshot = emptyTreeSnapshot()
  snapshot.nodes = values.map((value, index) => ({
    id: index + 1,
    address: formatAddress(index),
    payload: { kind: 'int', value },
    gauche: { kind: 'null' },
    droit: { kind: 'null' },
    freed: false,
  }))
  for (const [parentIndex, field, childIndex] of edges) {
    const parent = snapshot.nodes[parentIndex]
    const child = snapshot.nodes[childIndex]
    if (parent && child) parent[field] = { kind: 'node', id: child.id }
  }
  const root = snapshot.nodes[0]
  snapshot.globals.racine = root ? { kind: 'node', id: root.id } : { kind: 'null' }
  snapshot.nextNodeId = values.length + 1
  snapshot.nextAddressIndex = values.length
  return snapshot
}

export function courseTreeSnapshot(): TreeSnapshot {
  return createTreeSnapshot([50, 30, 70, 20, 40, 80], [
    [0, 'gauche', 1],
    [0, 'droit', 2],
    [1, 'gauche', 3],
    [1, 'droit', 4],
    [2, 'droit', 5],
  ])
}

export function exerciseTreeSnapshot(): TreeSnapshot {
  return createTreeSnapshot([15, 8, 22, 4, 10, 30], [
    [0, 'gauche', 1],
    [0, 'droit', 2],
    [1, 'gauche', 3],
    [1, 'droit', 4],
    [2, 'droit', 5],
  ])
}

export function getNode(snapshot: TreeSnapshot, id: number): TreeNode | undefined {
  return snapshot.nodes.find((node) => node.id === id)
}

export function requireNode(snapshot: TreeSnapshot, id: number): TreeNode {
  const node = getNode(snapshot, id)
  if (!node) throw new Error(`Tree node ${id} not found`)
  return node
}

export function rootPointer(snapshot: TreeSnapshot): PointerValue {
  return snapshot.globals.racine ?? { kind: 'null' }
}

export function payloadKey(node: TreeNode): number | null {
  return node.payload.kind === 'int' ? node.payload.value : null
}

export function pointerDisplay(snapshot: TreeSnapshot, value: PointerValue): string {
  if (value.kind === 'null') return fr.common.null
  if (value.kind === 'uninit') return fr.common.uninit
  const node = getNode(snapshot, value.id)
  if (!node) return `#${value.id}`
  const payload = payloadKey(node)
  return `${node.address}${payload === null ? '' : ` → ${payload}`}${node.freed ? ' (libéré)' : ''}`
}

export function formatVarValue(snapshot: TreeSnapshot, value: VarValue): string {
  switch (value.kind) {
    case 'node':
    case 'null':
    case 'uninit':
      return pointerDisplay(snapshot, value)
    case 'int':
      return String(value.value)
    case 'student':
      return `${value.value.numero} — ${value.value.nom} ${value.value.prenom}`
  }
}

export function countTreeNodes(snapshot: TreeSnapshot): number {
  return snapshot.nodes.filter((node) => !node.freed).length
}

export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const key of Object.keys(value)) {
      deepFreeze((value as Record<string, unknown>)[key])
    }
  }
  return value
}

export type TreeItem = { value: number; gauche?: number; droit?: number }

export const treeFieldLabel: Record<'gauche' | 'droit', string> = {
  gauche: fr.trees.fields.gauche,
  droit: fr.trees.fields.droit,
}

export function studentValueLabel(value: StudentValue): string {
  return `${value.numero} — ${value.nom} ${value.prenom}`
}
