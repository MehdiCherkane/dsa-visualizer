// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { fr } from '../i18n/fr'
import { LAYOUT_STORAGE_KEY } from './layout'
import type { LayoutState } from './layout'
import { MENU_HASH } from './useHashRoute'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

function renderApp(): void {
  act(() => {
    root.render(<App />)
  })
}

function openDemo(): void {
  renderApp()
  act(() => {
    window.location.hash = '#/chapitre-4'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

function query<T extends Element>(selector: string): T | null {
  return container.querySelector<T>(selector)
}

function buttonByLabel(label: string): HTMLButtonElement | null {
  return container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)
}

function pressKey(target: Element, key: string): void {
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  })
}

function storedLayout(): LayoutState | null {
  const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY)
  if (!raw) return null
  return (JSON.parse(raw) as { layout?: LayoutState }).layout ?? null
}

beforeEach(() => {
  window.localStorage.clear()
  window.location.hash = MENU_HASH
  Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  window.localStorage.clear()
})

describe('panneaux redimensionnables', () => {
  it('agrandit la console dans tout le dock puis restaure les trois panneaux', () => {
    openDemo()

    const focus = buttonByLabel(fr.dock.focusPane(fr.console.title))
    expect(focus).not.toBeNull()
    act(() => focus?.click())

    expect(query('#dock-variables')).toBeNull()
    expect(query('#dock-console')).not.toBeNull()
    expect(query('#dock-journal')).toBeNull()
    expect(query('.dock-panels')?.className).toContain('focused')
    expect(storedLayout()?.focusedDockPane).toBe('console')

    const restore = buttonByLabel(fr.dock.restorePane(fr.console.title))
    expect(restore).not.toBeNull()
    act(() => restore?.click())

    expect(query('#dock-variables')).not.toBeNull()
    expect(query('#dock-journal')).not.toBeNull()
    expect(query('.dock-panels')?.className).not.toContain('focused')
    expect(storedLayout()?.focusedDockPane).toBeNull()
  })

  it('ne montre que Variables et Console en mode présentation', () => {
    openDemo()
    expect(container.querySelectorAll('.dock-sash')).toHaveLength(2)
    expect(query('.journal-panel')).not.toBeNull()

    act(() => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }))
    })

    expect(query('.bottom-dock')?.className).toContain('presentation')
    expect(query('.journal-panel')).toBeNull()
    expect(container.querySelectorAll('.dock-sash')).toHaveLength(1)
    expect(query('#dock-variables')).not.toBeNull()
    expect(query('#dock-console')).not.toBeNull()
  })

  it('redimensionne la hauteur du dock au clavier et la réinitialise', () => {
    openDemo()
    const sash = query<HTMLElement>('.dock-height-sash')
    expect(sash?.getAttribute('aria-valuenow')).toBe('160')

    if (sash) pressKey(sash, 'ArrowUp')
    expect(sash?.getAttribute('aria-valuenow')).toBe('174')
    expect(storedLayout()?.dockHeight).toBe(174)

    if (sash) pressKey(sash, 'Home')
    expect(sash?.getAttribute('aria-valuenow')).toBe('160')
    expect(storedLayout()?.dockHeight).toBe(160)
  })

  it('redimensionne la colonne de code au clavier sans valeur périmée', () => {
    openDemo()
    const sash = query<HTMLElement>('.workspace-sash')
    expect(sash?.getAttribute('aria-valuenow')).toBe('70')

    if (sash) pressKey(sash, 'ArrowLeft')
    const first = Number(sash?.getAttribute('aria-valuenow'))
    const firstStored = storedLayout()?.workspaceSplit ?? 100
    expect(first).toBeLessThan(70)
    expect(firstStored).toBeLessThan(70)

    if (sash) pressKey(sash, 'ArrowLeft')
    expect(Number(sash?.getAttribute('aria-valuenow'))).toBeLessThan(first)
    expect(storedLayout()?.workspaceSplit ?? 100).toBeLessThan(firstStored)
  })

  it('restaure une disposition enregistrée au chargement', () => {
    window.localStorage.setItem(
      LAYOUT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        layout: {
          workspaceSplit: 55,
          dockHeight: 210,
          dockSplit: [20, 45, 35],
          focusedDockPane: 'variables',
        },
      }),
    )

    openDemo()

    expect(query<HTMLElement>('.workspace-sash')?.getAttribute('aria-valuenow')).toBe('55')
    expect(query<HTMLElement>('.dock-height-sash')?.getAttribute('aria-valuenow')).toBe('210')
    expect(query('#dock-variables')).not.toBeNull()
    expect(query('#dock-console')).toBeNull()
    expect(query('#dock-journal')).toBeNull()
  })
})
