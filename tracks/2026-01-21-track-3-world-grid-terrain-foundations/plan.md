# Track 3 — Plan: World Grid & Terrain Foundations

## Recon Summary
- Files likely to change:
  - src/sim/sim.js (wire world grid + terrain generation into sim initialization).
  - src/sim/config.js (add grid dimensions + terrain tuning knobs).
  - src/render/renderer.js (render terrain tiles instead of the placeholder grid).
  - src/main.js (pass new sim state to renderer if needed).
  - New modules expected under src/sim/ for world grid, terrain generation, and terrain effects.
- Key modules/functions:
  - createSim in src/sim/sim.js initializes sim state and RNG usage.
  - simConfig in src/sim/config.js defines tunables.
  - createRenderer in src/render/renderer.js draws current view.
  - createRng in src/sim/rng.js is the sole RNG source (must remain central).
- Invariants to respect:
  - Determinism: all randomness must use src/sim/rng.js.
  - Tick order invariant (Sense → Decide → Act → Costs → LifeHistory → Regen → Metrics) remains unchanged; terrain should be setup/init-only for now.
  - Render is read-only and must not mutate sim state.
  - src/main.js must stay within entrypoint responsibilities (no sim logic).
- Cross-module side effects:
  - Renderer will depend on new world grid state for terrain visualization.
  - Input inspector may show terrain info later but not required in this track.
  - Settings persistence currently stores seed/speed/FPS; grid settings likely remain in config for now.
- Tick order impact:
  - None expected; terrain generation should happen during sim initialization only.
- Observability impact:
  - Terrain effects must be queryable by sim systems; no new metrics/inspector required yet.
- File rules impact:
  - New system rule applies: world grid, terrain generator, and terrain effects should be separate modules.
  - Watch file size caps (600 LOC hard cap).
- Risks/regressions:
  - Nondeterminism if generator uses Math.random or unordered iteration.
  - Noisy/illegible maps if blob parameters are off.
  - Renderer performance if per-frame loops over full grid without view culling.
- Verification commands/checks:
  - Manual: reload with same seed to confirm identical terrain layout.
  - Manual: confirm terrain effects table values are accessible via helper.

---

## Phase 1 — World grid data structure (Step 11)

### Tasks
- [ ] Identify the module that will own world grid state (new module if needed).
- [ ] Define the grid data structure and accessors for terrain type lookup.
- [ ] Wire grid initialization into sim startup while preserving determinism.
- [ ] Reminder: update /context/repo-map.md if files/roles change.

### Files touched
- src/sim/
- src/sim/config.js
- src/sim/sim.js
- src/render/
- /context/repo-map.md (if needed)

### Verification
- [ ] Manual: confirm a grid is initialized with stable dimensions on reload.

### Stop point
- Pause for review after grid structure and wiring exist.

---

## Phase 2 — Terrain generator v1 (blobs) (Step 12)

### Tasks
- [ ] Create terrain generation module using the central RNG.
- [ ] Implement blob placement with deterministic iteration order.
- [ ] Add configuration knobs for blob counts/sizes.
- [ ] Reminder: update /context/repo-map.md if files/roles change.

### Files touched
- src/sim/
- src/sim/rng.js
- src/sim/config.js
- /context/repo-map.md (if needed)

### Verification
- [ ] Manual: same seed produces the same terrain layout.

### Stop point
- Pause for review after terrain generation is in place.

---

## Phase 3 — Terrain effects table (Step 13)

### Tasks
- [ ] Define terrain types and a lookup table for friction, perception, and plant cap.
- [ ] Expose query helpers for sim systems to consume.
- [ ] Reminder: update /context/repo-map.md if files/roles change.

### Files touched
- src/sim/
- /context/repo-map.md (if needed)

### Verification
- [ ] Manual: inspect terrain effects table values in console or debug output.

### Stop point
- Pause for review after terrain effects are queryable.

---

## Phase 4 — Terrain rendering (Step 14)

### Tasks
- [ ] Extend renderer to draw terrain tiles from the world grid.
- [ ] Choose a palette that makes terrain types visually distinct.
- [ ] Reminder: update /context/repo-map.md if files/roles change.

### Files touched
- src/render/renderer.js
- src/render/
- /context/repo-map.md (if needed)

### Verification
- [ ] Manual: terrain is visible and distinct on canvas.

### Stop point
- Pause for review after terrain rendering is implemented.

---

## Phase 5 — Water + shore corridors (Step 15)

### Tasks
- [ ] Add water terrain regions and shore corridors to the generator.
- [ ] Update rendering to differentiate water vs shore.
- [ ] Reminder: update /context/repo-map.md if files/roles change.

### Files touched
- src/sim/
- src/render/renderer.js
- /context/repo-map.md (if needed)

### Verification
- [ ] Manual: water corridors and shore tiles appear in coherent patterns.

### Stop point
- Pause for review after water and shore rendering is complete.
