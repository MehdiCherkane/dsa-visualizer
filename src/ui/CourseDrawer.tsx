import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import { fr } from '../i18n/fr'

interface CourseDrawerProps {
  chapter: number
  onClose: () => void
}

export function CourseDrawer({ chapter, onClose }: CourseDrawerProps): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const src = `./cours/chapitre-${chapter}.pdf`
  const title = `${fr.coursePdf.title} · ${fr.menu.chapterLabel(chapter)}`

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
      onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      className="course-drawer"
      role="dialog"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
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
          onClick={onClose}
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
    </dialog>
  )
}
