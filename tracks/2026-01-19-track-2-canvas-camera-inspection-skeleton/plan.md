# Plan — Track 2: Canvas + Camera + Inspection Skeleton

## Recon Summary
- (pending)

---

## Phase 1 — Canvas renderer + camera pan/zoom (touch)

**Tasks**
- [ ] Add camera module to hold pan/zoom state and helpers.
- [ ] Extend renderer to draw to canvas with camera transforms.
- [ ] Wire touch drag and pinch gestures to camera controls in input.
- [ ] Reminder: update /context/repo-map.md if files/roles change.

**Files touched**
- `src/render/renderer.js`
- `src/render/camera.js` (new)
- `src/input/index.js`
- `src/main.js`

**Verification**
- [ ] Manual: drag to pan and pinch to zoom works on touch device/emulation.

**Stop point**
- Pause after verifying touch camera behavior.

---

## Phase 2 — Tap inspector stub (location or entity)

**Tasks**
- [ ] Add tap handling to input that routes to inspector.
- [ ] Create inspector UI stub with minimal readable output.
- [ ] Provide a read-only summary for a location/entity.
- [ ] Reminder: update /context/repo-map.md if files/roles change.

**Files touched**
- `src/input/index.js`
- `src/ui/index.js`
- `src/render/renderer.js` (if needed for read-only data handoff)

**Verification**
- [ ] Manual: tapping the canvas shows a location or entity summary.

**Stop point**
- Pause after inspector stub is visible and updates on tap.

---

## Phase 3 — Metrics panel skeleton

**Tasks**
- [ ] Add a metrics panel container in the UI.
- [ ] Add placeholder rows/sections for future metrics.
- [ ] Ensure layout remains touch-friendly.
- [ ] Reminder: update /context/repo-map.md if files/roles change.

**Files touched**
- `src/ui/index.js`
- `src/metrics/index.js`

**Verification**
- [ ] Manual: metrics panel skeleton is visible without breaking layout.

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
