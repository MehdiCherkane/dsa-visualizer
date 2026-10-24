import type { CodeSource } from '../../../core/types'
import {
  collectArrayCode,
  collectArrayLabels,
  makeArrayFunction,
} from './shared'
import type { FunctionCode } from './shared'

export const pileTypes: CodeSource = {
  fn: 'types',
  labels: {},
  lines: [
    '#define MAX 5          /* 50 dans le cours */',
    '',
    'typedef struct {',
    '    int elements[MAX];',
    '    int sommet;',
    '} Pile;',
    '',
    'Pile p;  /* pile auxiliaire de l’exercice */',
  ],
}

const initPile = makeArrayFunction(
  'initPile',
  [
    'void initPile(Pile *p) {',
    '    p->sommet = -1;',
    '}',
  ],
  {
    entry: 0,
    reset: '    p->sommet = -1;',
    end: -1,
  },
)

const pileVide = makeArrayFunction(
  'pileVide',
  [
    'int pileVide(Pile p) {',
    '    return (p.sommet == -1);',
    '}',
  ],
  {
    entry: 0,
    test: '    return (p.sommet == -1);',
    end: -1,
  },
)

const pilePleine = makeArrayFunction(
  'pilePleine',
  [
    'int pilePleine(Pile p) {',
    '    return (p.sommet == MAX - 1);',
    '}',
  ],
  {
    entry: 0,
    test: '    return (p.sommet == MAX - 1);',
    end: -1,
  },
)

const empiler = makeArrayFunction(
  'empiler',
  [
    'void empiler(Pile *p, int valeur) {',
    '    if (pilePleine(*p)) {',
    '        printf("Pile pleine\\n");',
    '        return;',
    '    }',
    '    p->sommet++;',
    '    p->elements[p->sommet] = valeur;',
    '}',
  ],
  {
    entry: 0,
    ifPleine: '    if (pilePleine(*p)) {',
    printfFull: '        printf("Pile pleine\\n");',
    returnFull: '        return;',
    endIfFull: '    }',
    increment: '    p->sommet++;',
    write: '    p->elements[p->sommet] = valeur;',
    end: -1,
  },
)

const depiler = makeArrayFunction(
  'depiler',
  [
    'int depiler(Pile *p) {',
    '    if (pileVide(*p)) {',
    '        return -1;',
    '    }',
    '    int valeur = p->elements[p->sommet];',
    '    p->sommet--;',
    '    return valeur;',
    '}',
  ],
  {
    entry: 0,
    ifVide: '    if (pileVide(*p)) {',
    returnError: '        return -1;',
    endIfVide: '    }',
    read: '    int valeur = p->elements[p->sommet];',
    decrement: '    p->sommet--;',
    returnValue: '    return valeur;',
    end: -1,
  },
)

const sommetPile = makeArrayFunction(
  'sommetPile',
  [
    'int sommetPile(Pile p) {',
    '    if (pileVide(p)) {',
    '        return -1;',
    '    }',
    '    return p.elements[p.sommet];',
    '}',
  ],
  {
    entry: 0,
    ifVide: '    if (pileVide(p)) {',
    returnError: '        return -1;',
    endIfVide: '    }',
    returnValue: '    return p.elements[p.sommet];',
    end: -1,
  },
)

const afficherPile = makeArrayFunction(
  'afficherPile',
  [
    'void afficherPile(Pile p) {',
    '    int i = 0;',
    '    while (i <= p.sommet) {',
    '        printf("%d ", p.elements[i]);',
    '        i++;',
    '    }',
    '    printf("\\n");',
    '}',
  ],
  {
    entry: 0,
    declI: '    int i = 0;',
    whileCond: '    while (i <= p.sommet) {',
    printf: '        printf("%d ", p.elements[i]);',
    increment: '        i++;',
    endWhile: '    }',
    newline: '    printf("\\n");',
    end: -1,
  },
)

const empilerCopie = makeArrayFunction(
  'empilerCopie',
  [
    'void empilerCopie(Pile *p, int numero) {',
    '    empiler(p, numero);',
    '}',
  ],
  {
    entry: 0,
    call: '    empiler(p, numero);',
    end: -1,
  },
)

const corrigerCopie = makeArrayFunction(
  'corrigerCopie',
  [
    'void corrigerCopie(Pile *p) {',
    '    int numero = depiler(p);',
    '    if (numero != -1) {',
    '        printf("Correction de la copie %d\\n", numero);',
    '    }',
    '}',
  ],
  {
    entry: 0,
    call: '    int numero = depiler(p);',
    ifCorrect: '    if (numero != -1) {',
    printf: '        printf("Correction de la copie %d\\n", numero);',
    endIf: '    }',
    end: -1,
  },
)

const parenthesesEquilibrees = makeArrayFunction(
  'parenthesesEquilibrees',
  [
    'int parenthesesEquilibrees(const char *texte) {',
    '    initPile(&p);',
    '    for (int i = 0; texte[i] != \'\\0\'; i++) {',
    '        if (texte[i] == \'(\') {',
    '            empiler(&p, texte[i]);',
    '        } else if (texte[i] == \')\') {',
    '            if (pileVide(p)) {',
    '                return 0;',
    '            }',
    '            depiler(&p);',
    '        }',
    '    }',
    '',
    '    return pileVide(p);',
    '}',
  ],
  {
    entry: 0,
    callInit: '    initPile(&p);',
    forCond: '    for (int i = 0; texte[i] != \'\\0\'; i++) {',
    ifOpen: '        if (texte[i] == \'(\') {',
    push: '            empiler(&p, texte[i]);',
    elseClose: '        } else if (texte[i] == \')\') {',
    ifEmptyClose: '            if (pileVide(p)) {',
    returnInvalid: '                return 0;',
    endIfEmptyClose: '            }',
    pop: '            depiler(&p);',
    endClose: '        }',
    endLoop: '    }',
    returnResult: '    return pileVide(p);',
    end: -1,
  },
)

export const pileFunctions: FunctionCode[] = [
  initPile,
  pileVide,
  pilePleine,
  empiler,
  depiler,
  sommetPile,
  afficherPile,
  empilerCopie,
  corrigerCopie,
  parenthesesEquilibrees,
]

export const pileCode = collectArrayCode(pileFunctions)
export const pileLabels = collectArrayLabels(pileFunctions)
