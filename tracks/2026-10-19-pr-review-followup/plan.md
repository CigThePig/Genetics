# Review follow-up — Plan

## Recon

PR #135 has five unresolved findings, all still applicable. Bootstrap is 479 lines after timebase extraction but still combines loop and panel wiring. Chase catches run before behavior integration; state thresholds use raw meters; fallback prey map differs from defaults; alert threshold is unused. PR #136 has two findings: closeout was already fixed in 7b35fd4; complex-threat early return leaves regroup cache stale.

## Phase 1 — Review repairs

Tasks:

- [x] Extract lifecycle and config wiring, keeping modules below the split threshold.
- [x] Fix catch phase gating, meter ratios, fallback map and direct-threat threshold with automated regressions.
- [x] Clear stale regroup cache on bypassed paths and test threat disappearance between evaluations.
- [x] Run full verify and browser playback/config/rebuild checks; check deterministic scenarios.
- [x] Update repo-map, review disposition report, history and active-track.
- [x] Add fixes to existing PR #136.

Files: src/app/{bootstrap,loop,config-controller}.js; src/sim/creatures/{behavior-helpers,behavior-state,chase,combat,targeting,herding,herding-simple}.js; tests/review-followup.test.js and affected existing fixtures; context docs.

Verification: focused regressions, npm run verify, desktop/mobile browser scenarios, bounded seeded smoke. A five-minute soak may be run for changed predator behavior; earlier hashes remain historical evidence.

Stop point: updated PR #136 for review. No merge or deployment.

Review checkpoint: all 16 new regression cases and the existing 100 tests pass. Both browser viewport suites and the additional config-controller lifecycle scenario pass. Bootstrap is 314 lines, behavior-state 396 lines, and new helper modules remain small. No tick-order changes were made.

Closeout: all findings have a documented disposition; fixes are prepared for existing PR #136. Final seeded smoke covers 3,600 ticks per seed after the last alert refinement. Major tick order, dependencies and deployment remain unchanged.
