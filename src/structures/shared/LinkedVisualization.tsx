import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type {
  CSSProperties,
  JSX,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BaseSnapshot, Change, PointerValue, VisualizationProps } from '../../core/types'
import { fr } from '../../i18n/fr'
import { ZelligeFrieze } from '../../ui/ZelligeFrieze'
import { wheelIntent } from '../../ui/wheelGestures'
import {
  FIELD_W,
  FIT_PADDING,
  HEAP_STACK_X,
  HEAP_Y,
  MAX_K,
  MIN_K,
  NODE_H,
  NODE_W,
  NODE_RX,
  PAD_L,
  ROW_Y,
  STACK_SLIDE,
  STACK_TOP,
  STACK_X,
  VALUE_W,
  cameraAtOne,
  clamp,
  contentBounds,
  emptyBounds,
  emptyRingBand,
  fitCamera,
  globalAnchor,
  isRingNodeFlipped,
  layoutGlobals,
  layoutNodes,
  pointerAnchor,
  ringBand,
  ringGeometry,
  routeField,
  routeGlobal,
  routeRingField,
  unionBounds,
  worldPoint,
  zoomAtCursor,
} from './linkedViz'
import type {
  Camera,
  GlobalPlacement,
  LinkedModel,
  NullStub,
  Point,
  Rect,
  RingGeometry,
  Size,
  VizField,
  VizNode,
  VizPin,
} from './linkedViz'

const FALLBACK_W = 1120
const FALLBACK_H = 620
const CAMERA_ANIMATION = 250

interface LinkedVisualizationProps<S extends BaseSnapshot> extends VisualizationProps<S> {
  model: LinkedModel<S>
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
    case 'precedent':
      return 'var(--arrow-prev)'
    case 'nouveau':
      return 'var(--pin)'
    case 'ancienDebut':
    case 'ancienSommet':
    case 'ancienPremier':
      return 'var(--alert)'
    case 'copie':
      return 'var(--gold)'
    default:
      return 'var(--ink-2)'
  }
}

function pinWidth(name: string): number {
  return Math.max(46, name.length * 8 + 20)
}

function globalColor(name: string): string {
  return name === 'fin' ? 'var(--success)' : 'var(--gold)'
}

function globalMarker(name: string): string {
  return name === 'fin' ? 'arrow-fin' : 'arrow-debut'
}

function globalLegendLabel(name: string): string {
  switch (name) {
    case 'fin':
      return fr.legend.fin
    case 'sommet':
      return fr.legend.sommet
    default:
      return fr.legend.debut
  }
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

interface PinPlacement {
  pin: VizPin
  tag: Rect
  from: Point
  to: Point | null
  dangling: boolean
}

function layoutPins(
  pins: VizPin[],
  nodes: VizNode[],
  layout: Map<number, Point>,
  orientation: 'horizontal' | 'vertical',
  ring: RingGeometry | null = null,
): PinPlacement[] {
  const placements: PinPlacement[] = []
  const groups = new Map<number, VizPin[]>()
  const nullPins: VizPin[] = []
  for (const pin of pins) {
    if (pin.value.kind !== 'node') {
      nullPins.push(pin)
      continue
    }
    const list = groups.get(pin.value.id) ?? []
    list.push(pin)
    groups.set(pin.value.id, list)
  }

  for (const [nodeId, group] of groups) {
    const point = layout.get(nodeId)
    const node = nodes.find((candidate) => candidate.id === nodeId)
    if (!point || !node) continue
    const widths = group.map((pin) => pinWidth(pin.name))

    if (ring && orientation === 'horizontal') {
      const center = { x: point.x + NODE_W / 2, y: point.y + NODE_H / 2 }
      const dx = center.x - ring.cx
      const dy = center.y - ring.cy
      if (Math.abs(dx) >= Math.abs(dy)) {
        const right = dx >= 0
        const totalHeight = group.length * 24 + (group.length - 1) * 6
        let y = center.y - totalHeight / 2
        group.forEach((pin, index) => {
          const width = widths[index] ?? 46
          const tag: Rect = {
            x: right ? point.x + NODE_W + 24 : point.x - width - 24,
            y,
            width,
            height: 24,
          }
          placements.push({
            pin,
            tag,
            from: { x: right ? tag.x : tag.x + width, y: tag.y + tag.height / 2 },
            to: { x: right ? point.x + NODE_W : point.x, y: center.y },
            dangling: node.freed,
          })
          y += 30
        })
        continue
      }

      const above = dy < 0
      const totalWidth = widths.reduce((sum, width) => sum + width + 8, -8)
      if (above) {
        // The top node sits directly under the global cells: keep its pins
        // beside the node so they never cover `debut` or the node address.
        const right = dx >= 0
        let x = right ? point.x + NODE_W + 18 : point.x - totalWidth - 18
        group.forEach((pin, index) => {
          const width = widths[index] ?? 46
          const tag: Rect = {
            x,
            y: point.y - 34,
            width,
            height: 24,
          }
          placements.push({
            pin,
            tag,
            from: right
              ? { x: tag.x, y: tag.y + tag.height / 2 }
              : { x: tag.x + width, y: tag.y + tag.height / 2 },
            to: { x: right ? point.x + NODE_W - 10 : point.x + 10, y: point.y },
            dangling: node.freed,
          })
          x += width + 8
        })
        continue
      }
      let x = center.x - totalWidth / 2
      group.forEach((pin, index) => {
        const width = widths[index] ?? 46
        const tag: Rect = {
          x,
          y: point.y + NODE_H + 14,
          width,
          height: 24,
        }
        placements.push({
          pin,
          tag,
          from: { x: tag.x + width / 2, y: tag.y },
          to: { x: tag.x + width / 2, y: point.y + NODE_H },
          dangling: node.freed,
        })
        x += width + 8
      })
      continue
    }

    const total = widths.reduce((sum, width) => sum + width + 8, -8)
    let x = point.x + NODE_W / 2 - total / 2
    const baseY = orientation === 'horizontal' ? point.y - 38 - (group.length - 1) * 28 : point.y + 10
    group.forEach((pin, index) => {
      const width = widths[index] ?? 46
      const tag: Rect =
        orientation === 'horizontal'
          ? { x, y: baseY, width, height: 24 }
          : { x: point.x + NODE_W + 18, y: baseY + index * 30, width, height: 24 }
      placements.push({
        pin,
        tag,
        from:
          orientation === 'horizontal'
            ? { x: tag.x + width / 2, y: tag.y + tag.height }
            : { x: tag.x, y: tag.y + tag.height / 2 },
        to:
          orientation === 'horizontal'
            ? { x: point.x + NODE_W / 2, y: point.y }
            : { x: point.x + NODE_W, y: point.y + NODE_H / 2 },
        dangling: node.freed,
      })
      x += width + 8
    })
  }

  const row = nodes
    .filter((node) => node.lane === 'row')
    .slice()
    .sort((a, b) => a.slot - b.slot)
  const lastPoint = row.length > 0 ? layout.get(row[row.length - 1]!.id) : undefined
  if (ring && orientation === 'horizontal') {
    if (ring.count >= 2) {
      const totalHeight = nullPins.length * 24 + Math.max(0, nullPins.length - 1) * 6
      let y = ring.cy - totalHeight / 2
      nullPins.forEach((pin) => {
        const width = pinWidth(pin.name)
        const tag: Rect = {
          x: ring.cx - width / 2,
          y,
          width,
          height: 24,
        }
        placements.push({
          pin,
          tag,
          from: { x: tag.x + width / 2, y: tag.y + tag.height / 2 },
          to: null,
          dangling: false,
        })
        y += 30
      })
    } else {
      const point = row.length > 0 ? layout.get(row[0]!.id) : undefined
      nullPins.forEach((pin, index) => {
        const width = pinWidth(pin.name)
        const tag: Rect = {
          x: (point ? point.x : PAD_L) - width - 70,
          y: (point ? point.y + 10 : ROW_Y) + index * 30,
          width,
          height: 24,
        }
        placements.push({
          pin,
          tag,
          from: { x: tag.x + width, y: tag.y + tag.height / 2 },
          to: null,
          dangling: false,
        })
      })
    }
    return placements
  }

  nullPins.forEach((pin, index) => {
    const width = pinWidth(pin.name)
    const point = lastPoint
    const tag: Rect =
      orientation === 'horizontal'
        ? {
            x: (point ? point.x + NODE_W + 70 : PAD_L) + index * 8,
            y: (point ? point.y : ROW_Y) - 44 - index * 28,
            width,
            height: 24,
          }
        : {
            x: (point ? point.x + NODE_W + 18 : STACK_X + NODE_W + 18) + index * 8,
            y: (point ? point.y + NODE_H + 24 : STACK_TOP) + index * 28,
            width,
            height: 24,
          }
    placements.push({
      pin,
      tag,
      from: { x: tag.x + width / 2, y: tag.y + tag.height / 2 },
      to: null,
      dangling: false,
    })
  })

  return placements
}

function NullGround({
  stub,
  color = 'var(--ink-2)',
}: {
  stub: NullStub
  color?: string
}): JSX.Element {
  const { end, orientation } = stub
  return (
    <g className="null-ground">
      {orientation === 'vertical' ? (
        <>
          <line x1={end.x - 11} y1={end.y} x2={end.x + 11} y2={end.y} stroke={color} strokeWidth="2" />
          <line x1={end.x - 7} y1={end.y + 5} x2={end.x + 7} y2={end.y + 5} stroke={color} strokeWidth="2" />
          <line x1={end.x - 3} y1={end.y + 10} x2={end.x + 3} y2={end.y + 10} stroke={color} strokeWidth="2" />
        </>
      ) : (
        <>
          <line x1={end.x} y1={end.y - 11} x2={end.x} y2={end.y + 11} stroke={color} strokeWidth="2" />
          <line x1={end.x + 5} y1={end.y - 7} x2={end.x + 5} y2={end.y + 7} stroke={color} strokeWidth="2" />
          <line x1={end.x + 10} y1={end.y - 3} x2={end.x + 10} y2={end.y + 3} stroke={color} strokeWidth="2" />
        </>
      )}
      <text
        x={stub.label.x}
        y={stub.label.y}
        textAnchor={
          stub.labelAnchor ??
          (stub.orientation === 'vertical' ? 'middle' : 'start')
        }
        className="null-label"
        fontSize="14"
        fill={color}
      >
        {fr.viz.null}
      </text>
    </g>
  )
}

function GlobalCell({
  name,
  legend,
  cell,
  count,
  pulse,
  placement,
  color,
}: {
  name: string
  legend: string
  cell: Rect
  count: number
  pulse: boolean
  placement: GlobalPlacement
  color: string
}): JSX.Element {
  const anchor =
    placement === 'bottom'
      ? { x: cell.x + cell.width / 2, y: cell.y }
      : placement === 'top'
        ? { x: cell.x + cell.width / 2, y: cell.y + cell.height }
        : globalAnchor(cell)
  const captionY = placement === 'bottom' ? cell.y + cell.height + 15 : cell.y - 7
  return (
    <g
      className={pulse ? 'debut-cell debut-cell-pulse' : 'debut-cell'}
      style={{ '--global-color': color } as CSSProperties}
    >
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
        y={cell.y + cell.height / 2 + 6}
        textAnchor="middle"
      >
        {name}
      </text>
      <circle className="debut-cell-dot" cx={anchor.x} cy={anchor.y} r="5" />
      {count > 0 ? (
        <text
          className="debut-cell-caption"
          x={cell.x + cell.width / 2}
          y={captionY}
          textAnchor="middle"
        >
          {legend}
        </text>
      ) : null}
      <title>{`${name} · ${legend}`}</title>
    </g>
  )
}

function NodeShape({
  node,
  fieldLabel,
  field,
  flipped = false,
}: {
  node: VizNode
  fieldLabel: string
  field: VizField
  flipped?: boolean
}): JSX.Element {
  const fieldX = flipped ? 0 : VALUE_W
  const valueX = flipped ? FIELD_W : 0
  const pointerX = flipped ? FIELD_W / 2 : VALUE_W + FIELD_W / 2
  const separatorX = flipped ? FIELD_W : VALUE_W
  const fieldFill = field === 'suivant' ? 'var(--cell-next)' : 'var(--cell-prev)'
  const fieldClass = field === 'suivant' ? 'cell-label-next' : 'cell-label-prev'
  return (
    <g>
      <g clipPath="url(#linked-node-clip)">
        <rect width={NODE_W} height={NODE_H} fill="var(--node-bg)" />
        <rect x={valueX} width={VALUE_W} height={NODE_H} fill="var(--cell-value)" />
        <rect x={fieldX} width={FIELD_W} height={NODE_H} fill={fieldFill} />
        {node.uninit ? (
          <rect x={valueX} width={VALUE_W} height={NODE_H} fill="url(#hatch-uninit)" />
        ) : null}
        {node.pointerUninit ? (
          <rect
            x={fieldX}
            width={FIELD_W}
            height={NODE_H}
            fill="url(#hatch-uninit)"
          />
        ) : null}
      </g>
      <rect
        className="node-outline"
        width={NODE_W}
        height={NODE_H}
        rx={NODE_RX}
        fill="none"
        stroke={node.freed ? 'var(--alert)' : 'var(--node-border)'}
        strokeWidth="1.8"
      />
      <line
        x1={separatorX}
        y1="0"
        x2={separatorX}
        y2={NODE_H}
        stroke="var(--node-border)"
        strokeWidth="1"
      />
      <text
        x={pointerX}
        y="16"
        textAnchor="middle"
        className={`cell-label ${fieldClass}`}
        fontSize="9.5"
      >
        {fieldLabel}
      </text>
      {node.pointerUninit ? (
        <text
          x={pointerX}
          y={NODE_H * 0.68 + 5}
          textAnchor="middle"
          className="node-uninit"
          fontSize="14"
        >
          {fr.common.uninit}
        </text>
      ) : null}
      {node.uninit ? (
        <text
          x={valueX + VALUE_W / 2}
          y={NODE_H / 2 + 12}
          textAnchor="middle"
          className="node-uninit"
          fontSize="22"
        >
          ?
        </text>
      ) : node.subvalue ? (
        <g>
          <text
            x={valueX + VALUE_W / 2}
            y={NODE_H / 2 - 2}
            textAnchor="middle"
            className="node-value-small"
            fontSize="23"
          >
            {node.value}
          </text>
          <text
            x={valueX + VALUE_W / 2}
            y={NODE_H / 2 + 18}
            textAnchor="middle"
            className="node-subvalue"
            fontSize="11.5"
          >
            {node.subvalue}
          </text>
        </g>
      ) : (
        <text
          x={valueX + VALUE_W / 2}
          y={NODE_H / 2 + 12}
          textAnchor="middle"
          className="node-value"
          fontSize="38"
        >
          {node.value}
        </text>
      )}
      <text x="10" y="-10" className="node-address" fontSize="13">
        {node.address}
      </text>
      {node.freed ? (
        <g>
          <rect width={NODE_W} height={NODE_H} rx={NODE_RX} fill="url(#hatch-freed)" opacity="0.72" />
          <rect width={NODE_W} height={NODE_H} rx={NODE_RX} fill="var(--freed-overlay)" opacity="0.55" />
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

function PinTag({ placement }: { placement: PinPlacement }): JSX.Element {
  const { pin, tag, dangling } = placement
  const color = dangling ? 'var(--alert)' : pinColor(pin.name)
  const text = pin.alias ? `${pin.name} · ${fr.viz.alias}` : pin.name
  return (
    <g className={`pin${dangling ? ' pin-dangling' : ''}${pin.alias ? ' pin-alias' : ''}`}>
      <rect
        x={tag.x}
        y={tag.y}
        width={tag.width}
        height={tag.height}
        rx="8"
        fill={pin.alias ? 'var(--pin-soft)' : 'var(--pin-tag-bg)'}
        stroke={color}
        strokeWidth="1.6"
        strokeDasharray={pin.alias ? '4 3' : undefined}
      />
      <text
        x={tag.x + tag.width / 2}
        y={tag.y + tag.height * 0.7}
        textAnchor="middle"
        className="pin-text"
        fontSize="12.5"
        fill={color}
      >
        {text}
      </text>
      <title>{`${pin.name} · ${pin.value.kind === 'node' ? 'pointeur' : fr.viz.null}`}</title>
    </g>
  )
}

export default function LinkedVisualization<S extends BaseSnapshot>({
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
  model,
}: LinkedVisualizationProps<S>): JSX.Element {
  const reducedMotion = Boolean(useReducedMotion())
  const [stageRef, stage] = useElementSize()
  const stageW = Math.max(360, stage.width)
  const stageH = Math.max(240, stage.height)

  const nodes = useMemo(() => model.nodes(snapshot), [model, snapshot])
  const globals = useMemo(() => model.globals(snapshot), [model, snapshot])
  const pins = useMemo(() => model.pins(snapshot), [model, snapshot])
  const ring = useMemo(
    () =>
      model.circular && model.orientation === 'horizontal'
        ? ringGeometry(nodes)
        : null,
    [model.circular, model.orientation, nodes],
  )
  const layout = useMemo(
    () => layoutNodes(nodes, model.orientation, ring ? 'ring' : 'row'),
    [nodes, model.orientation, ring],
  )
  const ringFlips = useMemo(() => {
    const flips = new Map<number, boolean>()
    if (!ring) return flips
    for (const node of nodes) {
      if (node.lane !== 'row') continue
      const point = layout.get(node.id)
      if (!point) continue
      const targetPoint =
        node.pointer.kind === 'node'
          ? layout.get(node.pointer.id) ?? null
          : null
      flips.set(node.id, isRingNodeFlipped(point, ring, targetPoint))
    }
    return flips
  }, [nodes, layout, ring])
  const globalCells = useMemo(
    () => layoutGlobals(globals, nodes, layout, model.orientation, ring),
    [globals, nodes, layout, model.orientation, ring],
  )
  const pinPlacements = useMemo(
    () => layoutPins(pins, nodes, layout, model.orientation, ring),
    [pins, nodes, layout, model.orientation, ring],
  )
  const content = useMemo(
    () => contentBounds(nodes, globals, pins, model.orientation, ring),
    [nodes, globals, pins, model.orientation, ring],
  )
  const operationBounds = useMemo(() => {
    if (!operationSteps || operationSteps.length === 0) return null
    return unionBounds(
      operationSteps.map((operationStep) => {
        const stepNodes = model.nodes(operationStep.snapshot)
        const stepRing =
          model.circular && model.orientation === 'horizontal'
            ? ringGeometry(stepNodes)
            : null
        return contentBounds(
          stepNodes,
          model.globals(operationStep.snapshot),
          model.pins(operationStep.snapshot),
          model.orientation,
          stepRing,
        )
      }),
    )
  }, [operationSteps, model])
  const fitBounds = operationBounds ?? content
  const empty = nodes.length === 0

  const autoCamera = useMemo(
    () =>
      empty
        ? cameraAtOne(emptyBounds(model.orientation), { width: stageW, height: stageH })
        : fitCamera(fitBounds, { width: stageW, height: stageH }, FIT_PADDING),
    [empty, fitBounds, model.orientation, stageW, stageH],
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
        // The first requestAnimationFrame timestamp can be a few milliseconds
        // older than the performance.now() taken when the animation starts.
        // Clamp both ends so the cubic easing never overshoots into a huge or
        // negative zoom.
        const progress = clamp((now - start) / duration, 0, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const next = {
          x: from.x + (target.x - from.x) * eased,
          y: from.y + (target.y - from.y) * eased,
          k: from.k + (target.k - from.k) * eased,
        }
        cameraRef.current = next
        setCamera(next)
        if (progress < 1) frameRef.current = requestAnimationFrame(tick)
        else frameRef.current = null
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
      if (animated) animateTo(next, reducedMotion ? 0 : CAMERA_ANIMATION / 1000)
      else {
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
      enterManual(
        zoomAtCursor(cameraRef.current, { x: size.width / 2, y: size.height / 2 }, factor, MIN_K, MAX_K),
        true,
      )
    },
    [enterManual],
  )

  const resetZoom = useCallback((): void => {
    enterManual(cameraAtOne(fitBoundsRef.current, stageSizeRef.current), true)
  }, [enterManual])

  useEffect(() => {
    const element = stageRef.current
    if (!element) return
    const handleWheel = (event: WheelEvent): void => {
      if ((event.target as Element | null)?.closest('.camera-toolbar')) return
      event.preventDefault()
      const rect = element.getBoundingClientRect()
      const intent = wheelIntent(event, rect.height)
      if (intent.kind === 'pan') {
        enterManual(
          {
            k: cameraRef.current.k,
            x: cameraRef.current.x - intent.dx,
            y: cameraRef.current.y - intent.dy,
          },
          false,
        )
        return
      }
      const cursor = { x: event.clientX - rect.left, y: event.clientY - rect.top }
      enterManual(zoomAtCursor(cameraRef.current, cursor, intent.factor, MIN_K, MAX_K), false)
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
      const k = clamp(gesture.startCamera.k * (distance / gesture.startDistance), MIN_K, MAX_K)
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

  const newNodeIds = new Set(
    step.changes.filter((change) => change.kind === 'create').map((change) => change.nodeId),
  )
  const evalNodes = new Set(
    (step.evals ?? []).flatMap((entry) => (entry.nodeId === undefined ? [] : [entry.nodeId])),
  )
  const globalNames = new Set(globals.map((global) => global.name))
  const globalChanges = step.changes.filter(
    (change) =>
      change.kind === 'variable' &&
      change.scope === 'global' &&
      globalNames.has(change.name),
  )
  const pointerChanges = step.changes.filter(
    (change): change is Extract<Change, { kind: 'pointer' }> =>
      change.kind === 'pointer' && change.field === model.field,
  )

  const handleNode = (node: VizNode): void => {
    if (suppressClickRef.current) return
    if (!node.freed && onNodeClick) onNodeClick(node.id)
  }

  const handleKey = (event: ReactKeyboardEvent<SVGGElement>, node: VizNode): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleNode(node)
    }
  }

  const strokeWidth = presentation ? 4 : 3
  const findNode = (pointer: PointerValue): VizNode | null => {
    if (pointer.kind !== 'node') return null
    return nodes.find((node) => node.id === pointer.id) ?? null
  }
  const routeFor = (source: VizNode, pointer: PointerValue) => {
    if (pointer.kind === 'uninit') return null
    const point = layout.get(source.id)
    if (!point) return null
    const target = findNode(pointer)
    const targetPoint = target ? layout.get(target.id) ?? null : null
    if (ring) {
      return routeRingField(
        source,
        target,
        point,
        targetPoint,
        model.field,
        ring,
        ringFlips.get(source.id) ?? false,
      )
    }
    return routeField(
      point,
      target,
      targetPoint,
      model.field,
      model.orientation,
      Boolean(target && target.lane === source.lane),
      target ? target.slot - source.slot : 0,
      Boolean(model.circular),
    )
  }

  const bounds = content
  const bandX = bounds.x - 24
  const bandWidth = Math.max(320, bounds.width + 48)
  const rowBand: Rect =
    model.orientation === 'horizontal'
      ? { x: bandX, y: ROW_Y - 84, width: bandWidth, height: NODE_H + 150 }
      : {
          x: STACK_X - 110,
          y: STACK_TOP - 92,
          width: NODE_W + 220,
          height: Math.max(190, nodes.filter((node) => node.lane === 'row').length * STACK_SLIDE + 60),
        }
  const ringBandGeometry = ring ? ringBand(ring) : null
  const drawnRingBand =
    ringBandGeometry ?? (model.circular && empty ? emptyRingBand() : null)
  const heapNodes = nodes.filter((node) => node.lane === 'heap')
  const heapBand: Rect | null =
    heapNodes.length > 0 || model.showHeap
      ? model.orientation === 'horizontal'
        ? { x: bandX, y: HEAP_Y - 66, width: bandWidth, height: NODE_H + 130 }
        : {
            x: HEAP_STACK_X - 60,
            y: STACK_TOP - 92,
            width: NODE_W + 120,
            height: Math.max(190, heapNodes.length * STACK_SLIDE + 60),
          }
      : null
  const pulseGlobal = step.badge === 'debut-modifie' || globalChanges.length > 0

  const oldGlobalRoutes = globalChanges.flatMap((change) => {
    if (change.kind !== 'variable' || !isPointerValue(change.from)) return []
    const index = globals.findIndex((global) => global.name === change.name)
    const placed = globalCells.get(change.name)
    if (index < 0 || !placed) return []
    const target = findNode(change.from)
    const route = routeGlobal(
      placed.rect,
      target,
      target ? layout.get(target.id) ?? null : null,
      index,
      model.orientation,
      placed.placement,
    )
    return [{ key: `${change.name}-old-${stepIndex}`, route }]
  })
  const newGlobalRoutes = globalChanges.flatMap((change) => {
    if (change.kind !== 'variable' || !isPointerValue(change.to)) return []
    const index = globals.findIndex((global) => global.name === change.name)
    const placed = globalCells.get(change.name)
    if (index < 0 || !placed) return []
    const target = findNode(change.to)
    const route = routeGlobal(
      placed.rect,
      target,
      target ? layout.get(target.id) ?? null : null,
      index,
      model.orientation,
      placed.placement,
    )
    return [{ key: `${change.name}-new-${stepIndex}`, route }]
  })

  return (
    <div
      className={`viz-stage${panning ? ' panning' : ''}${empty ? ' is-empty' : ''}`}
      ref={stageRef}
    >
      <ZelligeFrieze />
      <svg
        className="viz-svg"
        viewBox={`0 0 ${stageW} ${stageH}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={model.ariaLabel}
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
          <clipPath id="linked-node-clip">
            <rect width={NODE_W} height={NODE_H} rx={NODE_RX} />
          </clipPath>
          {(
            [
              ['arrow-next', 'var(--arrow-next)'],
              ['arrow-prev', 'var(--arrow-prev)'],
              ['arrow-alert', 'var(--alert)'],
              ['arrow-success', 'var(--success)'],
              ['arrow-debut', 'var(--gold)'],
              ['arrow-fin', 'var(--success)'],
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
        </defs>

        <rect width={stageW} height={stageH} fill="url(#camera-grid)" />

        <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.k})`}>
          {heapBand ? (
            <>
              <rect
                className="lane-band lane-band-heap"
                x={heapBand.x}
                y={heapBand.y}
                width={heapBand.width}
                height={heapBand.height}
                rx="14"
              />
              <text x={heapBand.x + 14} y={heapBand.y + 22} className="lane-band-label" fontSize="13">
                {fr.viz.heap}
              </text>
            </>
          ) : null}
          {drawnRingBand ? (
            <>
              <ellipse
                className="lane-band lane-band-circle"
                cx={drawnRingBand.cx}
                cy={drawnRingBand.cy}
                rx={drawnRingBand.rx}
                ry={drawnRingBand.ry}
              />
              {ring && ring.rx > 1 && ring.ry > 1 ? (
                <ellipse
                  className="ring-guide"
                  cx={ring.cx}
                  cy={ring.cy}
                  rx={ring.rx}
                  ry={ring.ry}
                />
              ) : null}
              <text
                x={drawnRingBand.cx - drawnRingBand.rx * 0.72}
                y={drawnRingBand.cy - drawnRingBand.ry - 8}
                className="lane-band-label"
                fontSize="13"
              >
                {model.rowLabel}
              </text>
            </>
          ) : (
            <>
              <rect
                className="lane-band lane-band-row"
                x={rowBand.x}
                y={rowBand.y}
                width={rowBand.width}
                height={rowBand.height}
                rx="14"
              />
              <text x={rowBand.x + 14} y={rowBand.y + 22} className="lane-band-label" fontSize="13">
                {model.rowLabel}
              </text>
            </>
          )}

          {[...evalNodes].map((id) => {
            const point = layout.get(id)
            if (!point) return null
            return (
              <circle
                key={`eval-${id}-${stepIndex}`}
                className={reducedMotion ? 'node-pulse node-pulse-static' : 'node-pulse'}
                cx={point.x + NODE_W / 2}
                cy={point.y + NODE_H / 2}
                r={NODE_W * 0.38}
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
                  className={`node-group${node.freed ? ' node-freed' : ''}`}
                  initial={isNew ? { opacity: 0, scale: 0.92, x: point.x, y: point.y } : false}
                  animate={{ opacity: 1, scale: 1, x: point.x, y: point.y }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: reducedMotion ? 0.001 : Math.max(0.1, 0.38 / speed) }}
                  style={node.freed ? undefined : { cursor: onNodeClick ? 'pointer' : 'default' }}
                  onClick={() => handleNode(node)}
                  onKeyDown={(event) => handleKey(event, node)}
                  role={node.freed ? undefined : 'button'}
                  tabIndex={node.freed ? undefined : 0}
                  aria-label={
                    node.freed
                      ? `${fr.common.node} ${node.id} ${fr.common.freed}`
                      : `${fr.common.node} ${node.id}, ${fr.common.value} ${node.value}`
                  }
                >
                  <title>
                    {node.freed ? fr.viz.freed : `${fr.common.node} ${node.id} · ${node.address}`}
                  </title>
                  <NodeShape
                    node={node}
                    fieldLabel={model.fieldLabel}
                    field={model.field}
                    flipped={ringFlips.get(node.id) ?? false}
                  />
                </motion.g>
              )
            })}
          </AnimatePresence>

          {nodes
            .filter((node) => !node.freed)
            .flatMap((node) => {
              if (node.pointerUninit || node.pointer.kind === 'uninit') return []
              const route = routeFor(node, node.pointer)
              if (!route) return []
              if (route.nullStub) {
                return [
                  <g key={`null-${node.id}`} className="null-stub">
                    <path
                      d={route.path}
                      className={`arrow arrow-${model.field}`}
                      style={{ strokeWidth }}
                    />
                    <NullGround stub={route.nullStub} />
                    <title>{`${model.field} de ${node.address} = ${fr.viz.null}`}</title>
                  </g>,
                ]
              }
              return [
                <path
                  key={`arrow-${node.id}`}
                  d={route.path}
                  className={`arrow arrow-${model.field}`}
                  style={{ strokeWidth }}
                  markerEnd={model.field === 'suivant' ? 'url(#arrow-next)' : 'url(#arrow-prev)'}
                >
                  <title>{`${model.field} de ${node.address}`}</title>
                </path>,
              ]
            })}

          {nodes
            .filter((node) => !node.freed && !node.pointerUninit && node.pointer.kind !== 'uninit')
            .map((node) => {
              const point = layout.get(node.id)
              if (!point) return null
              const anchor = pointerAnchor(
                point,
                model.field,
                model.orientation,
                ringFlips.get(node.id) ?? false,
              )
              return (
                <circle
                  key={`dot-${node.id}`}
                  className={`pointer-dot pointer-dot-${model.field}`}
                  cx={anchor.x}
                  cy={anchor.y}
                  r="5.5"
                />
              )
            })}

          {pointerChanges.map((change, index) => {
            const source = nodes.find((node) => node.id === change.nodeId)
            if (!source) return null
            const oldRoute = routeFor(source, change.from)
            const newRoute = routeFor(source, change.to)
            const duration = reducedMotion ? 0.001 : Math.max(0.18, 0.85 / speed)
            return (
              <g key={`change-${change.nodeId}-${index}-${stepIndex}`}>
                {oldRoute ? (
                  <motion.path
                    d={oldRoute.path}
                    className="arrow arrow-old"
                    style={{ strokeWidth: strokeWidth + 0.4 }}
                    markerEnd={oldRoute.nullStub ? undefined : 'url(#arrow-alert)'}
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
                    markerEnd={newRoute.nullStub ? undefined : 'url(#arrow-success)'}
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

          {pinPlacements.map((placement, index) => {
            if (!placement.to) return null
            const color = placement.dangling ? 'var(--alert)' : pinColor(placement.pin.name)
            return (
              <line
                key={`pin-line-${placement.pin.name}-${index}`}
                className="pin-line"
                x1={placement.from.x}
                y1={placement.from.y}
                x2={placement.to.x}
                y2={placement.to.y}
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray={placement.pin.alias || placement.dangling ? '4 3' : undefined}
                opacity="0.8"
              />
            )
          })}
          {pinPlacements.map((placement, index) => (
            <PinTag key={`pin-${placement.pin.name}-${index}`} placement={placement} />
          ))}

          {globals.map((global, index) => {
            const placed = globalCells.get(global.name)
            if (!placed) return null
            const target = findNode(global.value)
            const route = routeGlobal(
              placed.rect,
              target,
              target ? layout.get(target.id) ?? null : null,
              index,
              model.orientation,
              placed.placement,
            )
            const color = globalColor(global.name)
            return (
              <g key={`global-${global.name}`}>
                <path
                  d={route.path}
                  className={`arrow ${global.name === 'fin' ? 'arrow-fin' : 'arrow-gold'}`}
                  style={{ strokeWidth }}
                  markerEnd={route.nullStub ? undefined : `url(#${globalMarker(global.name)})`}
                />
                {route.nullStub ? <NullGround stub={route.nullStub} color={color} /> : null}
              </g>
            )
          })}

          {oldGlobalRoutes.map(({ key, route }) => (
            <motion.path
              key={key}
              d={route.path}
              className="arrow arrow-old"
              style={{ strokeWidth: strokeWidth + 0.4 }}
              markerEnd={route.nullStub ? undefined : 'url(#arrow-alert)'}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0.001 : Math.max(0.18, 0.85 / speed) }}
            />
          ))}
          {newGlobalRoutes.map(({ key, route }) => (
            <motion.path
              key={key}
              d={route.path}
              className="arrow arrow-new"
              style={{ strokeWidth: strokeWidth + 0.4 }}
              markerEnd={route.nullStub ? undefined : 'url(#arrow-success)'}
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
          ))}

          {globals.map((global) => {
            const placed = globalCells.get(global.name)
            if (!placed) return null
            return (
              <GlobalCell
                key={`global-cell-${global.name}-${stepIndex}`}
                name={global.name}
                legend={globalLegendLabel(global.name)}
                cell={placed.rect}
                count={globals.length}
                pulse={pulseGlobal}
                placement={placed.placement}
                color={globalColor(global.name)}
              />
            )
          })}
        </g>
      </svg>

      {empty ? (
        <div className="empty-overlay empty-overlay-docked">
          <p className="empty-overlay-text">{model.emptyText}</p>
          <button type="button" className="primary-button empty-insert-button" onClick={onEmptyInsert}>
            {model.emptyInsert}
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
            <path
              d="M2 6h21"
              stroke={model.field === 'suivant' ? 'var(--arrow-next)' : 'var(--arrow-prev)'}
              strokeWidth="2.5"
              strokeDasharray={model.field === 'suivant' ? undefined : '5 3'}
            />
            <path
              d="m21 2 5 4-5 4Z"
              fill={model.field === 'suivant' ? 'var(--arrow-next)' : 'var(--arrow-prev)'}
            />
          </svg>
          {model.field === 'suivant' ? fr.legend.next : fr.legend.prev}
        </span>
        {globals.map((global) => (
          <span className="legend-item" key={`legend-global-${global.name}`}>
            <svg viewBox="0 0 28 12" aria-hidden="true">
              <rect
                x="4"
                y="2"
                width="20"
                height="8"
                rx="2"
                fill="none"
                stroke={globalColor(global.name)}
                strokeWidth="2"
              />
            </svg>
            {globalLegendLabel(global.name)}
          </span>
        ))}
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
