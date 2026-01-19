# Plan — Track 7: Survival Actions + Sprinting + Death

## Recon Summary
- Files likely to change:
  - src/sim/creatures/index.js (add action intents, stamina/sprint state, death cause, decision logic). 
  - src/sim/sim.js (wire new Sense/Decide/Act/Costs/LifeHistory/Regen/Metric steps to preserve tick order).
  - src/sim/world-grid.js (add water accessors if water data is introduced for drinking).
  - src/sim/plants/grass.js (add consumption hook for eating).
  - src/metrics/index.js (add population/death metrics output).
  - src/ui/index.js (surface new inspector fields + metrics panel rows).
  - tests/* (add determinism-sensitive movement/metabolism test if formulas change).
- Key modules/functions involved:
  - updateCreaturePriority/updateCreatureMovement/updateCreatureBasalMetabolism/updateCreatureLifeStages, createCreatures (creature state + meters).
  - updatePlants/updateGrass for consumption and plant regrowth.
  - createSim tick() ordering in src/sim/sim.js.
  - UI setInspector/setMetrics for observability.
- Invariants to respect:
  - Determinism and central RNG usage only.
  - Tick order: Sense → Decide → Act → Costs → LifeHistory → Regen → Metrics.
  - No sim logic in src/main.js; new systems get new files if needed.
- Cross-module side effects:
  - Action selection affects movement/plant consumption, which feeds metrics and UI readouts.
  - Death removal impacts creature list length and metrics summary.
  - Grass consumption will affect plant metrics already displayed in UI.
- Tick order impact:
  - Must add Sense/Decide/Act/Costs/LifeHistory/Regen phases in sim tick; ensure basal drains and action costs align.
- Observability impact:
  - Add inspector fields for action intent and meters; add metrics for population counts and death causes.
- File rules impact:
  - No new system expected; keep files under 600 LOC; if new system emerges, create new module file.
- Risks/regressions:
  - Nondeterminism via Math.random or unordered iteration.
  - Death causes ambiguous if multiple meters hit zero.
  - Sprint tuning could dominate movement or drain meters too quickly.
- Verification commands/checks:
  - Manual: observe drink/eat/sprint behaviors, population changes, death cause counts.
  - Automated: npm test if tests added/updated.

---

## Phase 1 — Drinking behavior + Grass eating (Steps 31–32)

### Tasks
- [ ] Implement drink action selection based on thirst and nearby water access.
- [ ] Implement grass eating action selection based on hunger and grass availability.
- [ ] Update grass consumption hooks in plant system.
- [ ] Add/extend inspector fields for current action intent and meters.
- [ ] Update /context/repo-map.md if any files/roles change.

### Files touched
- src/sim/creatures/index.js
- src/sim/world-grid.js
- src/sim/plants/grass.js
- src/ui/index.js
- context/repo-map.md (if roles/files change)

### Verification
- Manual: observe creatures choosing drink/eat appropriately.

### Stop point
- Pause for review after Phase 1 verification.

---

## Phase 2 — Stamina + Sprinting (Step 33)

### Tasks
- [ ] Add stamina meter and sprint decision rules tied to movement.
- [ ] Apply stamina drain/regen aligned to tick order.
- [ ] Ensure deterministic selection for sprint usage.
- [ ] Add/update automated test for determinism-sensitive movement costs (if changed).
- [ ] Update /context/repo-map.md if any files/roles change.

### Files touched
- src/sim/creatures/index.js
- src/sim/sim.js
- tests/* (as needed)
- context/repo-map.md (if roles/files change)

### Verification
- Manual: observe sprint use with stamina drain and recovery.
- Automated: run relevant tests if added/updated.

### Stop point
- Pause for review after Phase 2 verification.

---

## Phase 3 — Death conditions + Population counters (Steps 34–35)

### Tasks
- [ ] Implement death conditions tied to meters/age.
- [ ] Record death causes for metrics.
- [ ] Add population counters and death cause metrics output.
- [ ] Surface counters in UI panel.
- [ ] Update /context/repo-map.md if any files/roles change.

### Files touched
- src/sim/creatures/index.js
- src/metrics/index.js
- src/ui/index.js
- context/repo-map.md (if roles/files change)

### Verification
- Manual: observe population metrics change and death causes recorded.

### Stop point
- Pause for review after Phase 3 verification.
