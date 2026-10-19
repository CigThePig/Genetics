# Maintenance: Comprehensive repository audit

Goal: Review every repository section, repair demonstrable errors, and submit a tested PR.
Includes: simulation orchestration, spatial queries, lifecycle/genetics, food web, herding/pack/movement, world/resources, rendering/input/UI/settings/metrics, tests/tooling/workflows and documentation.
Acceptance: reproducible regression tests for core fixes; tests, lint, formatting and build pass; section-by-section audit report records limitations and remaining design work.
Risks: behavior changes alter ecological outcomes; old tests may assert obsolete movement assumptions; existing oversized modules require mechanical extraction where changed.
Verification: baseline checks, targeted regressions, deterministic independent/interleaved simulations, multi-seed runs, build and browser smoke checks when available.
Engine vs traits: fix shared logic; preserve species tables and per-creature trait precedence. No new evolutionary features or rebalancing without evidence.
