# Track 10.5 — Timebase + Survival + Visibility + Map Scale (Plan)

## Recon Summary

### A) Timebase
- Confirmed frame-driven loop: `runFrame` in `src/main.js` advances `sim.tick()` in a `for (i < speed)` loop once per RAF, tying ticks to display refresh. (`speed` is the UI speed multiplier.) 
- `ticksPerSecond` is defined in `src/sim/config.js` (default `1`) but unused in the RAF loop or sim tick scheduling.
- Tick entrypoint is `sim.tick()` in `src/sim/sim.js`, with tick count incremented per call (no real-time delta usage).

### B) Survival pacing
- Basal drains are applied per tick in `updateCreatureBasalMetabolism` (`energy/water/stamina`), scaled by life stage metabolism. Sprint drain and stamina regen are per tick. Death checks are per tick in `applyCreatureDeaths`.
- Drain/threshold tunables live in `src/sim/config.js` (e.g., `creatureBasalEnergyDrain`, `creatureBasalWaterDrain`, `creatureDrinkThreshold`, `creatureEatThreshold`, `creatureSprintStaminaDrain`, `creatureStaminaRegen`), all currently interpreted per tick.
- Age/reproduction timing is in ticks (`creatureMaxAgeTicks`, `creatureReproductionMinAgeTicks`, cooldown ticks), so timebase change will alter perceived seconds unless converted.
- Perception/memory ranges and seek behavior are in tile units, but action thresholds are meter ratios per tick.

### C) Creature visibility
- Render constants: `tileSize = 20`, `baseRadius = tileSize * 0.18` (with a min radius of `3/state.zoom`). Creature centers are drawn at `(x + 0.5) * tileSize` and culled by tile coordinates against `startCol/endCol`.
- Sim positions are continuous tile-space coordinates (`position.x/y` in `createCreatures` and movement).
- Input converts screen to `world` in pixel coordinates (camera transform), but `findNearestCreature` compares this directly to tile-space coordinates, so tap/inspect uses mismatched units.
- Alignment/culling assumptions will be stressed when size increases (current culling ignores marker radius).

### D) Map scale + density + spawning
- Map dimensions are set in `src/sim/config.js` (`worldWidth: 60`, `worldHeight: 40`).
- Resource generators are count-based: `bushCount` in `src/sim/plants/bushes.js`, `grassPatchCount` in `src/sim/plant-generator.js`, `terrainBlobCount` and `waterCorridorCount` in `src/sim/terrain-generator.js`.
- Creature population uses `creatureCount` in config (currently 12).
- Spawn logic in `createCreatures` uses random tile-space positions with up to 20 retries to avoid water tiles; species assignment is deterministic by index via `pickSpawnSpecies`.

### Decision points
- Final ticks/sec target at 1x (configurable default).
- Fixed timestep accumulator behavior (max catch-up, pause/resume handling).
- Creature render radius target (exact fraction of tile size).
- Cluster spacing and jitter radius for species spawning.
- Density scaling formula for water corridors (linear vs tuned cap).

### Metrics to track
- Ticks/sec at 1x across refresh rates.
- Tiles/sec movement at default speed.
- % deaths in first 60s; median time-to-death.
- Resource density per tile (bushes/grass patches/terrain blobs/water corridors).
- Inspect accuracy (tap selects intended creature).

---

## Phase 0 — Recon / Units Audit

**Tasks**
- [x] Trace timebase and tick scheduling in RAF loop; document units (per-tick vs per-second).
- [x] Inventory all tick-based drains, cooldowns, and growth timers tied to survival pacing.
- [x] Capture render size and alignment math; list unit conversions for input/inspect.
- [x] Document map dimension and generator count variables; note spawn logic location.
- [x] Update /context/repo-map.md if files/roles change. (No changes needed.)

**Likely files to change**
- `src/main.js`
- `src/sim/config.js`
- `src/sim/creatures/index.js`
- `src/render/renderer.js`
- `src/input/index.js`
- `src/sim/plant-generator.js`
- `src/sim/plants/bushes.js`
- `src/sim/terrain-generator.js`

**Verification checklist**
- [x] Confirm tick scheduling and timebase units.
- [x] Confirm drain/threshold units and default values.
- [x] Confirm render/input unit conversions.
- [x] Confirm generator counts and spawn logic location.

**Stop point**
- Pause after recon notes are captured and hypotheses are locked.

---

## Phase 1 — Timebase / Speed Normalization

**Tasks**
- [x] Implement fixed timestep accumulator using `ticksPerSecond` and speed multiplier.
- [x] Guard against pause/resume time debt (cap accumulated delta).
- [x] Add or update a metric to track ticks/sec at 1x.
- [x] Update /context/repo-map.md if files/roles change. (No changes needed.)

**Likely files to change**
- `src/main.js`
- `src/sim/config.js`
- `src/metrics/index.js`

**Verification checklist**
- [ ] Measured ticks/sec at 1x stable across refresh rates.
- [ ] Movement speed appears sane at 1x (tiles/sec normalized).
- [ ] Pausing/resuming does not fast-forward unexpectedly.

**Stop point**
- Stop after confirming timebase stability and ticks/sec metric.

---

## Phase 2 — Survival Pacing (Metabolism + Behavior)

**Tasks**
- [x] Convert basal drains/thresholds to per-second targets (or apply deterministic conversion).
- [x] Time-scale movement and calibrate base speed to 0.25× prior per-tick feel (0.6 * 60 * 0.25 = 9 tiles/sec).
- [x] Update diets to remove MEAT dependence; gate hunting on MEAT diet; add perception-based seek fallback for food/water.
- [ ] Tune starting reserves and seek/drink thresholds after timebase fix.
- [x] Review reproduction age/cost pacing for timebase impact.
- [x] Add/update automated test covering survival pacing or deterministic drain conversion (required for core formula changes).
- [x] Add automated tests for movement time-scaling and diet foraging fallback.
- [x] Update /context/repo-map.md if files/roles change. (No changes needed.)

**Likely files to change**
- `src/sim/config.js`
- `src/sim/creatures/index.js`
- `src/sim/creatures/reproduction.js`
- `tests/creatures.test.js` (or new deterministic scenario test)

**Verification checklist**
- [x] % deaths in first 60s reduced to target.
- [x] Median time-to-death aligns with expected seconds-based tuning.
- [x] Automated test passes and validates drain conversion or survival pacing.
- [x] Automated tests cover movement time-scaling and diet fallback.

**Stop point**
- Stop after survival metrics and test coverage are validated.

### Change Log + Preempt Notes (Phase 2 hotfixes)
**Files changed**
- `src/sim/config.js` (base speed now in tiles/sec and calibrated to 0.25× old per-tick movement)
- `src/sim/creatures/index.js` (movement time-scaling; hunt gating on MEAT diet; perception-based seek fallback)
- `src/sim/creatures/food.js` (temporary diet preferences exclude MEAT)
- `tests/creatures.test.js` (movement time-scaling + diet fallback tests)

**Preempt notes**
- Chases and pursuit/escape dynamics will feel slower in wall-time.
- Slower movement increases time spent near resources; should improve eating/drinking reliability.
- Sprinting remains a multiplier; verify sprint still feels meaningfully faster than walk.
- Triangles/Octagons will forage rather than hunt until meat exists, reducing “Circles always win” bias.
- When MEAT is implemented, re-adding MEAT to diets will re-enable hunting via the gate.

---

## Phase 3 — Creature Visibility (Size ≈ 1 Tile)

**Tasks**
- [x] Increase creature render radius toward ~1 tile.
- [x] Adjust render alignment for continuous tile coordinates.
- [x] Fix input/inspect unit conversion for accurate selection.
- [x] Update culling margin to avoid edge pop-in.
- [x] Update /context/repo-map.md if files/roles change.

**Likely files to change**
- `src/render/renderer.js`
- `src/input/index.js`
- `src/sim/creatures/index.js` (inspection helpers)

**Verification checklist**
- [x] Creatures are clearly visible at default zoom.
- [x] Tap/inspect selects intended creature reliably.
- [x] No obvious culling pop-in at edges.

**Stop point**
- Stop after visual sizing/alignment and inspect accuracy are verified.

---

## Phase 4 — Map Scale 4× With Density Preserved + Population Increase

**Tasks**
- [ ] Scale `worldWidth` / `worldHeight` to 2× each (4× area).
- [ ] Scale generator counts to preserve density (bushes, grass patches, terrain blobs, water corridors).
- [ ] Increase population to 20 per species (80 total).
- [ ] Implement clustered spawning around four nearby centers (one per species).
- [ ] Update /context/repo-map.md if files/roles change.

**Likely files to change**
- `src/sim/config.js`
- `src/sim/plants/bushes.js`
- `src/sim/plant-generator.js`
- `src/sim/terrain-generator.js`
- `src/sim/creatures/index.js` or `src/sim/species.js` (spawn logic)

**Verification checklist**
- [ ] World dimensions are 120×80 (or equivalent 4× area).
- [ ] Resource counts scale to preserve density.
- [ ] Population is 80 total with four nearby species clusters.
- [ ] Spawns avoid water and remain deterministic by seed.

**Stop point**
- Stop after map scale and density checks pass.

---

## Phase 5 — Preemptive Coupling Fixes for Phases 3 + 4

**Tasks**
- [ ] Fix renderer alignment assumptions when size increases (tile offsets).
- [ ] Align input worldPoint units with tile-space creature positions.
- [ ] Expand culling margins to accommodate larger sprites.
- [ ] Ensure clustered spawn anchor region is on land with retry logic.
- [ ] Update /context/repo-map.md if files/roles change.

**Likely files to change**
- `src/render/renderer.js`
- `src/input/index.js`
- `src/sim/creatures/index.js`
- `src/sim/terrain-generator.js` (anchor safety checks)

**Verification checklist**
- [ ] Render alignment matches sim coordinates under larger sizes.
- [ ] Inspect/tap accuracy remains correct after size changes.
- [ ] Culling no longer pops creatures near edges.
- [ ] Cluster anchors avoid water and produce four nearby groups.

**Stop point**
- Stop after coupling fixes are confirmed and documented.

---

## Oddities / suspected bugs spotted
- `ticksPerSecond` exists but is unused (timebase mismatch). (See `src/sim/config.js`)
- Render centering assumes `x + 0.5` offset even though sim positions are continuous. (See `src/render/renderer.js`)
- Input/inspect unit mismatch between pixel-like worldPoint and tile coordinates. (See `src/input/index.js` and creature inspection helpers)
- Culling appears center-only and may pop larger sprites at edges. (See `src/render/renderer.js`)
