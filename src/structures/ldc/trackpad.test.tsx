// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Step } from '../../core/types'
import { fr } from '../../i18n/fr'
import { createSnapshot } from './memory'
import type { LdcSnapshot } from './memory'
import LdcVisualization from './Visualization'

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

function idleStep(snapshot: LdcSnapshot): Step<LdcSnapshot> {
  return {
    snapshot,
    fn: 'afficherListe',
    line: 0,
    caption: fr.captions.idle,
    changes: [],
    counters: { traversed: 0, comparisons: 0 },
    console: { output: '' },
  }
}

function render(): void {
  const snapshot = createSnapshot('int', [
    { kind: 'int', value: 1 },
    { kind: 'int', value: 2 },
  ])
  const step = idleStep(snapshot)
  act(() => {
    root.render(
      <LdcVisualization
        snapshot={snapshot}
        step={step}
        prevStep={null}
        presentation={false}
        speed={1}
        stepIndex={0}
      />,
    )
  })
}

interface CameraView {
  x: number
  y: number
  k: number
}

function camera(): CameraView {
  const pattern = container.querySelector('#camera-grid')
  const match = /translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)/.exec(
    pattern?.getAttribute('patternTransform') ?? '',
  )
  if (!match) throw new Error('camera transform missing')
  return { x: Number(match[1]), y: Number(match[2]), k: Number(match[3]) }
}

function wheel(init: WheelEventInit): void {
  const stage = container.querySelector('.viz-stage')
  if (!stage) throw new Error('stage missing')
  act(() => {
    stage.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init }))
  })
}

describe('pavé tactile sur la liste doublement chaînée', () => {
  it('déplace la caméra avec un défilement à deux doigts', () => {
    render()
    const before = camera()
    wheel({ deltaX: 6, deltaY: 14 })
    const after = camera()
    expect(after.k).toBeCloseTo(before.k, 6)
    expect(after.x).toBeCloseTo(before.x - 6, 6)
    expect(after.y).toBeCloseTo(before.y - 14, 6)
  })

  it('zoome avec un pincement Ctrl+molette', () => {
    render()
    const before = camera()
    wheel({ deltaY: -10, ctrlKey: true })
    expect(camera().k).toBeGreaterThan(before.k)
  })

  it('conserve le zoom à la molette de souris', () => {
    render()
    const before = camera()
    wheel({ deltaY: 100 })
    expect(camera().k).toBeLessThan(before.k)
  })
})
