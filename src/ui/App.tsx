import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, JSX } from 'react'
import { Player } from '../core/player'
import type {
  BaseSnapshot,
  OperationDef,
  ParamValues,
  ScenarioDef,
  Step,
  StructurePlugin,
} from '../core/types'
import { fr } from '../i18n/fr'
import { CaptionPanel } from './CaptionPanel'
import { CallStackPanel } from './CallStackPanel'
import type { CallStackFocus } from './CallStackPanel'
import { CodePanel } from './CodePanel'
import { BottomDock } from './BottomDock'
import { Controls } from './Controls'
import { Header } from './Header'
import { OperationBar } from './OperationBar'
import { SplitHandle } from './SplitHandle'
import { defaultOperation, defaultParams, formatCall } from './operations'
import {
  DEFAULT_LAYOUT,
  WORKSPACE_MAX_SPLIT,
  WORKSPACE_MIN_LEFT,
  WORKSPACE_MIN_RIGHT,
  WORKSPACE_MIN_RIGHT_PRESENTATION,
  WORKSPACE_MIN_SPLIT,
  clamp,
  readLayout,
  writeLayout,
} from './layout'
import type { LayoutPatch, LayoutState } from './layout'
import { ScenarioStrip } from './ScenarioStrip'
import { SiteFooter } from './SiteFooter'
import { usePlayerState } from './usePlayer'
import type { TreeSnapshot } from '../structures/trees/memory'

const WORKSPACE_SASH_SIZE = 7

interface ActiveOperation<S extends BaseSnapshot> {
  operation: OperationDef<S>
  params: ParamValues
  steps: Step<S>[]
  committed: boolean
  scenarioId?: string
  scenarioStepIndex?: number
}

interface ScenarioRun {
  scenarioId: string
  title: string
  total: number
  cursor: number
}

interface StartOptions<S extends BaseSnapshot> {
  state?: S
  scenarioId?: string
  scenarioStepIndex?: number
  autoPlay?: boolean
}

/** Popovers, dialogs and the journal drawer own the Escape key while open. */
const OVERLAY_SELECTOR = '[role="dialog"], [role="menu"], .journal-drawer, [aria-modal="true"]'

function hasOpenOverlay(): boolean {
  return typeof document !== 'undefined' && document.querySelector(OVERLAY_SELECTOR) !== null
}

function idleStep<S extends BaseSnapshot>(snapshot: S, fn: string): Step<S> {
  return {
    snapshot,
    fn,
    line: 0,
    caption: fr.captions.idle,
    changes: [],
    counters: { traversed: 0, comparisons: 0 },
    console: { output: '' },
  }
}

export function DemoApp<S extends BaseSnapshot>({
  plugin,
  theme,
  onTheme,
  onMenu,
}: {
  plugin: StructurePlugin<S>
  theme: 'light' | 'dark'
  onTheme: () => void
  onMenu: () => void
}): JSX.Element {
  const initialProfile = plugin.profiles[0]
  if (!initialProfile) throw new Error('The plugin must declare at least one profile')

  const initialScenario = initialProfile.defaultScenarioId
    ? initialProfile.scenarios.find(
        (scenario) => scenario.id === initialProfile.defaultScenarioId,
      )
    : undefined
  const [profileId, setProfileId] = useState(initialProfile.id)
  const profile = plugin.profiles.find((candidate) => candidate.id === profileId) ?? initialProfile
  const [committedState, setCommittedState] = useState<S>(
    () => initialScenario?.state ?? initialProfile.initialState(),
  )
  const initialOperation = defaultOperation(initialProfile)
  const [selectedId, setSelectedId] = useState(initialOperation?.id ?? '')
  const [paramValues, setParamValues] = useState<Record<string, string>>(() =>
    defaultParams(initialOperation),
  )
  const [journal, setJournal] = useState<string[]>([])
  const [dockCollapsed, setDockCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerHeight < 800,
  )
  const [layout, setLayout] = useState<LayoutState>(readLayout)
  const [activeOperation, setActiveOperation] = useState<ActiveOperation<S> | null>(null)
  const [scenarioRun, setScenarioRun] = useState<ScenarioRun | null>(() =>
    initialScenario
      ? {
          scenarioId: initialScenario.id,
          title: initialScenario.title,
          total: initialScenario.steps.length,
          cursor: 0,
        }
      : null,
  )
  const [presentation, setPresentation] = useState(false)
  const [simulationFullscreen, setSimulationFullscreen] = useState(false)
  const [cameraResetKey, setCameraResetKey] = useState(0)
  const [callStackFocus, setCallStackFocus] = useState<CallStackFocus | null>(null)
  const appRef = useRef<HTMLDivElement | null>(null)
  const workspaceRef = useRef<HTMLElement | null>(null)
  const codeColumnRef = useRef<HTMLDivElement | null>(null)
  const workspaceDragRef = useRef<{ left: number; usable: number } | null>(null)

  const player = useMemo(() => new Player<S>(), [])
  const playerState = usePlayerState(player)
  /**
   * The call-stack panel needs to know, in the same render as the new
   * snapshot, whether the transition came from a forward step. A state flag
   * set from an effect is one render too late, so the event handlers mark the
   * intent synchronously and the next render consumes it.
   */
  const stackMotionRef = useRef<'forward' | 'instant' | null>(null)
  const stackAnimate =
    stackMotionRef.current === 'forward' ||
    (playerState.playing && stackMotionRef.current !== 'instant')

  useEffect(() => {
    stackMotionRef.current = null
  }, [playerState.index, playerState.playing, playerState.total])

  useEffect(() => () => player.destroy(), [player])
  useEffect(() => {
    const handleFullscreenChange = (): void => {
      if (!document.fullscreenElement) setSimulationFullscreen(false)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    writeLayout(layout)
  }, [layout])

  const updateLayout = useCallback((patch: LayoutPatch) => {
    setLayout((current) => ({ ...current, ...patch }))
  }, [])

  const beginWorkspaceDrag = useCallback(() => {
    const workspaceWidth = workspaceRef.current?.getBoundingClientRect().width ?? 0
    const codeWidth = codeColumnRef.current?.getBoundingClientRect().width ?? 0
    const usable =
      workspaceWidth > WORKSPACE_SASH_SIZE ? workspaceWidth - WORKSPACE_SASH_SIZE : 1000
    const left = codeWidth > 0 ? usable - codeWidth : usable * (layout.workspaceSplit / 100)
    workspaceDragRef.current = { left, usable }
    const measuredSplit = clamp((left / usable) * 100, WORKSPACE_MIN_SPLIT, WORKSPACE_MAX_SPLIT)
    if (Math.abs(measuredSplit - layout.workspaceSplit) > 0.25) {
      updateLayout({ workspaceSplit: measuredSplit })
    }
  }, [layout.workspaceSplit, updateLayout])

  const resizeWorkspace = useCallback(
    (delta: number) => {
      const drag = workspaceDragRef.current
      if (!drag) return
      const minRight = presentation ? WORKSPACE_MIN_RIGHT_PRESENTATION : WORKSPACE_MIN_RIGHT
      const maxLeft = Math.max(WORKSPACE_MIN_LEFT, drag.usable - minRight)
      const left = clamp(drag.left + delta, WORKSPACE_MIN_LEFT, maxLeft)
      const split = clamp((left / drag.usable) * 100, WORKSPACE_MIN_SPLIT, WORKSPACE_MAX_SPLIT)
      updateLayout({ workspaceSplit: split })
    },
    [presentation, updateLayout],
  )

  const resetWorkspace = useCallback(() => {
    workspaceDragRef.current = null
    updateLayout({ workspaceSplit: DEFAULT_LAYOUT.workspaceSplit })
  }, [updateLayout])

  const workspaceStyle = {
    '--workspace-left-fr': `${layout.workspaceSplit}fr`,
    '--workspace-right-fr': `${100 - layout.workspaceSplit}fr`,
  } as CSSProperties

  const selectedOperation =
    profile.operations.find((candidate) => candidate.id === selectedId) ??
    defaultOperation(profile)
  const idle = useMemo(
    () => idleStep(committedState, selectedOperation?.id ?? ''),
    [committedState, selectedOperation?.id],
  )

  const currentStep =
    playerState.total > 0 ? (player.steps[playerState.index] ?? idle) : idle
  const prevStep =
    playerState.total > 0 && playerState.index > 0
      ? (player.steps[playerState.index - 1] ?? null)
      : null

  const operationActive =
    activeOperation !== null &&
    playerState.total > 0 &&
    playerState.index < playerState.total - 1
  const listCount = plugin.countNodes(currentStep.snapshot)
  const hasPreviewParam =
    selectedOperation?.params.some((param) => {
      const value = paramValues[param.name]
      return value !== undefined && String(value).trim() !== ''
    }) ?? false
  const previewCall =
    playerState.total === 0 &&
    selectedOperation &&
    !(listCount === 0 && !hasPreviewParam)
      ? formatCall(selectedOperation, paramValues)
      : undefined
  const previewComplexity = previewCall ? selectedOperation?.complexityNote : undefined
  const maxed = Boolean(selectedOperation?.inserts && plugin.countNodes(committedState) >= profile.maxNodes)
  const activeCall = activeOperation
    ? formatCall(activeOperation.operation, activeOperation.params)
    : undefined
  const callStackVisible = Boolean(activeOperation?.operation.showCallStack)
  const globalsText =
    Object.entries(currentStep.snapshot.globals)
      .map(([name, value]) => `${name} = ${plugin.formatValue(currentStep.snapshot, value)}`)
      .join(' · ') || '—'
  const summaryText = plugin.summarize?.(currentStep.snapshot) ?? globalsText
  const outputText = currentStep.console.output.trim().replace(/\s+/g, ' ') || '—'
  const dockSummary = `${summaryText} · sortie : « ${outputText} » · journal : ${journal.length}`

  useEffect(() => {
    if (!activeOperation || activeOperation.committed) return
    if (playerState.total === 0 || playerState.index !== playerState.total - 1) return
    const lastStep = player.steps[player.steps.length - 1]
    if (!lastStep) return

    setCommittedState(lastStep.snapshot)
    setJournal((entries) => [...entries, formatCall(activeOperation.operation, activeOperation.params)])
    setActiveOperation((current) =>
      current && !current.committed ? { ...current, committed: true } : current,
    )

    const scenarioId = activeOperation.scenarioId
    const scenarioStepIndex = activeOperation.scenarioStepIndex
    if (scenarioId !== undefined && scenarioStepIndex !== undefined) {
      setScenarioRun((current) =>
        current && current.scenarioId === scenarioId && current.cursor === scenarioStepIndex
          ? { ...current, cursor: current.cursor + 1 }
          : current,
      )
    }
  }, [activeOperation, player, playerState.index, playerState.total])

  const allScenarios = useMemo(
    () => plugin.profiles.flatMap((candidate) => candidate.scenarios),
    [plugin.profiles],
  )
  const activeScenario = scenarioRun
    ? allScenarios.find((scenario) => scenario.id === scenarioRun.scenarioId)
    : undefined
  const nextScenarioStep =
    activeScenario && scenarioRun && scenarioRun.cursor < activeScenario.steps.length
      ? activeScenario.steps[scenarioRun.cursor]
      : undefined
  const nextScenarioOperation = nextScenarioStep
    ? profile.operations.find((operation) => operation.id === nextScenarioStep.operationId)
    : undefined
  const nextScenarioCall =
    nextScenarioStep && nextScenarioOperation
      ? formatCall(nextScenarioOperation, nextScenarioStep.params)
      : undefined

  const startOperation = useCallback(
    (operation: OperationDef<S>, params: ParamValues, options: StartOptions<S> = {}) => {
      const base = options.state ?? committedState
      const steps = operation.run(base, params)
      if (steps.length === 0) return
      stackMotionRef.current = 'forward'
      setCallStackFocus(null)
      player.load(steps)
      const next: ActiveOperation<S> = {
        operation,
        params,
        steps,
        committed: false,
        ...(options.scenarioId === undefined ? {} : { scenarioId: options.scenarioId }),
        ...(options.scenarioStepIndex === undefined
          ? {}
          : { scenarioStepIndex: options.scenarioStepIndex }),
      }
      setActiveOperation(next)
      if (options.autoPlay) player.play()
    },
    [committedState, player],
  )

  const execute = useCallback(() => {
    if (!selectedOperation || operationActive) return
    if (selectedOperation.inserts && plugin.countNodes(committedState) >= profile.maxNodes) return
    startOperation(selectedOperation, paramValues, { autoPlay: true })
  }, [
    committedState,
    operationActive,
    paramValues,
    plugin,
    profile.maxNodes,
    selectedOperation,
    startOperation,
  ])

  const selectOperation = useCallback(
    (id: string) => {
      player.clear()
      setActiveOperation(null)
      setCallStackFocus(null)
      setSelectedId(id)
      const operation = profile.operations.find((candidate) => candidate.id === id)
      setParamValues(defaultParams(operation))
    },
    [player, profile.operations],
  )

  const insertFromEmpty = useCallback(() => {
    const operationId = profile.emptyInsertOperationId ?? 'insererEnTete'
    const operation = profile.operations.find((candidate) => candidate.id === operationId)
    if (!operation) return
    selectOperation(operation.id)
    requestAnimationFrame(() => {
      document.querySelector<HTMLInputElement>('.operation-bar input')?.focus()
    })
  }, [profile.emptyInsertOperationId, profile.operations, selectOperation])

  const changeParam = useCallback((name: string, value: string) => {
    setParamValues((current) => ({ ...current, [name]: value }))
  }, [])

  const handleNodeClick = useCallback(
    (nodeId: number) => {
      const target = selectedOperation?.params.find((param) => param.target)
      if (!target) return
      const key = plugin.nodeKey(currentStep.snapshot, nodeId)
      setParamValues((current) => ({ ...current, [target.name]: String(key) }))
    },
    [currentStep.snapshot, plugin, selectedOperation],
  )

  const toggleSimulationFullscreen = useCallback(() => {
    const next = !simulationFullscreen
    setSimulationFullscreen(next)
    if (next) {
      if (appRef.current?.requestFullscreen && !document.fullscreenElement) {
        void appRef.current.requestFullscreen().catch(() => undefined)
      }
    } else if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined)
    }
  }, [simulationFullscreen])

  const finishOperation = useCallback(() => {
    stackMotionRef.current = 'instant'
    player.last()
  }, [player])

  const nextStep = useCallback(() => {
    stackMotionRef.current = 'forward'
    player.next()
  }, [player])

  const stepBack = useCallback(() => {
    stackMotionRef.current = 'instant'
    player.prev()
  }, [player])

  const firstStep = useCallback(() => {
    stackMotionRef.current = 'instant'
    player.first()
  }, [player])

  const togglePlayback = useCallback(() => {
    stackMotionRef.current = player.state.playing ? 'instant' : 'forward'
    player.toggle()
  }, [player])

  const goToStep = useCallback(
    (index: number) => {
      stackMotionRef.current = 'instant'
      player.goto(index)
    },
    [player],
  )

  const cancelOperation = useCallback(() => {
    player.clear()
    setActiveOperation(null)
    setCallStackFocus(null)
  }, [player])

  const resetAll = useCallback(() => {
    if (!window.confirm(fr.journal.confirmReset)) return
    player.clear()
    setCommittedState(profile.initialState())
    setJournal([])
    setActiveOperation(null)
    setCallStackFocus(null)
    setScenarioRun(null)
    setParamValues(defaultParams(selectedOperation))
    setCameraResetKey((key) => key + 1)
  }, [player, profile, selectedOperation])

  const switchProfile = useCallback(
    (nextId: string) => {
      const nextProfile = plugin.profiles.find((candidate) => candidate.id === nextId)
      if (!nextProfile || nextProfile.id === profileId) return
      const operation = defaultOperation(nextProfile)
      player.clear()
      setProfileId(nextProfile.id)
      setCommittedState(nextProfile.initialState())
      setSelectedId(operation?.id ?? '')
      setParamValues(defaultParams(operation))
      setJournal([])
      setActiveOperation(null)
      setCallStackFocus(null)
      setScenarioRun(null)
      setCameraResetKey((key) => key + 1)
    },
    [player, plugin.profiles, profileId],
  )

  const loadScenario = useCallback(
    (scenario: ScenarioDef<S>) => {
      const targetProfile =
        plugin.profiles.find((candidate) => candidate.id === scenario.profileId) ?? profile
      const operation = defaultOperation(targetProfile)
      player.clear()
      setProfileId(targetProfile.id)
      setCommittedState(scenario.state)
      setSelectedId(operation?.id ?? '')
      setParamValues(defaultParams(operation))
      setJournal([])
      setActiveOperation(null)
      setCallStackFocus(null)
      setScenarioRun({
        scenarioId: scenario.id,
        title: scenario.title,
        total: scenario.steps.length,
        cursor: 0,
      })
      setCameraResetKey((key) => key + 1)
    },
    [player, plugin.profiles, profile],
  )

  const quitScenario = useCallback(() => {
    player.clear()
    setActiveOperation(null)
    setCallStackFocus(null)
    setScenarioRun(null)
  }, [player])

  const replayScenario = useCallback(() => {
    if (activeScenario) loadScenario(activeScenario)
  }, [activeScenario, loadScenario])

  const runScenarioStep = useCallback(() => {
    if (!scenarioRun || !activeScenario || operationActive) return
    const step = activeScenario.steps[scenarioRun.cursor]
    if (!step) return
    const operation = profile.operations.find((candidate) => candidate.id === step.operationId)
    if (!operation) return

    let base = committedState
    if (step.stateBefore) {
      base = step.stateBefore
      setCommittedState(base)
      setJournal((entries) => [...entries, fr.journal.resetMarker])
    }

    startOperation(operation, step.params, {
      state: base,
      scenarioId: activeScenario.id,
      scenarioStepIndex: scenarioRun.cursor,
    })
  }, [
    activeScenario,
    committedState,
    operationActive,
    profile.operations,
    scenarioRun,
    startOperation,
  ])

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (
          tag === 'INPUT' ||
          tag === 'SELECT' ||
          tag === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }
        const buttonLike = tag === 'BUTTON' || tag === 'A' || target.closest('[role="button"]')
        if (buttonLike && (event.key === ' ' || event.key === 'Enter')) return
      }

      switch (event.key) {
        case 'Escape':
          // Popovers handle Escape on `document` first and call preventDefault.
          // A dialog they close synchronously is already out of the DOM when
          // this `window` listener runs, so both checks are needed.
          if (event.defaultPrevented || hasOpenOverlay()) return
          if (simulationFullscreen) {
            event.preventDefault()
            setSimulationFullscreen(false)
            if (document.fullscreenElement) {
              void document.exitFullscreen().catch(() => undefined)
            }
            break
          }
          event.preventDefault()
          onMenu()
          break
        case 'ArrowRight':
          event.preventDefault()
          nextStep()
          break
        case 'ArrowLeft':
          event.preventDefault()
          stepBack()
          break
        case ' ':
          event.preventDefault()
          togglePlayback()
          break
        case 'Home':
          event.preventDefault()
          firstStep()
          break
        case 'End':
          event.preventDefault()
          finishOperation()
          break
        case 'ArrowUp':
          event.preventDefault()
          player.faster()
          break
        case 'ArrowDown':
          event.preventDefault()
          player.slower()
          break
        case 'd':
        case 'D':
          if (!event.repeat) setDockCollapsed((value) => !value)
          break
        case 'p':
        case 'P':
          if (!event.repeat) setPresentation((value) => !value)
          break
        case 'r':
        case 'R':
          resetAll()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [finishOperation, firstStep, nextStep, stepBack, resetAll, simulationFullscreen, onMenu, togglePlayback])

  const appClassName = [
    'app',
    'has-footer',
    presentation ? 'presentation' : '',
    simulationFullscreen ? 'simulation-fullscreen' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={appRef} className={appClassName}>
      <Header
        plugin={plugin}
        profileId={profile.id}
        onProfile={switchProfile}
        theme={theme}
        onTheme={onTheme}
        onMenu={onMenu}
        presentation={presentation}
        onPresentation={() => setPresentation((value) => !value)}
        scenarios={allScenarios}
        currentScenarioId={scenarioRun?.scenarioId}
        onLoadScenario={loadScenario}
      />

      <main ref={workspaceRef} className="workspace" style={workspaceStyle}>
        <div className="left-column" id="workspace-main">
          <section className="panel viz-card">
            {operationActive ? (
              <span
                className={`operation-status ${playerState.playing ? 'is-running' : 'is-paused'}`}
                role="status"
              >
                {playerState.playing ? fr.operation.inProgress : fr.operation.paused}
              </span>
            ) : null}
            <plugin.Visualization
              snapshot={currentStep.snapshot}
              step={currentStep}
              prevStep={prevStep}
              onNodeClick={handleNodeClick}
              onEmptyInsert={insertFromEmpty}
              presentation={presentation}
              speed={playerState.speed}
              stepIndex={playerState.index}
              animate={stackAnimate}
              highlightedNodeId={callStackFocus?.nodeId}
              operationSteps={
                activeOperation && !activeOperation.committed ? activeOperation.steps : undefined
              }
              cameraResetKey={cameraResetKey}
              callText={activeCall}
            />
            <CaptionPanel
              step={currentStep}
              previewCall={previewCall}
              previewComplexity={previewComplexity}
            />
          </section>

          <Controls
            state={playerState}
            onFirst={firstStep}
            onPrev={stepBack}
            onToggle={togglePlayback}
            onNext={nextStep}
            onLast={finishOperation}
            onGoto={goToStep}
            onSpeed={(speed) => player.setSpeed(speed)}
            fullscreen={simulationFullscreen}
            onFullscreen={toggleSimulationFullscreen}
          />

          <OperationBar
            profile={profile}
            selectedOp={selectedOperation}
            selectedId={selectedOperation?.id ?? ''}
            paramValues={paramValues}
            onSelect={selectOperation}
            onParam={changeParam}
            onExecute={execute}
            onFinish={finishOperation}
            onCancel={cancelOperation}
            operationActive={operationActive}
            operationFinished={Boolean(activeOperation?.committed)}
            listCount={listCount}
            maxed={maxed}
          />

          {scenarioRun && activeScenario ? (
            <ScenarioStrip
              title={scenarioRun.title}
              cursor={scenarioRun.cursor}
              total={scenarioRun.total}
              nextCall={nextScenarioCall}
              done={activeScenario.steps.length > 0 && scenarioRun.cursor >= activeScenario.steps.length}
              empty={activeScenario.steps.length === 0}
              onNext={runScenarioStep}
              onQuit={quitScenario}
              onReplay={replayScenario}
              onClose={quitScenario}
              disabled={operationActive}
            />
          ) : null}
        </div>

        <SplitHandle
          orientation="vertical"
          className="workspace-sash"
          label={fr.dock.resizeWorkspace}
          value={layout.workspaceSplit}
          min={WORKSPACE_MIN_SPLIT}
          max={WORKSPACE_MAX_SPLIT}
          valueText={fr.dock.percentValue(layout.workspaceSplit)}
          controls="workspace-main workspace-code"
          onDragStart={beginWorkspaceDrag}
          onDrag={resizeWorkspace}
          onDragEnd={() => {
            workspaceDragRef.current = null
          }}
          onReset={resetWorkspace}
        />

        <div
          ref={codeColumnRef}
          className={`right-column${callStackVisible ? ' has-call-stack' : ''}`}
          id="workspace-code"
        >
          <CodePanel
            profile={profile}
            step={currentStep}
            presentation={presentation}
            hideBreadcrumb={callStackVisible}
            secondaryLine={
              callStackFocus ? { fn: callStackFocus.fn, line: callStackFocus.line } : null
            }
          />
          {plugin.SupportingPanels ? (
            <plugin.SupportingPanels
              snapshot={currentStep.snapshot}
              step={currentStep}
              presentation={presentation}
            />
          ) : null}
          {callStackVisible ? (
            <CallStackPanel
              snapshot={currentStep.snapshot as unknown as TreeSnapshot}
              callStack={(currentStep.snapshot as unknown as TreeSnapshot).callStack}
              speed={playerState.speed}
              animate={stackAnimate}
              onFrameFocus={setCallStackFocus}
            />
          ) : null}
        </div>
      </main>

      <BottomDock
        plugin={plugin}
        step={currentStep}
        stepIndex={playerState.index}
        journal={journal}
        presentation={presentation}
        collapsed={dockCollapsed}
        summary={dockSummary}
        layout={layout}
        counterLabels={profile.counterLabels}
        onToggle={() => setDockCollapsed((value) => !value)}
        onReset={resetAll}
        onLayoutChange={updateLayout}
      />

      <SiteFooter />
    </div>
  )
}
