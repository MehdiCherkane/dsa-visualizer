import { fr } from '../../i18n/fr'
import { createSnapshot } from './memory'
import type { LdcItem, LdcSnapshot } from './memory'
import type { ScenarioDef, StudentValue } from '../../core/types'

const intItems = (values: number[]): LdcItem[] => values.map((value) => ({ kind: 'int', value }))

const studentItems = (students: StudentValue[]): LdcItem[] =>
  students.map((student) => ({ kind: 'etudiant', student }))

const E1: StudentValue = { numero: 101, nom: 'AAA', prenom: 'aaa' }
const E2: StudentValue = { numero: 102, nom: 'BBB', prenom: 'bbb' }
const E3: StudentValue = { numero: 103, nom: 'CCC', prenom: 'ccc' }

const base925 = createSnapshot('int', intItems([9, 2, 5]))
const registry = createSnapshot('etudiant', studentItems([E1, E2, E3]))

export const intScenarios: ScenarioDef<LdcSnapshot>[] = [
  {
    id: 'cours',
    title: fr.scenarios.items.cours.title,
    description: fr.scenarios.items.cours.description,
    profileId: 'int',
    state: base925,
    steps: [],
  },
  {
    id: 'milieu',
    title: fr.scenarios.items.milieu.title,
    description: fr.scenarios.items.milieu.description,
    profileId: 'int',
    state: base925,
    steps: [
      { operationId: 'supprimerValeur', params: { valeur: 2 } },
      { operationId: 'supprimerValeur', params: { valeur: 5 } },
    ],
  },
  {
    id: 'particulier',
    title: fr.scenarios.items.particulier.title,
    description: fr.scenarios.items.particulier.description,
    profileId: 'int',
    state: base925,
    steps: [
      { operationId: 'supprimerValeur', params: { valeur: 9 } },
      {
        operationId: 'insererAvantValeur',
        params: { avant: 9, valeur: 7 },
        stateBefore: base925,
      },
    ],
  },
  {
    id: 'avant',
    title: fr.scenarios.items.avant.title,
    description: fr.scenarios.items.avant.description,
    profileId: 'int',
    state: base925,
    steps: [{ operationId: 'insererAvantValeur', params: { avant: 2, valeur: 7 } }],
  },
  {
    id: 'arriere',
    title: fr.scenarios.items.arriere.title,
    description: fr.scenarios.items.arriere.description,
    profileId: 'int',
    state: base925,
    steps: [{ operationId: 'afficherListeEnvers', params: {} }],
  },
  {
    id: 'inverser',
    title: fr.scenarios.items.inverser.title,
    description: fr.scenarios.items.inverser.description,
    profileId: 'etudiant',
    state: registry,
    steps: [{ operationId: 'inverserListe', params: {} }],
  },
  {
    id: 'absente',
    title: fr.scenarios.items.absente.title,
    description: fr.scenarios.items.absente.description,
    profileId: 'int',
    state: base925,
    steps: [
      { operationId: 'supprimerValeur', params: { valeur: 99 } },
      { operationId: 'insererApresValeur', params: { apres: 99, valeur: 4 } },
    ],
  },
]

export const studentScenarios: ScenarioDef<LdcSnapshot>[] = [
  {
    id: 'registre',
    title: fr.scenarios.items.registre.title,
    description: fr.scenarios.items.registre.description,
    profileId: 'etudiant',
    state: createSnapshot('etudiant', []),
    steps: [
      { operationId: 'inscrireEtudiant', params: { numero: E1.numero, nom: E1.nom, prenom: E1.prenom } },
      { operationId: 'inscrireEtudiant', params: { numero: E2.numero, nom: E2.nom, prenom: E2.prenom } },
      { operationId: 'inscrireEtudiant', params: { numero: E3.numero, nom: E3.nom, prenom: E3.prenom } },
      { operationId: 'radierEtudiant', params: { num: 102 } },
      { operationId: 'radierEtudiant', params: { num: 101 } },
    ],
  },
]
