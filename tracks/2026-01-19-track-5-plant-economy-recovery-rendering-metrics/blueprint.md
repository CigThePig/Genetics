# Track 5 — Blueprint

## Intent
Expose plant recovery and berry regeneration visually and through metrics, and validate hotspots with a known seed.

## Scope
- Add bush recovery logic and berry regeneration tied to bush health.
- Render plants (grass + bushes + berries) in the world view.
- Expand metrics to report plant state clearly.
- Define a known seed scenario to validate hotspot behavior.

## Files to Touch
- src/sim/plants/bushes.js (recovery + berry regen logic)
- src/sim/plants/grass.js (ensure compatible with rendering/metrics)
- src/sim/plants/index.js (orchestration updates if needed)
- src/render/renderer.js (plant rendering)
- src/metrics/index.js (plant metrics reporting)
- src/sim/config.js (tunable parameters for recovery/regen)
- tests/sim.test.js or new test file if needed for deterministic checks

## Proposed Data/Logic Changes
- Bush state gains recovery over time with caps, influenced by stress or other existing plant state.
- Berry pool regeneration scales with bush health to prevent infinite growth.
- Plant rendering uses existing world grid + bush positions to show grass levels, bush health, and berry availability.
- Metrics report totals/averages for grass, bush health, berry counts, and hotspot density.

## Rendering Plan
- Extend renderer to draw grass tiles with intensity based on grass amount.
- Draw bushes as distinct markers, color/size keyed to health and berries.
- Ensure rendering remains read-only and uses sim state snapshots.

## Metrics Plan
- Add metrics aggregation in plant systems or metrics module.
- Display summaries in existing metrics panel with clear labels.

## Known Seed Validation
- Add a documented seed (in config or notes) that produces visible hotspots for manual validation.

## Risks & Mitigations
- Risk: visuals unclear → Mitigation: choose strong palette contrast and verify on mobile.
- Risk: metrics noisy → Mitigation: compute simple rolling averages or totals.

## Open Questions
- Should hotspot validation be a config flag or a documented default seed?
