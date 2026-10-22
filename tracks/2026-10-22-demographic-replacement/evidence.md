# Population replacement investigation

## Finding and production change

Both birth paths assigned newborns the 120-second recovery period intended for animals that attempted mating. At midpoint genetics an offspring is reproductively mature at 71.43 seconds yet cannot try until 120 seconds. Founders do not have that delay. Across the entire default growth range, genetic maturity is 55.6–100 seconds, so the extra gate masks the first-window benefit of faster growth while its lifespan cost still applies.

Newborn recovery now starts at zero. Genetic maturity, reserves, compatible partners, actual perception/range, parental successful/failed recovery and pregnancy remain active. No founder count, lifespan, conception probability, nutrition, geography or survival exemption is changed. Pair-attempt/failure metrics are fixed-size, instance-owned and observational.

The universal-species hypothesis is partly supported: the hidden delay affects all four species. It is not a universal inability to reproduce: the original herbivore founding cohorts already replace themselves on observed mature-daughter output. Small predator populations also have sparse simultaneous eligible partners and reserve windows. Raising fertility or removing age death would not correct those earlier gates.

## Evidence provenance and recovery

The investigation started from main c1163f6 after inspecting PRs #138–#141 and their available reviews. Twenty paired 72,000-tick runs, 560 controlled assays, canonical 36,000-tick soaks, topology audits, replay and local verify completed before the executor disconnected. The preserved result tables below come from recorded tool outputs in local-snapshot-summary.json.

The original compressed raw files became inaccessible during final archiving. The revised 144,000-tick seed-1 final checkpoint was not recovered; only its 108,000-tick census was observed. No local final performance or actual-browser success is claimed. GitHub CI subsequently regenerated the source-pinned raw archives and completed the extended runs and missing checks. All twenty 72,000-tick endpoint vectors exactly match the preserved local results. [Hosted results](evidence/hosted-results.md) and [manifest](evidence/manifest.json) identify those regenerated records; [browser provenance](evidence/browser-provenance.md) supplements the earlier archive manifest. Local and hosted results remain separately labelled.

## Current-source baseline

80 founders: 36 squares, 36 circles, four triangles and four octagons; exact per-species sex balance, all initial ages zero, individually jittered inherited traits. Two herbivore founder communities of 18 retain balanced pairs; four-member predator species stay together.

Reproductive maturity is effective age 75 seconds; displayed adult movement/metabolism starts at effective age 100. Maximum lifetime is 540 seconds times longevity divided by growth at unit coupling. Reproduction requires positive HP and energy/water at least 70% of bases. Conception succeeds with probability 0.6 per attempted pair; failed recovery is 15 seconds at 40% costs, successful recovery 120 seconds on both participants. Gestation base is 45 seconds with inherited variation; parental recovery overlaps gestation. Offspring reserves and miscarriage rules are unchanged.

Observed contacts remain bounded (four copied locations, 120-second expiry). Mate search is 28 tiles; interaction range is 2.5 incidental / seven while seeking. No hidden live partner coordinates, instantaneous remote migration or body-contact redesign is added. Local groups, terrain routing, resource recovery and existing camouflage/preference rules retain authority.

## Controlled causal experiments

560 assays = two source variants × ten predefined seeds × four species × seven 72,000-tick treatments. Actual conception, pregnancy, mutation, inheritance, aging, costs and death remain. Favorable reserves are explicitly replenished; this is a life-history/partner-opportunity assay, not a carrying-capacity model. Counts use nested prefixes of the same founder genome pool. A preliminary differently drawn count assay was discarded as a causal population-size comparison.

Observed extinctions at twenty minutes, baseline → revised, out of ten runs per cell:

| Treatment                        | Squares | Circles | Triangles | Octagons |
| -------------------------------- | ------- | ------- | --------- | -------- |
| Two favorable nearby founders    | 2 → 2   | 2 → 2   | 2 → 2     | 2 → 2    |
| Four favorable nearby founders   | 1 → 0   | 1 → 1   | 1 → 0     | 0 → 0    |
| Twelve favorable nearby founders | 0 → 0   | 0 → 0   | 0 → 0     | 0 → 0    |
| Two mixed-age founders           | 8 → 6   | 8 → 5   | 8 → 6     | 7 → 6    |
| Same sex                         | 10 → 10 | 10 → 10 | 10 → 10   | 10 → 10  |
| Separated                        | 10 → 10 | 10 → 10 | 10 → 10   | 10 → 10  |
| No replenished resources         | 10 → 10 | 10 → 10 | 10 → 10   | 10 → 10  |

Mature offspring in the two-founder favorable treatment sum to 90 → 138 squares, 89 → 132 circles, 88 → 128 triangles and 85 → 125 octagons. The live immature endpoints (10 → 17, 6 → 12, 9 → 14, 4 → 10) are censored, not failures.

The correction increases viable output under favorable conditions without rescuing every small population. The species share seeds and are not forty independent biological replicates. Larger cohorts help in this assay, but field density, prey demand and resource competition are not isolated here; no production founder-count increase is adopted.

Mixed founding ages often worsen the small-pair outcome. They change residual lifetime and overlap as well as synchrony. Random age assignment is not adopted as a demographic rescue. Lifespan/fertility buffs are not justified by functioning favorable assays and the diagnosed opportunity gates.

## Ten paired wild runs

Each run is 72,000 ticks: twenty simulated minutes, or 2.22 nominal lifespans. Same initial seeds/configuration are preserved. Legitimate earlier attempts change later RNG consumption; paired seeds do not imply identical later ecological events.

| Seed | Squares  | Circles   | Triangles | Octagons |
| ---- | -------- | --------- | --------- | -------- |
| 1    | 62 → 84  | 56 → 130  | 1 → 4     | 8 → 3    |
| 2    | 79 → 190 | 150 → 248 | 0 → 4     | 2 → 10   |
| 3    | 83 → 90  | 112 → 143 | 0 → 4     | 0 → 5    |
| 7    | 23 → 143 | 63 → 113  | 0 → 1     | 1 → 4    |
| 19   | 56 → 104 | 103 → 87  | 0 → 2     | 0 → 0    |
| 42   | 67 → 42  | 84 → 108  | 0 → 0     | 5 → 5    |
| 73   | 97 → 144 | 74 → 146  | 2 → 5     | 1 → 0    |
| 101  | 85 → 157 | 76 → 149  | 7 → 9     | 0 → 0    |
| 1337 | 48 → 124 | 114 → 128 | 4 → 7     | 0 → 0    |
| 2026 | 57 → 70  | 36 → 87   | 0 → 0     | 0 → 0    |

Census endpoints alone do not establish persistence. A surviving one-sex census without active pregnancy cannot produce a future opposite-sex pair in this closed sexual model. Juveniles can restore a temporarily missing mature pair; report tests cover that distinction.

| Species  | Extinct runs | Additional closed censuses | Mature offspring | Offspring with mature children |
| -------- | ------------ | -------------------------- | ---------------- | ------------------------------ |
| Square   | 0 → 0        | 0 → 0                      | 1,403 → 2,002    | 978 → 1,468                    |
| Circle   | 0 → 0        | 0 → 0                      | 1,615 → 2,213    | 1,130 → 1,637                  |
| Triangle | 6 → 2        | 2 → 3                      | 54 → 89          | 25 → 61                        |
| Octagon  | 5 → 5        | 2 → 0                      | 57 → 75          | 31 → 46                        |

Counts sum ten seeds. Both declines and gains are retained: octagon seed 1 worsens from eight survivors to three; square seed 42 from 67 to 42. This is not proof of equilibrium or a statistically established extinction probability.

No predator offspring in either paired group died before maturity. One baseline and six revised predator offspring remained immature at the endpoint and are right censored. Juvenile mortality is therefore not the principal predator replacement bottleneck in this sample. Surviving adult careers are also censored; total births are not a replacement metric.

Observed mature daughters per founding female: squares 1.239 → 1.289; circles 1.378 → 1.361; triangles 0.600 → 0.700; octagons 0.800 → 0.750. The founding cohort and direct offspring maturation outcomes are complete at this horizon. This is founding-cohort output, not an intrinsic biological R0 or a guarantee of descendant fertility.

## Opportunity and mortality gates

Approximate one-second exposure samples:

| Species  | Sufficient reserves / mature samples | Eligible opposite-sex partner anywhere / ready samples | Visible eligible partner / ready samples |
| -------- | ------------------------------------ | ------------------------------------------------------ | ---------------------------------------- |
| Square   | 80.1% → 80.5%                        | 94.1% → 97.7%                                          | 15.2% → 21.0%                            |
| Circle   | 87.9% → 85.1%                        | 95.9% → 98.3%                                          | 16.1% → 19.0%                            |
| Triangle | 63.0% → 63.6%                        | 26.6% → 39.0%                                          | 1.8% → 3.0%                              |
| Octagon  | 61.2% → 63.1%                        | 37.1% → 29.9%                                          | 1.6% → 2.0%                              |

Ready includes maturity, adequate reserves, no pregnancy and no cooldown. The global census is diagnostic only. Brief contacts can fall between samples; conception/birth transitions are separately observed each tick. These gates are not a causal variance decomposition: population exposure, resources, preferences and random trajectories interact.

Predators often survive with positive reserves while lacking simultaneous eligible local partners. Both resource suppression without immediate death and small compatible pools matter. No omniscient search, forced migration or fertility bonus is introduced.

151/161 baseline predator deaths and 174/187 revised deaths are age-attributed. No age-attributed death in the paired sample coincides with empty HP, energy or water. This supports the user's observation while rejecting death precedence as its main accounting explanation. Those are cause counts/shares, not mortality rates; sampled animal-time rates are available in summaries.

All twenty static topology audits found zero water births and zero newborn changes of mother's land component. Disconnected birth placement does not explain these losses. Connected land does not guarantee short or successful travel. Four full-simulation approach scenarios move real partners from fifteen tiles separation into interaction range; four wide-water-barrier cases retain separation. Mating remains the pre-existing proximity abstraction, not a new physical body-contact model.

## Extended observations and limits

Recorded thirty-minute total censuses (baseline → revised) are 142 → 304 for seed 1, 172 → 223 for seed 42, and 220 → 433 for seed 1337. Seed 1's forty-minute baseline census is 185; its revised final checkpoint was unavailable when the executor disconnected. Do not interpret that as a completed local forty-minute pair. Hosted regeneration supplies the following complete extended records, with species ordered consistently and unequal horizons kept separate:

- Seed 1, 144,000 ticks: squares 71 → 121, circles 113 → 499, triangles 0 → 0, octagons 1 → 0.
- Seed 42, 108,000 ticks: squares 59 → 34, circles 110 → 189, triangles 0 → 0, octagons 3 → 0.
- Seed 1337, 108,000 ticks: squares 63 → 204, circles 157 → 220, triangles 0 → 9, octagons 0 → 0.

Revised seed 1 reaches 620 animals but loses both predators; revised seed 42 also loses both. These are observed outcomes, not a stability guarantee.

Twenty/thirty/forty minutes do not establish equilibrium, adaptive divergence or permanent persistence. More herbivore growth can raise total interactive cost despite unchanged per-actor engine complexity. Longevity/growth formulas are verified, not claimed to be a complete biological life-history model. Field-density/prey competition, fine-scale interaction-radius realism and physical-phone profiling remain bounded limitations.

## Verification and Track 12 readiness

Local npm verify passed 292 JavaScript tests, ESLint, formatting and production build; four Python pair-loss/censoring tests passed separately. Four species regressions fail against the original newborn assignment and pass with recovery ownership corrected, in both birth modes. The legacy zero-maturation replay fixture now has an explicit one-second juvenile period instead of relying on accidental parental cooldown.

Three canonical 36,000-tick soaks pass finite state, bounds, IDs and population accounting. Their hashes and totals are preserved in local-snapshot-summary.json. Three 1,200-tick favorable serializable-state comparisons, including navigation Map contents, match the newborn-only ablation after removing only passive counters. The metrics-disabled regression also preserves actors and next RNG output. A repeated baseline seed-1 72,000-tick creature/summary hash matched during its extended run.

Offline conservation checks resolve conception into birth, miscarriage, active pregnancy or maternal death. Detailed histories never enter production. The new fixed-size attempt/failure counters distinguish no opportunity from failed conception and reset with their simulation. There is no new per-tick global mate search or runtime ancestry archive.

Hosted final verification passes 296 JavaScript tests, four Python report tests, ESLint, formatting and the production build. Actual Chromium checks pass desktop and 390 × 844 viewport controls, observed-contact/resource scenarios and read-only rendering, with zero page errors. A literal Vite startup match had stalled the first browser job on ANSI-coloured output; a bounded, ANSI-aware startup helper now has four regression cases and cleans up failures. The successful browser run is linked in the provenance supplement.

Equal-workload hosted Node medians of three trial means are:

- 80 actors: baseline 3.083 → revised 3.037 ms/tick.
- 240 actors: baseline 7.233 → revised 7.170 ms/tick.
- 480 actors: baseline 19.280 → revised 19.208 ms/tick.

Actor hashes match in every paired trial. Small timing differences are not evidence of a speedup. At 480 actors both revisions exceed the 16.7 ms budget for 60 simulation ticks per second. Increased later population can therefore raise total cost even though this correction adds no search and the passive metrics add only 198 serialized JSON bytes (not a heap measurement). Mobile performance and high-density scaling remain risks; neither cloud Node nor narrow-viewport Chromium certifies physical-phone throughput.

The foundation supports controlled Track 12 development: healthy predators can produce reproductive descendants, lifecycle ownership is coherent, and demographic failures are observable. Wild fragility remains real. Preserve the integration contract in track12-readiness.md; no full combat system or merge is part of this PR.
