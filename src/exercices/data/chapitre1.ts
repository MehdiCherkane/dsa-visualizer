import type { Exercise } from '../types'

const codeCompter = String.raw`#include <stdio.h>

int compterCaracteres(const char *chaine) {
    const char *p = chaine;
    int nbCar = 0;

    while (*p != '\0') {
        p++;
        nbCar++;
    }
    return nbCar;
}

int main(void) {
    const char *texte = "Structures de donnees";
    printf("La chaine \"%s\" contient %d caracteres.\n", texte, compterCaracteres(texte));
    return 0;
}
`

const codeFib = String.raw`unsigned long Fib(int n) {
    unsigned long resultat;

    if (n < 2) {
        resultat = 1L;
    } else {
        resultat = Fib(n - 1) + Fib(n - 2);
    }
    return resultat;
}
`

const codeFib40 = String.raw`#include <stdio.h>

#define ligne 10

unsigned long Fib(int n) {
    if (n < 2) {
        return 1L;
    }
    return Fib(n - 1) + Fib(n - 2);
}

int main(void) {
    int i = 0;
    unsigned long nombre;

    while (i <= 39) {
        nombre = Fib(i);
        printf("Fib(%d) = %lu\n", i, nombre);
        i++;
        if (i % ligne == 0 && i <= 39) {
            getchar();
        }
    }
    return 0;
}
`

const codeConvertir = String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_CHIFFRES 120
#define MAX_PAQUETS 32
#define TAILLE_PAQUET 4

typedef int tableau[MAX_PAQUETS];

void Convertir(tableau tab, const char *chaine, int *NL) {
    int longueur = (int)strlen(chaine);
    int nombrePaquets = longueur / TAILLE_PAQUET;
    int reste = longueur % TAILLE_PAQUET;
    int i;

    for (i = 0; i < nombrePaquets; i++) {
        int debut = longueur - TAILLE_PAQUET * (i + 1);
        char paquet[TAILLE_PAQUET + 1];

        memcpy(paquet, chaine + debut, TAILLE_PAQUET);
        paquet[TAILLE_PAQUET] = '\0';
        tab[i] = atoi(paquet);
    }
    if (reste != 0) {
        char paquet[TAILLE_PAQUET + 1];

        memcpy(paquet, chaine, (size_t)reste);
        paquet[reste] = '\0';
        tab[nombrePaquets] = atoi(paquet);
        nombrePaquets++;
    }
    *NL = nombrePaquets;
}

int main(void) {
    const char *exemple = "1459812454578123456894512";
    tableau tab;
    int nombrePaquets = 0;
    int i;

    Convertir(tab, exemple, &nombrePaquets);
    printf("Nombre de paquets : %d\n", nombrePaquets);
    for (i = nombrePaquets - 1; i >= 0; i--) {
        printf("%04d ", tab[i]);
    }
    printf("\n");
    return 0;
}
`

const codeSomme = String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_PAQUETS 32
#define TAILLE_PAQUET 4
#define BASE 10000

typedef int tableau[MAX_PAQUETS];

void Convertir(tableau tab, const char *chaine, int *NL) {
    int longueur = (int)strlen(chaine);
    int nombrePaquets = longueur / TAILLE_PAQUET;
    int reste = longueur % TAILLE_PAQUET;
    int i;

    for (i = 0; i < nombrePaquets; i++) {
        int debut = longueur - TAILLE_PAQUET * (i + 1);
        char paquet[TAILLE_PAQUET + 1];

        memcpy(paquet, chaine + debut, TAILLE_PAQUET);
        paquet[TAILLE_PAQUET] = '\0';
        tab[i] = atoi(paquet);
    }
    if (reste != 0) {
        char paquet[TAILLE_PAQUET + 1];

        memcpy(paquet, chaine, (size_t)reste);
        paquet[reste] = '\0';
        tab[nombrePaquets] = atoi(paquet);
        nombrePaquets++;
    }
    *NL = nombrePaquets;
}

void Somme(int N, int M, int *taille, const tableau t1, const tableau t2, tableau t3) {
    int retenue = 0;
    int i;

    for (i = 0; i < N; i++) {
        int s = t1[i] + t2[i] + retenue;

        t3[i] = s % BASE;
        retenue = s / BASE;
    }
    for (i = N; i < M; i++) {
        int s = t2[i] + retenue;

        t3[i] = s % BASE;
        retenue = s / BASE;
    }
    *taille = M;
    if (retenue != 0) {
        t3[M] = retenue;
        *taille = M + 1;
    }
}

int main(void) {
    const char *nombre1 = "1459812454578123456894512";
    const char *nombre2 = "59292545326446";
    tableau tab1, tab2, tab_som;
    int N1 = 0;
    int N2 = 0;
    int taille = 0;
    int i;

    Convertir(tab1, nombre1, &N1);
    Convertir(tab2, nombre2, &N2);
    if (N1 <= N2) {
        Somme(N1, N2, &taille, tab1, tab2, tab_som);
    } else {
        Somme(N2, N1, &taille, tab2, tab1, tab_som);
    }
    printf("La somme =\n");
    for (i = taille - 1; i >= 0; i--) {
        if (i == taille - 1) {
            printf("%d", tab_som[i]);
        } else {
            printf("%04d", tab_som[i]);
        }
    }
    printf("\n");
    return 0;
}
`

const codeAfficher = String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_PAQUETS 32
#define TAILLE_PAQUET 4
#define BASE 10000

typedef int tableau[MAX_PAQUETS];

void Convertir(tableau tab, const char *chaine, int *NL) {
    int longueur = (int)strlen(chaine);
    int nombrePaquets = longueur / TAILLE_PAQUET;
    int reste = longueur % TAILLE_PAQUET;
    int i;

    for (i = 0; i < nombrePaquets; i++) {
        int debut = longueur - TAILLE_PAQUET * (i + 1);
        char paquet[TAILLE_PAQUET + 1];

        memcpy(paquet, chaine + debut, TAILLE_PAQUET);
        paquet[TAILLE_PAQUET] = '\0';
        tab[i] = atoi(paquet);
    }
    if (reste != 0) {
        char paquet[TAILLE_PAQUET + 1];

        memcpy(paquet, chaine, (size_t)reste);
        paquet[reste] = '\0';
        tab[nombrePaquets] = atoi(paquet);
        nombrePaquets++;
    }
    *NL = nombrePaquets;
}

void Somme(int N, int M, int *taille, const tableau t1, const tableau t2, tableau t3) {
    int retenue = 0;
    int i;

    for (i = 0; i < N; i++) {
        int s = t1[i] + t2[i] + retenue;

        t3[i] = s % BASE;
        retenue = s / BASE;
    }
    for (i = N; i < M; i++) {
        int s = t2[i] + retenue;

        t3[i] = s % BASE;
        retenue = s / BASE;
    }
    *taille = M;
    if (retenue != 0) {
        t3[M] = retenue;
        *taille = M + 1;
    }
}

void Afficher(int taille, const tableau t) {
    int i;

    if (taille <= 0) {
        printf("0\n");
        return;
    }
    printf("%d", t[taille - 1]);
    for (i = taille - 2; i >= 0; i--) {
        printf("%04d", t[i]);
    }
    printf("\n");
}

int main(void) {
    const char *nombre1 = "1459812454578123456894512";
    const char *nombre2 = "59292545326446";
    tableau tab1, tab2, tab_som;
    int N1 = 0;
    int N2 = 0;
    int taille = 0;

    Convertir(tab1, nombre1, &N1);
    Convertir(tab2, nombre2, &N2);
    if (N1 <= N2) {
        Somme(N1, N2, &taille, tab1, tab2, tab_som);
    } else {
        Somme(N2, N1, &taille, tab2, tab1, tab_som);
    }
    printf("La somme =\n");
    Afficher(taille, tab_som);
    return 0;
}
`

const codeMain = String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_CHIFFRES 120
#define MAX_PAQUETS 32
#define TAILLE_PAQUET 4
#define BASE 10000

typedef int tableau[MAX_PAQUETS];

void Convertir(tableau tab, const char *chaine, int *NL) {
    int longueur = (int)strlen(chaine);
    int nombrePaquets = longueur / TAILLE_PAQUET;
    int reste = longueur % TAILLE_PAQUET;
    int i;

    for (i = 0; i < nombrePaquets; i++) {
        int debut = longueur - TAILLE_PAQUET * (i + 1);
        char paquet[TAILLE_PAQUET + 1];

        memcpy(paquet, chaine + debut, TAILLE_PAQUET);
        paquet[TAILLE_PAQUET] = '\0';
        tab[i] = atoi(paquet);
    }
    if (reste != 0) {
        char paquet[TAILLE_PAQUET + 1];

        memcpy(paquet, chaine, (size_t)reste);
        paquet[reste] = '\0';
        tab[nombrePaquets] = atoi(paquet);
        nombrePaquets++;
    }
    *NL = nombrePaquets;
}

void Somme(int N, int M, int *taille, const tableau t1, const tableau t2, tableau t3) {
    int retenue = 0;
    int i;

    for (i = 0; i < N; i++) {
        int s = t1[i] + t2[i] + retenue;

        t3[i] = s % BASE;
        retenue = s / BASE;
    }
    for (i = N; i < M; i++) {
        int s = t2[i] + retenue;

        t3[i] = s % BASE;
        retenue = s / BASE;
    }
    *taille = M;
    if (retenue != 0) {
        t3[M] = retenue;
        *taille = M + 1;
    }
}

void Afficher(int taille, const tableau t) {
    int i;

    if (taille <= 0) {
        printf("0\n");
        return;
    }
    printf("%d", t[taille - 1]);
    for (i = taille - 2; i >= 0; i--) {
        printf("%04d", t[i]);
    }
    printf("\n");
}

static int lireGrandNombre(const char *invite, char *chaine, int capacite) {
    size_t longueur;
    int caractere;
    int i;

    printf("%s", invite);
    if (fgets(chaine, capacite, stdin) == NULL) {
        chaine[0] = '\0';
        return 0;
    }
    longueur = strlen(chaine);
    if (longueur > 0 && chaine[longueur - 1] == '\n') {
        chaine[longueur - 1] = '\0';
        longueur--;
    } else {
        while ((caractere = getchar()) != '\n' && caractere != EOF) {
            /* vider le reste de la ligne trop longue */
        }
        if (longueur >= (size_t)capacite - 1) {
            return 0;
        }
    }
    if (longueur == 0) {
        return 0;
    }
    for (i = 0; i < (int)longueur; i++) {
        if (chaine[i] < '0' || chaine[i] > '9') {
            return 0;
        }
    }
    return 1;
}

int main(void) {
    char ch1[MAX_CHIFFRES + 2];
    char ch2[MAX_CHIFFRES + 2];
    tableau tab1, tab2, tab_som;
    int N1 = 0;
    int N2 = 0;
    int taille = 0;

    if (!lireGrandNombre("Donner un tres grand nombre : ", ch1, (int)sizeof ch1) ||
        !lireGrandNombre("Donner un tres grand nombre : ", ch2, (int)sizeof ch2)) {
        fprintf(stderr, "Saisie invalide : entrez jusqu'a %d chiffres.\n", MAX_CHIFFRES);
        return 1;
    }
    Convertir(tab1, ch1, &N1);
    Convertir(tab2, ch2, &N2);
    if (N1 <= N2) {
        Somme(N1, N2, &taille, tab1, tab2, tab_som);
    } else {
        Somme(N2, N1, &taille, tab2, tab1, tab_som);
    }
    printf("La somme =\n");
    Afficher(taille, tab_som);
    return 0;
}
`

export const chapitre1Exercises: Exercise[] = [
  {
    id: 'chapitre-1-exercice-1',
    title: 'Exercice 1 — Compter les caractères d’une chaîne',
    chapter: 1,
    intro:
      'Une chaîne de caractères en C est un tableau de `char` terminé par le caractère `\'\\0\'`. Le cours propose de la parcourir avec un pointeur plutôt qu’avec un indice.',
    questions: [
      {
        id: 'compter-les-caracteres',
        title: 'Compter les caractères avec un pointeur',
        statement:
          'Écrire une fonction `compterCaracteres` qui reçoit une chaîne et retourne son nombre de caractères, sans utiliser `strlen`. Parcourir la chaîne avec un pointeur `p` et un compteur `nbCar`, et s’arrêter sur le caractère terminateur `\'\\0\'`.',
        hints: [
          'Initialiser `p` avec l’adresse du premier caractère de la chaîne.',
          'Tester `*p != \'\\0\'` avant chaque tour de boucle.',
          'Incrémenter `p` et `nbCar` dans le corps de la boucle.',
        ],
        solutionCode: codeCompter,
        solutionNotes:
          'La boucle s’arrête sur le terminateur : il n’est pas compté. Le pointeur avance d’un caractère à chaque tour, ce qui donne un parcours en O(n).',
      },
    ],
  },
  {
    id: 'chapitre-1-fibonacci',
    title: 'Exercice — Les 40 premiers nombres de Fibonacci',
    chapter: 1,
    intro:
      'La suite est définie par `Fib(0) = 1`, `Fib(1) = 1` et `Fib(n) = Fib(n-1) + Fib(n-2)` pour `n >= 2`. Le sujet fournit le squelette de `main` et demande d’écrire la fonction récursive.',
    questions: [
      {
        id: 'ecrire-fib',
        title: 'Écrire la fonction `Fib`',
        statement:
          'Compléter la fonction récursive `unsigned long Fib(int n)` en respectant la définition du cours. Le cas de base `n < 2` renvoie `1L` ; sinon, la fonction additionne les deux appels précédents.',
        hints: [
          'Le cas de base couvre à la fois `n = 0` et `n = 1`.',
          'Le résultat doit être de type `unsigned long`, comme le demande la signature.',
          'Ne pas oublier de retourner le résultat à la fin de la fonction.',
        ],
        solutionCode: codeFib,
        solutionNotes:
          'La fonction est récursive : chaque appel non terminal en crée deux autres. Le nombre d’appels croît très vite, mais c’est bien la version demandée par le cours.',
      },
      {
        id: 'afficher-fib-40',
        title: 'Afficher les 40 premiers nombres',
        statement:
          'Écrire le programme complet qui affiche `Fib(0)` à `Fib(39)`, une valeur par ligne, en réutilisant la fonction `Fib`. Le sujet propose une pause `getchar()` toutes les 10 lignes.',
        hints: [
          'Faire varier `i` de 0 à 39 avec une boucle `while`.',
          'Afficher un `unsigned long` avec `%lu`.',
          'La pause ne doit pas être déclenchée après la dernière ligne.',
        ],
        solutionCode: codeFib40,
        solutionNotes:
          'Le sujet écrit `%ld` ; `%lu` correspond au type `unsigned long`. La pause `getchar()` attend une entrée : elle est conservée pour respecter le squelette, mais évitée après `Fib(39)`.',
      },
    ],
  },
  {
    id: 'chapitre-1-grands-nombres',
    title: 'Exemple complet — Somme de deux grands entiers',
    chapter: 1,
    intro:
      'On lit deux grands nombres sous forme de chaînes, on les découpe en paquets de 4 chiffres, puis on additionne les paquets avec retenue. Exemple du cours : `1 4598 1245 4578 1234 5689 4512` + `59 2925 4532 6446` = `1 4598 1245 4637 4160 0222 0958`.',
    questions: [
      {
        id: 'convertir-en-paquets',
        title: 'Convertir la chaîne en paquets de 4 chiffres',
        statement:
          'Écrire `Convertir` qui découpe `chaine` en paquets de 4 chiffres en partant de la droite et les range dans `tab`. `*NL` reçoit le nombre de paquets. Le paquet le plus à gauche peut contenir moins de 4 chiffres.',
        hints: [
          'Calculer `longueur = strlen(chaine)`.',
          'Pour le paquet `i`, commencer à `longueur - 4 * (i + 1)`.',
          'Copier chaque paquet dans un buffer terminé par `\'\\0\'` avant d’appeler `atoi`.',
          'Le reste éventuel se place au dernier indice.',
        ],
        solutionCode: codeConvertir,
        solutionNotes:
          'Le code du cours copie 4 caractères dans `char ch4[4]` sans terminateur, puis appelle `atoi` : le comportement n’est pas garanti. Ici, le buffer fait 5 cases et reçoit `\'\\0\'`.',
      },
      {
        id: 'additionner-les-paquets',
        title: 'Additionner les paquets avec retenue',
        statement:
          'Écrire `Somme` qui additionne `t1` (N paquets) et `t2` (M paquets), avec `N <= M`, en propageant la retenue. Le résultat est stocké dans `t3` et `*taille` reçoit sa taille.',
        hints: [
          'Additionner d’abord les N paquets communs.',
          'Recopier les paquets restants de `t2` en ajoutant la retenue.',
          'Si la retenue finale est non nulle, ajouter un paquet supplémentaire.',
        ],
        solutionCode: codeSomme,
        solutionNotes:
          'Le cours écrit `(*taille) = M` avant la boucle et ajoute la retenue à l’indice `M`. On garde la même logique, avec un tableau assez grand pour le paquet de débordement.',
      },
      {
        id: 'afficher-la-somme',
        title: 'Afficher la somme',
        statement:
          'Écrire `Afficher` qui affiche le paquet le plus significatif sans zéros inutiles, puis chaque paquet suivant sur exactement 4 chiffres. Gérer aussi le cas où `taille` vaut 0.',
        hints: [
          'Afficher `t[taille - 1]` avec `%d`.',
          'Afficher les autres paquets avec `%04d`.',
          'Ne pas oublier le retour à la ligne final.',
        ],
        solutionCode: codeAfficher,
        solutionNotes:
          'Le cours reconstruit les zéros avec une série de `if` et `sprintf`. `%04d` fait le même travail en une seule conversion, sans buffer intermédiaire.',
      },
      {
        id: 'lire-et-orchestrer',
        title: 'Lire les nombres et orchestrer le calcul',
        statement:
          'Écrire le `main` complet : lire deux grands nombres avec `fgets`, les convertir, appeler `Somme` en mettant le plus court en premier, puis afficher la somme. Refuser une saisie vide, trop longue ou non numérique.',
        hints: [
          '`fgets` conserve le caractère `\'\\n\'` : il faut le retirer.',
          'Comparer `N1` et `N2` pour choisir l’ordre des deux tableaux.',
          'Afficher un message d’erreur si la lecture échoue.',
        ],
        solutionCode: codeMain,
        solutionNotes:
          'Le cours utilise `gets`, retiré de C11 et dangereux car il ne connaît pas la taille du buffer. `fgets` reçoit une capacité explicite ; les buffers sont terminés par `\'\\0\'` et le tableau garde une case de marge pour la retenue.',
      },
    ],
  },
]
