# Track 10.5 — Timebase + Survival + Visibility + Map Scale (Plan)

## Recon Summary

### A) Timebase
- Root-cause candidates:
  - RAF loop drives ticks via `for (i < speed) sim.tick()` in `src/main.js`.
  - `ticksPerSecond` exists in `src/sim/config.js` but is unused.
- Most likely cause: frame-driven tick scheduling (ticks per frame rather than fixed timestep).
- Files/variables to confirm:
  - `src/main.js` RAF loop and speed multiplier.
  - `src/sim/config.js` → `ticksPerSecond`.
  - `src/sim/sim.js` tick entrypoint.

### B) Survival pacing
- Root-cause candidates:
  - Basal drains applied per tick in `src/sim/creatures/index.js`.
  - Drain values defined in `src/sim/config.js` (water/energy).
  - Drink/seek thresholds and perception/memory range may amplify failure when ticks are too fast.
- Most likely cause: per-tick drains amplified by frame-driven tick rate.
- Files/variables to confirm:
  - `src/sim/creatures/index.js` → basal drain logic and death checks.
  - `src/sim/config.js` → `creatureBasalWaterDrain`, `creatureBasalEnergyDrain`, `creatureDrinkThreshold`.
  - `src/sim/creatures/perception.js` and `src/sim/creatures/memory.js` for seek path inputs.

### C) Creature visibility
- Root-cause candidates:
  - Render radius too small relative to `tileSize` (`baseRadius = tileSize * 0.18`).
  - Renderer centers creatures at `(x + 0.5) * tileSize` while sim positions are continuous.
  - Input/inspect unit mismatch when comparing worldPoint (pixels) to tile coords.
- Most likely cause: render scale too small, with latent alignment/unit coupling.
- Files/variables to confirm:
  - `src/render/renderer.js` → `tileSize`, `baseRadius`, centering math, culling.
  - `src/input/index.js` → worldPoint conversion.
  - `src/sim/creatures/index.js` or inspector helpers → `findNearestCreature`.

### D) Map scale + density + spawning
- Root-cause candidates:
  - `worldWidth` / `worldHeight` in `src/sim/config.js` are small.
  - Resource generators use absolute counts (bushes, grass patches, terrain blobs, water corridors).
- Most likely cause: map dimensions are set for a small test map and generators are count-based.
- Files/variables to confirm:
  - `src/sim/config.js` → `worldWidth`, `worldHeight`, population count.
  - `src/sim/plants/bushes.js` → `bushCount`.
  - `src/sim/plant-generator.js` → `grassPatchCount`.
  - `src/sim/terrain-generator.js` → `terrainBlobCount`, `waterCorridorCount`.
  - Spawn logic in `src/sim/creatures/index.js` or `src/sim/species.js`.

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
- [ ] Trace timebase and tick scheduling in RAF loop; document units (per-tick vs per-second).
- [ ] Inventory all tick-based drains, cooldowns, and growth timers tied to survival pacing.
- [ ] Capture render size and alignment math; list unit conversions for input/inspect.
- [ ] Document map dimension and generator count variables; note spawn logic location.
- [ ] Update /context/repo-map.md if files/roles change.

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
- [ ] Confirm tick scheduling and timebase units.
- [ ] Confirm drain/threshold units and default values.
- [ ] Confirm render/input unit conversions.
- [ ] Confirm generator counts and spawn logic location.

**Stop point**
- Pause after recon notes are captured and hypotheses are locked.

---

## Phase 1 — Timebase / Speed Normalization

**Tasks**
- [ ] Implement fixed timestep accumulator using `ticksPerSecond` and speed multiplier.
- [ ] Guard against pause/resume time debt (cap accumulated delta).
- [ ] Add or update a metric to track ticks/sec at 1x.
- [ ] Update /context/repo-map.md if files/roles change.

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
- [ ] Convert basal drains/thresholds to per-second targets (or apply deterministic conversion).
- [ ] Tune starting reserves and seek/drink thresholds after timebase fix.
- [ ] Review reproduction age/cost pacing for timebase impact.
- [ ] Add/update automated test covering survival pacing or deterministic drain conversion (required for core formula changes).
- [ ] Update /context/repo-map.md if files/roles change.

**Likely files to change**
- `src/sim/config.js`
- `src/sim/creatures/index.js`
- `src/sim/creatures/reproduction.js`
- `tests/creatures.test.js` (or new deterministic scenario test)

**Verification checklist**
- [ ] % deaths in first 60s reduced to target.
- [ ] Median time-to-death aligns with expected seconds-based tuning.
- [ ] Automated test passes and validates drain conversion or survival pacing.

**Stop point**
- Stop after survival metrics and test coverage are validated.

---

## Phase 3 — Creature Visibility (Size ≈ 1 Tile)

**Tasks**
- [ ] Increase creature render radius toward ~1 tile.
- [ ] Adjust render alignment for continuous tile coordinates.
- [ ] Fix input/inspect unit conversion for accurate selection.
- [ ] Update culling margin to avoid edge pop-in.
- [ ] Update /context/repo-map.md if files/roles change.

**Likely files to change**
- `src/render/renderer.js`
- `src/input/index.js`
- `src/sim/creatures/index.js` (inspection helpers)

**Verification checklist**
- [ ] Creatures are clearly visible at default zoom.
- [ ] Tap/inspect selects intended creature reliably.
- [ ] No obvious culling pop-in at edges.

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
