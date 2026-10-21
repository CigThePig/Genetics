# PR #139 — Codex review corrections

Reviewed source: `480f5990eed8858de8635411ddde1708ebf06082`. Corrected source: `76a6b352379c3fcb67e2f8357bacc449a017a419`. All three findings are valid and corrected. This is a focused review follow-up; no founder counts, reproductive eligibility, hunting parameters or ecological survival guarantees are added.

## Findings and causal checks

1. [Continue meat recovery below the initiation minimum](https://github.com/CigThePig/Genetics/pull/139#discussion_r4337093755). The action engine can consume any positive meat, but intent required the meal initiation minimum every tick. Continuation now requires positive meat only. A finite 0.005-unit residue is consumed, its actual energy/consumption credited, and recovery stops once it is exhausted. A fresh episode still cannot initiate on that residue.
2. [Honor the explicit mating override during recovery](https://github.com/CigThePig/Genetics/pull/139#discussion_r4337093769). Recovery previously marked arbitration handled before eligible mating could run. Recovery yields when the explicit override is enabled and the animal can consider mates. Eight combinations cover meat/drink, override on/off and visible/blind mate search. Two additional cases confirm the override does not interrupt recovery for an ineligible animal. Configuration metadata describes the restored precedence.
3. [Drop expired contact destinations](https://github.com/CigThePig/Genetics/pull/139#discussion_r4337093778). Copied contact travel shared the random search goal, whose target persists until arrival. It now uses a distinct `mate-contact` goal; invalid contact travel is cleared before random exploration. Multi-tick regressions cover expiry, zero-disable and newly disconnected terrain, and verify that the replacement random search itself remains persistent. The inspector recognizes the distinct contact goal.

Fourteen regression cases were added. The initial red run added the first twelve cases to the reviewed implementation; eight fail: residue recovery, the four enabled-override combinations, and all three invalid-contact scenarios. The fixed implementation passes all cases. Existing contact, emergency-need, real mating eligibility, independent/reset/replay and accounting checks remain in place.

## Validation

- `npx vitest run tests/ecology.test.js --pool=threads --poolOptions.threads.singleThread`: 30 tests pass after the fixes. The initial red run, before adding the two ineligible-override controls and updating the existing contact-goal expectation, has 8 failing / 20 passing tests against the reviewed source.
- `npm run verify`: 229 tests in 16 files, ESLint, Prettier and production build pass. Final JavaScript is 330.43 kB, 87.52 kB gzip.
- `npm run test:soak -- --ticks=36000`: seeds 1, 42 and 1337 all pass per-tick finite meters/positions, bounds, unique IDs and population conservation. All have zero first-minute deaths. Complete results/hashes are retained in `evidence/review-soak.log`.
- [Hosted Verify on corrected source](https://github.com/CigThePig/Genetics/actions/runs/39631989449): passed.
- `git diff --check`: clean. `evidence/review-provenance.json` records the corrected source/test fingerprints.

No new browser run is claimed: the previous optional Chromium executable is unavailable in this recovered environment. The inspector change is limited to recognizing the new contact-search goal; the original browser captures remain labelled as observations of the reviewed source.

## Ecological evidence boundaries

The original ten-seed twenty-minute comparison, forty-minute extension, browser observations, source provenance and full-state hashes describe `480f599`. They are retained unchanged as historical evidence, not silently reused as measurements of these corrections. Contact-goal state and resource consumption alter serialized state and can alter later RNG trajectories. The new soak results therefore have new hashes. These focused regression/soak checks do not establish a new long-term equilibrium or demonstrate a statistically meaningful change to extinction rates. The previously documented demographic limitations remain unresolved.

## Fresh ten-minute outcomes

S / T / C / O means squares / triangles / circles / octagons. Births below include **all species**, not just predators. Before means reviewed `480f599`; after means corrected source `76a6b35`.

| Seed | S / T / C / O before | S / T / C / O after | All births before → after | Kills before → after | Revised peak total |
| ---- | -------------------- | ------------------- | ------------------------- | -------------------- | ------------------ |
| 1    | 68 / 5 / 66 / 2      | 73 / 4 / 60 / 7     | 146 → 154                 | 19 → 22              | 171                |
| 42   | 48 / 6 / 70 / 2      | 38 / 6 / 61 / 4     | 142 → 124                 | 22 → 20              | 155                |
| 1337 | 60 / 3 / 83 / 2      | 53 / 6 / 88 / 4     | 160 → 158                 | 24 → 16              | 171                |

Both predator species remain present in all three corrected ten-minute runs, but this is census survival, not proof of viable sex ratios, founder replacement or long-term stability. Outcomes vary: seed 1337 kills decrease from 24 to 16, while seed 42 ends with fewer herbivores. Matched seeds diverge after altered resource/search decisions; these results are not individual causal counterfactuals or a new estimate of twenty-minute extinction rates. No parameter tuning was applied to improve these graphs.
