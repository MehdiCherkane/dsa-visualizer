import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { ScenarioDef, Step } from '../../core/types'
import { fr } from '../../i18n/fr'
import { pilesFilesStatiquesPlugin } from './index'
import { createSnapshot, emptySnapshot } from './memory'
import type { ArraySnapshot } from './memory'
import { fileCirculaireOperations } from './operations'
import { fileCirculaireScenarios, fileDecalageScenarios, fileOrdinaireScenarios, pileScenarios } from './scenarios'
import { ringGeometry } from './ringGeometry'
import { StaticStructuresSupport } from './SupportPanels'
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

  it('réutilise exactement le secteur de chaque case pour le survol', () => {
    const snapshot = createSnapshot('file-circulaire', [10, 20, 30, 40, 50])
    const ring = ringGeometry(snapshot)
    expect(ring).not.toBeNull()
    if (!ring) return
    const markup = render(idleStep(snapshot))
    for (const slot of ring.slots) {
      expect(markup).toContain(
        `class="ss-ring-highlight" data-index="${slot.index}" d="${slot.sectorPath}"`,
      )
    }
  })

  it('empile l’icône de 22 px au-dessus du compteur et du statut', () => {
    const markup = render(idleStep(createSnapshot('file-circulaire', [10, 20, 30, 40, 50])))
    expect(markup).toContain('class="ss-ring-centre-icon" x="-11" y="-46" width="22" height="22"')
    expect(markup).toContain('class="ss-ring-count" y="-4"')
    expect(markup).toContain('class="ss-ring-status is-full" y="24"')

    const one = render(idleStep(createSnapshot('file-circulaire', [10])))
    expect(one).toContain('class="ss-ring-centre-icon" x="-11" y="-46" width="22" height="22"')
  })

  it('expose les cases de l’anneau au clavier et coupe le mouvement sur les sauts', () => {
    const step = idleStep(createSnapshot('file-circulaire', [10, 20, 30]))
    const markup = render(step)
    expect(markup).toContain('role="list"')
    expect(markup).toContain(`aria-label="${V.ringSlots}"`)
    expect(markup).toContain('role="listitem"')
    expect(markup).toContain('tabindex="0"')
    expect(markup).toContain(V.ringCase(0))
    expect(markup).toContain('data-motion="on"')

    const instant = renderToStaticMarkup(
      <StaticStructuresVisualization
        snapshot={step.snapshot}
        step={step}
        prevStep={null}
        presentation={false}
        speed={1}
        stepIndex={0}
        animate={false}
      />,
    )
    expect(instant).toContain('data-motion="off"')
    expect(instant).not.toContain('data-motion="on"')

    for (const profile of ['pile', 'file-ordinaire', 'file-decalage'] as const) {
      expect(render(idleStep(createSnapshot(profile, [10])))).not.toContain('ss-ring-view')
    }
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

    const file3 = render(idleStep(emptySnapshot('file-circulaire')), null, () => {})
    expect(file3).toContain('viz-stage is-empty is-ring')
    expect(file3).toContain('ss-empty-banner')
    expect(file3).toContain(V.insertFile)
    expect(file3).toContain('ss-ring-pointer is-gold is-dashed')
    expect(file3).toContain(V.ringUndefined)

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

  it('rend les cartes de calcul et de mémoire pour la file circulaire seulement', () => {
    const defiler = fileCirculaireOperations.find((operation) => operation.id === 'defiler')
    const enfiler = fileCirculaireOperations.find((operation) => operation.id === 'enfiler')
    if (!defiler || !enfiler) throw new Error('Missing circular queue operations')

    let snapshot = createSnapshot('file-circulaire', [42, 17, 63, 8, 55])
    for (let count = 0; count < 2; count += 1) {
      const steps = defiler.run(snapshot, {})
      snapshot = steps[steps.length - 1]!.snapshot
    }
    const steps = enfiler.run(snapshot, { valeur: 71 })
    const step = steps[steps.length - 1]!

    const markup = renderToStaticMarkup(
      <StaticStructuresSupport snapshot={step.snapshot} step={step} presentation={false} />,
    )
    expect(markup).toContain(fr.staticStructures.support.indicesTitle)
    expect(markup).toContain(fr.staticStructures.support.memoryTitle)
    expect(markup).toContain('(0 + 1) % 5')
    expect(markup).toContain(fr.staticStructures.support.staleTarget(1))
    expect(markup).toContain('ss-calc-verdict is-no')
    expect(markup).toContain(fr.staticStructures.support.wrap)
    expect(markup).toContain(fr.staticStructures.support.memoryApplied(4, 5))
    expect(markup).toContain('is-stale')
    expect(markup).toContain('17')
    expect(markup).toContain('71')

    const full = createSnapshot('file-circulaire', [10, 20, 30, 40, 50])
    const fullMarkup = renderToStaticMarkup(
      <StaticStructuresSupport
        snapshot={full}
        step={idleStep(full)}
        presentation={false}
      />,
    )
    expect(fullMarkup).toContain(fr.staticStructures.support.occupied(0))
    expect(fullMarkup).toContain('ss-calc-verdict is-yes')

    const one = createSnapshot('file-circulaire', [42])
    const oneMarkup = renderToStaticMarkup(
      <StaticStructuresSupport
        snapshot={one}
        step={idleStep(one)}
        presentation={false}
      />,
    )
    expect(oneMarkup.match(/is-one/g)).toHaveLength(1)
    expect(oneMarkup.match(/ss-memory-marker is-both/g)).toHaveLength(1)
    expect(oneMarkup).toContain('ss-memory-column is-used is-head is-tail is-one')
    expect(oneMarkup).toContain('ss-memory-column is-free')

    for (const profile of ['pile', 'file-ordinaire', 'file-decalage'] as const) {
      const other = emptySnapshot(profile)
      expect(
        renderToStaticMarkup(
          <StaticStructuresSupport
            snapshot={other}
            step={idleStep(other)}
            presentation={false}
          />,
        ),
      ).toBe('')
    }
  })
})
