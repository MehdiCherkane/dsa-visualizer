import type { BaseSnapshot, PointerValue, StudentValue, VarValue } from '../../core/types'
import { fr } from '../../i18n/fr'

export type LscProfileId = 'lineaire' | 'circulaire'
export type NodeLane = 'row' | 'heap'

export interface LscStudent {
  numero: number | null
  nom: string | null
  prenom: string | null
}

export type LscPayload =
  | { kind: 'uninit' }
  | { kind: 'int'; value: number }
  | { kind: 'student'; student: LscStudent }

export interface LscNode {
  id: number
  address: string
  payload: LscPayload
  suivant: PointerValue
  freed: boolean
  slot: number
  lane: NodeLane
}

export interface LscSnapshot extends BaseSnapshot {
  profile: LscProfileId
  globals: Record<string, PointerValue>
  nodes: LscNode[]
  nextNodeId: number
  nextAddressIndex: number
  maxNodes: number
}

export type LscItem =
  | { kind: 'int'; value: number }
  | { kind: 'etudiant'; student: StudentValue }

export const MAX_NODES = 8
const FIRST_NODE_ID = 1
const FIRST_ADDRESS = 0x1a40
const ADDRESS_STEP = 0x30

export function formatAddress(index: number): string {
  return `0x${(FIRST_ADDRESS + index * ADDRESS_STEP).toString(16).toUpperCase()}`
}

export function clonePointer(pointer: PointerValue): PointerValue {
  return { ...pointer }
}

export function cloneVarValue(value: VarValue): VarValue {
  switch (value.kind) {
    case 'node':
    case 'null':
    case 'uninit':
      return { ...value }
    case 'int':
      return { kind: 'int', value: value.value }
    case 'student':
      return { kind: 'student', value: { ...value.value } }
  }
}

export function cloneStudent(student: LscStudent): LscStudent {
  return { ...student }
}

export function cloneSnapshot(snapshot: LscSnapshot): LscSnapshot {
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
          ? { kind: 'student', student: cloneStudent(node.payload.student) }
          : { ...node.payload },
      suivant: clonePointer(node.suivant),
      freed: node.freed,
      slot: node.slot,
      lane: node.lane,
    })),
    nextNodeId: snapshot.nextNodeId,
    nextAddressIndex: snapshot.nextAddressIndex,
    maxNodes: snapshot.maxNodes,
  }
}

export function createSnapshot(profile: LscProfileId, items: LscItem[]): LscSnapshot {
  const nodes: LscNode[] = items.map((item, index) => ({
    id: FIRST_NODE_ID + index,
    address: formatAddress(index),
    payload:
      item.kind === 'int'
        ? { kind: 'int', value: item.value }
        : {
            kind: 'student',
            student: {
              numero: item.student.numero,
              nom: item.student.nom,
              prenom: item.student.prenom,
            },
          },
    suivant: { kind: 'null' },
    freed: false,
    slot: index,
    lane: 'row',
  }))

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]
    const next = nodes[index + 1]
    if (!node) continue
    if (next) {
      node.suivant = { kind: 'node', id: next.id }
    } else if (profile === 'circulaire' && nodes[0]) {
      node.suivant = { kind: 'node', id: nodes[0].id }
    } else {
      node.suivant = { kind: 'null' }
    }
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

export function emptySnapshot(profile: LscProfileId): LscSnapshot {
  return createSnapshot(profile, [])
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

export function getNode(snapshot: LscSnapshot, id: number): LscNode | undefined {
  return snapshot.nodes.find((node) => node.id === id)
}

export function requireNode(snapshot: LscSnapshot, id: number): LscNode {
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

export function payloadKey(node: LscNode): number | null {
  if (node.payload.kind === 'int') return node.payload.value
  if (node.payload.kind === 'student') return node.payload.student.numero
  return null
}

export function payloadText(node: LscNode): string {
  if (node.payload.kind === 'uninit') return fr.common.uninit
  if (node.payload.kind === 'int') return String(node.payload.value)
  return node.payload.student.numero === null ? fr.common.uninit : String(node.payload.student.numero)
}

export function studentSubtitle(node: LscNode): string | undefined {
  if (node.payload.kind !== 'student') return undefined
  const { nom, prenom } = node.payload.student
  if (nom === null && prenom === null) return undefined
  return `${nom ?? fr.common.uninit} ${prenom ?? fr.common.uninit}`.trim()
}

export function studentText(student: StudentValue): string {
  return `${student.numero} — ${student.nom} ${student.prenom}`
}

export function pointerDisplay(snapshot: LscSnapshot, pointer: PointerValue): string {
  if (pointer.kind === 'node') {
    const node = getNode(snapshot, pointer.id)
    if (!node) return `#${pointer.id}`
    const key = payloadKey(node)
    return key === null ? node.address : `${node.address} → ${key}`
  }
  if (pointer.kind === 'null') return fr.common.null
  return fr.common.uninit
}

export function pointerDescription(snapshot: LscSnapshot, pointer: PointerValue): string {
  if (pointer.kind === 'node') {
    const node = getNode(snapshot, pointer.id)
    if (!node) return `#${pointer.id}`
    const key = payloadKey(node)
    return `${node.address} (${fr.common.node} ${node.id}, ${fr.common.value} ${key ?? fr.common.uninit})`
  }
  if (pointer.kind === 'null') return fr.common.null
  return fr.common.uninit
}

export function formatVarValue(snapshot: LscSnapshot, value: VarValue): string {
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

export function walkForward(snapshot: LscSnapshot): LscNode[] {
  const start = snapshot.globals.debut
  if (!start || start.kind !== 'node') return []
  const result: LscNode[] = []
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

export function listValues(snapshot: LscSnapshot): Array<number | null> {
  return walkForward(snapshot).map((node) => payloadKey(node))
}

export function countListNodes(snapshot: LscSnapshot): number {
  return walkForward(snapshot).filter((node) => !node.freed).length
}

export function rowNodes(snapshot: LscSnapshot): LscNode[] {
  return snapshot.nodes.filter((node) => node.lane === 'row').sort((a, b) => a.slot - b.slot)
}

export function heapNodes(snapshot: LscSnapshot): LscNode[] {
  return snapshot.nodes.filter((node) => node.lane === 'heap')
}

export function checkInvariants(snapshot: LscSnapshot): string[] {
  if (snapshot.profile === 'circulaire') return checkCircularInvariants(snapshot)

  const errors: string[] = []
  const debut = snapshot.globals.debut

  if (!debut) {
    errors.push('debut missing')
    return errors
  }
  if (debut.kind === 'node') {
    const head = getNode(snapshot, debut.id)
    if (!head) errors.push('debut points to a missing node')
    else if (head.freed) errors.push('debut points to a freed node')
  } else if (debut.kind !== 'null') {
    errors.push('debut is uninitialized')
  }

  const forward: LscNode[] = []
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
    if (node.suivant.kind === 'node') {
      const next = getNode(snapshot, node.suivant.id)
      if (!next) errors.push(`node ${node.id} suivant targets missing node ${node.suivant.id}`)
      else if (next.freed) errors.push(`node ${node.id} suivant targets freed node ${next.id}`)
    }
  }

  for (const node of snapshot.nodes) {
    if (!node.freed && node.lane === 'row' && !seen.has(node.id)) {
      errors.push(`row node ${node.id} is unreachable`)
    }
  }

  return errors
}

/**
 * A circular singly linked list must form exactly one closed walk that comes
 * back to `debut`. Every non-freed row node must be on that walk, and no link
 * may be NULL or uninitialized. An empty ring still has `debut == NULL`.
 */
export function checkCircularInvariants(snapshot: LscSnapshot): string[] {
  const errors: string[] = []
  const debut = snapshot.globals.debut
  const liveRow = snapshot.nodes.filter((node) => !node.freed && node.lane === 'row')

  if (!debut) {
    errors.push('debut missing')
    return errors
  }

  if (debut.kind === 'null') {
    if (liveRow.length > 0) errors.push('debut is NULL but live nodes remain')
    return errors
  }

  if (debut.kind !== 'node') {
    errors.push('debut is uninitialized')
    return errors
  }

  const order: LscNode[] = []
  const seen = new Set<number>()
  let pointer: PointerValue = debut

  for (;;) {
    if (pointer.kind !== 'node') {
      errors.push('reachable link is not a node')
      break
    }
    if (seen.has(pointer.id)) {
      if (pointer.id !== debut.id) {
        errors.push(`cycle stops at node ${pointer.id}, not at debut`)
      }
      break
    }
    seen.add(pointer.id)
    const node = getNode(snapshot, pointer.id)
    if (!node) {
      errors.push(`pointer targets missing node ${pointer.id}`)
      break
    }
    if (node.freed) errors.push(`reachable node ${node.id} is freed`)
    order.push(node)
    pointer = node.suivant
  }

  for (const node of order) {
    if (node.suivant.kind === 'uninit') errors.push(`node ${node.id} suivant is uninitialized`)
    if (node.suivant.kind === 'node') {
      const next = getNode(snapshot, node.suivant.id)
      if (!next) errors.push(`node ${node.id} suivant targets missing node ${node.suivant.id}`)
      else if (next.freed) errors.push(`node ${node.id} suivant targets freed node ${next.id}`)
    }
  }

  for (const node of liveRow) {
    if (!seen.has(node.id)) errors.push(`row node ${node.id} is unreachable`)
  }

  if (order.length !== liveRow.length) {
    errors.push('some live nodes are not reachable from debut')
  }

  return errors
}
