// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { fr } from '../i18n/fr'
import { MENU_HASH } from './useHashRoute'

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
  window.location.hash = MENU_HASH
  Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root.render(<App />)
  })
  act(() => {
    window.location.hash = '#/chapitre-4'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function openDrawer(): HTMLDialogElement {
  const trigger = container.querySelector<HTMLButtonElement>(
    `button[aria-label="${fr.coursePdf.openFor(4)}"]`,
  )
  expect(trigger).not.toBeNull()
  trigger!.focus()
  act(() => trigger!.click())
  const dialog = container.querySelector<HTMLDialogElement>('dialog.course-drawer')
  expect(dialog).not.toBeNull()
  return dialog!
}

function finishClosingAnimation(dialog: HTMLDialogElement): void {
  act(() => {
    dialog.dispatchEvent(new Event('animationend', { bubbles: true }))
  })
}

describe('cours PDF', () => {
  it('ouvre le PDF du chapitre courant dans un tiroir', () => {
    const dialog = openDrawer()
    expect(dialog.open).toBe(true)
    expect(dialog.getAttribute('aria-label')).toContain(fr.menu.chapterLabel(4))
    expect(dialog.querySelector('iframe')?.getAttribute('src')).toBe('./cours/chapitre-4.pdf')
    expect(dialog.querySelector('a')?.getAttribute('href')).toBe('./cours/chapitre-4.pdf')
  })

  it('ferme le tiroir avec Échap sans quitter le chapitre', () => {
    const dialog = openDrawer()
    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      )
    })
    expect(dialog.classList.contains('is-closing')).toBe(true)
    finishClosingAnimation(dialog)
    expect(container.querySelector('dialog.course-drawer')).toBeNull()
    expect(window.location.hash).toBe('#/chapitre-4')
    expect(document.activeElement).toBe(
      container.querySelector(`button[aria-label="${fr.coursePdf.openFor(4)}"]`),
    )
  })

  it('redimensionne le tiroir au clavier', () => {
    const dialog = openDrawer()
    const resizer = dialog.querySelector<HTMLElement>('.course-drawer-resizer')
    expect(resizer).not.toBeNull()
    resizer!.focus()
    act(() => {
      resizer!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
      )
    })
    expect(dialog.style.getPropertyValue('--course-width')).toBe('734px')
    expect(resizer!.getAttribute('aria-valuenow')).toBe('734')
  })

  it('redimensionne le tiroir en glissant le bord gauche et garde la largeur', () => {
    const dialog = openDrawer()
    Object.defineProperty(dialog, 'getBoundingClientRect', {
      value: () => ({ width: 720, top: 0, left: 0, right: 720, bottom: 900, height: 900 }),
    })
    const resizer = dialog.querySelector<HTMLElement>('.course-drawer-resizer')!
    act(() => {
      resizer.dispatchEvent(
        new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 1200 }),
      )
    })
    act(() => {
      resizer.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 1100 }))
    })
    act(() => {
      resizer.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 1100 }))
    })
    expect(dialog.style.getPropertyValue('--course-width')).toBe('820px')

    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      )
    })
    finishClosingAnimation(dialog)
    expect(openDrawer().style.getPropertyValue('--course-width')).toBe('820px')
  })

  it('laisse les raccourcis de lecture au tiroir', () => {
    openDrawer()
    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'p', bubbles: true, cancelable: true }),
      )
    })
    expect(container.querySelector('.app')?.classList.contains('presentation')).toBe(false)
  })
})
