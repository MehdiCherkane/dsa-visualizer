import type { StudentValue } from '../core/types'

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count <= 1 ? one : many}`
}

export const fr = {
  credits: {
    title: 'Réalisé par',
    names: ['El Mahdi Cherkane', 'Omar Moussaid', 'Hamza Agour'],
  },
  app: {
    title: 'Listes doublement chaînées',
    course: 'Structures de données',
    institutionName: 'EST Béni Mellal',
    institution: 'EST Béni Mellal',
    source: 'd’après le cours du Pr. M. OUTANOUTE',
    creditPrefix: 'd’après le cours du',
    professor: 'Pr. M. OUTANOUTE',
    subtitle: 'EST Béni Mellal · d’après le cours du Pr. M. OUTANOUTE',
    ready: 'Prêt pour la démonstration',
  },
  footer: {
    contact: 'Contact',
    email: 'stdprojectestbm@gmail.com',
    emailAria: (email: string) => `Envoyer un e-mail à ${email}`,
    credit: 'Créé par Génie informatique étudiants',
    logoAlt: 'Logo EST Béni Mellal',
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
    cardHint: 'Démonstration pas à pas',
    soon: 'Bientôt disponible',
    soonAria: (title: string) => `« ${title} » : bientôt disponible`,
    soonItems: [] as Array<{ chapter: number; title: string; description: string }>,
    homeLabel: 'Accueil',
    homeAria: 'Revenir au menu principal',
  },
  chapters: {
    staticStructures: {
      title: 'Piles et files statiques',
      description:
        'Tableaux de taille fixe : pile LIFO, trois versions de file, traces et exercices du cours.',
    },
    lsc: {
      title: 'Listes simplement chaînées',
      description:
        'Un seul lien suivant : version linéaire et version circulaire, parcours, insertion et suppression.',
    },
    pilesFiles: {
      title: 'Piles et files dynamiques',
      description: 'LIFO et FIFO avec des nœuds alloués nœud par nœud, sans MAX.',
    },
    ldc: {
      description: 'Profils Entiers et Étudiants, 8 scénarios guidés.',
    },
    trees: {
      title: 'Arbres binaires',
      description: 'Construction, parcours récursifs préfixe / infixe / postfixe et destruction en postordre.',
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
  trees: {
    fields: { gauche: 'gauche', droit: 'droit' },
    viz: {
      empty: 'Arbre vide : racine vaut NULL.',
      root: 'racine',
      left: 'gauche',
      right: 'droit',
      null: 'NULL',
      uninitialized: 'non initialisé',
      freed: 'libéré',
      danglingRoot: 'racine pointe vers une zone libérée',
      node: 'nœud',
      address: 'adresse',
      fit: 'Ajuster',
      zoomIn: 'Zoom avant',
      zoomOut: 'Zoom arrière',
      zoomReset: 'Ajuster à l’arbre',
      active: 'Appel actif',
      activeNull: 'Appel actif : n = NULL',
      visited: 'Visité',
      legend: 'Légende',
      concepts: 'Repères du cours',
      branch: 'Branche',
      subtree: 'Sous-arbre',
      leaf: 'Feuille',
      leaves: 'Feuilles',
      size: 'Taille',
      degree: 'Degré',
      depth: 'Profondeur',
      height: 'Hauteur',
      rootDefinition: 'nœud de départ, sans parent.',
      branchDefinition: 'lien parent-enfant ; un sous-arbre regroupe un nœud et ses descendants.',
      leafDefinition: 'nœud sans enfant (degré 0).',
      sizeDefinition: 'nombre de nœuds de l’arbre.',
      degreeDefinition: 'nombre d’enfants : 0, 1 ou 2 pour un arbre binaire.',
      depthDefinition: 'nombre de liens depuis la racine (racine : 0).',
      heightDefinition: 'plus long chemin vers une feuille ; arbre vide : −1, feuille : 0.',
    },
    operations: {
      construireArbre: {
        label: 'Construire l’arbre du cours',
        complexity: 'O(1)',
        note: 'Construction guidée de cet exemple fixe à six nœuds, avec raccordement explicite des enfants.',
      },
      parcoursPrefixe: {
        label: 'Parcours préfixe',
        complexity: 'O(n)',
        note: 'Visiter le nœud, parcourir le sous-arbre gauche, puis le sous-arbre droit.',
      },
      parcoursInfixe: {
        label: 'Parcours infixe',
        complexity: 'O(n)',
        note: 'Parcourir gauche, visiter le nœud, puis parcourir droit.',
      },
      parcoursPostfixe: {
        label: 'Parcours postfixe',
        complexity: 'O(n)',
        note: 'Parcourir gauche et droit avant de visiter le nœud.',
      },
      detruireArbre: {
        label: 'Détruire l’arbre',
        complexity: 'O(n)',
        note: 'Libérer en postordre. Le paramètre n est passé par valeur : racine reste pendant.',
      },
    },
    scenarios: {
      cours: {
        title: 'Arbre du cours',
        description: 'Construire l’arbre puis comparer préfixe (50 30 20 40 70 80), infixe (20 30 40 50 70 80) et postfixe (20 40 30 80 70 50).',
      },
      exercice: {
        title: 'Exercice du cours',
        description: 'Préfixe : 15 8 4 10 22 30 ; infixe : 4 8 10 15 22 30 ; postfixe : 4 10 8 30 22 15. Aperçu du chapitre 7 : l’infixe croissant illustre la propriété d’un ABR.',
      },
      vide: {
        title: 'Arbre vide',
        description: 'Voir le cas de base n == NULL pour chaque parcours récursif.',
      },
      destruction: {
        title: 'Destruction postordre',
        description: 'Libérer chaque descendant avant son parent, puis observer racine qui reste pendant.',
      },
    },
    captions: {
      constructionEntry: 'On commence la construction manuelle de l’arbre présenté dans le cours.',
      constructionDone: 'Construction terminée : racine référence les six nœuds du cours.',
      alreadyBuilt: 'racine référence déjà un arbre : aucune allocation supplémentaire.',
      rootDangling: 'racine est pendant après une destruction ; réinitialisez l’arbre avant de le reconstruire.',
      rootFreed: 'racine est pendant : le parcours s’arrête avant tout accès à la mémoire libérée.',
      createEntry: (value: number) => `Appel de creerNoeud(${value}) pour réserver un nœud.`,
      malloc: (value: number) => `malloc réserve la mémoire du nœud qui contiendra ${value}.`,
      allocated: (id: number, address: string) => `Le nœud ${id} est alloué à l’adresse ${address} ; ses champs ne sont pas encore initialisés.`,
      assignValue: (id: number, value: number) => `Le champ valeur du nœud ${id} reçoit ${value}.`,
      initChild: (id: number, field: string) => `Le champ ${field} du nœud ${id} reçoit NULL.`,
      returnCreated: (id: number) => `creerNoeud retourne l’adresse du nœud ${id}.`,
      setRoot: (value: number) => `racine reçoit le nœud contenant ${value}.`,
      linkChild: (parent: number, field: string, child: number) => `Le champ ${field} du nœud ${parent} est raccordé au nœud ${child}.`,
      call: (fn: string, target: string) => `Appel de ${fn} avec ${target} : un contexte récursif est empilé.`,
      destroyCall: (target: string) => `Appel de detruireArbre avec ${target}.`,
      testNull: (pointer: { kind: string }) => `On teste n == NULL ; n vaut ${pointer.kind === 'node' ? 'un nœud' : 'NULL'}.`,
      nullReturn: 'Cas de base : n vaut NULL, la fonction retourne sans descendre plus loin.',
      invalidNode: 'Le pointeur ne désigne pas un nœud vivant ; l’opération s’arrête pour éviter un accès invalide.',
      continueNode: (value: number) => `n n’est pas NULL : le traitement récursif continue au nœud ${value}.`,
      visit: (value: number) => `On visite ${value} et printf l’ajoute à la sortie.`,
      recursiveCall: (field: string, value: number) => `Appel récursif sur ${field} du nœud ${value}.`,
      returnFrom: (value: number) => `Les deux sous-arbres de ${value} sont traités ; l’appel retourne.`,
      traversalDone: (order: string) => `Parcours ${order} terminé : les valeurs affichées suivent l’ordre de visite demandé.`,
      continueDestroy: (value: { kind: string; value?: number }) => `n désigne ${value.kind === 'int' ? value.value : 'un nœud'} : on détruit d’abord ses sous-arbres.`,
      destroyChild: (field: string, value: { kind: string; value?: number }) => `On appelle detruireArbre sur le lien ${field} du nœud ${value.kind === 'int' ? value.value : '?'}.`,
      free: (value: { kind: string; value?: number }) => `Les sous-arbres sont libérés ; free libère maintenant le nœud ${value.kind === 'int' ? value.value : '?'}.`,
      destroyReturn: (value: { kind: string; value?: number }) => `Le nœud ${value.kind === 'int' ? value.value : '?'} est libéré ; cet appel récursif retourne.`,
      destroyDone: (root: { kind: string }) => root.kind === 'node'
        ? 'Destruction terminée. Tous les nœuds sont libérés, mais racine garde l’ancienne adresse : ce pointeur global est pendant.'
        : 'Destruction terminée : l’arbre était vide, aucun nœud n’a été libéré.',
    },
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
    shortcuts: '← → étapes · ↑ ↓ vitesse · Espace lecture · P présentation · Maj+F plein écran · R réinitialiser',
    shortcutsButton: 'Raccourcis',
    shortcutsHelp: 'Raccourcis clavier',
  },
  coursePdf: {
    title: 'Cours PDF',
    open: 'Ouvrir le cours PDF',
    openFor: (chapter: number) => `Ouvrir le cours PDF du chapitre ${chapter}`,
    close: 'Fermer',
    closeAria: 'Fermer le cours PDF',
    resize: 'Redimensionner le cours PDF',
    pixelValue: (value: number) => `${Math.round(value)} px`,
    openInTab: 'Ouvrir dans un nouvel onglet',
    hint: 'Si le PDF ne s’affiche pas, ouvrez-le dans un nouvel onglet.',
  },
  shortcuts: {
    title: 'Raccourcis clavier',
    hint: 'Molette : zoom · Pavé tactile : deux doigts pour déplacer, pincer pour zoomer · Glisser : déplacer · Double-clic : ajuster',
    rows: [
      { keys: ['←', '→'], label: 'Pas précédent / pas suivant' },
      { keys: ['Espace'], label: 'Lecture / pause' },
      { keys: ['Home', 'End'], label: 'Premier / dernier pas' },
      { keys: ['↑', '↓'], label: 'Accélérer / ralentir' },
      { keys: ['+', '-'], label: 'Zoom avant / arrière' },
      { keys: ['0', 'F'], label: 'Ajuster la vue' },
      { keys: ['Maj', 'F'], label: 'Plein écran' },
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
  callStack: {
    title: 'Pile d’appels',
    region: 'Pile d’appels du parcours récursif',
    showNull: 'Afficher les appels NULL',
    summary: (count: number, maximum: number) =>
      `Pile : ${plural(count, 'appel', 'appels')} · max ${maximum}`,
    empty: 'Pile vide : parcours terminé',
    main: 'main',
    top: 'sommet',
    active: 'actif',
    waitLeft: 'attend l’appel gauche',
    waitRight: 'attend l’appel droit',
    line: (line: number) => `ligne ${line + 1}`,
    nullArgument: 'n = NULL',
    phase: {
      gauche: 'gauche',
      visite: 'visite',
      droit: 'droit',
    },
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
    fullscreenShortcut: 'Maj+F',
  },
  operation: {
    title: 'Opération',
    execute: 'Exécuter',
    finish: 'Terminer',
    cancel: 'Annuler',
    maxNodes: (maximum: number) => `Maximum de ${maximum} nœuds atteint : les allocations sont désactivées.`,
    notFound: 'Opération introuvable.',
    inProgress: 'Opération en cours',
    paused: 'Opération en pause',
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
    lineaire: 'Linéaire',
    circulaire: 'Circulaire',
    pile: 'Pile',
    file: 'File',
    file1: 'File 1 · ordinaire',
    file2: 'File 2 · décalage',
    file3: 'File 3 · circulaire',
    switchHint: 'Changer de profil réinitialise la structure.',
  },
  staticStructures: {
    counterLabels: {
      pile: { traversed: 'cases lues', comparisons: 'tests' },
      file1: { traversed: 'éléments lus', comparisons: 'tests' },
      file2: { traversed: 'décalages', comparisons: 'tests' },
      file3: { traversed: 'éléments lus', comparisons: 'tests' },
    },
    support: {
      indicesTitle: 'Calcul des indices',
      memoryTitle: 'Mémoire · elements[MAX]',
      indicesAria: 'Calcul des indices de la file circulaire',
      memoryAria: 'Mémoire du tableau de la file circulaire',
      capacity: (max: number) => `capacité ${max}`,
      enqueue: 'Enfiler',
      dequeue: 'Défiler',
      fullQuestion: 'Pleine ?',
      enqueueTemplate: 'ar ← (ar + 1) % MAX',
      dequeueTemplate: 'av ← (av + 1) % MAX',
      fullTemplate: 'taille == MAX',
      occupied: (index: number) => `case ${index} déjà occupée`,
      staleTarget: (index: number) => `case ${index} périmée, réutilisable`,
      emptyQueue: 'file vide',
      yes: 'oui',
      no: 'non',
      wrap: 'retour à 0',
      memoryEmpty: (max: number) =>
        `File vide : av = ar = −1. La première valeur ira en case 0 sur ${max}.`,
      memoryFull: (ar: number, target: number) =>
        `File pleine : ar = ${ar}. La prochaine arrivée viserait la case ${target}, déjà occupée.`,
      memoryApplied: (pointer: 'av' | 'ar', from: number, max: number) =>
        `${pointer} a franchi la fin du tableau : (${from} + 1) % ${max} = 0. La mémoire se lit en anneau.`,
      memoryUpcoming: (pointer: 'av' | 'ar', from: number) =>
        `${pointer} = ${from} : la prochaine ${pointer === 'av' ? 'sortie' : 'arrivée'} revient en 0 par le modulo.`,
      memoryOne: (index: number) =>
        `av et ar partagent la case ${index} : un seul élément dans la file.`,
      memoryLinear: (av: number, ar: number, last: number) =>
        `av = ${av}, ar = ${ar} : lecture linéaire ; le retour à 0 n’a lieu qu’après la case ${last}.`,
      memoryCell: (
        index: number,
        state: 'used' | 'stale' | 'free',
        value: number | string | null,
        role: string,
      ) => {
        if (state === 'free') return `Case ${index} libre.`
        if (state === 'stale') {
          return `Case ${index} : ${value} reste en mémoire mais n’est plus dans la file.`
        }
        return `Case ${index} : ${value}${role ? `, ${role}` : ''}.`
      },
    },
    ops: {
      initPile: {
        label: 'Initialiser la pile',
        complexity: 'O(1)',
        note: 'sommet = -1 : aucune case n’est utilisée, même si le tableau existe déjà.',
      },
      pileVide: {
        label: 'Tester si la pile est vide',
        complexity: 'O(1)',
        note: 'Un seul test : sommet == -1.',
      },
      pilePleine: {
        label: 'Tester si la pile est pleine',
        complexity: 'O(1)',
        note: 'MAX - 1 est le dernier indice valide du tableau.',
      },
      empiler: {
        label: 'Empiler',
        complexity: 'O(1)',
        note: 'Tester pilePleine, avancer sommet, puis écrire dans la nouvelle case.',
      },
      depiler: {
        label: 'Dépiler',
        complexity: 'O(1)',
        note: 'Lire la valeur au sommet, puis reculer sommet.',
      },
      sommetPile: {
        label: 'Lire le sommet',
        complexity: 'O(1)',
        note: 'Consulter la valeur sans la retirer.',
      },
      afficherPile: {
        label: 'Afficher la pile',
        complexity: 'O(n)',
        note: 'Parcours de l’indice 0 jusqu’à sommet.',
      },
      empilerCopie: {
        label: 'Empiler une copie',
        complexity: 'O(1)',
        note: 'Exercice 1 : empilerCopie délègue à empiler.',
      },
      corrigerCopie: {
        label: 'Corriger une copie',
        complexity: 'O(1)',
        note: 'Exercice 1 : corrigerCopie dépile et affiche le numéro corrigé.',
      },
      parenthesesEquilibrees: {
        label: 'Parenthèses équilibrées',
        complexity: 'O(n)',
        note: 'Exercice 3 : la pile mémorise les ( encore à refermer.',
      },
      initFile: {
        label: 'Initialiser la file',
        complexity: 'O(1)',
        note: 'Les repères reprennent les valeurs initiales de la version choisie.',
      },
      fileVide: {
        label: 'Tester si la file est vide',
        complexity: 'O(1)',
        note: 'Le test dépend de la version de la file.',
      },
      filePleine: {
        label: 'Tester si la file est pleine',
        complexity: 'O(1)',
        note: 'Le test dépend de la version de la file.',
      },
      enfilerOrdinaire: {
        label: 'Enfiler',
        complexity: 'O(1)',
        note: 'Version 1 : av reçoit 0 si la file était vide, puis ar avance.',
      },
      defilerOrdinaire: {
        label: 'Défiler',
        complexity: 'O(1)',
        note: 'Version 1 : av avance ; ar ne redescend jamais.',
      },
      afficherFileOrdinaire: {
        label: 'Afficher la file',
        complexity: 'O(n)',
        note: 'Parcours de av à ar.',
      },
      enfilerDecalage: {
        label: 'Enfiler',
        complexity: 'O(1)',
        note: 'Version 2 : ar est un compteur ; on écrit à l’indice ar puis ar++.',
      },
      defilerDecalage: {
        label: 'Défiler',
        complexity: 'O(n)',
        note: 'Version 2 : toutes les cases restantes glissent d’un cran vers la gauche.',
      },
      afficherFileDecalage: {
        label: 'Afficher la file',
        complexity: 'O(n)',
        note: 'La tête est toujours à l’indice 0.',
      },
      enfilerCirculaire: {
        label: 'Enfiler',
        complexity: 'O(1)',
        note: 'Version 3 : ar avance modulo MAX, av rejoint ar si la file était vide.',
      },
      defilerCirculaire: {
        label: 'Défiler',
        complexity: 'O(1)',
        note: 'Version 3 : av avance modulo MAX, ou les deux repères repassent à -1.',
      },
      afficherFileCirculaire: {
        label: 'Afficher la file',
        complexity: 'O(n)',
        note: 'Parcours circulaire de av à ar.',
      },
      enregistrerArrivee: {
        label: 'Enregistrer une arrivée',
        complexity: 'O(1)',
        note: 'Exercice 2 : enregistrerArrivee délègue à enfiler.',
      },
      guichetSuivant: {
        label: 'Servir le suivant',
        complexity: 'O(1)',
        note: 'Exercice 2 : guichetSuivant délègue à defiler puis affiche le numéro.',
      },
      recupererMax: {
        label: 'Récupérer le maximum',
        complexity: 'O(n)',
        note: 'Exercice 4 : deux rotations préservent l’ordre FIFO ; un seul maximum est retiré.',
      },
    },
    params: {
      texte: 'Chaîne à vérifier',
    },
    captions: {
      operationDone:
        'Opération terminée. Le tableau, les repères et les valeurs périmées sont à jour.',
      initStack: 'On initialise `sommet` à -1 : la pile ne contient aucune valeur.',
      initFileOrdinaire: 'On initialise la file : `av = -1` et `ar = -1`.',
      initFileDecalage: 'On initialise la file : `ar = 0`, car `ar` compte les éléments.',
      initFileCirculaire: 'On initialise la file circulaire : `av = -1` et `ar = -1`.',
      stackEmptyReason: (sommet: number, empty: boolean) =>
        empty
          ? `\`sommet\` vaut \`${sommet}\` : la pile est vide.`
          : `\`sommet\` vaut \`${sommet}\` : la pile contient au moins une valeur.`,
      stackFullReason: (sommet: number, full: boolean, capacity: number) =>
        full
          ? `\`sommet\` vaut \`${sommet}\`, soit l’indice \`MAX - 1\` : la pile est pleine.`
          : `\`sommet\` vaut \`${sommet}\` : il reste de la place jusqu’à l’indice ${capacity - 1}.`,
      fileEmptyReasonOrdinaire: (av: number, empty: boolean) =>
        empty
          ? `\`av\` vaut \`${av}\` : la file est vide.`
          : `\`av\` vaut \`${av}\` : la file contient au moins un élément.`,
      fileEmptyReasonDecalage: (ar: number, empty: boolean) =>
        empty
          ? `\`ar\` vaut \`${ar}\` : aucun élément dans la file.`
          : `\`ar\` vaut \`${ar}\` : la file contient ${ar} élément${ar > 1 ? 's' : ''}.`,
      fileEmptyReasonCirculaire: (av: number, empty: boolean) =>
        empty
          ? `\`av\` vaut \`${av}\` : la file est vide.`
          : `\`av\` vaut \`${av}\` : la file contient au moins un élément.`,
      fileFullReasonOrdinaire: (ar: number, full: boolean, capacity: number) =>
        full
          ? `\`ar\` vaut \`${ar}\` = \`MAX - 1\` : plus aucune case en queue, même si des cases en tête sont libres.`
          : `\`ar\` vaut \`${ar}\` : on peut encore écrire jusqu’à l’indice ${capacity - 1}.`,
      fileFullReasonDecalage: (ar: number, full: boolean, capacity: number) =>
        full
          ? `\`ar\` vaut \`${ar}\` = \`MAX\` : les ${capacity} cases sont occupées.`
          : `\`ar\` vaut \`${ar}\` : il reste ${capacity - ar} case${capacity - ar > 1 ? 's' : ''} libre${capacity - ar > 1 ? 's' : ''}.`,
      fileFullReasonCirculaire: (ar: number, av: number, full: boolean, capacity: number) =>
        full
          ? `\`(ar + 1) % MAX\` = \`${(ar + 1) % capacity}\` et \`av\` = \`${av}\` : la file est pleine.`
          : `\`(ar + 1) % MAX\` = \`${(ar + 1) % capacity}\` et \`av\` = \`${av}\` : la file n’est pas pleine.`,
      fullErrorPile: 'La pile est pleine : `printf` signale l’erreur et `return` sort sans écrire.',
      fullErrorFile: 'La file est pleine : `printf` signale l’erreur et `return` sort sans écrire.',
      pushIncrement: (next: number, index: number) =>
        `On avance \`sommet\` à \`${next}\` : la nouvelle valeur sera écrite dans la case d’indice ${index}.`,
      pushWrite: (value: number, index: number) =>
        `On écrit \`${value}\` dans \`elements[${index}]\`.`,
      popRead: (value: number, index: number) =>
        `On lit \`elements[${index}]\` : la valeur \`${value}\` est mémorisée dans \`valeur\`.`,
      popDecrement: (next: number) =>
        `On recule \`sommet\` à \`${next}\` : la case libérée reste physiquement dans le tableau.`,
      popEmpty: (sommet: number) =>
        `\`sommet\` vaut \`${sommet}\` : rien à dépiler, la fonction retourne -1 sans modifier le tableau.`,
      peekValue: (value: number, index: number) =>
        `La valeur au sommet est \`elements[${index}]\` = \`${value}\`.`,
      peekEmpty: 'La pile est vide : `sommetPile` retourne -1.',
      displayCell: (value: number, index: number) =>
        `On affiche \`elements[${index}]\` = \`${value}\`.`,
      displayDone: (count: number) =>
        `Parcours terminé : ${count} valeur${count > 1 ? 's' : ''} affichée${count > 1 ? 's' : ''}.`,
      copyCall: (numero: number) =>
        `\`empilerCopie\` appelle \`empiler\` avec le numéro de copie \`${numero}\`.`,
      correction: (value: number) =>
        `Correction de la copie ${value} : c’est la dernière empilée, donc la première corrigée (LIFO).`,
      correctionNone: 'La pile est vide : aucune copie à corriger.',
      enqueueAvZero:
        'La file était vide : `av` rejoint l’indice 0, la tête de file est créée.',
      enqueueArIncrement: (next: number) =>
        `On avance \`ar\` à \`${next}\` : la nouvelle valeur sera écrite à cet indice.`,
      enqueueWrap: (next: number) =>
        `\`ar\` revient à \`${next}\` par le modulo : la file réutilise les cases du début du tableau.`,
      enqueueWrite: (value: number, index: number) =>
        `On écrit \`${value}\` dans \`elements[${index}]\`.`,
      enqueueAvRejointAr: (ar: number) =>
        `La file était vide : \`av\` rejoint \`ar\` = \`${ar}\`.`,
      dequeueKeep:
        '`av` ne dépasse pas `ar` : la file conserve les éléments restants.',
      dequeueKeepCirculaire:
        '`av != ar` : la file conserve encore des éléments après ce retrait.',
      resetAv: '`av` repasse à `-1` : la file n’a plus de tête.',
      resetAr: '`ar` repasse à `-1` : la file n’a plus de queue.',
      displayAdvance: (next: number) =>
        `L’indice de parcours avance modulo MAX à \`${next}\`.`,
      guichetServedReason: (value: number) =>
        `\`numero\` vaut \`${value}\` : un étudiant peut être servi.`,
      guichetEmptyReason: '`numero` vaut `-1` : la file était vide.',
      displayFileEmpty: 'La file est vide : on affiche seulement un retour à la ligne.',
      recupererMaxSize: (count: number) =>
        `La file contient \`n = ${count}\` élément${count > 1 ? 's' : ''} (calculé avec av, ar et MAX).`,
      recupererMaxFirstPass: 'Premier tour : on fait tourner toute la file pour trouver le maximum.',
      enqueueRejected: 'La valeur n’est pas écrite : `enfiler` sort immédiatement.',
      dequeueRead: (value: number, index: number) =>
        `La tête de file est \`elements[${index}]\` = \`${value}\`.`,
      dequeueAdvanceAv: (next: number) =>
        `\`av\` avance à \`${next}\` : la case lue sort de la file et sa valeur reste affichée en grisé.`,
      dequeueReset: '`av` dépasse `ar` : la file devient vide, on remet `av` et `ar` à -1.',
      dequeueLastReset:
        '`av == ar` : c’était le dernier élément ; on remet `av` et `ar` à -1.',
      dequeueCircularAdvance: (next: number) =>
        `\`av\` avance modulo MAX à \`${next}\`.`,
      dequeueShiftCell: (index: number, value: number) =>
        `\`elements[${index + 1}]\` glisse dans \`elements[${index}]\` : on retrouve \`${value}\`.`,
      dequeueShiftDone: (removed: number, count: number) =>
        `La valeur \`${removed}\` est sortie ; ${count - 1} valeur${count > 2 ? 's ont' : ' a'} été décalée${count > 2 ? 's' : ''}.`,
      dequeueDecrement: (next: number) =>
        `\`ar\` décroît à \`${next}\` : le compteur d’éléments diminue.`,
      dequeueEmpty: 'La file est vide : `defiler` retourne -1 sans modifier les repères.',
      guichetServed: (value: number) =>
        `Guichet : l’étudiant ${value}, premier arrivé, est le premier servi (FIFO).`,
      guichetEmpty: 'Aucun étudiant à servir : `defiler` retourne -1.',
      recupererMaxEmpty: 'La file est vide : `recupererMax` retourne -1.',
      recupererMaxScan: (count: number, max: number) =>
        `Premier tour : ${count} élément${count > 1 ? 's' : ''} à examiner ; maximum courant = \`${max}\`.`,
      recupererMaxFound: (value: number) =>
        `\`${value}\` est supérieur au maximum courant : on le retient.`,
      recupererMaxRotate: (value: number) =>
        `On remet \`${value}\` en queue : la rotation conserve l’ordre FIFO.`,
      recupererMaxRemove: (value: number) =>
        `Deuxième tour : on retire une seule copie du maximum \`${value}\`.`,
      recupererMaxKeep: (value: number) =>
        `\`${value}\` n’est pas le maximum choisi : on le remet en queue.`,
      recupererMaxDone: (max: number) =>
        `Le maximum \`${max}\` est retourné ; les autres valeurs ont gardé leur ordre FIFO.`,
      charOpen: (char: string, index: number) =>
        `\`texte[${index}]\` vaut \`${char}\` : on empile cette parenthèse ouvrante.`,
      charClose: (char: string, index: number) =>
        `\`texte[${index}]\` vaut \`${char}\` : on cherche une ouvrante à dépiler.`,
      charIgnored: (char: string, index: number) =>
        `\`texte[${index}]\` vaut \`${char}\` : ce caractère ne change pas la pile.`,
      nextCharacter: (index: number) =>
        `Le caractère d’indice ${index} est traité : la boucle passe au suivant.`,
      loopDone: 'La chaîne est entièrement lue : la boucle s’arrête.',
      parenthEmptyError:
        'La pile est vide au moment de dépiler : les parenthèses ne sont pas équilibrées, retour 0.',
      parenthPop: 'On dépile la `(` correspondante : elle est refermée.',
      parenthValid: 'Fin de la chaîne : la pile est vide, les parenthèses sont équilibrées (retour 1).',
      parenthInvalid:
        'Fin de la chaîne : il reste des `(` non refermées, les parenthèses ne sont pas équilibrées (retour 0).',
      displayFileDone: (count: number) =>
        `La file affiche ${count} valeur${count > 1 ? 's' : ''} dans l’ordre FIFO.`,
    },
    scenarios: {
      pileCopies: {
        title: 'Exercice 1 · la pile de copies',
        description:
          'Trois empilements (12, 7, 25) puis deux corrections. La trace du cours donne sommet = 0, 1, 2, 1, 0.',
      },
      pilePleine: {
        title: 'Pile pleine, puis dépiler',
        description:
          'Remplir les cinq cases, constater le refus du sixième empilement, dépiler une fois et réessayer.',
      },
      parentheses: {
        title: 'Exercice 3 · parenthèses équilibrées',
        description:
          'Vérifier « (()) », puis « (() » et « )( » : la pile détecte l’ouvrante manquante et la fermante orpheline.',
      },
      fileTrace: {
        title: 'Exercice 2 · le guichet',
        description:
          'Quatre arrivées (65, 66, 67, 68) puis deux départs. Trace du cours : av/ar = (0,0), (0,1), (0,2), (0,3), (1,3), (2,3).',
      },
      fileGaspillage: {
        title: 'Le défaut de la version 1',
        description:
          'La file est pleine, on défile deux fois : enfiler refuse encore alors que deux cases en tête sont libres.',
      },
      fileDecalage: {
        title: 'Le coût du décalage',
        description:
          'Défiler deux fois et enfiler ensuite : chaque defiler déplace toutes les valeurs restantes.',
      },
      fileReutilisation: {
        title: 'La file circulaire réutilise les cases',
        description:
          'Après deux défilements, ar revient à 0 et les nouvelles valeurs réutilisent le début du tableau.',
      },
      recupererMax: {
        title: 'Exercice 4 · récupérer le maximum',
        description:
          'Deux rotations de la file circulaire : trouver le maximum, puis le retirer sans casser l’ordre FIFO des autres valeurs.',
      },
    },
    viz: {
      ariaLabel: 'Tableau statique, indices et repères de la structure',
      array: 'elements[MAX]',
      capacity: (capacity: number) => `capacité ${capacity}`,
      index: 'indice',
      sommet: 'sommet',
      av: 'av',
      ar: 'ar',
      head: 'tête',
      tail: 'queue',
      live: 'dans la structure',
      stale: 'hors structure',
      free: 'libre',
      staleShort: 'périmée',
      rank: 'ordre FIFO',
      arrival: (rank: number) => (rank === 1 ? '1er arrivé' : `${rank}e arrivé`),
      ringCase: (index: number) => `Case ${index}`,
      ringSlots: 'Cases de l’anneau',
      ringUndefined: 'indice indéfini : la file est vide',
      ringUndefinedShort: 'non défini',
      wrapFormula: (from: number, max: number, to: number) =>
        `(${from} + 1) % ${max} = ${to}`,
      freeSlots: (free: number) =>
        `${free} case${free > 1 ? 's' : ''} libre${free > 1 ? 's' : ''}`,
      fifo: 'sens FIFO',
      stateEmptyPile: 'Pile vide',
      stateEmptyFile: 'File vide',
      stateEmptyFileDecalage: 'File vide',
      stateFullPile: 'Pile pleine',
      stateFullFile: 'File pleine',
      stateCount: (count: number, capacity: number) =>
        `${count} / ${capacity} case${count > 1 ? 's' : ''} occupée${count > 1 ? 's' : ''}`,
      pileHint: 'LIFO : le dernier empilé est le premier dépilé.',
      emptyPile: 'Pile vide : `sommet = -1`.',
      emptyFile: 'File vide : `av = ar = -1`.',
      emptyFileDecalage: 'File vide : `ar = 0`.',
      fullPile: 'Pile pleine : `sommet = MAX - 1`.',
      fullFile: 'File pleine : aucune case libre.',
      fullFileCirculaire: 'File pleine : `(ar + 1) % MAX == av`.',
      insertPile: '＋ Empiler une première valeur',
      insertFile: '＋ Enfiler un premier client',
      returned: 'Valeur retournée',
      tape: 'Chaîne lue',
      tapeReady: 'Prête',
      tapeScanning: 'Lecture en cours',
      tapeValid: 'Équilibrées',
      tapeInvalid: 'Déséquilibrées',
      tapePosition: (index: number, length: number) =>
        `caractère ${Math.min(index + 1, length)} / ${length}`,
      ordinaireHint: 'ar ne redescend jamais : les cases libérées sont perdues.',
      decalageHint: 'defiler décale toutes les cases restantes vers la gauche.',
      circulaireHint: 'ar revient à 0 par le modulo, sans case réservée.',
      wrap: 'retour à 0',
      legend: 'Légende',
      legendLive: 'case utilisée',
      legendStale: 'valeur périmée',
      legendEmpty: 'case libre',
      fit: 'Ajuster',
      zoomIn: 'Zoom avant',
      zoomOut: 'Zoom arrière',
      zoomReset: 'Revenir à l’ajustement automatique',
      auto: 'Auto',
      manual: 'Manuel',
      bilanOpen: 'Bilan des 3 files',
      bilanClose: 'Fermer le bilan',
    },
    bilan: {
      title: 'Bilan des 3 files',
      subtitle: 'Trois implantations successives, deux avantages à réunir.',
      columns: {
        version: 'Version',
        defiler: 'defiler',
        space: 'Espace',
        variables: 'Variables',
        trap: 'Piège',
      },
      rows: [
        {
          version: 'Ordinaire',
          defiler: 'Immédiat',
          space: 'Gaspillé',
          variables: 'av, ar',
          trap: 'ar ne redescend jamais',
        },
        {
          version: 'Décalage',
          defiler: 'Coûteux (parcours)',
          space: 'Récupéré',
          variables: 'ar seul',
          trap: 'Oublier le décalage',
        },
        {
          version: 'Circulaire',
          defiler: 'Immédiat',
          space: 'Récupéré',
          variables: 'av, ar',
          trap: 'Gérer les 2 transitions',
        },
      ],
      note:
        'La version circulaire cumule les deux avantages : accès immédiat en tête et réutilisation des cases.',
      pileTraceTitle: 'Trace de l’exercice 1 · pile de copies',
      pileTraceColumns: {
        step: 'Étape',
        action: 'Action',
        content: 'Contenu',
        sommet: 'sommet',
      },
      pileTraceRows: [
        { step: '1', action: 'empiler(12)', content: '12', sommet: '0' },
        { step: '2', action: 'empiler(7)', content: '7 12', sommet: '1' },
        { step: '3', action: 'empiler(25)', content: '25 7 12', sommet: '2' },
        { step: '4', action: 'corrigerCopie()', content: '7 12', sommet: '1' },
        { step: '5', action: 'corrigerCopie()', content: '12', sommet: '0' },
      ],
      fileTraceTitle: 'Trace de l’exercice 2 · guichet circulaire',
      fileTraceColumns: {
        step: 'Étape',
        action: 'Action',
        av: 'av',
        ar: 'ar',
      },
      fileTraceRows: [
        { step: '1', action: 'enfiler(65)', av: '0', ar: '0' },
        { step: '2', action: 'enfiler(66)', av: '0', ar: '1' },
        { step: '3', action: 'enfiler(67)', av: '0', ar: '2' },
        { step: '4', action: 'enfiler(68)', av: '0', ar: '3' },
        { step: '5', action: 'defiler()', av: '1', ar: '3' },
        { step: '6', action: 'defiler()', av: '2', ar: '3' },
      ],
      traceNote:
        'La dernière copie empilée est la première corrigée (LIFO) ; le premier étudiant arrivé est le premier servi (FIFO).',
    },
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
    circularOps: {
      afficherListe: {
        label: 'Afficher la liste',
        complexity: 'O(n)',
        note: 'Parcours do … while jusqu’au retour sur debut.',
      },
      insererEnTete: {
        label: 'Insérer en tête',
        complexity: 'O(n)',
        note: 'Il faut atteindre le dernier nœud pour le raccorder à la nouvelle tête.',
      },
      insererEnFin: {
        label: 'Insérer en fin',
        complexity: 'O(n)',
        note: 'Parcours jusqu’au nœud dont le suivant est debut.',
      },
      supprimerEnTete: {
        label: 'Supprimer en tête',
        complexity: 'O(n)',
        note: 'Le dernier nœud doit être raccordé au nouveau debut.',
      },
      supprimerValeur: {
        label: 'Supprimer une valeur',
        complexity: 'O(n)',
        note: 'Parcours circulaire ; la tête est retirée via supprimerEnTete.',
      },
      rechercher: {
        label: 'Rechercher une valeur',
        complexity: 'O(n)',
        note: 'Parcours do … while qui s’arrête au retour sur debut.',
      },
      detruireListe: {
        label: 'Détruire la liste',
        complexity: 'O(n)',
        note: 'On coupe le lien circulaire, puis on libère les nœuds linéairement.',
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
      circularLoopStart:
        'On entre dans la boucle `do … while` : le premier nœud est traité avant le test.',
      circularStop: '`courant` est revenu sur `debut` : le parcours circulaire s’arrête.',
      circularContinue: '`courant` n’est pas revenu sur `debut` : le parcours continue.',
      circularSelfLink:
        'La liste était vide : `nouveau->suivant` pointe vers `nouveau`, le cercle est fermé.',
      circularLinkLast: 'Le dernier nœud pointe maintenant vers `nouveau`.',
      circularClose: '`nouveau->suivant` reçoit `debut` : le cercle reste fermé.',
      circularNewHead: '`debut` pointe maintenant sur `nouveau` : la nouvelle tête est en place.',
      circularSingle: '`debut->suivant == debut` : un seul nœud, le cercle se réduit à lui-même.',
      circularMultiple: '`debut->suivant != debut` : la liste contient plusieurs nœuds.',
      circularLastFound: '`dernier->suivant` vaut `debut` : `dernier` est le dernier nœud du cercle.',
      circularNotLast: '`dernier->suivant` n’est pas `debut` : on avance dans le cercle.',
      circularRemoveHead:
        'On avance `debut` sur `debut->suivant`, puis on raccorde le dernier nœud au nouveau `debut`.',
      circularRelinkLast:
        'Le dernier nœud pointe maintenant vers le nouveau `debut` : le cercle est refermé.',
      circularSingleRemove: 'Le nœud était seul : `debut` reçoit `NULL` avant la libération.',
      circularHeadDelegation:
        '`courant` pointe sur `debut` : on délègue à `supprimerEnTete` pour refermer le cercle.',
      circularNotHead:
        '`courant` n’est pas `debut` : `precedent` permet de détacher le nœud sans casser le cercle.',
      circularDetach:
        'On relie `precedent->suivant` à `courant->suivant` : le nœud est sauté, puis libéré.',
      circularAfterHeadCall:
        'On revient dans `supprimerValeur` : la tête a été retirée et le cercle est refermé.',
      circularBreakRing:
        'On coupe le lien du dernier nœud vers `debut` : la liste redevient linéaire pour la libération.',
      circularDestroyHead:
        'On retire la tête courante, puis on recommence tant que `debut` n’est pas `NULL`.',
      circularNotFound:
        'Le parcours est revenu sur `debut` sans trouver la valeur : la fonction retourne `0`.',
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
      circulaire: {
        cours: {
          title: 'Le cours : l’anneau 9 → 2 → 5',
          description:
            'Charge la liste simplement chaînée circulaire : le dernier nœud (5) pointe vers debut (9).',
        },
        milieu: {
          title: 'Supprimer au milieu (circulaire)',
          description:
            'Supprimer 2 puis 5 dans l’anneau : un seul pointeur precedent suffit pour détacher un nœud.',
        },
        tete: {
          title: 'Les deux extrémités (circulaire)',
          description: 'Insérer 9 en tête puis 7 en fin, et afficher l’anneau obtenu.',
        },
        absente: {
          title: 'Valeur absente (circulaire)',
          description:
            'Supprimer 99 puis rechercher 99 : le parcours revient sur debut sans trouver la valeur.',
        },
        detruire: {
          title: 'Détruire l’anneau',
          description:
            'Couper le lien circulaire, puis libérer 9 → 2 → 5 nœud par nœud jusqu’à debut == NULL.',
        },
        vide: {
          title: 'Anneau vide',
          description:
            'Point de départ vide : insérer un premier nœud referme le cercle sur lui-même.',
        },
        single: {
          title: 'Anneau à un seul nœud',
          description:
            'Un unique nœud : son champ suivant pointe vers lui-même, formant une boucle visible.',
        },
        supprimerSeul: {
          title: 'Supprimer l’unique nœud',
          description:
            'Supprimer l’unique nœud de l’anneau : debut repasse à NULL et la liste redevient vide.',
        },
        supprimerDebut: {
          title: 'Supprimer le début (circulaire)',
          description:
            'Supprimer la tête 9 : le dernier nœud (5) est raccordé au nouveau debut (2).',
        },
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
      insererApresValeur: {
        label: 'Insérer après une valeur',
        complexity: 'O(n)',
        note: 'Parcours circulaire jusqu’à la valeur, puis raccord du nouveau nœud entre courant et courant->suivant.',
      },
      insererAvantValeur: {
        label: 'Insérer avant une valeur',
        complexity: 'O(n)',
        note: 'Parcours circulaire jusqu’à la valeur, puis raccord via courant->precedent ; la tête est mise à jour si nécessaire.',
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
      inverserListe: {
        label: 'Inverser la liste',
        complexity: 'O(n)',
        note: 'Un tour de cercle : chaque nœud échange suivant et precedent, puis le dernier devient debut.',
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
      insertedAfter:
        '`nouveau` est inséré après `courant` : les deux voisins sont raccordés, le cercle reste fermé.',
      insertedBefore:
        '`nouveau` est inséré avant `courant` : le raccord passe par `courant->precedent`, le cercle reste fermé.',
      reasonHeadInsert: '`courant` est `debut` : le nouveau nœud devient la tête du cercle.',
      reasonNotHeadInsert: '`courant` n’est pas `debut` : `debut` reste inchangé.',
      notFoundInsert:
        'Le parcours est revenu sur `debut` sans trouver la valeur : aucun nœud inséré.',
      reverseStop:
        'On est revenu à `debut` : chaque nœud a été inversé, le dernier devient la nouvelle tête.',
    },
    scenarios: {
      vide: {
        title: 'Liste vide',
        description:
          'Etat initial : debut == NULL, aucun nœud, aucun NULL à l’intérieur d’un cercle.',
      },
      cours: {
        title: 'Le cours : le cercle 9 → 2 → 5',
        description:
          'Charge la LDC circulaire du cours : le dernier nœud (5) pointe vers debut (9).',
      },
      deux: {
        title: 'Deux nœuds : deux arcs extérieurs',
        description:
          'Les deux nœuds se font face ; chaque côté porte une paire d’arcs parallèles suivant/precedent.',
      },
      quatre: {
        title: 'Quatre nœuds : le carré',
        description:
          'Les nœuds occupent les quatre coins ; chaque côté du carré porte une paire de flèches parallèles.',
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
      apres: {
        title: 'Insérer après une valeur',
        description:
          'Insérer 7 après le nœud 2 : le nouveau nœud se raccorde entre 2 et 5, sans casser le cercle.',
      },
      avant: {
        title: 'Insérer avant la tête',
        description:
          'Insérer 7 avant le nœud 9 : le nouveau nœud devient debut et le dernier pointe vers lui.',
      },
      supprimerTete: {
        title: 'Supprimer la tête',
        description:
          'Supprimer le nœud 9 : debut avance sur 2 et le dernier nœud 5 se raccorde au nouveau debut.',
      },
      supprimerFin: {
        title: 'Supprimer le dernier nœud',
        description:
          'Supprimer le nœud 5 : 2 devient le dernier et son suivant revient directement sur debut.',
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
      inverser: {
        title: 'Inverser le cercle',
        description:
          'Parcourir un tour en échangeant suivant et precedent, puis replacer debut sur l’ancien dernier nœud.',
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
    fin: 'fin : variable globale',
    sommet: 'sommet : variable globale',
    file: 'debut et fin : variables globales',
    local: 'variable locale',
  },
  viz: {
    empty: 'Liste vide. Insérez un nœud.',
    emptyInsert: '＋ Insérer un nœud',
    emptyLsc: 'debut vaut NULL : la liste est vide.',
    emptyLscCirculaire: 'debut vaut NULL : l’anneau est vide.',
    emptyPile: 'sommet vaut NULL : la pile est vide.',
    emptyFile: 'debut et fin valent NULL : la file est vide.',
    insertEmptyLsc: '＋ Insérer un premier nœud',
    insertEmptyLscCirculaire: '＋ Insérer un premier nœud dans l’anneau',
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
