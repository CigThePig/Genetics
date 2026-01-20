# Blueprint — Track 8: Food Web + Perception + Memory

Intent:
- Implement canonical food preferences, food properties, and digestive efficiency biases tied to the canonical ecosystem.
- Add first-pass perception, alertness/reaction delay, and memory records so behavior differs by experience (scouts vs route runners).

Inputs & References:
- Track Index: Steps 36–42.
- Canonical Ecosystem (context/architecture.md).
- Creature Architecture: Engine vs Species Traits (context/architecture.md).
- Determinism + tick order invariants.

Proposed Modules / Files (no code):
- src/sim/creatures/ (likely new submodules for food logic, perception, memory, alertness)
- src/sim/config.js (new tunables for perception/memory thresholds, if needed)
- src/metrics/ (add metrics/summary entries if required for observability)
- src/ui/ (inspector fields for memory/alertness summaries)
- tests/ (deterministic scenario test for perception/memory behavior if required)

Data & Interfaces (conceptual):
- Food canon tables: per-species diet rankings + fallback rules referencing canonical resources.
- Food properties: nutrition, handling, risk for grass/bush berries/meat.
- Digestive efficiency: per-species bias table referencing canonical diet rules.
- Perception v1: distance/terrain effects, returns sensed candidates.
- Alertness: reaction delay tied to alertness meter/trait.
- Memory records: typed entries (food/water/danger/mate) with decay/age.

Observability:
- Inspector must expose memory summary entries (recent/strongest) and alertness state.
- Metrics should add minimal summary if behavior becomes opaque (e.g., counts of memory records or alertness stats).

Risks & Mitigations:
- Perception too strong/weak: add tunables in config and ensure terrain modifiers are respected.
- Memory cost: keep capped lists and deterministic decay.

Verification Plan (high level):
- Manual: observe scouts vs route runners.
- Inspector: memory entries visible.
- Automated: deterministic scenario test if perception/memory logic is added (seeded sim produces stable summary).
