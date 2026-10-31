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
      simulation: {
        title: 'Primitives d’une pile dynamique',
        intro:
          'On suit initialiser, pileVide, pilePleine, empiler et depiler sur une petite pile de paquets.',
        frames: [
          {
            title: 'initialiser(&N)',
            detail:
              'Le sommet reçoit NULL et le compteur Npaquets vaut 0 : la pile ne contient aucun paquet.',
            stacks: [{ label: 'N', packets: [] }],
            vars: [
              { name: 'Sommet', value: 'NULL' },
              { name: 'Npaquets', value: '0' },
            ],
          },
          {
            title: 'empiler(&N, 7890)',
            detail:
              'malloc alloue un nœud, Paquet reçoit 7890, Precedent reçoit l’ancien sommet (NULL), puis Sommet pointe sur ce nœud.',
            stacks: [
              {
                label: 'N',
                packets: [7890],
                hint: 'Le nœud 7890 est le sommet et son Precedent vaut NULL.',
              },
            ],
            vars: [{ name: 'Npaquets', value: '1' }],
          },
          {
            title: 'empiler(&N, 3456)',
            detail:
              'Le nouveau nœud 3456 devient le sommet ; son Precedent pointe vers 7890. 3456 sera donc dépilé en premier.',
            stacks: [{ label: 'N', packets: [3456, 7890] }],
            vars: [{ name: 'Npaquets', value: '2' }],
          },
          {
            title: 'pilePleine(&N)',
            detail:
              'Npaquets (2) est inférieur à MAX_PAQUETS (8) : la fonction renvoie 0. Cette limite est ajoutée par le corrigé.',
            stacks: [{ label: 'N', packets: [3456, 7890] }],
            vars: [
              { name: 'Npaquets', value: '2' },
              { name: 'MAX_PAQUETS', value: '8' },
              { name: 'pilePleine', value: 'faux (0)' },
            ],
          },
          {
            title: 'depiler(&N) → 3456',
            detail:
              'On mémorise le paquet du sommet, Sommet passe sur Precedent, le nœud est libéré et Npaquets est décrémenté.',
            stacks: [
              {
                label: 'N',
                packets: [7890],
                hint: 'Le nœud 3456 a été libéré ; 7890 redevient le sommet.',
              },
            ],
            vars: [{ name: 'Npaquets', value: '1' }],
          },
          {
            title: 'pileVide(&N)',
            detail:
              'Sommet n’est pas NULL : la pile contient encore 7890, donc pileVide renvoie 0.',
            stacks: [{ label: 'N', packets: [7890] }],
            vars: [{ name: 'pileVide', value: 'faux (0)' }],
          },
        ],
      },
    },
    {
      id: 'ex1-q2',
      title: 'Question 2',
      statement:
        'Écrire la fonction `remplir(char *ch, GrandNombre *N)` qui permet de lire et charger une chaîne de caractères représentant le grand nombre par paquets de 4 chiffres dans la pile d’entiers.\n\n' +
        'La chaîne peut contenir des espaces ou un saut de ligne autour du nombre. Le découpage se fait par groupes de 4 chiffres en partant de la droite, mais les paquets sont empilés du plus significatif au moins significatif : pour `1234567890`, la pile reçoit `12`, puis `3456`, puis `7890`, le sommet étant `7890`.',
      hints: [
        'Le premier paquet (le plus à gauche) peut contenir moins de 4 chiffres.',
        'Parcourez la chaîne de gauche à droite, par groupes de 4 chiffres.',
        'Empilez d’abord le paquet le plus significatif : le paquet des unités, empilé en dernier, se retrouve au sommet.',
      ],
      solutionCode: String.raw`/* Les types et fonctions de la question 1 sont supposés définis. */

static int estChiffre(char c)
{
    return c >= '0' && c <= '9';
}

static int paquetDepuis(const char *ch, int debut, int fin)
{
    int valeur = 0;
    int i;

    for (i = debut; i < fin; i++) {
        valeur = valeur * 10 + (ch[i] - '0');
    }

    return valeur;
}

void remplir(char *ch, GrandNombre *N)
{
    int debut = 0;
    int fin = 0;
    int reste;
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

    reste = (fin - debut) % 4;
    i = debut;

    if (reste != 0) {
        empiler(N, paquetDepuis(ch, i, i + reste));
        i = i + reste;
    }

    while (i < fin) {
        empiler(N, paquetDepuis(ch, i, i + 4));
        i = i + 4;
    }
}
`,
      solutionNotes:
        'Les paquets sont construits de gauche à droite. Le paquet des unités est empilé en dernier, donc il se retrouve au sommet : c’est l’ordre attendu par `somme` et `afficher`. Les zéros à gauche d’un paquet ne sont pas perdus : ils sont restitués par `afficher` avec le format `%04d`. La validation refuse une chaîne vide ou un caractère qui n’est pas un chiffre.',
      simulation: {
        title: 'remplir : découper la chaîne en paquets',
        intro:
          'La chaîne 1234567890 est découpée par groupes de 4 chiffres, puis empilée du paquet le plus significatif au moins significatif.',
        frames: [
          {
            title: 'Lire la chaîne',
            detail:
              'Après avoir ignoré les espaces, la chaîne contient 10 chiffres. Le premier groupe à gauche peut être incomplet.',
            digits: {
              label: 'ch = "1234567890"',
              groups: ['12', '3456', '7890'],
              active: 0,
              hint: '10 chiffres → un paquet de 2 chiffres, puis deux paquets de 4. On commence par le paquet le plus à gauche.',
            },
            stacks: [{ label: 'N', packets: [] }],
          },
          {
            title: 'Premier paquet : 12',
            detail:
              'On empile d’abord le paquet le plus significatif, 12. Il restera au fond de la pile.',
            digits: { label: 'ch', groups: ['12', '3456', '7890'], active: 0 },
            stacks: [{ label: 'N', packets: [12] }],
            vars: [{ name: 'Npaquets', value: '1' }],
          },
          {
            title: 'Deuxième paquet : 3456',
            detail: 'On empile 3456 : il se place au-dessus de 12.',
            digits: { label: 'ch', groups: ['12', '3456', '7890'], active: 1 },
            stacks: [{ label: 'N', packets: [3456, 12] }],
            vars: [{ name: 'Npaquets', value: '2' }],
          },
          {
            title: 'Troisième paquet : 7890',
            detail:
              'On empile 7890 en dernier : il devient le sommet. C’est le paquet des unités, donc le moins significatif.',
            digits: { label: 'ch', groups: ['12', '3456', '7890'], active: 2 },
            stacks: [
              {
                label: 'N',
                packets: [7890, 3456, 12],
                hint: 'Sommet = 7890 (unités) ; fond = 12 (paquet le plus significatif).',
              },
            ],
            vars: [{ name: 'Npaquets', value: '3' }],
          },
          {
            title: 'Pile prête pour la somme',
            detail:
              'La pile se lit du sommet vers le fond : 7890, 3456, 12. C’est exactement l’ordre attendu par somme et afficher.',
            stacks: [{ label: 'N', packets: [7890, 3456, 12] }],
            vars: [{ name: 'Nombre', value: '1234567890' }],
          },
        ],
      },
    },
    {
      id: 'ex1-q3',
      title: 'Question 3',
      statement:
        'Écrire la fonction `somme(GrandNombre *N1, GrandNombre *N2, GrandNombre *S)` qui permet d’additionner deux grands nombres chargés chacun dans une pile.\n\n' +
        'L’addition se fait paquet par paquet, du moins significatif au plus significatif, avec propagation de la retenue. La pile `S` doit respecter la même convention que `N1` et `N2` : son sommet contient le paquet des unités.',
      hints: [
        'Dépilez un paquet de chaque pile à chaque tour.',
        'La retenue vaut `total / 10000` ; le paquet à empiler vaut `total % 10000`.',
        'Les unités sont dépilées en premier : une pile temporaire reçoit donc les paquets du moins significatif au plus significatif. Transférez-la ensuite dans `S` pour remettre les unités au sommet.',
        'Après la dernière paire de paquets, il peut rester une retenue à empiler.',
      ],
      solutionCode: String.raw`/* Les types et fonctions des questions 1 et 2 sont supposés définis. */

void somme(GrandNombre *N1, GrandNombre *N2, GrandNombre *S)
{
    GrandNombre inverse;
    int retenue = 0;

    initialiser(S);
    initialiser(&inverse);

    while (!pileVide(N1) || !pileVide(N2) || retenue != 0) {
        int total = retenue;

        if (!pileVide(N1)) {
            total = total + depiler(N1);
        }
        if (!pileVide(N2)) {
            total = total + depiler(N2);
        }

        retenue = total / 10000;
        empiler(&inverse, total % 10000);
    }

    while (!pileVide(&inverse)) {
        empiler(S, depiler(&inverse));
    }
}
`,
      solutionNotes:
        'Les deux piles d’entrée sont consommées par `depiler`. Comme on commence par les unités, les paquets résultat sont d’abord empilés dans une pile temporaire : son sommet contient le paquet le plus significatif. Le transfert final les reverse dans `S`, donc le sommet de `S` redevient le paquet des unités, comme dans `N1` et `N2`. La condition `retenue != 0` ajoute le paquet final lorsque la somme produit une retenue supplémentaire.',
      simulation: {
        title: 'somme : addition paquet par paquet',
        intro:
          'On additionne 1234567890 et 9876543210. Les paquets sont dépilés du sommet (unités) vers le fond, avec propagation de la retenue, puis le résultat est transféré dans S.',
        frames: [
          {
            title: 'initialiser(S)',
            detail:
              'Les piles résultat et temporaire sont vides et la retenue vaut 0. Les deux opérandes sont prêts, sommet = paquet des unités.',
            stacks: [
              { label: 'N1', packets: [7890, 3456, 12] },
              { label: 'N2', packets: [3210, 7654, 98] },
              { label: 'S', packets: [] },
            ],
            carry: 0,
          },
          {
            title: 'Unités : 7890 + 3210',
            detail:
              '7890 + 3210 + 0 = 11100. On empile 11100 % 10000 = 1100 dans la pile temporaire et la retenue devient 1. Les deux sommets sont dépilés.',
            stacks: [
              { label: 'N1', packets: [3456, 12] },
              { label: 'N2', packets: [7654, 98] },
              { label: 'T', packets: [1100] },
            ],
            carry: 1,
            vars: [
              { name: 'total', value: '11100' },
              { name: 'paquet', value: '1100' },
            ],
          },
          {
            title: 'Milliers : 3456 + 7654 + 1',
            detail:
              '3456 + 7654 + 1 = 11111. On empile 1111 dans la pile temporaire et la retenue reste à 1.',
            stacks: [
              { label: 'N1', packets: [12] },
              { label: 'N2', packets: [98] },
              { label: 'T', packets: [1111, 1100] },
            ],
            carry: 1,
            vars: [
              { name: 'total', value: '11111' },
              { name: 'paquet', value: '1111' },
            ],
          },
          {
            title: 'Tête : 12 + 98 + 1',
            detail:
              '12 + 98 + 1 = 111. On empile 111 dans la pile temporaire et la retenue retombe à 0. Les deux piles d’entrée sont maintenant vides.',
            stacks: [
              { label: 'N1', packets: [] },
              { label: 'N2', packets: [] },
              { label: 'T', packets: [111, 1111, 1100] },
            ],
            carry: 0,
            vars: [
              { name: 'total', value: '111' },
              { name: 'paquet', value: '111' },
            ],
          },
          {
            title: 'Fin de la boucle',
            detail:
              'N1 et N2 sont vides et la retenue vaut 0 : la boucle s’arrête. La pile temporaire contient le résultat complet, du plus significatif (sommet 111) au moins significatif (fond 1100).',
            stacks: [{ label: 'T', packets: [111, 1111, 1100] }],
            carry: 0,
          },
          {
            title: 'Transférer T dans S',
            detail:
              'On dépile T (111, puis 1111, puis 1100) et on empile chaque paquet dans S. Les unités 1100 remontent au sommet : S respecte la même convention que N1 et N2.',
            stacks: [
              { label: 'T', packets: [] },
              {
                label: 'S',
                packets: [1100, 1111, 111],
                hint: 'Sommet = 1100 (unités) ; fond = 111 (paquet le plus significatif).',
              },
            ],
          },
          {
            title: 'Vérification',
            detail:
              'En lisant S du fond vers le sommet, on obtient 111 | 1111 | 1100, soit 11 111 111 100. afficher peut maintenant descendre jusqu’au fond et imprimer au retour.',
            stacks: [{ label: 'S', packets: [1100, 1111, 111] }],
            vars: [
              { name: '1234567890 + 9876543210', value: '11111111100' },
            ],
          },
        ],
      },
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
      simulation: {
        title: 'afficher : descendre puis imprimer au retour',
        intro:
          'On affiche la pile S = 1100 → 1111 → 111 (du sommet vers le fond). La récursion descend jusqu’à NULL, puis imprime en remontant.',
        frames: [
          {
            title: 'afficher(&S)',
            detail:
              'afficher appelle afficherPaquets sur le sommet 1100. La sortie est encore vide.',
            stacks: [{ label: 'S', packets: [1100, 1111, 111] }],
            calls: ['afficherPaquets(1100)'],
            output: '',
          },
          {
            title: 'Descendre vers 1111',
            detail:
              'Le nœud 1100 a un Precedent : on descend récursivement vers 1111 avant d’imprimer quoi que ce soit.',
            stacks: [{ label: 'S', packets: [1100, 1111, 111] }],
            calls: ['afficherPaquets(1100)', 'afficherPaquets(1111)'],
            output: '',
          },
          {
            title: 'Descendre vers 111',
            detail: 'On atteint le fond de la pile, le nœud 111.',
            stacks: [{ label: 'S', packets: [1100, 1111, 111] }],
            calls: ['afficherPaquets(1100)', 'afficherPaquets(1111)', 'afficherPaquets(111)'],
            output: '',
          },
          {
            title: 'NULL : remonter',
            detail:
              'Le Precedent du fond vaut NULL : l’appel retourne sans rien imprimer. On remonte vers le nœud 111.',
            stacks: [{ label: 'S', packets: [1100, 1111, 111] }],
            calls: ['afficherPaquets(1100)', 'afficherPaquets(1111)', 'afficherPaquets(111)'],
            output: '',
          },
          {
            title: 'Imprimer le fond : 111',
            detail:
              'Le fond n’a pas de Precedent : on utilise %d, sans zéro de remplissage. La sortie commence par 111.',
            stacks: [{ label: 'S', packets: [1100, 1111, 111] }],
            calls: ['afficherPaquets(1100)', 'afficherPaquets(1111)'],
            output: '111',
          },
          {
            title: 'Imprimer 1111 avec %04d',
            detail:
              'En remontant, 1111 est complété sur 4 chiffres : 1111. La sortie devient 1111111.',
            stacks: [{ label: 'S', packets: [1100, 1111, 111] }],
            calls: ['afficherPaquets(1100)'],
            output: '1111111',
          },
          {
            title: 'Imprimer 1100 avec %04d',
            detail:
              'Le sommet est imprimé en dernier avec %04d. On obtient 111 | 1111 | 1100.',
            stacks: [{ label: 'S', packets: [1100, 1111, 111] }],
            calls: [],
            output: '11111111100',
          },
          {
            title: 'Retour dans afficher',
            detail:
              'afficher ajoute le saut de ligne final. Le grand nombre s’affiche correctement : 11111111100.',
            stacks: [{ label: 'S', packets: [1100, 1111, 111] }],
            calls: [],
            output: '11111111100\n',
          },
        ],
      },
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
      simulation: {
        title: 'main : lire, remplir, additionner, afficher',
        intro:
          'Le programme principal enchaîne la lecture des deux chaînes, le chargement des piles, la somme puis l’affichage du résultat.',
        frames: [
          {
            title: 'scanf("%29s", ch1)',
            detail:
              'On lit le premier nombre dans ch1[30]. %29s limite la lecture à 29 caractères pour garder la place du \\0 final.',
            digits: {
              label: 'ch1',
              groups: ['12', '3456', '7890'],
              active: 0,
              hint: 'Le premier paquet peut être incomplet ; il sera empilé en premier.',
            },
            vars: [
              { name: 'ch1', value: '1234567890' },
              { name: 'ch2', value: '—' },
            ],
          },
          {
            title: 'scanf("%29s", ch2)',
            detail: 'On lit le deuxième nombre dans ch2[30].',
            digits: {
              label: 'ch2',
              groups: ['98', '7654', '3210'],
              active: 0,
              hint: 'Même découpage : un paquet de 2 chiffres, puis deux paquets de 4.',
            },
            vars: [
              { name: 'ch1', value: '1234567890' },
              { name: 'ch2', value: '9876543210' },
            ],
          },
          {
            title: 'remplir(ch1, &Nombre1)',
            detail:
              'remplir découpe ch1 en paquets et les empile du plus significatif au moins significatif. Le sommet de Nombre1 est 7890.',
            stacks: [{ label: 'Nombre1', packets: [7890, 3456, 12] }],
            calls: ['main', 'remplir(ch1, &Nombre1)'],
          },
          {
            title: 'remplir(ch2, &Nombre2)',
            detail:
              'Même traitement pour ch2 : le sommet de Nombre2 est 3210, le paquet des unités.',
            stacks: [
              { label: 'Nombre1', packets: [7890, 3456, 12] },
              { label: 'Nombre2', packets: [3210, 7654, 98] },
            ],
            calls: ['main', 'remplir(ch2, &Nombre2)'],
          },
          {
            title: 'somme(&Nombre1, &Nombre2, &Somme)',
            detail:
              'somme dépile les deux nombres paquet par paquet, construit le résultat dans une pile temporaire puis le transfère dans Somme. Les deux piles d’entrée sont consommées, le sommet de Somme est le paquet des unités.',
            stacks: [
              { label: 'Nombre1', packets: [] },
              { label: 'Nombre2', packets: [] },
              { label: 'Somme', packets: [1100, 1111, 111] },
            ],
            calls: ['main', 'somme(&Nombre1, &Nombre2, &Somme)'],
          },
          {
            title: 'afficher(&Somme)',
            detail:
              'afficher descend jusqu’au fond de Somme puis imprime au retour : 111, 1111, 1100.',
            stacks: [
              { label: 'Nombre1', packets: [] },
              { label: 'Nombre2', packets: [] },
              { label: 'Somme', packets: [1100, 1111, 111] },
            ],
            calls: ['main', 'afficher(&Somme)'],
            output: '11111111100\n',
          },
          {
            title: 'return EXIT_SUCCESS',
            detail:
              'Le programme se termine après avoir affiché la somme des deux grands nombres.',
            output: '11111111100\n',
          },
        ],
      },
    },
  ],
}
