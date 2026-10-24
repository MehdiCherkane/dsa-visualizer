/*
 * Chapitre 5 — listes doublement chaînées circulaires
 *
 * Programme autonome C11, sans dépendance autre que la bibliothèque standard.
 * Il reprend exactement la structure du cours :
 *
 *     typedef struct Noeud {
 *         struct Noeud *precedent;
 *         int valeur;
 *         struct Noeud *suivant;
 *     } Noeud;
 *
 *     Noeud *debut = NULL;   // seul pointeur global, pas de variable `fin`
 *
 * Dans une liste non vide, le dernier nœud pointe vers `debut` et
 * `debut->precedent` pointe vers le dernier nœud. Il n'y a donc aucun NULL
 * à l'intérieur du cercle ; NULL ne représente que la liste vide.
 *
 * Compilation :
 *     gcc -std=c11 -Wall -Wextra -pedantic lddc.c -o lddc
 * Exécution :
 *     ./lddc
 */

#include <stdio.h>
#include <stdlib.h>

typedef struct Noeud {
    struct Noeud *precedent;
    int valeur;
    struct Noeud *suivant;
} Noeud;

Noeud *debut = NULL;

/* Alloue un nœud isolé, déjà circulaire sur lui-même. */
static Noeud *creerNoeud(int valeur) {
    Noeud *nouveau = malloc(sizeof *nouveau);
    if (nouveau == NULL) {
        fprintf(stderr, "malloc a échoué\n");
        exit(EXIT_FAILURE);
    }
    nouveau->valeur = valeur;
    nouveau->suivant = nouveau;
    nouveau->precedent = nouveau;
    return nouveau;
}

/* Affiche un tour complet, sans jamais déréférencer NULL. */
void afficherListe(void) {
    if (debut == NULL) {
        printf("(liste vide)\n");
        return;
    }

    Noeud *courant = debut;
    printf("%d", courant->valeur);
    courant = courant->suivant;
    while (courant != debut) {
        printf(" -> %d", courant->valeur);
        courant = courant->suivant;
    }
    printf(" -> (back to %d)\n", debut->valeur);
}

/* Part du dernier nœud, puis remonte par `precedent`. */
void afficherListeEnvers(void) {
    if (debut == NULL) {
        printf("(liste vide)\n");
        return;
    }

    Noeud *dernier = debut->precedent;
    Noeud *courant = dernier;
    printf("%d", courant->valeur);
    courant = courant->precedent;
    while (courant != dernier) {
        printf(" -> %d", courant->valeur);
        courant = courant->precedent;
    }
    printf(" -> (back to %d)\n", dernier->valeur);
}

/* Insertion en O(1) : le dernier est debut->precedent. */
void insererEnTete(int valeur) {
    Noeud *nouveau = creerNoeud(valeur);

    if (debut == NULL) {
        /* nouveau->suivant = nouveau ; nouveau->precedent = nouveau ; */
        debut = nouveau;
        return;
    }

    /* nouveau->suivant = debut ; nouveau->precedent = dernier ; */
    nouveau->suivant = debut;
    nouveau->precedent = debut->precedent;
    /* dernier->suivant = nouveau ; debut->precedent = nouveau ; */
    debut->precedent->suivant = nouveau;
    debut->precedent = nouveau;
    debut = nouveau;
}

/* Insertion en O(1) : aucun parcours grâce à debut->precedent. */
void insererEnFin(int valeur) {
    Noeud *nouveau = creerNoeud(valeur);

    if (debut == NULL) {
        debut = nouveau;
        return;
    }

    Noeud *dernier = debut->precedent;
    /* nouveau->suivant = debut ; nouveau->precedent = dernier ; */
    nouveau->suivant = debut;
    nouveau->precedent = dernier;
    /* dernier->suivant = nouveau ; debut->precedent = nouveau ; */
    dernier->suivant = nouveau;
    debut->precedent = nouveau;
}

/* Insère après la première occurrence de `apres`. */
void insererApresValeur(int apres, int valeur) {
    if (debut == NULL) {
        return;
    }

    Noeud *courant = debut;
    do {
        if (courant->valeur == apres) {
            Noeud *nouveau = creerNoeud(valeur);
            /* nouveau->suivant = courant->suivant ;
               nouveau->precedent = courant ; */
            nouveau->suivant = courant->suivant;
            nouveau->precedent = courant;
            /* courant->suivant->precedent = nouveau ;
               courant->suivant = nouveau ; */
            courant->suivant->precedent = nouveau;
            courant->suivant = nouveau;
            return;
        }
        courant = courant->suivant;
    } while (courant != debut);
}

/* Insère avant la première occurrence de `avant`. */
void insererAvantValeur(int avant, int valeur) {
    if (debut == NULL) {
        return;
    }

    Noeud *courant = debut;
    do {
        if (courant->valeur == avant) {
            Noeud *nouveau = creerNoeud(valeur);
            /* nouveau->suivant = courant ;
               nouveau->precedent = courant->precedent ; */
            nouveau->suivant = courant;
            nouveau->precedent = courant->precedent;
            /* courant->precedent->suivant = nouveau ;
               courant->precedent = nouveau ; */
            courant->precedent->suivant = nouveau;
            courant->precedent = nouveau;
            if (courant == debut) {
                debut = nouveau;
            }
            return;
        }
        courant = courant->suivant;
    } while (courant != debut);
}

/* Supprime la tête, y compris le cas du nœud unique. */
void supprimerEnTete(void) {
    if (debut == NULL) {
        return;
    }

    if (debut->suivant == debut) {
        free(debut);
        debut = NULL;
        return;
    }

    Noeud *ancien = debut;
    Noeud *dernier = debut->precedent;
    Noeud *suivant = debut->suivant;
    /* suivant->precedent = dernier ; dernier->suivant = suivant ; */
    suivant->precedent = dernier;
    dernier->suivant = suivant;
    debut = suivant;
    free(ancien);
}

/* Supprime la première occurrence de `valeur`. */
void supprimerValeur(int valeur) {
    if (debut == NULL) {
        return;
    }

    Noeud *courant = debut;
    do {
        if (courant->valeur == valeur) {
            if (courant->suivant == courant) {
                free(courant);
                debut = NULL;
                return;
            }

            Noeud *precedent = courant->precedent;
            Noeud *suivant = courant->suivant;
            if (courant == debut) {
                debut = suivant;
            }
            /* precedent->suivant = suivant ; suivant->precedent = precedent ; */
            precedent->suivant = suivant;
            suivant->precedent = precedent;
            free(courant);
            return;
        }
        courant = courant->suivant;
    } while (courant != debut);
}

/* Recherche sur un tour complet, sans boucle infinie. */
int rechercher(int valeur) {
    if (debut == NULL) {
        return 0;
    }

    Noeud *courant = debut;
    do {
        if (courant->valeur == valeur) {
            return 1;
        }
        courant = courant->suivant;
    } while (courant != debut);
    return 0;
}

/* Détruit tout le cercle : la condition ne déréférence jamais un nœud libéré. */
void detruireListe(void) {
    while (debut != NULL) {
        supprimerEnTete();
    }
}

/* Inverse le sens du cercle, puis replace debut sur l'ancien dernier. */
void inverserListe(void) {
    if (debut == NULL) {
        return;
    }

    Noeud *dernier = debut->precedent;
    Noeud *courant = debut;
    do {
        Noeud *temp = courant->suivant;
        courant->suivant = courant->precedent;
        courant->precedent = temp;
        courant = temp;
    } while (courant != debut);
    debut = dernier;
}

/*
 * Vérifie les invariants du cercle :
 *   - aucun NULL dans une liste non vide ;
 *   - n->suivant->precedent == n et n->precedent->suivant == n ;
 *   - un tour de `suivant` revient exactement sur debut.
 * Retourne 1 si tout est valide, 0 sinon.
 */
int verifier(void) {
    if (debut == NULL) {
        return 1;
    }

    Noeud *courant = debut;
    int longueur = 0;

    do {
        if (courant == NULL || courant->suivant == NULL || courant->precedent == NULL) {
            fprintf(stderr, "verifier : pointeur NULL dans un cercle non vide\n");
            return 0;
        }
        if (courant->suivant->precedent != courant) {
            fprintf(stderr, "verifier : suivant/precedent incohérents sur %d\n", courant->valeur);
            return 0;
        }
        if (courant->precedent->suivant != courant) {
            fprintf(stderr, "verifier : precedent/suivant incohérents sur %d\n", courant->valeur);
            return 0;
        }
        courant = courant->suivant;
        longueur += 1;
        if (longueur > 10000) {
            fprintf(stderr, "verifier : le parcours ne revient pas sur debut\n");
            return 0;
        }
    } while (courant != debut);

    if (debut->precedent->suivant != debut) {
        fprintf(stderr, "verifier : la fermeture du cercle est incorrecte\n");
        return 0;
    }

    printf("verifier : cercle valide (%d nœud%s)\n", longueur, longueur > 1 ? "s" : "");
    return 1;
}

static int attendu(int condition, const char *message) {
    if (!condition) {
        fprintf(stderr, "ECHEC : %s\n", message);
        return 0;
    }
    return 1;
}

int main(void) {
    int ok = 1;

    /* Construction de la liste du cours : 9 ⇄ 2 ⇄ 5. */
    insererEnFin(9);
    insererEnFin(2);
    insererEnFin(5);

    /* Raccordement circulaire :
       9.suivant = 2 ; 2.suivant = 5 ; 5.suivant = 9
       9.precedent = 5 ; 2.precedent = 9 ; 5.precedent = 2
       debut -> 9 ; aucun NULL dans le cercle. */

    printf("Liste du cours :\n");
    afficherListe();
    ok &= verifier();

    printf("\nParcours inverse :\n");
    afficherListeEnvers();

    printf("\nInsertion en tête de 7 :\n");
    insererEnTete(7);
    afficherListe();
    ok &= verifier();

    printf("\nInsertion en fin de 1 :\n");
    insererEnFin(1);
    afficherListe();
    ok &= verifier();

    printf("\nInsertion de 4 après 2 :\n");
    insererApresValeur(2, 4);
    afficherListe();
    ok &= verifier();

    printf("\nInsertion de 3 avant 2 :\n");
    insererAvantValeur(2, 3);
    afficherListe();
    ok &= verifier();

    printf("\nRecherche de 5 puis de 99 :\n");
    printf("rechercher(5) = %d\n", rechercher(5));
    printf("rechercher(99) = %d\n", rechercher(99));
    ok &= attendu(rechercher(5) == 1, "5 devrait être trouvé");
    ok &= attendu(rechercher(99) == 0, "99 ne devrait pas être trouvé");

    printf("\nInversion du cercle :\n");
    inverserListe();
    afficherListe();
    afficherListeEnvers();
    ok &= verifier();

    printf("\nSuppression de la tête :\n");
    supprimerEnTete();
    afficherListe();
    ok &= verifier();

    printf("\nSuppression de la valeur 3 :\n");
    supprimerValeur(3);
    afficherListe();
    ok &= verifier();

    printf("\nSuppression de la valeur 99 (absente) :\n");
    supprimerValeur(99);
    afficherListe();
    ok &= verifier();

    printf("\nDestruction complète :\n");
    detruireListe();
    afficherListe();
    ok &= attendu(debut == NULL, "debut devrait valoir NULL après destruction");
    ok &= verifier();

    printf("\n%s\n", ok ? "Tous les tests sont passés." : "Au moins un test a échoué.");
    return ok ? EXIT_SUCCESS : EXIT_FAILURE;
}
