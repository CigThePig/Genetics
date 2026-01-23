# Plan — Maintenance: Touch Gesture Guardrails

## Recon Summary

- Files likely to change: src/render/renderer.js (canvas setup), src/input/index.js (pointer handlers), context/active-track.md (track pointer), context/repo-map.md (track entry).
- Key modules/functions: renderer canvas initialization, pointerDown/pointerMove/pointerUp handlers.
- Invariants to respect: no sim determinism impact, touch-first UX.
- Cross-module side effects: input handlers are shared across pointer types; avoid breaking mouse behavior.
- Tick order impact: none.
- Observability impact: none.
- File rules impact: no new systems/files expected.
- Risks/regressions: blocking pointer behavior outside canvas if preventDefault is too broad.
- Verification: manual touch/scroll test in browser.

## Deviation Note

- Added canvas-local zoom anchor alignment to keep pinch and wheel zoom centered on the map canvas.

---

## Phase 1 — Apply touch gesture guardrails

### Tasks

- [x] Set renderer canvas touch-action to none to prevent browser gesture handling.
- [x] Prevent default touch/pointer behavior in pointer down/move/up handlers (scoped to touch if needed).
- [x] Update /context/active-track.md with current phase/next task.
- [x] Reminder: update /context/repo-map.md if any files are added or roles change.

### Files Touched

- src/render/renderer.js
- src/input/index.js
- context/active-track.md
- context/repo-map.md

### Verification

- Manual: touch/scroll test confirms canvas interactions no longer scroll/zoom the page.

### Stop Point

- Pause after touch guardrails are in place and manually verified.

---

## Phase 2 — Align zoom anchors to canvas coordinates

### Tasks

- [x] Convert pinch midpoint to canvas-local coordinates before camera zoom.
- [x] Convert wheel zoom anchor to canvas-local coordinates before camera zoom.
- [x] Update /context/active-track.md with current phase/next task.
- [x] Reminder: update /context/repo-map.md if any files are added or roles change.

### Files Touched

- src/input/index.js
- context/active-track.md

### Verification

- Manual: pinch and wheel zoom anchors align with canvas position rather than page position.

### Stop Point

- Pause after zoom anchor alignment is implemented and manually checked.
