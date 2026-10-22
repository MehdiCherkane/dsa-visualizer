import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
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
import { CodePanel } from './CodePanel'
import { BottomDock } from './BottomDock'
import { Controls } from './Controls'
import { Header } from './Header'
import { OperationBar } from './OperationBar'
import { defaultOperation, defaultParams, formatCall } from './operations'
import { ScenarioStrip } from './ScenarioStrip'
import { usePlayerState } from './usePlayer'

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

  const [profileId, setProfileId] = useState(initialProfile.id)
  const profile = plugin.profiles.find((candidate) => candidate.id === profileId) ?? initialProfile
  const [committedState, setCommittedState] = useState<S>(() => initialProfile.initialState())
  const initialOperation = defaultOperation(initialProfile)
  const [selectedId, setSelectedId] = useState(initialOperation?.id ?? '')
  const [paramValues, setParamValues] = useState<Record<string, string>>(() =>
    defaultParams(initialOperation),
  )
  const [journal, setJournal] = useState<string[]>([])
  const [dockCollapsed, setDockCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerHeight < 800,
  )
  const [activeOperation, setActiveOperation] = useState<ActiveOperation<S> | null>(null)
  const [scenarioRun, setScenarioRun] = useState<ScenarioRun | null>(null)
  const [presentation, setPresentation] = useState(false)
  const [simulationFullscreen, setSimulationFullscreen] = useState(false)
  const [cameraResetKey, setCameraResetKey] = useState(0)
  const appRef = useRef<HTMLDivElement | null>(null)

  const player = useMemo(() => new Player<S>(), [])
  const playerState = usePlayerState(player)

  useEffect(() => () => player.destroy(), [player])
  useEffect(() => {
    const handleFullscreenChange = (): void => {
      if (!document.fullscreenElement) setSimulationFullscreen(false)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

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
  const debutValue = currentStep.snapshot.globals.debut
  const debutText = debutValue ? plugin.formatValue(currentStep.snapshot, debutValue) : '—'
  const outputText = currentStep.console.output.trim().replace(/\s+/g, ' ') || '—'
  const dockSummary = `debut = ${debutText} · sortie : « ${outputText} » · journal : ${journal.length}`

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
      setSelectedId(id)
      const operation = profile.operations.find((candidate) => candidate.id === id)
      setParamValues(defaultParams(operation))
    },
    [player, profile.operations],
  )

  const insertFromEmpty = useCallback(() => {
    const operationId = profile.id === 'etudiant' ? 'inscrireEtudiant' : 'insererEnTete'
    const operation = profile.operations.find((candidate) => candidate.id === operationId)
    if (!operation) return
    selectOperation(operation.id)
    requestAnimationFrame(() => {
      document.querySelector<HTMLInputElement>('.operation-bar input')?.focus()
    })
  }, [profile.id, profile.operations, selectOperation])

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
    player.last()
  }, [player])

  const cancelOperation = useCallback(() => {
    player.clear()
    setActiveOperation(null)
  }, [player])

  const resetAll = useCallback(() => {
    if (!window.confirm(fr.journal.confirmReset)) return
    player.clear()
    setCommittedState(profile.initialState())
    setJournal([])
    setActiveOperation(null)
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
          player.next()
          break
        case 'ArrowLeft':
          event.preventDefault()
          player.prev()
          break
        case ' ':
          event.preventDefault()
          player.toggle()
          break
        case 'Home':
          event.preventDefault()
          player.first()
          break
        case 'End':
          event.preventDefault()
          player.last()
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
  }, [player, resetAll, simulationFullscreen, onMenu])

  const appClassName = [
    'app',
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

      <main className="workspace">
        <div className="left-column">
          <section className="panel viz-card">
            <plugin.Visualization
              snapshot={currentStep.snapshot}
              step={currentStep}
              prevStep={prevStep}
              onNodeClick={handleNodeClick}
              onEmptyInsert={insertFromEmpty}
              presentation={presentation}
              speed={playerState.speed}
              stepIndex={playerState.index}
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
            onFirst={() => player.first()}
            onPrev={() => player.prev()}
            onToggle={() => player.toggle()}
            onNext={() => player.next()}
            onLast={() => player.last()}
            onGoto={(index) => player.goto(index)}
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

        <div className="right-column">
          <CodePanel profile={profile} step={currentStep} presentation={presentation} />
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
        onToggle={() => setDockCollapsed((value) => !value)}
        onReset={resetAll}
      />
    </div>
  )
}
