# Plan — Track 7: Survival Actions + Sprinting + Death

## Recon Summary
- 

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
