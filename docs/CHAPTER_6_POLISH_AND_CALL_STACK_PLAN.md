# Chapter 6 — polish and recursive call-stack plan

Status: Stage 1 (visual fixes) and Stage 2 (call-stack panel) implemented and browser-checked; follow-up fixes and verification sweep in progress.

## Scope and constraints

- Keep Chapter 6 offline-first: the single-file `dist/index.html` must run from `file://` without a network request or CDN.
- Preserve the shared navy/gold visual system, French copy, C-code panel, player semantics, light/dark themes, and presentation mode.
- Use the existing immutable `Step.snapshot` mechanism. The UI must never infer recursive history from animation state.
- Keep shared changes generic so Chapters 2–5 retain their current behaviour. Verify Chapter 4 and Chapter 5 after each stage.
- Commit the visual stage and the call-stack stage independently.

## Stage 1 — reproduce and fix the visual issues

1. Capture Chapter 6 at 1366×768 and 1920×1080 with the bottom dock expanded, then repeat in dark and presentation modes. Record the canvas height, rendered SVG text sizes, caption visibility, legend clearance, watch-value clipping, and allocation-limit treatment.
2. Make the workspace/card stack resilient to a tall dock: keep the caption band at a non-shrinkable readable height; cap the dock height to a useful portion of the viewport; retain the existing persisted height splitter.
3. Give the tree canvas a minimum practical height and have tree auto-fit use the available drawing rectangle (rather than treating overlays as free space). Make the camera percentage describe the resulting SVG scale rather than only a viewBox ratio.
4. Move the tree legend out of the leaf area (collapsed/compact overlay beneath the tree) and reserve its footprint in layout. Make “Ajuster” explicitly restore AUTO mode.
5. Extend traversal snapshot metadata with immutable visit/path information. Render visited nodes with an order badge, the active root-to-node path with heavier links, dim unrelated links, and use non-colour cues. Reserve a waiting-on-stack node state for Stage 2.
6. Widen and rebalance Variable panel rows so pointer addresses and headings remain readable; use an accessible title only when an ellipsis is unavoidable.
7. Re-style the allocation limit as neutral amber information, with an icon and no error red.
8. Add focused geometry/runtime tests where practical, run the visual browser checks, build, lint, then commit this stage.

## Stage 2 — call-stack panel for recursive traversals

1. Add a `showCallStack` capability flag to `OperationDef`; enable it only on prefix, infix, and postfix operations.
2. Add immutable call-stack data to tree snapshots/steps. Define a frame model with stable id, function, argument pointer, paused source line, state, and ordered phase chips. Include a muted `main` frame in the display model.
3. Teach the recorder traversal runner to update that model at the existing recursive call, NULL test, visit, child-call, and return steps. Add explicit return/pop steps only where needed for an unambiguous immutable stack. Ensure the final snapshot contains an empty stack.
4. Use the same snapshot stack for the existing active/depth metrics, node waiting/active styles, and the new panel. Derive node visit order/path from the same traversal metadata.
5. Create an accessible `Pile d’appels` right-column panel. It appears only during flagged operations, replaces the code breadcrumb, has a persisted “Afficher les appels NULL” preference, scrolls the active frame into view, and becomes compact after six frames.
6. Add hover/focus cross-highlighting: a frame applies a lighter secondary code-line highlight and an ephemeral tree-node highlight without changing the active-frame highlight.
7. Animate UI push/pop presentation only as a visual enhancement; scrubbing, step-back, and finishing always render directly from the selected snapshot. Disable the enhancement at 4× and reduced motion.
8. Add traversal-order and stack-invariant tests for course, exercise, and empty trees; run browser flows for scrubbing, reverse stepping, finish/cancel, speed, dark theme, and presentation mode. Commit this stage separately.

## Decisions

- The tree renderer keeps circular nodes, but connectors originate and terminate at the circle boundary and reserve room for labels/NULL pills.
- Call-stack depth will be derived from the explicit recursive stack snapshot, not the generic implementation `frames`, because the latter is also used by construction/destruction and is not a teaching contract.
- The NULL toggle is stored in local storage under a dedicated, versioned preference key so it survives reloads without affecting saved workspace layout.
