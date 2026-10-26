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

describe('cours PDF', () => {
  it('ouvre le PDF du chapitre courant dans un tiroir', () => {
    const dialog = openDrawer()
    expect(dialog.open).toBe(true)
    expect(dialog.getAttribute('aria-label')).toContain(fr.menu.chapterLabel(4))
    expect(dialog.querySelector('iframe')?.getAttribute('src')).toBe('./cours/chapitre-4.pdf')
    expect(dialog.querySelector('a')?.getAttribute('href')).toBe('./cours/chapitre-4.pdf')
  })

  it('ferme le tiroir avec Échap sans quitter le chapitre', () => {
    openDrawer()
    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      )
    })
    expect(container.querySelector('dialog.course-drawer')).toBeNull()
    expect(window.location.hash).toBe('#/chapitre-4')
    expect(document.activeElement).toBe(
      container.querySelector(`button[aria-label="${fr.coursePdf.openFor(4)}"]`),
    )
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
