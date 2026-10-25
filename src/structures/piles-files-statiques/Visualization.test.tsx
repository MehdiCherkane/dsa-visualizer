import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ScenarioDef, Step } from '../../core/types'
import { fr } from '../../i18n/fr'
import { pilesFilesStatiquesPlugin } from './index'
import { createSnapshot, emptySnapshot } from './memory'
import type { ArraySnapshot } from './memory'
import { fileCirculaireScenarios, fileDecalageScenarios, fileOrdinaireScenarios, pileScenarios } from './scenarios'
import StaticStructuresVisualization, { BilanOverlay } from './Visualization'

const V = fr.staticStructures.viz
const B = fr.staticStructures.bilan

const allScenarios = [
  ...pileScenarios,
  ...fileOrdinaireScenarios,
  ...fileDecalageScenarios,
  ...fileCirculaireScenarios,
]

function idleStep(snapshot: ArraySnapshot): Step<ArraySnapshot> {
  return {
    snapshot,
    fn: snapshot.profile === 'pile' ? 'afficherPile' : 'afficherFile',
    line: 0,
    caption: fr.captions.idle,
    changes: [],
    counters: { traversed: 0, comparisons: 0 },
    console: { output: '' },
  }
}

function scenarioSteps(scenario: ScenarioDef<ArraySnapshot>): {
  first: Step<ArraySnapshot>
  last: Step<ArraySnapshot>
  previous: Step<ArraySnapshot> | null
} {
  const profile = pilesFilesStatiquesPlugin.profiles.find(
    (candidate) => candidate.id === scenario.profileId,
  )
  if (!profile) throw new Error(`Unknown profile ${scenario.profileId}`)

  if (scenario.steps.length === 0) {
    const step = idleStep(scenario.state)
    return { first: step, last: step, previous: null }
  }

  let snapshot = scenario.state
  let first: Step<ArraySnapshot> | null = null
  let last: Step<ArraySnapshot> | null = null
  let previous: Step<ArraySnapshot> | null = null

  for (const scenarioStep of scenario.steps) {
    const operation = profile.operations.find(
      (candidate) => candidate.id === scenarioStep.operationId,
    )
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
  step: Step<ArraySnapshot>,
  previous: Step<ArraySnapshot> | null = null,
  onEmptyInsert?: () => void,
): string {
  return renderToStaticMarkup(
    <StaticStructuresVisualization
      snapshot={step.snapshot}
      step={step}
      prevStep={previous}
      presentation={false}
      speed={1}
      stepIndex={0}
      {...(onEmptyInsert ? { onEmptyInsert } : {})}
    />,
  )
}

describe('rendu SVG des piles et files statiques', () => {
  for (const scenario of allScenarios) {
    it(`scénario ${scenario.id} : premier et dernier pas`, () => {
      const { first, last, previous } = scenarioSteps(scenario)
      for (const step of [first, last]) {
        const markup = render(step, previous)
        expect(markup).toContain('<svg')
        expect(markup).toContain('elements[MAX]')
        expect(markup).toContain(V.legend)
        expect(markup).toContain(V.legendLive)
        expect(markup).toContain('aria-haspopup="dialog"')
      }
    })
  }

  it('affiche les valeurs et le repère sommet de la pile', () => {
    const markup = render(idleStep(createSnapshot('pile', [12, 7, 25])))
    expect(markup).toContain('sommet = 2')
    expect(markup).toContain('>12<')
    expect(markup).toContain('>7<')
    expect(markup).toContain('>25<')
    expect(markup).toContain(fr.profiles.pile)
    expect(markup).toContain('3 / 5 cases occupées')
    expect(markup).toContain(V.pileHint)
  })

  it('affiche av, ar et le sens FIFO de la file ordinaire', () => {
    const markup = render(idleStep(createSnapshot('file-ordinaire', [65, 66, 67, 68])))
    expect(markup).toContain('av = 0')
    expect(markup).toContain('ar = 3')
    expect(markup).toContain(V.fifo)
    expect(markup).toContain(fr.profiles.file1)
    expect(markup).toContain('4 / 5 cases occupées')
    expect(markup).toContain(V.ordinaireHint)
  })

  it('affiche le compteur ar seul pour la file par décalage', () => {
    const markup = render(idleStep(createSnapshot('file-decalage', [65, 66, 67, 68])))
    expect(markup).toContain('ar = 4')
    expect(markup).not.toContain('av =')
    expect(markup).toContain(V.fifo)
    expect(markup).toContain(fr.profiles.file2)
    expect(markup).toContain(V.decalageHint)
  })

  it('affiche les deux repères et le retour circulaire quand la file est pleine', () => {
    const markup = render(idleStep(createSnapshot('file-circulaire', [10, 20, 30, 40, 50])))
    expect(markup).toContain('av = 0')
    expect(markup).toContain('ar = 4')
    expect(markup).toContain(fr.profiles.file3)
    expect(markup).toContain(V.wrap)
    expect(markup).toContain(V.stateFullFile)
    expect(markup).toContain(V.circulaireHint)
    expect(markup).toContain(V.wrapFormula(4, 5, 0))
    expect(markup).toContain('ss-ring-wrap is-upcoming')
    expect(markup).toContain('ss-ring-value')
    expect(markup).not.toContain('ss-band')
  })

  it('affiche la bannière vide et le bouton d’insertion quand la structure est vide', () => {
    const pile = render(idleStep(emptySnapshot('pile')), null, () => {})
    expect(pile).toContain('ss-empty-banner')
    expect(pile).toContain('Pile vide : sommet = -1.')
    expect(pile).toContain(V.insertPile)

    const file1 = render(idleStep(emptySnapshot('file-ordinaire')), null, () => {})
    expect(file1).toContain('File vide : av = ar = -1.')
    expect(file1).toContain(V.insertFile)

    const file2 = render(idleStep(emptySnapshot('file-decalage')), null, () => {})
    expect(file2).toContain('File vide : ar = 0.')
    expect(file2).toContain(V.insertFile)

    expect(render(idleStep(emptySnapshot('pile')))).not.toContain('ss-empty-banner')
  })

  it('affiche la valeur retournée par une opération', () => {
    const step: Step<ArraySnapshot> = {
      ...idleStep(createSnapshot('pile', [12])),
      console: { output: '', returnValue: 12 },
    }
    const markup = render(step)
    expect(markup).toContain(V.returned)
    expect(markup).toContain('>12<')
    expect(markup).toContain('ss-return-chip')
  })

  it('rend le bilan des trois files dans une boîte de dialogue accessible', () => {
    const markup = renderToStaticMarkup(<BilanOverlay onClose={() => {}} />)
    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toContain('aria-labelledby="ss-bilan-title"')
    expect(markup).toContain('id="ss-bilan-title"')
    expect(markup).toContain(B.title)
    expect(markup).toContain(B.subtitle)
    for (const row of B.rows) {
      expect(markup).toContain(row.version)
      expect(markup).toContain(row.trap)
    }
    expect(markup).toContain(B.pileTraceTitle)
    expect(markup).toContain(B.fileTraceTitle)
    expect(markup).toContain(V.bilanClose)
  })
})
