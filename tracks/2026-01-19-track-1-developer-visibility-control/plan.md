# Track 1 Plan — Developer Visibility & Control

## Recon Summary
- (pending)

---

## Phase 1 — FPS overlay + toggle

### Tasks
- [ ] Identify current render/metrics entry points for overlay placement.
- [ ] Implement FPS overlay display and toggle state (mobile + desktop).
- [ ] Add/update docs or notes if new UI affordances are added.
- [ ] [Repo-map] Update /context/repo-map.md if any files are added or roles change.

### Files Touched
- src/metrics/index.js
- src/ui/index.js
- context/repo-map.md (if roles change)

### Verification
- [ ] Manual: FPS overlay visible with toggle on desktop.
- [ ] Manual: FPS overlay toggle works on mobile.

### Stop Point
- Pause for review after verifying overlay and toggle behavior.

---

## Phase 2 — Minimal UI shell (play/pause/step/speed)

### Tasks
- [ ] Implement minimal control shell for play/pause/step/speed.
- [ ] Wire controls to sim lifecycle entry points (no sim logic in UI).
- [ ] [Repo-map] Update /context/repo-map.md if any files are added or roles change.

### Files Touched
- src/ui/index.js
- src/main.js
- context/repo-map.md (if roles change)

### Verification
- [ ] Manual: play/pause/step/speed controls function as expected.

### Stop Point
- Pause for review after verifying controls behavior.

---

## Phase 3 — Seeded RNG module

### Tasks
- [ ] Add a seeded RNG module with clear API.
- [ ] Ensure sim uses the central RNG module (no Math.random in sim logic).
- [ ] Display seed in UI or metrics panel as appropriate.
- [ ] [Repo-map] Update /context/repo-map.md if any files are added or roles change.

### Files Touched
- src/sim/rng.js
- src/sim/sim.js
- src/ui/index.js
- context/repo-map.md (if roles change)

### Verification
- [ ] Manual: seed displayed and changes affect outcomes.

### Stop Point
- Pause for review after verifying seed usage.

---

## Phase 4 — Determinism smoke test

### Tasks
- [ ] Add deterministic summary output for sim after N ticks.
- [ ] Implement determinism smoke test (same seed => same summary).
- [ ] [Repo-map] Update /context/repo-map.md if any files are added or roles change.

### Files Touched
- src/sim/sim.js
- tests/sim.test.js
- context/repo-map.md (if roles change)

### Verification
- [ ] Automated: determinism test passes.

### Stop Point
- Pause for review after test passes.

---

## Phase 5 — Context pack + repo-map validation

### Tasks
- [ ] Validate context pack alignment (track artifacts, repo-map updates).
- [ ] Ensure repo-map matches actual file roles.
- [ ] [Repo-map] Update /context/repo-map.md if any files are added or roles change.

### Files Touched
- context/repo-map.md
- context/active-track.md (if needed)

### Verification
- [ ] Manual: repo-map reflects current file roles and new modules.

### Stop Point
- Pause for review after repo-map validation.
