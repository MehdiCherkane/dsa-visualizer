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

const insererApresValeur = makeFunction(
  'insererApresValeur',
  `
void insererApresValeur(int apres, int valeur) {
    if (debut == NULL) {
        return;
    }
    Noeud *courant = debut;
    do {
        if (courant->valeur == apres) {
            Noeud *nouveau = malloc(sizeof(Noeud));
            nouveau->valeur = valeur;
            nouveau->suivant = courant->suivant;
            nouveau->precedent = courant;
            courant->suivant->precedent = nouveau;
            courant->suivant = nouveau;
            return;
        }
        courant = courant->suivant;
    } while (courant != debut);
}
`,
  {
    entry: 'void insererApresValeur(int apres, int valeur) {',
    ifEmpty: 'if (debut == NULL) {',
    returnEmpty: { text: 'return;', occurrence: 0 },
    declCourant: 'Noeud *courant = debut;',
    checkValue: 'if (courant->valeur == apres) {',
    malloc: 'Noeud *nouveau = malloc',
    setValeur: 'nouveau->valeur = valeur;',
    setSuivant: 'nouveau->suivant = courant->suivant;',
    setPrecedent: 'nouveau->precedent = courant;',
    linkNextPrec: 'courant->suivant->precedent = nouveau;',
    linkAfter: 'courant->suivant = nouveau;',
    returnFound: { text: 'return;', occurrence: 1 },
    avancer: 'courant = courant->suivant;',
    whileCond: 'while (courant != debut);',
  },
)

const insererAvantValeur = makeFunction(
  'insererAvantValeur',
  `
void insererAvantValeur(int avant, int valeur) {
    if (debut == NULL) {
        return;
    }
    Noeud *courant = debut;
    do {
        if (courant->valeur == avant) {
            Noeud *nouveau = malloc(sizeof(Noeud));
            nouveau->valeur = valeur;
            nouveau->suivant = courant;
            nouveau->precedent = courant->precedent;
            courant->precedent->suivant = nouveau;
            courant->precedent = nouveau;
            if (courant == debut) {
                debut = nouveau;
            }
            return;
        }
        courant = courant->suivant;
    } while (courant != debut);
}
`,
  {
    entry: 'void insererAvantValeur(int avant, int valeur) {',
    ifEmpty: 'if (debut == NULL) {',
    returnEmpty: { text: 'return;', occurrence: 0 },
    declCourant: 'Noeud *courant = debut;',
    checkValue: 'if (courant->valeur == avant) {',
    malloc: 'Noeud *nouveau = malloc',
    setValeur: 'nouveau->valeur = valeur;',
    setSuivant: 'nouveau->suivant = courant;',
    setPrecedent: 'nouveau->precedent = courant->precedent;',
    linkPrevNext: 'courant->precedent->suivant = nouveau;',
    linkCourantPrec: 'courant->precedent = nouveau;',
    ifHead: 'if (courant == debut) {',
    setDebut: 'debut = nouveau;',
    returnFound: { text: 'return;', occurrence: 1 },
    avancer: 'courant = courant->suivant;',
    whileCond: 'while (courant != debut);',
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
    declSingle: 'Noeud *ancien = debut;',
    setDebutNull: 'debut = NULL;',
    freeSingle: 'free(ancien);',
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
                debut = NULL;
                free(courant);
                return;
            }
            if (courant == debut) {
                debut = courant->suivant;
            }
            courant->precedent->suivant = courant->suivant;
            courant->suivant->precedent = courant->precedent;
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
    setDebutNull: 'debut = NULL;',
    freeSingle: { text: 'free(courant);', occurrence: 0 },
    returnSingle: { text: 'return;', occurrence: 1 },
    ifHead: 'if (courant == debut) {',
    setDebut: 'debut = courant->suivant;',
    unlinkPrev: 'courant->precedent->suivant = courant->suivant;',
    unlinkNext: 'courant->suivant->precedent = courant->precedent;',
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

const inverserListe = makeFunction(
  'inverserListe',
  `
void inverserListe(void) {
    if (debut == NULL) {
        return;
    }
    Noeud *dernier = debut->precedent;
    Noeud *courant = debut;
    do {
        Noeud *temp = courant->suivant;
        courant->suivant = courant->precedent;
        courant->precedent = temp;
        courant = temp;
    } while (courant != debut);
    debut = dernier;
}
`,
  {
    entry: 'void inverserListe(void) {',
    ifEmpty: 'if (debut == NULL) {',
    returnEmpty: 'return;',
    declDernier: 'Noeud *dernier = debut->precedent;',
    declCourant: 'Noeud *courant = debut;',
    declTemp: 'Noeud *temp = courant->suivant;',
    swapSuivant: 'courant->suivant = courant->precedent;',
    swapPrecedent: 'courant->precedent = temp;',
    avancer: 'courant = temp;',
    whileCond: 'while (courant != debut);',
    setDebut: 'debut = dernier;',
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
  passerAuSuivant,
  detruireListe,
  inverserListe,
]

export const intCode = collectCode(intFunctions)
export const intLabels = collectLabels(intFunctions)
