# Track 3 — Plan: World Grid & Terrain Foundations

## Recon Summary
- (pending)

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
