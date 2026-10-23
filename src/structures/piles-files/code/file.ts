import type { CodeSource } from '../../../core/types'
import { collectCode, collectLabels, makeFunction } from '../../lsc/code/shared'
import type { FunctionCode } from '../../lsc/code/shared'

export const fileTypes: CodeSource = {
  fn: 'types',
  labels: {},
  lines: [
    'typedef struct noeudFile {',
    '    int valeur;',
    '    struct noeudFile *suivant;',
    '} NoeudFile;',
    '',
    'NoeudFile *debut = NULL;',
    'NoeudFile *fin = NULL;',
  ],
}

const enfiler = makeFunction(
  'enfiler',
  `
void enfiler(int valeur) {
    NoeudFile *nouveau = malloc(sizeof(NoeudFile));
    nouveau->valeur = valeur;
    nouveau->suivant = NULL;
    if (debut == NULL) {
        debut = nouveau;
        fin = nouveau;
        return;
    }
    fin->suivant = nouveau;
    fin = nouveau;
}
`,
  {
    entry: { line: 0, contains: 'void enfiler(int valeur) {' },
    malloc: { line: 1, contains: 'NoeudFile *nouveau = malloc(sizeof(NoeudFile));' },
    setValeur: { line: 2, contains: 'nouveau->valeur = valeur;' },
    setSuivantNull: { line: 3, contains: 'nouveau->suivant = NULL;' },
    ifEmpty: { line: 4, contains: 'if (debut == NULL)' },
    setDebutEmpty: { line: 5, contains: 'debut = nouveau;' },
    setFinEmpty: { line: 6, contains: 'fin = nouveau;' },
    returnEmpty: { line: 7, contains: 'return;' },
    endIfEmpty: { line: 8, contains: '}' },
    linkLast: { line: 9, contains: 'fin->suivant = nouveau;' },
    advanceFin: { line: 10, contains: 'fin = nouveau;' },
    end: { line: 11, contains: '}' },
  },
)

const defiler = makeFunction(
  'defiler',
  `
int defiler(void) {
    if (debut == NULL) {
        printf("File vide\\n");
        return -1;
    }
    NoeudFile *ancienDebut = debut;
    int valeur = ancienDebut->valeur;
    debut = debut->suivant;
    if (debut == NULL) {
        fin = NULL;
    }
    free(ancienDebut);
    return valeur;
}
`,
  {
    entry: { line: 0, contains: 'int defiler(void) {' },
    ifEmpty: { line: 1, contains: 'if (debut == NULL)' },
    printfEmpty: { line: 2, contains: 'printf("File vide\\n");' },
    returnError: { line: 3, contains: 'return -1;' },
    declAncien: { line: 5, contains: 'NoeudFile *ancienDebut = debut;' },
    declValeur: { line: 6, contains: 'int valeur = ancienDebut->valeur;' },
    advanceDebut: { line: 7, contains: 'debut = debut->suivant;' },
    ifBecameEmpty: { line: 8, contains: 'if (debut == NULL)' },
    resetFin: { line: 9, contains: 'fin = NULL;' },
    endIfEmpty: { line: 10, contains: '}' },
    free: { line: 11, contains: 'free(ancienDebut);' },
    returnValue: { line: 12, contains: 'return valeur;' },
    end: { line: 13, contains: '}' },
  },
)

const fileVide = makeFunction(
  'fileVide',
  `
int fileVide(void) {
    return debut == NULL;
}
`,
  {
    entry: { line: 0, contains: 'int fileVide(void) {' },
    return: { line: 1, contains: 'return debut == NULL;' },
    end: { line: 2, contains: '}' },
  },
)

const detruireFile = makeFunction(
  'detruireFile',
  `
void detruireFile(void) {
    while (debut != NULL) {
        defiler();
    }
}
`,
  {
    entry: { line: 0, contains: 'void detruireFile(void) {' },
    whileCond: { line: 1, contains: 'while (debut != NULL)' },
    callDefiler: { line: 2, contains: 'defiler();' },
    endWhile: { line: 3, contains: '}' },
    end: { line: 4, contains: '}' },
  },
)

const enregistrerArrivee = makeFunction(
  'enregistrerArrivee',
  `
void enregistrerArrivee(int numero) {
    enfiler(numero);
}
`,
  {
    entry: { line: 0, contains: 'void enregistrerArrivee(int numero) {' },
    callEnfiler: { line: 1, contains: 'enfiler(numero);' },
    end: { line: 2, contains: '}' },
  },
)

const servirSuivant = makeFunction(
  'servirSuivant',
  `
void servirSuivant(void) {
    if (fileVide()) {
        return;
    }
    int numero = defiler();
    printf("Etudiant %d servi\\n", numero);
}
`,
  {
    entry: { line: 0, contains: 'void servirSuivant(void) {' },
    ifEmpty: { line: 1, contains: 'if (fileVide())' },
    returnEmpty: { line: 2, contains: 'return;' },
    endIf: { line: 3, contains: '}' },
    declNumero: { line: 4, contains: 'int numero = defiler();' },
    printf: { line: 5, contains: 'printf("Etudiant %d servi\\n", numero);' },
    end: { line: 6, contains: '}' },
  },
)

export const fileFunctions: FunctionCode[] = [
  enfiler,
  defiler,
  fileVide,
  detruireFile,
  enregistrerArrivee,
  servirSuivant,
]

export const fileCode = collectCode(fileFunctions)
export const fileLabels = collectLabels(fileFunctions)
