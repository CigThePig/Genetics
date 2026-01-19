# Track 4 — Plan

## Recon Summary
- (Pending)

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
