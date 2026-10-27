# DS Visualizer — Structures de données en C

A single-page, fully offline French teaching platform for data structures in C (`Structures de données`), built with Vite + React + TypeScript. Each chapter is an independent plugin behind one shared player, visualization shell, and chapter menu. The project turns the professor's static course PDFs into interactive, step-by-step demos, with the handouts one click away in a side drawer.

**All six chapters are available:** static stacks and queues (`piles-files-statiques`), singly linked lists (`lsc`), dynamic stacks and queues (`pile` / `file`), doubly linked lists (`ldc`), circular doubly linked lists (`lddc`), and binary trees (`trees`).

## Run

```bash
npm ci        # once, uses package-lock.json
npm test      # vitest suite (361 tests)
npm run lint  # oxlint
npm run build # typecheck + single-file offline build
npm run dev   # local dev server
```

`npm run build` produces **one self-contained `dist/index.html`** (`vite-plugin-singlefile`). Open it by double-click: no server and no network access are required — no CDNs, no external fonts or images. The optional course PDFs are the only sibling assets (see below).

To publish it, follow [DEPLOY.md](DEPLOY.md): Cloudflare Pages, free plan, static, no backend.

Navigation is hash-based so it also works from `file://`: `#/` (main menu, the entry point) and `#/chapitre-1` through `#/chapitre-6` for the six chapters. Unknown hashes fall back to the menu, and `Échap` or the `← Menu` header button leaves the demo.

### Course PDFs

The six course handouts ship as `public/cours/chapitre-<n>.pdf` (`chapitre-1.pdf` … `chapitre-6.pdf`, ~5.4 MB total). The document button in the header opens the matching PDF in a right-side drawer, with a direct **Ouvrir dans un nouvel onglet** fallback. Drag the drawer's left edge (or focus it and use `←`/`→`) to widen or narrow it; double-click resets the width, which is kept while the app stays open. The PDFs are copied to `dist/cours/`; they are never inlined, so the HTML stays around 1 MB whatever their size. Missing files do not break the app or the build, but the drawer has nothing to display for that chapter. Some browsers refuse to embed PDFs from `file://`; the new-tab link still opens the document.

## Chapters

### Chapitre 1 — Piles et files statiques (`piles-files-statiques`)

Four fixed-size array profiles sharing one table renderer, with `MAX = 5` cells:

- **Pile** (`pile`): LIFO stack driven by `sommet` — push, pop, top, empty/full checks, display and initialization, plus the course exercises `empilerCopie`, `corrigerCopie` and balanced-parentheses checking.
- **File 1 · ordinaire** (`file-ordinaire`): front/back queue showing that ordinary dequeues leave unusable free cells at the head of the array.
- **File 2 · décalage** (`file-decalage`): the same queue with a shift after every dequeue, making the cost of keeping the block packed visible.
- **File 3 · circulaire** (`file-circulaire`): `av` / `ar` wrap with `% MAX`; drawn as an animated ring with live pointers, arrival badges, used / stale / free sectors, the wrap arc and the okay/refused full state. It also exposes the `recupererMax` rotation exercise.
- 10 guided scenarios cover stack copies, a full stack, parentheses, ordinary/decalage/circular traces, cell reuse and maximum retrieval.

The circular profile adds two side cards: **Calcul des indices** evaluates both `(ar + 1) % MAX` and `(av + 1) % MAX` on every step (including stale targets), and **Mémoire · elements[MAX]** colours every cell as free, live, stale, head, tail, or both when the queue holds a single element. Hovering or keyboard-focusing a ring slot highlights the matching memory cell, and vice versa.

### Chapitre 2 — Listes simplement chaînées (`lsc`)

- **Entiers** (`int`): the course list `9 → 2 → 5`; display, insert head/tail, delete head/by-value, search and destroy.
- **Circulaire** (`circulaire`): the same integer operations on a closed ring (`5.suivant == 9`), with `debut` kept outside the ring. The shared ring router mirrors the `suivant` cell per node so the dot faces its successor, uses straight dot-to-border links from four nodes upwards, outward rounded arcs for the two- and three-node drawings, and a visible self-loop for a single node. Every arrowhead lands on the target border without crossing a foreign card for 0–8 nodes.
- **Étudiants** (`etudiant`): a student registry (`E1 = {101, AAA, aaa}`, …) with display, `inscrireEtudiant`, `radierEtudiant` and `detruireListe`.

### Chapitre 3 — Piles et files dynamiques (`pile` / `file`)

- **Pile** (`pile`): LIFO stack with `sommet` and `precedent`; push, pop, empty check, destroy, plus the course exercises `empilerCopie` and `corrigerCopie`.
- **File** (`file`): FIFO queue with `debut` / `fin` and `suivant`; enqueue, dequeue (including the `fin = NULL` trap when the last node leaves), empty check, destroy, plus student arrivals and service.

### Chapitre 4 — Listes doublement chaînées (`ldc`)

- **Entiers** (`int`): the course list `9 ⇄ 2 ⇄ 5` and all classic operations — display forward/backward, insert head/tail/after/before, delete head/by-value, search, destroy, reverse.
- **Étudiants** (`etudiant`): a student registry (`E1 = {101, AAA, aaa}`, …) with `inscrireEtudiant` and `radierEtudiant`.

### Chapitre 5 — Listes doublement chaînées circulaires (`lddc`)

- **Entiers** (`int`): opens on the empty-list scenario (`debut == NULL`); the course ring `9 ⇄ 2 ⇄ 5`, where `5.suivant == 9` and `9.precedent == 5`, is one click away in the scenarios menu. It is drawn in radial circular geometry and supports display one full turn forward/backward, $O(1)$ insert head/tail via `debut->precedent`, insert after/before, delete head/by-value (empty, single node, head, last, middle, absent, duplicates), search, destroy, reverse and the head turn `passerAuSuivant`.
- **Étudiants** (`etudiant`): a circular student registry (`E1 = {101, AAA, aaa}`, …) with display forward/backward, `inscrireEtudiant` in $O(1)$, `radierEtudiant`, `passerAuSuivant` and `detruireListe`.
- A standalone C11 program is provided in [`c/chapitre-5/lddc.c`](c/chapitre-5/lddc.c); it builds the course ring, exercises every integer operation, verifies the circular invariants after each step and leaves no allocation behind (`gcc -std=c11 -Wall -Wextra -pedantic`).

### Chapitre 6 — Arbres binaires (`trees`)

- **Entiers** (`int`): build the six-node course tree with `creerNoeud`, then animate recursive prefix, infix, and postfix traversals and postorder destruction. A `Pile d’appels` panel shows each recursive frame, its argument, source line and traversal phases, with optional NULL calls; the exercise tree and empty-tree base case are available as guided scenarios. Binary search tree operations are reserved for Chapter 7.

For the list, stack, and queue chapters, the demo shows:

- the exact canonical C code with the current statement highlighted;
- a mutable SVG layout: `precedent` / `valeur` / `suivant` cells, forward (solid blue) and backward (dashed orange) arrows, `NULL` terminators, fake heap addresses, freed-node hatching, and pointer pins (`debut`, `sommet`, `fin`, `courant`, `nouveau`, `temp`, `dernier`, …);
- pointer rewrites animated red (old, dashed) → green (new);
- a step-by-step player with French captions, condition evaluations, badges (`cas-particulier`, `debut-modifie`), live printf console, watch panel (globals + locals), and a call journal;
- a header document button that opens the current chapter's course PDF in a resizable right-side drawer;
- 10 ready-made scenarios for the static structures, 8 for the doubly linked list, 18 for the circular list (15 integer + 3 student), and 4 for the binary tree, loadable from the header.

One step = one executed C statement (including every condition/loop evaluation). Snapshots are fully frozen; stepping backwards is exact.

### Chapter registry

All six chapters are registered in `src/registry.ts` and exposed as active menu cards; `fr.menu.soonItems` is empty. A future chapter means a new plugin folder plus one registration line: the menu card, profile switcher, routes and keyboard shell are derived from the registry, so `core/` and `ui/` stay unchanged. If a chapter is announced before implementation, it can be listed as a disabled **Bientôt disponible** card in `soonItems`.

## Architecture

```
src/
  core/                  generic engine: result types, playback state machine
  structures/piles-files-statiques/ chapitre 1 plugin: fixed-size stack and queue
                         models, circular-ring geometry/renderer, C sources, scenarios
  structures/ldc/        chapitre 4 plugin: doubly linked list memory model,
                         C sources + symbolic line labels, steps, renderer, scenarios
  structures/lddc/       chapitre 5 plugin: circular doubly linked list model,
                         C sources + symbolic labels, steps, scenarios; reuses the
                         shared renderer in circle mode
  structures/trees/      chapitre 6 plugin: binary-tree memory model, recursive
                         traversal/destruction steps, SVG renderer, scenarios
  structures/lsc/        chapitre 2 plugin: singly linked list memory model,
                         C sources + symbolic line labels, steps, scenarios
  structures/piles-files/ chapitre 3 plugin: stack and queue profiles, memory model,
                         C sources + symbolic line labels, steps, scenarios
  structures/shared/     shared linked-node SVG renderer, camera and geometry
  ui/                    shared shell, layout, panels, main menu, hash routing
  registry.ts            registers each chapter and resolves #/chapitre-<n>
c/
  chapitre-5/lddc.c      standalone C11 program for the circular list
```

The core engine does not know about arrays, lists, stacks, queues, or trees, and `ui/` never manipulates cells. Adding a chapter means a new `src/structures/<id>/` folder plus one registration line: the menu card (badge from `chapter`, `title`, `description`) and the `#/chapitre-<n>` route are derived from the registry — `core/` and `ui/` stay untouched.

The main menu is the entry point (`#/`); each card opens `#/chapitre-<chapter>`. Navigation is a hand-written `hashchange` hook (no server, works from `file://`), so the demo shell is mounted only on its own route: the demo's keyboard shortcuts are unregistered while the menu is displayed.

Key guarantees enforced by tests:

- the LDC and circular LDDC operations equal a plain-array oracle on empty / 1 / 2 / 3 / 8-element lists (head, middle, tail, absent, duplicates);
- the chapter 2 and 3 operations finish on the expected arrays and satisfy their structural invariants; the circular chapter 2 profile matches an array oracle on empty / 1 / 2 / 3 / 8-node lists and keeps `checkCircularInvariants` true after 20 random operations;
- the shared ring router keeps every `suivant` arrowhead on the target border and avoids foreign cards for 0–8 nodes, with fixed two/three/four-node drawings and shortest-side cell flips above four;
- the chapter 1 stack and three queue profiles reproduce the course traces and reject overflow / underflow; the circular ring keeps a fixed centred fit, non-colliding pointers, badges and wrap arc for capacities 3–8, and its empty callout stays outside the ring at 1366×768 and 1920×1080;
- `checkInvariants` holds after every random 20-operation LDC sequence (no cycles, mirror forward/backward walk, no reachable freed node);
- `checkCircularInvariants` holds on every final circular-list state (mirror `suivant`/`precedent`, exactly one turn, no NULL inside a non-empty ring), while `checkRingInvariants` verifies on every intermediate step that the links reachable from `debut` still form one closed walk;
- every symbolic line label points at the C line that contains its expected substring;
- every step has a non-empty French caption; snapshots are frozen and mutating them throws;
- the LDC and LDDC Visualizations render the first and last step of every scenario without error;
- workspace and dock resizing, clamping, persistence, and keyboard controls have unit and DOM coverage.

## UI shortcuts

- `← / →` previous / next step · `Space` play-pause · `Home / End` start / finish
- `↑ / ↓` faster / slower · `+ / -` zoom · `0 / F` fit · `D` bottom panels · `P` presentation · `R` reset (confirmation shown)
- `?` (header button) keyboard-shortcut popover
- `Échap` returns to the main menu (only when no popover or dialog is open)
- a mouse wheel zooms at the cursor; a laptop trackpad pans with two fingers and zooms with a pinch; drag pans, double-click fits; the toolbar also exposes −, 100 %, +, Ajuster and an Auto/Manuel chip.
- click a leaf node in the SVG to fill a "cible" parameter (used by delete-by-value, insert-after/before, radiate).
- drag a workspace or dock separator to resize; focus it and use the arrow keys to adjust (`Shift` for coarse steps, `Home`/`Enter` or double-click to reset).

## Layout notes

- The shell is a fixed `100dvh` app frame: header (64px, 56px below 800px height) + resizable workspace + full-width collapsible bottom dock (default 160px, 130px below 900px viewport height; collapsed by default below 800px).
- Workspace: visualization left, C code right, default 70/30 with a 7px separator. The left pane has a 380px minimum; the code pane has a 430px minimum (500px in presentation). The measured split is persisted, and starting a drag resynchronizes it with the rendered layout.
- Dock height ranges from 110px to `min(32vh, 520px)`; the Variables | Console | Journal columns are resizable with 200/260/220px minimum widths. The workspace split, dock height, column ratios, and focused pane are stored in versioned browser storage.
- The SVG stage uses one world-space camera `{x,y,k}` (`translate(x,y) scale(k)`); auto-fit centers the content bbox with 56px padding and clamps `k` to `[0.25, 1.3]`. During an operation the auto camera fits the union bbox of all steps. Manual zoom clamps to `[0.25, 4]`; manual mode persists across steps and operations, while scenario/profile load and reset force auto.
- The Chapter 1 circular ring has its own fixed fit: a symmetric worst-case box derived from the capacity, a 64px top inset for the HUD, origin at the drawing-canvas centre, and a track around 70% of the drawing height. AUTO returns to it after **Ajuster**; MANUEL starts only after zoom or pan and the percentage is relative to the automatic fit.
- The code panel auto-fits presentation mode from the measured monospace width and available height, clamped to 14–26px, with horizontal scroll as fallback. The left viz card contains the caption band, playback row, operation row, and scenario strip.
- The journal lives in the bottom dock; `D` toggles the dock, `P` hides only the journal while keeping Variables and Console visible. Panel focus buttons maximize one dock pane; presentation shows only Variables and Console.
- Below 1020px the workspace stacks, all separators are hidden, and the dock panels wrap at auto height.
- Verified visually with Playwright (`scripts/shots.mjs`) at 1920×1080 and 1280×720: empty, delete-middle, heap insertion, shared-node pins, reverse swap, 8 nodes, manual zoom/pan, presentation code fit, dock, dark theme, scenario/help popovers, plus chapter 2 linear and circular rings (1, 2, 3, 4 and 8 nodes), chapter 3 queue and chapter 5 circular-ring smoke screens. Chapter 1's ring was additionally checked at 1366×768, 1440×900 and 1920×1080, in light and dark themes, for the empty, one-element, full and wrapped states.

## Chapter 1 assumptions

These notes apply specifically to the `piles-files-statiques` module.

- **Fixed size.** `MAX_CELLS = 5` is the exposed capacity. The model and ring geometry accept capacities from 3 to 8 (`MAX_CAPACITY`), which the tests exercise; the UI keeps 5 so the course table and the ring stay readable.
- **One plugin, four profiles.** `pile`, `file-ordinaire`, `file-decalage` and `file-circulaire` share the same snapshot shape and table renderer. Only the circular profile draws the ring; the other three keep the linear cell row.
- **Index conventions.** The circular queue starts at `av = ar = -1` when empty. With one element, `av = ar = k` and both pointers share a single combined pill and memory marker. A dequeued value remains visible as a stale cell but is excluded from `order` and from the FIFO.
- **Ring fit.** The automatic camera depends only on capacity, never on the current values, so the ring cannot jump while stepping. The fit box must contain every pointer pair, badge, index pill and wrap chip; the empty callout sits outside that box.
- **Support cards.** **Calcul des indices** and **Mémoire · elements[MAX]** are shown for the circular profile only. They mirror the C formulas, including the full-state target and wrapped `av` / `ar` moves.

## Chapter 4 assumptions

These notes apply specifically to the `ldc` module.

- **`inverserListe`**: the course sets up the reversal deliberately with *declarations + a swap inside the loop* (`temp = courant->suivant` / `courant->suivant = courant->precedent`, `courant->precedent = temp`, and `dernier` observed as the last node reached). No `fin` global marker is used: after the loop the algorithm re-seats `debut = dernier` and the demo performs one final re-layout step (`slot/lane` reassignment) so the reversed list reads left-to-right from the new `debut`.
- **Max nodes = 8** in the demo (list + heap combined); insertions are disabled once the cap is reached with a French message.
- **No `fin` global.** Only `debut` exists, as in the course material.
- **`insererAvantValeur`**: implemented via the "one courant + check `courant->precedent`" approach shown in the course rather than the two-pointer method.
- Menu/operation labels whose text mentions the profile (`liste` vs `registre`) stay concise; all strings live in `src/i18n/fr.ts`.

## Chapter 5 assumptions

These notes apply specifically to the `lddc` module.

- **Circular model.** Every non-empty list is a ring: `dernier->suivant == debut` and `debut->precedent == dernier`. A single node points to itself in both directions. `NULL` appears only when `debut == NULL` (empty list). There is no `fin` global.
- **Reused snapshot shape.** Chapter 5 reuses chapter 4's `LdcSnapshot`, `Recorder` and renderer with `layoutMode="circle"`. The shared renderer was only extended with opt-in circle geometry; chapters 2–4 keep their row layout.
- **Entry scenario.** The integer profile declares `defaultScenarioId: 'vide'`, so opening `#/chapitre-5` (including from the menu) starts on the empty-list scenario. The course ring remains available from the scenarios menu.
- **Per-step vs final invariants.** A doubly linked ring cannot stay mirror-consistent after *every* individual C assignment (a new node is reachable before its lane changes, an old head is detached before it is freed, reversal temporarily closes a smaller sub-cycle). `checkRingInvariants` therefore checks on every step that the links reachable from `debut` form one closed walk with no NULL or freed node; `checkCircularInvariants` asserts the full reciprocal invariant on each final operation state.
- **Deletion order.** Single-node deletion clears `debut` before freeing the node, and head deletion re-seats `debut` before unlinking, so the walk from `debut` stays valid while the visualizer shows the freed node hatching.
- **`inverserListe`.** One full turn swaps `suivant` and `precedent` on every node, then `debut` is re-seated on the old last node; the row layout is reversed in a final step.
- **Max nodes = 8** in the demo (list + heap combined); insertions are disabled once the cap is reached with the same French message as chapter 4.
- **Standalone C program.** `c/chapitre-5/lddc.c` is the executable counterpart of the plugin; it uses only `malloc`/`free`, checks the circular invariants with `verifier()` after each operation and destroys the list at the end.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Work on a branch, keep changes focused, run `npm test`, `npm run lint` and `npm run build`, and never push directly to `main`.
