import type { CSSProperties, JSX, PointerEvent as ReactPointerEvent, RefObject, WheelEvent as ReactWheelEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { VisualizationProps } from '../../core/types'
import { fr } from '../../i18n/fr'
import {
  layoutTree,
  measureTree,
  placeEdgeLabels,
  TREE_NODE_HEIGHT,
  TREE_NODE_RADIUS,
  TREE_NODE_WIDTH,
} from './geometry'
import type { TreeSnapshot } from './memory'
import { rootPointer } from './memory'
import './TreeVisualization.css'

interface ViewBox {
  x: number
  y: number
  width: number
  height: number
}

interface ViewState {
  key: number | undefined
  mode: 'auto' | 'manual'
  viewBox: ViewBox
}

interface DragState {
  pointerId: number
  x: number
  y: number
  viewBox: ViewBox
}

interface CanvasSize {
  width: number
  height: number
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

function useCanvasSize(): [RefObject<HTMLDivElement | null>, CanvasSize] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState<CanvasSize>({ width: 960, height: 540 })
  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const update = (): void => {
      const rect = element.getBoundingClientRect()
      if (rect.width > 1 && rect.height > 1) {
        setSize((current) =>
          Math.abs(current.width - rect.width) < 0.5 && Math.abs(current.height - rect.height) < 0.5
            ? current
            : { width: rect.width, height: rect.height },
        )
      }
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, size]
}

export default function TreeVisualization({
  snapshot,
  step,
  cameraResetKey,
  highlightedNodeId,
}: VisualizationProps<TreeSnapshot>): JSX.Element {
  const layout = useMemo(() => layoutTree(snapshot), [snapshot])
  const [canvasRef, canvas] = useCanvasSize()
  const [viewState, setViewState] = useState<ViewState | null>(null)
  const [legendOpen, setLegendOpen] = useState(false)
  const dragRef = useRef<DragState | null>(null)
  const legendRef = useRef<HTMLDivElement | null>(null)
  const legendTriggerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!legendOpen) return
    const onPointer = (event: PointerEvent): void => {
      if (legendRef.current && !legendRef.current.contains(event.target as Node)) {
        setLegendOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setLegendOpen(false)
      requestAnimationFrame(() => legendTriggerRef.current?.focus())
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [legendOpen])
  const currentViewState = viewState?.key === cameraResetKey ? viewState : null
  const mode = currentViewState?.mode ?? 'auto'
  const setManualViewBox = (next: ViewBox | null | ((current: ViewBox | null) => ViewBox | null)): void => {
    setViewState((currentState) => {
      const current = currentState && currentState.key === cameraResetKey && currentState.mode === 'manual'
        ? currentState.viewBox
        : null
      const nextViewBox = typeof next === 'function' ? next(current) : next
      return nextViewBox ? { key: cameraResetKey, mode: 'manual', viewBox: nextViewBox } : null
    })
  }
  const root = rootPointer(snapshot)
  const traversal = snapshot.traversal
  const callStack = snapshot.callStack
  const topCall = callStack?.frames.at(-1)
  const genericActive = snapshot.frames.at(-1)?.vars.n
  const activeId =
    topCall?.nodeId ??
    traversal?.activeNodeId ??
    (genericActive?.kind === 'node' ? genericActive.id : null)
  const callDepth = callStack ? Math.max(0, callStack.frames.length - 1) : null
  // The teaching stack is the source of truth for waiting/path styling. The
  // generic `frames` are only a fallback for snapshots produced before it.
  const stackNodeIds = traversal
    ? callStack
      ? callStack.frames.flatMap((frame) => (frame.nodeId === null ? [] : [frame.nodeId]))
      : snapshot.frames.flatMap((frame) => (frame.vars.n?.kind === 'node' ? [frame.vars.n.id] : []))
    : []
  const stackNodeSet = new Set(stackNodeIds)
  const stackEdgeSet = new Set(
    stackNodeIds.slice(1).map((nodeId, index) => `${stackNodeIds[index]}:${nodeId}`),
  )
  const visitOrder = new Map(traversal?.visitedNodeIds.map((nodeId, index) => [nodeId, index + 1]) ?? [])
  const metrics = measureTree(snapshot, activeId)
  const created = new Set(step.changes.filter((change) => change.kind === 'create').map((change) => change.nodeId))
  const freed = new Set(step.changes.filter((change) => change.kind === 'free').map((change) => change.nodeId))
  const changedFields = new Set(
    step.changes
      .filter((change) => change.kind === 'pointer')
      .map((change) => `${change.nodeId}:${change.field}`),
  )
  const defaultViewBox: ViewBox = { x: 0, y: 0, width: layout.width, height: layout.height }
  const viewBox = mode === 'manual' ? currentViewState?.viewBox ?? defaultViewBox : defaultViewBox
  const renderScale = Math.min(canvas.width / viewBox.width, canvas.height / viewBox.height)
  const zoom = Math.round(renderScale * 100)
  const edgeLabels = useMemo(
    () => placeEdgeLabels(layout, renderScale, fr.trees.fields),
    [layout, renderScale],
  )
  const activeNullSlot = topCall && topCall.nodeId === null ? topCall.nullSlot : null
  const nullMarkerRadius = 6 / Math.max(renderScale, 0.05)
  const nullMarkerFont = 8 / Math.max(renderScale, 0.05)
  // Keep the value readable without letting it collide with the address line
  // when the whole tree is fitted into a short dock.
  const compensation = clamp(1 / Math.max(renderScale, 0.1), 1, 1.45)
  const labelCompensation = clamp(1 / Math.max(renderScale, 0.1), 1, 2.1)
  const compactAddress = renderScale < 0.62
  const addressCompensation = compactAddress
    ? clamp(1 / Math.max(renderScale, 0.1), 1, 2.2)
    : compensation
  const rootCompensation = clamp(1 / Math.max(renderScale, 0.1), 1, 2)
  const visitBadgeRadius = 14 * labelCompensation
  // Keep the enlarged badge just below the node, clear of the address/value
  // lines and of the outbound edge labels at every zoom level.
  const visitBadgeX = TREE_NODE_RADIUS
  const visitBadgeY =
    TREE_NODE_RADIUS * 2 + visitBadgeRadius + 6 / Math.max(renderScale, 0.1)
  const canvasStyle = {
    '--tree-font-compensation': String(compensation),
    '--tree-label-compensation': String(labelCompensation),
    '--tree-address-compensation': String(addressCompensation),
    '--tree-root-compensation': String(rootCompensation),
  } as CSSProperties

  const setCameraMode = (nextMode: 'auto' | 'manual'): void => {
    if (nextMode === 'auto') {
      setViewState(null)
      return
    }
    setViewState({ key: cameraResetKey, mode: 'manual', viewBox })
  }

  const zoomAt = (factor: number, x = 0.5, y = 0.5): void => {
    setManualViewBox((current) => {
      const base = current ?? defaultViewBox
      const width = clamp(base.width * factor, layout.width / 4, layout.width * 2)
      const height = clamp(base.height * factor, layout.height / 4, layout.height * 2)
      const worldX = base.x + base.width * x
      const worldY = base.y + base.height * y
      return { x: worldX - width * x, y: worldY - height * y, width, height }
    })
  }

  const onWheel = (event: ReactWheelEvent<SVGSVGElement>): void => {
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1)
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1)
    zoomAt(event.deltaY < 0 ? 0.88 : 1.14, x, y)
  }

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>): void => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, viewBox }
  }

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>): void => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const rect = event.currentTarget.getBoundingClientRect()
    setManualViewBox({
      ...drag.viewBox,
      x: drag.viewBox.x - ((event.clientX - drag.x) * drag.viewBox.width) / rect.width,
      y: drag.viewBox.y - ((event.clientY - drag.y) * drag.viewBox.height) / rect.height,
    })
  }

  const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>): void => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
  }

  return (
    <div className="tree-viz" style={canvasStyle}>
      <div ref={canvasRef} className="tree-viz-stage">
      <div className="tree-viz-toolbar camera-toolbar" aria-label="Commandes de la vue de l’arbre">
        <button className="camera-button" type="button" title={fr.trees.viz.zoomOut} onClick={() => zoomAt(1.2)} aria-label={fr.trees.viz.zoomOut}>−</button>
        <span className="camera-button camera-zoom-label" aria-live="polite">{zoom} %</span>
        <button className="camera-button" type="button" title={fr.trees.viz.zoomIn} onClick={() => zoomAt(0.84)} aria-label={fr.trees.viz.zoomIn}>+</button>
        <button className="camera-button camera-fit" type="button" title={fr.trees.viz.zoomReset} onClick={() => setManualViewBox(null)}>{fr.trees.viz.fit}</button>
        <button
          className={`camera-mode ${mode}`}
          type="button"
          onClick={mode === 'manual' ? () => setCameraMode('auto') : undefined}
          title={mode === 'auto' ? fr.camera.autoHint : fr.camera.manualHint}
          aria-label={mode === 'auto' ? fr.camera.autoHint : fr.camera.manualHint}
        >
          {mode === 'auto' ? fr.camera.auto : fr.camera.manual}
        </button>
      </div>

      <details className="tree-concepts">
        <summary>{fr.trees.viz.concepts}</summary>
        <ul>
          <li><strong>{fr.trees.viz.root}</strong> : {fr.trees.viz.rootDefinition}</li>
          <li><strong>{fr.trees.viz.branch}</strong> / <strong>{fr.trees.viz.subtree}</strong> : {fr.trees.viz.branchDefinition}</li>
          <li><strong>{fr.trees.viz.leaf}</strong> : {fr.trees.viz.leafDefinition}</li>
          <li><strong>{fr.trees.viz.size}</strong> : {fr.trees.viz.sizeDefinition}</li>
          <li><strong>{fr.trees.viz.degree}</strong> : {fr.trees.viz.degreeDefinition}</li>
          <li><strong>{fr.trees.viz.depth}</strong> : {fr.trees.viz.depthDefinition}</li>
          <li><strong>{fr.trees.viz.height}</strong> : {fr.trees.viz.heightDefinition}</li>
        </ul>
      </details>

      <div className="tree-metrics" aria-live="polite">
        <span>{fr.trees.viz.size} <b>{metrics.size}</b></span>
        <span>{fr.trees.viz.leaves} <b>{metrics.leaves}</b></span>
        <span>{fr.trees.viz.height} <b>{metrics.height}</b></span>
        {metrics.active ? (
          <span>{fr.trees.viz.active}: {metrics.active.value ?? '—'} · {fr.trees.viz.depth} {callDepth ?? metrics.active.depth} · {fr.trees.viz.degree} {metrics.active.degree}</span>
        ) : topCall ? (
          <span>{fr.trees.viz.active}: {fr.trees.viz.null} · {fr.trees.viz.depth} {callDepth ?? 0}</span>
        ) : null}
      </div>

      <svg
        className="tree-viz-svg"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        role="img"
        aria-label={fr.chapters.trees.title}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <defs>
          <marker id="tree-arrow-left" viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--arrow-next)" />
          </marker>
          <marker id="tree-arrow-right" viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--arrow-prev)" />
          </marker>
          <marker id="tree-arrow-root" viewBox="0 0 8 8" refX="4" refY="7.5" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M 0 0 L 8 0 L 4 8 z" fill="var(--gold)" />
          </marker>
          <pattern id="tree-freed-hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="var(--freed-overlay)" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--hatch-freed)" strokeWidth="2" />
          </pattern>
        </defs>

        {root.kind === 'node' && layout.rootX !== null ? (
          <g className={`tree-root-pin${snapshot.nodes.find((node) => node.id === root.id)?.freed ? ' is-dangling' : ''}`}>
            <rect x={layout.rootX - 55} y="12" width="110" height="34" rx="10" />
            <text x={layout.rootX} y="34" textAnchor="middle" dominantBaseline="central">{fr.trees.viz.root}</text>
            <path d={`M ${layout.rootX} 46 L ${layout.rootX} ${layout.nodes[0]?.y ? layout.nodes[0].y - TREE_NODE_HEIGHT / 2 - 2 : 68}`} markerEnd="url(#tree-arrow-root)" />
          </g>
        ) : null}

        {layout.edges.map((edge) => {
          const label = edgeLabels.get(`${edge.parentId}:${edge.field}`)
          return (
            <g
              key={`${edge.parentId}:${edge.field}`}
              className={`tree-edge tree-edge-${edge.field}${changedFields.has(`${edge.parentId}:${edge.field}`) ? ' is-changed' : ''}${stackEdgeSet.has(`${edge.parentId}:${edge.childId}`) ? ' is-path' : ''}${traversal && stackEdgeSet.size > 0 && !stackEdgeSet.has(`${edge.parentId}:${edge.childId}`) ? ' is-dim' : ''}`}
            >
              <path d={edge.path} markerEnd={`url(#tree-arrow-${edge.field === 'gauche' ? 'left' : 'right'})`} />
              {label ? (
                <g className="tree-edge-label">
                  <rect
                    x={label.x - label.width / 2}
                    y={label.y - label.height / 2}
                    width={label.width}
                    height={label.height}
                    rx={label.height / 2}
                  />
                  <text
                    x={label.x}
                    y={label.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={label.fontSize}
                  >
                    {label.text}
                  </text>
                </g>
              ) : null}
            </g>
          )
        })}

        {layout.nulls.map((entry) => {
          const isActiveNull =
            activeNullSlot?.parentId === entry.parentId && activeNullSlot.field === entry.field
          return (
            <g
              key={`${entry.parentId}:${entry.field}`}
              className={`tree-null tree-null-${entry.field}${entry.uninitialized ? ' is-uninitialized' : ''}${isActiveNull ? ' is-active' : ''}`}
            >
              {isActiveNull ? <title>{fr.trees.viz.activeNull}</title> : null}
              <path d={entry.path} markerEnd={`url(#tree-arrow-${entry.field === 'gauche' ? 'left' : 'right'})`} />
              {isActiveNull ? (
                <>
                  <rect
                    className="tree-null-active-ring"
                    x={entry.x - 31}
                    y={entry.y - 17}
                    width="62"
                    height="34"
                    rx="17"
                  />
                  <g
                    className="tree-null-active-marker"
                    transform={`translate(${entry.x + 24} ${entry.y - 15})`}
                    aria-hidden="true"
                  >
                    <circle r={nullMarkerRadius} />
                    <text y={nullMarkerFont * 0.36} textAnchor="middle" fontSize={nullMarkerFont}>
                      n
                    </text>
                  </g>
                </>
              ) : null}
              <rect x={entry.x - 27} y={entry.y - 13} width="54" height="26" rx="13" />
              <text x={entry.x} y={entry.y + 4} textAnchor="middle">
                {entry.uninitialized ? '?' : fr.trees.viz.null}
              </text>
            </g>
          )
        })}

        {layout.nodes.map(({ node, x, y }) => {
          const isActive = activeId === node.id
          const isInspected = highlightedNodeId === node.id
          const visitedAt = visitOrder.get(node.id)
          const isOnStackPath = stackNodeSet.has(node.id)
          const isWaiting = isOnStackPath && !isActive
          const shouldDim = Boolean(traversal && stackNodeSet.size > 0 && !isOnStackPath && !visitedAt)
          return (
            <g
              key={node.id}
              className={`tree-node${isActive ? ' is-active' : ''}${isWaiting ? ' is-waiting' : ''}${isInspected ? ' is-inspected' : ''}${visitedAt ? ' is-visited' : ''}${isOnStackPath ? ' is-path' : ''}${shouldDim ? ' is-dim' : ''}${node.freed ? ' is-freed' : ''}${created.has(node.id) ? ' is-created' : ''}${freed.has(node.id) ? ' is-being-freed' : ''}`}
              transform={`translate(${x - TREE_NODE_WIDTH / 2} ${y - TREE_NODE_HEIGHT / 2})`}
            >
              <title>{`${fr.trees.viz.node} ${node.id}, ${node.address}`}</title>
              <circle className="tree-node-card" cx={TREE_NODE_RADIUS} cy={TREE_NODE_RADIUS} r={TREE_NODE_RADIUS} />
              {node.freed ? <circle className="tree-node-hatch" cx={TREE_NODE_RADIUS} cy={TREE_NODE_RADIUS} r={TREE_NODE_RADIUS} /> : null}
              <text className="tree-node-address" x={TREE_NODE_RADIUS} y={TREE_NODE_RADIUS - 20} textAnchor="middle">
                {compactAddress ? node.address.replace(/^0x/, '') : node.address}
              </text>
              <text className="tree-node-value" x={TREE_NODE_RADIUS} y={TREE_NODE_RADIUS + 22} textAnchor="middle">
                {node.payload.kind === 'int' ? node.payload.value : '…'}
              </text>
              {visitedAt ? (
                <g className="tree-visit-badge" aria-label={`${fr.trees.viz.visited} ${visitedAt}`}>
                  <circle cx={visitBadgeX} cy={visitBadgeY} r={visitBadgeRadius} />
                  <text
                    x={visitBadgeX}
                    y={visitBadgeY}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {visitedAt}
                  </text>
                </g>
              ) : null}
              {node.freed ? <text className="tree-node-freed" x={TREE_NODE_RADIUS} y={TREE_NODE_RADIUS * 1.65} textAnchor="middle">{fr.trees.viz.freed}</text> : null}
            </g>
          )
        })}

        {layout.nodes.length === 0 ? (
          <g className="tree-empty-state" transform={`translate(${layout.width / 2} ${layout.height / 2})`}>
            <circle r="72" />
            <text y="5" textAnchor="middle">NULL</text>
            <text className="tree-empty-caption" y="99" textAnchor="middle">{fr.trees.viz.empty}</text>
          </g>
        ) : null}
      </svg>

      {root.kind === 'node' && snapshot.nodes.find((node) => node.id === root.id)?.freed ? (
        <div className="tree-dangling-note" role="status">{fr.trees.viz.danglingRoot}</div>
      ) : null}

      <div
        className={`tree-viz-legend-control${canvas.height >= 360 ? ' is-top' : ''}`}
        ref={legendRef}
      >
        <button
          ref={legendTriggerRef}
          type="button"
          className="tree-viz-legend-button"
          aria-expanded={legendOpen}
          aria-haspopup="dialog"
          aria-controls="tree-legend-popover"
          onClick={() => setLegendOpen((value) => !value)}
        >
          <span aria-hidden="true">☰</span>
          {fr.trees.viz.legend}
        </button>
        {legendOpen ? (
          <div
            id="tree-legend-popover"
            className="tree-viz-legend-popover"
            role="dialog"
            aria-label={fr.trees.viz.legend}
          >
            <span><i className="tree-legend-left" />{fr.trees.fields.gauche}</span>
            <span><i className="tree-legend-right" />{fr.trees.fields.droit}</span>
            <span><i className="tree-legend-root" />{fr.trees.viz.root}</span>
            <span><i className="tree-legend-active" />{fr.trees.viz.active}</span>
          </div>
        ) : null}
      </div>
      </div>
    </div>
  )
}
