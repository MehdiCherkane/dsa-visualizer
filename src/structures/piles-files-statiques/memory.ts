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

export type ArraySlotState = 'used' | 'stale' | 'free'

/** One slot of the circular ring, including values left behind by a dequeue. */
export interface CircularSlot {
  index: number
  state: ArraySlotState
  value: number | string | null
}

/**
 * Index formula attached to the latest circular enqueue or dequeue.
 * `applied` separates the dashed "about to move" state from the solid
 * state shown once the index has actually moved.
 */
export interface CircularFormula {
  kind: 'enfiler' | 'defiler'
  from: number
  to: number
  wrapped: boolean
  applied: boolean
}

export interface CircularState {
  av: number
  ar: number
  taille: number
  max: number
  /** FIFO order: head first, tail last. */
  order: number[]
  elements: CircularSlot[]
  formula?: CircularFormula
}

export interface ArraySnapshot extends BaseSnapshot {
  profile: ArrayProfileId
  capacity: number
  cells: Array<ArrayEntry | null>
  nextEntryId: number
  /** Present only for the circular queue (File 3). */
  circular?: CircularState
  tape?: ArrayTape
}

export const MAX_CELLS = 5
/** Largest capacity accepted by the snapshot factory (ring geometry covers 3–8). */
export const MAX_CAPACITY = 8
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
  const clone: ArraySnapshot = {
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
  if (snapshot.profile === 'file-circulaire') {
    clone.circular = deriveCircular(clone, snapshot.circular?.formula ?? null)
  }
  return clone
}

/**
 * Derives the ring view from the markers and the stored cells. Dequeued
 * values stay in their slot, so they become `stale` instead of disappearing.
 */
export function deriveCircular(
  snapshot: Pick<ArraySnapshot, 'profile' | 'capacity' | 'cells' | 'globals'>,
  formula: CircularFormula | null = null,
): CircularState {
  const order = occupiedIndices(snapshot)
  const live = new Set(order)
  const elements: CircularSlot[] = snapshot.cells.map((entry, index) => ({
    index,
    state: live.has(index) ? 'used' : entry ? 'stale' : 'free',
    value: cellValue(entry),
  }))
  return {
    av: tryReadGlobalInt(snapshot, 'av') ?? -1,
    ar: tryReadGlobalInt(snapshot, 'ar') ?? -1,
    taille: order.length,
    max: snapshot.capacity,
    order,
    elements,
    ...(formula ? { formula: { ...formula } } : {}),
  }
}

export type CircularMemoryRole = 'av' | 'ar' | 'both' | null

/** Which marker a memory cell carries. Only the av = ar cell is combined. */
export function circularMemoryRole(
  index: number,
  circular: Pick<CircularState, 'av' | 'ar' | 'taille'>,
): CircularMemoryRole {
  if (circular.taille === 0) return null
  const head = index === circular.av
  const tail = index === circular.ar
  if (circular.taille === 1) return head && tail ? 'both' : null
  if (head) return 'av'
  if (tail) return 'ar'
  return null
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
  /** Ring capacity. Defaults to MAX_CELLS; the ring UI supports 3–8. */
  capacity?: number
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
  const capacity = options.capacity ?? MAX_CELLS
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > MAX_CAPACITY) {
    throw new Error(`Capacity must be an integer between 1 and ${MAX_CAPACITY}`)
  }
  if (values.length > capacity) {
    throw new Error(`At most ${capacity} cells can be represented`)
  }

  const cells: Array<ArrayEntry | null> = Array.from({ length: capacity }, () => null)
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

  const snapshot: ArraySnapshot = {
    profile,
    capacity,
    cells,
    nextEntryId: FIRST_ENTRY_ID + entries.length,
    globals,
    frames: [],
    ...(options.tape ? { tape: { ...options.tape } } : {}),
  }
  if (profile === 'file-circulaire') {
    snapshot.circular = deriveCircular(snapshot)
  }
  return snapshot
}

export function emptySnapshot(
  profile: ArrayProfileId,
  capacity = MAX_CELLS,
): ArraySnapshot {
  return createSnapshot(profile, [], { capacity })
}

export function readGlobalInt(snapshot: Pick<ArraySnapshot, 'globals'>, name: string): number {
  const value = snapshot.globals[name]
  if (!value || value.kind !== 'int') {
    throw new Error(`Global ${name} is not an integer`)
  }
  return value.value
}

export function tryReadGlobalInt(
  snapshot: Pick<ArraySnapshot, 'globals'>,
  name: string,
): number | null {
  const value = snapshot.globals[name]
  return value && value.kind === 'int' ? value.value : null
}

export function occupiedIndices(
  snapshot: Pick<ArraySnapshot, 'profile' | 'capacity' | 'globals'>,
): number[] {
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

  if (snapshot.profile === 'file-circulaire') {
    const circular = snapshot.circular
    if (!circular) {
      errors.push('circular metadata missing')
    } else {
      try {
        const expected = deriveCircular(snapshot, circular.formula ?? null)
        if (circular.av !== expected.av) errors.push('circular av is stale')
        if (circular.ar !== expected.ar) errors.push('circular ar is stale')
        if (circular.taille !== expected.taille) errors.push('circular taille is stale')
        if (circular.max !== expected.max) errors.push('circular max is stale')
        if (
          circular.order.length !== expected.order.length ||
          circular.order.some((index, position) => index !== expected.order[position])
        ) {
          errors.push('circular order is stale')
        }
        if (circular.elements.length !== expected.elements.length) {
          errors.push('circular elements length is stale')
        }
        for (const [index, element] of circular.elements.entries()) {
          const reference = expected.elements[index]
          if (
            !reference ||
            element.index !== reference.index ||
            element.state !== reference.state ||
            element.value !== reference.value
          ) {
            errors.push(`circular slot ${index} is stale`)
            break
          }
        }
      } catch {
        errors.push('circular metadata cannot be derived')
      }
      if (circular.formula) {
        const { kind, from, to, wrapped, applied } = circular.formula
        if (kind !== 'enfiler' && kind !== 'defiler') {
          errors.push('circular formula kind is invalid')
        }
        if (!Number.isInteger(from) || from < -1 || from >= snapshot.capacity) {
          errors.push('circular formula from is invalid')
        }
        if (!Number.isInteger(to) || to < -1 || to >= snapshot.capacity) {
          errors.push('circular formula to is invalid')
        }
        if (typeof wrapped !== 'boolean' || typeof applied !== 'boolean') {
          errors.push('circular formula flags are invalid')
        }
        if (wrapped !== (from === snapshot.capacity - 1 && to === 0)) {
          errors.push('circular formula wrap flag is inconsistent')
        }
      }
    }
  } else if (snapshot.circular) {
    errors.push('circular metadata is only valid for the circular queue')
  }

  return errors
}

export function requireEntry(snapshot: ArraySnapshot, index: number): ArrayEntry {
  const entry = snapshot.cells[index]
  if (!entry) throw new Error(`Cell ${index} is empty`)
  return entry
}
