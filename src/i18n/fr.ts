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
      {
        chapter: 2,
        title: 'Listes simplement chaînées',
        description: 'Parcours, insertion et suppression avec un seul lien suivant.',
      },
      {
        chapter: 3,
        title: 'Piles et files dynamiques',
        description: 'Piles et files implantées avec des nœuds alloués dynamiquement.',
      },
      {
        chapter: 5,
        title: 'Listes doublement chaînées circulaires',
        description: 'Listes à double lien dont le dernier nœud reboucle sur le premier.',
      },
    ],
    footer: 'Tout fonctionne hors ligne : un seul fichier, aucune connexion.',
    backArrow: '←',
    backLabel: 'Menu',
    backAria: 'Revenir au menu principal',
  },
  chapters: {
    ldc: {
      description: 'Profils Entiers et Étudiants, 8 scénarios guidés.',
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
    int: 'Entiers',
    etudiant: 'Étudiants',
    switchHint: 'Changer de profil réinitialise la liste.',
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
    local: 'variable locale',
  },
  viz: {
    empty: 'Liste vide. Insérez un nœud.',
    emptyInsert: '＋ Insérer un nœud',
    heap: 'tas (malloc)',
    row: 'liste',
    freed: 'libéré',
    clickNode: 'Cliquer pour utiliser ce nœud',
    address: 'adresse',
    prevCell: 'prec',
    nextCell: 'suiv',
    null: 'NULL',
    pinned: 'pointeur',
    dangling: 'pointeur pendant',
    noNode: 'aucun nœud',
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
