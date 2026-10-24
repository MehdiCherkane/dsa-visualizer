import type { CodeSource } from '../../../core/types'
import {
  collectArrayCode,
  collectArrayLabels,
  makeArrayFunction,
} from './shared'
import type { FunctionCode, LabelMap } from './shared'

export interface QueueSource {
  types: CodeSource
  code: Record<string, CodeSource>
  labels: Record<string, LabelMap>
}

const enregistrerArrivee = makeArrayFunction(
  'enregistrerArrivee',
  [
    'void enregistrerArrivee(File *f, int numero) {',
    '    enfiler(f, numero);',
    '}',
  ],
  {
    entry: 0,
    call: '    enfiler(f, numero);',
    end: -1,
  },
)

const guichetSuivant = makeArrayFunction(
  'guichetSuivant',
  [
    'void guichetSuivant(File *f) {',
    '    int numero = defiler(f);',
    '    if (numero != -1) {',
    '        printf("Guichet : etudiant %d servi\\n", numero);',
    '    }',
    '}',
  ],
  {
    entry: 0,
    call: '    int numero = defiler(f);',
    ifServed: '    if (numero != -1) {',
    printf: '        printf("Guichet : etudiant %d servi\\n", numero);',
    endIf: '    }',
    end: -1,
  },
)

function queueSource(
  typesLines: string[],
  initFile: FunctionCode,
  fileVide: FunctionCode,
  filePleine: FunctionCode,
  enfiler: FunctionCode,
  defiler: FunctionCode,
  afficherFile: FunctionCode,
  extra: FunctionCode[] = [],
): QueueSource {
  const functions = [
    initFile,
    fileVide,
    filePleine,
    enfiler,
    defiler,
    afficherFile,
    enregistrerArrivee,
    guichetSuivant,
    ...extra,
  ]
  return {
    types: { fn: 'types', labels: {}, lines: typesLines },
    code: collectArrayCode(functions),
    labels: collectArrayLabels(functions),
  }
}

/* ------------------------------------------------------------------ */
/* Version 1 : file ordinaire (av / ar), ar ne redescend jamais.       */
/* ------------------------------------------------------------------ */

const initOrdinaire = makeArrayFunction(
  'initFile',
  [
    'void initFile(File *f) {',
    '    f->av = -1;',
    '    f->ar = -1;',
    '}',
  ],
  {
    entry: 0,
    resetAv: '    f->av = -1;',
    resetAr: '    f->ar = -1;',
    end: -1,
  },
)

const videOrdinaire = makeArrayFunction(
  'fileVide',
  [
    'int fileVide(File f) {',
    '    return (f.av == -1);',
    '}',
  ],
  {
    entry: 0,
    test: '    return (f.av == -1);',
    end: -1,
  },
)

const pleineOrdinaire = makeArrayFunction(
  'filePleine',
  [
    'int filePleine(File f) {',
    '    return (f.ar == MAX - 1);',
    '}',
  ],
  {
    entry: 0,
    test: '    return (f.ar == MAX - 1);',
    end: -1,
  },
)

const enfilerOrdinaire = makeArrayFunction(
  'enfiler',
  [
    'void enfiler(File *f, int valeur) {',
    '    if (filePleine(*f)) {',
    '        printf("File pleine\\n");',
    '        return;',
    '    }',
    '    if (fileVide(*f)) {',
    '        f->av = 0;',
    '    }',
    '    f->ar++;',
    '    f->elements[f->ar] = valeur;',
    '}',
  ],
  {
    entry: 0,
    ifPleine: '    if (filePleine(*f)) {',
    printfFull: '        printf("File pleine\\n");',
    returnFull: '        return;',
    endIfFull: '    }',
    ifVide: '    if (fileVide(*f)) {',
    setAv: '        f->av = 0;',
    endIfVide: '    }',
    incrementAr: '    f->ar++;',
    write: '    f->elements[f->ar] = valeur;',
    end: -1,
  },
)

const defilerOrdinaire = makeArrayFunction(
  'defiler',
  [
    'int defiler(File *f) {',
    '    if (fileVide(*f)) {',
    '        return -1;',
    '    }',
    '    int valeur = f->elements[f->av];',
    '    f->av++;',
    '    if (f->av > f->ar) {',
    '        f->av = -1;',
    '        f->ar = -1;',
    '    }',
    '    return valeur;',
    '}',
  ],
  {
    entry: 0,
    ifVide: '    if (fileVide(*f)) {',
    returnError: '        return -1;',
    endIfVide: '    }',
    read: '    int valeur = f->elements[f->av];',
    advanceAv: '    f->av++;',
    ifBecameEmpty: '    if (f->av > f->ar) {',
    resetAv: '        f->av = -1;',
    resetAr: '        f->ar = -1;',
    endIfEmpty: '    }',
    returnValue: '    return valeur;',
    end: -1,
  },
)

const afficherOrdinaire = makeArrayFunction(
  'afficherFile',
  [
    'void afficherFile(File f) {',
    '    for (int i = f.av; i <= f.ar; i++) {',
    '        printf("%d ", f.elements[i]);',
    '    }',
    '    printf("\\n");',
    '}',
  ],
  {
    entry: 0,
    forCond: '    for (int i = f.av; i <= f.ar; i++) {',
    printf: '        printf("%d ", f.elements[i]);',
    endFor: '    }',
    newline: '    printf("\\n");',
    end: -1,
  },
)

export const fileOrdinaire: QueueSource = queueSource(
  [
    '#define MAX 5          /* 50 dans le cours */',
    '',
    'typedef struct {',
    '    int elements[MAX];',
    '    int av;   /* indice de tête */',
    '    int ar;   /* indice de queue */',
    '} File;',
    '',
    'File f;  /* initFile(&f) : av = ar = -1 */',
  ],
  initOrdinaire,
  videOrdinaire,
  pleineOrdinaire,
  enfilerOrdinaire,
  defilerOrdinaire,
  afficherOrdinaire,
)

/* ------------------------------------------------------------------ */
/* Version 2 : file par décalage, ar est un compteur d’éléments.       */
/* ------------------------------------------------------------------ */

const initDecalage = makeArrayFunction(
  'initFile',
  [
    'void initFile(File *f) {',
    '    f->ar = 0;',
    '}',
  ],
  {
    entry: 0,
    resetAr: '    f->ar = 0;',
    end: -1,
  },
)

const videDecalage = makeArrayFunction(
  'fileVide',
  [
    'int fileVide(File f) {',
    '    return (f.ar == 0);',
    '}',
  ],
  {
    entry: 0,
    test: '    return (f.ar == 0);',
    end: -1,
  },
)

const pleineDecalage = makeArrayFunction(
  'filePleine',
  [
    'int filePleine(File f) {',
    '    return (f.ar == MAX);',
    '}',
  ],
  {
    entry: 0,
    test: '    return (f.ar == MAX);',
    end: -1,
  },
)

const enfilerDecalage = makeArrayFunction(
  'enfiler',
  [
    'void enfiler(File *f, int valeur) {',
    '    if (filePleine(*f)) {',
    '        printf("File pleine\\n");',
    '        return;',
    '    }',
    '    f->elements[f->ar] = valeur;',
    '    f->ar++;',
    '}',
  ],
  {
    entry: 0,
    ifPleine: '    if (filePleine(*f)) {',
    printfFull: '        printf("File pleine\\n");',
    returnFull: '        return;',
    endIfFull: '    }',
    write: '    f->elements[f->ar] = valeur;',
    incrementAr: '    f->ar++;',
    end: -1,
  },
)

const defilerDecalage = makeArrayFunction(
  'defiler',
  [
    'int defiler(File *f) {',
    '    if (fileVide(*f)) {',
    '        return -1;',
    '    }',
    '    int valeur = f->elements[0];',
    '    for (int i = 0; i < f->ar - 1; i++) {',
    '        f->elements[i] = f->elements[i + 1];',
    '    }',
    '    f->ar--;',
    '    return valeur;',
    '}',
  ],
  {
    entry: 0,
    ifVide: '    if (fileVide(*f)) {',
    returnError: '        return -1;',
    endIfVide: '    }',
    read: '    int valeur = f->elements[0];',
    forCond: '    for (int i = 0; i < f->ar - 1; i++) {',
    shift: '        f->elements[i] = f->elements[i + 1];',
    endFor: '    }',
    decrement: '    f->ar--;',
    returnValue: '    return valeur;',
    end: -1,
  },
)

const afficherDecalage = makeArrayFunction(
  'afficherFile',
  [
    'void afficherFile(File f) {',
    '    for (int i = 0; i < f.ar; i++) {',
    '        printf("%d ", f.elements[i]);',
    '    }',
    '    printf("\\n");',
    '}',
  ],
  {
    entry: 0,
    forCond: '    for (int i = 0; i < f.ar; i++) {',
    printf: '        printf("%d ", f.elements[i]);',
    endFor: '    }',
    newline: '    printf("\\n");',
    end: -1,
  },
)

export const fileDecalage: QueueSource = queueSource(
  [
    '#define MAX 5          /* 50 dans le cours */',
    '',
    'typedef struct {',
    '    int elements[MAX];',
    '    int ar;   /* nombre d’éléments */',
    '} File;',
    '',
    'File f;  /* initFile(&f) : ar = 0 */',
  ],
  initDecalage,
  videDecalage,
  pleineDecalage,
  enfilerDecalage,
  defilerDecalage,
  afficherDecalage,
)

/* ------------------------------------------------------------------ */
/* Version 3 : file circulaire (av / ar + modulo, 5 cases utiles).     */
/* ------------------------------------------------------------------ */

const initCirculaire = makeArrayFunction(
  'initFile',
  [
    'void initFile(File *f) {',
    '    f->av = -1;',
    '    f->ar = -1;',
    '}',
  ],
  {
    entry: 0,
    resetAv: '    f->av = -1;',
    resetAr: '    f->ar = -1;',
    end: -1,
  },
)

const videCirculaire = makeArrayFunction(
  'fileVide',
  [
    'int fileVide(File f) {',
    '    return (f.av == -1);',
    '}',
  ],
  {
    entry: 0,
    test: '    return (f.av == -1);',
    end: -1,
  },
)

const pleineCirculaire = makeArrayFunction(
  'filePleine',
  [
    'int filePleine(File f) {',
    '    return ((f.ar + 1) % MAX == f.av);',
    '}',
  ],
  {
    entry: 0,
    test: '    return ((f.ar + 1) % MAX == f.av);',
    end: -1,
  },
)

const enfilerCirculaire = makeArrayFunction(
  'enfiler',
  [
    'void enfiler(File *f, int valeur) {',
    '    if (filePleine(*f)) {',
    '        printf("File pleine\\n");',
    '        return;',
    '    }',
    '    f->ar = (f->ar + 1) % MAX;',
    '    if (fileVide(*f)) {',
    '        f->av = f->ar;',
    '    }',
    '    f->elements[f->ar] = valeur;',
    '}',
  ],
  {
    entry: 0,
    ifPleine: '    if (filePleine(*f)) {',
    printfFull: '        printf("File pleine\\n");',
    returnFull: '        return;',
    endIfFull: '    }',
    advanceAr: '    f->ar = (f->ar + 1) % MAX;',
    ifVide: '    if (fileVide(*f)) {',
    setAv: '        f->av = f->ar;',
    endIfVide: '    }',
    write: '    f->elements[f->ar] = valeur;',
    end: -1,
  },
)

const defilerCirculaire = makeArrayFunction(
  'defiler',
  [
    'int defiler(File *f) {',
    '    if (fileVide(*f)) {',
    '        return -1;',
    '    }',
    '    int valeur = f->elements[f->av];',
    '    if (f->av == f->ar) {',
    '        f->av = -1;',
    '        f->ar = -1;',
    '    } else {',
    '        f->av = (f->av + 1) % MAX;',
    '    }',
    '    return valeur;',
    '}',
  ],
  {
    entry: 0,
    ifVide: '    if (fileVide(*f)) {',
    returnError: '        return -1;',
    endIfVide: '    }',
    read: '    int valeur = f->elements[f->av];',
    ifBecameEmpty: '    if (f->av == f->ar) {',
    resetAv: '        f->av = -1;',
    resetAr: '        f->ar = -1;',
    endIfBecameEmpty: '    }',
    elseAdvance: '    } else {',
    advanceAv: '        f->av = (f->av + 1) % MAX;',
    endElse: '    }',
    returnValue: '    return valeur;',
    end: -1,
  },
)

const afficherCirculaire = makeArrayFunction(
  'afficherFile',
  [
    'void afficherFile(File f) {',
    '    if (fileVide(f)) {',
    '        printf("\\n");',
    '        return;',
    '    }',
    '    int i = f.av;',
    '    while (1) {',
    '        printf("%d ", f.elements[i]);',
    '        if (i == f.ar) {',
    '            break;',
    '        }',
    '        i = (i + 1) % MAX;',
    '    }',
    '    printf("\\n");',
    '}',
  ],
  {
    entry: 0,
    ifEmpty: '    if (fileVide(f)) {',
    printfEmpty: '        printf("\\n");',
    returnEmpty: '        return;',
    endIfEmpty: '    }',
    declI: '    int i = f.av;',
    whileStart: '    while (1) {',
    printf: '        printf("%d ", f.elements[i]);',
    ifLast: '        if (i == f.ar) {',
    break: '            break;',
    endIfLast: '        }',
    next: '        i = (i + 1) % MAX;',
    endWhile: '    }',
    newline: '    printf("\\n");',
    end: -1,
  },
)

const recupererMax = makeArrayFunction(
  'recupererMax',
  [
    'int recupererMax(File *f) {',
    '    if (fileVide(*f)) {',
    '        return -1;',
    '    }',
    '    int n = ((f->ar - f->av + MAX) % MAX) + 1;',
    '    int max = f->elements[f->av];',
    '    for (int i = 0; i < n; i++) {',
    '        int x = defiler(f);',
    '        if (x > max) {',
    '            max = x;',
    '        }',
    '        enfiler(f, x);',
    '    }',
    '    int retire = 0;',
    '    for (int i = 0; i < n; i++) {',
    '        int x = defiler(f);',
    '        if (!retire && x == max) {',
    '            retire = 1;',
    '        } else {',
    '            enfiler(f, x);',
    '        }',
    '    }',
    '    return max;',
    '}',
  ],
  {
    entry: 0,
    ifVide: '    if (fileVide(*f)) {',
    returnError: '        return -1;',
    endIfVide: '    }',
    declN: '    int n = ((f->ar - f->av + MAX) % MAX) + 1;',
    declMax: '    int max = f->elements[f->av];',
    scanFor: '    for (int i = 0; i < n; i++) {',
    scanCallDefiler: '        int x = defiler(f);',
    scanIfMax: '        if (x > max) {',
    scanSetMax: '            max = x;',
    scanEndIf: '        }',
    scanCallEnfiler: '        enfiler(f, x);',
    scanEndFor: '    }',
    declRetire: '    int retire = 0;',
    removeFor: '    for (int i = 0; i < n; i++) {',
    removeCallDefiler: '        int x = defiler(f);',
    removeIfMax: '        if (!retire && x == max) {',
    removeSetRetire: '            retire = 1;',
    removeElse: '        } else {',
    removeCallEnfiler: '            enfiler(f, x);',
    removeEndIf: '        }',
    removeEndFor: '    }',
    returnMax: '    return max;',
    end: -1,
  },
)

export const fileCirculaire: QueueSource = queueSource(
  [
    '#define MAX 5          /* 50 dans le cours */',
    '',
    'typedef struct {',
    '    int elements[MAX];',
    '    int av;   /* indice de tête */',
    '    int ar;   /* indice de queue */',
    '} File;',
    '',
    'File f;  /* initFile(&f) : av = ar = -1 */',
  ],
  initCirculaire,
  videCirculaire,
  pleineCirculaire,
  enfilerCirculaire,
  defilerCirculaire,
  afficherCirculaire,
  [recupererMax],
)
