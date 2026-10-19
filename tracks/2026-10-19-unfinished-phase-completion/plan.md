# Plan — Unfinished phase completion

## Recon and deviation notes

All 24 existing track plans were inspected. Seven have open tasks/checklists; most implementation boxes were already checked. The maintenance roadmap additionally lacks time conventions in architecture and configurable spawn retries. Current verify passes (59 tests). UI JSON validation accepts invalid nested values, imports skip it, favorites are filter-only, structured controls are permanently expanded, resets can alias defaults, and focusing non-text controls calls an unsupported method.

The user's all-phases instruction authorizes sequential execution and review in this run, superseding historical one-phase-per-run stop points. Each phase still has its own verification checkpoint. Existing automated scenarios may replace repeatable manual assertions; actual browser checks remain necessary for layout and pointer behavior. Retained worker toggles now select the same synchronous authoritative path, per the completed audit.

## Phase 1 — Complete existing UI phases 1–4

Tasks:

- [x] Shared recursive/domain validation for JSON editors and preset imports, with regressions.
- [x] Pinned Favorites section, structured editor drawers, safe reset values and focus handling.
- [x] Exercise config/graphs/inspector controls at desktop and narrow viewports.
- [x] Update repo-map for added files/roles.

Files: src/ui/config-\*.js, tests/config-validation.test.js, context/repo-map.md.
Verification: focused tests and browser checks, lint/format/build.
Stop point: inspect evidence and diff before Phase 2.

## Phase 2 — Timebase, survival, pregnancy and maintenance gaps

Tasks:

- [x] Test clock scheduling independently of render refresh and pause/resume debt.
- [x] Verify pregnancy preempt invariants and default survival/pregnancy results.
- [x] Document units and expose spawn/anchor retry budgets, retaining defaults.
- [x] Update repo-map for added files/roles.

Files: src/app/timebase.js, bootstrap.js, config-defaults.js, config-meta/creatures-1.js, creatures/spawn.js, tests/phase-completion.test.js, context/architecture.md.
Verification: deterministic scenarios, seeded survival measurements, clock scenarios.
Stop point: inspect results before Phase 3.

## Phase 3 — Herd/pack/render verification and closeout

Tasks:

- [x] Verify relocation/regroup/threat/water and renderer cache expectations.
- [x] Run npm run verify and npm run test:soak.
- [x] Reconcile all historical open checklists with named evidence and limitations.
- [ ] Update repo-map, history, active-track and create a PR.

Files: tests/phase-completion.test.js, existing track plans, context/maintenance-roadmap.md, context/phase-completion-2026-10-19.md, context/history.md, context/active-track.md.
Verification: repository gates, deterministic scenario tests, desktop/mobile checks, default seeded soak.
Stop point: PR review.

## Phase 1 review checkpoint

23 config validation scenarios pass. Chromium pointer/DOM checks passed at 1280×800 and 390×844 with no application page errors. Verified boolean writes, favorites/section persistence, section reset, valid/invalid import and editor paths, graph handle/FAB, playback, profiler opening, and inspector follow/clear. Inspected screenshots for desktop/mobile bounds and toggle alignment.

## Phase 2 review checkpoint

Clock and pregnancy preempt scenarios pass. Spawn retry budgets retain the exact previous default values and have matching metadata. Existing starting reserves and thresholds meet the first-minute survival target in measured seeded runs; no further default tuning was justified.

## Phase 3 deviation note

Verification exposed that simple herding omitted long-range regroup and its post-drink timer never decayed. Complex herding could steer toward a threat when herd/smoothing forces opposed fleeing. Added shared regroup plus countdown in simple mode and immediate threat steering in both modes; tested with separated kin, urgent needs and predators. This deliberately changes behavior/seed trajectories, without changing predator formulas or tick order.

## Phase 3 review checkpoint

Final seeded soak passes for all three seeds: no first-minute deaths, all species present, and finite/bounded state with exact population accounting. Both browser viewport suites and live resize/profiler checks pass. Historical plans now point to an evidence table and disclose automated substitutions and remaining subjective/device observations. Implementation review is complete; PR creation/closeout is the final administrative step.
