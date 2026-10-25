// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { fr } from '../i18n/fr'
import { MENU_HASH } from './useHashRoute'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

function renderApp(): void {
  act(() => {
    root.render(<App />)
  })
}

function goTo(hash: string): void {
  act(() => {
    window.location.hash = hash
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

function press(key: string): void {
  act(() => {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    )
  })
}

function query<T extends Element>(selector: string): T | null {
  return container.querySelector<T>(selector)
}

function openDemo(): void {
  renderApp()
  goTo('#/chapitre-4')
}

beforeEach(() => {
  window.location.hash = MENU_HASH
  // jsdom reports 768px: keep the bottom dock expanded so its panels render.
  Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  Reflect.deleteProperty(window, 'confirm')
})

describe('navigation par hash', () => {
  it('ouvre le menu pour un hash inconnu', () => {
    window.location.hash = '#/inconnu'
    const markup = renderToStaticMarkup(<App />)
    expect(markup).toContain(fr.menu.title)
    expect(markup).not.toContain('ldc-svg')
  })

  it('ouvre la démonstration à partir de #/chapitre-4', () => {
    window.location.hash = '#/chapitre-4'
    const markup = renderToStaticMarkup(<App />)
    expect(markup).toContain('ldc-svg')
    expect(markup).toContain(fr.menu.backLabel)
    expect(markup).not.toContain(fr.menu.subtitle)
  })

  it('ouvre le chapitre depuis le menu, puis revient au menu avec Échap', () => {
    renderApp()
    expect(query('.menu-app')).not.toBeNull()

    const card = query<HTMLAnchorElement>('.chapter-card:not(.is-soon)')
    expect(card).not.toBeNull()
    act(() => {
      card?.click()
    })
    goTo(window.location.hash)
    expect(query('.ldc-svg')).not.toBeNull()

    press('Escape')
    goTo(window.location.hash)
    expect(query('.menu-app')).not.toBeNull()
    expect(query('.ldc-svg')).toBeNull()
  })

  it('revient au menu avec le bouton ← Menu', () => {
    openDemo()
    const back = query<HTMLButtonElement>(`button[aria-label="${fr.menu.backAria}"]`)
    expect(back).not.toBeNull()
    act(() => {
      back?.click()
    })
    goTo(window.location.hash)
    expect(query('.menu-app')).not.toBeNull()
  })

  it('repart d’une lecture propre en revenant dans la démonstration', () => {
    openDemo()
    const execute = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === fr.operation.execute,
    )
    act(() => {
      execute?.click()
    })
    expect(query('.in-progress')).not.toBeNull()

    press('Escape')
    goTo(window.location.hash)
    expect(query('.menu-app')).not.toBeNull()

    goTo('#/chapitre-4')
    expect(query('.in-progress')).toBeNull()
    expect(query('.journal-panel')?.textContent).toContain(fr.journal.empty)
  })
})

describe('raccourcis clavier', () => {
  it('ne capture rien quand le menu est affiché', () => {
    const confirmSpy = vi.fn(() => false)
    window.confirm = confirmSpy

    renderApp()
    expect(query('.menu-app')).not.toBeNull()

    for (const key of ['d', 'p', 'r', 'R', 'ArrowRight', ' ', 'Home', 'End']) press(key)

    expect(query('.menu-app')).not.toBeNull()
    expect(query('.ldc-svg')).toBeNull()
    expect(confirmSpy).not.toHaveBeenCalled()
  })

  it('fonctionne dans la démonstration du chapitre 4', () => {
    openDemo()
    const dock = (): string => query<HTMLElement>('.bottom-dock')?.className ?? ''
    const before = dock()
    expect(before).toContain('bottom-dock')

    press('d')
    expect(dock()).not.toBe(before)

    press('p')
    expect(query('.app')?.className).toContain('presentation')

    press('p')
    expect(query('.app')?.className).not.toContain('presentation')
  })

  it('laisse Échap aux popovers ouverts', () => {
    openDemo()
    const help = query<HTMLButtonElement>(`button[aria-label="${fr.header.shortcutsHelp}"]`)
    act(() => {
      help?.click()
    })
    const popover = query('#shortcuts-popover')
    expect(popover).not.toBeNull()
    const credits = popover?.textContent ?? ''
    expect(credits).toContain(fr.shortcuts.creditsTitle)
    expect(credits).toContain('Mehdi Cherkane')
    expect(credits).toContain('Omar Moussaid')
    expect(credits).toContain('Hamza Agoure')
    expect(credits.indexOf('Mehdi Cherkane')).toBeLessThan(credits.indexOf('Omar Moussaid'))
    expect(credits.indexOf('Omar Moussaid')).toBeLessThan(credits.indexOf('Hamza Agoure'))

    press('Escape')
    expect(query('#shortcuts-popover')).toBeNull()
    expect(window.location.hash).toBe('#/chapitre-4')
    expect(query('.ldc-svg')).not.toBeNull()
  })

  it('ne quitte pas la démonstration quand le popover a déjà traité Échap', () => {
    openDemo()
    // In a browser React flushes the popover close synchronously inside its
    // `document` keydown listener, so the overlay is gone when the demo's
    // `window` listener runs: `defaultPrevented` is what keeps us in place.
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })
    event.preventDefault()
    act(() => {
      document.body.dispatchEvent(event)
    })

    expect(window.location.hash).toBe('#/chapitre-4')
    expect(query('.ldc-svg')).not.toBeNull()
  })
})
