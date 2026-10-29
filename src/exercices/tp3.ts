import type { Exercise } from './types'

/**
 * TP 3 — Somme de deux grands nombres.
 *
 * The statements keep the professor's numbering (questions 1 to 5). The common
 * capacity (`MAX_PAQUETS = 8`) is an explicit choice because the handout asks
 * for `pilePleine` on a dynamic stack without giving a maximum.
 */
export const tp3Exercise: Exercise = {
  id: 'tp3-somme-grands-nombres',
  title: 'TP 3 — Somme de deux grands nombres',
  chapter: 3,
  intro:
    'L’objectif est d’écrire un programme qui additionne deux grands nombres entiers. Chaque nombre est lu sous forme de chaîne de caractères, puis chargé par paquets de 4 chiffres dans une pile dynamique.\n\n' +
    '```c\n' +
    'typedef struct ElementPile {\n' +
    '    int Paquet;\n' +
    '    struct ElementPile *Precedent;\n' +
    '} Element;\n\n' +
    'typedef struct {\n' +
    '    Element *Sommet;\n' +
    '    int Npaquets;\n' +
    '} GrandNombre;\n\n' +
    'GrandNombre Nombre1, Nombre2, Somme;\n' +
    'char ch1[30];\n' +
    'char ch2[30];\n' +
    '```\n\n' +
    'Le sommet de chaque pile contient le paquet le moins significatif (unités, milliers, etc.). Les fonctions sont paramétrées par un pointeur vers la pile afin de pouvoir traiter plusieurs nombres.',
  questions: [
    {
      id: 'ex1-q1',
      title: 'Question 1',
      statement:
        'Écrire les fonctions `initialiser`, `pileVide`, `pilePleine`, `empiler` et `depiler` associées à une pile.\n\n' +
        'N.B. : paramétrer ces fonctions pour qu’elles soient appelées pour plusieurs piles.\n\n' +
        'Une pile est représentée par la structure `GrandNombre` (sommet + nombre de paquets). L’énoncé ne fixe aucune capacité : pour une pile dynamique, `pilePleine` a besoin d’une limite explicite. Le corrigé utilise `MAX_PAQUETS = 8`, ce qui couvre les 29 chiffres de `ch[30]` et la retenue finale de la somme.',
      hints: [
        '`pileVide` teste simplement `Sommet == NULL`.',
        '`empiler` alloue un `Element`, le relie à l’ancien sommet puis met à jour `Npaquets`.',
        '`depiler` renvoie le paquet du sommet et libère l’élément avec `free`.',
      ],
      solutionCode: String.raw`#include <stdio.h>
#include <stdlib.h>

#define MAX_PAQUETS 8

typedef struct ElementPile {
    int Paquet;
    struct ElementPile *Precedent;
} Element;

typedef struct {
    Element *Sommet;
    int Npaquets;
} GrandNombre;

void initialiser(GrandNombre *N)
{
    N->Sommet = NULL;
    N->Npaquets = 0;
}

int pileVide(const GrandNombre *N)
{
    return N->Sommet == NULL;
}

int pilePleine(const GrandNombre *N)
{
    return N->Npaquets >= MAX_PAQUETS;
}

void empiler(GrandNombre *N, int paquet)
{
    Element *nouveau;

    if (pilePleine(N)) {
        fprintf(stderr, "Pile pleine\n");
        exit(EXIT_FAILURE);
    }

    nouveau = malloc(sizeof(*nouveau));
    if (nouveau == NULL) {
        fprintf(stderr, "Mémoire insuffisante\n");
        exit(EXIT_FAILURE);
    }

    nouveau->Paquet = paquet;
    nouveau->Precedent = N->Sommet;
    N->Sommet = nouveau;
    N->Npaquets = N->Npaquets + 1;
}

int depiler(GrandNombre *N)
{
    Element *sommet;
    int paquet;

    if (pileVide(N)) {
        fprintf(stderr, "Pile vide\n");
        exit(EXIT_FAILURE);
    }

    sommet = N->Sommet;
    paquet = sommet->Paquet;
    N->Sommet = sommet->Precedent;
    free(sommet);
    N->Npaquets = N->Npaquets - 1;

    return paquet;
}
`,
      solutionNotes:
        'La capacité `MAX_PAQUETS` est ajoutée par le corrigé : sans elle, `pilePleine` ne peut pas être définie pour une pile dynamique. `empiler` vérifie lui-même la capacité, ainsi aucun appelant ne peut dépasser la limite.',
    },
    {
      id: 'ex1-q2',
      title: 'Question 2',
      statement:
        'Écrire la fonction `remplir(char *ch, GrandNombre *N)` qui permet de lire et charger une chaîne de caractères représentant le grand nombre par paquets de 4 chiffres dans la pile d’entiers.\n\n' +
        'La chaîne peut contenir des espaces ou un saut de ligne autour du nombre. Les paquets sont pris en partant de la droite : pour `1234567890`, la pile reçoit `7890`, puis `3456`, puis `12`, le sommet étant `7890`.',
      hints: [
        'Parcourez la chaîne de la fin vers le début pour former les paquets.',
        'Un paquet vaut `chiffre × 1 + chiffre × 10 + chiffre × 100 + chiffre × 1000`.',
        'Le paquet le plus à droite doit être empilé en premier pour se retrouver au sommet.',
      ],
      solutionCode: String.raw`/* Les types et fonctions de la question 1 sont supposés définis. */

static int estChiffre(char c)
{
    return c >= '0' && c <= '9';
}

void remplir(char *ch, GrandNombre *N)
{
    int debut = 0;
    int fin = 0;
    int i;

    initialiser(N);

    while (ch[debut] == ' ' || ch[debut] == '\t' || ch[debut] == '\n') {
        debut++;
    }

    while (ch[fin] != '\0') {
        fin++;
    }

    while (fin > debut && (ch[fin - 1] == ' ' || ch[fin - 1] == '\t' ||
                           ch[fin - 1] == '\n' || ch[fin - 1] == '\r')) {
        fin--;
    }

    if (debut == fin) {
        fprintf(stderr, "Nombre vide\n");
        exit(EXIT_FAILURE);
    }

    for (i = debut; i < fin; i++) {
        if (!estChiffre(ch[i])) {
            fprintf(stderr, "Caractère invalide : %c\n", ch[i]);
            exit(EXIT_FAILURE);
        }
    }

    i = fin;
    while (i > debut) {
        int valeur = 0;
        int poids = 1;
        int stop = (i - 4 > debut) ? i - 4 : debut;

        while (i > stop) {
            i--;
            valeur = valeur + (ch[i] - '0') * poids;
            poids = poids * 10;
        }

        empiler(N, valeur);
    }
}
`,
      solutionNotes:
        'Les paquets sont construits de droite à gauche, donc le premier paquet empilé est celui des unités. Les zéros à gauche d’un paquet ne sont pas perdus : ils sont restitués par `afficher` avec le format `%04d`. La validation refuse une chaîne vide ou un caractère qui n’est pas un chiffre.',
    },
    {
      id: 'ex1-q3',
      title: 'Question 3',
      statement:
        'Écrire la fonction `somme(GrandNombre *N1, GrandNombre *N2, GrandNombre *S)` qui permet d’additionner deux grands nombres chargés chacun dans une pile.\n\n' +
        'L’addition se fait paquet par paquet, du moins significatif au plus significatif, avec propagation de la retenue.',
      hints: [
        'Dépilez un paquet de chaque pile à chaque tour.',
        'La retenue vaut `total / 10000` ; le paquet à empiler vaut `total % 10000`.',
        'Après la dernière paire de paquets, il peut rester une retenue à empiler.',
      ],
      solutionCode: String.raw`/* Les types et fonctions des questions 1 et 2 sont supposés définis. */

void somme(GrandNombre *N1, GrandNombre *N2, GrandNombre *S)
{
    int retenue = 0;

    initialiser(S);

    while (!pileVide(N1) || !pileVide(N2) || retenue != 0) {
        int total = retenue;

        if (!pileVide(N1)) {
            total = total + depiler(N1);
        }
        if (!pileVide(N2)) {
            total = total + depiler(N2);
        }

        retenue = total / 10000;
        empiler(S, total % 10000);
    }
}
`,
      solutionNotes:
        'Les deux piles d’entrée sont consommées par `depiler`. La pile `S` est construite du paquet le moins significatif vers le plus significatif, comme N1 et N2. La condition `retenue != 0` ajoute le paquet final lorsque la somme produit une retenue supplémentaire.',
    },
    {
      id: 'ex1-q4',
      title: 'Question 4',
      statement:
        'Écrire la fonction `afficher(GrandNombre *N)` qui permet d’afficher correctement un grand nombre entier chargé dans une pile d’entiers.\n\n' +
        'Le sommet contient le paquet le moins significatif : l’affichage doit commencer par le paquet du fond de la pile. Les paquets intermédiaires doivent conserver leurs zéros à gauche.',
      hints: [
        'Une fonction récursive peut descendre jusqu’au fond de la pile avant d’imprimer.',
        'Le paquet du fond s’imprime sans zéros de remplissage.',
        'Tous les autres paquets s’impriment avec `%04d`.',
      ],
      solutionCode: String.raw`/* Les types et fonctions des questions précédentes sont supposés définis. */

static void afficherPaquets(const Element *element)
{
    if (element == NULL) {
        return;
    }

    afficherPaquets(element->Precedent);

    if (element->Precedent == NULL) {
        printf("%d", element->Paquet);
    } else {
        printf("%04d", element->Paquet);
    }
}

void afficher(GrandNombre *N)
{
    if (pileVide(N)) {
        printf("0\n");
        return;
    }

    afficherPaquets(N->Sommet);
    printf("\n");
}
`,
      solutionNotes:
        'La récursion descend jusqu’au fond de la pile, puis imprime au retour : le paquet le plus significatif est donc affiché en premier. Les paquets suivants sont complétés à 4 chiffres, ce qui conserve les zéros internes comme dans `100000001`.',
    },
    {
      id: 'ex1-q5',
      title: 'Question 5',
      statement:
        'Écrire la fonction `main()` dont on trouve la lecture des deux grands nombres (`ch1` et `ch2`) et l’affichage du résultat de leur somme.\n\n' +
        'Le programme complet doit déclarer les variables globales `Nombre1`, `Nombre2`, `Somme`, `ch1` et `ch2`, appeler `remplir` pour chaque nombre, puis `somme` et `afficher`.',
      hints: [
        '`scanf("%29s", ch1)` lit au plus 29 caractères et laisse la place du `\\0` dans `ch1[30]`.',
        'Appelez `remplir(ch1, &Nombre1)` puis `remplir(ch2, &Nombre2)`.',
        'Après `somme(&Nombre1, &Nombre2, &Somme)`, affichez la pile `Somme`.',
      ],
      solutionCode: String.raw`/* Les types et fonctions des questions 1 à 4 sont supposés définis. */

GrandNombre Nombre1, Nombre2, Somme;
char ch1[30];
char ch2[30];

int main(void)
{
    printf("Premier grand nombre : ");
    if (scanf("%29s", ch1) != 1) {
        fprintf(stderr, "Lecture impossible\n");
        return EXIT_FAILURE;
    }

    printf("Deuxième grand nombre : ");
    if (scanf("%29s", ch2) != 1) {
        fprintf(stderr, "Lecture impossible\n");
        return EXIT_FAILURE;
    }

    remplir(ch1, &Nombre1);
    remplir(ch2, &Nombre2);

    somme(&Nombre1, &Nombre2, &Somme);

    printf("Somme : ");
    afficher(&Somme);

    return EXIT_SUCCESS;
}
`,
      solutionNotes:
        '`%29s` protège le tableau `ch[30]`. Dans un programme complet, on peut ajouter une fonction `detruire` qui dépile chaque pile avant de quitter ; les allocations de ce TP restent volontairement proches de l’énoncé.',
    },
  ],
}
