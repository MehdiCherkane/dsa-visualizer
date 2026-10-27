// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Step } from '../../core/types'
import { fr } from '../../i18n/fr'
import { emptyTreeSnapshot } from './memory'
import type { TreeSnapshot } from './memory'
import TreeVisualization from './Visualization'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function idleStep(snapshot: TreeSnapshot): Step<TreeSnapshot> {
  return {
    snapshot,
    fn: 'parcoursPrefixe',
    line: 0,
    caption: fr.captions.idle,
    changes: [],
    counters: { traversed: 0, comparisons: 0 },
    console: { output: '' },
  }
}

function render(): SVGSVGElement {
  const snapshot = emptyTreeSnapshot()
  const step = idleStep(snapshot)
  act(() => {
    root.render(
      <TreeVisualization
        snapshot={snapshot}
        step={step}
        prevStep={null}
        presentation={false}
        speed={1}
        stepIndex={0}
      />,
    )
  })
  const svg = container.querySelector<SVGSVGElement>('.tree-viz-svg')
  if (!svg) throw new Error('tree svg missing')
  Object.defineProperty(svg, 'getBoundingClientRect', {
    value: () => ({ x: 0, y: 0, left: 0, top: 0, right: 960, bottom: 440, width: 960, height: 440 }),
  })
  return svg
}

function viewBox(svg: SVGSVGElement): number[] {
  return (svg.getAttribute('viewBox') ?? '').split(' ').map(Number)
}

function wheel(svg: SVGSVGElement, init: WheelEventInit): void {
  act(() => {
    svg.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init }))
  })
}

describe('pavé tactile sur l’arbre binaire', () => {
  it('déplace la vue avec un défilement à deux doigts', () => {
    const svg = render()
    const before = viewBox(svg)
    wheel(svg, { deltaX: 10, deltaY: 6 })
    expect(viewBox(svg)).toEqual([before[0]! + 10, before[1]! + 6, before[2], before[3]])
  })

  it('zoome avec un pincement Ctrl+molette', () => {
    const svg = render()
    const before = viewBox(svg)
    wheel(svg, { deltaY: -10, ctrlKey: true })
    expect(viewBox(svg)[2]!).toBeLessThan(before[2]!)
  })
})
