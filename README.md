# DS Visualizer — Chapitres 2, 3 et 4 : listes, piles et files en C

A single-page, fully offline French teaching demo for singly linked lists, dynamic stacks and queues, and doubly linked lists in C, built with Vite + React + TypeScript.

## Run

```bash
npm ci        # once, uses package-lock.json
npm test      # vitest suite (138 tests)
npm run lint  # oxlint
npm run build # typecheck + single-file offline build
npm run dev   # local dev server
```

`npm run build` produces **one self-contained `dist/index.html`** (`vite-plugin-singlefile`). Open it by double-click: no server and no network access are required — no CDNs, no external fonts or images.

Navigation is hash-based so it also works from `file://`: `#/` (main menu, the entry point), `#/chapitre-2` (single linked lists), `#/chapitre-3` (stacks and queues) and `#/chapitre-4` (doubly linked lists). Unknown hashes fall back to the menu, and `Échap` or the `← Menu` header button leaves the demo.

## What it teaches

Four demos across three chapters:

### Chapitre 2 — Listes simplement chaînées

- **Entiers** (`int`): the course list `9 → 2 → 5`; display, insert head/tail, delete head/by-value, search and destroy.
- **Étudiants** (`etudiant`): a student registry (`E1 = {101, AAA, aaa}`, …) with display, `inscrireEtudiant`, `radierEtudiant` and `detruireListe`.

### Chapitre 3 — Piles et files dynamiques

- **Pile** (`pile`): LIFO stack with `sommet` and `precedent`; push, pop, empty check, destroy, plus the course exercises `empilerCopie` and `corrigerCopie`.
- **File** (`file`): FIFO queue with `debut` / `fin` and `suivant`; enqueue, dequeue (including the `fin = NULL` trap when the last node leaves), empty check, destroy, plus student arrivals and service.

### Chapitre 4 — Listes doublement chaînées

- **Entiers** (`int`): the course list `9 ⇄ 2 ⇄ 5` and all classic operations — display forward/backward, insert head/tail/after/before, delete head/by-value, search, destroy, reverse.
- **Étudiants** (`etudiant`): a student registry (`E1 = {101, AAA, aaa}`, …) with `inscrireEtudiant` and `radierEtudiant`.

For every operation, the demo shows:

- the exact canonical C code with the current statement highlighted;
- a mutable SVG layout: `precedent` / `valeur` / `suivant` cells, forward (solid blue) and backward (dashed orange) arrows, `NULL` terminators, fake heap addresses, freed-node hatching, and pointer pins (`debut`, `courant`, `nouveau`, `temp`, `dernier`, …);
- pointer rewrites animated red (old, dashed) → green (new);
- a step-by-step player with French captions, condition evaluations, badges (`cas-particulier`, `debut-modifie`), live printf console, watch panel (globals + locals), and a call journal;
- 8 ready-made scenarios for the doubly linked list plus dedicated scenarios for each new chapter, loadable from the header.

One step = one executed C statement (including every condition/loop evaluation). Snapshots are fully frozen; stepping backwards is exact.

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
  ui/                    layout + panels only (no structure knowledge in core);
                         MainMenu.tsx + useHashRoute.ts for the home screen
  registry.ts            registers ldc, lsc and pilesFiles, resolves a chapter
```

The core engine does not know about lists, stacks or queues, and `ui/` never manipulates nodes. Adding a chapter (for example chapter 1 or 5) means a new `src/structures/<id>/` folder plus one registration line: the menu card (badge from `chapter`, `title`, `description`) and the `#/chapitre-<n>` route are derived from the registry — `core/` and `ui/` stay untouched. Until a chapter is implemented, it can be listed as a disabled "Bientôt disponible" card in `fr.menu.soonItems`.

The main menu is the entry point (`#/`); each card opens `#/chapitre-<chapter>`. Navigation is a hand-written `hashchange` hook (no server, works from `file://`), so the demo shell is mounted only on its own route: the demo's keyboard shortcuts are unregistered while the menu is displayed.

Key guarantees enforced by tests:

- the LDC operations equal a plain-array oracle on empty / 1 / 2 / 3 / 8-element lists (head, middle, tail, absent, duplicates);
- the chapter 2 and 3 operations finish on the expected arrays and satisfy their structural invariants;
- `checkInvariants` holds after every random 20-operation LDC sequence (no cycles, mirror forward/backward walk, no reachable freed node);
- every symbolic line label points at the C line that contains its expected substring;
- every step has a non-empty French caption; snapshots are frozen and mutating them throws;
- the LDC Visualization renders the first and last step of every scenario without error.

## UI shortcuts

- `← / →` previous / next step · `Space` play-pause · `Home / End` start / finish
- `↑ / ↓` faster / slower · `+ / -` zoom · `0 / F` fit · `D` bottom panels · `P` presentation · `R` reset (confirmation shown)
- `?` (header button) keyboard-shortcut popover
- `Échap` returns to the main menu (only when no popover or dialog is open)
- mouse wheel zooms at the cursor, drag pans, double-click fits; the toolbar also exposes −, 100 %, +, Ajuster and an Auto/Manuel chip.
- click a leaf node in the SVG to fill a "cible" parameter (used by delete-by-value, insert-after/before, radiate).

## Layout notes (v2 vitrine)

- The shell is a fixed `100dvh` app frame: header (64px, 56px below 800px height) + 2-column workspace + full-width collapsible bottom dock (160px, 130px below 900px viewport height; collapsed by default below 800px).
- The SVG stage uses one world-space camera `{x,y,k}` (`translate(x,y) scale(k)`); auto-fit centers the content bbox with 56px padding and clamps `k` to `[0.25, 1.3]`. During an operation the auto camera fits the union bbox of all steps. Manual zoom clamps to `[0.25, 4]`; manual mode persists across steps and operations, while scenario/profile load and reset force auto.
- Right rail: code panel only (presentation auto-fit from measured monospace width and available height, clamped to 14–26px; horizontal scroll fallback). Bottom dock: Variables | Console (printf) | Journal (journal hidden in presentation). Left: viz card with caption band, playback row, operation row, scenario strip.
- The journal lives in the bottom dock; `D` toggles the dock, `P` hides only the journal while keeping Variables and Console visible.
- Verified visually by `scripts/shots.mjs` (Playwright) at 1920×1080 and 1280×720: empty, delete-middle, heap insertion, shared-node pins, reverse swap, 8 nodes, manual zoom/pan, presentation code fit, dock, dark theme, scenario/help popovers, plus chapter 2 course and chapter 3 queue smoke screens.

## Assumptions documented during the build

- **`inverserListe`**: the course sets up the reversal deliberately with *declarations + a swap inside the loop* (`temp = courant->suivant` / `courant->suivant = courant->precedent`, `courant->precedent = temp`, and `dernier` observed as the last node reached). No `fin` global marker is used: after the loop the algorithm re-seats `debut = dernier` and the demo performs one final re-layout step (`slot/lane` reassignment) so the reversed list reads left-to-right from the new `debut`.
- **Max nodes = 8** in the demo (list + heap combined); insertions are disabled once the cap is reached with a French message.
- **No `fin` global.** Only `debut` exists, as in the course material.
- **`insererAvantValeur`**: implemented via the "one courant + check `courant->precedent`" approach shown in the course rather than the two-pointer method.
- Menu/operation labels whose text mentions the profile (`liste` vs `registre`) stay concise; all strings live in `src/i18n/fr.ts`.
- The demo builds to a single offline file instead of a multi-page site; the professor's static PDF is intentionally replaced by this interactive demo.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Work on a branch, keep changes focused, run `npm test`, `npm run lint` and `npm run build`, and never push directly to `main`.
