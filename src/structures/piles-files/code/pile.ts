import type { CodeSource } from '../../../core/types'
import { collectCode, collectLabels, makeFunction } from '../../lsc/code/shared'
import type { FunctionCode } from '../../lsc/code/shared'

export const pileTypes: CodeSource = {
  fn: 'types',
  labels: {},
  lines: [
    'typedef struct noeud {',
    '    int valeur;',
    '    struct noeud *precedent;',
    '} Noeud;',
    '',
    'Noeud *sommet = NULL;',
  ],
}

const empiler = makeFunction(
  'empiler',
  `
void empiler(int valeur) {
    Noeud *nouveau = malloc(sizeof(Noeud));
    nouveau->valeur = valeur;
    nouveau->precedent = sommet;
    sommet = nouveau;
}
`,
  {
    entry: { line: 0, contains: 'void empiler(int valeur) {' },
    malloc: { line: 1, contains: 'Noeud *nouveau = malloc(sizeof(Noeud));' },
    setValeur: { line: 2, contains: 'nouveau->valeur = valeur;' },
    setPrecedent: { line: 3, contains: 'nouveau->precedent = sommet;' },
    setSommet: { line: 4, contains: 'sommet = nouveau;' },
    end: { line: 5, contains: '}' },
  },
)

const depiler = makeFunction(
  'depiler',
  `
int depiler(void) {
    if (sommet == NULL) {
        printf("Pile vide\\n");
        return -1;
    }
    Noeud *ancienSommet = sommet;
    int valeur = ancienSommet->valeur;
    sommet = sommet->precedent;
    free(ancienSommet);
    return valeur;
}
`,
  {
    entry: { line: 0, contains: 'int depiler(void) {' },
    ifEmpty: { line: 1, contains: 'if (sommet == NULL)' },
    printfEmpty: { line: 2, contains: 'printf("Pile vide\\n");' },
    returnError: { line: 3, contains: 'return -1;' },
    endIfEmpty: { line: 4, contains: '}' },
    declAncien: { line: 5, contains: 'Noeud *ancienSommet = sommet;' },
    declValeur: { line: 6, contains: 'int valeur = ancienSommet->valeur;' },
    moveTop: { line: 7, contains: 'sommet = sommet->precedent;' },
    free: { line: 8, contains: 'free(ancienSommet);' },
    returnValue: { line: 9, contains: 'return valeur;' },
    end: { line: 10, contains: '}' },
  },
)

const pileVide = makeFunction(
  'pileVide',
  `
int pileVide(void) {
    return sommet == NULL;
}
`,
  {
    entry: { line: 0, contains: 'int pileVide(void) {' },
    return: { line: 1, contains: 'return sommet == NULL;' },
    end: { line: 2, contains: '}' },
  },
)

const detruirePile = makeFunction(
  'detruirePile',
  `
void detruirePile(void) {
    while (sommet != NULL) {
        depiler();
    }
}
`,
  {
    entry: { line: 0, contains: 'void detruirePile(void) {' },
    whileCond: { line: 1, contains: 'while (sommet != NULL)' },
    callDepiler: { line: 2, contains: 'depiler();' },
    endWhile: { line: 3, contains: '}' },
    end: { line: 4, contains: '}' },
  },
)

const empilerCopie = makeFunction(
  'empilerCopie',
  `
void empilerCopie(int numero) {
    empiler(numero);
}
`,
  {
    entry: { line: 0, contains: 'void empilerCopie(int numero) {' },
    callEmpiler: { line: 1, contains: 'empiler(numero);' },
    end: { line: 2, contains: '}' },
  },
)

const corrigerCopie = makeFunction(
  'corrigerCopie',
  `
void corrigerCopie(void) {
    if (pileVide()) {
        return;
    }
    int numero = depiler();
    printf("Correction de la copie %d\\n", numero);
}
`,
  {
    entry: { line: 0, contains: 'void corrigerCopie(void) {' },
    ifEmpty: { line: 1, contains: 'if (pileVide())' },
    returnEmpty: { line: 2, contains: 'return;' },
    endIf: { line: 3, contains: '}' },
    declNumero: { line: 4, contains: 'int numero = depiler();' },
    printf: { line: 5, contains: 'printf("Correction de la copie %d\\n", numero);' },
    end: { line: 6, contains: '}' },
  },
)

export const pileFunctions: FunctionCode[] = [
  empiler,
  depiler,
  pileVide,
  detruirePile,
  empilerCopie,
  corrigerCopie,
]

export const pileCode = collectCode(pileFunctions)
export const pileLabels = collectLabels(pileFunctions)
