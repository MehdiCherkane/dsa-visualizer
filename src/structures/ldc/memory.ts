import type { BaseSnapshot, PointerValue, StudentValue, VarValue } from '../../core/types'
import { fr } from '../../i18n/fr'

export type ProfileId = 'int' | 'etudiant'
export type NodeLane = 'row' | 'heap'
export type PointerField = 'suivant' | 'precedent'

export type NodePayload =
  | { kind: 'uninit' }
  | { kind: 'int'; value: number }
  | { kind: 'student'; student: StudentValue }

export interface LdcNode {
  id: number
  address: string
  payload: NodePayload
  suivant: PointerValue
  precedent: PointerValue
  freed: boolean
  slot: number
  lane: NodeLane
}

export interface LdcSnapshot extends BaseSnapshot {
  profile: ProfileId
  globals: Record<string, PointerValue>
  nodes: LdcNode[]
  nextNodeId: number
  nextAddressIndex: number
  maxNodes: number
}

export type LdcItem =
  | { kind: 'int'; value: number }
  | { kind: 'etudiant'; student: StudentValue }

export const MAX_NODES = 8
const FIRST_NODE_ID = 1
const FIRST_ADDRESS = 0x1a40
const ADDRESS_STEP = 0x28

export function formatAddress(index: number): string {
  return `0x${(FIRST_ADDRESS + index * ADDRESS_STEP).toString(16).toUpperCase()}`
}

export function cloneVarValue(value: VarValue): VarValue {
  switch (value.kind) {
    case 'node':
      return { kind: 'node', id: value.id }
    case 'null':
      return { kind: 'null' }
    case 'uninit':
      return { kind: 'uninit' }
    case 'int':
      return { kind: 'int', value: value.value }
    case 'student':
      return { kind: 'student', value: { ...value.value } }
  }
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

export function cloneSnapshot(snapshot: LdcSnapshot): LdcSnapshot {
  return {
    profile: snapshot.profile,
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
      id: node.id,
      address: node.address,
      payload:
        node.payload.kind === 'student'
          ? { kind: 'student', student: { ...node.payload.student } }
          : { ...node.payload },
      suivant: clonePointer(node.suivant),
      precedent: clonePointer(node.precedent),
      freed: node.freed,
      slot: node.slot,
      lane: node.lane,
    })),
    nextNodeId: snapshot.nextNodeId,
    nextAddressIndex: snapshot.nextAddressIndex,
    maxNodes: snapshot.maxNodes,
  }
}

export function createSnapshot(profile: ProfileId, items: LdcItem[]): LdcSnapshot {
  const nodes: LdcNode[] = items.map((item, index) => ({
    id: FIRST_NODE_ID + index,
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

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]
    const next = nodes[index + 1]
    const previous = nodes[index - 1]
    if (!node) continue
    node.suivant = next ? { kind: 'node', id: next.id } : { kind: 'null' }
    node.precedent = previous ? { kind: 'node', id: previous.id } : { kind: 'null' }
  }

  return {
    profile,
    globals: { debut: nodes[0] ? { kind: 'node', id: nodes[0].id } : { kind: 'null' } },
    frames: [],
    nodes,
    nextNodeId: FIRST_NODE_ID + items.length,
    nextAddressIndex: items.length,
    maxNodes: MAX_NODES,
  }
}

export function emptySnapshot(profile: ProfileId): LdcSnapshot {
  return createSnapshot(profile, [])
}

export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const key of Object.keys(value)) {
      const child = (value as Record<string, unknown>)[key]
      deepFreeze(child)
    }
  }
  return value
}

export function getNode(snapshot: LdcSnapshot, id: number): LdcNode | undefined {
  return snapshot.nodes.find((node) => node.id === id)
}

export function requireNode(snapshot: LdcSnapshot, id: number): LdcNode {
  const node = getNode(snapshot, id)
  if (!node) throw new Error(`Node ${id} not found`)
  return node
}

export function pointerEquals(a: PointerValue, b: PointerValue): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'node' && b.kind === 'node') return a.id === b.id
  return true
}

export function pointerNodeId(value: VarValue | PointerValue): number | null {
  return value.kind === 'node' ? value.id : null
}

export function payloadKey(node: LdcNode): number | null {
  if (node.payload.kind === 'int') return node.payload.value
  if (node.payload.kind === 'student') return node.payload.student.numero
  return null
}

export function payloadText(node: LdcNode): string {
  if (node.payload.kind === 'uninit') return fr.common.uninit
  if (node.payload.kind === 'int') return String(node.payload.value)
  return String(node.payload.student.numero)
}

export function studentText(student: StudentValue): string {
  return `${student.numero} — ${student.nom} ${student.prenom}`
}

export function pointerDisplay(snapshot: LdcSnapshot, pointer: PointerValue): string {
  if (pointer.kind === 'node') {
    const node = getNode(snapshot, pointer.id)
    if (!node) return `#${pointer.id}`
    const key = payloadKey(node)
    return key === null ? node.address : `${node.address} → ${key}`
  }
  if (pointer.kind === 'null') return fr.common.null
  return fr.common.uninit
}

export function pointerDescription(snapshot: LdcSnapshot, pointer: PointerValue): string {
  if (pointer.kind === 'node') {
    const node = getNode(snapshot, pointer.id)
    if (!node) return `#${pointer.id}`
    const key = payloadKey(node)
    return `${node.address} (${fr.common.node} ${node.id}, ${fr.common.value} ${key ?? fr.common.uninit})`
  }
  if (pointer.kind === 'null') return fr.common.null
  return fr.common.uninit
}

export function formatVarValue(snapshot: LdcSnapshot, value: VarValue): string {
  switch (value.kind) {
    case 'node':
    case 'null':
    case 'uninit':
      return pointerDisplay(snapshot, value)
    case 'int':
      return String(value.value)
    case 'student':
      return studentText(value.value)
  }
}

export function walkForward(snapshot: LdcSnapshot): LdcNode[] {
  const start = snapshot.globals.debut
  if (!start || start.kind !== 'node') return []
  const result: LdcNode[] = []
  const seen = new Set<number>()
  let pointer: PointerValue = start
  while (pointer.kind === 'node') {
    if (seen.has(pointer.id)) break
    seen.add(pointer.id)
    const node = getNode(snapshot, pointer.id)
    if (!node) break
    result.push(node)
    pointer = node.suivant
  }
  return result
}

export function walkBackward(snapshot: LdcSnapshot): LdcNode[] {
  const forward = walkForward(snapshot)
  const last = forward[forward.length - 1]
  if (!last) return []
  const result: LdcNode[] = []
  const seen = new Set<number>()
  let pointer: PointerValue = { kind: 'node', id: last.id }
  while (pointer.kind === 'node') {
    if (seen.has(pointer.id)) break
    seen.add(pointer.id)
    const node = getNode(snapshot, pointer.id)
    if (!node) break
    result.push(node)
    pointer = node.precedent
  }
  return result
}

export function listValues(snapshot: LdcSnapshot): Array<number | null> {
  return walkForward(snapshot).map((node) => payloadKey(node))
}

export function countListNodes(snapshot: LdcSnapshot): number {
  return walkForward(snapshot).filter((node) => !node.freed).length
}

export function rowNodes(snapshot: LdcSnapshot): LdcNode[] {
  return snapshot.nodes.filter((node) => node.lane === 'row').sort((a, b) => a.slot - b.slot)
}

export function heapNodes(snapshot: LdcSnapshot): LdcNode[] {
  return snapshot.nodes.filter((node) => node.lane === 'heap')
}

export function checkInvariants(snapshot: LdcSnapshot): string[] {
  const errors: string[] = []
  const debut = snapshot.globals.debut

  if (!debut) {
    errors.push('debut missing')
    return errors
  }
  if (debut.kind === 'node') {
    const head = getNode(snapshot, debut.id)
    if (!head) {
      errors.push('debut points to a missing node')
    } else {
      if (head.precedent.kind !== 'null') errors.push('debut->precedent is not NULL')
      if (head.freed) errors.push('debut points to a freed node')
    }
  } else if (debut.kind !== 'null') {
    errors.push('debut is uninitialized')
  }

  const forward: LdcNode[] = []
  const seen = new Set<number>()
  let pointer: PointerValue = debut
  while (pointer.kind === 'node') {
    if (seen.has(pointer.id)) {
      errors.push(`cycle detected at node ${pointer.id}`)
      break
    }
    seen.add(pointer.id)
    const node = getNode(snapshot, pointer.id)
    if (!node) {
      errors.push(`pointer targets missing node ${pointer.id}`)
      break
    }
    if (node.freed) errors.push(`reachable node ${node.id} is freed`)
    forward.push(node)
    pointer = node.suivant
  }

  for (const node of forward) {
    if (node.suivant.kind === 'uninit') errors.push(`node ${node.id} suivant is uninitialized`)
    if (node.precedent.kind === 'uninit') errors.push(`node ${node.id} precedent is uninitialized`)
    if (node.suivant.kind === 'node') {
      const next = getNode(snapshot, node.suivant.id)
      if (!next) {
        errors.push(`node ${node.id} suivant targets missing node ${node.suivant.id}`)
      } else if (next.precedent.kind !== 'node' || next.precedent.id !== node.id) {
        errors.push(`node ${node.id} suivant/precedent mismatch with node ${next.id}`)
      }
    }
    if (node.precedent.kind === 'node') {
      const previous = getNode(snapshot, node.precedent.id)
      if (!previous) {
        errors.push(`node ${node.id} precedent targets missing node ${node.precedent.id}`)
      } else if (previous.suivant.kind !== 'node' || previous.suivant.id !== node.id) {
        errors.push(`node ${node.id} precedent/suivant mismatch with node ${previous.id}`)
      }
    }
  }

  const backward: LdcNode[] = []
  const backwardSeen = new Set<number>()
  const last = forward[forward.length - 1]
  let pointerBack: PointerValue = last ? { kind: 'node', id: last.id } : { kind: 'null' }
  while (pointerBack.kind === 'node') {
    if (backwardSeen.has(pointerBack.id)) {
      errors.push(`cycle detected going backward at node ${pointerBack.id}`)
      break
    }
    backwardSeen.add(pointerBack.id)
    const node = getNode(snapshot, pointerBack.id)
    if (!node) {
      errors.push(`backward pointer targets missing node ${pointerBack.id}`)
      break
    }
    backward.push(node)
    pointerBack = node.precedent
  }

  const forwardIds = forward.map((node) => node.id)
  const backwardIds = backward.map((node) => node.id)
  if (forwardIds.length !== backwardIds.length) {
    errors.push('forward and backward traversals have different lengths')
  } else {
    for (let index = 0; index < forwardIds.length; index += 1) {
      if (forwardIds[index] !== backwardIds[backwardIds.length - 1 - index]) {
        errors.push('forward and backward traversals are not mirrored')
        break
      }
    }
  }

  return errors
}
