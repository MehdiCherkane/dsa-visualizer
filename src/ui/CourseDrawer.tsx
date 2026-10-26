import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, JSX } from 'react'
import { fr } from '../i18n/fr'
import { SplitHandle } from './SplitHandle'

const MIN_WIDTH = 380
const DEFAULT_WIDTH = 720
const CLOSE_ANIMATION_MS = 220

interface CourseDrawerProps {
  chapter: number
  initialWidth: number
  onWidthChange: (width: number) => void
  onClose: () => void
}

function maxWidth(): number {
  return Math.max(MIN_WIDTH, Math.round(window.innerWidth * 0.94))
}

function clampWidth(value: number): number {
  return Math.round(Math.min(Math.max(value, MIN_WIDTH), maxWidth()))
}

export function CourseDrawer({
  chapter,
  initialWidth,
  onWidthChange,
  onClose,
}: CourseDrawerProps): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const dragStartWidth = useRef(initialWidth)
  const widthRef = useRef(initialWidth)
  const [width, setWidth] = useState(initialWidth)
  const [closing, setClosing] = useState(false)
  const src = `./cours/chapitre-${chapter}.pdf`
  const title = `${fr.coursePdf.title} · ${fr.menu.chapterLabel(chapter)}`

  const requestClose = useCallback(() => setClosing(true), [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.showModal()
    return () => {
      dialog.close()
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus()
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      requestClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [requestClose])

  // Fallback in case the close animation never fires (reduced motion, hidden tab).
  useEffect(() => {
    if (!closing) return
    const timer = window.setTimeout(onClose, CLOSE_ANIMATION_MS + 80)
    return () => window.clearTimeout(timer)
  }, [closing, onClose])

  useEffect(() => {
    if (!closing) return
    const dialog = dialogRef.current
    if (!dialog) return
    const onEnd = (event: AnimationEvent): void => {
      if (event.target === dialog) onClose()
    }
    dialog.addEventListener('animationend', onEnd)
    return () => dialog.removeEventListener('animationend', onEnd)
  }, [closing, onClose])

  const resize = (delta: number): void => {
    const next = clampWidth(dragStartWidth.current - delta)
    widthRef.current = next
    setWidth(next)
  }

  const resetWidth = (): void => {
    widthRef.current = DEFAULT_WIDTH
    setWidth(DEFAULT_WIDTH)
    onWidthChange(DEFAULT_WIDTH)
  }

  return (
    <dialog
      ref={dialogRef}
      className={closing ? 'course-drawer is-closing' : 'course-drawer'}
      style={{ '--course-width': `${width}px` } as CSSProperties}
      role="dialog"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose()
      }}
    >
      <header className="course-drawer-header">
        <div className="course-drawer-title">
          <span className="panel-title">{fr.coursePdf.title}</span>
          <span className="course-drawer-chapter">{fr.menu.chapterLabel(chapter)}</span>
        </div>
        <button
          type="button"
          className="ghost-button small"
          onClick={requestClose}
          aria-label={fr.coursePdf.closeAria}
        >
          {fr.coursePdf.close}
        </button>
      </header>
      <div className="course-drawer-body">
        <iframe src={src} title={title} />
      </div>
      <footer className="course-drawer-foot">
        <span>{fr.coursePdf.hint}</span>
        <a href={src} target="_blank" rel="noreferrer">
          {fr.coursePdf.openInTab}
        </a>
      </footer>
      <SplitHandle
        orientation="vertical"
        className="course-drawer-resizer"
        label={fr.coursePdf.resize}
        value={width}
        min={MIN_WIDTH}
        max={maxWidth()}
        valueText={fr.coursePdf.pixelValue(width)}
        onDragStart={() => {
          dragStartWidth.current = widthRef.current
        }}
        onDrag={resize}
        onDragEnd={() => onWidthChange(widthRef.current)}
        onReset={resetWidth}
      />
    </dialog>
  )
}
