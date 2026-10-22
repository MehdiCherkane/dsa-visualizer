// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  DOCK_MAX_HEIGHT,
  DOCK_MIN_HEIGHT,
  LAYOUT_STORAGE_KEY,
  WORKSPACE_MAX_SPLIT,
  WORKSPACE_MIN_SPLIT,
  createDefaultLayout,
  defaultDockHeight,
  normalizeLayout,
  readLayout,
  resizeAdjacent,
  toDockSplit,
  toPercentages,
  writeLayout,
} from './layout'

beforeEach(() => {
  window.localStorage.clear()
  Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true })
})

describe('normalisation de la disposition', () => {
  it('retombe sur les valeurs par défaut pour une valeur invalide', () => {
    expect(normalizeLayout(null)).toEqual(createDefaultLayout())
    expect(normalizeLayout('invalid')).toEqual(createDefaultLayout())
  })

  it('borne la largeur du code et la hauteur du dock', () => {
    const layout = normalizeLayout({
      workspaceSplit: 10,
      dockHeight: 9999,
      dockSplit: [2, 2, 1],
      focusedDockPane: 'console',
    })

    expect(layout.workspaceSplit).toBe(WORKSPACE_MIN_SPLIT)
    expect(layout.dockHeight).toBe(DOCK_MAX_HEIGHT)
    expect(layout.dockSplit).toEqual([40, 40, 20])
    expect(layout.focusedDockPane).toBe('console')

    const opposite = normalizeLayout({ workspaceSplit: 100, dockHeight: 0 })
    expect(opposite.workspaceSplit).toBe(WORKSPACE_MAX_SPLIT)
    expect(opposite.dockHeight).toBe(DOCK_MIN_HEIGHT)
  })

  it('refuse un découpage ou un panneau focalisé inconnu', () => {
    const layout = normalizeLayout({
      dockSplit: [0, 100, 100],
      focusedDockPane: 'inconnu',
    })

    expect(layout.dockSplit).toEqual([28, 37, 35])
    expect(layout.focusedDockPane).toBeNull()
  })

  it('utilise une hauteur de dock réduite sur un petit écran', () => {
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    expect(defaultDockHeight()).toBe(130)
    Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true })
    expect(defaultDockHeight()).toBe(160)
  })
})

describe('persistance de la disposition', () => {
  it('relit une disposition écrite avec la version courante', () => {
    const expected = {
      workspaceSplit: 55,
      dockHeight: 240,
      dockSplit: [20, 45, 35] as [number, number, number],
      focusedDockPane: 'journal' as const,
    }

    writeLayout(expected)

    expect(readLayout()).toEqual(expected)
  })

  it('ignore une version inconnue et un stockage illisible', () => {
    window.localStorage.setItem(
      LAYOUT_STORAGE_KEY,
      JSON.stringify({ version: 99, layout: { workspaceSplit: 55 } }),
    )
    expect(readLayout()).toEqual(createDefaultLayout())

    window.localStorage.setItem(LAYOUT_STORAGE_KEY, '{not-json')
    expect(readLayout()).toEqual(createDefaultLayout())
  })
})

describe('redimensionnement adjacent', () => {
  it('transfère la taille entre deux panneaux sans franchir les minima', () => {
    expect(resizeAdjacent([300, 300, 300], 0, 200, [200, 260, 220])).toEqual([340, 260, 300])
    expect(resizeAdjacent([300, 300, 300], 0, -200, [200, 260, 220])).toEqual([200, 400, 300])
  })

  it('ne modifie rien pour un index ou un total invalide', () => {
    const sizes = [300, 300]
    expect(resizeAdjacent(sizes, 1, 50, [100, 100])).toEqual(sizes)
    expect(resizeAdjacent([0, 0], 0, 50, [0, 0])).toEqual([0, 0])
    expect(resizeAdjacent([100, 100], 0, 50, [100, 100])).toEqual([100, 100])
  })

  it('convertit des largeurs mesurées en pourcentages et en fr', () => {
    expect(toPercentages([1, 2, 1])).toEqual([25, 50, 25])
    expect(toPercentages([0, 0])).toEqual([0, 0])
    expect(toDockSplit([2, 2, 1])).toEqual([40, 40, 20])
    expect(toDockSplit([2, 2])).toEqual([28, 37, 35])
  })
})
