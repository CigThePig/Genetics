# Plan — Maintenance: Camera Change Callback

## Recon Summary
- Files likely to change: src/input/index.js (input options + callbacks), src/main.js (input wiring), context/active-track.md (track pointer), context/repo-map.md (track entry).
- Key modules/functions: createInput options, pointerMove/wheelZoom handlers, main addInput wiring.
- Invariants to respect: render is read-only; no sim state mutation in callback; tick order unchanged.
- Cross-module side effects: input module consumers may rely on default options.
- Tick order impact: none.
- Observability impact: optional metrics refresh only while paused.
- File rules impact: no new systems/files expected.
- Risks/regressions: accidental renders while running; callback invoked without guard.
- Verification: manual pause, pan/zoom, confirm view updates without advancing ticks.

---

## Phase 1 — Add camera change callback and paused render

### Tasks
- [x] Extend input creation options with onCameraChange and invoke after camera pan/zoom.
- [x] Pass onCameraChange in main to render only when paused (optional metrics refresh).
- [x] Update /context/active-track.md with current phase/next task.
- [x] Reminder: update /context/repo-map.md if any files are added or roles change.

### Files Touched
- src/input/index.js
- src/main.js
- context/active-track.md
- context/repo-map.md

### Verification
- Manual: pause the sim, pan/zoom, and confirm the view updates without advancing ticks.

### Stop Point
- Pause after the callback is wired and manual verification is complete.
