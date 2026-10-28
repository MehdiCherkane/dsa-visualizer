import type { CodeSource } from '../../../core/types'
import { abrCode } from './int'

const source = (fn: string, lines: string[]): CodeSource => ({ fn, lines, labels: {} })

export const studentAbrCode: Record<string, CodeSource> = {
  ...abrCode,
  estInscrit: source('estInscrit', [
    'int estInscrit(int numero) {',
    '    return rechercherABR(racine, numero);',
    '}',
  ]),
  inscrireEtudiant: source('inscrireEtudiant', [
    'void inscrireEtudiant(int numero) {',
    '    racine = insererABR(racine, numero);',
    '}',
  ]),
  radierEtudiant: source('radierEtudiant', [
    'void radierEtudiant(int numero) {',
    '    racine = supprimerABR(racine, numero);',
    '}',
  ]),
  construireRegistre: source('construireRegistre', [
    'void construireRegistre(void) {',
    '    inscrireEtudiant(205);',
    '    inscrireEtudiant(150);',
    '    inscrireEtudiant(260);',
    '    inscrireEtudiant(120);',
    '    inscrireEtudiant(180);',
    '    inscrireEtudiant(240);',
    '    inscrireEtudiant(280);',
    '}',
  ]),
}
