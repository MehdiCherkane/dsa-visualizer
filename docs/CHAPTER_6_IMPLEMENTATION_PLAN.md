# Chapter 6: Trees — implementation plan

Status: implementation complete. This plan was saved before Chapter 6 source-code changes.

## 1. Scope from the course PDF

The attached 23-slide PDF teaches general tree vocabulary and binary trees. Chapter 6 should cover:

- Tree, root, child, leaf, subtree, branch, size, degree, depth, and height. The course defines an empty tree's height as `-1` and a leaf's height as `0`.
- Binary trees, with distinct `gauche` and `droit` links, and the recursive definition: empty, or a root with two binary subtrees.
- Recursion and its empty-tree base case (`NULL`).
- Node allocation with `creerNoeud`, including initialization of both child pointers to `NULL`.
- Manual construction of the course tree `50, 30, 70, 20, 40, 80` and the exercise tree `15, 8, 22, 4, 10, 30`.
- Prefix/preorder, infix/inorder, and postfix/postorder traversal, with their exact visit orders.
- Recursive destruction in postorder: destroy left subtree, destroy right subtree, then `free` the node.

The exercise notes that inorder traversal of its ordered example yields ascending values and identifies that property as the binary search tree topic of Chapter 7. Do not add search, insertion, deletion, or other binary-search-tree algorithms to Chapter 6. Treat the PDF as course reference material; the user's request defines the implementation instructions.

## 2. Project conventions to preserve

- The app is an offline, single-file Vite/React/TypeScript teaching tool. Chapters are `StructurePlugin` entries registered in `src/registry.ts`, rendered inside the existing shared player and shell.
- Follow Chapter 4 (`ldc`) for operation definitions, immutable snapshots, line-highlighted C source, recorded steps, stack frames, captions, console output, complexity notes, scenarios, and linked-node memory conventions. Chapter 5 reuses its shell but changes the layout to a circle.
- Trees are not linked lists: implement a tree-specific snapshot and SVG renderer rather than forcing the two-child graph into the linear/circular list geometry.
- Keep visual styling on the shared CSS tokens: navy text/controls, blue pointer links, gold emphasis, dotted visualization canvas, rounded panels, and the existing light/dark theme. Preserve shared zoom, fit, pan, playback, presentation, and responsive behavior where the visualization contract supports them.
- Use French labels and captions in `src/i18n/fr.ts`; keep C identifiers faithful to the PDF (`Noeud`, `racine`, `valeur`, `gauche`, `droit`).
- Chapter routing and menu cards are plugin-driven. Add chapter 6 to the registry/menu and keep numeric chapter ordering; do not hard-code a chapter-specific route.

## 3. Intended Chapter 6 experience

Add a Chapter 6 binary-tree plugin with one integer profile. Start with an empty tree and make the structure and recursive call stack visible as operations advance.

The operation catalog will include:

1. `construireArbre`: a guided construction of the course's six-node tree using the PDF's `creerNoeud` allocation and explicit `gauche`/`droit` assignments.
2. `parcoursPrefixe`, `parcoursInfixe`, and `parcoursPostfixe`: execute the exact recursive algorithms from the PDF, showing each function call, the `NULL` base case, node visit, and printed value.
3. `detruireArbre`: recurse into left and right children before freeing the current node, making the postorder lifetime visible.

Scenarios will cover the course tree, the exercise tree, an empty-tree base case, each traversal's expected output, and destruction. The exercise scenario may point out the sorted inorder result, but must label the search-tree ordering rule as a Chapter 7 preview rather than add Chapter 7 operations.

Keep the C source shown in the code panel consistent with the operations being recorded. Include the PDF's `creerNoeud`, recursive traversal, and destruction functions. If destruction leaves `racine` dangling under the function's by-value pointer semantics, show that explicitly and document it in the caption rather than silently claiming the function nulls the caller's pointer.

## 4. Files and architecture

Create a focused `src/structures/trees/` module:

- `memory.ts`: `TreeNode`, `TreeSnapshot`, empty/sample constructors, deep cloning, address allocation, root/node access, child-pointer helpers, reachability/counting, and formatted values. Represent `gauche`/`droit` as node/null pointers and retain freed nodes for the animation, following Chapter 4's memory-history convention.
- `ops/runtime.ts`: a tree-specific recorder that snapshots state per line, records pointer/global/local changes, recursive frames, node allocation/free, captions, console output, and visit counters. Reuse shared core types; do not change existing chapter behavior to accommodate trees.
- `ops/intOps.ts`: explicit operation algorithms for construction, the three traversals, and destruction. Recursive calls must use a `Noeud *n` parameter and stop at `NULL` as in the lecture.
- `operations.ts`, `scenarios.ts`, and `code/int.ts`: plugin metadata, course/example fixtures, and line-indexed C code sources.
- `geometry.ts`, `Visualization.tsx`, and `TreeVisualization.css`: a tree-specific, auto-laid-out SVG with a root indicator, node values/addresses, labeled left/right edges, `NULL`/empty state, active node/call emphasis, and freed-node state. Include live size/leaf/height metrics, active-node degree/depth, and a compact glossary explaining the vocabulary and empty-tree (`-1`) / leaf (`0`) height conventions. Bound layout/camera behavior so the course and exercise trees remain legible at supported viewports while styling from the shared theme tokens.
- `index.ts`: expose the plugin with the shared `StructurePlugin` contract.

Integrate the plugin in `src/registry.ts`; add French chapter, operation, scenario, and caption strings in `src/i18n/fr.ts`; update the README chapter list and supported route description. Reuse existing shell components and navigation. Do not modify unrelated chapters or refactor the shared linked-list renderer.

## 5. Implementation sequence

1. Finish the read-only inventory of chapter 4/5 contracts, menu/i18n integration points, theme tokens, and PDF examples. Confirm the current worktree and preserve existing untracked `docs/` content.
2. Save this plan at `docs/CHAPTER_6_IMPLEMENTATION_PLAN.md`. No product-code edits are allowed before this file exists.
3. Implement tree types, snapshot helpers, recorder, and operation runners. Keep each recorded step immutable and ensure recursive frames unwind correctly.
4. Add code sources and scenarios, aligning C lines, active function names, output, captions, and tree mutations.
5. Build the SVG geometry and renderer around two child edges per node; verify auto-fit and pointer clarity for both course trees and the empty state.
6. Register the plugin, localize all user-facing text, and update the README. Check plugin/menu ordering and that Chapters 4 and 5 continue using their current renderers.
7. Run the production build/type-check and lint if available. Do not run the test suite unless the user asks for tests; keep any future automated tests focused on tree invariants, recursive output order, free order, and rendered empty/course states.
8. Review the final diff for scope, consistent French copy, accurate course algorithms, and unintended changes; report the implementation and any unverified behavior.

## 6. Acceptance criteria

- Chapter 6 opens at `#/chapitre-6` from the plugin menu and follows the existing chapter shell/theme.
- The C type and `creerNoeud` initialize both child pointers to `NULL`.
- The course and exercise trees match the diagrams and assignments in the PDF.
- Prefix, infix, and postfix output exactly matches the lecture examples; recursion visibly stops at `NULL`.
- Destruction frees descendants before their parent and represents the root pointer's actual post-call state accurately.
- The custom tree renderer stays legible, fits the viewport, and shows left/right relationships without implying list or BST operations that Chapter 6 has not taught.
- Production build/type-check and lint pass; tests are not run unless requested.
