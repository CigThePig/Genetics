# Blueprint — Track 9: Predation + Chase Dynamics

Intent:

- Add deterministic target scoring for predator species based on the canonical food web.
- Implement a stamina-aware chase loop with target loss conditions and observability of chase outcomes.

Inputs & References:

- Track Index: Steps 43–44.
- Canonical Ecosystem (context/architecture.md).
- Creature Architecture: Engine vs Species Traits (context/architecture.md).
- Determinism + tick order invariants.

Proposed Modules / Files (no code):

- src/sim/creatures/ (new or updated modules for target scoring and chase state handling)
- src/sim/config.js (tunables for chase distance, stamina drain, target loss thresholds)
- src/metrics/ (chase attempts/outcomes counters)
- src/ui/ (inspector fields for current target + chase status)
- tests/ (deterministic scenario test for target scoring/chase behavior)

Data & Interfaces (conceptual):

- Target scoring table keyed by predator species referencing canonical prey.
- Chase state: target id, last seen tick, pursuit distance, stamina gating.
- Target loss rules: distance/visibility threshold + stamina exhaustion.

Observability:

- Inspector should show current target and chase state (e.g., pursuing/losing/resting).
- Metrics should count chase attempts, successes, and losses for visibility.

Risks & Mitigations:

- Predator selection feels random: use deterministic scoring with stable tie-breakers.
- Constant target loss: tune thresholds and expose config values for iteration.

Verification Plan (high level):

- Manual: observe consistent target choice logic and visible chase arcs.
- Metrics: chase attempts/outcomes update.
- Automated: deterministic scenario test for target scoring/chase loop.
