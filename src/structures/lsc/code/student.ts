import type { CodeSource } from '../../../core/types'
import { collectCode, collectLabels, makeFunction } from './shared'
import type { FunctionCode } from './shared'

export const studentTypes: CodeSource = {
  fn: 'types',
  labels: {},
  lines: [
    'typedef struct etudiant {',
    '    int numero;',
    '    char nom[30];',
    '    char prenom[30];',
    '    struct etudiant *suivant;',
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
        printf("%d ", courant->numero);
        courant = courant->suivant;
    }
}
`,
  {
    entry: { line: 0, contains: 'void afficherListe(void) {' },
    declCourant: { line: 1, contains: 'NoeudEtudiant *courant = debut;' },
    whileCond: { line: 2, contains: 'while (courant != NULL)' },
    printf: { line: 3, contains: 'printf("%d ", courant->numero);' },
    avancer: { line: 4, contains: 'courant = courant->suivant;' },
    endWhile: { line: 5, contains: '}' },
    end: { line: 6, contains: '}' },
  },
)

const inscrireEtudiant = makeFunction(
  'inscrireEtudiant',
  `
void inscrireEtudiant(int numero, char nom[], char prenom[]) {
    NoeudEtudiant *nouveau = malloc(sizeof(NoeudEtudiant));
    nouveau->numero = numero;
    strcpy(nouveau->nom, nom);
    strcpy(nouveau->prenom, prenom);
    nouveau->suivant = NULL;
    if (debut == NULL) {
        debut = nouveau;
        return;
    }
    NoeudEtudiant *courant = debut;
    while (courant->suivant != NULL) {
        courant = courant->suivant;
    }
    courant->suivant = nouveau;
}
`,
  {
    entry: { line: 0, contains: 'void inscrireEtudiant(int numero, char nom[], char prenom[]) {' },
    malloc: { line: 1, contains: 'malloc(sizeof(NoeudEtudiant))' },
    setNumero: { line: 2, contains: 'nouveau->numero = numero;' },
    strcpyNom: { line: 3, contains: 'strcpy(nouveau->nom, nom);' },
    strcpyPrenom: { line: 4, contains: 'strcpy(nouveau->prenom, prenom);' },
    setSuivantNull: { line: 5, contains: 'nouveau->suivant = NULL;' },
    ifDebutNull: { line: 6, contains: 'if (debut == NULL)' },
    setDebut: { line: 7, contains: 'debut = nouveau;' },
    returnEmpty: { line: 8, contains: 'return;' },
    endIf: { line: 9, contains: '}' },
    declCourant: { line: 10, contains: 'NoeudEtudiant *courant = debut;' },
    whileCond: { line: 11, contains: 'while (courant->suivant != NULL)' },
    avancer: { line: 12, contains: 'courant = courant->suivant;' },
    endWhile: { line: 13, contains: '}' },
    linkLast: { line: 14, contains: 'courant->suivant = nouveau;' },
    end: { line: 15, contains: '}' },
  },
)

const radierEtudiant = makeFunction(
  'radierEtudiant',
  `
void radierEtudiant(int numero) {
    if (debut == NULL) {
        return;
    }
    if (debut->numero == numero) {
        NoeudEtudiant *ancienDebut = debut;
        debut = debut->suivant;
        free(ancienDebut);
        return;
    }
    NoeudEtudiant *precedent = debut;
    NoeudEtudiant *courant = debut->suivant;
    while (courant != NULL && courant->numero != numero) {
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
    entry: { line: 0, contains: 'void radierEtudiant(int numero) {' },
    ifEmpty: { line: 1, contains: 'if (debut == NULL)' },
    returnEmpty: { line: 2, contains: 'return;' },
    endIfEmpty: { line: 3, contains: '}' },
    ifHead: { line: 4, contains: 'if (debut->numero == numero)' },
    declAncien: { line: 5, contains: 'NoeudEtudiant *ancienDebut = debut;' },
    advanceDebut: { line: 6, contains: 'debut = debut->suivant;' },
    freeHead: { line: 7, contains: 'free(ancienDebut);' },
    returnAfterHead: { line: 8, contains: 'return;' },
    endIfHead: { line: 9, contains: '}' },
    declPrecedent: { line: 10, contains: 'NoeudEtudiant *precedent = debut;' },
    declCourant: { line: 11, contains: 'NoeudEtudiant *courant = debut->suivant;' },
    whileCond: { line: 12, contains: 'while (courant != NULL && courant->numero != numero)' },
    setPrecedent: { line: 13, contains: 'precedent = courant;' },
    avancer: { line: 14, contains: 'courant = courant->suivant;' },
    endWhile: { line: 15, contains: '}' },
    ifFound: { line: 16, contains: 'if (courant != NULL)' },
    unlink: { line: 17, contains: 'precedent->suivant = courant->suivant;' },
    free: { line: 18, contains: 'free(courant);' },
    endIfFound: { line: 19, contains: '}' },
    end: { line: 20, contains: '}' },
  },
)

const detruireListe = makeFunction(
  'detruireListe',
  `
void detruireListe(void) {
    while (debut != NULL) {
        NoeudEtudiant *ancienDebut = debut;
        debut = debut->suivant;
        free(ancienDebut);
    }
}
`,
  {
    entry: { line: 0, contains: 'void detruireListe(void) {' },
    whileCond: { line: 1, contains: 'while (debut != NULL)' },
    declAncien: { line: 2, contains: 'NoeudEtudiant *ancienDebut = debut;' },
    advance: { line: 3, contains: 'debut = debut->suivant;' },
    free: { line: 4, contains: 'free(ancienDebut);' },
    endWhile: { line: 5, contains: '}' },
    end: { line: 6, contains: '}' },
  },
)

export const studentFunctions: FunctionCode[] = [
  afficherListe,
  inscrireEtudiant,
  radierEtudiant,
  detruireListe,
]

export const studentCode = collectCode(studentFunctions)
export const studentLabels = collectLabels(studentFunctions)
