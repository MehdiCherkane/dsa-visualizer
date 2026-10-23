import type { CSSProperties, FocusEvent, JSX } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { fr } from '../i18n/fr'
import { getNode } from '../structures/trees/memory'
import type { TreeCallFrame, TreeCallStack, TreeSnapshot } from '../structures/trees/memory'

const SHOW_NULL_STORAGE_KEY = 'dsa-trees-call-stack-show-null-v1'
const EMPTY_FRAMES: TreeCallFrame[] = []

export interface CallStackFocus {
  fn: string
  line: number
  nodeId: number | null
}

interface CallStackPanelProps {
  snapshot: TreeSnapshot
  callStack: TreeCallStack | null
  speed: number
  /** True only when the user is moving forward through the operation. */
  animate: boolean
  onFrameFocus: (frame: CallStackFocus | null) => void
}

interface ExitingFrame {
  key: number
  frame: TreeCallFrame
}

function readShowNull(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(SHOW_NULL_STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

function frameArgument(snapshot: TreeSnapshot, frame: TreeCallFrame): JSX.Element {
  if (frame.nodeId === null) return <span>{fr.callStack.nullArgument}</span>
  const node = getNode(snapshot, frame.nodeId)
  const value = node?.payload.kind === 'int' ? node.payload.value : '…'
  return (
    <span>
      n → <strong>{value}</strong>, <small>{node?.address ?? `#${frame.nodeId}`}</small>
    </span>
  )
}

function statusLabel(status: TreeCallFrame['status']): string {
  switch (status) {
    case 'wait-left':
      return fr.callStack.waitLeft
    case 'wait-right':
      return fr.callStack.waitRight
    default:
      return fr.callStack.active
  }
}

export function CallStackPanel({
  snapshot,
  callStack,
  speed,
  animate,
  onFrameFocus,
}: CallStackPanelProps): JSX.Element {
  const [showNull, setShowNull] = useState(readShowNull)
  const [exitingFrames, setExitingFrames] = useState<ExitingFrame[]>([])
  const [enteringIds, setEnteringIds] = useState<ReadonlySet<number>>(() => new Set())
  const listRef = useRef<HTMLOListElement | null>(null)
  const previousFramesRef = useRef<TreeCallFrame[]>(EMPTY_FRAMES)
  const exitKeyRef = useRef(0)
  const timersRef = useRef<number[]>([])
  const frames = callStack?.frames ?? EMPTY_FRAMES
  const visibleFrames = useMemo(
    () => (showNull ? frames : frames.filter((frame) => frame.nodeId !== null)),
    [frames, showNull],
  )
  const displayFrames = [...visibleFrames].reverse()
  const topFrameId = frames.at(-1)?.id ?? null
  const maxHeight = showNull ? (callStack?.maxDepth ?? 0) : (callStack?.maxNonNullDepth ?? 0)
  const compact = displayFrames.length > 6
  const animateFrames = animate && speed < 4
  // Keep the motion quick at 2× and slow enough to follow at 0.5×.
  const animationDuration = Math.max(40, Math.round(200 / Math.max(speed, 0.25)))

  useEffect(
    () => () => {
      for (const timer of timersRef.current) window.clearTimeout(timer)
      timersRef.current = []
    },
    [],
  )

  useEffect(() => {
    const previous = previousFramesRef.current
    previousFramesRef.current = frames
    const previousIds = new Set(previous.map((frame) => frame.id))
    const currentIds = new Set(frames.map((frame) => frame.id))
    const added = frames.filter((frame) => !previousIds.has(frame.id))
    const removed = previous
      .filter((frame) => !currentIds.has(frame.id))
      .filter((frame) => showNull || frame.nodeId !== null)
    if (!animateFrames) {
      setExitingFrames((current) => (current.length === 0 ? current : []))
      setEnteringIds((current) => (current.size === 0 ? current : new Set()))
      return
    }

    if (added.length > 0) {
      const ids = new Set(added.map((frame) => frame.id))
      setEnteringIds(ids)
      const timer = window.setTimeout(() => {
        setEnteringIds((current) => {
          const next = new Set(current)
          let changed = false
          for (const id of ids) changed = next.delete(id) || changed
          return changed ? next : current
        })
        timersRef.current = timersRef.current.filter((candidate) => candidate !== timer)
      }, animationDuration)
      timersRef.current.push(timer)
    }

    if (removed.length > 0) {
      const ghosts = removed.map((frame) => ({ key: (exitKeyRef.current += 1), frame }))
      setExitingFrames((current) => [...ghosts, ...current].slice(0, 6))
      const timer = window.setTimeout(() => {
        const keys = new Set(ghosts.map((ghost) => ghost.key))
        setExitingFrames((current) => current.filter((item) => !keys.has(item.key)))
        timersRef.current = timersRef.current.filter((candidate) => candidate !== timer)
      }, animationDuration)
      timersRef.current.push(timer)
    }
  }, [animateFrames, animationDuration, frames, showNull])

  useEffect(() => {
    const target = listRef.current?.querySelector<HTMLElement>(
      '[data-stack-top="true"], [data-stack-first="true"]',
    )
    target?.scrollIntoView({ block: 'nearest' })
  }, [frames.length, showNull])

  const toggleNull = (checked: boolean): void => {
    setShowNull(checked)
    try {
      window.localStorage.setItem(SHOW_NULL_STORAGE_KEY, String(checked))
    } catch {
      // Storage is optional; the current session still keeps the chosen setting.
    }
  }

  const focusFrame = (frame: TreeCallFrame): void => {
    onFrameFocus({ fn: frame.fn, line: frame.line, nodeId: frame.nodeId })
  }

  const blurFrame = (event: FocusEvent<HTMLLIElement>): void => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onFrameFocus(null)
  }

  const renderFrame = (
    frame: TreeCallFrame,
    options: {
      renderKey: string
      top: boolean
      first?: boolean
      entering?: boolean
      exiting?: boolean
    },
  ): JSX.Element => {
    const { renderKey, top, first = false, entering = false, exiting = false } = options
    return (
      <li
        key={renderKey}
        data-stack-top={top && !exiting ? 'true' : undefined}
        data-stack-first={first && !exiting ? 'true' : undefined}
        aria-hidden={exiting || undefined}
        className={`call-stack-frame${frame.nodeId === null ? ' is-null' : ''}${top && !exiting ? ' is-top' : ''}${entering ? ' is-entering' : ''}${exiting ? ' is-exiting' : ''}`}
        tabIndex={exiting ? undefined : 0}
        onMouseEnter={exiting ? undefined : () => focusFrame(frame)}
        onMouseLeave={exiting ? undefined : () => onFrameFocus(null)}
        onFocus={exiting ? undefined : () => focusFrame(frame)}
        onBlur={exiting ? undefined : blurFrame}
      >
        <div className="call-stack-frame-head">
          <code>{frame.fn}({frameArgument(snapshot, frame)})</code>
          {top && !exiting ? <span className="call-stack-top">{fr.callStack.top}</span> : null}
        </div>
        <div className="call-stack-frame-meta">
          <span>{fr.callStack.line(frame.line)}</span>
          <span className={`call-stack-status ${frame.status}`}>{statusLabel(frame.status)}</span>
        </div>
        {frame.nodeId !== null ? (
          <div className="call-stack-phases" aria-label="Phases du parcours">
            {frame.phases.map((phase) => (
              <span key={phase.name} className={`call-stack-phase ${phase.state}`}>
                {phase.state === 'done' ? '✓ ' : ''}
                {fr.callStack.phase[phase.name]}
                {phase.name === 'visite' && phase.value !== undefined ? ` ${phase.value}` : ''}
              </span>
            ))}
          </div>
        ) : null}
      </li>
    )
  }

  const panelStyle = { '--stack-anim-duration': `${animationDuration}ms` } as CSSProperties

  return (
    <section
      className={`panel call-stack-panel${animateFrames ? ' stack-animate' : ' stack-instant'}`}
      style={panelStyle}
      aria-label={fr.callStack.region}
    >
      <div className="panel-header call-stack-header">
        <div className="call-stack-title">
          <span className="panel-title">{fr.callStack.title}</span>
          <span className="call-stack-metrics">
            {fr.callStack.currentHeight} <b>{visibleFrames.length}</b> · {fr.callStack.maximumHeight} <b>{maxHeight}</b>
          </span>
        </div>
        <label className="call-stack-null-toggle">
          <input type="checkbox" checked={showNull} onChange={(event) => toggleNull(event.target.checked)} />
          <span>{fr.callStack.showNull}</span>
        </label>
      </div>
      <div className="call-stack-body">
        <ol ref={listRef} className={`call-stack-list${compact ? ' is-compact' : ''}`}>
          {exitingFrames.map((ghost) =>
            renderFrame(ghost.frame, {
              renderKey: `exit-${ghost.key}`,
              top: false,
              exiting: true,
            }),
          )}
          {displayFrames.map((frame, index) =>
            renderFrame(frame, {
              renderKey: String(frame.id),
              top: frame.id === topFrameId,
              first: index === 0,
              entering: enteringIds.has(frame.id),
            }),
          )}
          {displayFrames.length === 0 && exitingFrames.length === 0 ? (
            <li className="call-stack-empty">{fr.callStack.empty}</li>
          ) : null}
          <li className="call-stack-main" aria-label={fr.callStack.main}>
            <code>{fr.callStack.main}</code>
          </li>
        </ol>
      </div>
    </section>
  )
}
