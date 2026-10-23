import type { CSSProperties, JSX, PointerEvent as ReactPointerEvent, RefObject, WheelEvent as ReactWheelEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { VisualizationProps } from '../../core/types'
import { fr } from '../../i18n/fr'
import { layoutTree, measureTree, TREE_NODE_HEIGHT, TREE_NODE_RADIUS, TREE_NODE_WIDTH } from './geometry'
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
}: VisualizationProps<TreeSnapshot>): JSX.Element {
  const layout = useMemo(() => layoutTree(snapshot), [snapshot])
  const [canvasRef, canvas] = useCanvasSize()
  const [viewState, setViewState] = useState<ViewState | null>(null)
  const dragRef = useRef<DragState | null>(null)
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
  const active = snapshot.frames.at(-1)?.vars.n
  const activeId = traversal?.activeNodeId ?? (active?.kind === 'node' ? active.id : null)
  const stackNodeIds = traversal
    ? snapshot.frames.flatMap((frame) => (frame.vars.n?.kind === 'node' ? [frame.vars.n.id] : []))
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
  const fontCompensation = clamp(1 / Math.max(renderScale, 0.1), 1, 1.8)
  const canvasStyle = { '--tree-font-compensation': String(fontCompensation) } as CSSProperties

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
    <div ref={canvasRef} className="tree-viz" style={canvasStyle}>
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
          <span>{fr.trees.viz.active}: {metrics.active.value ?? '—'} · {fr.trees.viz.depth} {metrics.active.depth} · {fr.trees.viz.degree} {metrics.active.degree}</span>
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
            <rect x={layout.rootX - 42} y="18" width="84" height="34" rx="10" />
            <text x={layout.rootX} y="40" textAnchor="middle">{fr.trees.viz.root}</text>
            <path d={`M ${layout.rootX} 52 L ${layout.rootX} ${layout.nodes[0]?.y ? layout.nodes[0].y - TREE_NODE_HEIGHT / 2 - 2 : 68}`} markerEnd="url(#tree-arrow-root)" />
          </g>
        ) : null}

        {layout.edges.map((edge) => (
          <g
            key={`${edge.parentId}:${edge.field}`}
            className={`tree-edge tree-edge-${edge.field}${changedFields.has(`${edge.parentId}:${edge.field}`) ? ' is-changed' : ''}${stackEdgeSet.has(`${edge.parentId}:${edge.childId}`) ? ' is-path' : ''}${traversal && stackEdgeSet.size > 0 && !stackEdgeSet.has(`${edge.parentId}:${edge.childId}`) ? ' is-dim' : ''}`}
          >
            <path d={edge.path} markerEnd={`url(#tree-arrow-${edge.field === 'gauche' ? 'left' : 'right'})`} />
            <text x={edge.labelX} y={edge.labelY - 7} textAnchor="middle">{edge.field}</text>
          </g>
        ))}

        {layout.nulls.map((entry) => (
          <g key={`${entry.parentId}:${entry.field}`} className={`tree-null tree-null-${entry.field}${entry.uninitialized ? ' is-uninitialized' : ''}`}>
            <path d={entry.path} markerEnd={`url(#tree-arrow-${entry.field === 'gauche' ? 'left' : 'right'})`} />
            <rect x={entry.x - 27} y={entry.y - 13} width="54" height="26" rx="13" />
            <text x={entry.x} y={entry.y + 4} textAnchor="middle">{entry.uninitialized ? '?' : fr.trees.viz.null}</text>
          </g>
        ))}

        {layout.nodes.map(({ node, x, y }) => {
          const isActive = activeId === node.id
          const visitedAt = visitOrder.get(node.id)
          const isOnStackPath = stackNodeSet.has(node.id)
          const shouldDim = Boolean(traversal && stackNodeSet.size > 0 && !isOnStackPath && !visitedAt)
          return (
            <g
              key={node.id}
              className={`tree-node${isActive ? ' is-active' : ''}${visitedAt ? ' is-visited' : ''}${isOnStackPath ? ' is-path' : ''}${shouldDim ? ' is-dim' : ''}${node.freed ? ' is-freed' : ''}${created.has(node.id) ? ' is-created' : ''}${freed.has(node.id) ? ' is-being-freed' : ''}`}
              transform={`translate(${x - TREE_NODE_WIDTH / 2} ${y - TREE_NODE_HEIGHT / 2})`}
            >
              <title>{`${fr.trees.viz.node} ${node.id}, ${node.address}`}</title>
              <circle className="tree-node-card" cx={TREE_NODE_RADIUS} cy={TREE_NODE_RADIUS} r={TREE_NODE_RADIUS} />
              {node.freed ? <circle className="tree-node-hatch" cx={TREE_NODE_RADIUS} cy={TREE_NODE_RADIUS} r={TREE_NODE_RADIUS} /> : null}
              <text className="tree-node-address" x={TREE_NODE_RADIUS} y={TREE_NODE_RADIUS - 12} textAnchor="middle">{node.address}</text>
              <text className="tree-node-value" x={TREE_NODE_RADIUS} y={TREE_NODE_RADIUS + 22} textAnchor="middle">
                {node.payload.kind === 'int' ? node.payload.value : '…'}
              </text>
              {visitedAt ? (
                <g className="tree-visit-badge" aria-label={`${fr.trees.viz.visited} ${visitedAt}`}>
                  <circle cx={TREE_NODE_RADIUS * 1.55} cy={TREE_NODE_RADIUS * 1.55} r="10" />
                  <text x={TREE_NODE_RADIUS * 1.55} y={TREE_NODE_RADIUS * 1.55 + 4} textAnchor="middle">{visitedAt}</text>
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

      <details className="tree-viz-legend">
        <summary>{fr.trees.viz.legend}</summary>
        <div aria-label={fr.trees.viz.legend}>
          <span><i className="tree-legend-left" />{fr.trees.fields.gauche}</span>
          <span><i className="tree-legend-right" />{fr.trees.fields.droit}</span>
          <span><i className="tree-legend-root" />{fr.trees.viz.root}</span>
          <span><i className="tree-legend-active" />{fr.trees.viz.active}</span>
        </div>
      </details>
    </div>
  )
}
