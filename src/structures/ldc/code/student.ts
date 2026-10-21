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
    'NoeudEtudiant *debut = NULL;',
  ],
}

const afficherListe = makeFunction(
  'afficherListe',
  `
void afficherListe(void) {
    NoeudEtudiant *courant = debut;
    while (courant != NULL) {
        printf("%d ", courant->donnees.numero);
        courant = courant->suivant;
    }
}
`,
  {
    entry: { line: 0, contains: 'void afficherListe(void) {' },
    declCourant: { line: 1, contains: 'NoeudEtudiant *courant = debut;' },
    whileCond: { line: 2, contains: 'while (courant != NULL)' },
    printf: { line: 3, contains: 'printf("%d ", courant->donnees.numero);' },
    avancer: { line: 4, contains: 'courant = courant->suivant;' },
    endWhile: { line: 5, contains: '}' },
    end: { line: 6, contains: '}' },
  },
)

const afficherListeEnvers = makeFunction(
  'afficherListeEnvers',
  `
void afficherListeEnvers(void) {
    NoeudEtudiant *courant = debut;
    if (courant == NULL) {
        printf("\\n");
        return;
    }
    while (courant->suivant != NULL) {
        courant = courant->suivant;
    }
    while (courant != NULL) {
        printf("%d ", courant->donnees.numero);
        courant = courant->precedent;
    }
}
`,
  {
    entry: { line: 0, contains: 'void afficherListeEnvers(void) {' },
    declCourant: { line: 1, contains: 'NoeudEtudiant *courant = debut;' },
    ifNull: { line: 2, contains: 'if (courant == NULL)' },
    printfNewline: { line: 3, contains: 'printf("\\n");' },
    returnEmpty: { line: 4, contains: 'return;' },
    endIf: { line: 5, contains: '}' },
    forwardWhile: { line: 6, contains: 'while (courant->suivant != NULL)' },
    forwardAdvance: { line: 7, contains: 'courant = courant->suivant;' },
    endForwardWhile: { line: 8, contains: '}' },
    backWhile: { line: 9, contains: 'while (courant != NULL)' },
    printf: { line: 10, contains: 'printf("%d ", courant->donnees.numero);' },
    backAdvance: { line: 11, contains: 'courant = courant->precedent;' },
    endBackWhile: { line: 12, contains: '}' },
    end: { line: 13, contains: '}' },
  },
)

const inscrireEtudiant = makeFunction(
  'inscrireEtudiant',
  `
void inscrireEtudiant(Etudiant E) {
    NoeudEtudiant *nouveau = malloc(sizeof(NoeudEtudiant));
    nouveau->donnees = E;
    nouveau->suivant = NULL;
    if (debut == NULL) {
        nouveau->precedent = NULL;
        debut = nouveau;
        return;
    }
    NoeudEtudiant *courant = debut;
    while (courant->suivant != NULL) {
        courant = courant->suivant;
    }
    courant->suivant = nouveau;
    nouveau->precedent = courant;
}
`,
  {
    entry: { line: 0, contains: 'void inscrireEtudiant(Etudiant E) {' },
    malloc: { line: 1, contains: 'malloc(sizeof(NoeudEtudiant))' },
    setDonnees: { line: 2, contains: 'nouveau->donnees = E;' },
    setSuivantNull: { line: 3, contains: 'nouveau->suivant = NULL;' },
    ifDebutNull: { line: 4, contains: 'if (debut == NULL)' },
    setPrecedentNull: { line: 5, contains: 'nouveau->precedent = NULL;' },
    setDebut: { line: 6, contains: 'debut = nouveau;' },
    returnEmpty: { line: 7, contains: 'return;' },
    endIf: { line: 8, contains: '}' },
    declCourant: { line: 9, contains: 'NoeudEtudiant *courant = debut;' },
    whileCond: { line: 10, contains: 'while (courant->suivant != NULL)' },
    avancer: { line: 11, contains: 'courant = courant->suivant;' },
    endWhile: { line: 12, contains: '}' },
    linkLast: { line: 13, contains: 'courant->suivant = nouveau;' },
    setNewPrecedent: { line: 14, contains: 'nouveau->precedent = courant;' },
    end: { line: 15, contains: '}' },
  },
)

const radierEtudiant = makeFunction(
  'radierEtudiant',
  `
void radierEtudiant(int num) {
    NoeudEtudiant *courant = debut;
    while (courant != NULL && courant->donnees.numero != num) {
        courant = courant->suivant;
    }
    if (courant == NULL) {
        return;
    }
    if (courant == debut) {
        debut = debut->suivant;
        if (debut != NULL) {
            debut->precedent = NULL;
        }
        free(courant);
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
    entry: { line: 0, contains: 'void radierEtudiant(int num) {' },
    declCourant: { line: 1, contains: 'NoeudEtudiant *courant = debut;' },
    whileCond: { line: 2, contains: 'while (courant != NULL && courant->donnees.numero != num)' },
    avancer: { line: 3, contains: 'courant = courant->suivant;' },
    endWhile: { line: 4, contains: '}' },
    ifNull: { line: 5, contains: 'if (courant == NULL)' },
    returnNotFound: { line: 6, contains: 'return;' },
    endIf: { line: 7, contains: '}' },
    ifHead: { line: 8, contains: 'if (courant == debut)' },
    setDebut: { line: 9, contains: 'debut = debut->suivant;' },
    ifNewHead: { line: 10, contains: 'if (debut != NULL)' },
    newHeadPrecNull: { line: 11, contains: 'debut->precedent = NULL;' },
    endIfNewHead: { line: 12, contains: '}' },
    free: { line: 13, contains: 'free(courant);' },
    returnAfterFree: { line: 14, contains: 'return;' },
    endIfHead: { line: 15, contains: '}' },
    unlinkPrev: { line: 16, contains: 'courant->precedent->suivant = courant->suivant;' },
    ifNext: { line: 17, contains: 'if (courant->suivant != NULL)' },
    unlinkNext: { line: 18, contains: 'courant->suivant->precedent = courant->precedent;' },
    endIfNext: { line: 19, contains: '}' },
    freeLast: { line: 20, contains: 'free(courant);' },
    end: { line: 21, contains: '}' },
  },
)

const inverserListe = makeFunction(
  'inverserListe',
  `
void inverserListe(void) {
    NoeudEtudiant *courant = debut;
    NoeudEtudiant *dernier = NULL;
    while (courant != NULL) {
        NoeudEtudiant *temp = courant->suivant;
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
    declCourant: { line: 1, contains: 'NoeudEtudiant *courant = debut;' },
    declDernier: { line: 2, contains: 'NoeudEtudiant *dernier = NULL;' },
    whileCond: { line: 3, contains: 'while (courant != NULL)' },
    declTemp: { line: 4, contains: 'NoeudEtudiant *temp = courant->suivant;' },
    swapSuivant: { line: 5, contains: 'courant->suivant = courant->precedent;' },
    swapPrecedent: { line: 6, contains: 'courant->precedent = temp;' },
    setDernier: { line: 7, contains: 'dernier = courant;' },
    avancer: { line: 8, contains: 'courant = temp;' },
    endWhile: { line: 9, contains: '}' },
    setDebut: { line: 10, contains: 'debut = dernier;' },
    end: { line: 11, contains: '}' },
  },
)

const detruireListe = makeFunction(
  'detruireListe',
  `
void detruireListe(void) {
    while (debut != NULL) {
        NoeudEtudiant *temp = debut;
        debut = debut->suivant;
        if (debut != NULL) {
            debut->precedent = NULL;
        }
        free(temp);
    }
}
`,
  {
    entry: { line: 0, contains: 'void detruireListe(void) {' },
    whileCond: { line: 1, contains: 'while (debut != NULL)' },
    declTemp: { line: 2, contains: 'NoeudEtudiant *temp = debut;' },
    setDebut: { line: 3, contains: 'debut = debut->suivant;' },
    ifNewHead: { line: 4, contains: 'if (debut != NULL)' },
    newHeadPrecNull: { line: 5, contains: 'debut->precedent = NULL;' },
    endIf: { line: 6, contains: '}' },
    free: { line: 7, contains: 'free(temp);' },
    endWhile: { line: 8, contains: '}' },
    end: { line: 9, contains: '}' },
  },
)

export const studentFunctions: FunctionCode[] = [
  afficherListe,
  afficherListeEnvers,
  inscrireEtudiant,
  radierEtudiant,
  inverserListe,
  detruireListe,
]

export const studentCode = collectCode(studentFunctions)
export const studentLabels = collectLabels(studentFunctions)
