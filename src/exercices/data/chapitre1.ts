import type { Exercise } from '../types'

const pileBase = String.raw`#include <stdio.h>

#define MAX 5

typedef struct {
    int elements[MAX];
    int sommet;
} Pile;

void initPile(Pile *p) {
    p->sommet = -1;
}

int pileVide(Pile p) {
    return p.sommet == -1;
}

int pilePleine(Pile p) {
    return p.sommet == MAX - 1;
}

void empiler(Pile *p, int valeur) {
    if (pilePleine(*p)) {
        printf("Pile pleine\n");
        return;
    }
    p->sommet++;
    p->elements[p->sommet] = valeur;
}

int depiler(Pile *p) {
    if (pileVide(*p)) {
        return -1;
    }
    int valeur = p->elements[p->sommet];
    p->sommet--;
    return valeur;
}
`

const pileOperations = String.raw`
void empilerCopie(Pile *p, int numero) {
    empiler(p, numero);
}

void corrigerCopie(Pile *p) {
    int numero = depiler(p);
    if (numero != -1) {
        printf("Correction de la copie %d\n", numero);
    }
}
`

const codeEmpilerCopie = pileBase + pileOperations + String.raw`
int main(void) {
    Pile p;
    initPile(&p);

    empilerCopie(&p, 12);
    empilerCopie(&p, 7);
    empilerCopie(&p, 25);
    corrigerCopie(&p);
    corrigerCopie(&p);
    return 0;
}
`

const codeTracePile = pileBase + pileOperations + String.raw`
void afficherPile(const Pile *p) {
    printf("[");
    for (int i = 0; i <= p->sommet; i++) {
        if (i > 0) {
            printf(", ");
        }
        printf("%d", p->elements[i]);
    }
    printf("] sommet = %d\n", p->sommet);
}

int main(void) {
    Pile p;
    initPile(&p);

    printf("1) empilerCopie(12) : ");
    empilerCopie(&p, 12);
    afficherPile(&p);

    printf("2) empilerCopie(7) : ");
    empilerCopie(&p, 7);
    afficherPile(&p);

    printf("3) empilerCopie(25) : ");
    empilerCopie(&p, 25);
    afficherPile(&p);

    printf("4) corrigerCopie() : ");
    corrigerCopie(&p);
    afficherPile(&p);

    printf("5) corrigerCopie() : ");
    corrigerCopie(&p);
    afficherPile(&p);

    return 0;
}
`

const fileBase = String.raw`#include <stdio.h>

#define MAX 5

typedef struct {
    int elements[MAX];
    int av;
    int ar;
} File;

void initFile(File *f) {
    f->av = -1;
    f->ar = -1;
}

int fileVide(File f) {
    return f.av == -1;
}

int filePleine(File f) {
    return (f.ar + 1) % MAX == f.av;
}

void enfiler(File *f, int valeur) {
    if (filePleine(*f)) {
        printf("File pleine\n");
        return;
    }
    f->ar = (f->ar + 1) % MAX;
    if (fileVide(*f)) {
        f->av = f->ar;
    }
    f->elements[f->ar] = valeur;
}

int defiler(File *f) {
    if (fileVide(*f)) {
        return -1;
    }
    int valeur = f->elements[f->av];
    if (f->av == f->ar) {
        f->av = -1;
        f->ar = -1;
    } else {
        f->av = (f->av + 1) % MAX;
    }
    return valeur;
}
`

const fileOperations = String.raw`
void enregistrerArrivee(File *f, int numero) {
    enfiler(f, numero);
}

void guichetSuivant(File *f) {
    int numero = defiler(f);
    if (numero != -1) {
        printf("Guichet : etudiant %d servi\n", numero);
    }
}
`

const codeEnregistrerArrivee = fileBase + fileOperations + String.raw`
int main(void) {
    File f;
    initFile(&f);

    enregistrerArrivee(&f, 65);
    enregistrerArrivee(&f, 66);
    enregistrerArrivee(&f, 67);
    enregistrerArrivee(&f, 68);
    guichetSuivant(&f);
    guichetSuivant(&f);
    return 0;
}
`

const codeTraceFile = fileBase + fileOperations + String.raw`
void afficherFile(File f) {
    printf("av=%d ar=%d [", f.av, f.ar);
    if (!fileVide(f)) {
        int i = f.av;
        while (1) {
            printf("%d", f.elements[i]);
            if (i == f.ar) {
                break;
            }
            printf(", ");
            i = (i + 1) % MAX;
        }
    }
    printf("]\n");
}

int main(void) {
    File f;
    initFile(&f);

    printf("1) enregistrerArrivee(65) : ");
    enregistrerArrivee(&f, 65);
    afficherFile(f);

    printf("2) enregistrerArrivee(66) : ");
    enregistrerArrivee(&f, 66);
    afficherFile(f);

    printf("3) enregistrerArrivee(67) : ");
    enregistrerArrivee(&f, 67);
    afficherFile(f);

    printf("4) enregistrerArrivee(68) : ");
    enregistrerArrivee(&f, 68);
    afficherFile(f);

    printf("5) guichetSuivant() : ");
    guichetSuivant(&f);
    afficherFile(f);

    printf("6) guichetSuivant() : ");
    guichetSuivant(&f);
    afficherFile(f);

    return 0;
}
`

const codeParentheses = String.raw`#include <stdio.h>

#define MAX 100

typedef struct {
    int elements[MAX];
    int sommet;
} Pile;

void initPile(Pile *p) {
    p->sommet = -1;
}

int pileVide(Pile p) {
    return p.sommet == -1;
}

int pilePleine(Pile p) {
    return p.sommet == MAX - 1;
}

void empiler(Pile *p, int valeur) {
    if (pilePleine(*p)) {
        return;
    }
    p->sommet++;
    p->elements[p->sommet] = valeur;
}

int depiler(Pile *p) {
    if (pileVide(*p)) {
        return -1;
    }
    int valeur = p->elements[p->sommet];
    p->sommet--;
    return valeur;
}

int parenthesesEquilibrees(const char *texte) {
    Pile p;
    initPile(&p);

    for (int i = 0; texte[i] != '\0'; i++) {
        if (texte[i] == '(') {
            if (pilePleine(p)) {
                return 0;
            }
            empiler(&p, texte[i]);
        } else if (texte[i] == ')') {
            if (pileVide(p)) {
                return 0;
            }
            depiler(&p);
        }
    }
    return pileVide(p);
}

int main(void) {
    const char *tests[] = {
        "(()())",
        "(()",
        ")(",
        "((a+b)*(c-d))"
    };

    for (int i = 0; i < 4; i++) {
        printf("\"%s\" -> %d\n", tests[i], parenthesesEquilibrees(tests[i]));
    }
    return 0;
}
`

const codeRecupererMax = String.raw`#include <stdio.h>

#define MAX 5

int F[MAX];
int av = -1;
int ar = -1;

void initFile(void) {
    av = -1;
    ar = -1;
}

int fileVide(void) {
    return av == -1;
}

int filePleine(void) {
    return (ar + 1) % MAX == av;
}

void enfiler(int valeur) {
    if (filePleine()) {
        printf("File pleine\n");
        return;
    }
    ar = (ar + 1) % MAX;
    if (fileVide()) {
        av = ar;
    }
    F[ar] = valeur;
}

int defiler(void) {
    if (fileVide()) {
        return -1;
    }
    int valeur = F[av];
    if (av == ar) {
        av = -1;
        ar = -1;
    } else {
        av = (av + 1) % MAX;
    }
    return valeur;
}

int recupererMax(void) {
    if (fileVide()) {
        return -1;
    }
    int n = ((ar - av + MAX) % MAX) + 1;
    int max = F[av];

    for (int i = 0; i < n; i++) {
        int x = defiler();
        if (x > max) {
            max = x;
        }
        enfiler(x);
    }

    int retire = 0;
    for (int i = 0; i < n; i++) {
        int x = defiler();
        if (!retire && x == max) {
            retire = 1;
        } else {
            enfiler(x);
        }
    }
    return max;
}

void afficherFile(void) {
    printf("av=%d ar=%d [", av, ar);
    if (!fileVide()) {
        int i = av;
        while (1) {
            printf("%d", F[i]);
            if (i == ar) {
                break;
            }
            printf(", ");
            i = (i + 1) % MAX;
        }
    }
    printf("]\n");
}

int main(void) {
    initFile();
    enfiler(42);
    enfiler(17);
    enfiler(63);
    enfiler(8);
    enfiler(55);

    printf("File initiale : ");
    afficherFile();

    int max = recupererMax();
    printf("Maximum récupéré : %d\n", max);
    printf("File après retrait : ");
    afficherFile();

    initFile();
    enfiler(5);
    enfiler(1);
    enfiler(5);
    enfiler(2);

    printf("Doublon : maximum = %d\n", recupererMax());
    printf("File restante : ");
    afficherFile();

    return 0;
}
`

export const chapitre1Exercises: Exercise[] = [
  {
    id: 'chapitre-1-piles-files-application',
    title: 'Exercice d’application — Pile de copies et file du guichet',
    chapter: 1,
    intro:
      'Ce premier exercice reprend les deux structures du cours : une pile de copies à corriger (LIFO) et une file circulaire de guichet (FIFO). Les questions 1 et 3 demandent le code ; les questions 2 et 4 demandent la trace des opérations.',
    questions: [
      {
        id: 'pile-copies-code',
        title: 'Écrire `empilerCopie` et `corrigerCopie`',
        statement:
          'Une pile de copies est représentée par la structure `Pile` du cours (`elements[MAX]`, `sommet`). Écrire `empilerCopie(Pile *p, int numero)` qui empile le numéro d’une copie, et `corrigerCopie(Pile *p)` qui dépile la copie du sommet et affiche son numéro. Ne rien afficher si la pile est vide.',
        hints: [
          '`empilerCopie` peut simplement appeler `empiler`.',
          '`corrigerCopie` doit tester la valeur retournée par `depiler` avant d’afficher.',
          'La dernière copie empilée est la première corrigée.',
        ],
        solutionCode: codeEmpilerCopie,
        solutionNotes:
          '`empilerCopie` délègue à `empiler` ; `corrigerCopie` utilise `depiler` et vérifie la sentinelle `-1`. La pile est initialisée avec `sommet = -1`.',
      },
      {
        id: 'pile-copies-trace',
        title: 'Dérouler 3 empilements puis 2 corrections',
        statement:
          'En partant d’une pile vide, dérouler les opérations suivantes : `empilerCopie(12)`, `empilerCopie(7)`, `empilerCopie(25)`, puis `corrigerCopie()` deux fois. Donner à chaque étape le contenu de la pile (bas → haut) et la valeur de `sommet`.',
        hints: [
          '`sommet` vaut -1 quand la pile est vide.',
          'Empiler avance `sommet` avant d’écrire.',
          'Dépiler lit la valeur au sommet puis recule `sommet`.',
        ],
        solutionCode: codeTracePile,
        solutionNotes:
          'Trace attendue : 1) [12], sommet = 0 ; 2) [12, 7], sommet = 1 ; 3) [12, 7, 25], sommet = 2 ; 4) correction de 25 → [12, 7], sommet = 1 ; 5) correction de 7 → [12], sommet = 0. La copie 12 reste au fond de la pile.',
      },
      {
        id: 'file-guichet-code',
        title: 'Écrire `enregistrerArrivee` et `guichetSuivant`',
        statement:
          'Une file circulaire de taille `MAX = 5` représente le guichet d’inscription (`elements[MAX]`, `av`, `ar`). Écrire `enregistrerArrivee(File *f, int numero)` qui enfile un étudiant, et `guichetSuivant(File *f)` qui défile le premier étudiant et affiche son numéro. Ne rien afficher si la file est vide.',
        hints: [
          '`enregistrerArrivee` appelle `enfiler`.',
          '`guichetSuivant` appelle `defiler` et teste la valeur retournée.',
          'La file circulaire utilise `% MAX` pour avancer `av` et `ar`.',
        ],
        solutionCode: codeEnregistrerArrivee,
        solutionNotes:
          '`enfiler` avance `ar` de façon circulaire et place `av` sur le premier élément si la file était vide. `defiler` lit `av`, puis remet `av` et `ar` à `-1` si c’était le dernier élément.',
      },
      {
        id: 'file-guichet-trace',
        title: 'Dérouler 4 arrivées puis 2 départs',
        statement:
          'Toujours avec `MAX = 5`, dérouler `enregistrerArrivee(65)`, `enregistrerArrivee(66)`, `enregistrerArrivee(67)`, `enregistrerArrivee(68)`, puis `guichetSuivant()` deux fois. Donner `av`, `ar` et le contenu de la file après chaque opération.',
        hints: [
          'La file est vide quand `av == -1`.',
          'Après le premier ajout, `av` et `ar` valent 0.',
          'Un départ avance `av` ; si `av == ar`, la file redevient vide.',
        ],
        solutionCode: codeTraceFile,
        solutionNotes:
          'Trace attendue : 1) av = 0, ar = 0, [65] ; 2) av = 0, ar = 1, [65, 66] ; 3) av = 0, ar = 2, [65, 66, 67] ; 4) av = 0, ar = 3, [65, 66, 67, 68] ; 5) départ de 65 → av = 1, ar = 3, [66, 67, 68] ; 6) départ de 66 → av = 2, ar = 3, [67, 68]. FIFO : 65 puis 66 sortent dans l’ordre d’arrivée.',
      },
    ],
  },
  {
    id: 'chapitre-1-parentheses',
    title: 'Exercice 1 — Test de l’équilibre des parenthèses',
    chapter: 1,
    intro:
      'On utilise une pile pour mémoriser les parenthèses ouvrantes rencontrées. À chaque `)`, on dépile une `(` ; si la pile est vide, la chaîne n’est pas équilibrée.',
    questions: [
      {
        id: 'parentheses-equilibrees',
        title: 'Écrire `parenthesesEquilibrees`',
        statement:
          'Écrire une fonction `parenthesesEquilibrees` qui reçoit une chaîne de caractères contenant les parenthèses `(` et `)` et retourne `1` si elles sont bien équilibrées, `0` sinon, en utilisant une pile. Empiler à chaque `(` ; dépiler à chaque `)` ; si la pile est vide au moment de dépiler, ou si elle n’est pas vide à la fin du parcours, les parenthèses ne sont pas équilibrées.',
        hints: [
          'Parcourir la chaîne avec un indice jusqu’au caractère nul.',
          'Ignorer les autres caractères.',
          'Tester `pileVide` avant chaque dépilement.',
          'À la fin, la pile doit être vide.',
        ],
        solutionCode: codeParentheses,
        solutionNotes:
          'Le test `)` sur une pile vide détecte une fermeture orpheline ; le test final détecte une ouverture non fermée. Complexité O(n) en temps et O(n) dans le pire cas pour la pile.',
      },
    ],
  },
  {
    id: 'chapitre-1-max-file',
    title: 'Exercice 2 — Récupération du maximum d’une file',
    chapter: 1,
    intro:
      'La file est circulaire et déclarée globalement avec `F`, `av` et `ar`. Pour récupérer le maximum sans perdre l’ordre FIFO, on fait tourner la file, on repère le maximum, puis on retire une seule occurrence en réenfilant les autres valeurs.',
    questions: [
      {
        id: 'recuperer-max-file',
        title: 'Écrire les opérations de la file et `recupererMax`',
        statement:
          'On considère une file circulaire d’entiers déclarée globalement par un tableau `F` et deux indices `av` et `ar`. Écrire `initFile`, `fileVide`, `filePleine`, `enfiler`, `defiler`, `recupererMax` et `main`. `recupererMax` doit retourner le maximum de la file et le retirer (une seule occurrence), tout en conservant l’ordre FIFO des autres éléments.',
        hints: [
          '`initFile` place `av` et `ar` à -1.',
          '`filePleine` teste `(ar + 1) % MAX == av`.',
          'Dans `enfiler`, si la file était vide, `av` doit rejoindre `ar`.',
          'Dans `defiler`, si `av == ar`, c’était le dernier élément : remettre `av` et `ar` à -1.',
          'Compter les éléments avec `((ar - av + MAX) % MAX) + 1`, puis faire deux tours de rotation.',
        ],
        solutionCode: codeRecupererMax,
        solutionNotes:
          'Le premier tour défile et réenfile chaque valeur pour trouver le maximum. Le second tour réenfile toutes les valeurs sauf la première occurrence du maximum. La file [42, 17, 63, 8, 55] devient [42, 17, 8, 55] et `recupererMax` retourne 63. Avec un doublon, seule la première occurrence du maximum est retirée.',
      },
    ],
  },
]
