import type {
  Badge,
  Change,
  EvalEntry,
  FrameState,
  PointerValue,
  Step,
  VarValue,
} from '../../../core/types'
import { fr } from '../../../i18n/fr'
import {
  clonePointer,
  cloneSnapshot,
  cloneVarValue,
  deepFreeze,
  formatAddress,
  pointerDescription,
  pointerDisplay,
  requireFileNode,
} from '../memory'
import type { FileNode, FileSnapshot, NodeLane } from '../memory'

interface StepExtras {
  cond?: { expr: string; result: boolean }
  badge?: Badge
  evals?: EvalEntry[]
}

export class FileRecorder {
  readonly state: FileSnapshot
  private collected: Step<FileSnapshot>[] = []
  private pending: Change[] = []
  private output = ''
  private returnValue: number | undefined
  private traversed = 0
  private comparisons = 0

  constructor(state: FileSnapshot) {
    this.state = cloneSnapshot(state) as FileSnapshot
    this.state.frames = []
  }

  get steps(): Step<FileSnapshot>[] {
    return this.collected
  }

  get activeFrame(): FrameState | undefined {
    return this.state.frames[this.state.frames.length - 1]
  }

  pushFrame(fn: string, vars: Record<string, VarValue> = {}): void {
    const cloned: Record<string, VarValue> = {}
    for (const [name, value] of Object.entries(vars)) cloned[name] = cloneVarValue(value)
    this.state.frames.push({ fn, vars: cloned })
  }

  popFrame(): void {
    this.state.frames.pop()
  }

  node(id: number): FileNode {
    return requireFileNode(this.state, id)
  }

  global(name: string): PointerValue {
    return this.state.globals[name as keyof FileSnapshot['globals']] ?? { kind: 'null' }
  }

  local(name: string): VarValue | undefined {
    return this.activeFrame?.vars[name]
  }

  describe(pointer: PointerValue): string {
    return pointerDescription(this.state, pointer)
  }

  display(pointer: PointerValue): string {
    return pointerDisplay(this.state, pointer)
  }

  setGlobal(name: string, value: PointerValue): void {
    const key = name as keyof FileSnapshot['globals']
    const from = this.state.globals[key] ?? { kind: 'null' }
    this.state.globals[key] = clonePointer(value)
    this.pending.push({
      kind: 'variable',
      scope: 'global',
      name,
      from: cloneVarValue(from),
      to: cloneVarValue(value),
    })
  }

  declareLocal(name: string, value: VarValue): void {
    const frameIndex = this.state.frames.length - 1
    const frame = this.state.frames[frameIndex]
    if (!frame) throw new Error('No active frame')
    const from = frame.vars[name] ?? { kind: 'uninit' }
    frame.vars[name] = cloneVarValue(value)
    this.pending.push({
      kind: 'variable',
      scope: 'local',
      frameIndex,
      name,
      from: cloneVarValue(from),
      to: cloneVarValue(value),
    })
  }

  setLocal(name: string, value: VarValue): void {
    const frameIndex = this.state.frames.length - 1
    const frame = this.state.frames[frameIndex]
    if (!frame) throw new Error('No active frame')
    const from = frame.vars[name] ?? { kind: 'uninit' }
    frame.vars[name] = cloneVarValue(value)
    this.pending.push({
      kind: 'variable',
      scope: 'local',
      frameIndex,
      name,
      from: cloneVarValue(from),
      to: cloneVarValue(value),
    })
  }

  setPointer(nodeId: number, field: 'suivant', value: PointerValue): void {
    const node = this.node(nodeId)
    const from = clonePointer(node[field])
    node[field] = clonePointer(value)
    this.pending.push({
      kind: 'pointer',
      nodeId,
      field,
      from,
      to: clonePointer(value),
    })
  }

  setValue(nodeId: number, value: number): void {
    this.node(nodeId).value = value
  }

  mallocNode(targetSlot: number): number {
    const id = this.state.nextNodeId
    const address = formatAddress(this.state.nextAddressIndex)
    const node: FileNode = {
      id,
      address,
      value: null,
      suivant: { kind: 'uninit' },
      freed: false,
      slot: targetSlot,
      lane: 'heap',
    }
    this.state.nodes.push(node)
    this.state.nextNodeId += 1
    this.state.nextAddressIndex += 1
    this.pending.push({ kind: 'create', nodeId: id })
    return id
  }

  freeNode(id: number): void {
    this.node(id).freed = true
    this.pending.push({ kind: 'free', nodeId: id })
  }

  moveNode(id: number, slot: number, lane: NodeLane): void {
    const node = this.node(id)
    if (node.slot === slot && node.lane === lane) return
    node.slot = slot
    node.lane = lane
    this.pending.push({ kind: 'layout', nodeId: id, slot, lane })
  }

  insertRowNode(id: number, index: number): void {
    const node = this.node(id)
    for (const other of this.state.nodes) {
      if (other.id === id || other.lane !== 'row') continue
      if (other.slot >= index) {
        other.slot += 1
        this.pending.push({
          kind: 'layout',
          nodeId: other.id,
          slot: other.slot,
          lane: other.lane,
        })
      }
    }
    node.lane = 'row'
    node.slot = index
    this.pending.push({ kind: 'layout', nodeId: id, slot: index, lane: 'row' })
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

  incrementTraversed(): void {
    this.traversed += 1
  }

  incrementComparisons(): void {
    this.comparisons += 1
  }

  makeEval(expr: string, pointer: PointerValue): EvalEntry {
    return {
      expr,
      value: pointerDescription(this.state, pointer),
      ...(pointer.kind === 'node' ? { nodeId: pointer.id } : {}),
    }
  }

  step(fn: string, line: number, caption: string, extras: StepExtras = {}): void {
    const snapshot = deepFreeze(cloneSnapshot(this.state) as FileSnapshot)
    const step: Step<FileSnapshot> = {
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

  finish(fn: string, endLine: number, endCaption?: string): Step<FileSnapshot>[] {
    const hadFreed = this.state.nodes.some((node) => node.freed)
    this.state.frames = []
    this.removeFreed()
    this.step(fn, endLine, endCaption ?? fr.captions.operationDone(hadFreed))
    return this.collected
  }

  private removeFreed(): void {
    const freed = this.state.nodes.filter((node) => node.freed)
    if (freed.length > 0) {
      for (const node of freed) this.pending.push({ kind: 'remove', nodeId: node.id })
      this.state.nodes = this.state.nodes.filter((node) => !node.freed)
    }
    const row = this.state.nodes
      .filter((node) => node.lane === 'row')
      .sort((a, b) => a.slot - b.slot)
    row.forEach((node, index) => {
      if (node.slot !== index) {
        node.slot = index
        this.pending.push({ kind: 'layout', nodeId: node.id, slot: index, lane: node.lane })
      }
    })
  }
}
