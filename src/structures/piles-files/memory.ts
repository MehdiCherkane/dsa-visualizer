import type { BaseSnapshot, PointerValue, VarValue } from '../../core/types'
import { fr } from '../../i18n/fr'

export type StructureProfileId = 'pile' | 'file'
export type NodeLane = 'row' | 'heap'

interface BaseNode {
  id: number
  address: string
  value: number | null
  freed: boolean
  slot: number
  lane: NodeLane
}

export interface PileNode extends BaseNode {
  precedent: PointerValue
}

export interface FileNode extends BaseNode {
  suivant: PointerValue
}

export type PfNode = PileNode | FileNode

export interface PileSnapshot extends BaseSnapshot {
  profile: 'pile'
  globals: Record<'sommet', PointerValue>
  nodes: PileNode[]
  nextNodeId: number
  nextAddressIndex: number
  maxNodes: number
}

export interface FileSnapshot extends BaseSnapshot {
  profile: 'file'
  globals: Record<'debut' | 'fin', PointerValue>
  nodes: FileNode[]
  nextNodeId: number
  nextAddressIndex: number
  maxNodes: number
}

export type PfSnapshot = PileSnapshot | FileSnapshot

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

export function cloneSnapshot(snapshot: PfSnapshot): PfSnapshot {
  const base = {
    globals: Object.fromEntries(
      Object.entries(snapshot.globals).map(([name, value]) => [name, clonePointer(value)]),
    ),
    frames: snapshot.frames.map((frame) => ({
      fn: frame.fn,
      vars: Object.fromEntries(
        Object.entries(frame.vars).map(([name, value]) => [name, cloneVarValue(value)]),
      ),
    })),
    nextNodeId: snapshot.nextNodeId,
    nextAddressIndex: snapshot.nextAddressIndex,
    maxNodes: snapshot.maxNodes,
  }
  if (snapshot.profile === 'pile') {
    return {
      ...base,
      profile: 'pile',
      globals: { sommet: clonePointer(snapshot.globals.sommet) },
      nodes: snapshot.nodes.map((node) => ({
        id: node.id,
        address: node.address,
        value: node.value,
        precedent: clonePointer(node.precedent),
        freed: node.freed,
        slot: node.slot,
        lane: node.lane,
      })),
    }
  }
  return {
    ...base,
    profile: 'file',
    globals: {
      debut: clonePointer(snapshot.globals.debut),
      fin: clonePointer(snapshot.globals.fin),
    },
    nodes: snapshot.nodes.map((node) => ({
      id: node.id,
      address: node.address,
      value: node.value,
      suivant: clonePointer(node.suivant),
      freed: node.freed,
      slot: node.slot,
      lane: node.lane,
    })),
  }
}

export function createPile(values: number[]): PileSnapshot {
  const nodes: PileNode[] = values.map((value, index) => ({
    id: FIRST_NODE_ID + index,
    address: formatAddress(index),
    value,
    precedent: { kind: 'null' },
    freed: false,
    slot: index,
    lane: 'row',
  }))
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]
    const previous = nodes[index + 1]
    if (node) node.precedent = previous ? { kind: 'node', id: previous.id } : { kind: 'null' }
  }
  return {
    profile: 'pile',
    globals: { sommet: nodes[0] ? { kind: 'node', id: nodes[0].id } : { kind: 'null' } },
    frames: [],
    nodes,
    nextNodeId: FIRST_NODE_ID + values.length,
    nextAddressIndex: values.length,
    maxNodes: MAX_NODES,
  }
}

export function createFile(values: number[]): FileSnapshot {
  const nodes: FileNode[] = values.map((value, index) => ({
    id: FIRST_NODE_ID + index,
    address: formatAddress(index),
    value,
    suivant: { kind: 'null' },
    freed: false,
    slot: index,
    lane: 'row',
  }))
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]
    const next = nodes[index + 1]
    if (node) node.suivant = next ? { kind: 'node', id: next.id } : { kind: 'null' }
  }
  const last = nodes[nodes.length - 1]
  return {
    profile: 'file',
    globals: {
      debut: nodes[0] ? { kind: 'node', id: nodes[0].id } : { kind: 'null' },
      fin: last ? { kind: 'node', id: last.id } : { kind: 'null' },
    },
    frames: [],
    nodes,
    nextNodeId: FIRST_NODE_ID + values.length,
    nextAddressIndex: values.length,
    maxNodes: MAX_NODES,
  }
}

export function emptySnapshot(profile: StructureProfileId): PfSnapshot {
  return profile === 'pile' ? createPile([]) : createFile([])
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

export function getPileNode(snapshot: PileSnapshot, id: number): PileNode | undefined {
  return snapshot.nodes.find((node) => node.id === id)
}

export function getFileNode(snapshot: FileSnapshot, id: number): FileNode | undefined {
  return snapshot.nodes.find((node) => node.id === id)
}

export function requirePileNode(snapshot: PileSnapshot, id: number): PileNode {
  const node = getPileNode(snapshot, id)
  if (!node) throw new Error(`Node ${id} not found`)
  return node
}

export function requireFileNode(snapshot: FileSnapshot, id: number): FileNode {
  const node = getFileNode(snapshot, id)
  if (!node) throw new Error(`Node ${id} not found`)
  return node
}

export function pointerEquals(a: PointerValue, b: PointerValue): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'node' && b.kind === 'node') return a.id === b.id
  return true
}

export function payloadKey(node: PfNode): number | null {
  return node.value
}

export function payloadText(node: PfNode): string {
  return node.value === null ? fr.common.uninit : String(node.value)
}

export function pointerDisplay(snapshot: PfSnapshot, pointer: PointerValue): string {
  if (pointer.kind === 'node') {
    const node = snapshot.nodes.find((candidate) => candidate.id === pointer.id)
    if (!node) return `#${pointer.id}`
    return node.value === null ? node.address : `${node.address} → ${node.value}`
  }
  if (pointer.kind === 'null') return fr.common.null
  return fr.common.uninit
}

export function pointerDescription(snapshot: PfSnapshot, pointer: PointerValue): string {
  if (pointer.kind === 'node') {
    const node = snapshot.nodes.find((candidate) => candidate.id === pointer.id)
    if (!node) return `#${pointer.id}`
    return `${node.address} (${fr.common.node} ${node.id}, ${fr.common.value} ${node.value ?? fr.common.uninit})`
  }
  if (pointer.kind === 'null') return fr.common.null
  return fr.common.uninit
}

export function formatVarValue(snapshot: PfSnapshot, value: VarValue): string {
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

export function walkPile(snapshot: PileSnapshot): PileNode[] {
  const start = snapshot.globals.sommet
  if (start.kind !== 'node') return []
  const result: PileNode[] = []
  const seen = new Set<number>()
  let pointer: PointerValue = start
  while (pointer.kind === 'node') {
    if (seen.has(pointer.id)) break
    seen.add(pointer.id)
    const node = getPileNode(snapshot, pointer.id)
    if (!node) break
    result.push(node)
    pointer = node.precedent
  }
  return result
}

export function walkFile(snapshot: FileSnapshot): FileNode[] {
  const start = snapshot.globals.debut
  if (start.kind !== 'node') return []
  const result: FileNode[] = []
  const seen = new Set<number>()
  let pointer: PointerValue = start
  while (pointer.kind === 'node') {
    if (seen.has(pointer.id)) break
    seen.add(pointer.id)
    const node = getFileNode(snapshot, pointer.id)
    if (!node) break
    result.push(node)
    pointer = node.suivant
  }
  return result
}

export function stackValues(snapshot: PileSnapshot): Array<number | null> {
  return walkPile(snapshot).map((node) => node.value)
}

export function queueValues(snapshot: FileSnapshot): Array<number | null> {
  return walkFile(snapshot).map((node) => node.value)
}

export function countNodes(snapshot: PfSnapshot): number {
  if (snapshot.profile === 'pile') {
    return walkPile(snapshot).filter((node) => !node.freed).length
  }
  return walkFile(snapshot).filter((node) => !node.freed).length
}

export function rowNodes(snapshot: PfSnapshot): PfNode[] {
  return snapshot.nodes.filter((node) => node.lane === 'row').sort((a, b) => a.slot - b.slot)
}

export function checkPileInvariants(snapshot: PileSnapshot): string[] {
  const errors: string[] = []
  const sommet = snapshot.globals.sommet
  if (!sommet) {
    errors.push('sommet missing')
    return errors
  }
  if (sommet.kind === 'node') {
    const top = getPileNode(snapshot, sommet.id)
    if (!top) errors.push('sommet points to a missing node')
    else if (top.freed) errors.push('sommet points to a freed node')
  } else if (sommet.kind !== 'null') {
    errors.push('sommet is uninitialized')
  }

  const forward: PileNode[] = []
  const seen = new Set<number>()
  let pointer: PointerValue = sommet
  while (pointer.kind === 'node') {
    if (seen.has(pointer.id)) {
      errors.push(`cycle detected at node ${pointer.id}`)
      break
    }
    seen.add(pointer.id)
    const node = getPileNode(snapshot, pointer.id)
    if (!node) {
      errors.push(`pointer targets missing node ${pointer.id}`)
      break
    }
    if (node.freed) errors.push(`reachable node ${node.id} is freed`)
    forward.push(node)
    pointer = node.precedent
  }
  for (const node of forward) {
    if (node.precedent.kind === 'uninit') errors.push(`node ${node.id} precedent is uninitialized`)
    if (node.precedent.kind === 'node') {
      const previous = getPileNode(snapshot, node.precedent.id)
      if (!previous) {
        errors.push(`node ${node.id} precedent targets missing node ${node.precedent.id}`)
      } else if (previous.freed) {
        errors.push(`node ${node.id} precedent targets freed node ${previous.id}`)
      }
    }
  }
  for (const node of snapshot.nodes) {
    if (!node.freed && node.lane === 'row' && !seen.has(node.id)) {
      errors.push(`row node ${node.id} is unreachable`)
    }
  }
  return errors
}

export function checkFileInvariants(snapshot: FileSnapshot): string[] {
  const errors: string[] = []
  const debut = snapshot.globals.debut
  const fin = snapshot.globals.fin
  if (!debut || !fin) {
    errors.push('debut/fin missing')
    return errors
  }
  if (debut.kind === 'node') {
    const head = getFileNode(snapshot, debut.id)
    if (!head) errors.push('debut points to a missing node')
    else if (head.freed) errors.push('debut points to a freed node')
  } else if (debut.kind !== 'null') {
    errors.push('debut is uninitialized')
  }

  const forward: FileNode[] = []
  const seen = new Set<number>()
  let pointer: PointerValue = debut
  while (pointer.kind === 'node') {
    if (seen.has(pointer.id)) {
      errors.push(`cycle detected at node ${pointer.id}`)
      break
    }
    seen.add(pointer.id)
    const node = getFileNode(snapshot, pointer.id)
    if (!node) {
      errors.push(`pointer targets missing node ${pointer.id}`)
      break
    }
    if (node.freed) errors.push(`reachable node ${node.id} is freed`)
    forward.push(node)
    pointer = node.suivant
  }

  const last = forward[forward.length - 1]
  if (fin.kind === 'node') {
    if (!last) errors.push('fin points to a node while the file is empty')
    else if (last.id !== fin.id) errors.push('fin does not point to the last node')
  } else if (fin.kind === 'null') {
    if (last) errors.push('fin is NULL while the file is not empty')
  } else {
    errors.push('fin is uninitialized')
  }

  for (const node of forward) {
    if (node.suivant.kind === 'uninit') errors.push(`node ${node.id} suivant is uninitialized`)
    if (node.suivant.kind === 'node') {
      const next = getFileNode(snapshot, node.suivant.id)
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

export function checkInvariants(snapshot: PfSnapshot): string[] {
  return snapshot.profile === 'pile'
    ? checkPileInvariants(snapshot)
    : checkFileInvariants(snapshot)
}
