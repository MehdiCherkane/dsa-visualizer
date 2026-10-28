import type { PointerValue } from '../../core/types'
import {
  createTreeSnapshot,
  emptyTreeSnapshot,
  getNode,
  rootPointer,
} from '../trees/memory'
import type { TreeSnapshot } from '../trees/memory'

export const ABR_MAX_NODES = 12

export function emptyAbrSnapshot(): TreeSnapshot {
  const snapshot = emptyTreeSnapshot()
  snapshot.maxNodes = ABR_MAX_NODES
  return snapshot
}

export function createAbrSnapshot(
  values: number[],
  edges: Array<[parentIndex: number, field: 'gauche' | 'droit', childIndex: number]>,
): TreeSnapshot {
  const snapshot = createTreeSnapshot(values, edges)
  snapshot.maxNodes = ABR_MAX_NODES
  return snapshot
}

export function abrCourseSnapshot(): TreeSnapshot {
  return createAbrSnapshot([50, 30, 70, 20, 40, 60, 80], [
    [0, 'gauche', 1],
    [0, 'droit', 2],
    [1, 'gauche', 3],
    [1, 'droit', 4],
    [2, 'gauche', 5],
    [2, 'droit', 6],
  ])
}

export function registreSnapshot(): TreeSnapshot {
  return createAbrSnapshot([205, 150, 260, 120, 180, 240, 280], [
    [0, 'gauche', 1],
    [0, 'droit', 2],
    [1, 'gauche', 3],
    [1, 'droit', 4],
    [2, 'gauche', 5],
    [2, 'droit', 6],
  ])
}

/** Values in infix order, freed nodes and cycles excluded. */
export function inorderValues(snapshot: TreeSnapshot): number[] {
  const values: number[] = []
  const seen = new Set<number>()
  const walk = (pointer: PointerValue): void => {
    if (pointer.kind !== 'node' || seen.has(pointer.id)) return
    seen.add(pointer.id)
    const node = getNode(snapshot, pointer.id)
    if (!node || node.freed || node.payload.kind !== 'int') return
    walk(node.gauche)
    values.push(node.payload.value)
    walk(node.droit)
  }
  walk(rootPointer(snapshot))
  return values
}

/** Strict order invariant: left subtree < node < right subtree. */
export function isAbr(snapshot: TreeSnapshot): boolean {
  let valid = true
  const walk = (pointer: PointerValue, min: number | null, max: number | null): void => {
    if (!valid || pointer.kind !== 'node') return
    const node = getNode(snapshot, pointer.id)
    if (!node || node.freed || node.payload.kind !== 'int') return
    const value = node.payload.value
    if ((min !== null && value <= min) || (max !== null && value >= max)) {
      valid = false
      return
    }
    walk(node.gauche, min, value)
    walk(node.droit, value, max)
  }
  walk(rootPointer(snapshot), null, null)
  return valid
}
