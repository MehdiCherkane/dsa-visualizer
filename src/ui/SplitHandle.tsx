import { useEffect, useRef } from 'react'
import type { JSX, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'

interface SplitHandleProps {
  orientation: 'vertical' | 'horizontal'
  label: string
  value: number
  min: number
  max: number
  valueText: string
  controls?: string
  className?: string
  disabled?: boolean
  onDragStart: () => void
  onDrag: (delta: number) => void
  onDragEnd?: () => void
  onReset: () => void
}

interface DragState {
  pointerId: number
  start: number
  latest: number
  frame: number | null
}

export function SplitHandle({
  orientation,
  label,
  value,
  min,
  max,
  valueText,
  controls,
  className,
  disabled = false,
  onDragStart,
  onDrag,
  onDragEnd,
  onReset,
}: SplitHandleProps): JSX.Element {
  const dragRef = useRef<DragState | null>(null)
  const callbacksRef = useRef({ onDrag, onDragEnd })

  const syncCallbacks = (): void => {
    callbacksRef.current = { onDrag, onDragEnd }
  }

  const clearBodyCursor = (): void => {
    document.body.classList.remove('is-resizing-vertical', 'is-resizing-horizontal')
  }

  useEffect(() => {
    return () => {
      const drag = dragRef.current
      if (drag?.frame != null) window.cancelAnimationFrame(drag.frame)
      dragRef.current = null
      clearBodyCursor()
    }
  }, [])

  const coordinate = (event: ReactPointerEvent<HTMLDivElement>): number =>
    orientation === 'vertical' ? event.clientX : event.clientY

  const flush = (): void => {
    const drag = dragRef.current
    if (!drag) return
    drag.frame = null
    callbacksRef.current.onDrag(drag.latest - drag.start)
  }

  const schedule = (): void => {
    const drag = dragRef.current
    if (!drag || drag.frame != null) return
    drag.frame = window.requestAnimationFrame(flush)
  }

  const finish = (event?: ReactPointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current
    if (!drag) return
    if (event && event.pointerId !== drag.pointerId) return
    if (drag.frame != null) {
      window.cancelAnimationFrame(drag.frame)
      drag.frame = null
      callbacksRef.current.onDrag(drag.latest - drag.start)
    }
    dragRef.current = null
    clearBodyCursor()
    callbacksRef.current.onDragEnd?.()
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (disabled || event.button !== 0) return
    syncCallbacks()
    event.preventDefault()
    const element = event.currentTarget
    try {
      element.setPointerCapture(event.pointerId)
    } catch {
      // Pointer capture is unavailable in a few embedded webviews.
    }
    element.focus({ preventScroll: true })
    const position = coordinate(event)
    dragRef.current = {
      pointerId: event.pointerId,
      start: position,
      latest: position,
      frame: null,
    }
    document.body.classList.add(
      orientation === 'vertical' ? 'is-resizing-vertical' : 'is-resizing-horizontal',
    )
    onDragStart()
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    syncCallbacks()
    drag.latest = coordinate(event)
    schedule()
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (disabled) return
    if (event.key === 'Home' || event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      onReset()
      return
    }

    const step = event.shiftKey ? 40 : 14
    let delta = 0
    if (orientation === 'vertical') {
      if (event.key === 'ArrowLeft') delta = -step
      if (event.key === 'ArrowRight') delta = step
    } else {
      if (event.key === 'ArrowUp') delta = -step
      if (event.key === 'ArrowDown') delta = step
    }
    if (delta === 0) return

    event.preventDefault()
    event.stopPropagation()
    syncCallbacks()
    onDragStart()
    callbacksRef.current.onDrag(delta)
    callbacksRef.current.onDragEnd?.()
  }

  const parentClass = className ? ` ${className}` : ''
  return (
    <div
      className={`split-handle split-handle-${orientation}${parentClass}`}
      role="separator"
      aria-orientation={orientation}
      aria-label={label}
      aria-valuemin={Math.round(min)}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
      aria-valuetext={valueText}
      aria-controls={controls}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      title={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onLostPointerCapture={finish}
      onKeyDown={handleKeyDown}
      onDoubleClick={onReset}
    />
  )
}
