// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { fr } from '../i18n/fr'
import { ExercicesPage } from './ExercicesPage'
import { EXERCICES_HASH } from './useHashRoute'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// jsdom does not implement the native <dialog> methods.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
  HTMLElement.prototype.setPointerCapture = () => {}
  HTMLElement.prototype.releasePointerCapture = () => {}
  HTMLElement.prototype.hasPointerCapture = () => true
})

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  window.localStorage.clear()
  window.location.hash = EXERCICES_HASH
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function renderPage(exerciseId?: string): void {
  act(() => {
    root.render(
      <ExercicesPage
        exerciseId={exerciseId}
        theme="light"
        onTheme={() => {}}
        onMenu={() => {}}
      />,
    )
  })
}

function query<T extends Element>(selector: string): T | null {
  return container.querySelector<T>(selector)
}

function openPdf(chapter: number): HTMLDialogElement {
  const trigger = query<HTMLButtonElement>(
    `button[aria-label="${fr.exercices.pdfAria(chapter)}"]`,
  )
  expect(trigger).not.toBeNull()
  trigger!.focus()
  act(() => trigger!.click())
  const dialog = query<HTMLDialogElement>('dialog.course-drawer')
  expect(dialog).not.toBeNull()
  return dialog!
}

describe('sujets PDF des exercices', () => {
  it('ouvre le sujet d’un chapitre depuis la liste dans le tiroir partagé', () => {
    renderPage()
    const dialog = openPdf(1)

    expect(dialog.open).toBe(true)
    expect(dialog.getAttribute('aria-label')).toBe(fr.exercices.pdfDrawerAria(1))
    expect(dialog.textContent).toContain(fr.exercices.chapterLabel(1))
    expect(dialog.querySelector('iframe')?.getAttribute('src')).toBe(
      './exercices/chapitre-1.pdf',
    )
    expect(dialog.querySelector('a')?.getAttribute('href')).toBe('./exercices/chapitre-1.pdf')
  })

  it('ouvre le sujet du chapitre de la fiche affichée', () => {
    renderPage('chapitre-3-somme-grands-nombres')
    const dialog = openPdf(3)

    expect(dialog.getAttribute('aria-label')).toBe(fr.exercices.pdfDrawerAria(3))
    expect(dialog.textContent).toContain(fr.exercices.chapterLabel(3))
    expect(dialog.querySelector('iframe')?.getAttribute('src')).toBe(
      './exercices/chapitre-3.pdf',
    )
  })

  it('ouvre le sujet du chapitre 2 (TP 2) dans le tiroir partagé', () => {
    renderPage('chapitre-2-registre-etudiants-lsc')
    const dialog = openPdf(2)

    expect(dialog.getAttribute('aria-label')).toBe(fr.exercices.pdfDrawerAria(2))
    expect(dialog.textContent).toContain(fr.exercices.chapterLabel(2))
    expect(dialog.querySelector('iframe')?.getAttribute('src')).toBe(
      './exercices/chapitre-2.pdf',
    )
  })

  it('ferme le tiroir avec Échap et rend le focus au bouton', () => {
    renderPage()
    const dialog = openPdf(3)
    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      )
    })
    expect(dialog.classList.contains('is-closing')).toBe(true)
    act(() => {
      dialog.dispatchEvent(new Event('animationend', { bubbles: true }))
    })
    expect(query('dialog.course-drawer')).toBeNull()
    expect(document.activeElement).toBe(
      container.querySelector(`button[aria-label="${fr.exercices.pdfAria(3)}"]`),
    )
  })
})
