import type { JSX } from 'react'
import { fr } from '../i18n/fr'
import { PdfDrawer } from './PdfDrawer'

interface CourseDrawerProps {
  chapter: number
  initialWidth: number
  onWidthChange: (width: number) => void
  onClose: () => void
}

export function CourseDrawer({
  chapter,
  initialWidth,
  onWidthChange,
  onClose,
}: CourseDrawerProps): JSX.Element {
  const chapterLabel = fr.menu.chapterLabel(chapter)

  return (
    <PdfDrawer
      src={`./cours/chapitre-${chapter}.pdf`}
      labels={{
        title: fr.coursePdf.title,
        subtitle: chapterLabel,
        ariaLabel: `${fr.coursePdf.title} · ${chapterLabel}`,
        close: fr.pdfViewer.close,
        closeAria: fr.coursePdf.closeAria,
        resize: fr.coursePdf.resize,
        openInTab: fr.pdfViewer.openInTab,
        hint: fr.pdfViewer.hint,
        pixelValue: fr.pdfViewer.pixelValue,
      }}
      initialWidth={initialWidth}
      onWidthChange={onWidthChange}
      onClose={onClose}
    />
  )
}
