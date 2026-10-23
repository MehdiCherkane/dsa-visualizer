# DS Visualizer — Structures de données en C

A single-page, fully offline French teaching platform for data structures in C (`Structures de données`), built with Vite + React + TypeScript. Each chapter is an independent plugin behind one shared player, visualization shell, and chapter menu. The project replaces the professor's static course PDFs with interactive, step-by-step demos.

**Chapters 2, 3 and 4 are available now:** singly linked lists (`lsc`), dynamic stacks and queues (`pile` / `file`), and doubly linked lists (`ldc`). Chapters 1 and 5 remain planned.

## Run

```bash
npm ci        # once, uses package-lock.json
npm test      # vitest suite (144 tests)
npm run lint  # oxlint
npm run build # typecheck + single-file offline build
npm run dev   # local dev server
```

`npm run build` produces **one self-contained `dist/index.html`** (`vite-plugin-singlefile`). Open it by double-click: no server and no network access are required — no CDNs, no external fonts or images.

Navigation is hash-based so it also works from `file://`: `#/` (main menu, the entry point), `#/chapitre-2` (single linked lists), `#/chapitre-3` (stacks and queues) and `#/chapitre-4` (doubly linked lists). Unknown hashes fall back to the menu, and `Échap` or the `← Menu` header button leaves the demo.

## Chapters

### Chapitre 2 — Listes simplement chaînées (`lsc`)

- **Entiers** (`int`): the course list `9 → 2 → 5`; display, insert head/tail, delete head/by-value, search and destroy.
- **Étudiants** (`etudiant`): a student registry (`E1 = {101, AAA, aaa}`, …) with display, `inscrireEtudiant`, `radierEtudiant` and `detruireListe`.

### Chapitre 3 — Piles et files dynamiques (`pile` / `file`)

- **Pile** (`pile`): LIFO stack with `sommet` and `precedent`; push, pop, empty check, destroy, plus the course exercises `empilerCopie` and `corrigerCopie`.
- **File** (`file`): FIFO queue with `debut` / `fin` and `suivant`; enqueue, dequeue (including the `fin = NULL` trap when the last node leaves), empty check, destroy, plus student arrivals and service.

### Chapitre 4 — Listes doublement chaînées (`ldc`)

- **Entiers** (`int`): the course list `9 ⇄ 2 ⇄ 5` and all classic operations — display forward/backward, insert head/tail/after/before, delete head/by-value, search, destroy, reverse.
- **Étudiants** (`etudiant`): a student registry (`E1 = {101, AAA, aaa}`, …) with `inscrireEtudiant` and `radierEtudiant`.

For every operation, the demo shows:

- the exact canonical C code with the current statement highlighted;
- a mutable SVG layout: `precedent` / `valeur` / `suivant` cells, forward (solid blue) and backward (dashed orange) arrows, `NULL` terminators, fake heap addresses, freed-node hatching, and pointer pins (`debut`, `sommet`, `fin`, `courant`, `nouveau`, `temp`, `dernier`, …);
- pointer rewrites animated red (old, dashed) → green (new);
- a step-by-step player with French captions, condition evaluations, badges (`cas-particulier`, `debut-modifie`), live printf console, watch panel (globals + locals), and a call journal;
- 8 ready-made scenarios for the doubly linked list plus dedicated scenarios for each new chapter, loadable from the header.

One step = one executed C statement (including every condition/loop evaluation). Snapshots are fully frozen; stepping backwards is exact.

### Coming soon

The main menu already lists planned chapters as disabled **Bientôt disponible** cards:

- **Chapter 1 — Piles et files statiques**
- **Chapter 5 — Listes doublement chaînées circulaires**

A chapter becomes available once its plugin is registered in `src/registry.ts`; the shared engine and UI do not need to change.

## Architecture

```
src/
  core/                  generic engine: result types, playback state machine
  structures/ldc/        chapitre 4 plugin: doubly linked list memory model,
                         C sources + symbolic line labels, steps, renderer, scenarios
  structures/lsc/        chapitre 2 plugin: singly linked list memory model,
                         C sources + symbolic line labels, steps, scenarios
  structures/piles-files/ chapitre 3 plugin: stack and queue profiles, memory model,
                         C sources + symbolic line labels, steps, scenarios
  structures/shared/     shared linked-node SVG renderer, camera and geometry
  ui/                    shared shell, layout, panels, main menu, hash routing
  registry.ts            registers ldc, lsc and pilesFiles, resolves #/chapitre-<n>
```

The core engine does not know about lists, stacks or queues, and `ui/` never manipulates nodes. Adding a chapter (for example chapter 1 or 5) means a new `src/structures/<id>/` folder plus one registration line: the menu card (badge from `chapter`, `title`, `description`) and the `#/chapitre-<n>` route are derived from the registry — `core/` and `ui/` stay untouched. Until a chapter is implemented, it can be listed as a disabled "Bientôt disponible" card in `fr.menu.soonItems`.

The main menu is the entry point (`#/`); each card opens `#/chapitre-<chapter>`. Navigation is a hand-written `hashchange` hook (no server, works from `file://`), so the demo shell is mounted only on its own route: the demo's keyboard shortcuts are unregistered while the menu is displayed.

Key guarantees enforced by tests:

- the LDC operations equal a plain-array oracle on empty / 1 / 2 / 3 / 8-element lists (head, middle, tail, absent, duplicates);
- the chapter 2 and 3 operations finish on the expected arrays and satisfy their structural invariants;
- `checkInvariants` holds after every random 20-operation LDC sequence (no cycles, mirror forward/backward walk, no reachable freed node);
- every symbolic line label points at the C line that contains its expected substring;
- every step has a non-empty French caption; snapshots are frozen and mutating them throws;
- the LDC Visualization renders the first and last step of every scenario without error;
- workspace and dock resizing, clamping, persistence, and keyboard controls have unit and DOM coverage.

## UI shortcuts

- `← / →` previous / next step · `Space` play-pause · `Home / End` start / finish
- `↑ / ↓` faster / slower · `+ / -` zoom · `0 / F` fit · `D` bottom panels · `P` presentation · `R` reset (confirmation shown)
- `?` (header button) keyboard-shortcut popover
- `Échap` returns to the main menu (only when no popover or dialog is open)
- mouse wheel zooms at the cursor, drag pans, double-click fits; the toolbar also exposes −, 100 %, +, Ajuster and an Auto/Manuel chip.
- click a leaf node in the SVG to fill a "cible" parameter (used by delete-by-value, insert-after/before, radiate).
- drag a workspace or dock separator to resize; focus it and use the arrow keys to adjust (`Shift` for coarse steps, `Home`/`Enter` or double-click to reset).

## Layout notes

- The shell is a fixed `100dvh` app frame: header (64px, 56px below 800px height) + resizable workspace + full-width collapsible bottom dock (default 160px, 130px below 900px viewport height; collapsed by default below 800px).
- Workspace: visualization left, C code right, default 70/30 with a 7px separator. The left pane has a 380px minimum; the code pane has a 430px minimum (500px in presentation). The measured split is persisted, and starting a drag resynchronizes it with the rendered layout.
- Dock height ranges from 110px to `min(32vh, 520px)`; the Variables | Console | Journal columns are resizable with 200/260/220px minimum widths. The workspace split, dock height, column ratios, and focused pane are stored in versioned browser storage.
- The SVG stage uses one world-space camera `{x,y,k}` (`translate(x,y) scale(k)`); auto-fit centers the content bbox with 56px padding and clamps `k` to `[0.25, 1.3]`. During an operation the auto camera fits the union bbox of all steps. Manual zoom clamps to `[0.25, 4]`; manual mode persists across steps and operations, while scenario/profile load and reset force auto.
- The code panel auto-fits presentation mode from the measured monospace width and available height, clamped to 14–26px, with horizontal scroll as fallback. The left viz card contains the caption band, playback row, operation row, and scenario strip.
- The journal lives in the bottom dock; `D` toggles the dock, `P` hides only the journal while keeping Variables and Console visible. Panel focus buttons maximize one dock pane; presentation shows only Variables and Console.
- Below 1020px the workspace stacks, all separators are hidden, and the dock panels wrap at auto height.
- Verified visually by `scripts/shots.mjs` (Playwright) at 1920×1080 and 1280×720: empty, delete-middle, heap insertion, shared-node pins, reverse swap, 8 nodes, manual zoom/pan, presentation code fit, dock, dark theme, scenario/help popovers, plus chapter 2 course and chapter 3 queue smoke screens.

## Chapter 4 assumptions

These notes apply specifically to the `ldc` module.

- **`inverserListe`**: the course sets up the reversal deliberately with *declarations + a swap inside the loop* (`temp = courant->suivant` / `courant->suivant = courant->precedent`, `courant->precedent = temp`, and `dernier` observed as the last node reached). No `fin` global marker is used: after the loop the algorithm re-seats `debut = dernier` and the demo performs one final re-layout step (`slot/lane` reassignment) so the reversed list reads left-to-right from the new `debut`.
- **Max nodes = 8** in the demo (list + heap combined); insertions are disabled once the cap is reached with a French message.
- **No `fin` global.** Only `debut` exists, as in the course material.
- **`insererAvantValeur`**: implemented via the "one courant + check `courant->precedent`" approach shown in the course rather than the two-pointer method.
- Menu/operation labels whose text mentions the profile (`liste` vs `registre`) stay concise; all strings live in `src/i18n/fr.ts`.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Work on a branch, keep changes focused, run `npm test`, `npm run lint` and `npm run build`, and never push directly to `main`.
