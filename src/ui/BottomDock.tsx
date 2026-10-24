import { useRef } from 'react'
import type { CSSProperties, JSX } from 'react'
import type { BaseSnapshot, CounterLabels, Step, StructurePlugin } from '../core/types'
import { fr } from '../i18n/fr'
import { ConsolePanel } from './ConsolePanel'
import { PanelFocusButton } from './PanelFocusButton'
import { SplitHandle } from './SplitHandle'
import {
  DOCK_MAX_HEIGHT,
  DOCK_MIN_HEIGHT,
  DOCK_MIN_WIDTHS,
  DEFAULT_LAYOUT,
  clamp,
  defaultDockHeight,
  resizeAdjacent,
  toDockSplit,
  toPercentages,
} from './layout'
import type { DockPaneId, LayoutPatch, LayoutState } from './layout'
import { WatchPanel } from './WatchPanel'

interface BottomDockProps<S extends BaseSnapshot> {
  plugin: StructurePlugin<S>
  step: Step<S>
  stepIndex: number
  journal: string[]
  presentation: boolean
  collapsed: boolean
  summary: string
  layout: LayoutState
  counterLabels?: CounterLabels
  onToggle: () => void
  onReset: () => void
  onLayoutChange: (patch: LayoutPatch) => void
}

function dockMaxHeight(): number {
  if (typeof window === 'undefined') return DOCK_MAX_HEIGHT
  return Math.min(DOCK_MAX_HEIGHT, Math.max(DOCK_MIN_HEIGHT, window.innerHeight * 0.28))
}

export function BottomDock<S extends BaseSnapshot>({
  plugin,
  step,
  stepIndex,
  journal,
  presentation,
  collapsed,
  summary,
  layout,
  counterLabels,
  onToggle,
  onReset,
  onLayoutChange,
}: BottomDockProps<S>): JSX.Element {
  const dockRef = useRef<HTMLElement | null>(null)
  const panelsRef = useRef<HTMLDivElement | null>(null)
  const heightDragRef = useRef<number | null>(null)
  const splitDragRef = useRef<number[] | null>(null)

  const activeFocus =
    presentation && layout.focusedDockPane === 'journal' ? null : layout.focusedDockPane
  const showVariables = activeFocus === null || activeFocus === 'variables'
  const showConsole = activeFocus === null || activeFocus === 'console'
  const showJournal = !presentation && (activeFocus === null || activeFocus === 'journal')
  const visibleSplit = presentation ? toPercentages(layout.dockSplit.slice(0, 2)) : layout.dockSplit

  const dockStyle = {
    '--dock-height': `${layout.dockHeight}px`,
  } as CSSProperties
  const panelsStyle = {
    '--dock-fr-1': `${layout.dockSplit[0]}fr`,
    '--dock-fr-2': `${layout.dockSplit[1]}fr`,
    '--dock-fr-3': `${layout.dockSplit[2]}fr`,
  } as CSSProperties

  const getPanels = (): HTMLElement[] => {
    const container = panelsRef.current
    if (!container) return []
    return [...container.children].filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child.classList.contains('panel'),
    )
  }

  const beginHeightDrag = (): void => {
    const measured = dockRef.current?.getBoundingClientRect().height ?? 0
    heightDragRef.current = measured > 0 ? measured : layout.dockHeight
  }

  const resizeHeight = (delta: number): void => {
    const start = heightDragRef.current
    if (start === null) return
    onLayoutChange({
      dockHeight: clamp(start - delta, DOCK_MIN_HEIGHT, dockMaxHeight()),
    })
  }

  const resetHeight = (): void => {
    heightDragRef.current = null
    onLayoutChange({ dockHeight: defaultDockHeight() })
  }

  const beginSplitDrag = (): void => {
    const measured = getPanels().map((panel) => panel.getBoundingClientRect().width)
    const fallback = layout.dockSplit.slice(0, presentation ? 2 : 3)
    splitDragRef.current = measured.length > 0 && measured.every((width) => width > 0)
      ? measured
      : fallback
  }

  const resizeSplit = (index: 0 | 1, delta: number): void => {
    const start = splitDragRef.current
    if (!start) return
    if (presentation) {
      const pairTotal = start[0] + start[1]
      if (!pairTotal) return
      const next = resizeAdjacent(start, 0, delta, DOCK_MIN_WIDTHS)
      const pairShare = layout.dockSplit[0] + layout.dockSplit[1]
      const first = pairShare * (next[0] / pairTotal)
      onLayoutChange({ dockSplit: [first, pairShare - first, layout.dockSplit[2]] })
      return
    }
    const next = resizeAdjacent(start, index, delta, DOCK_MIN_WIDTHS)
    onLayoutChange({ dockSplit: toDockSplit(next) })
  }

  const resetSplit = (): void => {
    splitDragRef.current = null
    onLayoutChange({ dockSplit: [...DEFAULT_LAYOUT.dockSplit] })
  }

  const toggleFocus = (pane: DockPaneId): void => {
    onLayoutChange({ focusedDockPane: activeFocus === pane ? null : pane })
  }

  const toggleControl = (pane: DockPaneId): JSX.Element => (
    <PanelFocusButton
      title={
        pane === 'variables'
          ? fr.watch.title
          : pane === 'console'
            ? fr.console.title
            : fr.journal.title
      }
      focused={activeFocus === pane}
      onToggle={() => toggleFocus(pane)}
    />
  )

  return (
    <section
      ref={dockRef}
      className={`bottom-dock${collapsed ? ' collapsed' : ''}${presentation ? ' presentation' : ''}`}
      aria-label={fr.dock.title}
      style={dockStyle}
    >
      {collapsed ? (
        <button
          type="button"
          className="dock-collapsed-bar"
          onClick={onToggle}
          aria-expanded={false}
          title={fr.dock.expand}
        >
          <span className="dock-chevron" aria-hidden="true">
            ▴
          </span>
          <span className="dock-handle-label">{fr.dock.title}</span>
          <code className="dock-summary">{summary}</code>
          <span className="keycap">D</span>
        </button>
      ) : (
        <>
          <SplitHandle
            orientation="horizontal"
            className="dock-height-sash"
            label={fr.dock.resizeDockHeight}
            value={layout.dockHeight}
            min={DOCK_MIN_HEIGHT}
            max={dockMaxHeight()}
            valueText={fr.dock.pixelValue(layout.dockHeight)}
            controls="dock-variables dock-console dock-journal"
            onDragStart={beginHeightDrag}
            onDrag={resizeHeight}
            onDragEnd={() => {
              heightDragRef.current = null
            }}
            onReset={resetHeight}
          />
          <button
            type="button"
            className="dock-handle"
            onClick={onToggle}
            aria-expanded
            title={fr.dock.collapse}
          >
            <span className="dock-chevron" aria-hidden="true">
              ▾
            </span>
            <span className="dock-handle-label">{fr.dock.title}</span>
            <span className="keycap">D</span>
          </button>
          <div
            ref={panelsRef}
            className={`dock-panels${activeFocus ? ' focused' : ''}`}
            style={panelsStyle}
          >
            {showVariables ? (
              <WatchPanel
                id="dock-variables"
                plugin={plugin}
                step={step}
                stepIndex={stepIndex}
                focused={activeFocus === 'variables'}
                onToggleFocus={() => toggleFocus('variables')}
              />
            ) : null}
            {showVariables && showConsole ? (
              <SplitHandle
                orientation="vertical"
                className="dock-sash"
                label={fr.dock.resizeVariablesConsole}
                value={visibleSplit[0] ?? 0}
                min={5}
                max={95}
                valueText={fr.dock.percentValue(visibleSplit[0] ?? 0)}
                controls="dock-variables dock-console"
                onDragStart={beginSplitDrag}
                onDrag={(delta) => resizeSplit(0, delta)}
                onDragEnd={() => {
                  splitDragRef.current = null
                }}
                onReset={resetSplit}
              />
            ) : null}
            {showConsole ? (
              <ConsolePanel
                id="dock-console"
                step={step}
                focused={activeFocus === 'console'}
                counterLabels={counterLabels}
                onToggleFocus={() => toggleFocus('console')}
              />
            ) : null}
            {showConsole && showJournal ? (
              <SplitHandle
                orientation="vertical"
                className="dock-sash"
                label={fr.dock.resizeConsoleJournal}
                value={visibleSplit[1] ?? 0}
                min={5}
                max={95}
                valueText={fr.dock.percentValue(visibleSplit[1] ?? 0)}
                controls="dock-console dock-journal"
                onDragStart={beginSplitDrag}
                onDrag={(delta) => resizeSplit(1, delta)}
                onDragEnd={() => {
                  splitDragRef.current = null
                }}
                onReset={resetSplit}
              />
            ) : null}
            {showJournal ? (
              <JournalPanel
                entries={journal}
                onReset={onReset}
                focusControl={toggleControl('journal')}
              />
            ) : null}
          </div>
        </>
      )}
    </section>
  )
}

function JournalPanel({
  entries,
  onReset,
  focusControl,
}: {
  entries: string[]
  onReset: () => void
  focusControl: JSX.Element
}): JSX.Element {
  return (
    <section className="panel journal-panel" id="dock-journal">
      <div className="panel-header journal-header">
        <div className="journal-title">
          <span className="panel-title">{fr.journal.title}</span>
          {entries.length > 0 ? <span className="badge-count">{entries.length}</span> : null}
        </div>
        <div className="panel-header-actions">
          <button type="button" className="ghost-button small" onClick={onReset}>
            {fr.journal.reset}
          </button>
          {focusControl}
        </div>
      </div>
      <div className="journal-panel-body" aria-live="polite">
        {entries.length === 0 ? (
          <p className="journal-empty">{fr.journal.empty}</p>
        ) : (
          <ol className="journal-list">
            {entries.map((entry, index) => (
              <li
                key={`${index}-${entry}`}
                className={entry === fr.journal.resetMarker ? 'journal-entry reset' : 'journal-entry'}
              >
                <span className="journal-index">{index + 1}</span>
                <code className="journal-call">{entry}</code>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
