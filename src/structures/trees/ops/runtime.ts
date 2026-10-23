import type { Change, FrameState, PointerValue, Step, VarValue } from '../../../core/types'
import {
  clonePointer,
  cloneSnapshot,
  cloneVarValue,
  deepFreeze,
  formatAddress,
  requireNode,
} from '../memory'
import type { TreeNode, TreeSnapshot } from '../memory'
import type { TreeTraversalState } from '../memory'

interface StepExtras {
  cond?: { expr: string; result: boolean }
}

export class TreeRecorder {
  readonly state: TreeSnapshot
  private readonly collected: Step<TreeSnapshot>[] = []
  private pending: Change[] = []
  private output = ''
  private traversed = 0
  private comparisons = 0

  constructor(state: TreeSnapshot) {
    this.state = cloneSnapshot(state)
    this.state.frames = []
  }

  get steps(): Step<TreeSnapshot>[] {
    return this.collected
  }

  get activeFrame(): FrameState | undefined {
    return this.state.frames[this.state.frames.length - 1]
  }

  pushFrame(fn: string, vars: Record<string, VarValue> = {}): void {
    const copied: Record<string, VarValue> = {}
    for (const [name, value] of Object.entries(vars)) copied[name] = cloneVarValue(value)
    this.state.frames.push({ fn, vars: copied })
  }

  popFrame(): void {
    this.state.frames.pop()
  }

  allocateNode(): TreeNode {
    const node: TreeNode = {
      id: this.state.nextNodeId,
      address: formatAddress(this.state.nextAddressIndex),
      payload: { kind: 'uninit' },
      gauche: { kind: 'uninit' },
      droit: { kind: 'uninit' },
      freed: false,
    }
    this.state.nextNodeId += 1
    this.state.nextAddressIndex += 1
    this.state.nodes.push(node)
    this.pending.push({ kind: 'create', nodeId: node.id })
    return node
  }

  setPayload(nodeId: number, value: number): void {
    requireNode(this.state, nodeId).payload = { kind: 'int', value }
  }

  setGlobal(name: string, value: PointerValue): void {
    const from = this.state.globals[name] ?? { kind: 'null' as const }
    this.state.globals[name] = clonePointer(value)
    this.pending.push({
      kind: 'variable',
      scope: 'global',
      name,
      from: cloneVarValue(from),
      to: cloneVarValue(value),
    })
  }

  setChild(nodeId: number, field: 'gauche' | 'droit', value: PointerValue): void {
    const node = requireNode(this.state, nodeId)
    const from = clonePointer(node[field])
    node[field] = clonePointer(value)
    this.pending.push({ kind: 'pointer', nodeId, field, from, to: clonePointer(value) })
  }

  declareLocal(name: string, value: VarValue): void {
    const index = this.state.frames.length - 1
    const frame = this.state.frames[index]
    if (!frame) throw new Error('No active tree frame')
    const from = frame.vars[name] ?? { kind: 'uninit' as const }
    frame.vars[name] = cloneVarValue(value)
    this.pending.push({
      kind: 'variable',
      scope: 'local',
      frameIndex: index,
      name,
      from: cloneVarValue(from),
      to: cloneVarValue(value),
    })
  }

  setLocal(name: string, value: VarValue): void {
    this.declareLocal(name, value)
  }

  freeNode(nodeId: number): void {
    const node = requireNode(this.state, nodeId)
    node.freed = true
    this.pending.push({ kind: 'free', nodeId })
  }

  addConsole(text: string): void {
    this.output += text
  }

  incrementTraversed(): void {
    this.traversed += 1
  }

  beginTraversal(): void {
    this.state.traversal = { visitedNodeIds: [], activeNodeId: null }
  }

  recordVisit(nodeId: number): void {
    const traversal = this.state.traversal
    if (!traversal || traversal.visitedNodeIds.includes(nodeId)) return
    traversal.visitedNodeIds.push(nodeId)
  }

  private activeTraversalNode(): number | null {
    const value = this.activeFrame?.vars.n
    return value?.kind === 'node' ? value.id : null
  }

  step(fn: string, line: number, caption: string, extras: StepExtras = {}): void {
    const traversal: TreeTraversalState | null = this.state.traversal
    if (traversal) traversal.activeNodeId = this.activeTraversalNode()
    const step: Step<TreeSnapshot> = {
      snapshot: deepFreeze(cloneSnapshot(this.state)),
      fn,
      line,
      caption,
      changes: this.pending,
      counters: { traversed: this.traversed, comparisons: this.comparisons },
      console: { output: this.output },
      ...(extras.cond ? { cond: extras.cond } : {}),
    }
    this.collected.push(deepFreeze(step))
    this.pending = []
  }
}

export const NULL_POINTER: PointerValue = { kind: 'null' }
export const NODE_POINTER = (id: number): PointerValue => ({ kind: 'node', id })

export function pointerFrom(value: VarValue | undefined): PointerValue {
  return value && (value.kind === 'node' || value.kind === 'null' || value.kind === 'uninit')
    ? value
    : NULL_POINTER
}

export function pointerValue(id: number | null): PointerValue {
  return id === null ? NULL_POINTER : NODE_POINTER(id)
}
