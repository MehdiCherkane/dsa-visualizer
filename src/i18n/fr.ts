import type { StudentValue } from '../core/types'

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count <= 1 ? one : many}`
}

export const fr = {
  app: {
    title: 'Listes doublement chaînées',
    course: 'Structures de données',
    school: 'DUT GI S3',
    institutionName: 'EST Béni Mellal',
    institution: 'DUT GI S3 · EST Béni Mellal',
    source: 'd’après le cours du Pr. M. OUTANOUTE',
    creditPrefix: 'd’après le cours du',
    professor: 'Pr. M. OUTANOUTE',
    subtitle: 'EST Béni Mellal · DUT GI S3 · d’après le cours du Pr. M. OUTANOUTE',
    ready: 'Prêt pour la démonstration',
  },
  menu: {
    title: 'Structures de données',
    pageTitle: 'Structures de données en C — simulation et visualisation',
    chapterPageTitle: (title: string) => `${title} — Structures de données en C`,
    eyebrow: 'Chapitre par chapitre',
    subtitle:
      'Simulation et visualisation des différentes fonctionnalités des structures de données en C',
    chapters: 'Chapitres',
    open: 'Ouvrir',
    openAria: (title: string) => `Ouvrir « ${title} »`,
    chapterLabel: (chapter: number) => `Chapitre ${chapter}`,
    cardHint: 'Démonstration pas à pas, utilisable hors ligne',
    soon: 'Bientôt disponible',
    soonTitle: 'Prochains chapitres',
    soonAria: (title: string) => `« ${title} » : bientôt disponible`,
    soonItems: [
      {
        chapter: 1,
        title: 'Piles et files statiques',
        description: 'Piles et files implantées dans des tableaux de taille fixe.',
      },
    ],
    footer: 'Tout fonctionne hors ligne : un seul fichier, aucune connexion.',
    backArrow: '←',
    backLabel: 'Menu',
    backAria: 'Revenir au menu principal',
  },
  chapters: {
    lsc: {
      title: 'Listes simplement chaînées',
      description: 'Un seul lien suivant : parcours, insertion, suppression et registre étudiant.',
    },
    pilesFiles: {
      title: 'Piles et files dynamiques',
      description: 'LIFO et FIFO avec des nœuds alloués nœud par nœud, sans MAX.',
    },
    ldc: {
      description: 'Profils Entiers et Étudiants, 8 scénarios guidés.',
    },
    lddc: {
      title: 'Listes doublement chaînées circulaires',
      description:
        'Le dernier nœud reboucle sur le premier : parcours en boucle, insertions en O(1) via debut->precedent.',
    },
  },
  common: {
    node: 'nœud',
    value: 'valeur',
    student: 'étudiant',
    list: 'liste',
    heap: 'tas (malloc)',
    freed: 'libéré',
    null: 'NULL',
    uninit: '?',
    true: 'vraie',
    false: 'fausse',
    bytes: 'octets',
  },
  header: {
    presentationOn: 'Quitter la présentation',
    presentationOff: 'Mode présentation',
    themeLight: 'Passer au thème clair',
    themeDark: 'Passer au thème sombre',
    themeToggle: 'Basculer le thème',
    scenarios: 'Scénarios',
    about: 'À propos',
    profile: 'Profil de données',
    shortcuts: '← → étapes · ↑ ↓ vitesse · Espace lecture · P présentation · R réinitialiser',
    shortcutsButton: 'Raccourcis',
    shortcutsHelp: 'Raccourcis clavier',
  },
  shortcuts: {
    title: 'Raccourcis clavier',
    hint: 'Molette : zoom · Glisser : déplacer · Double-clic : ajuster',
    rows: [
      { keys: ['←', '→'], label: 'Pas précédent / pas suivant' },
      { keys: ['Espace'], label: 'Lecture / pause' },
      { keys: ['Home', 'End'], label: 'Premier / dernier pas' },
      { keys: ['↑', '↓'], label: 'Accélérer / ralentir' },
      { keys: ['+', '-'], label: 'Zoom avant / arrière' },
      { keys: ['0', 'F'], label: 'Ajuster la vue' },
      { keys: ['D'], label: 'Afficher / masquer les panneaux' },
      { keys: ['P'], label: 'Mode présentation' },
      { keys: ['R'], label: 'Réinitialiser la liste' },
      { keys: ['Échap'], label: 'Revenir au menu' },
    ],
  },
  camera: {
    zoomIn: 'Zoom avant',
    zoomOut: 'Zoom arrière',
    zoomReset: 'Revenir à 100 % (centré sur la liste)',
    fit: 'Ajuster la vue au contenu',
    fitShort: 'Ajuster',
    auto: 'Auto',
    manual: 'Manuel',
    autoHint: 'La caméra suit automatiquement le contenu',
    manualHint: 'Cliquer pour revenir au cadrage automatique',
  },
  dock: {
    title: 'Panneaux',
    collapse: 'Replier les panneaux',
    expand: 'Déplier les panneaux',
    resizeWorkspace: 'Redimensionner la visualisation et le code',
    resizeDockHeight: 'Redimensionner la hauteur des panneaux',
    resizeVariablesConsole: 'Redimensionner Variables et Console',
    resizeConsoleJournal: 'Redimensionner Console et Journal',
    focusPane: (title: string) => `Agrandir le panneau ${title}`,
    restorePane: (title: string) => `Restaurer le panneau ${title}`,
    percentValue: (value: number) => `${Math.round(value)} %`,
    pixelValue: (value: number) => `${Math.round(value)} px`,
  },
  code: {
    title: 'Code C',
    types: 'Types',
    function: 'Fonction',
    breadcrumb: 'Pile d’appels',
    showTypes: 'Voir les types',
    showFunction: 'Revenir à la fonction',
    copy: 'Copier',
    copied: 'Copié ✓',
  },
  captionPanel: {
    title: 'Explication',
    badgeParticular: 'Cas particulier',
    badgeDebut: 'debut modifié',
  },
  controls: {
    first: 'Premier pas',
    prev: 'Pas précédent',
    play: 'Lecture automatique',
    pause: 'Pause',
    next: 'Pas suivant',
    last: 'Dernier pas',
    speed: 'Vitesse',
    step: 'Étape',
    ready: 'Prêt',
    slider: 'Position dans l’opération',
    fullscreen: 'Plein écran',
    exitFullscreen: 'Quitter le plein écran',
  },
  operation: {
    title: 'Opération',
    execute: 'Exécuter',
    finish: 'Terminer',
    cancel: 'Annuler',
    maxNodes: 'Maximum de 8 nœuds atteint pour la démo : les insertions sont désactivées.',
    notFound: 'Opération introuvable.',
    inProgress: 'Opération en cours',
    targetHint: 'Cliquez sur un nœud du schéma pour remplir ce champ',
    completed: 'Opération terminée',
    nextScenario: 'Opération suivante',
  },
  watch: {
    title: 'Variables',
    globals: 'Globales',
    locals: 'Variables locales',
    localsOf: (fn: string) => `Locales · ${fn}`,
    noFrame: 'Aucune fonction active',
    evals: 'Expressions résolues',
    empty: 'Aucune variable.',
    changed: 'modifié',
  },
  console: {
    title: 'Console (printf)',
    empty: '(aucune sortie)',
    traversed: 'nœuds parcourus',
    comparisons: 'comparaisons',
    return: 'retour',
  },
  journal: {
    title: 'Journal',
    close: 'Fermer le journal',
    empty: 'Aucune opération terminée.',
    reset: 'Réinitialiser',
    confirmReset: 'Réinitialiser la liste et le journal ?',
    resetMarker: '— Liste réinitialisée pour la démonstration —',
    profileSwitch: 'Changement de profil : liste réinitialisée.',
    scenarioLoaded: 'Scénario chargé',
    row: 'n°',
  },
  scenarios: {
    title: 'Scénarios',
    load: 'Charger',
    current: 'SCÉNARIO',
    next: 'Prochaine opération',
    nextShort: 'Suivante',
    quit: 'Quitter le scénario',
    replay: 'Rejouer',
    close: 'Fermer',
    finished: 'Scénario terminé',
    none: 'Aucune opération en attente.',
    done: 'Scénario terminé.',
    steps: 'opérations',
    empty: 'Ce scénario ne contient que la liste de départ.',
    emptyShort: 'Liste de départ',
    items: {
      cours: {
        title: 'Le cours : liste 9 ⇄ 2 ⇄ 5',
        description: 'Charge la liste de la diapositive du cours.',
      },
      registre: {
        title: 'Exercice d’application : le registre',
        description:
          'Inscrire E1, E2, E3, puis radier 102 et 101. Reproduit la table de tracé du professeur.',
      },
      milieu: {
        title: 'LE point fort : supprimer au milieu',
        description:
          'Supprimer 2 puis 5 : un seul pointeur courant suffit pour détacher un nœud du milieu.',
      },
      particulier: {
        title: 'Le cas particulier',
        description:
          'Supprimer 9 et insérer 7 avant 9 : les deux fois, on délègue aux fonctions de tête.',
      },
      avant: {
        title: 'Insérer avant (un seul courant)',
        description: 'Insérer 7 avant 2 avec un seul pointeur de parcours.',
      },
      arriere: {
        title: 'Parcours arrière',
        description: 'Aller jusqu’à la fin avec suivant, puis revenir avec precedent.',
      },
      inverser: {
        title: 'Inverser la liste',
        description: 'Échanger suivant et precedent dans chaque nœud, puis réorganiser l’affichage.',
      },
      absente: {
        title: 'Valeur absente',
        description: 'Supprimer 99 et insérer après 99 : parcours complet jusqu’à NULL.',
      },
    },
  },
  profiles: {
    label: 'Nœuds',
    structureLabel: 'Structure',
    int: 'Entiers',
    etudiant: 'Étudiants',
    pile: 'Pile',
    file: 'File',
    switchHint: 'Changer de profil réinitialise la structure.',
  },
  lsc: {
    ops: {
      afficherListe: {
        label: 'Afficher la liste',
        complexity: 'O(n)',
        note: 'Parcours complet avec un seul pointeur courant.',
      },
      insererEnTete: {
        label: 'Insérer en tête',
        complexity: 'O(1)',
        note: 'Aucun parcours : le nouveau nœud devient debut.',
      },
      insererEnFin: {
        label: 'Insérer en fin',
        complexity: 'O(n)',
        note: 'Pas de repère fin : il faut parcourir jusqu’au dernier nœud.',
      },
      supprimerEnTete: {
        label: 'Supprimer en tête',
        complexity: 'O(1)',
        note: 'debut avance, puis free libère l’ancien nœud.',
      },
      supprimerValeur: {
        label: 'Supprimer une valeur',
        complexity: 'O(n)',
        note: 'Recherche O(n), détachement O(1) avec un seul precedent.',
      },
      rechercher: {
        label: 'Rechercher une valeur',
        complexity: 'O(n)',
        note: 'Un seul parcours séquentiel par suivant.',
      },
      detruireListe: {
        label: 'Détruire la liste',
        complexity: 'O(n)',
        note: 'Suppressions en tête successives.',
      },
      inscrireEtudiant: {
        label: 'Inscrire un étudiant',
        complexity: 'O(n)',
        note: 'Ajout en fin : parcours du registre jusqu’au dernier nœud.',
      },
      radierEtudiant: {
        label: 'Radier un étudiant',
        complexity: 'O(n)',
        note: 'Recherche par numéro, détachement O(1).',
      },
    },
    captions: {
      malloc: (nodeId: number, address: string) =>
        `\`malloc\` réserve le nœud ${nodeId} à l’adresse \`${address}\`. \`valeur\` et \`suivant\` sont non initialisés.`,
      insertEmptyHead:
        'La liste est vide : `nouveau->suivant` reçoit `NULL`, puis `debut` reçoit `nouveau`.',
      insertHeadLink: '`nouveau->suivant` reçoit l’ancienne tête `debut`.',
      insertNewHead: '`debut` pointe maintenant sur `nouveau` : l’insertion en tête est terminée.',
      insertTailLink: 'Le dernier nœud pointe maintenant sur `nouveau`.',
      insertTailEmpty: 'La liste est vide : `debut` reçoit directement `nouveau`.',
      headDelegation:
        '`debut->valeur` correspond à la valeur cherchée : on délègue à `supprimerEnTete`.',
      afterHeadCall: 'On revient dans `supprimerValeur` : la tête a été retirée.',
      removeHead: 'On avance `debut` sur `debut->suivant`, puis on libère l’ancien nœud.',
      detachNode:
        'On relie `precedent->suivant` à `courant->suivant` : le nœud est sauté, puis libéré.',
      searchFound: (nodeId: number, value: string | number) =>
        `Le nœud ${nodeId} contient \`${value}\` : la recherche s’arrête.`,
      searchNotFound: (value: string | number) =>
        `Le parcours atteint \`NULL\` : la valeur \`${value}\` est absente.`,
      searchEmpty: '`debut` vaut `NULL` : la liste est vide, la recherche retourne `0`.',
      deleteEmpty: '`debut` vaut `NULL` : la liste est vide, rien à supprimer.',
      deleteAbsent: (value: string | number) =>
        `La valeur \`${value}\` est absente : aucun nœud n’est détaché.`,
      destroyEmpty: '`debut` vaut `NULL` : la liste est déjà vide.',
      destroyHead: 'On retire la tête courante, puis on recommence tant que `debut` n’est pas `NULL`.',
      registerHead: 'Le registre est vide : `debut` reçoit directement `nouveau`.',
      registerTail: 'Le dernier nœud du registre pointe maintenant sur `nouveau`.',
      writeNumero: (nodeId: number, numero: number) =>
        `On écrit le numéro \`${numero}\` dans le champ \`numero\` du nœud ${nodeId}.`,
      writeNom: (nodeId: number, nom: string) =>
        `\`strcpy\` copie le nom « ${nom} » dans le champ \`nom\` du nœud ${nodeId}.`,
      writePrenom: (nodeId: number, prenom: string) =>
        `\`strcpy\` copie le prénom « ${prenom} » dans le champ \`prenom\` du nœud ${nodeId}.`,
      registerDone: (student: string) => `L’étudiant ${student} est inscrit en fin de registre.`,
      radierHead: 'L’étudiant à radier est en tête : `debut` avance puis on libère le nœud.',
      radierDetach: 'On relie `precedent->suivant` à `courant->suivant`, puis on libère le nœud.',
      radierAbsent: (numero: number) =>
        `Aucun nœud ne porte le numéro \`${numero}\` : le registre est inchangé.`,
      radierEmpty: '`debut` vaut `NULL` : le registre est vide.',
      scanfNumero: 'Le numéro saisi est copié dans la variable locale `numero`.',
      scanfNom: 'Le nom saisi est copié dans le tableau local `nom`.',
      scanfPrenom: 'Le prénom saisi est copié dans le tableau local `prenom`.',
    },
    scenarios: {
      cours: {
        title: 'Le cours : liste 9 → 2 → 5',
        description: 'Charge la liste simplement chaînée de la diapositive du cours.',
      },
      registre: {
        title: 'Exercice d’application : le registre',
        description:
          'Inscrire E1, E2, E3, puis radier le numéro 102. Le registre final contient 101 → 103.',
      },
      milieu: {
        title: 'Supprimer au milieu',
        description:
          'Supprimer 2 puis 5 : un seul pointeur precedent suffit pour détacher un nœud du milieu.',
      },
      tete: {
        title: 'Les deux extrémités',
        description: 'Insérer 9 en tête puis 7 en fin, et afficher la liste obtenue.',
      },
      absente: {
        title: 'Valeur absente',
        description: 'Supprimer 99 puis rechercher 99 : le parcours va jusqu’à NULL.',
      },
      detruire: {
        title: 'Détruire la liste',
        description: 'Détruire 9 → 2 → 5 nœud par nœud et vérifier que debut devient NULL.',
      },
    },
  },
  piles: {
    ops: {
      empiler: {
        label: 'Empiler',
        complexity: 'O(1)',
        note: 'Allocation puis raccordement en tête : aucun parcours.',
      },
      depiler: {
        label: 'Dépiler',
        complexity: 'O(1)',
        note: 'La tête est retirée et libérée : le sommet recule d’un nœud.',
      },
      pileVide: {
        label: 'Tester si la pile est vide',
        complexity: 'O(1)',
        note: 'Il suffit de comparer sommet à NULL.',
      },
      detruirePile: {
        label: 'Détruire la pile',
        complexity: 'O(n)',
        note: 'Dépilements successifs jusqu’à sommet == NULL.',
      },
      empilerCopie: {
        label: 'Empiler une copie',
        complexity: 'O(1)',
        note: 'Réutilise empiler : un nouveau nœud est bien alloué pour la copie.',
      },
      corrigerCopie: {
        label: 'Corriger la copie',
        complexity: 'O(1)',
        note: 'Dépile la copie du sommet et affiche sa correction : LIFO.',
      },
      enfiler: {
        label: 'Enfiler',
        complexity: 'O(1)',
        note: 'Grâce à fin, l’ajout se fait sans parcours.',
      },
      defiler: {
        label: 'Défiler',
        complexity: 'O(1)',
        note: 'debut avance ; si la file devient vide, fin doit aussi repasser à NULL.',
      },
      fileVide: {
        label: 'Tester si la file est vide',
        complexity: 'O(1)',
        note: 'Il suffit de comparer debut à NULL.',
      },
      detruireFile: {
        label: 'Détruire la file',
        complexity: 'O(n)',
        note: 'Défilements successifs jusqu’à debut == NULL.',
      },
      enregistrerArrivee: {
        label: 'Enregistrer une arrivée',
        complexity: 'O(1)',
        note: 'Réutilise enfiler : ajout en fin grâce au repère fin.',
      },
      servirSuivant: {
        label: 'Servir le suivant',
        complexity: 'O(1)',
        note: 'Réutilise defiler puis affiche le numéro servi : FIFO.',
      },
    },
    captions: {
      mallocPile: (nodeId: number, address: string) =>
        `\`malloc\` réserve le nœud ${nodeId} à l’adresse \`${address}\`. \`valeur\` et \`precedent\` sont non initialisés.`,
      newNodePile: '`nouveau` reçoit l’adresse du nœud alloué.',
      setValuePile: (value: number) =>
        `On écrit \`${value}\` dans le champ \`valeur\` du nouveau nœud.`,
      linkTop: '`nouveau->precedent` reçoit l’ancien sommet : la chaîne descend vers le bas.',
      newTop: '`sommet` pointe maintenant sur `nouveau` : la pile grandit par le haut.',
      pushDone: 'Empilement terminé : le nouveau nœud est au sommet.',
      popEmpty: '`sommet` vaut `NULL` : la pile est vide, `depiler` retourne.',
      saveTop: '`ancienSommet` mémorise le nœud à libérer.',
      moveTop: '`sommet` descend sur `sommet->precedent`.',
      freeTop: '`free` libère l’ancien sommet : la pile a diminué d’un nœud.',
      popDone: 'Dépilement terminé : le nouveau sommet est en haut.',
      emptyTrue: '`sommet` vaut `NULL` : la pile est vide, la fonction retourne `1`.',
      emptyFalse: '`sommet` ne vaut pas `NULL` : la pile contient au moins un nœud, retour `0`.',
      destroyEmpty: '`sommet` vaut `NULL` : la pile est déjà vide.',
      destroyLoop: 'On dépile le sommet courant, puis on recommence tant que la pile n’est pas vide.',
      copieDelegation: '`empilerCopie` délègue à `empiler` : un nouveau nœud est alloué, puis empilé.',
      copieDone: 'La copie est au sommet : elle est indépendante des nœuds déjà empilés.',
      corrigerEmpty: '`pileVide` renvoie vrai : aucune copie à corriger.',
      corrigerPop: 'On dépile la copie du sommet : la dernière empilée est la première corrigée.',
      corrigerPrint: (numero: number) =>
        `\`printf\` affiche « Correction de la copie ${numero} ».`,
      corrigerDone: 'Correction terminée : le sommet est passé à la copie précédente.',
      mallocFile: (nodeId: number, address: string) =>
        `\`malloc\` réserve le nœud ${nodeId} à l’adresse \`${address}\`. \`valeur\` et \`suivant\` sont non initialisés.`,
      setValueFile: (value: number) =>
        `On écrit \`${value}\` dans le champ \`valeur\` du nouveau nœud.`,
      enqueueEmpty: 'La file était vide : `debut` et `fin` pointent tous les deux sur `nouveau`.',
      enqueueEmptyDebut: 'La file était vide : `debut` reçoit `nouveau`.',
      enqueueEmptyFin: '`fin` reçoit aussi `nouveau` : les deux repères visent le seul nœud.',
      enqueueAfterLast: '`fin->suivant` reçoit `nouveau`, puis `fin` avance sur le nouveau dernier.',
      enqueueDone: 'Enfilement terminé : le nouveau nœud est en fin de file.',
      dequeueEmpty: '`debut` vaut `NULL` : la file est vide, `defiler` retourne.',
      saveFirst: '`ancienDebut` mémorise le nœud de tête à libérer.',
      advanceFirst: '`debut` avance sur `debut->suivant`.',
      dequeueLastTrap:
        'La file devient vide : `debut` vaut `NULL`. Il faut aussi remettre `fin` à `NULL`, sinon `fin` reste pendant.',
      dequeueLastFixed: '`fin` repasse à `NULL` : les deux repères sont cohérents.',
      freeFirst: '`free` libère l’ancien premier nœud.',
      dequeueDone: 'Défilement terminé : le premier client est servi.',
      fileEmptyTrue: '`debut` vaut `NULL` : la file est vide, retour `1`.',
      fileEmptyFalse: '`debut` ne vaut pas `NULL` : la file contient au moins un client, retour `0`.',
      fileDestroyEmpty: '`debut` vaut `NULL` : la file est déjà vide.',
      fileDestroyLoop: 'On défile le premier nœud, puis on recommence tant que la file n’est pas vide.',
      arrive: (numero: number) =>
        `L’étudiant ${numero} arrive : on l’enfile en fin de file.`,
      serve: (numero: number) =>
        `L’étudiant ${numero} est servi : \`printf\` affiche « Etudiant ${numero} servi ».`,
      serveDone: 'Le premier arrivé est le premier servi : FIFO.',
    },
    scenarios: {
      pileCours: {
        title: 'La pile du cours : 25, 7, 12',
        description: 'Empiler 25, 7 puis 12. Le sommet est 12 et la chaîne descend vers 25.',
      },
      pileDepiler: {
        title: 'Dépiler jusqu’au vide',
        description: 'Dépiler 12, 7 puis 25 : le sommet recule à chaque pas et finit à NULL.',
      },
      pileCopie: {
        title: 'La pile de copies',
        description:
          'Empiler 101, 102 puis 103 avec empilerCopie, puis corriger deux copies : LIFO.',
      },
      pileCopieCorrigee: {
        title: 'Corriger toute la pile',
        description:
          'Empiler trois copies puis les corriger une à une jusqu’à ce que la pile redevienne vide.',
      },
      fileCours: {
        title: 'La file du cours : 7, 12, 25',
        description: 'Enfiler 7, 12 puis 25 : debut pointe sur 7 et fin sur 25.',
      },
      fileServir: {
        title: 'Servir toute la file',
        description:
          'Défiler 7, 12 puis 25 : au dernier retrait, debut et fin doivent tous deux devenir NULL.',
      },
      fileArrivees: {
        title: 'Arrivées et service',
        description:
          'Enregistrer les étudiants 201, 202, 203, puis servir deux étudiants et afficher la file restante.',
      },
    },
  },
  lddc: {
    ops: {
      afficherListe: {
        label: 'Afficher la liste',
        complexity: 'O(n)',
        note: 'Parcours do…while : on s’arrête quand courant revient sur debut.',
      },
      afficherListeEnvers: {
        label: 'Afficher à l’envers',
        complexity: 'O(n)',
        note: 'debut->precedent donne le dernier nœud, puis le parcours remonte par precedent.',
      },
      insererEnTete: {
        label: 'Insérer en tête',
        complexity: 'O(1)',
        note: 'debut->precedent est le dernier nœud : le raccord se fait sans parcours.',
      },
      insererEnFin: {
        label: 'Insérer en fin',
        complexity: 'O(1)',
        note: 'Le dernier nœud est accessible via debut->precedent : ajout en temps constant.',
      },
      supprimerEnTete: {
        label: 'Supprimer en tête',
        complexity: 'O(1)',
        note: 'debut avance, puis le dernier et le nouveau premier se raccordent.',
      },
      supprimerValeur: {
        label: 'Supprimer une valeur',
        complexity: 'O(n)',
        note: 'Parcours do…while puis détachement O(1) avec precedent et suivant.',
      },
      rechercher: {
        label: 'Rechercher une valeur',
        complexity: 'O(n)',
        note: 'Le parcours circulaire s’arrête quand courant revient sur debut.',
      },
      passerAuSuivant: {
        label: 'Passer au suivant',
        complexity: 'O(1)',
        note: 'debut avance d’un cran : le tour continue, la liste garde la même taille.',
      },
      detruireListe: {
        label: 'Détruire la liste',
        complexity: 'O(n)',
        note: 'Suppressions en tête successives jusqu’à debut == NULL.',
      },
      inscrireEtudiant: {
        label: 'Inscrire un étudiant',
        complexity: 'O(1)',
        note: 'Ajout en fin via debut->precedent : aucun parcours du registre.',
      },
      radierEtudiant: {
        label: 'Radier un étudiant',
        complexity: 'O(n)',
        note: 'Recherche circulaire par numéro, puis détachement O(1).',
      },
    },
    captions: {
      reasonSingleNode: '`debut->suivant == debut` : un seul nœud, qui pointe vers lui-même.',
      reasonMultipleNodes: '`debut->suivant != debut` : la liste contient plusieurs nœuds.',
      lastFromPrecedent:
        '`debut->precedent` est le dernier nœud : il est trouvé en O(1), sans parcours.',
      selfLinks:
        'La liste était vide : `suivant` et `precedent` du nouveau nœud pointent vers lui-même.',
      circularStop: '`courant` est revenu sur `debut` : le parcours circulaire s’arrête.',
      circularContinue: '`courant` n’est pas revenu sur `debut` : le parcours continue.',
      notFoundLoop: 'Le parcours est revenu sur `debut` sans trouver la valeur : retour `0`.',
      rotateHead:
        '`debut` avance sur `debut->suivant` : le tour continue, la liste garde la même taille.',
      removeSingleNode: 'Le nœud est seul et pointe vers lui-même : `free` puis `debut = NULL`.',
      reasonHeadCircular:
        '`courant` pointe sur `debut` : il faut déplacer `debut` avant de libérer.',
      reasonNotHeadCircular: '`courant` ne pointe pas sur `debut` : `debut` reste inchangé.',
    },
    scenarios: {
      cours: {
        title: 'Le cours : le cercle 9 → 2 → 5',
        description:
          'Charge la LDC circulaire du cours : le dernier nœud (5) pointe vers debut (9).',
      },
      tour: {
        title: 'Tour de passage des exposés',
        description:
          'Inscrire 101, 102 puis 103 en fin (O(1)), puis passer deux fois au suivant : 103 puis 101 prennent la tête du tour.',
      },
      tete: {
        title: 'Insertion en tête O(1)',
        description:
          'Insérer 7 en tête via debut->precedent : le dernier nœud est trouvé sans parcours.',
      },
      queue: {
        title: 'Insertion en fin O(1)',
        description:
          'Insérer 7 en fin grâce à debut->precedent, puis vérifier que le nouveau dernier pointe vers debut.',
      },
      suppression: {
        title: 'Supprimer une valeur',
        description:
          'Supprimer 2 (au milieu) puis 9 (en tête) : le dernier reste toujours raccordé à debut.',
      },
      unique: {
        title: 'Le nœud unique',
        description:
          'Supprimer 9 du cercle à un seul nœud, puis insérer 4 : le nouveau nœud pointe vers lui-même.',
      },
      envers: {
        title: 'Parcours inverse',
        description:
          'debut->precedent donne le dernier nœud, puis le parcours remonte par precedent jusqu’au dernier.',
      },
      recherche: {
        title: 'Recherche circulaire',
        description:
          'Rechercher 2 puis 99 : le parcours s’arrête quand courant revient sur debut.',
      },
      detruire: {
        title: 'Détruire la liste',
        description:
          'Détruire 9 → 2 → 5 nœud par nœud et vérifier que debut devient NULL.',
      },
      registre: {
        title: 'Registre circulaire',
        description:
          'Inscrire E1, E2, E3 en fin de cercle, puis radier le numéro 102.',
      },
      tourEtudiants: {
        title: 'Tour de passage (étudiants)',
        description:
          'Inscrire trois étudiants puis faire avancer debut deux fois : le tour de passage continue.',
      },
      detruireEtudiants: {
        title: 'Détruire le registre',
        description:
          'Détruire le registre circulaire nœud par nœud et vérifier que debut devient NULL.',
      },
    },
  },
  params: {
    valeur: 'Valeur',
    apres: 'Après la valeur',
    avant: 'Avant la valeur',
    numero: 'Numéro',
    nom: 'Nom',
    prenom: 'Prénom',
    num: 'Numéro',
    E: 'Étudiant',
  },
  ops: {
    afficherListe: {
      label: 'Afficher la liste',
      complexity: 'O(n)',
      note: 'Parcours complet avec un seul pointeur courant.',
    },
    afficherListeEnvers: {
      label: 'Afficher à l’envers',
      complexity: 'O(n)',
      note: 'Aller jusqu’à la fin par suivant, puis revenir par precedent.',
    },
    insererEnTete: {
      label: 'Insérer en tête',
      complexity: 'O(1)',
      note: 'Aucun parcours : debut est mis à jour directement.',
    },
    insererEnFin: {
      label: 'Insérer en fin',
      complexity: 'O(n)',
      note: 'Pas de repère fin dans ce chapitre : il faut parcourir.',
    },
    insererApresValeur: {
      label: 'Insérer après une valeur',
      complexity: 'O(n)',
      note: 'Recherche O(n), puis insertion O(1) avec les deux pointeurs.',
    },
    insererAvantValeur: {
      label: 'Insérer avant une valeur',
      complexity: 'O(n)',
      note: 'Recherche O(n), puis insertion O(1) grâce à precedent.',
    },
    supprimerEnTete: {
      label: 'Supprimer en tête',
      complexity: 'O(1)',
      note: 'On avance debut, puis on libère l’ancien nœud.',
    },
    supprimerValeur: {
      label: 'Supprimer une valeur',
      complexity: 'O(n)',
      note: 'Recherche O(n), détachement O(1) grâce à precedent.',
    },
    rechercher: {
      label: 'Rechercher une valeur',
      complexity: 'O(n)',
      note: 'Un seul parcours par suivant.',
    },
    detruireListe: {
      label: 'Détruire la liste',
      complexity: 'O(n)',
      note: 'Suppressions en tête successives.',
    },
    inverserListe: {
      label: 'Inverser la liste',
      complexity: 'O(n)',
      note: 'Un seul parcours : on échange suivant et precedent.',
    },
    inscrireEtudiant: {
      label: 'Inscrire un étudiant',
      complexity: 'O(n)',
      note: 'Ajout en fin : parcours jusqu’au dernier nœud.',
    },
    radierEtudiant: {
      label: 'Radier un étudiant',
      complexity: 'O(n)',
      note: 'Recherche par numéro, détachement O(1).',
    },
  },
  legend: {
    title: 'Légende du schéma',
    next: 'suivant',
    prev: 'precedent',
    debut: 'debut : variable globale',
    sommet: 'sommet : variable globale',
    file: 'debut et fin : variables globales',
    local: 'variable locale',
  },
  viz: {
    empty: 'Liste vide. Insérez un nœud.',
    emptyInsert: '＋ Insérer un nœud',
    emptyLsc: 'debut vaut NULL : la liste est vide.',
    emptyPile: 'sommet vaut NULL : la pile est vide.',
    emptyFile: 'debut et fin valent NULL : la file est vide.',
    insertEmptyLsc: '＋ Insérer un premier nœud',
    insertEmptyEtudiant: '＋ Inscrire un premier étudiant',
    insertEmptyPile: '＋ Empiler une première valeur',
    insertEmptyFile: '＋ Enfiler un premier client',
    heap: 'tas (malloc)',
    row: 'liste',
    rowPile: 'pile',
    rowFile: 'file',
    freed: 'libéré',
    clickNode: 'Cliquer pour utiliser ce nœud',
    address: 'adresse',
    prevCell: 'prec',
    nextCell: 'suiv',
    null: 'NULL',
    pinned: 'pointeur',
    dangling: 'pointeur pendant',
    noNode: 'aucun nœud',
    pileTop: 'sommet',
    fileFirst: 'tête',
    fileLast: 'queue',
    alias: 'alias',
  },
  captions: {
    idle: 'Choisissez une opération, puis cliquez sur Exécuter.',
    entry: (fn: string) => `Entrée dans \`${fn}\`.`,
    call: (fn: string) => `Appel de \`${fn}\` : un nouveau contexte est empilé.`,
    functionEnd: (fn: string) => `\`${fn}\` se termine, on revient à l’appelant.`,
    operationDone: (freed: boolean) =>
      freed
        ? 'Opération terminée. Les nœuds libérés disparaissent et la liste est à jour.'
        : 'Opération terminée. La liste est à jour.',
    malloc: (nodeId: number, address: string) =>
      `\`malloc\` réserve le nœud ${nodeId} à l’adresse \`${address}\`. \`valeur\`, \`suivant\` et \`precedent\` sont non initialisés.`,
    declarePointer: (name: string, target: string) =>
      `On initialise \`${name}\` avec \`${target}\`.`,
    declareValue: (name: string, value: string) =>
      `On initialise \`${name}\` à \`${value}\`.`,
    assignPointerVar: (name: string, target: string) =>
      `\`${name}\` pointe maintenant vers \`${target}\`.`,
    assignGlobalDebut: (target: string) =>
      `\`debut\` reçoit \`${target}\`. C’est une variable globale : on la modifie elle-même.`,
    assignField: (nodeId: number, field: string, target: string) =>
      `Le champ \`${field}\` du nœud ${nodeId} pointe maintenant vers \`${target}\`.`,
    assignPayloadInt: (nodeId: number, value: number) =>
      `On écrit la valeur \`${value}\` dans le champ \`valeur\` du nœud ${nodeId}.`,
    assignPayloadStudent: (nodeId: number, student: StudentValue) =>
      `On copie l’étudiant ${student.numero} (${student.nom} ${student.prenom}) dans le champ \`donnees\` du nœud ${nodeId}.`,
    condition: (expr: string, result: boolean, reason: string) =>
      `Condition « \`${expr}\` » : ${result ? 'vraie' : 'fausse'}. ${reason}`,
    reasonPointer: (name: string, target: string) => `\`${name}\` vaut \`${target}\`.`,
    reasonNull: (name: string) => `\`${name}\` vaut \`NULL\`.`,
    reasonHasNext: (nodeId: number) => `Le nœud ${nodeId} a un \`suivant\`.`,
    reasonNoNext: (nodeId: number) => `Le nœud ${nodeId} n’a pas de \`suivant\`.`,
    reasonHasPrevious: (nodeId: number) => `Le nœud ${nodeId} a un \`precedent\`.`,
    reasonNoPrevious: (nodeId: number) => `Le nœud ${nodeId} n’a pas de \`precedent\`.`,
    reasonListEmpty: '`debut` vaut `NULL` : la liste est vide.',
    reasonListNotEmpty: '`debut` ne vaut pas `NULL` : la liste contient au moins un nœud.',
    reasonStackEmpty: '`sommet` vaut `NULL` : la pile est vide.',
    reasonStackNotEmpty: '`sommet` ne vaut pas `NULL` : la pile contient au moins un nœud.',
    reasonQueueEmpty: '`debut` vaut `NULL` : la file est vide.',
    reasonQueueNotEmpty: '`debut` ne vaut pas `NULL` : la file contient au moins un nœud.',
    reasonValueEquals: (nodeId: number, nodeValue: string | number, searched: string | number) =>
      `Le nœud ${nodeId} contient \`${nodeValue}\`, la valeur recherchée \`${searched}\`.`,
    reasonValueDiffers: (nodeId: number, nodeValue: string | number, searched: string | number) =>
      `Le nœud ${nodeId} contient \`${nodeValue}\`, différent de \`${searched}\`.`,
    reasonHead: (name: string) =>
      `\`${name}\` pointe sur \`debut\` : il n’a pas de précédent.`,
    reasonNotHead: (name: string) =>
      `\`${name}\` ne pointe pas sur \`debut\` : le cas particulier ne s’applique pas.`,
    reasonFound: (value: string | number) => `La valeur \`${value}\` a été trouvée.`,
    reasonNotFound: (value: string | number) => `La valeur \`${value}\` n’existe pas dans la liste.`,
    reasonNextExists:
      '`courant->suivant` n’est pas `NULL` : le champ `precedent` du suivant doit être mis à jour.',
    reasonNextNull:
      '`courant->suivant` vaut `NULL` : il n’y a pas de nœud suivant à mettre à jour.',
    reasonDebutNotNull:
      '`debut` ne vaut pas `NULL` : il faut raccorder l’ancienne tête au nouveau nœud.',
    reasonDebutNull:
      '`debut` vaut `NULL` : la liste est vide, il n’y a pas d’ancienne tête.',
    printfInt: (value: number) => `\`printf\` affiche la valeur \`${value}\`.`,
    printfStudent: (student: StudentValue) =>
      `\`printf\` affiche le numéro \`${student.numero}\` de l’étudiant ${student.nom} ${student.prenom}.`,
    printfNewline: 'La liste est vide : on affiche un retour à la ligne.',
    advanceNext: (name: string, target: string) =>
      `\`${name}\` passe au nœud suivant : \`${target}\`.`,
    advancePrevious: (name: string, target: string) =>
      `\`${name}\` passe au nœud précédent : \`${target}\`.`,
    swapFields: (nodeId: number) =>
      `On échange \`suivant\` et \`precedent\` du nœud ${nodeId} : les deux flèches s’inversent.`,
    foundReturn: 'La valeur est trouvée : la fonction retourne `1`.',
    notFoundReturn: 'Le parcours atteint `NULL` sans trouver la valeur : retour `0`.',
    returnVoid: 'La fonction se termine par `return`.',
    returnInt: (value: number) => `La fonction retourne \`${value}\`.`,
    returnMinusOne: 'La fonction retourne `-1` pour signaler l’erreur.',
    headDelegation:
      '`courant` pointe sur `debut` : il n’a pas de `precedent`. On retombe sur la suppression en tête.',
    insertBeforeHeadDelegation:
      '`avant` est en tête : il n’y a pas de nœud précédent. On délègue à `insererEnTete`.',
    removeMiddle: (nodeId: number) =>
      `On détache le nœud ${nodeId} avec seulement \`courant\` : \`courant->precedent->suivant\` et \`courant->suivant->precedent\`.`,
    freeNode: (nodeId: number) =>
      `\`free\` libère le nœud ${nodeId}. Il devient grisé : la liste ne doit plus le référencer.`,
    freeNodeDangling: (nodeId: number) =>
      `\`free\` libère le nœud ${nodeId}. Un pointeur local qui le vise encore devient pendant.`,
    notFoundNothing: (value: string | number) => `Valeur \`${value}\` non trouvée : rien à faire.`,
    emptyNothing: 'Liste vide : rien à faire.',
    relayout:
      'Réorganisation de l’affichage : la liste inversée se lit maintenant de gauche à droite à partir du nouveau `debut`.',
    insertAfterHead:
      'Le nœud est inséré après `courant`. Ici `courant` est la tête, donc l’opération reste simple.',
    insertedAfter:
      'Le nouveau nœud est maintenant après `courant` : les deux champs de liaison sont raccordés.',
    insertedAfterLast:
      'Le nouveau nœud devient le dernier : son champ `suivant` vaut `NULL`.',
    insertedBefore:
      'Le nouveau nœud est maintenant avant `courant` : le voisin de gauche et `courant` sont raccordés.',
    insertedBeforeLast: 'Le nouveau nœud est inséré juste avant le nœud trouvé.',
    registerStudent: 'On ajoute l’étudiant à la fin du registre.',
    removeStudentHead:
      'L’étudiant à radier est en tête : on avance `debut` puis on libère le nœud.',
    removeStudentMiddle:
      'On détache l’étudiant avec `precedent` et `suivant`, puis on le libère.',
    destroyHead: 'On détruit la liste nœud par nœud en partant de la tête.',
    removeHead: 'On retire la tête : `debut` avance sur le nœud suivant.',
    removeLast:
      '`courant` est le dernier nœud : son `suivant` vaut `NULL`, le second raccord est sauté.',
    newHeadPrecedentNull:
      'Le nouveau premier nœud n’a plus de précédent : son champ `precedent` reçoit `NULL`.',
    tailLink: 'Le dernier nœud pointe maintenant vers le nouveau nœud.',
    sourceExpression: (expr: string, target: string) =>
      `La valeur vient de \`${expr}\`, qui vaut \`${target}\`.`,
  },
} as const

export type Fr = typeof fr
