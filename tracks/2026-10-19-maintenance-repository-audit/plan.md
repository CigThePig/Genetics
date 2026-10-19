# Plan

## Recon summary

Baseline commit: 6eae7c7a1c23b48988bbd9d4334f23fa768d9668. 161 files, 26 tests. Baseline: 25 pass, movement test fails; lint has six unused declarations; formatting drift is widespread. Most large source modules already violate the 600-line rule. Hidden global spatial/herd state, indefinite perception cache, paternal lookup at birth and duplicated ZIP workflow are confirmed risks.

## Phase 1 — Repository review and repairs

- [x] Review each source, tooling and documentation section; record evidence and deferred design gaps.
- [x] Fix reproducible correctness and lifecycle defects.
- [x] Add/update automated tests for all core formula or determinism-sensitive changes.
- [x] Extract cohesive helpers from touched oversized modules.
- [x] Update context/repo-map.md for new files or changed roles.
- [x] Verify tests, lint, format and production build; inspect browser when available.
- [x] Record results, close track and create PR.

Files touched: source/tests as justified by findings, workflows, context and this track; final inventory in audit report.
Verification checklist: targeted regressions; independent/interleaved runs; multi-seed finite-state/population invariants; npm run verify; browser smoke.
Stop point: submit the completed single audit phase for review in the requested PR.

## Deviation notes

The connected behavior system and corrected feeding hysteresis change seeded trajectories. Tests now validate replay under the repaired engine. Worker-driven authoritative herding was removed because completion timing cannot satisfy synchronous determinism. The existing standalone worker file is retained as reference. Formatting-only cleanup extends to historical Markdown so the repository's existing mandatory format gate passes.

Large source modules were separated by subsystem responsibility; public module exports remain compatible. Browser verification exposed close-button stacking and config visibility-owner defects; these were repaired within the authorized UI audit scope.

## Completion evidence

59 tests across nine files pass; npm run verify passes all four gates. Three 18,000-tick default-seed runs pass state, ID, bounds and population-accounting invariants. Headless desktop/mobile interaction checks pass, including denied storage; workflow YAML and inline Bash syntax checks pass. Detailed findings and limits are in context/repository-audit-2026-10-19.md. Stop point: review the submitted PR.
