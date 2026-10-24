import type {
  Badge,
  Change,
  EvalEntry,
  FrameState,
  Step,
  VarValue,
} from '../../../core/types'
import { fr } from '../../../i18n/fr'
import {
  cellValue,
  cloneAtom,
  cloneSnapshot,
  cloneVarValue,
  deepFreeze,
  readGlobalInt,
} from '../memory'
import type { ArrayAtom, ArrayEntry, ArraySnapshot, ArrayTape } from '../memory'

interface StepExtras {
  cond?: { expr: string; result: boolean }
  badge?: Badge
  evals?: EvalEntry[]
}

export class ArrayRecorder {
  readonly state: ArraySnapshot
  private collected: Step<ArraySnapshot>[] = []
  private pending: Change[] = []
  private output = ''
  private returnValue: number | undefined
  private traversed = 0
  private comparisons = 0

  constructor(state: ArraySnapshot) {
    this.state = cloneSnapshot(state)
    this.state.frames = []
  }

  get steps(): Step<ArraySnapshot>[] {
    return this.collected
  }

  get activeFrame(): FrameState | undefined {
    return this.state.frames[this.state.frames.length - 1]
  }

  pushFrame(fn: string, vars: Record<string, VarValue> = {}, callLabel?: string): void {
    const cloned: Record<string, VarValue> = {}
    for (const [name, value] of Object.entries(vars)) cloned[name] = cloneVarValue(value)
    this.state.frames.push({
      fn,
      vars: cloned,
      ...(callLabel === undefined ? {} : { callLabel }),
    })
  }

  popFrame(): void {
    this.state.frames.pop()
  }

  globalInt(name: string): number {
    return readGlobalInt(this.state, name)
  }

  localInt(name: string): number | null {
    const value = this.activeFrame?.vars[name]
    return value && value.kind === 'int' ? value.value : null
  }

  setGlobalInt(name: string, value: number): void {
    const previous = this.state.globals[name] ?? { kind: 'uninit' as const }
    this.state.globals[name] = { kind: 'int', value }
    this.pending.push({
      kind: 'variable',
      scope: 'global',
      name,
      from: cloneVarValue(previous),
      to: { kind: 'int', value },
    })
  }

  declareLocal(name: string, value: VarValue): void {
    this.setLocal(name, value)
  }

  setLocal(name: string, value: VarValue): void {
    const frameIndex = this.state.frames.length - 1
    const frame = this.state.frames[frameIndex]
    if (!frame) throw new Error('No active frame')
    const previous = frame.vars[name] ?? { kind: 'uninit' as const }
    frame.vars[name] = cloneVarValue(value)
    this.pending.push({
      kind: 'variable',
      scope: 'local',
      frameIndex,
      name,
      from: cloneVarValue(previous),
      to: cloneVarValue(value),
    })
  }

  /** Writes a new entry (new animation identity) into an array cell. */
  writeCell(index: number, atom: ArrayAtom): number {
    const previous = this.state.cells[index] ?? null
    const entry: ArrayEntry = {
      id: this.state.nextEntryId,
      value: cloneAtom(atom),
    }
    this.state.nextEntryId += 1
    this.state.cells[index] = entry
    this.pending.push({
      kind: 'cell',
      index,
      from: cellValue(previous),
      to: atom.value,
    })
    return entry.id
  }

  /** Reuses the identity of the entry currently stored in the target cell. */
  overwriteCell(index: number, atom: ArrayAtom): void {
    const previous = this.state.cells[index] ?? null
    this.state.cells[index] = previous
      ? { id: previous.id, value: cloneAtom(atom) }
      : { id: this.state.nextEntryId++, value: cloneAtom(atom) }
    this.pending.push({
      kind: 'cell',
      index,
      from: cellValue(previous),
      to: atom.value,
    })
  }

  moveCell(from: number, to: number): void {
    if (from === to) return
    const entry = this.state.cells[from]
    if (!entry) throw new Error(`Cell ${from} is empty`)
    const previousTarget = this.state.cells[to] ?? null
    this.state.cells[to] = { id: entry.id, value: cloneAtom(entry.value) }
    this.state.cells[from] = null
    this.pending.push({
      kind: 'cell',
      index: from,
      from: cellValue(entry),
      to: null,
    })
    this.pending.push({
      kind: 'cell',
      index: to,
      from: cellValue(previousTarget),
      to: entry.value.value,
    })
  }

  clearCell(index: number): void {
    const previous = this.state.cells[index] ?? null
    if (!previous) return
    this.state.cells[index] = null
    this.pending.push({
      kind: 'cell',
      index,
      from: cellValue(previous),
      to: null,
    })
  }

  clearArray(): void {
    for (let index = 0; index < this.state.cells.length; index += 1) {
      this.clearCell(index)
    }
  }

  /**
   * File par décalage : la valeur en tête sort et toutes les suivantes
   * glissent d'une case vers la gauche. Les identités sont conservées pour
   * que les valeurs puissent être animées d'une case à l'autre.
   */
  shiftLeft(count: number): void {
    const bounded = Math.max(0, Math.min(count, this.state.cells.length))
    if (bounded === 0) return
    const before = Array.from({ length: bounded }, (_, index) => this.state.cells[index] ?? null)
    for (let index = 0; index < bounded - 1; index += 1) {
      const next = before[index + 1] ?? null
      this.state.cells[index] = next
        ? { id: next.id, value: cloneAtom(next.value) }
        : null
    }
    this.state.cells[bounded - 1] = null
    for (let index = 0; index < bounded; index += 1) {
      this.pending.push({
        kind: 'cell',
        index,
        from: cellValue(before[index] ?? null),
        to: cellValue(index + 1 < bounded ? (before[index + 1] ?? null) : null),
      })
    }
  }

  setTape(tape: ArrayTape): void {
    this.state.tape = { ...tape }
  }

  clearTape(): void {
    delete this.state.tape
  }

  addConsole(text: string): void {
    this.output += text
  }

  setReturnValue(value: number): void {
    this.returnValue = value
  }

  clearReturnValue(): void {
    this.returnValue = undefined
  }

  incrementTraversed(amount = 1): void {
    this.traversed += amount
  }

  incrementComparisons(amount = 1): void {
    this.comparisons += amount
  }

  makeEval(expr: string, value: string): EvalEntry {
    return { expr, value }
  }

  step(fn: string, line: number, caption: string, extras: StepExtras = {}): void {
    const snapshot = deepFreeze(cloneSnapshot(this.state))
    const step: Step<ArraySnapshot> = {
      snapshot,
      fn,
      line,
      caption,
      changes: this.pending.map((change) => ({ ...change })),
      counters: { traversed: this.traversed, comparisons: this.comparisons },
      console: {
        output: this.output,
        ...(this.returnValue === undefined ? {} : { returnValue: this.returnValue }),
      },
      ...(extras.cond ? { cond: extras.cond } : {}),
      ...(extras.badge ? { badge: extras.badge } : {}),
      ...(extras.evals ? { evals: extras.evals } : {}),
    }
    this.collected.push(step)
    this.pending = []
  }

  finish(fn: string, endLine: number, caption?: string): Step<ArraySnapshot>[] {
    this.state.frames = []
    this.step(fn, endLine, caption ?? fr.staticStructures.captions.operationDone)
    return this.collected
  }
}
