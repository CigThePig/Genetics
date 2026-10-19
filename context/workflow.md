# Workflow

`AGENTS.md` defines the standing agent rules. Use the roadmap for planned feature scope and the user's request for explicitly authorized maintenance or changes to order.

## Choose the amount of planning

- Small fixes and review follow-ups: a concise scope and verification checklist in the PR is sufficient.
- Substantial work: create or update a track with `spec.md` (intent/acceptance), `blueprint.md` (state ownership, interfaces, risks) and `plan.md` (tasks, phases, verification).
- Planning-only requests produce documents; implementation requests proceed through the authorized work.

Read relevant current code and tests before choosing an approach. For substantial work, set `context/active-track.md` to the intended scope before implementation.

## Execute and verify

1. Implement a coherent phase or fix.
2. Run checks appropriate to the change and repair regressions.
3. Update the plan and active pointer at meaningful checkpoints; update the repo map when module responsibilities change.
4. Continue through the requested scope. Stop for an explicit user-requested review gate, a genuine blocker or an unresolved decision beyond the authorized scope.

When new evidence changes the design, update affected documents and explain the material deviation. Historical plans may contain obsolete process instructions; use current `AGENTS.md` for workflow.

## Closeout

Record substantial changes and verification in `context/history.md`, update tooling documentation if needed, and clear `context/active-track.md`. Report tests and evidence honestly, including limits and any pending hosted CI. Merging and deployment require authorization.
