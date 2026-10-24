import type { OperationDef, ParamDef } from '../../core/types'
import { fr } from '../../i18n/fr'
import type { ArraySnapshot } from './memory'
import {
  runAfficherPile,
  runCorrigerCopie,
  runDepiler,
  runEmpiler,
  runEmpilerCopie,
  runInitPile,
  runParenthesesEquilibrees,
  runPilePleine,
  runPileVide,
  runSommetPile,
} from './ops/pileOps'
import {
  runAfficherFile,
  runDefiler,
  runEnfiler,
  runEnregistrerArrivee,
  runFilePleine,
  runFileVide,
  runGuichetSuivant,
  runInitFile,
  runRecupererMax,
} from './ops/queueOps'

const O = fr.staticStructures.ops

function valueParam(defaultValue: number): ParamDef {
  return {
    name: 'valeur',
    kind: 'number',
    label: fr.params.valeur,
    defaultValue,
  }
}

function numeroParam(defaultValue: number): ParamDef {
  return {
    name: 'numero',
    kind: 'number',
    label: fr.params.numero,
    defaultValue,
  }
}

function texteParam(defaultValue: string): ParamDef {
  return {
    name: 'texte',
    kind: 'text',
    label: fr.staticStructures.params.texte,
    defaultValue,
  }
}

export const pileOperations: OperationDef<ArraySnapshot>[] = [
  {
    id: 'empiler',
    label: O.empiler.label,
    params: [valueParam(12)],
    complexity: O.empiler.complexity,
    complexityNote: O.empiler.note,
    inserts: false,
    run: runEmpiler,
  },
  {
    id: 'depiler',
    label: O.depiler.label,
    params: [],
    complexity: O.depiler.complexity,
    complexityNote: O.depiler.note,
    inserts: false,
    run: runDepiler,
  },
  {
    id: 'sommetPile',
    label: O.sommetPile.label,
    params: [],
    complexity: O.sommetPile.complexity,
    complexityNote: O.sommetPile.note,
    inserts: false,
    run: runSommetPile,
  },
  {
    id: 'pileVide',
    label: O.pileVide.label,
    params: [],
    complexity: O.pileVide.complexity,
    complexityNote: O.pileVide.note,
    inserts: false,
    run: runPileVide,
  },
  {
    id: 'pilePleine',
    label: O.pilePleine.label,
    params: [],
    complexity: O.pilePleine.complexity,
    complexityNote: O.pilePleine.note,
    inserts: false,
    run: runPilePleine,
  },
  {
    id: 'afficherPile',
    label: O.afficherPile.label,
    params: [],
    complexity: O.afficherPile.complexity,
    complexityNote: O.afficherPile.note,
    inserts: false,
    run: runAfficherPile,
  },
  {
    id: 'initPile',
    label: O.initPile.label,
    params: [],
    complexity: O.initPile.complexity,
    complexityNote: O.initPile.note,
    inserts: false,
    run: runInitPile,
  },
  {
    id: 'empilerCopie',
    label: O.empilerCopie.label,
    params: [numeroParam(12)],
    complexity: O.empilerCopie.complexity,
    complexityNote: O.empilerCopie.note,
    inserts: false,
    run: runEmpilerCopie,
  },
  {
    id: 'corrigerCopie',
    label: O.corrigerCopie.label,
    params: [],
    complexity: O.corrigerCopie.complexity,
    complexityNote: O.corrigerCopie.note,
    inserts: false,
    run: runCorrigerCopie,
  },
  {
    id: 'parenthesesEquilibrees',
    label: O.parenthesesEquilibrees.label,
    params: [texteParam('(()())')],
    complexity: O.parenthesesEquilibrees.complexity,
    complexityNote: O.parenthesesEquilibrees.note,
    inserts: false,
    run: runParenthesesEquilibrees,
  },
]

function queueOperations(
  enqueueLabel: { label: string; complexity: string; note: string },
  dequeueLabel: { label: string; complexity: string; note: string },
  displayLabel: { label: string; complexity: string; note: string },
  extra: OperationDef<ArraySnapshot>[] = [],
): OperationDef<ArraySnapshot>[] {
  return [
    {
      id: 'enfiler',
      label: enqueueLabel.label,
      params: [valueParam(65)],
      complexity: enqueueLabel.complexity,
      complexityNote: enqueueLabel.note,
      inserts: false,
      run: runEnfiler,
    },
    {
      id: 'defiler',
      label: dequeueLabel.label,
      params: [],
      complexity: dequeueLabel.complexity,
      complexityNote: dequeueLabel.note,
      inserts: false,
      run: runDefiler,
    },
    {
      id: 'fileVide',
      label: O.fileVide.label,
      params: [],
      complexity: O.fileVide.complexity,
      complexityNote: O.fileVide.note,
      inserts: false,
      run: runFileVide,
    },
    {
      id: 'filePleine',
      label: O.filePleine.label,
      params: [],
      complexity: O.filePleine.complexity,
      complexityNote: O.filePleine.note,
      inserts: false,
      run: runFilePleine,
    },
    {
      id: 'afficherFile',
      label: displayLabel.label,
      params: [],
      complexity: displayLabel.complexity,
      complexityNote: displayLabel.note,
      inserts: false,
      run: runAfficherFile,
    },
    {
      id: 'initFile',
      label: O.initFile.label,
      params: [],
      complexity: O.initFile.complexity,
      complexityNote: O.initFile.note,
      inserts: false,
      run: runInitFile,
    },
    {
      id: 'enregistrerArrivee',
      label: O.enregistrerArrivee.label,
      params: [numeroParam(65)],
      complexity: O.enregistrerArrivee.complexity,
      complexityNote: O.enregistrerArrivee.note,
      inserts: false,
      run: runEnregistrerArrivee,
    },
    {
      id: 'guichetSuivant',
      label: O.guichetSuivant.label,
      params: [],
      complexity: O.guichetSuivant.complexity,
      complexityNote: O.guichetSuivant.note,
      inserts: false,
      run: runGuichetSuivant,
    },
    ...extra,
  ]
}

export const fileOrdinaireOperations = queueOperations(
  O.enfilerOrdinaire,
  O.defilerOrdinaire,
  O.afficherFileOrdinaire,
)

export const fileDecalageOperations = queueOperations(
  O.enfilerDecalage,
  O.defilerDecalage,
  O.afficherFileDecalage,
)

export const fileCirculaireOperations = queueOperations(
  O.enfilerCirculaire,
  O.defilerCirculaire,
  O.afficherFileCirculaire,
  [
    {
      id: 'recupererMax',
      label: O.recupererMax.label,
      params: [],
      complexity: O.recupererMax.complexity,
      complexityNote: O.recupererMax.note,
      inserts: false,
      run: runRecupererMax,
    },
  ],
)
