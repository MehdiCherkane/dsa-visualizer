import type { CodeSource } from '../../../core/types'
import { collectCode, collectLabels, makeFunction } from './shared'
import type { FunctionCode } from './shared'

export const intTypes: CodeSource = {
  fn: 'types',
  labels: {},
  lines: [
    'typedef struct noeud {',
    '    int valeur;',
    '    struct noeud *suivant;',
    '} Noeud;',
    '',
    'Noeud *debut = NULL;',
  ],
}

const afficherListe = makeFunction(
  'afficherListe',
  `
void afficherListe(void) {
    Noeud *courant = debut;
    while (courant != NULL) {
        printf("%d ", courant->valeur);
        courant = courant->suivant;
    }
}
`,
  {
    entry: { line: 0, contains: 'void afficherListe(void) {' },
    declCourant: { line: 1, contains: 'Noeud *courant = debut;' },
    whileCond: { line: 2, contains: 'while (courant != NULL)' },
    printf: { line: 3, contains: 'printf("%d ", courant->valeur);' },
    avancer: { line: 4, contains: 'courant = courant->suivant;' },
    endWhile: { line: 5, contains: '}' },
    end: { line: 6, contains: '}' },
  },
)

const insererEnTete = makeFunction(
  'insererEnTete',
  `
void insererEnTete(int valeur) {
    Noeud *nouveau = malloc(sizeof(Noeud));
    nouveau->valeur = valeur;
    nouveau->suivant = debut;
    debut = nouveau;
}
`,
  {
    entry: { line: 0, contains: 'void insererEnTete(int valeur) {' },
    malloc: { line: 1, contains: 'malloc(sizeof(Noeud))' },
    setValeur: { line: 2, contains: 'nouveau->valeur = valeur;' },
    setSuivant: { line: 3, contains: 'nouveau->suivant = debut;' },
    setDebut: { line: 4, contains: 'debut = nouveau;' },
    end: { line: 5, contains: '}' },
  },
)

const insererEnFin = makeFunction(
  'insererEnFin',
  `
void insererEnFin(int valeur) {
    Noeud *nouveau = malloc(sizeof(Noeud));
    nouveau->valeur = valeur;
    nouveau->suivant = NULL;
    if (debut == NULL) {
        debut = nouveau;
        return;
    }
    Noeud *courant = debut;
    while (courant->suivant != NULL) {
        courant = courant->suivant;
    }
    courant->suivant = nouveau;
}
`,
  {
    entry: { line: 0, contains: 'void insererEnFin(int valeur) {' },
    malloc: { line: 1, contains: 'malloc(sizeof(Noeud))' },
    setValeur: { line: 2, contains: 'nouveau->valeur = valeur;' },
    setSuivantNull: { line: 3, contains: 'nouveau->suivant = NULL;' },
    ifDebutNull: { line: 4, contains: 'if (debut == NULL)' },
    setDebut: { line: 5, contains: 'debut = nouveau;' },
    returnEmpty: { line: 6, contains: 'return;' },
    endIf: { line: 7, contains: '}' },
    declCourant: { line: 8, contains: 'Noeud *courant = debut;' },
    whileCond: { line: 9, contains: 'while (courant->suivant != NULL)' },
    avancer: { line: 10, contains: 'courant = courant->suivant;' },
    endWhile: { line: 11, contains: '}' },
    linkLast: { line: 12, contains: 'courant->suivant = nouveau;' },
    end: { line: 13, contains: '}' },
  },
)

const supprimerEnTete = makeFunction(
  'supprimerEnTete',
  `
void supprimerEnTete(void) {
    if (debut == NULL) {
        return;
    }
    Noeud *ancienDebut = debut;
    debut = debut->suivant;
    free(ancienDebut);
}
`,
  {
    entry: { line: 0, contains: 'void supprimerEnTete(void) {' },
    ifNull: { line: 1, contains: 'if (debut == NULL)' },
    returnEmpty: { line: 2, contains: 'return;' },
    endIf: { line: 3, contains: '}' },
    declAncien: { line: 4, contains: 'Noeud *ancienDebut = debut;' },
    setDebut: { line: 5, contains: 'debut = debut->suivant;' },
    free: { line: 6, contains: 'free(ancienDebut);' },
    end: { line: 7, contains: '}' },
  },
)

const supprimerValeur = makeFunction(
  'supprimerValeur',
  `
void supprimerValeur(int valeur) {
    if (debut == NULL) {
        return;
    }
    if (debut->valeur == valeur) {
        supprimerEnTete();
        return;
    }
    Noeud *precedent = debut;
    Noeud *courant = debut->suivant;
    while (courant != NULL && courant->valeur != valeur) {
        precedent = courant;
        courant = courant->suivant;
    }
    if (courant != NULL) {
        precedent->suivant = courant->suivant;
        free(courant);
    }
}
`,
  {
    entry: { line: 0, contains: 'void supprimerValeur(int valeur) {' },
    ifEmpty: { line: 1, contains: 'if (debut == NULL)' },
    returnEmpty: { line: 2, contains: 'return;' },
    endIfEmpty: { line: 3, contains: '}' },
    ifHead: { line: 4, contains: 'if (debut->valeur == valeur)' },
    callHead: { line: 5, contains: 'supprimerEnTete();' },
    returnAfterCall: { line: 6, contains: 'return;' },
    endIfHead: { line: 7, contains: '}' },
    declPrecedent: { line: 8, contains: 'Noeud *precedent = debut;' },
    declCourant: { line: 9, contains: 'Noeud *courant = debut->suivant;' },
    whileCond: { line: 10, contains: 'while (courant != NULL && courant->valeur != valeur)' },
    setPrecedent: { line: 11, contains: 'precedent = courant;' },
    avancer: { line: 12, contains: 'courant = courant->suivant;' },
    endWhile: { line: 13, contains: '}' },
    ifFound: { line: 14, contains: 'if (courant != NULL)' },
    unlink: { line: 15, contains: 'precedent->suivant = courant->suivant;' },
    free: { line: 16, contains: 'free(courant);' },
    endIfFound: { line: 17, contains: '}' },
    end: { line: 18, contains: '}' },
  },
)

const rechercher = makeFunction(
  'rechercher',
  `
int rechercher(int valeur) {
    Noeud *courant = debut;
    while (courant != NULL) {
        if (courant->valeur == valeur) {
            return 1;
        }
        courant = courant->suivant;
    }
    return 0;
}
`,
  {
    entry: { line: 0, contains: 'int rechercher(int valeur) {' },
    declCourant: { line: 1, contains: 'Noeud *courant = debut;' },
    whileCond: { line: 2, contains: 'while (courant != NULL)' },
    ifEqual: { line: 3, contains: 'if (courant->valeur == valeur)' },
    returnOne: { line: 4, contains: 'return 1;' },
    endIf: { line: 5, contains: '}' },
    avancer: { line: 6, contains: 'courant = courant->suivant;' },
    endWhile: { line: 7, contains: '}' },
    returnZero: { line: 8, contains: 'return 0;' },
    end: { line: 9, contains: '}' },
  },
)

const detruireListe = makeFunction(
  'detruireListe',
  `
void detruireListe(void) {
    while (debut != NULL) {
        supprimerEnTete();
    }
}
`,
  {
    entry: { line: 0, contains: 'void detruireListe(void) {' },
    whileCond: { line: 1, contains: 'while (debut != NULL)' },
    callHead: { line: 2, contains: 'supprimerEnTete();' },
    endWhile: { line: 3, contains: '}' },
    end: { line: 4, contains: '}' },
  },
)

export const intFunctions: FunctionCode[] = [
  afficherListe,
  insererEnTete,
  insererEnFin,
  supprimerEnTete,
  supprimerValeur,
  rechercher,
  detruireListe,
]

export const intCode = collectCode(intFunctions)
export const intLabels = collectLabels(intFunctions)
