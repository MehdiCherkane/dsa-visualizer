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
    '    struct noeud *precedent;',
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

const afficherListeEnvers = makeFunction(
  'afficherListeEnvers',
  `
void afficherListeEnvers(void) {
    Noeud *courant = debut;
    if (courant == NULL) {
        printf("\\n");
        return;
    }
    while (courant->suivant != NULL) {
        courant = courant->suivant;
    }
    while (courant != NULL) {
        printf("%d ", courant->valeur);
        courant = courant->precedent;
    }
}
`,
  {
    entry: { line: 0, contains: 'void afficherListeEnvers(void) {' },
    declCourant: { line: 1, contains: 'Noeud *courant = debut;' },
    ifNull: { line: 2, contains: 'if (courant == NULL)' },
    printfNewline: { line: 3, contains: 'printf("\\n");' },
    returnEmpty: { line: 4, contains: 'return;' },
    endIf: { line: 5, contains: '}' },
    forwardWhile: { line: 6, contains: 'while (courant->suivant != NULL)' },
    forwardAdvance: { line: 7, contains: 'courant = courant->suivant;' },
    endForwardWhile: { line: 8, contains: '}' },
    backWhile: { line: 9, contains: 'while (courant != NULL)' },
    printf: { line: 10, contains: 'printf("%d ", courant->valeur);' },
    backAdvance: { line: 11, contains: 'courant = courant->precedent;' },
    endBackWhile: { line: 12, contains: '}' },
    end: { line: 13, contains: '}' },
  },
)

const insererEnTete = makeFunction(
  'insererEnTete',
  `
void insererEnTete(int valeur) {
    Noeud *nouveau = malloc(sizeof(Noeud));
    nouveau->valeur = valeur;
    nouveau->suivant = debut;
    nouveau->precedent = NULL;
    if (debut != NULL) {
        debut->precedent = nouveau;
    }
    debut = nouveau;
}
`,
  {
    entry: { line: 0, contains: 'void insererEnTete(int valeur) {' },
    malloc: { line: 1, contains: 'malloc(sizeof(Noeud))' },
    setValeur: { line: 2, contains: 'nouveau->valeur = valeur;' },
    setSuivant: { line: 3, contains: 'nouveau->suivant = debut;' },
    setPrecedent: { line: 4, contains: 'nouveau->precedent = NULL;' },
    ifDebut: { line: 5, contains: 'if (debut != NULL)' },
    linkOldHead: { line: 6, contains: 'debut->precedent = nouveau;' },
    endIf: { line: 7, contains: '}' },
    setDebut: { line: 8, contains: 'debut = nouveau;' },
    end: { line: 9, contains: '}' },
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
        nouveau->precedent = NULL;
        debut = nouveau;
        return;
    }
    Noeud *courant = debut;
    while (courant->suivant != NULL) {
        courant = courant->suivant;
    }
    courant->suivant = nouveau;
    nouveau->precedent = courant;
}
`,
  {
    entry: { line: 0, contains: 'void insererEnFin(int valeur) {' },
    malloc: { line: 1, contains: 'malloc(sizeof(Noeud))' },
    setValeur: { line: 2, contains: 'nouveau->valeur = valeur;' },
    setSuivantNull: { line: 3, contains: 'nouveau->suivant = NULL;' },
    ifDebutNull: { line: 4, contains: 'if (debut == NULL)' },
    setPrecedentNull: { line: 5, contains: 'nouveau->precedent = NULL;' },
    setDebut: { line: 6, contains: 'debut = nouveau;' },
    returnEmpty: { line: 7, contains: 'return;' },
    endIf: { line: 8, contains: '}' },
    declCourant: { line: 9, contains: 'Noeud *courant = debut;' },
    whileCond: { line: 10, contains: 'while (courant->suivant != NULL)' },
    avancer: { line: 11, contains: 'courant = courant->suivant;' },
    endWhile: { line: 12, contains: '}' },
    linkLast: { line: 13, contains: 'courant->suivant = nouveau;' },
    setNewPrecedent: { line: 14, contains: 'nouveau->precedent = courant;' },
    end: { line: 15, contains: '}' },
  },
)

const insererApresValeur = makeFunction(
  'insererApresValeur',
  `
void insererApresValeur(int apres, int valeur) {
    Noeud *courant = debut;
    while (courant != NULL && courant->valeur != apres) {
        courant = courant->suivant;
    }
    if (courant == NULL) {
        return;
    }
    Noeud *nouveau = malloc(sizeof(Noeud));
    nouveau->valeur = valeur;
    nouveau->suivant = courant->suivant;
    nouveau->precedent = courant;
    if (courant->suivant != NULL) {
        courant->suivant->precedent = nouveau;
    }
    courant->suivant = nouveau;
}
`,
  {
    entry: { line: 0, contains: 'void insererApresValeur(int apres, int valeur) {' },
    declCourant: { line: 1, contains: 'Noeud *courant = debut;' },
    whileCond: { line: 2, contains: 'while (courant != NULL && courant->valeur != apres)' },
    avancer: { line: 3, contains: 'courant = courant->suivant;' },
    endWhile: { line: 4, contains: '}' },
    ifNull: { line: 5, contains: 'if (courant == NULL)' },
    returnNotFound: { line: 6, contains: 'return;' },
    endIf: { line: 7, contains: '}' },
    malloc: { line: 8, contains: 'malloc(sizeof(Noeud))' },
    setValeur: { line: 9, contains: 'nouveau->valeur = valeur;' },
    setSuivant: { line: 10, contains: 'nouveau->suivant = courant->suivant;' },
    setPrecedent: { line: 11, contains: 'nouveau->precedent = courant;' },
    ifNext: { line: 12, contains: 'if (courant->suivant != NULL)' },
    linkNextPrec: { line: 13, contains: 'courant->suivant->precedent = nouveau;' },
    endIfNext: { line: 14, contains: '}' },
    linkAfter: { line: 15, contains: 'courant->suivant = nouveau;' },
    end: { line: 16, contains: '}' },
  },
)

const insererAvantValeur = makeFunction(
  'insererAvantValeur',
  `
void insererAvantValeur(int avant, int valeur) {
    Noeud *courant = debut;
    while (courant != NULL && courant->valeur != avant) {
        courant = courant->suivant;
    }
    if (courant == NULL) {
        return;
    }
    if (courant == debut) {
        insererEnTete(valeur);
        return;
    }
    Noeud *nouveau = malloc(sizeof(Noeud));
    nouveau->valeur = valeur;
    nouveau->suivant = courant;
    nouveau->precedent = courant->precedent;
    courant->precedent->suivant = nouveau;
    courant->precedent = nouveau;
}
`,
  {
    entry: { line: 0, contains: 'void insererAvantValeur(int avant, int valeur) {' },
    declCourant: { line: 1, contains: 'Noeud *courant = debut;' },
    whileCond: { line: 2, contains: 'while (courant != NULL && courant->valeur != avant)' },
    avancer: { line: 3, contains: 'courant = courant->suivant;' },
    endWhile: { line: 4, contains: '}' },
    ifNull: { line: 5, contains: 'if (courant == NULL)' },
    returnNotFound: { line: 6, contains: 'return;' },
    endIf: { line: 7, contains: '}' },
    ifHead: { line: 8, contains: 'if (courant == debut)' },
    callHead: { line: 9, contains: 'insererEnTete(valeur);' },
    returnAfterCall: { line: 10, contains: 'return;' },
    endIfHead: { line: 11, contains: '}' },
    malloc: { line: 12, contains: 'malloc(sizeof(Noeud))' },
    setValeur: { line: 13, contains: 'nouveau->valeur = valeur;' },
    setSuivant: { line: 14, contains: 'nouveau->suivant = courant;' },
    setPrecedent: { line: 15, contains: 'nouveau->precedent = courant->precedent;' },
    linkPrevNext: { line: 16, contains: 'courant->precedent->suivant = nouveau;' },
    linkCourantPrec: { line: 17, contains: 'courant->precedent = nouveau;' },
    end: { line: 18, contains: '}' },
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
    if (debut != NULL) {
        debut->precedent = NULL;
    }
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
    ifNewHead: { line: 6, contains: 'if (debut != NULL)' },
    newHeadPrecNull: { line: 7, contains: 'debut->precedent = NULL;' },
    endIfNewHead: { line: 8, contains: '}' },
    free: { line: 9, contains: 'free(ancienDebut);' },
    end: { line: 10, contains: '}' },
  },
)

const supprimerValeur = makeFunction(
  'supprimerValeur',
  `
void supprimerValeur(int valeur) {
    Noeud *courant = debut;
    while (courant != NULL && courant->valeur != valeur) {
        courant = courant->suivant;
    }
    if (courant == NULL) {
        return;
    }
    if (courant == debut) {
        supprimerEnTete();
        return;
    }
    courant->precedent->suivant = courant->suivant;
    if (courant->suivant != NULL) {
        courant->suivant->precedent = courant->precedent;
    }
    free(courant);
}
`,
  {
    entry: { line: 0, contains: 'void supprimerValeur(int valeur) {' },
    declCourant: { line: 1, contains: 'Noeud *courant = debut;' },
    whileCond: { line: 2, contains: 'while (courant != NULL && courant->valeur != valeur)' },
    avancer: { line: 3, contains: 'courant = courant->suivant;' },
    endWhile: { line: 4, contains: '}' },
    ifNull: { line: 5, contains: 'if (courant == NULL)' },
    returnNotFound: { line: 6, contains: 'return;' },
    endIf: { line: 7, contains: '}' },
    ifHead: { line: 8, contains: 'if (courant == debut)' },
    callHead: { line: 9, contains: 'supprimerEnTete();' },
    returnAfterCall: { line: 10, contains: 'return;' },
    endIfHead: { line: 11, contains: '}' },
    unlinkPrev: { line: 12, contains: 'courant->precedent->suivant = courant->suivant;' },
    ifNext: { line: 13, contains: 'if (courant->suivant != NULL)' },
    unlinkNext: { line: 14, contains: 'courant->suivant->precedent = courant->precedent;' },
    endIfNext: { line: 15, contains: '}' },
    free: { line: 16, contains: 'free(courant);' },
    end: { line: 17, contains: '}' },
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

const inverserListe = makeFunction(
  'inverserListe',
  `
void inverserListe(void) {
    Noeud *courant = debut;
    Noeud *dernier = NULL;
    while (courant != NULL) {
        Noeud *temp = courant->suivant;
        courant->suivant = courant->precedent;
        courant->precedent = temp;
        dernier = courant;
        courant = temp;
    }
    debut = dernier;
}
`,
  {
    entry: { line: 0, contains: 'void inverserListe(void) {' },
    declCourant: { line: 1, contains: 'Noeud *courant = debut;' },
    declDernier: { line: 2, contains: 'Noeud *dernier = NULL;' },
    whileCond: { line: 3, contains: 'while (courant != NULL)' },
    declTemp: { line: 4, contains: 'Noeud *temp = courant->suivant;' },
    swapSuivant: { line: 5, contains: 'courant->suivant = courant->precedent;' },
    swapPrecedent: { line: 6, contains: 'courant->precedent = temp;' },
    setDernier: { line: 7, contains: 'dernier = courant;' },
    avancer: { line: 8, contains: 'courant = temp;' },
    endWhile: { line: 9, contains: '}' },
    setDebut: { line: 10, contains: 'debut = dernier;' },
    end: { line: 11, contains: '}' },
  },
)

export const intFunctions: FunctionCode[] = [
  afficherListe,
  afficherListeEnvers,
  insererEnTete,
  insererEnFin,
  insererApresValeur,
  insererAvantValeur,
  supprimerEnTete,
  supprimerValeur,
  rechercher,
  detruireListe,
  inverserListe,
]

export const intCode = collectCode(intFunctions)
export const intLabels = collectLabels(intFunctions)
