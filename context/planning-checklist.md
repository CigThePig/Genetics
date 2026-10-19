# Planning checklist

Use this checklist for substantial tracks; small fixes can keep a concise checklist in the PR. `AGENTS.md` is the canonical agent guidance.

## Establish scope from current evidence

- Read the user request, active pointer, repo map and relevant source/tests.
- For a numbered roadmap track, read its goal, included steps, acceptance, risks and verification in `context/track-index.md`. An explicit request can change order or scope.
- Read architecture for simulation changes and product goals for design decisions. Historical reports can explain earlier decisions but do not establish current behavior.
- Identify affected modules, state ownership, units, cross-system effects, determinism and tick-order implications, risks and useful observability.

## Write proportional artifacts

For a substantial track, create `tracks/YYYY-MM-DD-track-N-slug/` (or a descriptive maintenance slug) with:

- `spec.md`: problem, scope, acceptance criteria and exclusions where useful.
- `blueprint.md`: proposed responsibilities, interfaces/state ownership, tradeoffs and risks. Diagrams or illustrative code are optional when they clarify the design.
- `plan.md`: actionable tasks grouped into coherent phases, likely files/roles, verification and any explicitly requested review checkpoints.

Set the active pointer to the track or maintenance scope. Index substantial new modules/track folders in the repo map. Avoid duplicating the same rationale across documents.

## Build a useful verification plan

- Cover changed formulas and determinism-sensitive logic with automated regressions or seeded scenarios that expose the actual failure.
- Exercise config metadata, validation and runtime semantics together when changing tunables.
- Include browser checks for affected UI/lifecycle flows and performance measurements when performance motivates the change.
- State the duration and scope of seeded simulations; do not infer long-run stability from a short smoke test.
- Include current standard checks (`npm run verify`) and targeted additional checks where relevant.

## Execute and close

Verify each phase and continue through authorized scope using `context/workflow.md`. Update plans when evidence changes the design. At closeout, record substantial results, reconcile the repo map and clear the active pointer. Do not invent a review stop solely because a phase ended.
