# Track 4 — Blueprint

## Intent
Implement the plant economy core loop: grass regrowth with stress dynamics and bush entities with berries, while keeping determinism, tick order, and observability intact.

## Scope Mapping (Steps 16–20)
- Grass regrowth to cap.
- Diminishing regrowth near cap.
- Overgrazing stress.
- Stress recovery.
- Bush entities + berry pool.

## Proposed Modules / Files
- `src/sim/plants/grass.js`
  - Grass state update logic (regrowth, stress, recovery).
- `src/sim/plants/bushes.js`
  - Bush entity data structure and berry pool updates.
- `src/sim/plants/index.js`
  - Plant system orchestrator entry point used by `sim.js`.
- `src/sim/config.js`
  - Add tunables for grass regrowth, stress thresholds, bush health/berry pools.
- `src/metrics/index.js`
  - Expose plant economy metrics (grass average, stressed cells, bush count/berry totals).
- `src/sim/world-grid.js`
  - Extend cell data to store grass amount and stress (if not already present).
- `tests/plant-economy.test.js`
  - Deterministic scenario test for grass regrowth/stress metrics (if required by plan).

(Adjust filenames based on existing structure after recon; new system = new file requirement applies.)

## Data Model (Conceptual, No Code)
- World cell adds plant fields:
  - `grass`: current amount (0..cap).
  - `grassStress`: stress accumulator (0..1) indicating overgrazing.
- Bush entity:
  - `id`, `pos` (grid cell or world coords).
  - `health` (0..1).
  - `berries` (0..max).

## System Behavior (Conceptual)
- Grass regrowth: grows toward cap; regrowth rate diminishes near cap.
- Overgrazing stress: increases when grass is low or recently depleted; decays over time.
- Stress recovery: stress decays as grass recovers.
- Bushes: placed deterministically during world setup or by a deterministic placement pass; berries are a pool tied to bush health.

## Tick Order Considerations
- Plant updates should occur in the Regen phase or a dedicated plant step invoked within Regen.
- Rendering remains a read-only view step after sim tick.

## Observability
- Metrics to add:
  - Average grass amount.
  - Count/percent of stressed cells.
  - Bush count.
  - Total berries (and optionally average bush health).

## Risks & Mitigations
- Risk: regrowth/stress dynamics overpower the sim.
  - Mitigation: keep tunables centralized in config; validate with deterministic metrics.
- Risk: additional state increases memory costs.
  - Mitigation: store minimal per-cell fields and reuse buffers where possible.

## Open Questions
- Are grass/stress fields already present in `world-grid` from prior track?
- Best place to hook plant updates in the sim tick while preserving the order invariants.
