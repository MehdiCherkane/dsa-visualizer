// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  chapterHash,
  exerciseHash,
  EXERCICES_HASH,
  MENU_HASH,
  parseRoute,
  useHashRoute,
} from './useHashRoute'

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

  it('reconnaît la liste et les fiches d’exercices', () => {
    expect(parseRoute(EXERCICES_HASH)).toEqual({ view: 'exercices' })
    expect(parseRoute('#/exercices/')).toEqual({ view: 'exercices' })
    expect(parseRoute('#/exercices/chapitre-1-fibonacci')).toEqual({
      view: 'exercices',
      exerciseId: 'chapitre-1-fibonacci',
    })
    expect(parseRoute('#/exercices/chapitre-1-fibonacci/')).toEqual({
      view: 'exercices',
      exerciseId: 'chapitre-1-fibonacci',
    })
    expect(parseRoute(exerciseHash('chapitre-1-fibonacci'))).toEqual({
      view: 'exercices',
      exerciseId: 'chapitre-1-fibonacci',
    })
    expect(exerciseHash()).toBe(EXERCICES_HASH)
  })

  it('laisse une fiche inconnue au routeur pour afficher « Fiche introuvable »', () => {
    expect(parseRoute('#/exercices/fiche-inconnue')).toEqual({
      view: 'exercices',
      exerciseId: 'fiche-inconnue',
    })
  })

  it('retombe sur le menu pour tout hash inconnu', () => {
    for (const hash of [
      '#/inconnu',
      '#/chapitre',
      '#/chapitre-abc',
      '#/chapitre-0',
      '#/chapitre-',
      '#/chapitre-4/brouillon',
      '#chapitre-4',
      '#/Chapitre-4',
      '#/exercices/fiche/invalide',
      '#/exercices/%E0%A4%A',
      '#/Exercices',
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
    const value =
      route.view === 'chapter'
        ? `chapter:${route.chapter}`
        : route.view === 'exercices'
          ? `exercices:${route.exerciseId ?? ''}`
          : 'menu'
    return <span data-route={value} />
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

    goTo('#/chapitre-5')
    expect(currentRoute()).toBe('chapter:5')

    goTo(EXERCICES_HASH)
    expect(currentRoute()).toBe('exercices:')

    goTo(exerciseHash('chapitre-1-fibonacci'))
    expect(currentRoute()).toBe('exercices:chapitre-1-fibonacci')

    goTo('#/n-importe-quoi')
    expect(currentRoute()).toBe('menu')

    goTo(MENU_HASH)
    expect(currentRoute()).toBe('menu')
  })
})
