// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { chapterHash, MENU_HASH, parseRoute, PRESA_HASH, useHashRoute } from './useHashRoute'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('parseRoute', () => {
  it('reconnaît le menu sur #/ et sur un hash vide', () => {
    expect(parseRoute(MENU_HASH)).toEqual({ view: 'menu' })
    expect(parseRoute('')).toEqual({ view: 'menu' })
    expect(parseRoute('#')).toEqual({ view: 'menu' })
  })

  it('reconnaît les routes de chapitre', () => {
    expect(parseRoute('#/chapitre-4')).toEqual({ view: 'chapter', chapter: 4 })
    expect(parseRoute('#/chapitre-4/')).toEqual({ view: 'chapter', chapter: 4 })
    expect(parseRoute('#/chapitre-12')).toEqual({ view: 'chapter', chapter: 12 })
    expect(parseRoute('#/chapitre-4')).toEqual(parseRoute(chapterHash(4)))
  })

  it('reconnaît la page Presa', () => {
    expect(parseRoute(PRESA_HASH)).toEqual({ view: 'presa' })
    expect(parseRoute('#/presa')).toEqual({ view: 'presa' })
    expect(parseRoute('#/presa/')).toEqual({ view: 'presa' })
  })

  it('retombe sur le menu pour tout hash inconnu', () => {
    for (const hash of [
      '#/inconnu',
      '#/chapitre',
      '#/chapitre-abc',
      '#/chapitre-0',
      '#/chapitre-',
      '#/chapitre-4/brouillon',
      '#/presa/brouillon',
      '#/PresA',
      '#chapitre-4',
      '#/Chapitre-4',
    ]) {
      expect(parseRoute(hash), hash).toEqual({ view: 'menu' })
    }
  })
})

describe('useHashRoute', () => {
  let container: HTMLDivElement
  let root: Root

  function Probe() {
    const route = useHashRoute()
    const view = route.view === 'chapter' ? `chapter:${route.chapter}` : route.view
    return <span data-route={view} />
  }

  function currentRoute(): string | null {
    return container.querySelector('span')?.getAttribute('data-route') ?? null
  }

  beforeEach(() => {
    window.location.hash = MENU_HASH
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    act(() => {
      root.render(<Probe />)
    })
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  function goTo(hash: string): void {
    act(() => {
      window.location.hash = hash
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
  }

  it('ouvre le menu au démarrage', () => {
    expect(currentRoute()).toBe('menu')
  })

  it('suit les changements de hash', () => {
    goTo('#/chapitre-4')
    expect(currentRoute()).toBe('chapter:4')

    goTo(PRESA_HASH)
    expect(currentRoute()).toBe('presa')

    goTo('#/chapitre-5')
    expect(currentRoute()).toBe('chapter:5')

    goTo('#/n-importe-quoi')
    expect(currentRoute()).toBe('menu')

    goTo(MENU_HASH)
    expect(currentRoute()).toBe('menu')
  })
})
