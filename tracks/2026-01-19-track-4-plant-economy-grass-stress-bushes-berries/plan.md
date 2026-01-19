# Track 4 — Plan

## Recon Summary
- Files likely to change:
  - `src/sim/world-grid.js` to add per-cell grass/stress fields or a parallel buffer for plant state.
  - `src/sim/sim.js` to hook plant system updates into the Regen phase (without changing tick order).
  - `src/sim/config.js` to add tunables for grass regrowth/stress and bush parameters.
  - `src/metrics/index.js` to expose grass/stress/bush metrics in the metrics snapshot or UI.
  - New plant modules (per blueprint): `src/sim/plants/grass.js`, `src/sim/plants/bushes.js`, `src/sim/plants/index.js`.
  - Tests: `tests/plant-economy.test.js` if we add determinism checks for plant logic.
- Key modules/functions involved:
  - `createWorldGrid` cell storage (currently terrain-only array).
  - `createSim` tick loop (currently increments tick and RNG roll only).
  - Metrics overlay for new plant metrics summary.
- Invariants to respect:
  - Determinism (all randomness via central RNG in `src/sim/rng.js`).
  - Tick order invariant (Sense → Decide → Act → Costs → LifeHistory → Regen → Metrics).
  - Rendering remains read-only and post-tick.
- Cross-module side effects:
  - Expanding cell data shape affects any terrain accessors and renderers that assume terrain-only cells.
  - Adding plant metrics may require UI changes if metrics panel renders a fixed set.
- Tick order impact:
  - Plant updates should live in Regen or a dedicated plant step inside Regen; do not change order.
- Observability impact:
  - Add metrics for average grass and stressed cell count; later add bush/berry totals.
- File rules impact:
  - New plant system should be new files under `src/sim/plants/` to comply with “new system = new file”.
  - Watch file lengths; no file currently near 600 LOC.
- Risks/regressions:
  - Changing `world-grid` cell representation could break terrain rendering if not updated.
  - Plant logic could inadvertently introduce nondeterminism if RNG not passed explicitly.
- Verification commands/checks:
  - Manual: observe grass/stress metrics updating during sim ticks.
  - Automated: add determinism test if required by plan phase touching core formulas.

---

## Phase 1 — Grass regrowth to cap (Step 16)
**Tasks**
- [ ] Confirm active track and update `/context/active-track.md` for Phase 1.
- [ ] Add/extend grass state on world cells to support regrowth.
- [ ] Implement regrowth logic toward cap using deterministic rules.
- [ ] Expose a basic grass metric (average grass) for observability.
- [ ] Update `/context/repo-map.md` if any files/roles change. (checkbox reminder)

**Files touched**
- `src/sim/world-grid.js`
- `src/sim/plants/grass.js` (new)
- `src/sim/plants/index.js` (new)
- `src/sim/config.js`
- `src/metrics/index.js`
- `context/repo-map.md` (if needed)

**Verification**
- [ ] Manual: grass values increase toward cap over time.
- [ ] Metrics: average grass updates during simulation.

**Stop point**
- Stop after verifying regrowth to cap and metrics update.

---

## Phase 2 — Diminishing regrowth near cap (Step 17)
**Tasks**
- [ ] Implement diminishing returns as grass approaches cap.
- [ ] Tune config values to keep visible but stable regrowth.
- [ ] Update `/context/repo-map.md` if any files/roles change. (checkbox reminder)

**Files touched**
- `src/sim/plants/grass.js`
- `src/sim/config.js`
- `context/repo-map.md` (if needed)

**Verification**
- [ ] Manual: regrowth slows near cap, no sudden jumps.

**Stop point**
- Stop after verifying diminishing regrowth behavior.

---

## Phase 3 — Overgrazing stress (Step 18)
**Tasks**
- [ ] Add stress accumulation when grass is low/depleted.
- [ ] Add metrics for stressed cells.
- [ ] Update `/context/repo-map.md` if any files/roles change. (checkbox reminder)

**Files touched**
- `src/sim/world-grid.js`
- `src/sim/plants/grass.js`
- `src/sim/config.js`
- `src/metrics/index.js`
- `context/repo-map.md` (if needed)

**Verification**
- [ ] Manual: stress increases in overgrazed areas.
- [ ] Metrics: stressed cell count updates.

**Stop point**
- Stop after verifying stress accumulation and metrics.

---

## Phase 4 — Stress recovery (Step 19)
**Tasks**
- [ ] Implement stress decay when grass recovers.
- [ ] Ensure stress recovery respects determinism and tick order.
- [ ] Update `/context/repo-map.md` if any files/roles change. (checkbox reminder)

**Files touched**
- `src/sim/plants/grass.js`
- `src/sim/config.js`
- `context/repo-map.md` (if needed)

**Verification**
- [ ] Manual: stressed areas recover over time as grass returns.

**Stop point**
- Stop after verifying stress recovery.

---

## Phase 5 — Bush entities + berry pool (Step 20)
**Tasks**
- [ ] Add bush entity structure with health and berries.
- [ ] Add deterministic placement and initialization.
- [ ] Expose bush/berry metrics.
- [ ] Update `/context/repo-map.md` if any files/roles change. (checkbox reminder)

**Files touched**
- `src/sim/plants/bushes.js` (new)
- `src/sim/plants/index.js`
- `src/sim/config.js`
- `src/metrics/index.js`
- `context/repo-map.md` (if needed)

**Verification**
- [ ] Manual: bushes exist and berry pools are visible in metrics.

**Stop point**
- Stop after verifying bushes + berries metrics.
