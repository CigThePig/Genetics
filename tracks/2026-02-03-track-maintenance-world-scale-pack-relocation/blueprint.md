# Blueprint — World Scale + Resource Scarcity + Pack Relocation

## Summary
- Update sim config to adjust world height, terrain thresholds, plant tuning, and herding cohesion.
- Extend pack AI to track leader staleness and relocate patrol home after sustained idle behavior.

## Files
- src/sim/config.js
  - Adjust world/terrain/plant defaults and add pack relocation config keys.
- src/sim/creatures/pack.js
  - Track leader staleness and implement relocation logic for pack predators.

## Data & State
- Add pack-level staleness counter (leader-owned) for relocation timing.
- Relocation uses RNG sampling within a radius, gated by config and terrain water avoidance.

## Logic
- Leader increments stale ticks only when idle (no chase/combat/urgent intent) and waypoint is local.
- On threshold, sample candidate homes, choose a valid distant land tile, update pack home, and refresh waypoint.
- Reset stale ticks after relocation or active engagement.

## Risks & Mitigations
- Risk: Relocation overrides urgent need behavior.
  - Mitigation: Gate relocation to idle patrol state; do not run when intent is food/water.
- Risk: Nondeterminism.
  - Mitigation: Use existing RNG and deterministic sampling order.

## Verification
- Manual sim run verifying map scale, resource scarcity, and pack relocation after staleness threshold.
