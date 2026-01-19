# Plan — Maintenance: Metrics Population Display

## Recon Summary
- Files likely to change:
  - src/ui/index.js (metrics definitions and rendering).
- Key modules/functions involved:
  - metricDefinitions, setMetrics in the UI module.
- Invariants to respect:
  - Metrics display formatting should stay consistent.
- Cross-module side effects:
  - UI-only change; no sim state changes.
- Tick order impact:
  - None.
- Observability impact:
  - Adds creature population to metrics readout.
- File rules impact:
  - No new system; ensure file length stays under limits.
- Risks/regressions:
  - Label or formatting mismatch with existing metrics.
- Verification commands/checks:
  - Manual: confirm creature count row appears and updates.

---

## Phase 1 — Add creature population metric

### Tasks
- [x] Add creatureCount to metricDefinitions with label "Creatures".
- [x] Format and display creatureCount in setMetrics similar to plant metrics.
- [x] (Optional) Add "Population" section header to the Metrics panel.
- [x] Update /context/repo-map.md if any files/roles change.

### Files touched
- src/ui/index.js
- context/repo-map.md (if roles/files change)

### Verification
- Manual: check Metrics panel shows creature count.

### Stop point
- Pause for review after Phase 1 verification.
