import type { ScenarioDef } from '../../core/types'
import { fr } from '../../i18n/fr'
import { createSnapshot, emptySnapshot } from './memory'
import type { ArraySnapshot } from './memory'

const S = fr.staticStructures.scenarios

export const pileScenarios: ScenarioDef<ArraySnapshot>[] = [
  {
    id: 'pileCopies',
    title: S.pileCopies.title,
    description: S.pileCopies.description,
    profileId: 'pile',
    state: emptySnapshot('pile'),
    steps: [
      { operationId: 'empilerCopie', params: { numero: 12 } },
      { operationId: 'empilerCopie', params: { numero: 7 } },
      { operationId: 'empilerCopie', params: { numero: 25 } },
      { operationId: 'corrigerCopie', params: {} },
      { operationId: 'corrigerCopie', params: {} },
    ],
  },
  {
    id: 'pilePleine',
    title: S.pilePleine.title,
    description: S.pilePleine.description,
    profileId: 'pile',
    state: emptySnapshot('pile'),
    steps: [
      { operationId: 'empiler', params: { valeur: 10 } },
      { operationId: 'empiler', params: { valeur: 20 } },
      { operationId: 'empiler', params: { valeur: 30 } },
      { operationId: 'empiler', params: { valeur: 40 } },
      { operationId: 'empiler', params: { valeur: 50 } },
      { operationId: 'empiler', params: { valeur: 60 } },
      { operationId: 'depiler', params: {} },
      { operationId: 'empiler', params: { valeur: 60 } },
    ],
  },
  {
    id: 'parentheses',
    title: S.parentheses.title,
    description: S.parentheses.description,
    profileId: 'pile',
    state: createSnapshot('pile'),
    steps: [
      { operationId: 'parenthesesEquilibrees', params: { texte: '(()())' } },
      { operationId: 'parenthesesEquilibrees', params: { texte: '(()' } },
      { operationId: 'parenthesesEquilibrees', params: { texte: ')(' } },
    ],
  },
]

export const fileOrdinaireScenarios: ScenarioDef<ArraySnapshot>[] = [
  {
    id: 'fileOrdinaireTrace',
    title: S.fileTrace.title,
    description: S.fileTrace.description,
    profileId: 'file-ordinaire',
    state: emptySnapshot('file-ordinaire'),
    steps: [
      { operationId: 'enfiler', params: { valeur: 65 } },
      { operationId: 'enfiler', params: { valeur: 66 } },
      { operationId: 'enfiler', params: { valeur: 67 } },
      { operationId: 'enfiler', params: { valeur: 68 } },
      { operationId: 'defiler', params: {} },
      { operationId: 'defiler', params: {} },
    ],
  },
  {
    id: 'fileOrdinaireGaspillage',
    title: S.fileGaspillage.title,
    description: S.fileGaspillage.description,
    profileId: 'file-ordinaire',
    state: createSnapshot('file-ordinaire', [10, 20, 30, 40, 50]),
    steps: [
      { operationId: 'defiler', params: {} },
      { operationId: 'defiler', params: {} },
      { operationId: 'enfiler', params: { valeur: 60 } },
    ],
  },
]

export const fileDecalageScenarios: ScenarioDef<ArraySnapshot>[] = [
  {
    id: 'fileDecalageTrace',
    title: S.fileTrace.title,
    description: S.fileTrace.description,
    profileId: 'file-decalage',
    state: emptySnapshot('file-decalage'),
    steps: [
      { operationId: 'enfiler', params: { valeur: 65 } },
      { operationId: 'enfiler', params: { valeur: 66 } },
      { operationId: 'enfiler', params: { valeur: 67 } },
      { operationId: 'enfiler', params: { valeur: 68 } },
      { operationId: 'defiler', params: {} },
      { operationId: 'defiler', params: {} },
    ],
  },
  {
    id: 'fileDecalageCout',
    title: S.fileDecalage.title,
    description: S.fileDecalage.description,
    profileId: 'file-decalage',
    state: createSnapshot('file-decalage', [10, 20, 30, 40]),
    steps: [
      { operationId: 'defiler', params: {} },
      { operationId: 'defiler', params: {} },
      { operationId: 'enfiler', params: { valeur: 50 } },
    ],
  },
]

export const fileCirculaireScenarios: ScenarioDef<ArraySnapshot>[] = [
  {
    id: 'fileCirculaireTrace',
    title: S.fileTrace.title,
    description: S.fileTrace.description,
    profileId: 'file-circulaire',
    state: emptySnapshot('file-circulaire'),
    steps: [
      { operationId: 'enfiler', params: { valeur: 65 } },
      { operationId: 'enfiler', params: { valeur: 66 } },
      { operationId: 'enfiler', params: { valeur: 67 } },
      { operationId: 'enfiler', params: { valeur: 68 } },
      { operationId: 'defiler', params: {} },
      { operationId: 'defiler', params: {} },
    ],
  },
  {
    id: 'fileCirculaireReutilisation',
    title: S.fileReutilisation.title,
    description: S.fileReutilisation.description,
    profileId: 'file-circulaire',
    state: createSnapshot('file-circulaire', [10, 20, 30, 40, 50]),
    steps: [
      { operationId: 'defiler', params: {} },
      { operationId: 'defiler', params: {} },
      { operationId: 'enfiler', params: { valeur: 60 } },
      { operationId: 'enfiler', params: { valeur: 70 } },
      { operationId: 'defiler', params: {} },
      { operationId: 'afficherFile', params: {} },
    ],
  },
  {
    id: 'fileCirculaireMax',
    title: S.recupererMax.title,
    description: S.recupererMax.description,
    profileId: 'file-circulaire',
    state: createSnapshot('file-circulaire', [42, 17, 63, 8, 55]),
    steps: [
      { operationId: 'recupererMax', params: {} },
      { operationId: 'afficherFile', params: {} },
    ],
  },
]
