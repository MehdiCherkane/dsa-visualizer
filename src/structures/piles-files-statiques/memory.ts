import type { BaseSnapshot, CellValue, VarValue } from '../../core/types'
import { fr } from '../../i18n/fr'

export type ArrayProfileId = 'pile' | 'file-ordinaire' | 'file-decalage' | 'file-circulaire'
export type TapeStatus = 'ready' | 'scanning' | 'valid' | 'invalid'

export type ArrayAtom =
  | { kind: 'int'; value: number }
  | { kind: 'char'; value: string }

export interface ArrayEntry {
  id: number
  value: ArrayAtom
}

export interface ArrayTape {
  text: string
  index: number
  status: TapeStatus
}

export interface ArraySnapshot extends BaseSnapshot {
  profile: ArrayProfileId
  capacity: number
  cells: Array<ArrayEntry | null>
  nextEntryId: number
  tape?: ArrayTape
}

export const MAX_CELLS = 5
const FIRST_ENTRY_ID = 1

export function intAtom(value: number): ArrayAtom {
  return { kind: 'int', value }
}

export function charAtom(value: string): ArrayAtom {
  return { kind: 'char', value }
}

export function atomFromValue(value: number | string): ArrayAtom {
  return typeof value === 'number' ? intAtom(value) : charAtom(value)
}

export function cellValue(entry: ArrayEntry | null): CellValue {
  if (!entry) return null
  return entry.value.value
}

export function cellText(entry: ArrayEntry | null): string {
  if (!entry) return fr.common.uninit
  return String(entry.value.value)
}

export function cloneAtom(atom: ArrayAtom): ArrayAtom {
  return atom.kind === 'int'
    ? { kind: 'int', value: atom.value }
    : { kind: 'char', value: atom.value }
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

function cloneEntry(entry: ArrayEntry | null): ArrayEntry | null {
  return entry ? { id: entry.id, value: cloneAtom(entry.value) } : null
}

export function cloneSnapshot(snapshot: ArraySnapshot): ArraySnapshot {
  return {
    profile: snapshot.profile,
    capacity: snapshot.capacity,
    cells: snapshot.cells.map(cloneEntry),
    nextEntryId: snapshot.nextEntryId,
    globals: Object.fromEntries(
      Object.entries(snapshot.globals).map(([name, value]) => [name, cloneVarValue(value)]),
    ),
    frames: snapshot.frames.map((frame) => ({
      fn: frame.fn,
      vars: Object.fromEntries(
        Object.entries(frame.vars).map(([name, value]) => [name, cloneVarValue(value)]),
      ),
      ...(frame.callLabel === undefined ? {} : { callLabel: frame.callLabel }),
    })),
    ...(snapshot.tape ? { tape: { ...snapshot.tape } } : {}),
  }
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

function initialGlobals(profile: ArrayProfileId): Record<string, VarValue> {
  if (profile === 'pile') return { sommet: { kind: 'int', value: -1 } }
  if (profile === 'file-decalage') return { ar: { kind: 'int', value: 0 } }
  return {
    av: { kind: 'int', value: -1 },
    ar: { kind: 'int', value: -1 },
  }
}

export interface CreateSnapshotOptions {
  tape?: ArrayTape
}

/**
 * `values` are laid out contiguously from index 0, which is also how the
 * course starts its traces. The markers are derived from the variant.
 */
export function createSnapshot(
  profile: ArrayProfileId,
  values: Array<number | string> = [],
  options: CreateSnapshotOptions = {},
): ArraySnapshot {
  if (values.length > MAX_CELLS) {
    throw new Error(`At most ${MAX_CELLS} cells can be represented`)
  }
  if (profile === 'file-circulaire' && values.length > MAX_CELLS) {
    throw new Error('Circular queue overflow')
  }

  const cells: Array<ArrayEntry | null> = Array.from({ length: MAX_CELLS }, () => null)
  const entries = values.map((value, index) => ({
    id: FIRST_ENTRY_ID + index,
    value: atomFromValue(value),
  }))
  for (const [index, entry] of entries.entries()) cells[index] = entry

  const globals = initialGlobals(profile)
  if (profile === 'pile' && values.length > 0) {
    globals.sommet = { kind: 'int', value: values.length - 1 }
  } else if (profile === 'file-ordinaire' && values.length > 0) {
    globals.av = { kind: 'int', value: 0 }
    globals.ar = { kind: 'int', value: values.length - 1 }
  } else if (profile === 'file-decalage') {
    globals.ar = { kind: 'int', value: values.length }
  } else if (profile === 'file-circulaire' && values.length > 0) {
    globals.av = { kind: 'int', value: 0 }
    globals.ar = { kind: 'int', value: values.length - 1 }
  }

  return {
    profile,
    capacity: MAX_CELLS,
    cells,
    nextEntryId: FIRST_ENTRY_ID + entries.length,
    globals,
    frames: [],
    ...(options.tape ? { tape: { ...options.tape } } : {}),
  }
}

export function emptySnapshot(profile: ArrayProfileId): ArraySnapshot {
  return createSnapshot(profile)
}

export function readGlobalInt(snapshot: ArraySnapshot, name: string): number {
  const value = snapshot.globals[name]
  if (!value || value.kind !== 'int') {
    throw new Error(`Global ${name} is not an integer`)
  }
  return value.value
}

export function tryReadGlobalInt(snapshot: ArraySnapshot, name: string): number | null {
  const value = snapshot.globals[name]
  return value && value.kind === 'int' ? value.value : null
}

export function occupiedIndices(snapshot: ArraySnapshot): number[] {
  const capacity = snapshot.capacity
  if (snapshot.profile === 'pile') {
    const sommet = readGlobalInt(snapshot, 'sommet')
    if (sommet < 0) return []
    return Array.from({ length: Math.min(capacity, sommet + 1) }, (_, index) => index)
  }

  if (snapshot.profile === 'file-decalage') {
    const count = readGlobalInt(snapshot, 'ar')
    return Array.from({ length: Math.max(0, Math.min(capacity, count)) }, (_, index) => index)
  }

  const av = readGlobalInt(snapshot, 'av')
  const ar = readGlobalInt(snapshot, 'ar')
  if (av < 0) return []
  if (snapshot.profile === 'file-ordinaire') {
    return Array.from({ length: Math.max(0, Math.min(capacity, ar - av + 1)) }, (_, index) => av + index)
  }

  const count = ((ar - av + capacity) % capacity) + 1
  return Array.from({ length: Math.min(capacity, count) }, (_, index) => (av + index) % capacity)
}

export function liveIndexSet(snapshot: ArraySnapshot): Set<number> {
  return new Set(occupiedIndices(snapshot))
}

export function liveEntries(snapshot: ArraySnapshot): ArrayEntry[] {
  return occupiedIndices(snapshot).flatMap((index) => {
    const entry = snapshot.cells[index]
    return entry ? [entry] : []
  })
}

export function countOccupied(snapshot: ArraySnapshot): number {
  return liveEntries(snapshot).length
}

export function isEmpty(snapshot: ArraySnapshot): boolean {
  return occupiedIndices(snapshot).length === 0
}

export function isFull(snapshot: ArraySnapshot): boolean {
  if (snapshot.profile === 'pile') {
    return readGlobalInt(snapshot, 'sommet') === snapshot.capacity - 1
  }
  if (snapshot.profile === 'file-ordinaire') {
    return readGlobalInt(snapshot, 'ar') === snapshot.capacity - 1
  }
  if (snapshot.profile === 'file-decalage') {
    return readGlobalInt(snapshot, 'ar') === snapshot.capacity
  }
  const av = readGlobalInt(snapshot, 'av')
  const ar = readGlobalInt(snapshot, 'ar')
  return (ar + 1) % snapshot.capacity === av
}

export function nextWritableIndex(snapshot: ArraySnapshot): number {
  if (snapshot.profile === 'pile') return readGlobalInt(snapshot, 'sommet') + 1
  if (snapshot.profile === 'file-ordinaire') return readGlobalInt(snapshot, 'ar') + 1
  if (snapshot.profile === 'file-decalage') return readGlobalInt(snapshot, 'ar')
  return (readGlobalInt(snapshot, 'ar') + 1) % snapshot.capacity
}

export function formatVarValue(_snapshot: ArraySnapshot, value: VarValue): string {
  switch (value.kind) {
    case 'int':
      return String(value.value)
    case 'student':
      return `${value.value.numero} — ${value.value.nom} ${value.value.prenom}`
    case 'node':
      return `#${value.id}`
    case 'null':
      return fr.common.null
    case 'uninit':
      return fr.common.uninit
  }
}

export function summarize(snapshot: ArraySnapshot): string {
  const count = countOccupied(snapshot)
  const capacity = `${count}/${snapshot.capacity}`
  if (snapshot.profile === 'pile') {
    return `sommet = ${readGlobalInt(snapshot, 'sommet')} · ${capacity}`
  }
  if (snapshot.profile === 'file-decalage') {
    return `ar = ${readGlobalInt(snapshot, 'ar')} · ${capacity}`
  }
  return `av = ${readGlobalInt(snapshot, 'av')} · ar = ${readGlobalInt(snapshot, 'ar')} · ${capacity}`
}

export function checkInvariants(snapshot: ArraySnapshot): string[] {
  const errors: string[] = []
  if (snapshot.cells.length !== snapshot.capacity) {
    errors.push('cells length differs from capacity')
  }
  if (snapshot.nextEntryId <= FIRST_ENTRY_ID - 1) {
    errors.push('nextEntryId must be positive')
  }

  const seen = new Set<number>()
  for (const entry of snapshot.cells) {
    if (!entry) continue
    if (seen.has(entry.id)) errors.push(`duplicate entry id ${entry.id}`)
    seen.add(entry.id)
  }

  if (snapshot.profile === 'pile') {
    const sommet = readGlobalInt(snapshot, 'sommet')
    if (sommet < -1 || sommet >= snapshot.capacity) {
      errors.push(`sommet ${sommet} is outside [-1, ${snapshot.capacity - 1}]`)
    }
  } else if (snapshot.profile === 'file-decalage') {
    const count = readGlobalInt(snapshot, 'ar')
    if (count < 0 || count > snapshot.capacity) {
      errors.push(`ar/count ${count} is outside [0, ${snapshot.capacity}]`)
    }
  } else {
    const av = readGlobalInt(snapshot, 'av')
    const ar = readGlobalInt(snapshot, 'ar')
    if (av === -1 && ar !== -1) errors.push('empty queue must have ar == -1')
    if (av !== -1 && (av < 0 || av >= snapshot.capacity)) errors.push('av outside the array')
    if (ar !== -1 && (ar < 0 || ar >= snapshot.capacity)) errors.push('ar outside the array')
    if (snapshot.profile === 'file-ordinaire' && av !== -1 && ar < av) {
      errors.push('ordinary queue has ar before av')
    }
    if (snapshot.profile === 'file-circulaire' && av !== -1) {
      const count = ((ar - av + snapshot.capacity) % snapshot.capacity) + 1
      if (count > snapshot.capacity) errors.push('circular queue exceeds capacity')
    }
  }

  return errors
}

export function requireEntry(snapshot: ArraySnapshot, index: number): ArrayEntry {
  const entry = snapshot.cells[index]
  if (!entry) throw new Error(`Cell ${index} is empty`)
  return entry
}
