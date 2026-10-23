import type { OperationDef, ParamDef } from '../../core/types'
import { fr } from '../../i18n/fr'
import type { FileSnapshot, PileSnapshot } from './memory'
import {
  runCorrigerCopie,
  runDepiler,
  runDetruirePile,
  runEmpiler,
  runEmpilerCopie,
  runPileVide,
} from './ops/pileOps'
import {
  runDefiler,
  runDetruireFile,
  runEnfiler,
  runEnregistrerArrivee,
  runFileVide,
  runServirSuivant,
} from './ops/fileOps'

const numberParam = (name: string, label: string, defaultValue: number): ParamDef => ({
  name,
  kind: 'number',
  label,
  defaultValue,
})

const pileLabels = fr.piles.ops
const fileLabels = fr.piles.ops

export const pileOperations: OperationDef<PileSnapshot>[] = [
  {
    id: 'empiler',
    label: pileLabels.empiler.label,
    params: [numberParam('valeur', fr.params.valeur, 12)],
    complexity: pileLabels.empiler.complexity,
    complexityNote: pileLabels.empiler.note,
    inserts: true,
    run: runEmpiler,
  },
  {
    id: 'depiler',
    label: pileLabels.depiler.label,
    params: [],
    complexity: pileLabels.depiler.complexity,
    complexityNote: pileLabels.depiler.note,
    inserts: false,
    run: runDepiler,
  },
  {
    id: 'pileVide',
    label: pileLabels.pileVide.label,
    params: [],
    complexity: pileLabels.pileVide.complexity,
    complexityNote: pileLabels.pileVide.note,
    inserts: false,
    run: runPileVide,
  },
  {
    id: 'detruirePile',
    label: pileLabels.detruirePile.label,
    params: [],
    complexity: pileLabels.detruirePile.complexity,
    complexityNote: pileLabels.detruirePile.note,
    inserts: false,
    run: runDetruirePile,
  },
  {
    id: 'empilerCopie',
    label: pileLabels.empilerCopie.label,
    params: [numberParam('numero', fr.params.numero, 101)],
    complexity: pileLabels.empilerCopie.complexity,
    complexityNote: pileLabels.empilerCopie.note,
    inserts: true,
    run: runEmpilerCopie,
  },
  {
    id: 'corrigerCopie',
    label: pileLabels.corrigerCopie.label,
    params: [],
    complexity: pileLabels.corrigerCopie.complexity,
    complexityNote: pileLabels.corrigerCopie.note,
    inserts: false,
    run: runCorrigerCopie,
  },
]

export const fileOperations: OperationDef<FileSnapshot>[] = [
  {
    id: 'enfiler',
    label: fileLabels.enfiler.label,
    params: [numberParam('valeur', fr.params.valeur, 201)],
    complexity: fileLabels.enfiler.complexity,
    complexityNote: fileLabels.enfiler.note,
    inserts: true,
    run: runEnfiler,
  },
  {
    id: 'defiler',
    label: fileLabels.defiler.label,
    params: [],
    complexity: fileLabels.defiler.complexity,
    complexityNote: fileLabels.defiler.note,
    inserts: false,
    run: runDefiler,
  },
  {
    id: 'fileVide',
    label: fileLabels.fileVide.label,
    params: [],
    complexity: fileLabels.fileVide.complexity,
    complexityNote: fileLabels.fileVide.note,
    inserts: false,
    run: runFileVide,
  },
  {
    id: 'detruireFile',
    label: fileLabels.detruireFile.label,
    params: [],
    complexity: fileLabels.detruireFile.complexity,
    complexityNote: fileLabels.detruireFile.note,
    inserts: false,
    run: runDetruireFile,
  },
  {
    id: 'enregistrerArrivee',
    label: fileLabels.enregistrerArrivee.label,
    params: [numberParam('numero', fr.params.numero, 201)],
    complexity: fileLabels.enregistrerArrivee.complexity,
    complexityNote: fileLabels.enregistrerArrivee.note,
    inserts: true,
    run: runEnregistrerArrivee,
  },
  {
    id: 'servirSuivant',
    label: fileLabels.servirSuivant.label,
    params: [],
    complexity: fileLabels.servirSuivant.complexity,
    complexityNote: fileLabels.servirSuivant.note,
    inserts: false,
    run: runServirSuivant,
  },
]
