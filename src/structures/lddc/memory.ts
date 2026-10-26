import type { PointerValue } from '../../core/types'
import { MAX_NODES, formatAddress } from '../ldc/memory'
import type { LdcItem, LdcNode, LdcSnapshot, ProfileId } from '../ldc/memory'

export type { LdcItem, LdcNode, LdcSnapshot, ProfileId } from '../ldc/memory'
export {
  MAX_NODES,
  clonePointer,
  cloneSnapshot,
  cloneVarValue,
  countListNodes,
  deepFreeze,
  formatAddress,
  formatVarValue,
  getNode,
  heapNodes,
  listValues,
  payloadKey,
  payloadText,
  pointerDescription,
  pointerDisplay,
  pointerEquals,
  pointerNodeId,
  requireNode,
  rowNodes,
  studentText,
  walkBackward,
  walkForward,
} from '../ldc/memory'

export type LddcSnapshot = LdcSnapshot

/**
 * Chapter 5 reuses chapter 4's snapshot shape, but every non-empty list is a
 * ring: the last node points back to `debut` and `debut->precedent` is the last
 * node. An empty list still has `debut == NULL`. The visualization draws this
 * snapshot as a circle, while chapter 4 keeps its row layout.
 */
export function createCircularSnapshot(profile: ProfileId, items: LdcItem[]): LdcSnapshot {
  const nodes: LdcNode[] = items.map((item, index) => ({
    id: index + 1,
    address: formatAddress(index),
    payload:
      item.kind === 'int'
        ? { kind: 'int', value: item.value }
        : { kind: 'student', student: { ...item.student } },
    suivant: { kind: 'null' },
    precedent: { kind: 'null' },
    freed: false,
    slot: index,
    lane: 'row',
  }))

  const count = nodes.length
  if (count > 0) {
    for (let index = 0; index < count; index += 1) {
      const node = nodes[index]
      const next = nodes[(index + 1) % count]
      const previous = nodes[(index - 1 + count) % count]
      node.suivant = { kind: 'node', id: next.id }
      node.precedent = { kind: 'node', id: previous.id }
    }
  }

  return {
    profile,
    globals: { debut: count > 0 ? { kind: 'node', id: nodes[0].id } : { kind: 'null' } },
    frames: [],
    nodes,
    nextNodeId: 1 + count,
    nextAddressIndex: count,
    maxNodes: MAX_NODES,
  }
}

export function emptyCircularSnapshot(profile: ProfileId): LdcSnapshot {
  return createCircularSnapshot(profile, [])
}

/**
 * Per-step invariant: the links that remain reachable from `debut` must form
 * exactly one closed walk that comes back to `debut`, with no `NULL`,
 * uninitialized or freed node on the way.
 *
 * This deliberately ignores unreachable nodes. A doubly linked ring cannot
 * stay fully mirror-consistent after every single C assignment (a new node is
 * reachable before its lane changes, an old head is detached before it is
 * freed, reversal closes a smaller sub-cycle for a few steps). The full
 * reciprocal invariant is asserted on the final snapshot of each operation by
 * `checkCircularInvariants`.
 */
export function checkRingInvariants(snapshot: LdcSnapshot): string[] {
  const errors: string[] = []
  const debut = snapshot.globals.debut

  if (!debut) {
    errors.push('debut missing')
    return errors
  }
  if (debut.kind === 'null') return errors
  if (debut.kind !== 'node') {
    errors.push('debut is uninitialized')
    return errors
  }

  const seen = new Set<number>()
  let current: PointerValue = debut
  for (;;) {
    if (current.kind !== 'node') {
      errors.push('reachable link is not a node')
      break
    }
    const currentId: number = current.id
    if (seen.has(currentId)) {
      if (currentId !== debut.id) {
        errors.push(`cycle stops at node ${currentId}, not at debut`)
      }
      break
    }
    if (seen.size >= snapshot.nodes.length) {
      errors.push('ring walk never returns to debut')
      break
    }
    seen.add(currentId)

    const node: LdcNode | undefined = snapshot.nodes.find((candidate) => candidate.id === currentId)
    if (!node) {
      errors.push(`missing node ${currentId}`)
      break
    }
    if (node.freed) errors.push(`reachable node ${node.id} is freed`)
    if (node.suivant.kind !== 'node') {
      errors.push(`node ${node.id} suivant is ${node.suivant.kind}`)
      break
    }
    if (node.precedent.kind !== 'node') {
      errors.push(`node ${node.id} precedent is ${node.precedent.kind}`)
    }
    current = node.suivant
  }

  return errors
}

export function checkCircularInvariants(snapshot: LdcSnapshot): string[] {
  const errors: string[] = []
  const debut = snapshot.globals.debut
  const live = snapshot.nodes.filter((node) => !node.freed)

  if (!debut) {
    errors.push('debut missing')
    return errors
  }

  if (debut.kind === 'null') {
    if (live.length > 0) errors.push('debut is NULL but live nodes remain')
    return errors
  }

  if (debut.kind !== 'node') {
    errors.push('debut is uninitialized')
    return errors
  }

  const order: LdcNode[] = []
  const seen = new Set<number>()
  let current: PointerValue = debut

  for (;;) {
    if (current.kind !== 'node') {
      errors.push('reachable link is not a node')
      break
    }
    const currentId: number = current.id
    if (seen.has(currentId)) {
      if (currentId !== debut.id) errors.push(`cycle stops at node ${currentId}, not at debut`)
      break
    }
    seen.add(currentId)
    const node: LdcNode | undefined = snapshot.nodes.find((candidate) => candidate.id === currentId)
    if (!node) {
      errors.push(`missing node ${currentId}`)
      break
    }
    if (node.freed) errors.push(`reachable node ${node.id} is freed`)
    order.push(node)
    current = node.suivant
  }

  for (const node of order) {
    if (node.suivant.kind !== 'node') {
      errors.push(`node ${node.id} suivant is ${node.suivant.kind}`)
    }
    if (node.precedent.kind !== 'node') {
      errors.push(`node ${node.id} precedent is ${node.precedent.kind}`)
    }
  }

  const count = order.length
  for (let index = 0; index < count; index += 1) {
    const node = order[index]
    const next = order[(index + 1) % count]
    const previous = order[(index - 1 + count) % count]
    if (node.suivant.kind !== 'node' || node.suivant.id !== next.id) {
      errors.push(`node ${node.id} suivant does not target the next node`)
    }
    if (node.precedent.kind !== 'node' || node.precedent.id !== previous.id) {
      errors.push(`node ${node.id} precedent does not target the previous node`)
    }
  }

  if (count !== live.length) {
    errors.push('some live nodes are not reachable from debut')
  }

  return errors
}
