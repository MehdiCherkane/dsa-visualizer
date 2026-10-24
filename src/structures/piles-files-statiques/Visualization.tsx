import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type {
  JSX,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { VisualizationProps } from '../../core/types'
import { fr } from '../../i18n/fr'
import {
  ARRAY_X,
  ARRAY_Y,
  CAMERA_ANIMATION,
  CELL_H,
  CELL_W,
  FIT_PADDING,
  INDEX_Y,
  MAX_AUTO_K,
  MAX_K,
  MIN_AUTO_K,
  MIN_K,
  ROW_W,
  TAG_H,
  TAPE_BOX_H,
  TAPE_Y,
  cameraAtOne,
  cellRect,
  clamp,
  contentBounds,
  fifoGeometry,
  fitCamera,
  queueMarkers,
  stackMarker,
  tapeGeometry,
  unionBounds,
  worldPoint,
  wrapGeometry,
  zoomAtCursor,
} from './geometry'
import type { Camera, MarkerGeometry, MarkerTone, Point, Size } from './geometry'
import {
  cellText,
  countOccupied,
  isEmpty,
  isFull,
  liveIndexSet,
  occupiedIndices,
  readGlobalInt,
} from './memory'
import type { ArrayEntry, ArrayProfileId, ArraySnapshot, TapeStatus } from './memory'
import './staticStructures.css'

const FALLBACK_W = 1120
const FALLBACK_H = 620

const B = fr.staticStructures.bilan
const V = fr.staticStructures.viz

const TONE_COLORS: Record<MarkerTone, string> = {
  gold: 'var(--gold)',
  success: 'var(--success)',
  alert: 'var(--alert)',
  ink: 'var(--ink-2)',
}

/** Room kept clear around the array for the HUD and the empty-state banner. */
const EMPTY_CAMERA_INSETS = { top: 82, bottom: 128 }
const EMPTY_COMPACT_CAMERA_INSETS = { top: 100, bottom: 128 }

function plain(text: string): string {
  return text.replaceAll('`', '')
}

function structureLabel(profile: ArrayProfileId): string {
  switch (profile) {
    case 'pile':
      return fr.profiles.pile
    case 'file-ordinaire':
      return fr.profiles.file1
    case 'file-decalage':
      return fr.profiles.file2
    case 'file-circulaire':
      return fr.profiles.file3
  }
}

function stateText(snapshot: ArraySnapshot): string {
  if (isEmpty(snapshot)) {
    if (snapshot.profile === 'pile') return V.stateEmptyPile
    if (snapshot.profile === 'file-decalage') return V.stateEmptyFileDecalage
    return V.stateEmptyFile
  }
  if (isFull(snapshot)) {
    return snapshot.profile === 'pile' ? V.stateFullPile : V.stateFullFile
  }
  return V.stateCount(countOccupied(snapshot), snapshot.capacity)
}

function stateClass(snapshot: ArraySnapshot): string {
  if (isEmpty(snapshot)) return 'is-empty'
  if (isFull(snapshot)) return 'is-full'
  return 'is-ok'
}

function versionHint(profile: ArrayProfileId): string {
  switch (profile) {
    case 'pile':
      return V.pileHint
    case 'file-ordinaire':
      return V.ordinaireHint
    case 'file-decalage':
      return V.decalageHint
    case 'file-circulaire':
      return V.circulaireHint
  }
}

function emptyText(snapshot: ArraySnapshot): string {
  if (snapshot.profile === 'pile') return plain(V.emptyPile)
  if (snapshot.profile === 'file-decalage') return plain(V.emptyFileDecalage)
  return plain(V.emptyFile)
}

function insertText(profile: ArrayProfileId): string {
  return profile === 'pile' ? V.insertPile : V.insertFile
}

function tapeStatusLabel(status: TapeStatus): string {
  switch (status) {
    case 'valid':
      return V.tapeValid
    case 'invalid':
      return V.tapeInvalid
    case 'scanning':
      return V.tapeScanning
    default:
      return V.tapeReady
  }
}

type CellKind = 'top' | 'head' | 'tail' | null

function cellKind(snapshot: ArraySnapshot, index: number): CellKind {
  if (snapshot.profile === 'pile') {
    return readGlobalInt(snapshot, 'sommet') === index ? 'top' : null
  }
  if (snapshot.profile === 'file-decalage') {
    const ar = readGlobalInt(snapshot, 'ar')
    if (ar <= 0) return null
    if (index === 0) return 'head'
    if (index === ar - 1) return 'tail'
    return null
  }
  const av = readGlobalInt(snapshot, 'av')
  const ar = readGlobalInt(snapshot, 'ar')
  if (av < 0) return null
  if (index === av) return 'head'
  if (index === ar) return 'tail'
  return null
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

function MarkerTag({
  marker,
  changed,
}: {
  marker: MarkerGeometry
  changed: boolean
}): JSX.Element {
  const color = TONE_COLORS[marker.tone]
  const centerX = marker.tag.x + marker.tag.width / 2
  return (
    <g className={`ss-marker${changed ? ' is-changed' : ''}${marker.dashed ? ' is-dashed' : ''}`}>
      <line
        x1={centerX}
        y1={marker.tag.y + TAG_H}
        x2={marker.tip.x}
        y2={marker.tip.y - 5}
        stroke={color}
        strokeWidth="1.6"
        strokeDasharray={marker.dashed ? '4 4' : undefined}
      />
      <circle cx={marker.tip.x} cy={marker.tip.y - 2} r="4" fill={color} />
      <rect
        x={marker.tag.x}
        y={marker.tag.y}
        width={marker.tag.width}
        height={TAG_H}
        rx="9"
        fill="var(--panel)"
        stroke={color}
        strokeWidth="1.7"
      />
      <text
        x={centerX}
        y={marker.tag.y + TAG_H / 2 + 5}
        textAnchor="middle"
        className="ss-marker-text"
        fill={color}
      >
        {marker.text}
      </text>
      <title>{marker.text}</title>
    </g>
  )
}

function CellShape({
  entry,
  kind,
  rank,
  live,
  changed,
  stepIndex,
  index,
}: {
  entry: ArrayEntry
  kind: CellKind
  rank: number | null
  live: boolean
  changed: boolean
  stepIndex: number
  index: number
}): JSX.Element {
  const text = String(entry.value.value)
  const isChar = entry.value.kind === 'char'
  const fontSize = isChar ? 32 : text.length > 2 ? 25 : 31
  return (
    <g>
      <rect
        className={`ss-cell ${live ? 'is-live' : 'is-stale'}${kind ? ` is-${kind}` : ''}`}
        width={CELL_W}
        height={CELL_H}
        rx={14}
      />
      {!live ? (
        <rect
          width={CELL_W}
          height={CELL_H}
          rx={14}
          fill="url(#ss-hatch-stale)"
          opacity="0.5"
        />
      ) : null}
      {kind === 'top' || kind === 'head' ? (
        <rect
          className="ss-cell-accent"
          x={16}
          y={0}
          width={CELL_W - 32}
          height={5}
          rx="2.5"
          fill={kind === 'top' || kind === 'head' ? 'var(--gold)' : 'var(--success)'}
        />
      ) : null}
      {kind === 'tail' ? (
        <rect
          className="ss-cell-accent"
          x={16}
          y={0}
          width={CELL_W - 32}
          height={5}
          rx="2.5"
          fill="var(--success)"
        />
      ) : null}
      {rank !== null ? (
        <g className={`ss-rank${kind === 'head' ? ' is-head' : ''}${kind === 'tail' ? ' is-tail' : ''}`}>
          <circle cx="18" cy="18" r="11" />
          <text x="18" y="22" textAnchor="middle" className="ss-rank-text">
            {rank}
          </text>
        </g>
      ) : null}
      <text
        x={CELL_W / 2}
        y={CELL_H / 2 + 11}
        textAnchor="middle"
        className={`ss-cell-value${live ? '' : ' is-stale'}`}
        fontSize={fontSize}
      >
        {text}
      </text>
      {changed ? (
        <rect
          key={`flash-${stepIndex}-${index}`}
          className="ss-cell-flash"
          width={CELL_W}
          height={CELL_H}
          rx={14}
        />
      ) : null}
      <title>
        {`elements[${index}] = ${cellText(entry)}${live ? '' : ` · ${V.stale}`}`}
      </title>
    </g>
  )
}

function FreeCell({ index, showLabel }: { index: number; showLabel: boolean }): JSX.Element {
  const rect = cellRect(index)
  return (
    <g>
      <rect
        className="ss-cell is-free"
        x={rect.x}
        y={rect.y}
        width={CELL_W}
        height={CELL_H}
        rx={14}
      />
      {showLabel ? (
        <text
          x={rect.x + CELL_W / 2}
          y={rect.y + CELL_H / 2 + 5}
          textAnchor="middle"
          className="ss-free-label"
        >
          {V.free}
        </text>
      ) : null}
      <title>{`elements[${index}] · ${V.free}`}</title>
    </g>
  )
}

export function BilanOverlay({ onClose }: { onClose: () => void }): JSX.Element {
  const closeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const handle = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handle)
    const timer = window.setTimeout(() => closeRef.current?.focus(), 0)
    return () => {
      window.removeEventListener('keydown', handle)
      window.clearTimeout(timer)
    }
  }, [onClose])

  return (
    <div className="ss-bilan-backdrop">
      <button
        type="button"
        className="ss-bilan-scrim"
        aria-label={V.bilanClose}
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        className="ss-bilan"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ss-bilan-title"
      >
        <header className="ss-bilan-header">
          <div>
            <h2 id="ss-bilan-title">{B.title}</h2>
            <p className="ss-bilan-subtitle">{B.subtitle}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="ss-bilan-close"
            onClick={onClose}
            aria-label={V.bilanClose}
            title={V.bilanClose}
          >
            ×
          </button>
        </header>

        <div className="ss-bilan-body">
          <table className="ss-bilan-table">
            <thead>
              <tr>
                <th scope="col">{B.columns.version}</th>
                <th scope="col">{B.columns.defiler}</th>
                <th scope="col">{B.columns.space}</th>
                <th scope="col">{B.columns.variables}</th>
                <th scope="col">{B.columns.trap}</th>
              </tr>
            </thead>
            <tbody>
              {B.rows.map((row) => (
                <tr key={row.version}>
                  <th scope="row">{row.version}</th>
                  <td>{row.defiler}</td>
                  <td>{row.space}</td>
                  <td className="ss-mono">{row.variables}</td>
                  <td>{row.trap}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="ss-bilan-note">{B.note}</p>

          <div className="ss-bilan-traces">
            <section className="ss-trace">
              <h3>{B.pileTraceTitle}</h3>
              <table className="ss-trace-table">
                <thead>
                  <tr>
                    <th scope="col">{B.pileTraceColumns.step}</th>
                    <th scope="col">{B.pileTraceColumns.action}</th>
                    <th scope="col">{B.pileTraceColumns.content}</th>
                    <th scope="col">{B.pileTraceColumns.sommet}</th>
                  </tr>
                </thead>
                <tbody>
                  {B.pileTraceRows.map((row) => (
                    <tr key={row.step}>
                      <td>{row.step}</td>
                      <td className="ss-mono">{row.action}</td>
                      <td className="ss-mono">{row.content}</td>
                      <td className="ss-mono">{row.sommet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="ss-trace">
              <h3>{B.fileTraceTitle}</h3>
              <table className="ss-trace-table">
                <thead>
                  <tr>
                    <th scope="col">{B.fileTraceColumns.step}</th>
                    <th scope="col">{B.fileTraceColumns.action}</th>
                    <th scope="col">{B.fileTraceColumns.av}</th>
                    <th scope="col">{B.fileTraceColumns.ar}</th>
                  </tr>
                </thead>
                <tbody>
                  {B.fileTraceRows.map((row) => (
                    <tr key={row.step}>
                      <td>{row.step}</td>
                      <td className="ss-mono">{row.action}</td>
                      <td className="ss-mono">{row.av}</td>
                      <td className="ss-mono">{row.ar}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <p className="ss-bilan-note">{B.traceNote}</p>
        </div>
      </div>
    </div>
  )
}

export default function StaticStructuresVisualization({
  snapshot,
  step,
  operationSteps,
  cameraResetKey,
  callText,
  onEmptyInsert,
  speed,
  stepIndex,
}: VisualizationProps<ArraySnapshot>): JSX.Element {
  const reducedMotion = Boolean(useReducedMotion())
  const [stageRef, stage] = useElementSize()
  const stageW = Math.max(360, stage.width)
  const stageH = Math.max(240, stage.height)
  const empty = isEmpty(snapshot)

  const [bilanOpen, setBilanOpen] = useState(false)
  const closeBilan = useCallback(() => setBilanOpen(false), [])

  const live = useMemo(() => liveIndexSet(snapshot), [snapshot])
  const ranks = useMemo(() => {
    const result = new Map<number, number>()
    if (snapshot.profile !== 'pile') {
      occupiedIndices(snapshot).forEach((index, position) => result.set(index, position + 1))
    }
    return result
  }, [snapshot])
  const markers = useMemo(
    () => (snapshot.profile === 'pile' ? [stackMarker(snapshot)] : queueMarkers(snapshot)),
    [snapshot],
  )
  const fifo = useMemo(() => fifoGeometry(snapshot), [snapshot])
  const wrap = useMemo(
    () => (snapshot.profile === 'file-circulaire' ? wrapGeometry() : null),
    [snapshot.profile],
  )
  const tape = useMemo(
    () => (snapshot.tape ? tapeGeometry(snapshot.tape) : null),
    [snapshot.tape],
  )
  const content = useMemo(() => contentBounds(snapshot), [snapshot])
  const operationBounds = useMemo(() => {
    if (!operationSteps || operationSteps.length === 0) return null
    return unionBounds(operationSteps.map((operationStep) => contentBounds(operationStep.snapshot)))
  }, [operationSteps])
  const fitBounds = operationBounds ?? content

  const autoCamera = useMemo(
    () =>
      fitCamera(
        fitBounds,
        { width: stageW, height: stageH },
        FIT_PADDING,
        MIN_AUTO_K,
        MAX_AUTO_K,
        empty && onEmptyInsert
          ? stageW < 620
            ? EMPTY_COMPACT_CAMERA_INSETS
            : EMPTY_CAMERA_INSETS
          : undefined,
      ),
    [empty, fitBounds, onEmptyInsert, stageW, stageH],
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
        zoomAtCursor(
          cameraRef.current,
          { x: size.width / 2, y: size.height / 2 },
          factor,
          MIN_K,
          MAX_K,
        ),
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
      const target = event.target as Element | null
      if (target?.closest('.camera-toolbar, .ss-bilan, .ss-bilan-toggle')) return
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
      if (isTypingTarget(event.target) || bilanOpen) return
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
  }, [bilanOpen, fitView, zoomBy])

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>): void => {
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
    if (target.closest('.camera-toolbar')) return
    fitView()
  }

  const handleKeyDown = (event: ReactKeyboardEvent<SVGSVGElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      fitView()
    }
  }

  const changedIndices = new Set(
    step.changes.flatMap((change) => (change.kind === 'cell' ? [change.index] : [])),
  )
  const changedGlobals = new Set(
    step.changes.flatMap((change) =>
      change.kind === 'variable' && change.scope === 'global' ? [change.name] : [],
    ),
  )
  const wrapActive =
    snapshot.profile === 'file-circulaire' &&
    step.changes.some((change) => {
      if (change.kind !== 'variable' || change.scope !== 'global') return false
      if (change.name !== 'av' && change.name !== 'ar') return false
      if (change.from.kind !== 'int' || change.to.kind !== 'int') return false
      return change.to.value < change.from.value
    })

  const duration = reducedMotion ? 0.001 : Math.max(0.1, 0.34 / speed)

  return (
    <div
      className={`viz-stage${panning ? ' panning' : ''}${empty ? ' is-empty' : ''}`}
      ref={stageRef}
    >
      <svg
        className="viz-svg"
        viewBox={`0 0 ${stageW} ${stageH}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={V.ariaLabel}
        tabIndex={0}
        onKeyDown={handleKeyDown}
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
            id="ss-hatch-stale"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--hatch-uninit)" strokeWidth="1.6" />
          </pattern>
          {(
            [
              ['ss-arrow-gold', 'var(--gold)'],
              ['ss-arrow-success', 'var(--success)'],
              ['ss-arrow-muted', 'var(--line-strong)'],
            ] as const
          ).map(([id, fill]) => (
            <marker
              key={id}
              id={id}
              viewBox="0 0 12 10"
              refX="11"
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
          <rect
            className="ss-band"
            x={ARRAY_X - 18}
            y={ARRAY_Y - 14}
            width={ROW_W + 36}
            height={CELL_H + 28}
            rx="18"
          />

          {snapshot.cells.map((entry, index) =>
            entry ? null : (
              <FreeCell key={`free-${index}`} index={index} showLabel={empty} />
            ),
          )}

          <AnimatePresence initial={false}>
            {snapshot.cells.map((entry, index) => {
              if (!entry) return null
              const rect = cellRect(index)
              return (
                <motion.g
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0.9, x: rect.x, y: rect.y }}
                  animate={{ opacity: 1, scale: 1, x: rect.x, y: rect.y }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration, ease: 'easeOut' }}
                >
                  <CellShape
                    entry={entry}
                    kind={cellKind(snapshot, index)}
                    rank={ranks.get(index) ?? null}
                    live={live.has(index)}
                    changed={changedIndices.has(index)}
                    stepIndex={stepIndex}
                    index={index}
                  />
                </motion.g>
              )
            })}
          </AnimatePresence>

          {Array.from({ length: snapshot.capacity }, (_, index) => {
            const rect = cellRect(index)
            const marked =
              snapshot.profile === 'pile'
                ? readGlobalInt(snapshot, 'sommet') === index
                : snapshot.profile === 'file-decalage'
                  ? false
                  : readGlobalInt(snapshot, 'av') === index ||
                    readGlobalInt(snapshot, 'ar') === index
            return (
              <g key={`index-${index}`} className="ss-index-group">
                <rect
                  className={`ss-index${marked ? ' is-marked' : ''}`}
                  x={rect.x + CELL_W / 2 - 13}
                  y={INDEX_Y}
                  width="26"
                  height="24"
                  rx="7"
                />
                <text
                  className="ss-index-text"
                  x={rect.x + CELL_W / 2}
                  y={INDEX_Y + 16}
                  textAnchor="middle"
                >
                  {index}
                </text>
              </g>
            )
          })}

          {markers.map((marker) => (
            <MarkerTag
              key={marker.name}
              marker={marker}
              changed={changedGlobals.has(marker.name)}
            />
          ))}

          {fifo ? (
            <g className="ss-fifo">
              <path
                d={fifo.path}
                className="ss-fifo-line"
                markerEnd="url(#ss-arrow-gold)"
              />
              <text
                x={fifo.label.x}
                y={fifo.label.y}
                textAnchor="middle"
                className="ss-fifo-label"
              >
                {V.fifo}
              </text>
            </g>
          ) : null}

          {wrap ? (
            <g className={`ss-wrap${wrapActive ? ' is-active' : ''}`}>
              <path
                d={wrap.path}
                className="ss-wrap-path"
                markerEnd={
                  wrapActive ? 'url(#ss-arrow-success)' : 'url(#ss-arrow-muted)'
                }
              />
              <text
                x={wrap.label.x}
                y={wrap.label.y}
                textAnchor="middle"
                className="ss-wrap-label"
              >
                {V.wrap}
              </text>
            </g>
          ) : null}

          {snapshot.tape && tape ? (
            <g className="ss-tape">
              <text x={tape.label.x} y={tape.label.y} className="ss-tape-label">
                {V.tape}
              </text>
              <text
                x={tape.status.x}
                y={tape.status.y}
                textAnchor="end"
                className={`ss-tape-status is-${snapshot.tape.status}`}
              >
                {tapeStatusLabel(snapshot.tape.status)}
              </text>
              {tape.boxes.map((box) => (
                <g key={`tape-${box.index}`}>
                  <rect
                    x={box.rect.x}
                    y={box.rect.y}
                    width={box.rect.width}
                    height={TAPE_BOX_H}
                    rx="9"
                    className={`ss-tape-box${box.current ? ' is-current' : ''}${
                      box.passed ? ' is-passed' : ''
                    }`}
                  />
                  <text
                    x={box.rect.x + box.rect.width / 2}
                    y={box.rect.y + 29}
                    textAnchor="middle"
                    className="ss-tape-char"
                  >
                    {box.char}
                  </text>
                </g>
              ))}
              {(() => {
                const current = tape.boxes.find((box) => box.current)
                if (!current) return null
                const cx = current.rect.x + current.rect.width / 2
                return (
                  <path
                    className="ss-tape-caret"
                    d={`M ${cx - 6} ${TAPE_Y - 10} L ${cx + 6} ${TAPE_Y - 10} L ${cx} ${TAPE_Y - 2} Z`}
                  />
                )
              })()}
              {snapshot.tape.text.length > 0 ? (
                <text
                  x={ARRAY_X + ROW_W / 2}
                  y={TAPE_Y + TAPE_BOX_H + 18}
                  textAnchor="middle"
                  className="ss-tape-position"
                >
                  {V.tapePosition(snapshot.tape.index, snapshot.tape.text.length)}
                </text>
              ) : null}
            </g>
          ) : null}
        </g>
      </svg>

      <div className="ss-hud">
        <div className="ss-hud-row">
          <span className="ss-structure-chip">{structureLabel(snapshot.profile)}</span>
          <span className="ss-array-chip">
            {V.array} · {V.capacity(snapshot.capacity)}
          </span>
          <span className={`ss-state-chip ${stateClass(snapshot)}`}>{stateText(snapshot)}</span>
        </div>
        <span className="ss-hud-hint">{versionHint(snapshot.profile)}</span>
      </div>

      {empty && onEmptyInsert ? (
        <div className="ss-empty-banner">
          <p className="ss-empty-text">{emptyText(snapshot)}</p>
          <button
            type="button"
            className="primary-button ss-empty-button"
            onClick={onEmptyInsert}
          >
            {insertText(snapshot.profile)}
          </button>
        </div>
      ) : null}

      {step.console.returnValue !== undefined ? (
        <div className="ss-return-chip">
          <span className="ss-return-label">{V.returned}</span>
          <code>{step.console.returnValue}</code>
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

      <button
        type="button"
        className="ss-bilan-toggle"
        onClick={() => setBilanOpen(true)}
        aria-haspopup="dialog"
        title={V.bilanOpen}
      >
        <span aria-hidden="true">▦</span>
        {V.bilanOpen}
      </button>

      <div className="viz-legend ss-legend" aria-label={V.legend}>
        <span className="legend-item">
          <svg viewBox="0 0 28 12" aria-hidden="true">
            <rect
              x="4"
              y="2"
              width="20"
              height="8"
              rx="2"
              fill="var(--panel)"
              stroke="var(--gold)"
              strokeWidth="2"
            />
          </svg>
          {V.legendLive}
        </span>
        <span className="legend-item">
          <svg viewBox="0 0 28 12" aria-hidden="true">
            <rect
              x="4"
              y="2"
              width="20"
              height="8"
              rx="2"
              fill="var(--panel-2)"
              stroke="var(--line-strong)"
              strokeWidth="1.6"
              strokeDasharray="4 3"
            />
          </svg>
          {V.legendStale}
        </span>
        <span className="legend-item">
          <svg viewBox="0 0 28 12" aria-hidden="true">
            <rect
              x="4"
              y="2"
              width="20"
              height="8"
              rx="2"
              fill="transparent"
              stroke="var(--line)"
              strokeWidth="1.6"
              strokeDasharray="3 3"
            />
          </svg>
          {V.legendEmpty}
        </span>
      </div>

      {bilanOpen ? <BilanOverlay onClose={closeBilan} /> : null}
    </div>
  )
}
