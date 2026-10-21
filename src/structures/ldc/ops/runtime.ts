import type {
  Badge,
  Change,
  EvalEntry,
  FrameState,
  NodeOrNullPointer,
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
  getNode,
  payloadKey,
  pointerDescription,
  pointerDisplay,
  requireNode,
} from '../memory'
import type { LdcNode, LdcSnapshot, NodeLane, NodePayload, PointerField } from '../memory'

interface StepExtras {
  cond?: { expr: string; result: boolean }
  badge?: Badge
  evals?: EvalEntry[]
}

export class Recorder {
  readonly state: LdcSnapshot
  private collected: Step<LdcSnapshot>[] = []
  private pending: Change[] = []
  private output = ''
  private returnValue: number | undefined
  private traversed = 0
  private comparisons = 0

  constructor(state: LdcSnapshot) {
    this.state = cloneSnapshot(state)
    this.state.frames = []
  }

  get steps(): Step<LdcSnapshot>[] {
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

  node(id: number): LdcNode {
    return requireNode(this.state, id)
  }

  global(name: string): NodeOrNullPointer {
    const value = this.state.globals[name]
    if (!value || value.kind === 'uninit') return { kind: 'null' }
    return value
  }

  local(name: string): VarValue | undefined {
    const frame = this.activeFrame
    return frame?.vars[name]
  }

  describe(pointer: PointerValue): string {
    return pointerDescription(this.state, pointer)
  }

  display(pointer: PointerValue): string {
    return pointerDisplay(this.state, pointer)
  }

  setGlobal(name: string, value: PointerValue): void {
    const from = this.global(name)
    this.state.globals[name] = clonePointer(value)
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

  setPointer(nodeId: number, field: PointerField, value: PointerValue): void {
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

  setPayload(nodeId: number, payload: NodePayload): void {
    const node = this.node(nodeId)
    node.payload =
      payload.kind === 'student'
        ? { kind: 'student', student: { ...payload.student } }
        : { ...payload }
  }

  mallocNode(targetSlot: number): number {
    const id = this.state.nextNodeId
    const address = formatAddress(this.state.nextAddressIndex)
    const node: LdcNode = {
      id,
      address,
      payload: { kind: 'uninit' },
      suivant: { kind: 'uninit' },
      precedent: { kind: 'uninit' },
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
    const node = this.node(id)
    node.freed = true
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

  reverseRowLayout(): void {
    const row = this.state.nodes
      .filter((node) => node.lane === 'row')
      .sort((a, b) => a.slot - b.slot)
    const last = row.length - 1
    row.forEach((node, index) => {
      const slot = last - index
      if (node.slot !== slot) {
        node.slot = slot
        this.pending.push({ kind: 'layout', nodeId: node.id, slot, lane: node.lane })
      }
    })
  }

  addConsole(text: string): void {
    this.output += text
  }

  setReturnValue(value: number): void {
    this.returnValue = value
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
    const snapshot = deepFreeze(cloneSnapshot(this.state))
    const step: Step<LdcSnapshot> = {
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

  finish(fn: string, endLine: number): Step<LdcSnapshot>[] {
    const hadFreed = this.state.nodes.some((node) => node.freed)
    this.state.frames = []
    this.removeFreed()
    this.step(fn, endLine, fr.captions.operationDone(hadFreed))
    return this.collected
  }

  private removeFreed(): void {
    const freed = this.state.nodes.filter((node) => node.freed)
    if (freed.length > 0) {
      for (const node of freed) {
        this.pending.push({ kind: 'remove', nodeId: node.id })
      }
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

export function nodeValueLabel(node: LdcNode): string {
  const key = payloadKey(node)
  return key === null ? fr.common.uninit : String(key)
}

export function pointerToNode(snapshot: LdcSnapshot, pointer: PointerValue): LdcNode | null {
  if (pointer.kind !== 'node') return null
  return getNode(snapshot, pointer.id) ?? null
}
