// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { fr } from '../i18n/fr'
import { chapterHash, MENU_HASH } from './useHashRoute'

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
    expect(markup).toContain(fr.menu.homeLabel)
    expect(markup).not.toContain(fr.menu.subtitle)
  })

  it('ouvre le chapitre 5 sur le scénario Liste vide', () => {
    renderApp()
    const card = query<HTMLAnchorElement>(`.chapter-card[href="${chapterHash(5)}"]`)
    expect(card).not.toBeNull()

    act(() => {
      card?.click()
    })
    goTo(window.location.hash)

    expect(query('.ldc-svg')).not.toBeNull()
    expect(query('.scenario-strip-title')?.textContent).toContain(fr.lddc.scenarios.vide.title)
    expect(query('.scenario-strip-empty')).not.toBeNull()
  })

  it('ouvre le chapitre depuis le menu, puis revient au menu avec Échap', () => {
    renderApp()
    expect(query('.menu-app')).not.toBeNull()

    const card = query<HTMLAnchorElement>(`.chapter-card[href="${chapterHash(4)}"]`)
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

  it('revient au menu avec le bouton Accueil', () => {
    openDemo()
    const back = query<HTMLButtonElement>(`button[aria-label="${fr.menu.homeLabel}"]`)
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
    expect(query('.operation-status')).not.toBeNull()

    press('Escape')
    goTo(window.location.hash)
    expect(query('.menu-app')).not.toBeNull()

    goTo('#/chapitre-4')
    expect(query('.operation-status')).toBeNull()
    expect(query('.journal-panel')?.textContent).toContain(fr.journal.empty)
  })

  it('passe l’état de l’opération du vert au jaune à la pause', () => {
    openDemo()
    const execute = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === fr.operation.execute,
    )
    act(() => {
      execute?.click()
    })

    const running = query('.operation-status')
    expect(running).not.toBeNull()
    expect(running?.classList.contains('is-running')).toBe(true)
    expect(running?.textContent).toContain(fr.operation.inProgress)

    const pause = query<HTMLButtonElement>(`button[aria-label="${fr.controls.pause}"]`)
    expect(pause).not.toBeNull()
    act(() => {
      pause?.click()
    })

    const paused = query('.operation-status')
    expect(paused).not.toBeNull()
    expect(paused?.classList.contains('is-paused')).toBe(true)
    expect(paused?.textContent).toContain(fr.operation.paused)
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
    expect(credits).toContain(fr.credits.title)
    expect(credits).toContain('El Mahdi Cherkane')
    expect(credits).toContain('Omar Moussaid')
    expect(credits).toContain('Hamza Agour')
    expect(credits.indexOf('El Mahdi Cherkane')).toBeLessThan(credits.indexOf('Omar Moussaid'))
    expect(credits.indexOf('Omar Moussaid')).toBeLessThan(credits.indexOf('Hamza Agour'))

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

describe('plein écran', () => {
  let fullscreenElement: Element | null = null
  const requestFullscreen = vi.fn((): Promise<void> => {
    fullscreenElement = document.documentElement
    document.dispatchEvent(new Event('fullscreenchange'))
    return Promise.resolve()
  })
  const exitFullscreen = vi.fn((): Promise<void> => {
    fullscreenElement = null
    document.dispatchEvent(new Event('fullscreenchange'))
    return Promise.resolve()
  })

  function pressShiftF(init: KeyboardEventInit = {}): void {
    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'F',
          shiftKey: true,
          bubbles: true,
          cancelable: true,
          ...init,
        }),
      )
    })
  }

  function appIsFullscreen(): boolean {
    return query('.app')?.className.includes('simulation-fullscreen') ?? false
  }

  beforeEach(() => {
    fullscreenElement = null
    requestFullscreen.mockClear()
    exitFullscreen.mockClear()
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement,
    })
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    })
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: exitFullscreen,
    })
  })

  afterEach(() => {
    Reflect.deleteProperty(document, 'fullscreenElement')
    Reflect.deleteProperty(document.documentElement, 'requestFullscreen')
    Reflect.deleteProperty(document, 'exitFullscreen')
  })

  it('bascule le plein écran avec Maj+F', () => {
    openDemo()
    expect(appIsFullscreen()).toBe(false)

    pressShiftF()
    expect(requestFullscreen).toHaveBeenCalledTimes(1)
    expect(appIsFullscreen()).toBe(true)

    pressShiftF()
    expect(exitFullscreen).toHaveBeenCalledTimes(1)
    expect(appIsFullscreen()).toBe(false)
  })

  it('ignore Maj+F dans un champ de saisie', () => {
    openDemo()
    const input = document.createElement('input')
    container.append(input)

    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'F',
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      )
    })

    expect(requestFullscreen).not.toHaveBeenCalled()
    expect(appIsFullscreen()).toBe(false)
  })

  it('ignore Maj+F avec Ctrl, Alt ou Meta', () => {
    openDemo()

    pressShiftF({ ctrlKey: true })
    pressShiftF({ altKey: true })
    pressShiftF({ metaKey: true })

    expect(requestFullscreen).not.toHaveBeenCalled()
  })

  it('reste synchronisé quand le navigateur quitte le plein écran', () => {
    openDemo()
    pressShiftF()
    expect(appIsFullscreen()).toBe(true)

    act(() => {
      fullscreenElement = null
      document.dispatchEvent(new Event('fullscreenchange'))
    })

    expect(appIsFullscreen()).toBe(false)
  })

  it('quitte le plein écran avec Échap', () => {
    openDemo()
    pressShiftF()
    expect(appIsFullscreen()).toBe(true)

    press('Escape')
    expect(exitFullscreen).toHaveBeenCalledTimes(1)
    expect(appIsFullscreen()).toBe(false)
  })

  it('gère silencieusement un refus du navigateur', async () => {
    requestFullscreen.mockRejectedValueOnce(new Error('refusé'))
    openDemo()

    pressShiftF()
    await act(async () => {
      await Promise.resolve()
    })

    expect(appIsFullscreen()).toBe(false)
  })
})
