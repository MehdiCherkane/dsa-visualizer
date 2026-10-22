# Contributing

Thanks for helping! This project is used in class, so **correctness and stability matter more than speed**. A broken demo in front of the professor is worse than a missing feature.

## The one rule

**Nothing is merged into `main` without the maintainer's approval.** You work on a branch, open a pull request (PR), the maintainer reviews it, and only then is it merged. Never push directly to `main`.

## If you are new to Git

Use **GitHub Desktop** if possible:

1. Sign in, then **File → Clone repository** and choose the class repository.
2. Create a branch with **Branch → New branch** (`feature/...`, `fix/...`, `docs/...`).
3. Make your changes, test them, then write a commit message and click **Commit to branch**.
4. Click **Push origin**, then **Create pull request**.
5. Ask the maintainer to review. Make requested changes on the same branch; the PR updates automatically.

Do not drag `node_modules/`, `dist/`, backups or screenshots into commits. The `.gitignore` already excludes them.

## Workflow

First time:

```bash
git clone [REPO_URL]
cd [REPO_FOLDER]
npm ci
```

For every piece of work:

```bash
git switch main
git pull                                   # always start from the latest main
git switch -c feature/stack-static-array   # a new branch for your work
# ... work, then:
npm test && npm run lint && npm run build  # all must pass before you push
git add .
git commit -m "feat(stack): static stack push and pop"
git push -u origin feature/stack-static-array
```

Then open the PR on GitHub ("Compare & pull request"), fill in the template, and wait for review. If the maintainer asks for changes, commit and push to the same branch; the PR updates by itself.

**Branch names:** `feature/<chapter>-<topic>`, `fix/<topic>`, `docs/<topic>`.
**Commit messages:** `type(scope): short description`, where type is `feat`, `fix`, `docs`, `test`, `refactor` or `style`, e.g. `fix(ldc): free the node in supprimerValeur`. When you add or change C code, **mention the chapter and slide number** in the commit body.
**Keep PRs small and focused.** One chapter, one feature or one fix per PR.
**Work in your own chapter folder** (`src/structures/<your-chapter>/`). Avoid editing `core/` or `ui/` without discussing it first, since everyone depends on them.

## Style guide

### 1. The C code

- It must **match the professor's slides**: same function names, same identifiers, same logic. Do not "improve" or "modernize" it.
- Identifiers stay in French as in the course (`Noeud`, `debut`, `suivant`, `precedent`, `courant`, `nouveau`, `supprimerValeur`…).
- **One statement per line**, 4-space indentation, braces as in the existing snippets. This is what makes line-by-line highlighting possible.
- Each C function lives in `code/` as an array of lines with **symbolic labels** (e.g. `L.unlinkPrev`). Step generators use labels, **never raw line numbers**.
- If the course has no code for something (e.g. an exercise without solution), say so in the PR description so the maintainer can check it against the professor's correction.

### 2. Step generators (`ops/`)

- An operation is a pure function that returns an array of **immutable steps**. It never touches the DOM and never animates anything.
- **One step per executed C statement.** Every `while` and `if` condition evaluation is its own step, with its true/false result.
- Each step carries: a full memory snapshot, the function and line label, a French caption, and what changed (so the renderer can animate it).
- Handle the empty list, the one-element list, head, tail and "value not found" explicitly. These cases are exactly what students ask about.
- Layout (slots, heap lane) is decided by the engine, never inferred by the renderer from pointers.

### 3. French text

- Every user-visible string lives in `src/i18n/fr.ts`. No French (or any text) hard-coded in components.
- Captions speak like a teacher, are short (two lines at most), and wrap **code identifiers in backticks**: `` `courant->suivant` ``, `` `NULL` ``, `` `debut` ``. Do not put backticks around ordinary French words ("le nouveau nœud").
- Use correct French plurals (0 and 1 are singular).

### 4. Visual language

- `suivant` = **blue, solid** arrow. `precedent` = **orange, dashed** arrow. `debut` and other globals = **gold**. Local variables = tags above nodes (`courant` green, `nouveau` purple).
- Pointer fields show a dot; every arrow starts at that dot and ends on the border of its target. Use the shared arrow-routing function; do not draw arrows by hand.
- Colors, spacing and font sizes come from the design tokens (CSS variables). Do not hard-code colors. Check **light and dark themes** and **presentation mode**.
- Do not add a new color or a new kind of arrow without discussing it first. Consistency across chapters is the point.
- Text must stay readable on a projector: never go below the minimum sizes already defined in the UI.

### 5. TypeScript and formatting

- TypeScript in **strict** mode. No `any` in `core/` and `structures/`.
- Format with the project's Prettier config before committing. Don't mix formatting-only changes with real changes.
- Prefer small, named functions. Comment *why*, not *what*.

### 6. Tests

- Every operation needs tests: compare the final state with a simple **reference model** (a plain JS array), and check the **memory invariants** (for a linked list: `n.suivant.precedent === n`, `debut.precedent === null`, no cycles).
- Each symbolic label must be checked against the C text it points to, so the code and the animation can never drift apart.
- `npm test` and `npm run build` must pass before you open a PR.

### 7. What never goes in the repo

- `node_modules/` and `dist/` (generated files, huge, and different on each operating system).
- Personal files, editor settings, screenshots of students' data, passwords or tokens.

## Adding a new chapter

1. Create `src/structures/<id>/` with `memory.ts`, `code/`, `ops/`, `Visualization.tsx`, `scenarios.ts` and `index.ts`.
2. Write the C code **from the slides** first, with symbolic labels.
3. Write the step generators and their tests.
4. Reuse the shared pieces: the player, the camera (zoom and pan), the code panel, the watch panel, the arrow routing. A new chapter should only need its own memory model and renderer.
5. Add the French captions to `i18n/fr.ts`.
6. Register the structure in `registry.ts` with its `chapter` number, `title` and `description`: the main menu card and its `#/chapitre-<n>` route are derived from these fields, so no menu code changes are needed.
7. Add at least one **scenario** taken from the professor's exercises, so he can demo it in one click.

## Reviewing (for the maintainer)

Before approving a PR:

1. Run the branch: `git fetch && git switch <branch>`, then `npm ci && npm test && npm run build`.
2. Open `dist/index.html` and run the new operations by hand, forwards and backwards, in light and dark themes, in presentation mode, and at 1280×720.
3. **Compare every C snippet with the professor's slides.**
4. Read the French captions out loud.
5. Check that the PR touches only what it claims to touch.
