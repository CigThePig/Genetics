# Track 6 — Plan: Creature Core: Meters, Stages, Movement

## Recon Summary
- (Pending)

## Phase 1 — Creature model + meters (Step 26)
### Tasks
- [x] Define creature data model and initial spawn list.
- [x] Add core meters (energy, water, stamina, HP) to creature state.
- [x] Wire creature system into sim state.
- [x] Add inspector fields for meters.
- [x] Update /context/repo-map.md if files/roles change.

### Files touched
- `src/sim/creatures/*` (new)
- `src/sim/sim.js`
- `src/ui/index.js`
- `src/sim/config.js`
- `context/repo-map.md`

### Verification
- Manual: inspector shows meters for at least one creature.

### Stop point
- Pause after creature state + meters are visible.

## Phase 2 — Life stages scaling (Step 27)
### Tasks
- [ ] Add life stage definitions and scaling factors.
- [ ] Apply life stage scaling to creature effectiveness (movement/metabolism as defined).
- [ ] Surface life stage in inspector.
- [ ] Update /context/repo-map.md if files/roles change.

### Files touched
- `src/sim/creatures/*`
- `src/ui/index.js`
- `src/sim/config.js`
- `context/repo-map.md`

### Verification
- Manual: life stage value changes when expected (seeded or staged).

### Stop point
- Pause after life stage data is visible.

## Phase 3 — Basal metabolism drains (Step 28)
### Tasks
- [ ] Implement basal drain updates for energy/water/stamina.
- [ ] Ensure drains are deterministic and tick-order compliant.
- [ ] Add/update automated test for metabolism drains (deterministic scenario or unit test).
- [ ] Update /context/repo-map.md if files/roles change.

### Files touched
- `src/sim/creatures/*`
- `src/sim/sim.js`
- `src/sim/config.js`
- `tests/*`
- `context/repo-map.md`

### Verification
- Automated: metabolism drain test passes.
- Manual: meters decrease over time.

### Stop point
- Pause after drains + tests land.

## Phase 4 — Movement with terrain friction (Step 29)
### Tasks
- [ ] Implement movement step using terrain friction from terrain effects.
- [ ] Ensure movement respects tick order and determinism.
- [ ] Add/update automated test for friction-influenced movement (unit or scenario test).
- [ ] Update /context/repo-map.md if files/roles change.

### Files touched
- `src/sim/creatures/*`
- `src/sim/terrain-effects.js`
- `src/sim/sim.js`
- `src/sim/config.js`
- `tests/*`
- `context/repo-map.md`

### Verification
- Automated: movement/friction test passes.
- Manual: movement appears smoother on low-friction terrain and slower on high-friction.

### Stop point
- Pause after movement + tests land.

## Phase 5 — Thirst/hunger priority (Step 30)
### Tasks
- [ ] Implement priority logic to choose between thirst and hunger.
- [ ] Add minimal state to show current priority in inspector.
- [ ] Update /context/repo-map.md if files/roles change.

### Files touched
- `src/sim/creatures/*`
- `src/ui/index.js`
- `context/repo-map.md`

### Verification
- Manual: stable switching between thirst/hunger without rapid thrash.

### Stop point
- Pause after priority logic is visible in inspector.
