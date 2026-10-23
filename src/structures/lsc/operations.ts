import type { OperationDef, ParamDef } from '../../core/types'
import { fr } from '../../i18n/fr'
import type { LscSnapshot } from './memory'
import {
  runAfficherListe,
  runDetruireListe,
  runInsererEnFin,
  runInsererEnTete,
  runRechercher,
  runSupprimerEnTete,
  runSupprimerValeur,
} from './ops/intOps'
import {
  runInscrireEtudiant,
  runRadierEtudiant,
  runStudentAfficherListe,
  runStudentDetruireListe,
} from './ops/studentOps'

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

const textParam = (name: string, label: string, defaultValue: string): ParamDef => ({
  name,
  kind: 'text',
  label,
  defaultValue,
})

const intOps = fr.lsc.ops
const studentOps = fr.lsc.ops

export const intOperations: OperationDef<LscSnapshot>[] = [
  {
    id: 'afficherListe',
    label: intOps.afficherListe.label,
    params: [],
    complexity: intOps.afficherListe.complexity,
    complexityNote: intOps.afficherListe.note,
    inserts: false,
    run: runAfficherListe,
  },
  {
    id: 'insererEnTete',
    label: intOps.insererEnTete.label,
    params: [numberParam('valeur', fr.params.valeur, 9)],
    complexity: intOps.insererEnTete.complexity,
    complexityNote: intOps.insererEnTete.note,
    inserts: true,
    run: runInsererEnTete,
  },
  {
    id: 'insererEnFin',
    label: intOps.insererEnFin.label,
    params: [numberParam('valeur', fr.params.valeur, 7)],
    complexity: intOps.insererEnFin.complexity,
    complexityNote: intOps.insererEnFin.note,
    inserts: true,
    run: runInsererEnFin,
  },
  {
    id: 'supprimerEnTete',
    label: intOps.supprimerEnTete.label,
    params: [],
    complexity: intOps.supprimerEnTete.complexity,
    complexityNote: intOps.supprimerEnTete.note,
    inserts: false,
    run: runSupprimerEnTete,
  },
  {
    id: 'supprimerValeur',
    label: intOps.supprimerValeur.label,
    params: [numberParam('valeur', fr.params.valeur, 2, true)],
    complexity: intOps.supprimerValeur.complexity,
    complexityNote: intOps.supprimerValeur.note,
    inserts: false,
    run: runSupprimerValeur,
  },
  {
    id: 'rechercher',
    label: intOps.rechercher.label,
    params: [numberParam('valeur', fr.params.valeur, 5, true)],
    complexity: intOps.rechercher.complexity,
    complexityNote: intOps.rechercher.note,
    inserts: false,
    run: runRechercher,
  },
  {
    id: 'detruireListe',
    label: intOps.detruireListe.label,
    params: [],
    complexity: intOps.detruireListe.complexity,
    complexityNote: intOps.detruireListe.note,
    inserts: false,
    run: runDetruireListe,
  },
]

export const studentOperations: OperationDef<LscSnapshot>[] = [
  {
    id: 'afficherListe',
    label: studentOps.afficherListe.label,
    params: [],
    complexity: studentOps.afficherListe.complexity,
    complexityNote: studentOps.afficherListe.note,
    inserts: false,
    run: runStudentAfficherListe,
  },
  {
    id: 'inscrireEtudiant',
    label: studentOps.inscrireEtudiant.label,
    params: [
      numberParam('numero', fr.params.numero, 101),
      textParam('nom', fr.params.nom, 'AAA'),
      textParam('prenom', fr.params.prenom, 'aaa'),
    ],
    complexity: studentOps.inscrireEtudiant.complexity,
    complexityNote: studentOps.inscrireEtudiant.note,
    inserts: true,
    run: runInscrireEtudiant,
  },
  {
    id: 'radierEtudiant',
    label: studentOps.radierEtudiant.label,
    params: [numberParam('numero', fr.params.numero, 102, true)],
    complexity: studentOps.radierEtudiant.complexity,
    complexityNote: studentOps.radierEtudiant.note,
    inserts: false,
    run: runRadierEtudiant,
  },
  {
    id: 'detruireListe',
    label: studentOps.detruireListe.label,
    params: [],
    complexity: studentOps.detruireListe.complexity,
    complexityNote: studentOps.detruireListe.note,
    inserts: false,
    run: runStudentDetruireListe,
  },
]
