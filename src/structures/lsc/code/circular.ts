import type { CodeSource } from '../../../core/types'
import { collectCode, collectLabels, makeFunction } from './shared'
import type { FunctionCode } from './shared'

export const circularTypes: CodeSource = {
  fn: 'types',
  labels: {},
  lines: [
    'typedef struct noeud {',
    '    int valeur;',
    '    struct noeud *suivant;',
    '} Noeud;',
    '',
    'Noeud *debut = NULL; /* circulaire : le dernier pointe vers debut */',
  ],
}

const afficherListe = makeFunction(
  'afficherListe',
  `
void afficherListe(void) {
    if (debut == NULL) {
        printf("\\n");
        return;
    }
    Noeud *courant = debut;
    do {
        printf("%d ", courant->valeur);
        courant = courant->suivant;
    } while (courant != debut);
}
`,
  {
    entry: { line: 0, contains: 'void afficherListe(void) {' },
    ifNull: { line: 1, contains: 'if (debut == NULL) {' },
    printfNewline: { line: 2, contains: 'printf("\\n");' },
    returnEmpty: { line: 3, contains: 'return;' },
    endIf: { line: 4, contains: '}' },
    declCourant: { line: 5, contains: 'Noeud *courant = debut;' },
    do: { line: 6, contains: 'do {' },
    printf: { line: 7, contains: 'printf("%d ", courant->valeur);' },
    avancer: { line: 8, contains: 'courant = courant->suivant;' },
    whileCond: { line: 9, contains: 'while (courant != debut);' },
    end: { line: 10, contains: '}' },
  },
)

const insererEnTete = makeFunction(
  'insererEnTete',
  `
void insererEnTete(int valeur) {
    Noeud *nouveau = malloc(sizeof(Noeud));
    nouveau->valeur = valeur;
    if (debut == NULL) {
        nouveau->suivant = nouveau;
        debut = nouveau;
        return;
    }
    Noeud *dernier = debut;
    while (dernier->suivant != debut) {
        dernier = dernier->suivant;
    }
    nouveau->suivant = debut;
    dernier->suivant = nouveau;
    debut = nouveau;
}
`,
  {
    entry: { line: 0, contains: 'void insererEnTete(int valeur) {' },
    malloc: { line: 1, contains: 'malloc(sizeof(Noeud))' },
    setValeur: { line: 2, contains: 'nouveau->valeur = valeur;' },
    ifDebutNull: { line: 3, contains: 'if (debut == NULL) {' },
    setSelfSuivant: { line: 4, contains: 'nouveau->suivant = nouveau;' },
    setDebutEmpty: { line: 5, contains: 'debut = nouveau;' },
    returnEmpty: { line: 6, contains: 'return;' },
    endIf: { line: 7, contains: '}' },
    declDernier: { line: 8, contains: 'Noeud *dernier = debut;' },
    whileCond: { line: 9, contains: 'while (dernier->suivant != debut) {' },
    avancer: { line: 10, contains: 'dernier = dernier->suivant;' },
    endWhile: { line: 11, contains: '}' },
    setSuivant: { line: 12, contains: 'nouveau->suivant = debut;' },
    linkLast: { line: 13, contains: 'dernier->suivant = nouveau;' },
    setDebut: { line: 14, contains: 'debut = nouveau;' },
    end: { line: 15, contains: '}' },
  },
)

const insererEnFin = makeFunction(
  'insererEnFin',
  `
void insererEnFin(int valeur) {
    Noeud *nouveau = malloc(sizeof(Noeud));
    nouveau->valeur = valeur;
    if (debut == NULL) {
        nouveau->suivant = nouveau;
        debut = nouveau;
        return;
    }
    Noeud *courant = debut;
    while (courant->suivant != debut) {
        courant = courant->suivant;
    }
    courant->suivant = nouveau;
    nouveau->suivant = debut;
}
`,
  {
    entry: { line: 0, contains: 'void insererEnFin(int valeur) {' },
    malloc: { line: 1, contains: 'malloc(sizeof(Noeud))' },
    setValeur: { line: 2, contains: 'nouveau->valeur = valeur;' },
    ifDebutNull: { line: 3, contains: 'if (debut == NULL) {' },
    setSelfSuivant: { line: 4, contains: 'nouveau->suivant = nouveau;' },
    setDebut: { line: 5, contains: 'debut = nouveau;' },
    returnEmpty: { line: 6, contains: 'return;' },
    endIf: { line: 7, contains: '}' },
    declCourant: { line: 8, contains: 'Noeud *courant = debut;' },
    whileCond: { line: 9, contains: 'while (courant->suivant != debut) {' },
    avancer: { line: 10, contains: 'courant = courant->suivant;' },
    endWhile: { line: 11, contains: '}' },
    linkLast: { line: 12, contains: 'courant->suivant = nouveau;' },
    linkNew: { line: 13, contains: 'nouveau->suivant = debut;' },
    end: { line: 14, contains: '}' },
  },
)

const supprimerEnTete = makeFunction(
  'supprimerEnTete',
  `
void supprimerEnTete(void) {
    if (debut == NULL) {
        return;
    }
    if (debut->suivant == debut) {
        Noeud *ancien = debut;
        debut = NULL;
        free(ancien);
        return;
    }
    Noeud *ancienDebut = debut;
    Noeud *dernier = debut;
    while (dernier->suivant != debut) {
        dernier = dernier->suivant;
    }
    debut = debut->suivant;
    dernier->suivant = debut;
    free(ancienDebut);
}
`,
  {
    entry: { line: 0, contains: 'void supprimerEnTete(void) {' },
    ifNull: { line: 1, contains: 'if (debut == NULL) {' },
    returnEmpty: { line: 2, contains: 'return;' },
    endIf: { line: 3, contains: '}' },
    ifSingle: { line: 4, contains: 'if (debut->suivant == debut) {' },
    declSingle: { line: 5, contains: 'Noeud *ancien = debut;' },
    setDebutNull: { line: 6, contains: 'debut = NULL;' },
    freeSingle: { line: 7, contains: 'free(ancien);' },
    returnSingle: { line: 8, contains: 'return;' },
    endIfSingle: { line: 9, contains: '}' },
    declAncien: { line: 10, contains: 'Noeud *ancienDebut = debut;' },
    declDernier: { line: 11, contains: 'Noeud *dernier = debut;' },
    whileCond: { line: 12, contains: 'while (dernier->suivant != debut) {' },
    avancer: { line: 13, contains: 'dernier = dernier->suivant;' },
    endWhile: { line: 14, contains: '}' },
    setDebut: { line: 15, contains: 'debut = debut->suivant;' },
    linkLast: { line: 16, contains: 'dernier->suivant = debut;' },
    free: { line: 17, contains: 'free(ancienDebut);' },
    end: { line: 18, contains: '}' },
  },
)

const supprimerValeur = makeFunction(
  'supprimerValeur',
  `
void supprimerValeur(int valeur) {
    if (debut == NULL) {
        return;
    }
    Noeud *precedent = NULL;
    Noeud *courant = debut;
    do {
        if (courant->valeur == valeur) {
            if (courant == debut) {
                supprimerEnTete();
            } else {
                precedent->suivant = courant->suivant;
                free(courant);
            }
            return;
        }
        precedent = courant;
        courant = courant->suivant;
    } while (courant != debut);
}
`,
  {
    entry: { line: 0, contains: 'void supprimerValeur(int valeur) {' },
    ifEmpty: { line: 1, contains: 'if (debut == NULL) {' },
    returnEmpty: { line: 2, contains: 'return;' },
    endIfEmpty: { line: 3, contains: '}' },
    declPrecedent: { line: 4, contains: 'Noeud *precedent = NULL;' },
    declCourant: { line: 5, contains: 'Noeud *courant = debut;' },
    do: { line: 6, contains: 'do {' },
    ifValue: { line: 7, contains: 'if (courant->valeur == valeur) {' },
    ifHead: { line: 8, contains: 'if (courant == debut) {' },
    callHead: { line: 9, contains: 'supprimerEnTete();' },
    elseBranch: { line: 10, contains: '} else {' },
    unlink: { line: 11, contains: 'precedent->suivant = courant->suivant;' },
    free: { line: 12, contains: 'free(courant);' },
    endIfHead: { line: 13, contains: '}' },
    returnFound: { line: 14, contains: 'return;' },
    endIfValue: { line: 15, contains: '}' },
    setPrecedent: { line: 16, contains: 'precedent = courant;' },
    avancer: { line: 17, contains: 'courant = courant->suivant;' },
    whileCond: { line: 18, contains: 'while (courant != debut);' },
    end: { line: 19, contains: '}' },
  },
)

const rechercher = makeFunction(
  'rechercher',
  `
int rechercher(int valeur) {
    if (debut == NULL) {
        return 0;
    }
    Noeud *courant = debut;
    do {
        if (courant->valeur == valeur) {
            return 1;
        }
        courant = courant->suivant;
    } while (courant != debut);
    return 0;
}
`,
  {
    entry: { line: 0, contains: 'int rechercher(int valeur) {' },
    ifEmpty: { line: 1, contains: 'if (debut == NULL) {' },
    returnZeroEmpty: { line: 2, contains: 'return 0;' },
    endIf: { line: 3, contains: '}' },
    declCourant: { line: 4, contains: 'Noeud *courant = debut;' },
    do: { line: 5, contains: 'do {' },
    ifEqual: { line: 6, contains: 'if (courant->valeur == valeur) {' },
    returnOne: { line: 7, contains: 'return 1;' },
    endIfEqual: { line: 8, contains: '}' },
    avancer: { line: 9, contains: 'courant = courant->suivant;' },
    whileCond: { line: 10, contains: 'while (courant != debut);' },
    returnZero: { line: 11, contains: 'return 0;' },
    end: { line: 12, contains: '}' },
  },
)

const detruireListe = makeFunction(
  'detruireListe',
  `
void detruireListe(void) {
    if (debut == NULL) {
        return;
    }
    Noeud *dernier = debut;
    while (dernier->suivant != debut) {
        dernier = dernier->suivant;
    }
    dernier->suivant = NULL;
    while (debut != NULL) {
        Noeud *ancienDebut = debut;
        debut = debut->suivant;
        free(ancienDebut);
    }
}
`,
  {
    entry: { line: 0, contains: 'void detruireListe(void) {' },
    ifNull: { line: 1, contains: 'if (debut == NULL) {' },
    returnEmpty: { line: 2, contains: 'return;' },
    endIf: { line: 3, contains: '}' },
    declDernier: { line: 4, contains: 'Noeud *dernier = debut;' },
    whileCond: { line: 5, contains: 'while (dernier->suivant != debut) {' },
    avancer: { line: 6, contains: 'dernier = dernier->suivant;' },
    endWhile: { line: 7, contains: '}' },
    breakRing: { line: 8, contains: 'dernier->suivant = NULL;' },
    whileDebut: { line: 9, contains: 'while (debut != NULL) {' },
    declAncien: { line: 10, contains: 'Noeud *ancienDebut = debut;' },
    setDebut: { line: 11, contains: 'debut = debut->suivant;' },
    free: { line: 12, contains: 'free(ancienDebut);' },
    endWhileDebut: { line: 13, contains: '}' },
    end: { line: 14, contains: '}' },
  },
)

export const circularFunctions: FunctionCode[] = [
  afficherListe,
  insererEnTete,
  insererEnFin,
  supprimerEnTete,
  supprimerValeur,
  rechercher,
  detruireListe,
]

export const circularCode = collectCode(circularFunctions)
export const circularLabels = collectLabels(circularFunctions)
