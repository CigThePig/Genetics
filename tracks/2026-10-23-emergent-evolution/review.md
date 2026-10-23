# PR #144 code review and corrections

Reviewed head: `533ce1c0d6572b0130ca1286181e06426c9c9f7e`, against main
`b0985754ef70fd4bc6517bafa16e522bbb134000`. The three original Codex threads
were already resolved; this pass found four additional correctness gaps.

## Findings and fixes

1. **P2 — Escape exit erased unexpired threat information.** A low-vigilance
   animal could observe a predator four tiles away, decline to flee, and
   immediately forget its position even though its alarm timer remained positive.
   Moving toward that last observation after losing sight could not initiate
   escape; local neighbours also could not receive the observation. Preserve the
   copied position and hop count until expiry, independently of escape direction.
   Acquisition/exit distances, finite warning expiry and hop limits remain intact.
   The regression failed on the reviewed code and now passes; it covers re-entry,
   release, expiry and no response after expiry. Existing warning-loop and seeded
   replay tests also pass. This changes seeded ecological trajectories.
2. **P2 — Reciprocal-transfer protocol accepted the wrong donor/cohort.** File
   integrity alone did not establish the named origin habitat or seed; founder
   transfers could be accepted as descendant assays. Validate the registered
   donor filename, cohort, sampling and positive pool size, then verify the donor
   from the local audited matrix, its source/configuration, actual surviving
   descendant count and every transplanted founder genome. Reject undeclared
   predator removal, polymorphism, transplants and habitat resource interventions.
   Eight protocol mutation cases failed to raise before the fix. Added coverage
   also rejects an incorrect pool count and a genome absent from its donor pool.
3. **P2 — Runner verification could be bypassed.** Removing the runner object or
   emptying its dependencies skipped validation; locally edited runner files also
   acted as trust anchors. Require the complete dependency set and compare hashes
   with immutable published Git objects. Early metadata-free records are accepted
   only when their exact bytes match the pinned publication commit. Regression
   coverage rejects missing, empty and partial runner metadata.
4. **P2 — Activity recording counted suppressed feeding intents during flight.**
   Record `flee` when the authoritative escape override is active. Include explicit
   sampling semantics: other buckets are selected intents, not proof of resource
   consumption. A regression supplies a feeding intent with an accepted escape
   and verifies that the observer records flight. Historical activity arrays are
   preserved and still describe the old intent-only sampling.

## Review coverage

Inspected the production diff and surrounding inheritance, birth/pregnancy,
world rebuild, threat propagation, behaviour pacing, movement, action execution,
history/UI and configuration paths. Reviewed experiment setup, recording,
aggregation/provenance, plotting, performance/browser harness changes, regression
changes and CI wiring. Checked the archived evidence against its manifests and
reran the complete continuation analysis with the stronger validator. No additional
verified defect was found in inheritance, both birth paths, bounded passive
histories, or pending-mode rebuild behaviour.

## Validation

- `npm run verify`: **320 JavaScript tests**, ESLint, Prettier and production build
  pass.
- `python -m unittest discover -s tests -p 'test_*.py'`: **24 tests** pass after
  importing the documented immutable source bundle.
- All **91 continuation records** pass the strengthened audit. The entire
  recomputed analysis equals the archived analysis, including every per-run row.
- Both historical artifact manifests verify: **37 + 131 checksums**, no mismatch.
- `npm run test:soak -- --ticks=3600`: seeds **1, 42, 1337** pass the simulation
  invariants (10,800 ticks total). Endpoint populations are 80, 80 and 79;
  seed 1337 records one predation death. These are one-minute smoke runs, not
  multi-generation balance validation.
- Browser smoke was attempted but could not launch: the environment has the
  Playwright package without its Chromium executable. No fresh browser or mobile
  performance result is claimed. This follow-up changes no UI code.

## Evidence and reproduction limits

The continuation's quantitative conclusions remain historical observations of its
pinned candidate, **not measurements of the corrected threat-memory policy**.
The original 3,564,000-tick experiment matrix has not been rerun on this follow-up.
The fixes do not establish sustained ordinary adaptive evolution.

The continuation validator intentionally audits the registered historical matrix.
Use the published runner from commit `533ce1c0` (or its accepted archived versions)
with the documented frozen production worktrees to reproduce that matrix. New
runs using the corrected recorder/policy require a separately registered source,
runner and protocol; do not overwrite the original archives or loosen their audit
to admit a new treatment. Future intent/activity comparisons must account for the
new `sampling.activityBasis` field.
