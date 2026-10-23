import type { ScenarioDef } from '../../core/types'
import { fr } from '../../i18n/fr'
import { createFile, createPile } from './memory'
import type { FileSnapshot, PileSnapshot } from './memory'

const S = fr.piles.scenarios
const emptyPile = createPile([])
const emptyFile = createFile([])

export const pileScenarios: ScenarioDef<PileSnapshot>[] = [
  {
    id: 'pileCours',
    title: S.pileCours.title,
    description: S.pileCours.description,
    profileId: 'pile',
    state: emptyPile,
    steps: [
      { operationId: 'empiler', params: { valeur: 25 } },
      { operationId: 'empiler', params: { valeur: 7 } },
      { operationId: 'empiler', params: { valeur: 12 } },
      { operationId: 'pileVide', params: {} },
    ],
  },
  {
    id: 'pileDepiler',
    title: S.pileDepiler.title,
    description: S.pileDepiler.description,
    profileId: 'pile',
    state: createPile([12, 7, 25]),
    steps: [
      { operationId: 'depiler', params: {} },
      { operationId: 'depiler', params: {} },
      { operationId: 'depiler', params: {} },
      { operationId: 'pileVide', params: {} },
    ],
  },
  {
    id: 'pileCopie',
    title: S.pileCopie.title,
    description: S.pileCopie.description,
    profileId: 'pile',
    state: emptyPile,
    steps: [
      { operationId: 'empilerCopie', params: { numero: 101 } },
      { operationId: 'empilerCopie', params: { numero: 102 } },
      { operationId: 'empilerCopie', params: { numero: 103 } },
      { operationId: 'corrigerCopie', params: {} },
      { operationId: 'corrigerCopie', params: {} },
    ],
  },
  {
    id: 'pileCopieCorrigee',
    title: S.pileCopieCorrigee.title,
    description: S.pileCopieCorrigee.description,
    profileId: 'pile',
    state: emptyPile,
    steps: [
      { operationId: 'empilerCopie', params: { numero: 101 } },
      { operationId: 'empilerCopie', params: { numero: 102 } },
      { operationId: 'empilerCopie', params: { numero: 103 } },
      { operationId: 'corrigerCopie', params: {} },
      { operationId: 'corrigerCopie', params: {} },
      { operationId: 'corrigerCopie', params: {} },
    ],
  },
  {
    id: 'pileVide',
    title: 'Pile vide',
    description: 'Point de départ vide pour empiler une première valeur.',
    profileId: 'pile',
    state: emptyPile,
    steps: [],
  },
]

export const fileScenarios: ScenarioDef<FileSnapshot>[] = [
  {
    id: 'fileCours',
    title: S.fileCours.title,
    description: S.fileCours.description,
    profileId: 'file',
    state: emptyFile,
    steps: [
      { operationId: 'enfiler', params: { valeur: 7 } },
      { operationId: 'enfiler', params: { valeur: 12 } },
      { operationId: 'enfiler', params: { valeur: 25 } },
      { operationId: 'fileVide', params: {} },
    ],
  },
  {
    id: 'fileServir',
    title: S.fileServir.title,
    description: S.fileServir.description,
    profileId: 'file',
    state: createFile([7, 12, 25]),
    steps: [
      { operationId: 'defiler', params: {} },
      { operationId: 'defiler', params: {} },
      { operationId: 'defiler', params: {} },
      { operationId: 'fileVide', params: {} },
    ],
  },
  {
    id: 'fileArrivees',
    title: S.fileArrivees.title,
    description: S.fileArrivees.description,
    profileId: 'file',
    state: emptyFile,
    steps: [
      { operationId: 'enregistrerArrivee', params: { numero: 201 } },
      { operationId: 'enregistrerArrivee', params: { numero: 202 } },
      { operationId: 'enregistrerArrivee', params: { numero: 203 } },
      { operationId: 'servirSuivant', params: {} },
      { operationId: 'servirSuivant', params: {} },
      { operationId: 'fileVide', params: {} },
    ],
  },
  {
    id: 'fileVide',
    title: 'File vide',
    description: 'Point de départ vide pour enfiler un premier client.',
    profileId: 'file',
    state: emptyFile,
    steps: [],
  },
]
