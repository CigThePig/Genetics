# Plan — Track 2: Canvas + Camera + Inspection Skeleton

## Recon Summary
- Files likely to change (why):
  - `src/render/renderer.js` for canvas render path and camera transforms.
  - `src/render/camera.js` new module for pan/zoom state and helpers.
  - `src/input/index.js` to route touch drag/pinch and tap interactions.
  - `src/ui/index.js` for inspector and metrics panel shells.
  - `src/metrics/index.js` to expose a metrics container/skeleton.
  - `src/app/settings.js` new module for local storage persistence.
  - `src/sim/worker.js` new stub to define worker interface seam.
  - `src/main.js` to wire renderer, camera, input, UI, settings, worker stub.
- Key modules/functions involved:
  - `createRenderer` currently appends a footer only; will expand for canvas rendering. 
  - `createInput` is a stub with attach/detach.
  - `createUI` already owns touch-friendly controls; will gain inspector/metrics panels.
  - `createMetrics` currently only exposes FPS overlay.
  - `createSim` currently provides a simple deterministic tick and summary.
- Invariants to respect:
  - Deterministic sim (no render/input affecting sim state outside explicit interfaces).
  - Tick order invariant remains untouched; render is post-tick only.
  - Central RNG stays in sim; no new randomness in rendering/input.
  - `src/main.js` remains wiring-only; new systems go in new modules.
- Cross-module side effects:
  - Input updates camera state which renderer reads; ensure no sim mutation from render.
  - UI should receive inspector summaries from read-only sources (renderer or sim snapshots).
  - Settings module must sync UI state without altering sim determinism beyond seed changes.
- Tick order impact:
  - None; this track adds view/input/UI layers and persistence only.
- Observability impact:
  - Add inspector stub output (location or entity summary) and metrics panel skeleton.
- File rules impact:
  - New systems (camera, settings, worker stub) require new files as planned.
  - Watch file sizes to stay under 600 LOC.
- Risks/regressions:
  - Touch event conflicts with UI controls if gesture handling doesn’t respect targets.
  - Over-eager renders on input events could impact performance on mobile.
  - Settings persistence could desync UI if defaults or load order are incorrect.
- Verification commands/checks:
  - Manual: touch drag/pinch pan/zoom works on mobile/emulation.
  - Manual: tapping shows inspector output.
  - Manual: metrics panel skeleton visible and non-blocking.
  - Manual: refresh preserves seed/speed/toggles.
  - Manual: app still boots with non-worker path.

---

## Phase 1 — Canvas renderer + camera pan/zoom (touch)

**Tasks**
- [x] Add camera module to hold pan/zoom state and helpers.
- [x] Extend renderer to draw to canvas with camera transforms.
- [x] Wire touch drag and pinch gestures to camera controls in input.
- [x] Reminder: update /context/repo-map.md if files/roles change.

**Files touched**
- `src/render/renderer.js`
- `src/render/camera.js` (new)
- `src/input/index.js`
- `src/main.js`

**Verification**
- [x] Manual: drag to pan and pinch to zoom works on touch device/emulation.

**Stop point**
- Pause after verifying touch camera behavior.

---

## Phase 2 — Tap inspector stub (location or entity)

**Tasks**
- [x] Add tap handling to input that routes to inspector.
- [x] Create inspector UI stub with minimal readable output.
- [x] Provide a read-only summary for a location/entity.
- [x] Reminder: update /context/repo-map.md if files/roles change.

**Files touched**
- `src/input/index.js`
- `src/ui/index.js`
- `src/render/renderer.js` (if needed for read-only data handoff)

**Verification**
- [x] Manual: tapping the canvas shows a location or entity summary.

**Stop point**
- Pause after inspector stub is visible and updates on tap.

---

## Phase 3 — Metrics panel skeleton

**Tasks**
- [x] Add a metrics panel container in the UI.
- [x] Add placeholder rows/sections for future metrics.
- [x] Ensure layout remains touch-friendly.
- [x] Reminder: update /context/repo-map.md if files/roles change.

**Files touched**
- `src/ui/index.js`
- `src/metrics/index.js`

**Verification**
- [x] Manual: metrics panel skeleton is visible without breaking layout.

**Stop point**
- Pause after metrics panel skeleton is in place.

---

## Phase 4 — Save/load settings (seed, speed, toggles)

**Tasks**
- [ ] Create settings module for save/load defaults.
- [ ] Wire UI toggles/seed/speed into settings persistence.
- [ ] Load settings on boot and apply to UI state.
- [ ] Reminder: update /context/repo-map.md if files/roles change.

**Files touched**
- `src/app/settings.js` (new)
- `src/main.js`
- `src/ui/index.js`

**Verification**
- [ ] Manual: refresh preserves seed/speed/toggles.

**Stop point**
- Pause after settings persist across refresh.

---

## Phase 5 — Worker-ready architecture stub

**Tasks**
- [ ] Add worker stub module with clear interface shape.
- [ ] Wire optional use in main without changing sim behavior.
- [ ] Document how the stub will be activated later.
- [ ] Reminder: update /context/repo-map.md if files/roles change.

**Files touched**
- `src/sim/worker.js` (new)
- `src/main.js`

**Verification**
- [ ] Manual: app boots and runs with current non-worker path.

**Stop point**
- Pause after confirming worker stub does not alter behavior.
