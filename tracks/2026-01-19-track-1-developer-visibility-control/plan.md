# Track 1 Plan — Developer Visibility & Control

## Recon Summary
Recon completed; summary below reflects current repo state.
- Files likely to change:
  - src/metrics/index.js (add FPS overlay + toggle and metrics snapshot plumbing).
  - src/ui/index.js (add control shell, seed display, FPS toggle wiring).
  - src/main.js (wire UI controls to sim/renderer lifecycle).
  - src/sim/sim.js (wire RNG into sim, add deterministic summary output).
  - src/sim/rng.js (new seeded RNG module per Track 1 scope).
  - tests/sim.test.js (determinism smoke test).
  - context/repo-map.md (update for new module roles/files).
- Key modules/functions involved:
  - createUI (src/ui/index.js) for control shell + toggles.
  - createMetrics (src/metrics/index.js) for FPS overlay + snapshot.
  - createSim (src/sim/sim.js) for deterministic summary and RNG injection.
  - New rng module (src/sim/rng.js) for seeded randomness.
- Invariants to respect:
  - Determinism with a single RNG source; no Math.random or time-based drift in sim.
  - Tick order invariant remains owned by sim orchestration (no UI logic changes).
  - Renderer/metrics must be read-only views of sim state.
  - src/main.js must remain wiring-only per app entrypoint rule.
- Cross-module side effects:
  - UI controls will trigger sim lifecycle; ensure no sim logic migrates into UI.
  - Metrics overlay should not mutate sim state; renderer should remain read-only.
- Tick order impact:
  - None expected; Track 1 adds UI/metrics and RNG wiring without changing tick order.
- Observability impact:
  - FPS/tick overlay adds metrics visibility; seed display in UI for determinism.
- File rules impact:
  - New system (RNG) requires new file (src/sim/rng.js).
  - No file should approach 600 LOC in this track.
- Risks/regressions:
  - Hidden nondeterminism if any Math.random/time usage slips into sim.
  - Metrics uses performance.now for display; keep this isolated from sim logic to preserve determinism.
  - UI controls could accidentally mutate sim state if not carefully wired.
- Verification commands/checks:
  - Manual: verify FPS overlay + toggle on desktop/mobile.
  - Manual: verify play/pause/step/speed controls and seed display.
  - Automated: npm test (determinism smoke test).

---

## Phase 1 — FPS overlay + toggle

### Tasks
- [x] Identify current render/metrics entry points for overlay placement.
- [x] Implement FPS overlay display and toggle state (mobile + desktop).
- [x] Wire metrics instance into app boot so UI can control overlay visibility.
- [x] Add/update docs or notes if new UI affordances are added. (No additional docs needed for internal dev controls.)
- [x] [Repo-map] Update /context/repo-map.md if any files are added or roles change.

### Files Touched
- src/metrics/index.js
- src/ui/index.js
- src/main.js
- context/repo-map.md (if roles change)

### Verification
- [x] Manual: FPS overlay visible with toggle on desktop. (Completed by user.)
- [x] Manual: FPS overlay toggle works on mobile. (Completed by user.)

### Stop Point
- Pause for review after verifying overlay and toggle behavior.

---

## Phase 2 — Minimal UI shell (play/pause/step/speed)

### Tasks
- [x] Implement minimal control shell for play/pause/step/speed.
- [x] Wire controls to sim lifecycle entry points (no sim logic in UI).
- [x] [Repo-map] Update /context/repo-map.md if any files are added or roles change.

### Files Touched
- src/ui/index.js
- src/main.js
- context/repo-map.md (if roles change)

### Verification
- [x] Manual: play/pause/step/speed controls function as expected.

### Stop Point
- Pause for review after verifying controls behavior.

---

## Phase 3 — Seeded RNG module

### Tasks
- [x] Add a seeded RNG module with clear API.
- [x] Ensure sim uses the central RNG module (no Math.random in sim logic).
- [x] Display seed in UI or metrics panel as appropriate.
- [x] [Repo-map] Update /context/repo-map.md if any files are added or roles change.

### Files Touched
- src/sim/rng.js
- src/sim/sim.js
- src/ui/index.js
- context/repo-map.md (if roles change)

### Verification
- [x] Manual: seed displayed and changes affect outcomes.

### Stop Point
- Pause for review after verifying seed usage.

---

## Phase 4 — Determinism smoke test

### Tasks
- [x] Add deterministic summary output for sim after N ticks.
- [x] Implement determinism smoke test (same seed => same summary).
- [x] [Repo-map] Update /context/repo-map.md if any files are added or roles change.

### Files Touched
- src/sim/sim.js
- tests/sim.test.js
- context/repo-map.md (if roles change)

### Verification
- [x] Automated: determinism test passes.

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
