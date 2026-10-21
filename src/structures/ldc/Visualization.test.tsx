import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { OperationDef, ScenarioDef, Step } from '../../core/types'
import { fr } from '../../i18n/fr'
import { intOperations, studentOperations } from './operations'
import { intScenarios, studentScenarios } from './scenarios'
import { createSnapshot } from './memory'
import type { LdcSnapshot } from './memory'
import LdcVisualization from './Visualization'

function idleStep(snapshot: LdcSnapshot): Step<LdcSnapshot> {
  return {
    snapshot,
    fn: snapshot.profile === 'int' ? 'afficherListe' : 'afficherListe',
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

function render(step: Step<LdcSnapshot>, previous: Step<LdcSnapshot> | null, presentation = false): string {
  return renderToStaticMarkup(
    <LdcVisualization
      snapshot={step.snapshot}
      step={step}
      prevStep={previous}
      presentation={presentation}
      speed={1}
      stepIndex={0}
    />,
  )
}

describe('rendu SVG de la liste doublement chaînée', () => {
  for (const scenario of [...intScenarios, ...studentScenarios]) {
    it(`scénario ${scenario.id} : premier et dernier pas`, () => {
      const { first, last, previous } = scenarioSteps(scenario)
      for (const step of [first, last]) {
        const markup = render(step, previous)
        expect(markup).toContain('<svg')
        expect(markup).toContain('NULL')
        if (step.snapshot.nodes.length > 0) {
          expect(markup).toContain('suivant')
          expect(markup).toContain('precedent')
        }
        expect(markup).toContain(fr.viz.row)
        if (step.snapshot.nodes.some((node) => node.lane === 'heap')) {
          expect(markup).toContain(fr.viz.heap)
        } else {
          expect(markup).not.toContain(fr.viz.heap)
        }
      }
    })
  }

  it('affiche l’état vide et le mode présentation sans erreur', () => {
    const snapshot = intScenarios[0]!.state
    const empty = idleStep({
      ...snapshot,
      nodes: [],
      globals: { debut: { kind: 'null' } },
    })
    const markup = render(empty, null, true)
    expect(markup).toContain('la liste est vide')
    expect(markup).toContain(fr.viz.emptyInsert)
    expect(markup).toContain('ldc-svg')
  })

  it('dessine les deux flèches pour une liste de trois nœuds', () => {
    const { last } = scenarioSteps(intScenarios[0]!)
    const markup = render(last, null)
    expect(markup.match(/arrow-suivant/g)?.length ?? 0).toBeGreaterThan(0)
    expect(markup.match(/arrow-precedent/g)?.length ?? 0).toBeGreaterThan(0)
    expect(markup).toContain('0x1A40')
    expect(markup).toContain('0x1A68')
  })

  it('affiche les étudiants au format nom prénom', () => {
    const snapshot = createSnapshot('etudiant', [
      { kind: 'etudiant', student: { numero: 101, nom: 'AAA', prenom: 'aaa' } },
    ])
    const markup = render(idleStep(snapshot), null)
    expect(markup).toContain('AAA aaa')
    expect(markup).not.toContain('aaa AAA')
  })
})
