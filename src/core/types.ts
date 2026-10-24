import type { ComponentType } from 'react'

export type NodePointer = { kind: 'node'; id: number }
export type NullPointer = { kind: 'null' }
export type UninitPointer = { kind: 'uninit' }
export type NodeOrNullPointer = NodePointer | NullPointer

export type PointerValue = NodePointer | NullPointer | UninitPointer

export interface StudentValue {
  numero: number
  nom: string
  prenom: string
}

export type VarValue =
  | PointerValue
  | { kind: 'int'; value: number }
  | { kind: 'student'; value: StudentValue }

/** Primitive stored in a fixed-size array (chapter 1). */
export type CellValue = number | string | null

export interface FrameState {
  fn: string
  vars: Record<string, VarValue>
  /** Human-readable call, e.g. `detruireArbre(80)`; used by the breadcrumb. */
  callLabel?: string
}

export interface BaseSnapshot {
  globals: Record<string, VarValue>
  frames: FrameState[]
}

export type Change =
  | {
      kind: 'pointer'
      nodeId: number
      field: string
      from: PointerValue
      to: PointerValue
    }
  | {
      kind: 'variable'
      scope: 'global' | 'local'
      frameIndex?: number
      name: string
      from: VarValue
      to: VarValue
    }
  | { kind: 'create'; nodeId: number }
  | { kind: 'free'; nodeId: number }
  | { kind: 'layout'; nodeId: number; slot: number; lane: string }
  | { kind: 'remove'; nodeId: number }
  | {
      kind: 'cell'
      index: number
      from: CellValue
      to: CellValue
    }

export interface EvalEntry {
  expr: string
  value: string
  nodeId?: number
}

export type Badge = 'cas-particulier' | 'debut-modifie'

export interface Counters {
  traversed: number
  comparisons: number
}

export interface ConsoleState {
  output: string
  returnValue?: number
}

export interface Step<S extends BaseSnapshot = BaseSnapshot> {
  snapshot: S
  fn: string
  line: number
  caption: string
  changes: Change[]
  cond?: { expr: string; result: boolean }
  evals?: EvalEntry[]
  badge?: Badge
  counters: Counters
  console: ConsoleState
}

export interface CodeSource {
  fn: string
  lines: string[]
  labels: Record<string, number>
}

export type ParamValue = string | number
export type ParamValues = Record<string, ParamValue>

export interface ParamDef {
  name: string
  kind: 'number' | 'text'
  label: string
  defaultValue: ParamValue
  target?: boolean
}

export interface OperationDef<S extends BaseSnapshot> {
  id: string
  label: string
  params: ParamDef[]
  complexity: string
  complexityNote: string
  inserts: boolean
  /** Enables a structure-specific recursive call-stack teaching panel. */
  showCallStack?: boolean
  run: (state: S, params: ParamValues) => Step<S>[]
}

export interface ScenarioStep<S extends BaseSnapshot> {
  operationId: string
  params: ParamValues
  stateBefore?: S
}

export interface ScenarioDef<S extends BaseSnapshot> {
  id: string
  title: string
  description: string
  profileId: string
  state: S
  steps: ScenarioStep<S>[]
}

export interface CounterLabels {
  traversed?: string
  comparisons?: string
}

export interface ProfileDef<S extends BaseSnapshot> {
  id: string
  label: string
  maxNodes: number
  initialState: () => S
  operations: OperationDef<S>[]
  scenarios: ScenarioDef<S>[]
  code: Record<string, CodeSource>
  typesCode: CodeSource
  /** Operation selected when the profile is opened. Defaults to the first operation. */
  defaultOperationId?: string
  /** Operation suggested when the user clicks the empty-state insertion button. */
  emptyInsertOperationId?: string
  /** Replaces the generic console counter labels for this profile. */
  counterLabels?: CounterLabels
}

export interface VisualizationProps<S extends BaseSnapshot> {
  snapshot: S
  step: Step<S>
  prevStep: Step<S> | null
  operationSteps?: Step<S>[]
  cameraResetKey?: number
  callText?: string
  /** Optional secondary focus, supplied by a companion teaching panel. */
  highlightedNodeId?: number | null
  onNodeClick?: (nodeId: number) => void
  onEmptyInsert?: () => void
  presentation: boolean
  speed: number
  stepIndex: number
}

export interface StructurePlugin<S extends BaseSnapshot> {
  id: string
  /** Chapter number in the course: drives the menu badge and the `#/chapitre-<n>` route. */
  chapter: number
  title: string
  /** One-line French description shown on the main menu card (text lives in i18n). */
  description: string
  profiles: ProfileDef<S>[]
  Visualization: ComponentType<VisualizationProps<S>>
  countNodes: (snapshot: S) => number
  formatValue: (snapshot: S, value: VarValue) => string
  nodeKey: (snapshot: S, nodeId: number) => ParamValue
  /** Label above the profile switch. Defaults to `fr.profiles.label`. */
  profileSwitchLabel?: string
  /** One-line summary used by the collapsed bottom dock. */
  summarize?: (snapshot: S) => string
}
