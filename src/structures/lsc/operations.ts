import type { OperationDef, ParamDef } from '../../core/types'
import { fr } from '../../i18n/fr'
import type { LscSnapshot } from './memory'
import {
  runCircularAfficherListe,
  runCircularDetruireListe,
  runCircularInsererEnFin,
  runCircularInsererEnTete,
  runCircularRechercher,
  runCircularSupprimerEnTete,
  runCircularSupprimerValeur,
} from './ops/circularOps'
import {
  runAfficherListe,
  runDetruireListe,
  runInsererEnFin,
  runInsererEnTete,
  runRechercher,
  runSupprimerEnTete,
  runSupprimerValeur,
} from './ops/intOps'

const numberParam = (
  name: string,
  label: string,
  defaultValue: number,
  target = false,
): ParamDef => ({
  name,
  kind: 'number',
  label,
  defaultValue,
  ...(target ? { target: true } : {}),
})

const linearOps = fr.lsc.ops
const circularOps = fr.lsc.circularOps

export const linearOperations: OperationDef<LscSnapshot>[] = [
  {
    id: 'afficherListe',
    label: linearOps.afficherListe.label,
    params: [],
    complexity: linearOps.afficherListe.complexity,
    complexityNote: linearOps.afficherListe.note,
    inserts: false,
    run: runAfficherListe,
  },
  {
    id: 'insererEnTete',
    label: linearOps.insererEnTete.label,
    params: [numberParam('valeur', fr.params.valeur, 9)],
    complexity: linearOps.insererEnTete.complexity,
    complexityNote: linearOps.insererEnTete.note,
    inserts: true,
    run: runInsererEnTete,
  },
  {
    id: 'insererEnFin',
    label: linearOps.insererEnFin.label,
    params: [numberParam('valeur', fr.params.valeur, 7)],
    complexity: linearOps.insererEnFin.complexity,
    complexityNote: linearOps.insererEnFin.note,
    inserts: true,
    run: runInsererEnFin,
  },
  {
    id: 'supprimerEnTete',
    label: linearOps.supprimerEnTete.label,
    params: [],
    complexity: linearOps.supprimerEnTete.complexity,
    complexityNote: linearOps.supprimerEnTete.note,
    inserts: false,
    run: runSupprimerEnTete,
  },
  {
    id: 'supprimerValeur',
    label: linearOps.supprimerValeur.label,
    params: [numberParam('valeur', fr.params.valeur, 2, true)],
    complexity: linearOps.supprimerValeur.complexity,
    complexityNote: linearOps.supprimerValeur.note,
    inserts: false,
    run: runSupprimerValeur,
  },
  {
    id: 'rechercher',
    label: linearOps.rechercher.label,
    params: [numberParam('valeur', fr.params.valeur, 5, true)],
    complexity: linearOps.rechercher.complexity,
    complexityNote: linearOps.rechercher.note,
    inserts: false,
    run: runRechercher,
  },
  {
    id: 'detruireListe',
    label: linearOps.detruireListe.label,
    params: [],
    complexity: linearOps.detruireListe.complexity,
    complexityNote: linearOps.detruireListe.note,
    inserts: false,
    run: runDetruireListe,
  },
]

export const circularOperations: OperationDef<LscSnapshot>[] = [
  {
    id: 'afficherListe',
    label: circularOps.afficherListe.label,
    params: [],
    complexity: circularOps.afficherListe.complexity,
    complexityNote: circularOps.afficherListe.note,
    inserts: false,
    run: runCircularAfficherListe,
  },
  {
    id: 'insererEnTete',
    label: circularOps.insererEnTete.label,
    params: [numberParam('valeur', fr.params.valeur, 9)],
    complexity: circularOps.insererEnTete.complexity,
    complexityNote: circularOps.insererEnTete.note,
    inserts: true,
    run: runCircularInsererEnTete,
  },
  {
    id: 'insererEnFin',
    label: circularOps.insererEnFin.label,
    params: [numberParam('valeur', fr.params.valeur, 7)],
    complexity: circularOps.insererEnFin.complexity,
    complexityNote: circularOps.insererEnFin.note,
    inserts: true,
    run: runCircularInsererEnFin,
  },
  {
    id: 'supprimerEnTete',
    label: circularOps.supprimerEnTete.label,
    params: [],
    complexity: circularOps.supprimerEnTete.complexity,
    complexityNote: circularOps.supprimerEnTete.note,
    inserts: false,
    run: runCircularSupprimerEnTete,
  },
  {
    id: 'supprimerValeur',
    label: circularOps.supprimerValeur.label,
    params: [numberParam('valeur', fr.params.valeur, 2, true)],
    complexity: circularOps.supprimerValeur.complexity,
    complexityNote: circularOps.supprimerValeur.note,
    inserts: false,
    run: runCircularSupprimerValeur,
  },
  {
    id: 'rechercher',
    label: circularOps.rechercher.label,
    params: [numberParam('valeur', fr.params.valeur, 5, true)],
    complexity: circularOps.rechercher.complexity,
    complexityNote: circularOps.rechercher.note,
    inserts: false,
    run: runCircularRechercher,
  },
  {
    id: 'detruireListe',
    label: circularOps.detruireListe.label,
    params: [],
    complexity: circularOps.detruireListe.complexity,
    complexityNote: circularOps.detruireListe.note,
    inserts: false,
    run: runCircularDetruireListe,
  },
]
