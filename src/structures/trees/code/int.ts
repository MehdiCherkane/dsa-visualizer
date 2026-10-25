import type { CodeSource } from '../../../core/types'

const source = (fn: string, lines: string[]): CodeSource => ({ fn, lines, labels: {} })

export const intTypes = source('types', [
  'typedef struct noeud {',
  '    int valeur;',
  '    struct noeud *gauche;',
  '    struct noeud *droit;',
  '} Noeud;',
  '',
  'Noeud *racine = NULL;',
])

export const intCode: Record<string, CodeSource> = {
  construireArbre: source('construireArbre', [
    'void construireArbre(void) {',
    '    racine = creerNoeud(50);',
    '    racine->gauche = creerNoeud(30);',
    '    racine->droit = creerNoeud(70);',
    '    racine->gauche->gauche = creerNoeud(20);',
    '    racine->gauche->droit = creerNoeud(40);',
    '    racine->droit->droit = creerNoeud(80);',
    '}',
  ]),
  creerNoeud: source('creerNoeud', [
    'Noeud *creerNoeud(int valeur) {',
    '    Noeud *nouveau = malloc(sizeof(Noeud));',
    '    nouveau->valeur = valeur;',
    '    nouveau->gauche = NULL;',
    '    nouveau->droit = NULL;',
    '    return nouveau;',
    '}',
  ]),
  parcoursPrefixe: source('parcoursPrefixe', [
    'void parcoursPrefixe(Noeud *n) {',
    '    if (n == NULL) {',
    '        return;',
    '    }',
    '    printf("%d ", n->valeur);',
    '    parcoursPrefixe(n->gauche);',
    '    parcoursPrefixe(n->droit);',
    '}',
  ]),
  parcoursInfixe: source('parcoursInfixe', [
    'void parcoursInfixe(Noeud *n) {',
    '    if (n == NULL) {',
    '        return;',
    '    }',
    '    parcoursInfixe(n->gauche);',
    '    printf("%d ", n->valeur);',
    '    parcoursInfixe(n->droit);',
    '}',
  ]),
  parcoursPostfixe: source('parcoursPostfixe', [
    'void parcoursPostfixe(Noeud *n) {',
    '    if (n == NULL) {',
    '        return;',
    '    }',
    '    parcoursPostfixe(n->gauche);',
    '    parcoursPostfixe(n->droit);',
    '    printf("%d ", n->valeur);',
    '}',
  ]),
  detruireArbre: source('detruireArbre', [
    'void detruireArbre(Noeud *n) {',
    '    if (n == NULL) {',
    '        return;',
    '    }',
    '    detruireArbre(n->gauche);',
    '    detruireArbre(n->droit);',
    '    free(n);',
    '}',
  ]),
}
