import type { CodeSource } from '../../../core/types'
import { collectCode, collectLabels, makeFunction } from './shared'
import type { FunctionCode } from './shared'

export const studentTypes: CodeSource = {
  fn: 'types',
  labels: {},
  lines: [
    'typedef struct {',
    '    int numero;',
    '    char nom[50];',
    '    char prenom[50];',
    '} Etudiant;',
    '',
    'typedef struct noeudEtudiant {',
    '    Etudiant donnees;',
    '    struct noeudEtudiant *suivant;',
    '    struct noeudEtudiant *precedent;',
    '} NoeudEtudiant;',
    '',
    'NoeudEtudiant *debut = NULL; /* circulaire */',
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
    NoeudEtudiant *courant = debut;
    do {
        printf("%d ", courant->donnees.numero);
        courant = courant->suivant;
    } while (courant != debut);
}
`,
  {
    entry: 'void afficherListe(void) {',
    ifNull: 'if (debut == NULL) {',
    printfNewline: 'printf("\\n");',
    returnEmpty: 'return;',
    declCourant: 'NoeudEtudiant *courant = debut;',
    printf: 'printf("%d ", courant->donnees.numero);',
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
    NoeudEtudiant *dernier = debut->precedent;
    NoeudEtudiant *courant = dernier;
    do {
        printf("%d ", courant->donnees.numero);
        courant = courant->precedent;
    } while (courant != dernier);
}
`,
  {
    entry: 'void afficherListeEnvers(void) {',
    ifNull: 'if (debut == NULL) {',
    printfNewline: 'printf("\\n");',
    returnEmpty: 'return;',
    declDernier: 'NoeudEtudiant *dernier = debut->precedent;',
    declCourant: 'NoeudEtudiant *courant = dernier;',
    printf: 'printf("%d ", courant->donnees.numero);',
    backAdvance: 'courant = courant->precedent;',
    whileCond: 'while (courant != dernier);',
  },
)

const inscrireEtudiant = makeFunction(
  'inscrireEtudiant',
  `
void inscrireEtudiant(Etudiant E) {
    NoeudEtudiant *nouveau = malloc(sizeof(NoeudEtudiant));
    nouveau->donnees = E;
    if (debut == NULL) {
        nouveau->suivant = nouveau;
        nouveau->precedent = nouveau;
        debut = nouveau;
        return;
    }
    NoeudEtudiant *dernier = debut->precedent;
    nouveau->suivant = debut;
    nouveau->precedent = dernier;
    dernier->suivant = nouveau;
    debut->precedent = nouveau;
}
`,
  {
    entry: 'void inscrireEtudiant(Etudiant E) {',
    malloc: 'NoeudEtudiant *nouveau = malloc',
    setDonnees: 'nouveau->donnees = E;',
    ifDebutNull: 'if (debut == NULL) {',
    setSelfSuivant: 'nouveau->suivant = nouveau;',
    setSelfPrecedent: 'nouveau->precedent = nouveau;',
    setDebut: 'debut = nouveau;',
    returnEmpty: 'return;',
    declDernier: 'NoeudEtudiant *dernier = debut->precedent;',
    setSuivant: 'nouveau->suivant = debut;',
    setPrecedent: 'nouveau->precedent = dernier;',
    linkLast: 'dernier->suivant = nouveau;',
    linkOldHead: 'debut->precedent = nouveau;',
  },
)

const radierEtudiant = makeFunction(
  'radierEtudiant',
  `
void radierEtudiant(int num) {
    if (debut == NULL) {
        return;
    }
    NoeudEtudiant *courant = debut;
    do {
        if (courant->donnees.numero == num) {
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
    entry: 'void radierEtudiant(int num) {',
    ifEmpty: 'if (debut == NULL) {',
    returnEmpty: { text: 'return;', occurrence: 0 },
    declCourant: 'NoeudEtudiant *courant = debut;',
    checkValue: 'if (courant->donnees.numero == num) {',
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
        NoeudEtudiant *ancien = debut;
        if (debut->suivant == debut) {
            free(ancien);
            debut = NULL;
        } else {
            NoeudEtudiant *dernier = debut->precedent;
            debut = debut->suivant;
            debut->precedent = dernier;
            dernier->suivant = debut;
            free(ancien);
        }
    }
}
`,
  {
    entry: 'void detruireListe(void) {',
    whileCond: 'while (debut != NULL) {',
    declAncien: 'NoeudEtudiant *ancien = debut;',
    ifSingle: 'if (debut->suivant == debut) {',
    freeSingle: 'free(ancien);',
    setDebutNull: 'debut = NULL;',
    declDernier: 'NoeudEtudiant *dernier = debut->precedent;',
    setDebut: 'debut = debut->suivant;',
    newHeadPrecedent: 'debut->precedent = dernier;',
    linkLast: 'dernier->suivant = debut;',
    free: { text: 'free(ancien);', occurrence: 1 },
  },
)

export const studentFunctions: FunctionCode[] = [
  afficherListe,
  afficherListeEnvers,
  inscrireEtudiant,
  radierEtudiant,
  passerAuSuivant,
  detruireListe,
]

export const studentCode = collectCode(studentFunctions)
export const studentLabels = collectLabels(studentFunctions)
