import type { Exercise } from '../types'

/* Code C découpé par briques réutilisables */

const codeStructures = String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Structure d'un nœud représentant un étudiant */
typedef struct etudiant {
    int numero;
    char *nom;
    char *prenom;
    float note;
    struct etudiant *suivant;
} NoeudEtudiant;

/* Variables globales de contrôle de la liste */
NoeudEtudiant *debut = NULL;
int nbrEtudiants = 0;
`

const codeInitialiser = codeStructures + String.raw`
void initialiserListe(void) {
    debut = NULL;
    nbrEtudiants = 0;
}
`

const codeAllouerNoeud = codeStructures + String.raw`
NoeudEtudiant* allouerNoeud(int numero, const char *nom, const char *prenom, float note) {
    NoeudEtudiant *nouveau = (NoeudEtudiant *)malloc(sizeof(NoeudEtudiant));
    if (nouveau == NULL) {
        return NULL;
    }

    nouveau->nom = (char *)malloc(strlen(nom) + 1);
    if (nouveau->nom == NULL) {
        free(nouveau);
        return NULL;
    }
    strcpy(nouveau->nom, nom);

    nouveau->prenom = (char *)malloc(strlen(prenom) + 1);
    if (nouveau->prenom == NULL) {
        free(nouveau->nom);
        free(nouveau);
        return NULL;
    }
    strcpy(nouveau->prenom, prenom);

    nouveau->numero = numero;
    nouveau->note = note;
    nouveau->suivant = NULL;

    return nouveau;
}
`

const codeInsererDebut = codeAllouerNoeud + String.raw`
void insererDebut(NoeudEtudiant *nouveau) {
    if (nouveau == NULL) {
        return;
    }
    nouveau->suivant = debut;
    debut = nouveau;
    nbrEtudiants++;
}
`

const codeInsererFin = codeInsererDebut + String.raw`
void insererFin(NoeudEtudiant *nouveau) {
    if (nouveau == NULL) {
        return;
    }
    nouveau->suivant = NULL;

    if (debut == NULL) {
        debut = nouveau;
    } else {
        NoeudEtudiant *courant = debut;
        while (courant->suivant != NULL) {
            courant = courant->suivant;
        }
        courant->suivant = nouveau;
    }
    nbrEtudiants++;
}
`

const codeAfficherListe = codeInsererFin + String.raw`
void afficherListe(void) {
    NoeudEtudiant *courant = debut;

    if (courant == NULL) {
        printf("La liste est vide (0 etudiant).\n");
        return;
    }

    printf("Registre des etudiants (%d inscrit%s) :\n", nbrEtudiants, nbrEtudiants > 1 ? "s" : "");
    printf("-------------------------------------------------------------\n");
    printf("%-8s | %-15s | %-15s | %-6s\n", "Numero", "Nom", "Prenom", "Note");
    printf("-------------------------------------------------------------\n");

    while (courant != NULL) {
        printf("%-8d | %-15s | %-15s | %5.2f\n",
               courant->numero, courant->nom, courant->prenom, courant->note);
        courant = courant->suivant;
    }
    printf("-------------------------------------------------------------\n");
}
`

const codeLibererListe = codeAfficherListe + String.raw`
void libererSousListe(NoeudEtudiant *tete) {
    NoeudEtudiant *courant = tete;
    while (courant != NULL) {
        NoeudEtudiant *temp = courant;
        courant = courant->suivant;
        free(temp->nom);
        free(temp->prenom);
        free(temp);
    }
}

void libererListe(void) {
    libererSousListe(debut);
    debut = NULL;
    nbrEtudiants = 0;
}
`

const codeDiviserClasse = codeLibererListe + String.raw`
void diviserClasse(NoeudEtudiant **admis, int *nbrAdmis,
                   NoeudEtudiant **nonAdmis, int *nbrNonAdmis) {
    *admis = NULL;
    *nonAdmis = NULL;
    *nbrAdmis = 0;
    *nbrNonAdmis = 0;

    NoeudEtudiant *queueAdmis = NULL;
    NoeudEtudiant *queueNonAdmis = NULL;
    NoeudEtudiant *courant = debut;

    while (courant != NULL) {
        NoeudEtudiant *suivant = courant->suivant;
        courant->suivant = NULL;

        if (courant->note >= 10.0f) {
            if (*admis == NULL) {
                *admis = courant;
            } else {
                queueAdmis->suivant = courant;
            }
            queueAdmis = courant;
            (*nbrAdmis)++;
        } else {
            if (*nonAdmis == NULL) {
                *nonAdmis = courant;
            } else {
                queueNonAdmis->suivant = courant;
            }
            queueNonAdmis = courant;
            (*nbrNonAdmis)++;
        }
        courant = suivant;
    }

    /* La liste initiale a ete distribuee dans les deux groupes */
    debut = NULL;
    nbrEtudiants = 0;
}
`

const codeTrierAdmis = codeDiviserClasse + String.raw`
void trierAdmisParMerite(NoeudEtudiant *admis) {
    if (admis == NULL || admis->suivant == NULL) {
        return;
    }

    int permutation;
    do {
        permutation = 0;
        NoeudEtudiant *p = admis;
        while (p->suivant != NULL) {
            /* Classement par ordre de merite : note la plus elevee en tete */
            if (p->note < p->suivant->note) {
                int tempNumero = p->numero;
                char *tempNom = p->nom;
                char *tempPrenom = p->prenom;
                float tempNote = p->note;

                p->numero = p->suivant->numero;
                p->nom = p->suivant->nom;
                p->prenom = p->suivant->prenom;
                p->note = p->suivant->note;

                p->suivant->numero = tempNumero;
                p->suivant->nom = tempNom;
                p->suivant->prenom = tempPrenom;
                p->suivant->note = tempNote;

                permutation = 1;
            }
            p = p->suivant;
        }
    } while (permutation);
}
`

const codeProgrammeMain = codeTrierAdmis + String.raw`
static void afficherGroupe(const NoeudEtudiant *tete, int nbr, const char *titre) {
    const NoeudEtudiant *courant = tete;

    printf("%s (%d etudiant%s) :\n", titre, nbr, nbr > 1 ? "s" : "");
    if (courant == NULL) {
        printf("  (aucun etudiant)\n");
        return;
    }

    printf("-------------------------------------------------------------\n");
    printf("%-8s | %-15s | %-15s | %-6s\n", "Numero", "Nom", "Prenom", "Note");
    printf("-------------------------------------------------------------\n");

    while (courant != NULL) {
        printf("%-8d | %-15s | %-15s | %5.2f\n",
               courant->numero, courant->nom, courant->prenom, courant->note);
        courant = courant->suivant;
    }
    printf("-------------------------------------------------------------\n");
}

int main(void) {
    printf("=== 1. Initialisation de la liste ===\n");
    initialiserListe();

    printf("\n=== 2. Enregistrement des etudiants ===\n");
    insererDebut(allouerNoeud(101, "El Amrani", "Yassine", 14.50f));
    insererFin(allouerNoeud(102, "Bennani", "Salma", 8.75f));
    insererDebut(allouerNoeud(103, "Chraibi", "Mehdi", 16.00f));
    insererFin(allouerNoeud(104, "Idrissi", "Amina", 9.25f));
    insererFin(allouerNoeud(105, "Tazi", "Omar", 12.00f));

    printf("\n=== 3. Affichage du registre complet ===\n");
    afficherListe();

    printf("\n=== 4. Division de la classe (admis / non admis) ===\n");
    NoeudEtudiant *admis = NULL;
    NoeudEtudiant *nonAdmis = NULL;
    int nbrAdmis = 0;
    int nbrNonAdmis = 0;
    diviserClasse(&admis, &nbrAdmis, &nonAdmis, &nbrNonAdmis);

    printf("Resultat de la repartition : %d admis, %d non admis.\n\n", nbrAdmis, nbrNonAdmis);

    printf("=== 5. Tri des etudiants admis par ordre de merite ===\n");
    trierAdmisParMerite(admis);

    afficherGroupe(admis, nbrAdmis, "Etudiants Admis (par ordre de merite)");
    printf("\n");
    afficherGroupe(nonAdmis, nbrNonAdmis, "Etudiants Non Admis (session de rattrapage)");

    printf("\n=== 6. Liberation complete de la memoire ===\n");
    libererSousListe(admis);
    libererSousListe(nonAdmis);
    printf("Toute la memoire a ete liberee proprement. Fin du programme.\n");

    return 0;
}
`

export const chapitre2Exercises: Exercise[] = [
  {
    id: 'chapitre-2-registre-etudiants-lsc',
    title: 'TP 2 — Gestion des étudiants par liste simplement chaînée',
    chapter: 2,
    intro:
      'On souhaite représenter les informations des étudiants d’une classe sous forme d’une **Liste Simplement Chaînée (LSC)**. Chaque nœud de la liste représente un étudiant caractérisé par quatre champs : `numero` (`int`), `nom` (`char*`), `prenom` (`char*`) et une `note` (`float`).\n\n' +
      'Pour avoir le contrôle de la liste, on sauvegarde les deux éléments suivants :\n\n' +
      '- `debut` : un pointeur vers le premier nœud de la liste (`NULL` si la liste est vide).\n' +
      '- `nbrEtudiants` : un entier comptabilisant le nombre d’étudiants inscrits dans la classe.\n\n' +
      'Ce TP met en pratique l’allocation dynamique en C (`malloc`, `free`), la manipulation des pointeurs, le parcours itératif, le partitionnement de listes et le tri par ordre de mérite.',
    questions: [
      {
        id: 'tp2-q1-structures-variables-globales',
        title: 'Question 1 — Structures de données et variables globales',
        statement:
          'Donner les structures de données à utiliser pour implémenter la liste simplement chaînée et les variables globales à déclarer.\n\n' +
          'Chaque étudiant comporte un numéro entier, un nom (`char*`), un prénom (`char*`) et une note réelle (`float`). Le contrôle de la liste est assuré par le pointeur `debut` et l’entier `nbrEtudiants`.',
        hints: [
          'Déclarez `struct etudiant` avec ses quatre champs de données plus un pointeur `struct etudiant *suivant`.',
          'Utilisez `typedef` pour créer l’alias `NoeudEtudiant`.',
          'Déclarez les deux variables globales `NoeudEtudiant *debut = NULL;` et `int nbrEtudiants = 0;`.',
        ],
        solutionCode: codeStructures,
        solutionNotes:
          'La structure `NoeudEtudiant` sépare clairement les données de l’étudiant (`numero`, `nom`, `prenom`, `note`) du pointeur de liaison `suivant`. L’utilisation de `char*` pour le nom et le prénom permet une gestion dynamique de la mémoire, évitant le gaspillage d’un tableau statique à taille fixe. `debut` est initialisé à `NULL` (sentinelle de fin de liste) et `nbrEtudiants` à `0`.',
        simulation: {
          title: 'État initial du registre',
          intro: 'Déclaration des variables globales de contrôle avant toute opération.',
          frames: [
            {
              title: 'Déclaration des variables de contrôle',
              detail:
                'La variable globale debut pointe sur NULL (la liste est vide) et nbrEtudiants vaut 0.',
              vars: [
                { name: 'debut', value: 'NULL' },
                { name: 'nbrEtudiants', value: '0' },
              ],
            },
          ],
        },
      },
      {
        id: 'tp2-q2-initialisation-liste',
        title: 'Question 2 — Initialisation de la liste chaînée',
        statement:
          'Écrire une fonction `initialiserListe` qui permet d’initialiser la liste chaînée.',
        hints: [
          'Affectez `NULL` au pointeur global `debut`.',
          'Remettez le compteur `nbrEtudiants` à 0.',
        ],
        solutionCode: codeInitialiser,
        solutionNotes:
          'L’initialisation explicite garantit que la liste démarre dans un état propre et reproductible. Si la fonction recevait les paramètres en arguments plutôt que par variables globales, il faudrait passer l’adresse du pointeur `NoeudEtudiant **pDebut` et l’adresse du compteur `int *pNbr`.',
        simulation: {
          title: 'Initialisation du registre',
          intro: 'Mise à zéro de la liste et réinitialisation des pointeurs.',
          frames: [
            {
              title: 'Avant initialisation',
              detail: 'Les variables peuvent contenir des valeurs indéterminées en mémoire.',
              vars: [
                { name: 'debut', value: '0x00000000 (NULL)' },
                { name: 'nbrEtudiants', value: '0' },
              ],
            },
            {
              title: 'Appel initialiserListe()',
              detail: 'debut reçoit explicitement NULL et nbrEtudiants est fixé à 0.',
              vars: [
                { name: 'debut', value: 'NULL' },
                { name: 'nbrEtudiants', value: '0' },
              ],
              calls: ['initialiserListe()'],
            },
          ],
        },
      },
      {
        id: 'tp2-q3-allocation-noeud-etudiant',
        title: 'Question 3 — Allocation et remplissage d’un nœud',
        statement:
          'Écrire une fonction `allouerNoeud` qui alloue la mémoire d’un nouveau nœud et place les informations d’un étudiant à l’intérieur (`numero`, `nom`, `prenom`, `note`).\n\n' +
          'La fonction doit retourner l’adresse de ce nouveau nœud en cas de succès et `NULL` en cas d’échec.',
        hints: [
          'Allouez d’abord la structure avec `malloc(sizeof(NoeudEtudiant))`.',
          'Testez si l’allocation a réussi avant d’accéder aux champs.',
          'Allouez dynamiquement la mémoire pour `nom` et `prenom` avec `malloc(strlen(...) + 1)` puis copiez avec `strcpy`.',
          'En cas d’échec sur l’une des allocations, libérez ce qui a déjà été alloué et retournez `NULL`.',
          'Initialisez toujours `nouveau->suivant = NULL`.',
        ],
        solutionCode: codeAllouerNoeud,
        solutionNotes:
          'Une allocation robuste ne doit jamais fuiter de mémoire : si `malloc` réussit pour `nouveau` et pour `nom` mais échoue pour `prenom`, la fonction libère `nom` et `nouveau` avant de renvoyer `NULL`. La fonction prend des paramètres `const char *` pour autoriser les littéraux de chaînes.',
        simulation: {
          title: 'Allocation d’un nœud étudiant',
          intro: 'Trace pas à pas de l’allocation dynamique en tas pour l’étudiant 101 (El Amrani Yassine, 14.50).',
          frames: [
            {
              title: '1) malloc(sizeof(NoeudEtudiant))',
              detail: 'Le système réserve le bloc mémoire pour le nœud à l’adresse 0x7fa010.',
              vars: [
                { name: 'nouveau', value: '0x7fa010' },
                { name: 'taille nœud', value: 'sizeof(NoeudEtudiant)' },
              ],
            },
            {
              title: '2) Allocation et copie du nom et prénom',
              detail:
                'malloc(strlen("El Amrani") + 1) et malloc(strlen("Yassine") + 1) allouent les chaînes copiées avec strcpy.',
              vars: [
                { name: 'nouveau->nom', value: '"El Amrani"' },
                { name: 'nouveau->prenom', value: '"Yassine"' },
              ],
            },
            {
              title: '3) Renseignement des champs numériques et pointeur',
              detail: 'numero = 101, note = 14.50, et suivant est initialisé à NULL.',
              vars: [
                { name: 'nouveau->numero', value: '101' },
                { name: 'nouveau->note', value: '14.50' },
                { name: 'nouveau->suivant', value: 'NULL' },
              ],
            },
            {
              title: '4) Retour de l’adresse',
              detail: 'allouerNoeud retourne le pointeur 0x7fa010 prêt à être inséré dans la liste.',
              vars: [{ name: 'valeur retournée', value: '0x7fa010 (succès)' }],
            },
          ],
        },
      },
      {
        id: 'tp2-q4-insertion-debut',
        title: 'Question 4 — Insertion au début de la liste',
        statement:
          'Écrire une fonction `insererDebut` qui permet d’insérer un nœud au début de la liste.',
        hints: [
          'Vérifiez d’abord que le pointeur `nouveau` n’est pas `NULL`.',
          'Raccordez le nœud : `nouveau->suivant = debut;`.',
          'Déplacez la tête : `debut = nouveau;`.',
          'Incrémentez le compteur : `nbrEtudiants++;`.',
          'Cette opération s’exécute en temps constant O(1).',
        ],
        solutionCode: codeInsererDebut,
        solutionNotes:
          'L’insertion en tête fonctionne de manière identique que la liste soit vide (`debut == NULL`) ou non vide. L’ordre des instructions est crucial : il faut brancher `nouveau->suivant` sur `debut` avant de rediriger `debut` sur `nouveau`, sinon l’ancienne tête est perdue.',
        simulation: {
          title: 'Insertion en tête de liste',
          intro: 'Ajout de l’étudiant 101 au début d’une liste initialement vide.',
          frames: [
            {
              title: 'État initial avant insertion',
              detail: 'debut vaut NULL, nbrEtudiants vaut 0.',
              vars: [
                { name: 'debut', value: 'NULL' },
                { name: 'nbrEtudiants', value: '0' },
                { name: 'nouveau', value: '0x7fa010 (101 - El Amrani)' },
              ],
            },
            {
              title: 'Raccordement : nouveau->suivant = debut',
              detail: 'Le champ suivant de nouveau reçoit NULL (ancienne valeur de debut).',
              vars: [
                { name: 'nouveau->suivant', value: 'NULL' },
                { name: 'debut', value: 'NULL' },
              ],
            },
            {
              title: 'Mise à jour de la tête : debut = nouveau',
              detail: 'debut pointe désormais sur le nouvel étudiant 101.',
              vars: [
                { name: 'debut', value: '0x7fa010 (101)' },
                { name: 'nbrEtudiants', value: '0' },
              ],
            },
            {
              title: 'Incrément : nbrEtudiants++',
              detail: 'Le nombre total d’étudiants inscrits passe à 1. Complexité O(1).',
              vars: [
                { name: 'debut', value: '0x7fa010 (101)' },
                { name: 'nbrEtudiants', value: '1' },
              ],
            },
          ],
        },
      },
      {
        id: 'tp2-q5-insertion-fin',
        title: 'Question 5 — Insertion à la fin de la liste',
        statement:
          'Écrire une fonction `insererFin` qui permet d’insérer un nœud à la fin de la liste.',
        hints: [
          'Vérifiez la validité de `nouveau` et assurez-vous que `nouveau->suivant = NULL`.',
          'Si la liste est vide (`debut == NULL`), l’insertion à la fin est équivalente à `debut = nouveau`.',
          'Sinon, parcourez avec `NoeudEtudiant *courant = debut` jusqu’à trouver le dernier nœud (`courant->suivant == NULL`).',
          'Raccordez le dernier nœud : `courant->suivant = nouveau`.',
          'N’oubliez pas d’incrémenter `nbrEtudiants`.',
        ],
        solutionCode: codeInsererFin,
        solutionNotes:
          'Contrairement à l’insertion en tête qui est en O(1), l’insertion en queue sans pointeur de fin nécessite un parcours complet de la liste pour localiser le dernier élément, ce qui prend un temps proportionnel à la taille de la liste O(n). La condition d’arrêt de la boucle est bien `courant->suivant != NULL` et non `courant != NULL`.',
        simulation: {
          title: 'Insertion en fin de liste',
          intro: 'Ajout de l’étudiant 102 (Bennani Salma) en queue après l’étudiant 101.',
          frames: [
            {
              title: '1) État initial de la liste',
              detail: 'La liste contient un seul étudiant : 101 (El Amrani).',
              vars: [
                { name: 'debut', value: '101' },
                { name: 'nbrEtudiants', value: '1' },
                { name: 'nouveau', value: '102 (Bennani)' },
              ],
            },
            {
              title: '2) Parcours jusqu’au dernier nœud',
              detail: 'courant = debut. Comme courant->suivant est NULL, courant est déjà sur le dernier nœud.',
              vars: [
                { name: 'courant', value: '101' },
                { name: 'courant->suivant', value: 'NULL' },
              ],
            },
            {
              title: '3) Raccordement : courant->suivant = nouveau',
              detail: 'Le nœud 101 est maintenant relié au nœud 102.',
              vars: [
                { name: 'courant->suivant', value: '102 (Bennani)' },
                { name: 'nouveau->suivant', value: 'NULL' },
              ],
            },
            {
              title: '4) Mise à jour du compteur : nbrEtudiants++',
              detail: 'Le registre contient maintenant 2 étudiants chaînés : [101] → [102] → NULL.',
              vars: [
                { name: 'debut', value: '101' },
                { name: 'nbrEtudiants', value: '2' },
              ],
            },
          ],
        },
      },
      {
        id: 'tp2-q6-affichage-iteratif',
        title: 'Question 6 — Affichage itératif des étudiants',
        statement:
          'Écrire une fonction `afficherListe` qui permet d’afficher les informations (numéro, nom, prénom et note) des étudiants de la liste (version itérative).',
        hints: [
          'Initialisez un pointeur de parcours : `NoeudEtudiant *courant = debut;`.',
          'Utilisez une boucle `while (courant != NULL)`.',
          'Affichez les informations de `courant` avec `printf` en formatant les colonnes.',
          'Avancez impérativement avec `courant = courant->suivant;` à chaque itération.',
          'Ne modifiez jamais la variable globale `debut` pendant le parcours !',
        ],
        solutionCode: codeAfficherListe,
        solutionNotes:
          'Le parcours itératif d’une LSC est un idiome fondamental. On utilise un pointeur local `courant` pour préserver intacte la tête de liste `debut`. L’utilisation de formats comme `%-8d`, `%-15s` et `%5.2f` permet d’obtenir un alignement vertical élégant sous forme de tableau.',
        simulation: {
          title: 'Affichage itératif du registre',
          intro: 'Parcours des étudiants inscrits avec impression formatée dans la console.',
          frames: [
            {
              title: '1) Début du parcours',
              detail: 'courant est positionné sur debut (étudiant 103).',
              vars: [
                { name: 'courant', value: '103 (Chraibi Mehdi)' },
                { name: 'note', value: '16.00' },
              ],
              output: 'Registre des etudiants (2 inscrits) :\nNumero   | Nom             | Prenom          | Note\n',
            },
            {
              title: '2) Affichage de l’étudiant 103 et avancée',
              detail: 'printf affiche 103, puis courant = courant->suivant avance vers 101.',
              vars: [
                { name: 'courant', value: '101 (El Amrani Yassine)' },
                { name: 'note', value: '14.50' },
              ],
              output:
                'Registre des etudiants (2 inscrits) :\nNumero   | Nom             | Prenom          | Note\n103      | Chraibi         | Mehdi           | 16.00\n',
            },
            {
              title: '3) Affichage de l’étudiant 101 et fin',
              detail: 'printf affiche 101, puis courant passe à NULL. La boucle s’arrête.',
              vars: [{ name: 'courant', value: 'NULL' }],
              output:
                'Registre des etudiants (2 inscrits) :\nNumero   | Nom             | Prenom          | Note\n103      | Chraibi         | Mehdi           | 16.00\n101      | El Amrani       | Yassine         | 14.50\n-------------------------------------------------------------\n',
            },
          ],
        },
      },
      {
        id: 'tp2-q7-liberation-memoire',
        title: 'Question 7 — Libération de la mémoire de la liste',
        statement:
          'Écrire une fonction `libererListe` qui libère toute la mémoire utilisée par la liste chaînée.',
        hints: [
          'Pour chaque nœud, conservez son adresse dans une variable temporaire : `NoeudEtudiant *temp = courant;`.',
          'Avancez sur le nœud suivant AVANT de libérer : `courant = courant->suivant;`.',
          'Libérez d’abord les chaînes allouées : `free(temp->nom);` et `free(temp->prenom);`.',
          'Libérez ensuite le nœud lui-même : `free(temp);`.',
          'Réinitialisez `debut = NULL;` et `nbrEtudiants = 0;`.',
        ],
        solutionCode: codeLibererListe,
        solutionNotes:
          'Piège classique d’utilisation après libération (*use-after-free*) : si on exécutait `free(courant)` avant de faire `courant = courant->suivant`, l’accès à `courant->suivant` serait indéfini. La sauvegarde dans `temp` permet de sécuriser l’avancée. Chaque bloc alloué par `malloc` (`nom`, `prenom`, nœud) doit avoir son `free` correspondant.',
        simulation: {
          title: 'Désallocation dynamique complète',
          intro: 'Libération successive des nœuds et des chaînes de caractères allouées en tas.',
          frames: [
            {
              title: '1) État initial avant libération',
              detail: 'La liste contient 2 étudiants. courant pointe sur debut (103).',
              vars: [
                { name: 'debut', value: '103' },
                { name: 'nbrEtudiants', value: '2' },
                { name: 'courant', value: '103' },
              ],
            },
            {
              title: '2) Sauvegarde de temp et avancée',
              detail: 'temp = 103, courant avance vers 101.',
              vars: [
                { name: 'temp', value: '103' },
                { name: 'courant', value: '101' },
              ],
            },
            {
              title: '3) Libération de temp (nœud 103)',
              detail: 'free(temp->nom), free(temp->prenom) et free(temp) restituent la mémoire au système.',
              vars: [
                { name: 'temp libéré', value: '103 (Chraibi)' },
                { name: 'courant', value: '101' },
              ],
            },
            {
              title: '4) Libération du nœud 101 et remise à zéro',
              detail: 'Le nœud 101 est libéré. debut repasse à NULL et nbrEtudiants repasse à 0.',
              vars: [
                { name: 'debut', value: 'NULL' },
                { name: 'nbrEtudiants', value: '0' },
              ],
            },
          ],
        },
      },
      {
        id: 'tp2-q8-division-classe-admis-non-admis',
        title: 'Question 8 — Division de la classe (admis / non admis)',
        statement:
          'Écrire une fonction `diviserClasse` qui permet de diviser la classe en deux groupes :\n\n' +
          '- Le 1ᵉʳ groupe contiendra les étudiants admis (ceux qui ont une note ≥ 10).\n' +
          '- Le 2ᵉ groupe contiendra les non admis (note < 10).',
        hints: [
          'Initialisez deux listes distinctes : `admis = NULL` et `nonAdmis = NULL`.',
          'Parcourez la liste principale en décrochant chaque nœud (`courant->suivant = NULL`).',
          'Selon la condition `courant->note >= 10.0f`, rattachez le nœud à la liste des admis ou des non admis.',
          'Maintenez un pointeur sur la fin de chaque sous-liste (`queueAdmis`, `queueNonAdmis`) pour insérer en queue en O(1) et préserver l’ordre d’origine.',
          'Mettez à jour les compteurs `nbrAdmis` et `nbrNonAdmis`, puis réinitialisez la liste d’origine (`debut = NULL`, `nbrEtudiants = 0`).',
        ],
        solutionCode: codeDiviserClasse,
        solutionNotes:
          'Cette implémentation réalise un partitionnement *in-place* : aucun nœud n’est réalloué, seuls les pointeurs `suivant` sont redistribués. L’utilisation de pointeurs de queue (`queueAdmis`, `queueNonAdmis`) garantit un algorithme linéaire en O(n) tout en conservant la stabilité (l’ordre relatif initial des étudiants est préservé).',
        simulation: {
          title: 'Partitionnement de la promotion',
          intro: 'Séparation d’un registre mixte en deux sous-listes (admis ≥ 10 et non admis < 10).',
          frames: [
            {
              title: '1) État avant division',
              detail: 'La liste contient 4 étudiants : 103 (16.0), 102 (8.75), 101 (14.5), 104 (9.25).',
              vars: [
                { name: 'admis', value: 'NULL (0)' },
                { name: 'nonAdmis', value: 'NULL (0)' },
                { name: 'courant', value: '103 (16.00)' },
              ],
            },
            {
              title: '2) Nœud 103 (note 16.00 >= 10)',
              detail: '103 est rattaché à la liste admis. queueAdmis pointe sur 103. nbrAdmis = 1.',
              vars: [
                { name: 'admis', value: '[103 (16.0)]' },
                { name: 'nonAdmis', value: 'NULL' },
                { name: 'courant suivant', value: '102 (8.75)' },
              ],
            },
            {
              title: '3) Nœud 102 (note 8.75 < 10)',
              detail: '102 est rattaché à nonAdmis. queueNonAdmis pointe sur 102. nbrNonAdmis = 1.',
              vars: [
                { name: 'admis', value: '[103 (16.0)]' },
                { name: 'nonAdmis', value: '[102 (8.75)]' },
                { name: 'courant suivant', value: '101 (14.5)' },
              ],
            },
            {
              title: '4) Nœuds 101 (14.5) et 104 (9.25)',
              detail: '101 rejoint admis après 103 ; 104 rejoint nonAdmis après 102.',
              vars: [
                { name: 'admis', value: '[103] → [101] (2)' },
                { name: 'nonAdmis', value: '[102] → [104] (2)' },
                { name: 'debut initial', value: 'NULL (vidé)' },
              ],
            },
          ],
        },
      },
      {
        id: 'tp2-q9-tri-merite-admis',
        title: 'Question 9 — Tri des étudiants admis par ordre de mérite',
        statement:
          'Écrire une fonction `trierAdmisParMerite` qui permet de trier les étudiants admis par ordre de mérite (de la note la plus élevée à la plus faible).',
        hints: [
          'L’ordre de mérite correspond à un tri décroissant sur le champ `note`.',
          'Si la liste est vide ou comporte un seul élément, aucun tri n’est nécessaire.',
          'On peut appliquer un tri à bulles ou un tri par sélection.',
          'Sur une liste simplement chaînée, échanger les valeurs (`numero`, `nom`, `prenom`, `note`) entre deux nœuds consécutifs est simple, sûr et évite la complexité du réordonnancement des pointeurs.',
          'Répétez les passes tant qu’au moins une permutation a eu lieu.',
        ],
        solutionCode: codeTrierAdmis,
        solutionNotes:
          'Sur une LSC, permuter les données (`int`, pointeurs de chaînes `char*`, `float`) conserve l’intégrité du maillage de la liste tout en réordonnant les enregistrements. Les pointeurs de texte `p->nom` et `p->prenom` sont échangés par simple copie d’adresses sans réallocation mémoire. Complexité en O(n²) dans le pire cas et O(n) si la liste est déjà ordonnée.',
        simulation: {
          title: 'Tri par ordre de mérite (notes décroissantes)',
          intro: 'Organisation de la liste des admis du meilleur résultat au résultat le plus faible.',
          frames: [
            {
              title: '1) Liste des admis avant le tri',
              detail: 'La liste contient : [101 : 14.50] → [103 : 16.00] → [105 : 12.00].',
              vars: [
                { name: 'nœud 1', value: '101 (14.50)' },
                { name: 'nœud 2', value: '103 (16.00)' },
                { name: 'nœud 3', value: '105 (12.00)' },
              ],
            },
            {
              title: '2) Comparaison : 14.50 < 16.00 (inversion)',
              detail:
                '16.00 est supérieur à 14.50 : on permute les données entre les deux nœuds pour placer le plus méritant en tête.',
              vars: [
                { name: 'nœud 1 (après permutation)', value: '103 (16.00)' },
                { name: 'nœud 2 (après permutation)', value: '101 (14.50)' },
              ],
            },
            {
              title: '3) Comparaison suivante : 14.50 >= 12.00',
              detail: 'L’ordre est déjà respecté (14.50 >= 12.00), aucune permutation nécessaire.',
              vars: [
                { name: 'nœud 2', value: '101 (14.50)' },
                { name: 'nœud 3', value: '105 (12.00)' },
              ],
            },
            {
              title: '4) Résultat final du classement',
              detail:
                'Liste finale triée par ordre de mérite : [103 : 16.00] → [101 : 14.50] → [105 : 12.00].',
              vars: [
                { name: '1er du mérite', value: '103 - Chraibi (16.00)' },
                { name: '2e du mérite', value: '101 - El Amrani (14.50)' },
                { name: '3e du mérite', value: '105 - Tazi (12.00)' },
              ],
            },
          ],
        },
      },
      {
        id: 'tp2-q10-fonction-main',
        title: 'Question 10 — Programme principal de test (main)',
        statement:
          'Écrire la fonction `main` pour tester les différentes fonctions :\n\n' +
          '1. Initialiser la liste.\n' +
          '2. Insérer plusieurs étudiants au début et à la fin (avec des notes variées : < 10 et ≥ 10).\n' +
          '3. Afficher la liste complète.\n' +
          '4. Diviser la classe en deux groupes (admis et non admis).\n' +
          '5. Trier les admis par ordre de mérite.\n' +
          '6. Afficher les deux listes obtenues.\n' +
          '7. Libérer toute la mémoire allouée.',
        hints: [
          'Créez un jeu d’essai complet avec au moins 4 à 5 étudiants.',
          'Vérifiez la bonne alternance des insertions en tête (`insererDebut`) et en queue (`insererFin`).',
          'Affichez des bannières et en-têtes explicites entre chaque étape pour observer clairement les transformations.',
          'Libérez les sous-listes `admis` et `nonAdmis` avec `libererSousListe` avant de quitter.',
          'Terminez par `return 0;`.',
        ],
        solutionCode: codeProgrammeMain,
        solutionNotes:
          'Ce programme de test valide l’ensemble du cycle de vie du registre : allocation dynamique, chaînage, parcours itératif, partitionnement stable en deux sous-listes, tri interne et libération totale sans fuite de mémoire. Il compile sans avertissement avec `gcc -Wall -Wextra -pedantic -std=c99`.',
        simulation: {
          title: 'Exécution du programme complet',
          intro: 'Sortie console produite par le programme main exécutant l’ensemble des étapes.',
          frames: [
            {
              title: '1) Initialisation et insertions',
              detail: '5 étudiants sont insérés dans la classe (3 au-dessus de 10 et 2 en dessous).',
              vars: [
                { name: 'inscrits', value: '5' },
                { name: 'fonctions testées', value: 'allouerNoeud, insererDebut, insererFin' },
              ],
              output: '=== 1. Initialisation de la liste ===\n\n=== 2. Enregistrement des etudiants ===\n',
            },
            {
              title: '2) Affichage de la liste complète',
              detail: 'La liste brute chaînée affiche les 5 étudiants.',
              output:
                '=== 3. Affichage du registre complet ===\nRegistre des etudiants (5 inscrits) :\n-------------------------------------------------------------\nNumero   | Nom             | Prenom          | Note  \n-------------------------------------------------------------\n103      | Chraibi         | Mehdi           | 16.00\n101      | El Amrani       | Yassine         | 14.50\n102      | Bennani         | Salma           |  8.75\n104      | Idrissi         | Amina           |  9.25\n105      | Tazi            | Omar            | 12.00\n-------------------------------------------------------------\n',
            },
            {
              title: '3) Division et tri par ordre de mérite',
              detail: 'Les admis sont triés : 103 (16.00) puis 101 (14.50) puis 105 (12.00).',
              output:
                '=== 4. Division de la classe (admis / non admis) ===\nResultat de la repartition : 3 admis, 2 non admis.\n\n=== 5. Tri des etudiants admis par ordre de merite ===\nEtudiants Admis (par ordre de merite) (3 etudiants) :\n-------------------------------------------------------------\nNumero   | Nom             | Prenom          | Note  \n-------------------------------------------------------------\n103      | Chraibi         | Mehdi           | 16.00\n101      | El Amrani       | Yassine         | 14.50\n105      | Tazi            | Omar            | 12.00\n-------------------------------------------------------------\n\nEtudiants Non Admis (session de rattrapage) (2 etudiants) :\n-------------------------------------------------------------\nNumero   | Nom             | Prenom          | Note  \n-------------------------------------------------------------\n102      | Bennani         | Salma           |  8.75\n104      | Idrissi         | Amina           |  9.25\n-------------------------------------------------------------\n',
            },
            {
              title: '4) Libération complète de la mémoire',
              detail: 'Toutes les sous-listes sont libérées, aucune fuite résiduelle en mémoire.',
              vars: [{ name: 'fuites mémoire', value: '0 octet' }],
              output:
                '=== 6. Liberation complete de la memoire ===\nToute la memoire a ete liberee proprement. Fin du programme.\n',
            },
          ],
        },
      },
    ],
  },
]
