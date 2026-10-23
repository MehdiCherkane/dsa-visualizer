import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type {
  JSX,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerValue, VisualizationProps } from '../../core/types'
import { fr } from '../../i18n/fr'
import {
  BAND_PAD,
  CELL_W,
  EMPTY_BAND_HEIGHT,
  EMPTY_BAND_TOP,
  HEAP_BAND_BOTTOM,
  HEAP_BAND_TOP,
  MAX_K,
  MIN_K,
  NODE_H,
  NODE_W,
  ROW_BAND_BOTTOM,
  ROW_BAND_TOP,
  cameraAtOne,
  circleGeometry,
  clamp,
  debutCellGeometry,
  debutRoute,
  fitCamera,
  layoutNodes,
  layoutPins,
  pointerAnchor,
  routeArrow,
  screenPoint,
  snapshotBounds,
  unionBounds,
  worldPoint,
  zoomAtCursor,
} from './geometry'
import type {
  Camera,
  LayoutMode,
  NullStubGeometry,
  PinInput,
  Point,
  Size,
} from './geometry'
import { payloadKey } from './memory'
import type { LdcNode, LdcSnapshot, PointerField } from './memory'

const FALLBACK_W = 1120
const FALLBACK_H = 620
const POINTER_FIELDS: PointerField[] = ['suivant', 'precedent']
const CAMERA_ANIMATION = 250

function isPointerField(field: string): field is PointerField {
  return field === 'suivant' || field === 'precedent'
}

function isPointerValue(value: unknown): value is PointerValue {
  if (!value || typeof value !== 'object' || !('kind' in value)) return false
  const kind = (value as { kind?: unknown }).kind
  return kind === 'node' || kind === 'null' || kind === 'uninit'
}

function pinColor(name: string): string {
  switch (name) {
    case 'courant':
      return 'var(--success)'
    case 'nouveau':
      return 'var(--pin)'
    default:
      return 'var(--ink-2)'
  }
}

function shortStudentName(name: string, surname: string): string {
  const text = `${surname} ${name}`.trim()
  return text.length > 11 ? `${text.slice(0, 10)}…` : text
}

interface PinSpec extends PinInput {
  value: PointerValue
  color: string
  dangling: boolean
}

function collectPins(snapshot: LdcSnapshot): PinSpec[] {
  const result: PinSpec[] = []
  const push = (name: string, value: PointerValue): void => {
    if (value.kind === 'node') {
      const node = snapshot.nodes.find((candidate) => candidate.id === value.id)
      result.push({
        name,
        text: name,
        value,
        color: pinColor(name),
        target: 'node',
        targetId: value.id,
        dangling: node?.freed ?? false,
      })
      return
    }
    result.push({
      name,
      text: value.kind === 'uninit' ? `${name} = ?` : name,
      value,
      color: pinColor(name),
      target: value.kind === 'null' ? 'null' : 'uninit',
      dangling: false,
    })
  }

  const frame = snapshot.frames[snapshot.frames.length - 1]
  if (frame) {
    for (const [name, value] of Object.entries(frame.vars)) {
      if (value.kind === 'node' || value.kind === 'null' || value.kind === 'uninit') {
        push(name, value)
      }
    }
  }
  return result
}

function useElementSize(): [RefObject<HTMLDivElement | null>, Size] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState<Size>({ width: FALLBACK_W, height: FALLBACK_H })
  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const update = (): void => {
      const rect = element.getBoundingClientRect()
      if (rect.width > 1 && rect.height > 1) {
        setSize((previous) =>
          Math.abs(previous.width - rect.width) < 0.5 &&
          Math.abs(previous.height - rect.height) < 0.5
            ? previous
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

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  const element = target as HTMLElement
  if (element.isContentEditable) return true
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'SELECT' ||
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'OPTION'
  )
}

export default function LdcVisualization({
  snapshot,
  step,
  operationSteps,
  cameraResetKey,
  callText,
  onNodeClick,
  onEmptyInsert,
  presentation,
  speed,
  stepIndex,
  layoutMode = 'row',
}: VisualizationProps<LdcSnapshot> & { layoutMode?: LayoutMode }): JSX.Element {
  const reducedMotion = Boolean(useReducedMotion())
  const [stageRef, stage] = useElementSize()
  const stageW = Math.max(360, stage.width)
  const stageH = Math.max(240, stage.height)

  const nodes = snapshot.nodes
  const layout = useMemo(() => layoutNodes(nodes, layoutMode), [nodes, layoutMode])
  const pins = useMemo(() => collectPins(snapshot), [snapshot])
  const ring = useMemo(
    () => (layoutMode === 'circle' ? circleGeometry(nodes) : null),
    [nodes, layoutMode],
  )
  const pinPlacements = useMemo(
    () => layoutPins(pins, nodes, layoutMode),
    [pins, nodes, layoutMode],
  )
  const contentBounds = useMemo(
    () => snapshotBounds(nodes, pins, snapshot.globals.debut, layoutMode),
    [nodes, pins, snapshot.globals.debut, layoutMode],
  )
  const operationBounds = useMemo(() => {
    if (!operationSteps || operationSteps.length === 0) return null
    return unionBounds(
      operationSteps.map((operationStep) =>
        snapshotBounds(
          operationStep.snapshot.nodes,
          collectPins(operationStep.snapshot),
          operationStep.snapshot.globals.debut,
          layoutMode,
        ),
      ),
    )
  }, [operationSteps, layoutMode])
  const fitBounds = operationBounds ?? contentBounds
  const hasHeap =
    nodes.some((node) => node.lane === 'heap') ||
    Boolean(operationSteps?.some((operationStep) =>
      operationStep.snapshot.nodes.some((node) => node.lane === 'heap'),
    ))

  const autoCamera = useMemo(
    () =>
      nodes.length === 0
        ? cameraAtOne(fitBounds, { width: stageW, height: stageH })
        : fitCamera(fitBounds, { width: stageW, height: stageH }),
    [fitBounds, nodes.length, stageW, stageH],
  )
  const [camera, setCamera] = useState<Camera>(autoCamera)
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const cameraRef = useRef(camera)
  const fitBoundsRef = useRef(fitBounds)
  const stageSizeRef = useRef({ width: stageW, height: stageH })
  const frameRef = useRef<number | null>(null)
  const pointersRef = useRef(new Map<number, Point>())
  const gestureRef = useRef<
    | { kind: 'pan'; start: Point; camera: Camera; moved: boolean }
    | { kind: 'pinch'; startDistance: number; startCamera: Camera; world: Point }
    | null
  >(null)
  const suppressClickRef = useRef(false)
  const [panning, setPanning] = useState(false)

  const cancelAnimation = useCallback((): void => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [])

  useEffect(() => {
    cameraRef.current = camera
  }, [camera])

  useEffect(() => {
    fitBoundsRef.current = fitBounds
  }, [fitBounds])

  useEffect(() => {
    stageSizeRef.current = { width: stageW, height: stageH }
  }, [stageW, stageH])

  const animateTo = useCallback(
    (target: Camera, duration: number): void => {
      cancelAnimation()
      if (duration <= 0 || reducedMotion) {
        cameraRef.current = target
        setCamera(target)
        return
      }
      const from = cameraRef.current
      const start = performance.now()
      const tick = (now: number): void => {
        const progress = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - progress, 3)
        const next = {
          x: from.x + (target.x - from.x) * eased,
          y: from.y + (target.y - from.y) * eased,
          k: from.k + (target.k - from.k) * eased,
        }
        cameraRef.current = next
        setCamera(next)
        if (progress < 1) {
          frameRef.current = requestAnimationFrame(tick)
        } else {
          frameRef.current = null
        }
      }
      frameRef.current = requestAnimationFrame(tick)
    },
    [cancelAnimation, reducedMotion],
  )

  useEffect(() => {
    if (mode !== 'auto') return
    animateTo(autoCamera, reducedMotion ? 0 : CAMERA_ANIMATION / 1000)
  }, [animateTo, autoCamera, mode, reducedMotion])

  useEffect(() => {
    setMode('auto')
  }, [cameraResetKey])

  useEffect(() => () => cancelAnimation(), [cancelAnimation])

  const enterManual = useCallback(
    (next: Camera, animated: boolean): void => {
      setMode('manual')
      if (animated) {
        animateTo(next, reducedMotion ? 0 : CAMERA_ANIMATION / 1000)
      } else {
        cancelAnimation()
        cameraRef.current = next
        setCamera(next)
      }
    },
    [animateTo, cancelAnimation, reducedMotion],
  )

  const fitView = useCallback((): void => {
    setMode('auto')
  }, [])

  const zoomBy = useCallback(
    (factor: number): void => {
      const size = stageSizeRef.current
      const next = zoomAtCursor(
        cameraRef.current,
        { x: size.width / 2, y: size.height / 2 },
        factor,
        MIN_K,
        MAX_K,
      )
      enterManual(next, true)
    },
    [enterManual],
  )

  const resetZoom = useCallback((): void => {
    const size = stageSizeRef.current
    enterManual(cameraAtOne(fitBoundsRef.current, size), true)
  }, [enterManual])

  useEffect(() => {
    const element = stageRef.current
    if (!element) return
    const handleWheel = (event: WheelEvent): void => {
      if ((event.target as Element | null)?.closest('.camera-toolbar')) return
      event.preventDefault()
      const rect = element.getBoundingClientRect()
      let delta = event.deltaY
      if (event.deltaMode === 1) delta *= 16
      else if (event.deltaMode === 2) delta *= rect.height
      const factor = Math.exp(-delta * (event.ctrlKey ? 0.0035 : 0.0015))
      const cursor = { x: event.clientX - rect.left, y: event.clientY - rect.top }
      enterManual(zoomAtCursor(cameraRef.current, cursor, factor, MIN_K, MAX_K), false)
    }
    element.addEventListener('wheel', handleWheel, { passive: false })
    return () => element.removeEventListener('wheel', handleWheel)
  }, [enterManual, stageRef])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent): void => {
      if (isTypingTarget(event.target)) return
      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        zoomBy(1.2)
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault()
        zoomBy(1 / 1.2)
      } else if (event.key === '0' || event.key === 'f' || event.key === 'F') {
        event.preventDefault()
        fitView()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [fitView, zoomBy])

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>): void => {
    const target = event.target as Element
    if (target.closest('.node-group') || target.closest('.camera-toolbar')) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const element = stageRef.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    pointersRef.current.set(event.pointerId, point)
    if (pointersRef.current.size === 1) {
      gestureRef.current = { kind: 'pan', start: point, camera: cameraRef.current, moved: false }
    } else if (pointersRef.current.size === 2) {
      const [first, second] = [...pointersRef.current.values()]
      if (!first || !second) return
      const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
      gestureRef.current = {
        kind: 'pinch',
        startDistance: Math.max(1, Math.hypot(first.x - second.x, first.y - second.y)),
        startCamera: cameraRef.current,
        world: worldPoint(cameraRef.current, midpoint),
      }
      setPanning(true)
      for (const pointerId of pointersRef.current.keys()) {
        event.currentTarget.setPointerCapture?.(pointerId)
      }
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>): void => {
    const points = pointersRef.current
    if (!points.has(event.pointerId)) return
    const element = stageRef.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    points.set(event.pointerId, point)
    const gesture = gestureRef.current
    if (!gesture) return

    if (gesture.kind === 'pan' && points.size === 1) {
      const dx = point.x - gesture.start.x
      const dy = point.y - gesture.start.y
      if (!gesture.moved && Math.hypot(dx, dy) >= 4) {
        gesture.moved = true
        setPanning(true)
        event.currentTarget.setPointerCapture?.(event.pointerId)
      }
      if (gesture.moved) {
        enterManual(
          { k: gesture.camera.k, x: gesture.camera.x + dx, y: gesture.camera.y + dy },
          false,
        )
      }
      return
    }

    if (gesture.kind === 'pinch' && points.size >= 2) {
      const [first, second] = [...points.values()]
      if (!first || !second) return
      const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
      const distance = Math.max(1, Math.hypot(first.x - second.x, first.y - second.y))
      const k = clamp(
        gesture.startCamera.k * (distance / gesture.startDistance),
        MIN_K,
        MAX_K,
      )
      enterManual(
        {
          k,
          x: midpoint.x - gesture.world.x * k,
          y: midpoint.y - gesture.world.y * k,
        },
        false,
      )
    }
  }

  const endPointer = (event: ReactPointerEvent<SVGSVGElement>): void => {
    const gesture = gestureRef.current
    if (gesture?.kind === 'pan' && gesture.moved) {
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 0)
    }
    pointersRef.current.delete(event.pointerId)
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (pointersRef.current.size === 0) {
      gestureRef.current = null
      setPanning(false)
    } else if (pointersRef.current.size === 1) {
      const remaining = [...pointersRef.current.values()][0]
      if (remaining) {
        gestureRef.current = {
          kind: 'pan',
          start: remaining,
          camera: cameraRef.current,
          moved: true,
        }
      }
    } else {
      const [first, second] = [...pointersRef.current.values()]
      if (first && second) {
        const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
        gestureRef.current = {
          kind: 'pinch',
          startDistance: Math.max(1, Math.hypot(first.x - second.x, first.y - second.y)),
          startCamera: cameraRef.current,
          world: worldPoint(cameraRef.current, midpoint),
        }
      }
    }
  }

  const handleDoubleClick = (event: ReactMouseEvent<SVGSVGElement>): void => {
    const target = event.target as Element
    if (target.closest('.node-group') || target.closest('.camera-toolbar')) return
    fitView()
  }

  const pointerChanges = step.changes.filter(
    (change): change is Extract<(typeof step.changes)[number], { kind: 'pointer' }> =>
      change.kind === 'pointer' && isPointerField(change.field),
  )
  const evalNodes = new Set(
    (step.evals ?? []).flatMap((entry) => (entry.nodeId === undefined ? [] : [entry.nodeId])),
  )
  const newNodeIds = new Set(
    step.changes.filter((change) => change.kind === 'create').map((change) => change.nodeId),
  )

  const handleNode = (node: LdcNode): void => {
    if (suppressClickRef.current) return
    if (!node.freed && onNodeClick) onNodeClick(node.id)
  }

  const handleKey = (event: ReactKeyboardEvent<SVGGElement>, node: LdcNode): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleNode(node)
    }
  }

  const strokeWidth = presentation ? 4 : 3
  const renderRoute = (
    source: LdcNode,
    field: PointerField,
    pointer: PointerValue,
  ): ReturnType<typeof routeArrow> => {
    if (pointer.kind === 'uninit') return null
    if (pointer.kind === 'null') return routeArrow(source, field, null, layout, layoutMode, nodes)
    const target = nodes.find((candidate) => candidate.id === pointer.id) ?? null
    if (!target) return null
    return routeArrow(source, field, target, layout, layoutMode, nodes)
  }

  const emptyBandExtra = nodes.length === 0 ? 36 : 0
  const bandX = fitBounds.x - BAND_PAD - emptyBandExtra
  const bandWidth = Math.max(
    nodes.length === 0 ? 480 : 120,
    fitBounds.width + BAND_PAD * 2 + emptyBandExtra,
  )
  const emptyBandTop = EMPTY_BAND_TOP
  const emptyBandHeight = EMPTY_BAND_HEIGHT
  const debutGeometry = debutCellGeometry(nodes, layoutMode)
  const debutArrow = debutRoute(nodes, snapshot.globals.debut, layoutMode)
  const debutChange = step.changes.find(
    (change) => change.kind === 'variable' && change.scope === 'global' && change.name === 'debut',
  )
  const oldDebutRoute =
    debutChange?.kind === 'variable' && isPointerValue(debutChange.from)
      ? debutRoute(nodes, debutChange.from, layoutMode)
      : null
  const newDebutRoute =
    debutChange?.kind === 'variable' && isPointerValue(debutChange.to)
      ? debutRoute(nodes, debutChange.to, layoutMode)
      : null
  const emptyOverlay = screenPoint(camera, {
    x: bandX + bandWidth / 2,
    y: emptyBandTop + emptyBandHeight,
  })
  const pulseDebut = !reducedMotion && step.badge === 'debut-modifie'

  return (
    <div
      className={`viz-stage${panning ? ' panning' : ''}${nodes.length === 0 ? ' is-empty' : ''}`}
      ref={stageRef}
    >
      <svg
        className="ldc-svg"
        viewBox={`0 0 ${stageW} ${stageH}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={fr.app.title}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onDoubleClick={handleDoubleClick}
      >
        <defs>
          <pattern
            id="camera-grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${camera.x} ${camera.y}) scale(${camera.k})`}
          >
            <circle cx="1.4" cy="1.4" r="1.4" fill="var(--grid-dot)" />
          </pattern>
          <pattern
            id="hatch-uninit"
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="7" stroke="var(--hatch-uninit)" strokeWidth="2" />
          </pattern>
          <pattern
            id="hatch-freed"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-45)"
          >
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--hatch-freed)" strokeWidth="2" />
          </pattern>
          <clipPath id="ldc-node-clip">
            <rect width={NODE_W} height={NODE_H} rx="14" />
          </clipPath>
          {(
            [
              ['arrow-next', 'var(--arrow-next)'],
              ['arrow-prev', 'var(--arrow-prev)'],
              ['arrow-alert', 'var(--alert)'],
              ['arrow-success', 'var(--success)'],
            ] as const
          ).map(([id, fill]) => (
            <marker
              key={id}
              id={id}
              viewBox="0 0 12 10"
              refX="12"
              refY="5"
              markerWidth="12"
              markerHeight="10"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path d="M 0 0 L 12 5 L 0 10 Z" fill={fill} />
            </marker>
          ))}
          <marker
            id="arrow-debut"
            viewBox="0 0 12 10"
            refX="12"
            refY="5"
            markerWidth="12"
            markerHeight="10"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M 0 0 L 12 5 L 0 10 Z" fill="var(--gold)" />
          </marker>
        </defs>

        <rect width={stageW} height={stageH} fill="url(#camera-grid)" />

        <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.k})`}>
          {ring ? (
            <circle
              className="lane-band lane-band-circle"
              cx={ring.cx}
              cy={ring.cy}
              r={ring.radius + NODE_W / 2 + 26}
            />
          ) : null}
          {hasHeap ? (
            <rect
              className="lane-band lane-band-heap"
              x={bandX}
              y={HEAP_BAND_TOP}
              width={bandWidth}
              height={HEAP_BAND_BOTTOM - HEAP_BAND_TOP}
              rx="14"
            />
          ) : null}
          <rect
            className="lane-band lane-band-row"
            x={bandX}
            y={nodes.length === 0 ? emptyBandTop : ROW_BAND_TOP}
            width={bandWidth}
            height={nodes.length === 0 ? emptyBandHeight : ROW_BAND_BOTTOM - ROW_BAND_TOP}
            rx="14"
            style={ring ? { display: 'none' } : undefined}
          />
          {hasHeap ? (
            <text
              x={bandX + 14}
              y={HEAP_BAND_TOP + 22}
              className="lane-band-label"
              fontSize="13"
            >
              {fr.viz.heap}
            </text>
          ) : null}
          <text
            x={
              ring
                ? ring.cx - (ring.radius + NODE_W / 2 + 26) + 18
                : bandX + (nodes.length === 0 ? 8 : 14)
            }
            y={
              ring
                ? ring.cy - (ring.radius + NODE_W / 2 + 26) + 24
                : (nodes.length === 0 ? emptyBandTop : ROW_BAND_TOP) + 22
            }
            className="lane-band-label"
            fontSize="13"
          >
            {fr.viz.row}
          </text>

          {[...evalNodes].map((id) => {
            const point = layout.get(id)
            if (!point) return null
            return (
              <circle
                key={`eval-${id}-${stepIndex}`}
                className={reducedMotion ? 'node-pulse node-pulse-static' : 'node-pulse'}
                cx={point.x + NODE_W / 2}
                cy={point.y + NODE_H / 2}
                r={NODE_W * 0.4}
                strokeWidth="2.4"
              />
            )
          })}

          <AnimatePresence initial={false}>
            {nodes.map((node) => {
              const point = layout.get(node.id)
              if (!point) return null
              const isNew = newNodeIds.has(node.id)
              return (
                <motion.g
                  key={node.id}
                  className={node.freed ? 'node-group node-freed' : 'node-group'}
                  initial={isNew ? { opacity: 0, scale: 0.92, x: point.x, y: point.y } : false}
                  animate={{ opacity: 1, scale: 1, x: point.x, y: point.y }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    duration: reducedMotion ? 0.001 : Math.max(0.1, 0.38 / speed),
                  }}
                  style={node.freed ? undefined : { cursor: onNodeClick ? 'pointer' : 'default' }}
                  onClick={() => handleNode(node)}
                  onKeyDown={(event) => handleKey(event, node)}
                  role={node.freed ? undefined : 'button'}
                  tabIndex={node.freed ? undefined : 0}
                  aria-label={
                    node.freed
                      ? `${fr.common.node} ${node.id} ${fr.common.freed}`
                      : `${fr.common.node} ${node.id}, ${fr.common.value} ${payloadKey(node) ?? fr.common.uninit}`
                  }
                >
                  <title>
                    {node.freed ? fr.viz.freed : `${fr.common.node} ${node.id} · ${fieldTitle(node)}`}
                  </title>
                  <NodeShape node={node} />
                </motion.g>
              )
            })}
          </AnimatePresence>

          {nodes
            .filter((node) => !node.freed)
            .flatMap((node) =>
              POINTER_FIELDS.flatMap((field) => {
                const pointer = node[field]
                const route = renderRoute(node, field, pointer)
                if (!route) return []
                if (route.kind === 'null') {
                  return [
                    <g key={`null-${node.id}-${field}`} className="null-stub">
                      <path
                        d={route.path}
                        className={`arrow arrow-${field}`}
                        style={{ strokeWidth }}
                      />
                      {route.stub ? <NullGround geometry={route.stub} /> : null}
                      <title>{`${field} de ${node.address} = ${fr.viz.null}`}</title>
                    </g>,
                  ]
                }
                return [
                  <path
                    key={`arrow-${node.id}-${field}`}
                    d={route.path}
                    className={`arrow arrow-${field}`}
                    style={{ strokeWidth }}
                    markerEnd={field === 'suivant' ? 'url(#arrow-next)' : 'url(#arrow-prev)'}
                  >
                    <title>{`${field} de ${node.address}`}</title>
                  </path>,
                ]
              }),
            )}

          {pointerChanges.map((change, index) => {
            const source = nodes.find((node) => node.id === change.nodeId)
            if (!source) return null
            const field = change.field
            if (!isPointerField(field)) return null
            const oldRoute = renderRoute(source, field, change.from)
            const newRoute = renderRoute(source, field, change.to)
            const key = `change-${change.nodeId}-${field}-${index}-${stepIndex}`
            const duration = reducedMotion ? 0.001 : Math.max(0.18, 0.85 / speed)
            return (
              <g key={key}>
                {oldRoute ? (
                  <motion.path
                    d={oldRoute.path}
                    className="arrow arrow-old"
                    style={{ strokeWidth: strokeWidth + 0.4 }}
                    markerEnd={
                      oldRoute.kind === 'null'
                        ? undefined
                        : 'url(#arrow-alert)'
                    }
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration }}
                  />
                ) : null}
                {newRoute ? (
                  <motion.path
                    d={newRoute.path}
                    className="arrow arrow-new"
                    style={{ strokeWidth: strokeWidth + 0.4 }}
                    markerEnd={
                      newRoute.kind === 'null'
                        ? undefined
                        : 'url(#arrow-success)'
                    }
                    initial={{ pathLength: 0, opacity: 1 }}
                    animate={{ pathLength: 1, opacity: [1, 1, 0] }}
                    transition={{
                      pathLength: { duration },
                      opacity: { duration: duration * 1.35, times: [0, 0.72, 1] },
                    }}
                  />
                ) : null}
              </g>
            )
          })}

          {nodes
            .filter((node) => !node.freed)
            .flatMap((node) => {
              const point = layout.get(node.id)
              if (!point) return []
              return POINTER_FIELDS.flatMap((field) => {
                const pointer = node[field]
                if (pointer.kind === 'uninit') return []
                const anchor = pointerAnchor(node, point, field)
                return [
                  <circle
                    key={`dot-${node.id}-${field}`}
                    className={`pointer-dot pointer-dot-${field}`}
                    cx={anchor.x}
                    cy={anchor.y}
                    r="5.5"
                  >
                    <title>{`${field} de ${node.address}`}</title>
                  </circle>,
                ]
              })
            })}

          {pinPlacements.map((placement, index) => {
            const pin = placement.pin as PinSpec
            if (!placement.to) return null
            const color = pin.dangling ? 'var(--alert)' : pin.color
            return (
              <line
                key={`pin-line-${pin.name}-${index}`}
                className="pin-line"
                x1={placement.from.x}
                y1={placement.from.y}
                x2={placement.to.x}
                y2={placement.to.y}
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray={pin.dangling ? '4 3' : undefined}
                opacity="0.8"
              />
            )
          })}
          {pinPlacements.map((placement, index) => {
            if (!placement.nullStub) return null
            const pin = placement.pin as PinSpec
            const color = pin.dangling ? 'var(--alert)' : pin.color
            return (
              <g key={`pin-null-${pin.name}-${index}`} className="pin-null">
                <path
                  d={placement.nullStub.path}
                  className="pin-null-line"
                  stroke={color}
                  strokeWidth="1.5"
                  opacity="0.8"
                />
                <NullGround geometry={placement.nullStub} color={color} />
              </g>
            )
          })}
          {pinPlacements.map((placement, index) => (
            <PinTag
              key={`pin-${placement.pin.name}-${index}`}
              pin={placement.pin as PinSpec}
              tag={placement.tag}
            />
          ))}

          {debutArrow ? (
            debutArrow.kind === 'null' ? (
              <g className="debut-null-stub">
                <path
                  d={debutArrow.path}
                  className="arrow debut-arrow"
                  style={{ strokeWidth }}
                />
                {debutArrow.stub ? (
                  <NullGround geometry={debutArrow.stub} color="var(--gold)" />
                ) : null}
              </g>
            ) : (
              <path
                d={debutArrow.path}
                className="arrow debut-arrow"
                style={{ strokeWidth }}
                markerEnd="url(#arrow-debut)"
              />
            )
          ) : null}

          {oldDebutRoute ? (
            <motion.path
              d={oldDebutRoute.path}
              className="arrow arrow-old"
              style={{ strokeWidth: strokeWidth + 0.4 }}
              markerEnd={oldDebutRoute.kind === 'null' ? undefined : 'url(#arrow-alert)'}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0.001 : Math.max(0.18, 0.85 / speed) }}
            />
          ) : null}
          {newDebutRoute ? (
            <motion.path
              d={newDebutRoute.path}
              className="arrow arrow-new"
              style={{ strokeWidth: strokeWidth + 0.4 }}
              markerEnd={newDebutRoute.kind === 'null' ? undefined : 'url(#arrow-success)'}
              initial={{ pathLength: 0, opacity: 1 }}
              animate={{ pathLength: 1, opacity: [1, 1, 0] }}
              transition={{
                pathLength: { duration: reducedMotion ? 0.001 : Math.max(0.18, 0.85 / speed) },
                opacity: {
                  duration: reducedMotion ? 0.001 : Math.max(0.24, 1.15 / speed),
                  times: [0, 0.72, 1],
                },
              }}
            />
          ) : null}

          <DebutCell
            key={`debut-cell-${stepIndex}`}
            geometry={debutGeometry}
            pulse={pulseDebut}
          />
        </g>
      </svg>

      {nodes.length === 0 ? (
        <div
          className="empty-overlay"
          style={{ left: `${emptyOverlay.x}px`, top: `${emptyOverlay.y + 24}px` }}
        >
          <p className="empty-overlay-text">
            <code className="caption-chip">
              <span className="caption-token code-debut">debut</span>
            </code>{' '}
            vaut{' '}
            <code className="caption-chip">
              <span className="caption-token code-null">NULL</span>
            </code>{' '}
            : la liste est vide.
          </p>
          <button
            type="button"
            className="primary-button empty-insert-button"
            onClick={onEmptyInsert}
          >
            {fr.viz.emptyInsert}
          </button>
        </div>
      ) : null}

      {callText ? (
        <div className="call-chip">
          <span className="call-current">
            <span className="call-play" aria-hidden="true">
              ▶
            </span>
            <code>{callText}</code>
          </span>
          {step.fn && !callText.startsWith(`${step.fn}(`) ? (
            <span className="call-breadcrumb">
              <code>{callText}</code>
              <span aria-hidden="true"> ▸ </span>
              <code>{step.fn}()</code>
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="camera-toolbar" onPointerDown={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="camera-button"
          onClick={() => zoomBy(1 / 1.2)}
          title={fr.camera.zoomOut}
          aria-label={fr.camera.zoomOut}
        >
          −
        </button>
        <button
          type="button"
          className="camera-button camera-zoom-label"
          onClick={resetZoom}
          title={fr.camera.zoomReset}
          aria-label={fr.camera.zoomReset}
        >
          {Math.round(camera.k * 100)} %
        </button>
        <button
          type="button"
          className="camera-button"
          onClick={() => zoomBy(1.2)}
          title={fr.camera.zoomIn}
          aria-label={fr.camera.zoomIn}
        >
          +
        </button>
        <button
          type="button"
          className="camera-button camera-fit"
          onClick={fitView}
          title={fr.camera.fit}
          aria-label={fr.camera.fit}
        >
          <span aria-hidden="true">⤢</span>
          {fr.camera.fitShort}
        </button>
        <button
          type="button"
          className={`camera-mode ${mode}`}
          onClick={mode === 'manual' ? fitView : undefined}
          title={mode === 'auto' ? fr.camera.autoHint : fr.camera.manualHint}
        >
          {mode === 'auto' ? fr.camera.auto : fr.camera.manual}
        </button>
      </div>

      <div className="viz-legend" aria-label={fr.legend.title}>
        <span className="legend-item">
          <svg viewBox="0 0 28 12" aria-hidden="true">
            <path d="M2 6h21" stroke="var(--arrow-next)" strokeWidth="2.5" />
            <path d="m21 2 5 4-5 4Z" fill="var(--arrow-next)" />
          </svg>
          {fr.legend.next}
        </span>
        <span className="legend-item">
          <svg viewBox="0 0 28 12" aria-hidden="true">
            <path
              d="M2 6h21"
              stroke="var(--arrow-prev)"
              strokeWidth="2.5"
              strokeDasharray="5 3"
            />
            <path d="m21 2 5 4-5 4Z" fill="var(--arrow-prev)" />
          </svg>
          {fr.legend.prev}
        </span>
        <span className="legend-item">
          <svg viewBox="0 0 28 12" aria-hidden="true">
            <rect x="4" y="2" width="20" height="8" rx="2" fill="none" stroke="var(--gold)" strokeWidth="2" />
          </svg>
          {fr.legend.debut}
        </span>
        <span className="legend-item">
          <svg viewBox="0 0 28 12" aria-hidden="true">
            <circle cx="14" cy="6" r="4" fill="var(--ink-2)" />
            <circle cx="14" cy="6" r="7" fill="none" stroke="var(--ink-2)" strokeWidth="1.5" />
          </svg>
          {fr.legend.local}
        </span>
      </div>
    </div>
  )
}

function DebutCell({
  geometry,
  pulse,
}: {
  geometry: ReturnType<typeof debutCellGeometry>
  pulse: boolean
}): JSX.Element {
  const { cell, dot, label } = geometry
  return (
    <g className={pulse ? 'debut-cell debut-cell-pulse' : 'debut-cell'}>
      <rect
        className="debut-cell-outline"
        x={cell.x}
        y={cell.y}
        width={cell.width}
        height={cell.height}
        rx="12"
      />
      <text
        className="debut-cell-label"
        x={cell.x + cell.width / 2}
        y={cell.y + cell.height / 2 + 7}
        textAnchor="middle"
      >
        debut
      </text>
      <circle className="debut-cell-dot" cx={dot.x} cy={dot.y} r="5.5" />
      <text
        className="debut-cell-caption"
        x={label.x}
        y={label.y}
        textAnchor="middle"
      >
        variable globale
      </text>
      <title>debut · variable globale</title>
    </g>
  )
}

function fieldTitle(node: LdcNode): string {
  const parts: string[] = []
  if (node.suivant.kind === 'node') parts.push('suivant')
  if (node.precedent.kind === 'node') parts.push('precedent')
  return parts.length > 0 ? parts.join(' · ') : node.address
}

function NullGround({
  geometry,
  color = 'var(--ink-2)',
}: {
  geometry: NullStubGeometry
  color?: string
}): JSX.Element {
  const { end, direction } = geometry
  return (
    <g className={color === 'var(--gold)' ? 'null-ground empty-null-ground' : 'null-ground'}>
      {direction === 'down' ? (
        <>
          <line x1={end.x - 11} y1={end.y} x2={end.x + 11} y2={end.y} stroke={color} strokeWidth="2" />
          <line x1={end.x - 7} y1={end.y + 5} x2={end.x + 7} y2={end.y + 5} stroke={color} strokeWidth="2" />
          <line x1={end.x - 3} y1={end.y + 10} x2={end.x + 3} y2={end.y + 10} stroke={color} strokeWidth="2" />
        </>
      ) : (
        <>
          <line x1={end.x} y1={end.y - 11} x2={end.x} y2={end.y + 11} stroke={color} strokeWidth="2" />
          <line
            x1={end.x + direction * 5}
            y1={end.y - 7}
            x2={end.x + direction * 5}
            y2={end.y + 7}
            stroke={color}
            strokeWidth="2"
          />
          <line
            x1={end.x + direction * 10}
            y1={end.y - 3}
            x2={end.x + direction * 10}
            y2={end.y + 3}
            stroke={color}
            strokeWidth="2"
          />
        </>
      )}
      <text
        x={geometry.label.x}
        y={geometry.label.y}
        textAnchor={geometry.label.anchor}
        className="null-label"
        fontSize="15"
        fill={color}
      >
        {fr.viz.null}
      </text>
    </g>
  )
}

function NodeShape({ node }: { node: LdcNode }): JSX.Element {
  const value = node.payload.kind === 'int' ? node.payload.value : null
  const student = node.payload.kind === 'student' ? node.payload.student : null
  const followingUninit = node.suivant.kind === 'uninit'
  const previousUninit = node.precedent.kind === 'uninit'
  const valueUninit = node.payload.kind === 'uninit'

  return (
    <g>
      <g clipPath="url(#ldc-node-clip)">
        <rect width={NODE_W} height={NODE_H} fill="var(--node-bg)" />
        <rect width={CELL_W} height={NODE_H} fill="var(--cell-prev)" />
        <rect x={CELL_W * 2} width={CELL_W} height={NODE_H} fill="var(--cell-next)" />
        <rect x={CELL_W} width={CELL_W} height={NODE_H} fill="var(--cell-value)" />
        {previousUninit ? (
          <rect width={CELL_W} height={NODE_H} fill="url(#hatch-uninit)" />
        ) : null}
        {followingUninit ? (
          <rect
            x={CELL_W * 2}
            width={CELL_W}
            height={NODE_H}
            fill="url(#hatch-uninit)"
          />
        ) : null}
        {valueUninit ? (
          <rect
            x={CELL_W}
            width={CELL_W}
            height={NODE_H}
            fill="url(#hatch-uninit)"
          />
        ) : null}
      </g>
      <rect
        className="node-outline"
        width={NODE_W}
        height={NODE_H}
        rx="14"
        fill="none"
        stroke={node.freed ? 'var(--alert)' : 'var(--node-border)'}
        strokeWidth="1.8"
      />
      <line
        x1={CELL_W}
        y1="0"
        x2={CELL_W}
        y2={NODE_H}
        stroke="var(--node-border)"
        strokeWidth="1"
      />
      <line
        x1={CELL_W * 2}
        y1="0"
        x2={CELL_W * 2}
        y2={NODE_H}
        stroke="var(--node-border)"
        strokeWidth="1"
      />

      <text
        x={CELL_W / 2}
        y="17"
        textAnchor="middle"
        className="cell-label cell-label-prev"
        fontSize="9.5"
      >
        {fr.viz.prevCell}
      </text>
      <text
        x={CELL_W * 2 + CELL_W / 2}
        y="17"
        textAnchor="middle"
        className="cell-label cell-label-next"
        fontSize="9.5"
      >
        {fr.viz.nextCell}
      </text>

      {previousUninit ? (
        <text
          x={CELL_W / 2}
          y={NODE_H * 0.72 + 5}
          textAnchor="middle"
          className="cell-uninit cell-label-prev"
          fontSize="14"
        >
          {fr.common.uninit}
        </text>
      ) : null}
      {followingUninit ? (
        <text
          x={CELL_W * 2 + CELL_W / 2}
          y={NODE_H * 0.38 + 5}
          textAnchor="middle"
          className="cell-uninit cell-label-next"
          fontSize="14"
        >
          {fr.common.uninit}
        </text>
      ) : null}

      {valueUninit ? (
        <text
          x={NODE_W / 2}
          y={NODE_H / 2 + 12}
          textAnchor="middle"
          className="node-uninit"
          fontSize="22"
        >
          ?
        </text>
      ) : student ? (
        <g>
          <text
            x={NODE_W / 2}
            y={NODE_H / 2 - 1}
            textAnchor="middle"
            className="node-value-small"
            fontSize="23"
          >
            {student.numero}
          </text>
          <text
            x={NODE_W / 2}
            y={NODE_H / 2 + 17}
            textAnchor="middle"
            className="node-subvalue"
            fontSize="11.5"
          >
            {shortStudentName(student.prenom, student.nom)}
          </text>
        </g>
      ) : (
        <text
          x={NODE_W / 2}
          y={NODE_H / 2 + 12}
          textAnchor="middle"
          className="node-value"
          fontSize="38"
        >
          {value ?? '?'}
        </text>
      )}

      <text
        x="10"
        y="-10"
        textAnchor="start"
        className="node-address"
        fontSize="13"
      >
        {node.address}
      </text>

      {node.freed ? (
        <g>
          <rect width={NODE_W} height={NODE_H} rx="14" fill="url(#hatch-freed)" opacity="0.72" />
          <rect width={NODE_W} height={NODE_H} rx="14" fill="var(--freed-overlay)" opacity="0.55" />
          <text
            x={NODE_W / 2}
            y={NODE_H / 2 + 4}
            textAnchor="middle"
            className="freed-label"
            fontSize="12"
          >
            {fr.viz.freed}
          </text>
        </g>
      ) : null}
    </g>
  )
}

function PinTag({ pin, tag }: { pin: PinSpec; tag: { x: number; y: number; width: number; height: number } }): JSX.Element {
  const color = pin.dangling ? 'var(--alert)' : pin.color
  return (
    <g className={pin.dangling ? 'pin pin-dangling' : 'pin'}>
      <rect
        x={tag.x}
        y={tag.y}
        width={tag.width}
        height={tag.height}
        rx="8"
        fill="var(--pin-tag-bg)"
        stroke={color}
        strokeWidth="1.6"
        strokeDasharray={pin.target === 'uninit' ? '4 3' : undefined}
      />
      <text
        x={tag.x + tag.width / 2}
        y={tag.y + tag.height * 0.7}
        textAnchor="middle"
        className="pin-text"
        fontSize="13"
        fill={color}
      >
        {pin.text}
      </text>
      <title>{`${pin.name} = ${pin.target}`}</title>
    </g>
  )
}
