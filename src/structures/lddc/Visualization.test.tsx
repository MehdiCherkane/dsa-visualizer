import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { OperationDef, ScenarioDef, Step } from '../../core/types'
import { fr } from '../../i18n/fr'
import LddcVisualization from './Visualization'
import { createCircularSnapshot } from './memory'
import type { LdcSnapshot } from './memory'
import { intOperations, studentOperations } from './operations'
import { intScenarios, studentScenarios } from './scenarios'

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

function operationsFor(profileId: string): OperationDef<LdcSnapshot>[] {
  return profileId === 'int' ? intOperations : studentOperations
}

function scenarioSteps(scenario: ScenarioDef<LdcSnapshot>): {
  first: Step<LdcSnapshot>
  last: Step<LdcSnapshot>
  previous: Step<LdcSnapshot> | null
} {
  const operations = operationsFor(scenario.profileId)
  if (scenario.steps.length === 0) {
    const step = idleStep(scenario.state)
    return { first: step, last: step, previous: null }
  }

  let snapshot = scenario.state
  let first: Step<LdcSnapshot> | null = null
  let last: Step<LdcSnapshot> | null = null
  let previous: Step<LdcSnapshot> | null = null

  for (const scenarioStep of scenario.steps) {
    const operation = operations.find((candidate) => candidate.id === scenarioStep.operationId)
    if (!operation) throw new Error(`Unknown operation ${scenarioStep.operationId}`)
    if (scenarioStep.stateBefore) snapshot = scenarioStep.stateBefore
    const steps = operation.run(snapshot, scenarioStep.params)
    first ??= steps[0] ?? null
    if (last) previous = last
    last = steps[steps.length - 1] ?? last
    snapshot = last!.snapshot
  }

  if (!first || !last) throw new Error(`Scenario ${scenario.id} produced no steps`)
  return { first, last, previous }
}

function render(
  step: Step<LdcSnapshot>,
  previous: Step<LdcSnapshot> | null,
  presentation = false,
): string {
  return renderToStaticMarkup(
    <LddcVisualization
      snapshot={step.snapshot}
      step={step}
      prevStep={previous}
      presentation={presentation}
      speed={1}
      stepIndex={0}
    />,
  )
}

describe('rendu SVG de la liste doublement chaînée circulaire', () => {
  for (const scenario of [...intScenarios, ...studentScenarios]) {
    it(`scénario ${scenario.id} : premier et dernier pas`, () => {
      const { first, last, previous } = scenarioSteps(scenario)
      for (const step of [first, last]) {
        const markup = render(step, previous)
        expect(markup).toContain('<svg')
        expect(markup).toContain(fr.viz.row)
        expect(markup).toContain('ldc-svg')

        if (step.snapshot.nodes.length > 0) {
          expect(markup).toContain('suivant')
          expect(markup).toContain('precedent')
          expect(markup).toContain('lane-band-circle')
          expect(markup.match(/arrow-suivant/g)?.length ?? 0).toBeGreaterThan(0)
          expect(markup.match(/arrow-precedent/g)?.length ?? 0).toBeGreaterThan(0)
        }

        if (step.snapshot.nodes.some((node) => node.lane === 'heap')) {
          expect(markup).toContain(fr.viz.heap)
        }
      }
    })
  }

  it('le cercle du cours affiche les trois adresses et deux arcs de fermeture', () => {
    const course = intScenarios.find((scenario) => scenario.id === 'cours')!
    const { last } = scenarioSteps(course)
    const markup = render(last, null)

    expect(markup).toContain('0x1A40')
    expect(markup).toContain('0x1A68')
    expect(markup).toContain('0x1A90')
    expect(markup).toContain('9')
    expect(markup).toContain('2')
    expect(markup).toContain('5')
    expect(markup).toContain('lane-band-circle')
  })

  it("l'état vide et le mode présentation se rendent sans erreur", () => {
    const snapshot = createCircularSnapshot('int', [])
    const empty = idleStep(snapshot)
    const markup = render(empty, null, true)

    expect(markup).toContain('la liste est vide')
    expect(markup).toContain(fr.viz.emptyInsert)
    expect(markup).toContain('ldc-svg')
  })

  it('un seul nœud dessine ses deux flèches sur lui-même', () => {
    const single = idleStep(
      createCircularSnapshot('int', [{ kind: 'int', value: 9 }]),
    )
    const markup = render(single, null)

    expect(markup).toContain('0x1A40')
    expect(markup.match(/arrow-suivant/g)?.length ?? 0).toBeGreaterThan(0)
    expect(markup.match(/arrow-precedent/g)?.length ?? 0).toBeGreaterThan(0)
    expect(markup).toContain('lane-band-circle')
  })

  it('le rendu est stable pour les huit nœuds', () => {
    const values = [9, 2, 5, 1, 3, 4, 6, 7]
    const eight = idleStep(
      createCircularSnapshot(
        'int',
        values.map((value) => ({ kind: 'int' as const, value })),
      ),
    )
    const markup = render(eight, null)

    for (const value of values) expect(markup).toContain(`>${value}<`)
    expect(markup).toContain('0x1A40')
    expect(markup).toContain('lane-band-circle')
  })
})
