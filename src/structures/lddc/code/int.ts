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
    entry: 'void afficherListe(void) {',
    ifNull: 'if (debut == NULL) {',
    printfNewline: 'printf("\\n");',
    returnEmpty: 'return;',
    declCourant: 'Noeud *courant = debut;',
    printf: 'printf("%d ", courant->valeur);',
    avancer: 'courant = courant->suivant;',
    whileCond: 'while (courant != debut);',
  },
)

const afficherListeEnvers = makeFunction(
  'afficherListeEnvers',
  `
void afficherListeEnvers(void) {
    if (debut == NULL) {
        printf("\\n");
        return;
    }
    Noeud *dernier = debut->precedent;
    Noeud *courant = dernier;
    do {
        printf("%d ", courant->valeur);
        courant = courant->precedent;
    } while (courant != dernier);
}
`,
  {
    entry: 'void afficherListeEnvers(void) {',
    ifNull: 'if (debut == NULL) {',
    printfNewline: 'printf("\\n");',
    returnEmpty: 'return;',
    declDernier: 'Noeud *dernier = debut->precedent;',
    declCourant: 'Noeud *courant = dernier;',
    printf: 'printf("%d ", courant->valeur);',
    backAdvance: 'courant = courant->precedent;',
    whileCond: 'while (courant != dernier);',
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
        nouveau->precedent = nouveau;
        debut = nouveau;
        return;
    }
    Noeud *dernier = debut->precedent;
    nouveau->suivant = debut;
    nouveau->precedent = dernier;
    dernier->suivant = nouveau;
    debut->precedent = nouveau;
    debut = nouveau;
}
`,
  {
    entry: 'void insererEnTete(int valeur) {',
    malloc: 'Noeud *nouveau = malloc',
    setValeur: 'nouveau->valeur = valeur;',
    ifDebutNull: 'if (debut == NULL) {',
    setSelfSuivant: 'nouveau->suivant = nouveau;',
    setSelfPrecedent: 'nouveau->precedent = nouveau;',
    setDebutEmpty: { text: 'debut = nouveau;', occurrence: 0 },
    returnEmpty: 'return;',
    declDernier: 'Noeud *dernier = debut->precedent;',
    setSuivant: 'nouveau->suivant = debut;',
    setPrecedent: 'nouveau->precedent = dernier;',
    linkLast: 'dernier->suivant = nouveau;',
    linkOldHead: 'debut->precedent = nouveau;',
    setDebut: { text: 'debut = nouveau;', occurrence: 1 },
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
        nouveau->precedent = nouveau;
        debut = nouveau;
        return;
    }
    Noeud *dernier = debut->precedent;
    nouveau->suivant = debut;
    nouveau->precedent = dernier;
    dernier->suivant = nouveau;
    debut->precedent = nouveau;
}
`,
  {
    entry: 'void insererEnFin(int valeur) {',
    malloc: 'Noeud *nouveau = malloc',
    setValeur: 'nouveau->valeur = valeur;',
    ifDebutNull: 'if (debut == NULL) {',
    setSelfSuivant: 'nouveau->suivant = nouveau;',
    setSelfPrecedent: 'nouveau->precedent = nouveau;',
    setDebut: 'debut = nouveau;',
    returnEmpty: 'return;',
    declDernier: 'Noeud *dernier = debut->precedent;',
    setSuivant: 'nouveau->suivant = debut;',
    setPrecedent: 'nouveau->precedent = dernier;',
    linkLast: 'dernier->suivant = nouveau;',
    linkOldHead: 'debut->precedent = nouveau;',
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
        free(debut);
        debut = NULL;
        return;
    }
    Noeud *ancienDebut = debut;
    Noeud *dernier = debut->precedent;
    debut = debut->suivant;
    debut->precedent = dernier;
    dernier->suivant = debut;
    free(ancienDebut);
}
`,
  {
    entry: 'void supprimerEnTete(void) {',
    ifNull: 'if (debut == NULL) {',
    returnEmpty: { text: 'return;', occurrence: 0 },
    ifSingle: 'if (debut->suivant == debut) {',
    freeSingle: 'free(debut);',
    setDebutNull: 'debut = NULL;',
    returnSingle: { text: 'return;', occurrence: 1 },
    declAncien: 'Noeud *ancienDebut = debut;',
    declDernier: 'Noeud *dernier = debut->precedent;',
    setDebut: 'debut = debut->suivant;',
    newHeadPrecedent: 'debut->precedent = dernier;',
    linkLast: 'dernier->suivant = debut;',
    free: 'free(ancienDebut);',
  },
)

const supprimerValeur = makeFunction(
  'supprimerValeur',
  `
void supprimerValeur(int valeur) {
    if (debut == NULL) {
        return;
    }
    Noeud *courant = debut;
    do {
        if (courant->valeur == valeur) {
            if (courant->suivant == courant) {
                free(courant);
                debut = NULL;
                return;
            }
            courant->precedent->suivant = courant->suivant;
            courant->suivant->precedent = courant->precedent;
            if (courant == debut) {
                debut = courant->suivant;
            }
            free(courant);
            return;
        }
        courant = courant->suivant;
    } while (courant != debut);
}
`,
  {
    entry: 'void supprimerValeur(int valeur) {',
    ifEmpty: 'if (debut == NULL) {',
    returnEmpty: { text: 'return;', occurrence: 0 },
    declCourant: 'Noeud *courant = debut;',
    checkValue: 'if (courant->valeur == valeur) {',
    ifSingle: 'if (courant->suivant == courant) {',
    freeSingle: { text: 'free(courant);', occurrence: 0 },
    setDebutNull: 'debut = NULL;',
    returnSingle: { text: 'return;', occurrence: 1 },
    unlinkPrev: 'courant->precedent->suivant = courant->suivant;',
    unlinkNext: 'courant->suivant->precedent = courant->precedent;',
    ifHead: 'if (courant == debut) {',
    setDebut: 'debut = courant->suivant;',
    freeNode: { text: 'free(courant);', occurrence: 1 },
    returnFound: { text: 'return;', occurrence: 2 },
    avancer: 'courant = courant->suivant;',
    whileCond: 'while (courant != debut);',
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
    entry: 'int rechercher(int valeur) {',
    ifEmpty: 'if (debut == NULL) {',
    returnZeroEmpty: { text: 'return 0;', occurrence: 0 },
    declCourant: 'Noeud *courant = debut;',
    checkValue: 'if (courant->valeur == valeur) {',
    returnOne: 'return 1;',
    avancer: 'courant = courant->suivant;',
    whileCond: 'while (courant != debut);',
    returnZero: { text: 'return 0;', occurrence: 1 },
  },
)

const passerAuSuivant = makeFunction(
  'passerAuSuivant',
  `
void passerAuSuivant(void) {
    if (debut == NULL) {
        return;
    }
    debut = debut->suivant;
}
`,
  {
    entry: 'void passerAuSuivant(void) {',
    ifEmpty: 'if (debut == NULL) {',
    returnEmpty: 'return;',
    avancer: 'debut = debut->suivant;',
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
    entry: 'void detruireListe(void) {',
    whileCond: 'while (debut != NULL) {',
    callHead: 'supprimerEnTete();',
  },
)

export const intFunctions: FunctionCode[] = [
  afficherListe,
  afficherListeEnvers,
  insererEnTete,
  insererEnFin,
  supprimerEnTete,
  supprimerValeur,
  rechercher,
  passerAuSuivant,
  detruireListe,
]

export const intCode = collectCode(intFunctions)
export const intLabels = collectLabels(intFunctions)
