import type { ScenarioDef } from '../../core/types'
import { fr } from '../../i18n/fr'
import { createSnapshot } from './memory'
import type { LscItem, LscSnapshot } from './memory'

const intItems = (values: number[]): LscItem[] => values.map((value) => ({ kind: 'int', value }))

const base925 = createSnapshot('lineaire', intItems([9, 2, 5]))
const base25 = createSnapshot('lineaire', intItems([2, 5]))
const emptyLinear = createSnapshot('lineaire', [])

const circular925 = createSnapshot('circulaire', intItems([9, 2, 5]))
const circular25 = createSnapshot('circulaire', intItems([2, 5]))
const circularSingle = createSnapshot('circulaire', intItems([7]))
const emptyCircular = createSnapshot('circulaire', [])

const S = fr.lsc.scenarios
const SC = S.circulaire

export const linearScenarios: ScenarioDef<LscSnapshot>[] = [
  {
    id: 'cours',
    title: S.cours.title,
    description: S.cours.description,
    profileId: 'lineaire',
    state: base925,
    steps: [],
  },
  {
    id: 'milieu',
    title: S.milieu.title,
    description: S.milieu.description,
    profileId: 'lineaire',
    state: base925,
    steps: [
      { operationId: 'supprimerValeur', params: { valeur: 2 } },
      { operationId: 'supprimerValeur', params: { valeur: 5 } },
      { operationId: 'afficherListe', params: {} },
    ],
  },
  {
    id: 'tete',
    title: S.tete.title,
    description: S.tete.description,
    profileId: 'lineaire',
    state: base25,
    steps: [
      { operationId: 'insererEnTete', params: { valeur: 9 } },
      { operationId: 'insererEnFin', params: { valeur: 7 } },
      { operationId: 'afficherListe', params: {} },
    ],
  },
  {
    id: 'absente',
    title: S.absente.title,
    description: S.absente.description,
    profileId: 'lineaire',
    state: base925,
    steps: [
      { operationId: 'supprimerValeur', params: { valeur: 99 } },
      { operationId: 'rechercher', params: { valeur: 99 } },
    ],
  },
  {
    id: 'detruire',
    title: S.detruire.title,
    description: S.detruire.description,
    profileId: 'lineaire',
    state: base925,
    steps: [
      { operationId: 'detruireListe', params: {} },
      { operationId: 'afficherListe', params: {} },
    ],
  },
  {
    id: 'vide',
    title: 'Liste vide',
    description: 'Point de départ vide pour insérer un premier nœud.',
    profileId: 'lineaire',
    state: emptyLinear,
    steps: [],
  },
]

/**
 * Circular scenarios use a `circ-` prefix because the scenario picker merges
 * every profile: ids must stay unique even though the operations are the same.
 */
export const circularScenarios: ScenarioDef<LscSnapshot>[] = [
  {
    id: 'circ-cours',
    title: SC.cours.title,
    description: SC.cours.description,
    profileId: 'circulaire',
    state: circular925,
    steps: [],
  },
  {
    id: 'circ-milieu',
    title: SC.milieu.title,
    description: SC.milieu.description,
    profileId: 'circulaire',
    state: circular925,
    steps: [
      { operationId: 'supprimerValeur', params: { valeur: 2 } },
      { operationId: 'supprimerValeur', params: { valeur: 5 } },
      { operationId: 'afficherListe', params: {} },
    ],
  },
  {
    id: 'circ-tete',
    title: SC.tete.title,
    description: SC.tete.description,
    profileId: 'circulaire',
    state: circular25,
    steps: [
      { operationId: 'insererEnTete', params: { valeur: 9 } },
      { operationId: 'insererEnFin', params: { valeur: 7 } },
      { operationId: 'afficherListe', params: {} },
    ],
  },
  {
    id: 'circ-absente',
    title: SC.absente.title,
    description: SC.absente.description,
    profileId: 'circulaire',
    state: circular925,
    steps: [
      { operationId: 'supprimerValeur', params: { valeur: 99 } },
      { operationId: 'rechercher', params: { valeur: 99 } },
    ],
  },
  {
    id: 'circ-detruire',
    title: SC.detruire.title,
    description: SC.detruire.description,
    profileId: 'circulaire',
    state: circular925,
    steps: [
      { operationId: 'detruireListe', params: {} },
      { operationId: 'afficherListe', params: {} },
    ],
  },
  {
    id: 'circ-vide',
    title: SC.vide.title,
    description: SC.vide.description,
    profileId: 'circulaire',
    state: emptyCircular,
    steps: [],
  },
  {
    id: 'circ-single',
    title: SC.single.title,
    description: SC.single.description,
    profileId: 'circulaire',
    state: circularSingle,
    steps: [],
  },
  {
    id: 'circ-supprimer-seul',
    title: SC.supprimerSeul.title,
    description: SC.supprimerSeul.description,
    profileId: 'circulaire',
    state: circularSingle,
    steps: [
      { operationId: 'supprimerEnTete', params: {} },
      { operationId: 'afficherListe', params: {} },
    ],
  },
  {
    id: 'circ-supprimer-debut',
    title: SC.supprimerDebut.title,
    description: SC.supprimerDebut.description,
    profileId: 'circulaire',
    state: circular925,
    steps: [
      { operationId: 'supprimerEnTete', params: {} },
      { operationId: 'afficherListe', params: {} },
    ],
  },
]
