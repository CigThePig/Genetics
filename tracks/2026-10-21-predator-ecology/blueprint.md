# Architecture and mechanism decisions

## Observation

`scripts/investigate-ecology.mjs` is an external observer. It retains removed-creature references to record terminal state, samples populations/sex/maturity/condition/generation/separation every ten seconds, and aggregates predator activity, net energy change and hunt distance each tick. It does not consume RNG or mutate the world. The three baseline 36,000-tick full creature/summary hashes exactly match PR #138's corrected review snapshot. `feedingBySpecies` records actual food consumption and capped gross energy gain in production; net meter change in older baseline logs is a different measurement.

## Recovery of available resources

Priority hysteresis compares relative energy/water deficits. At defaults, a triangle's meat bite is approximately 0.55 / 60 × 4.5 × 1.3 = 0.0536 energy: larger than the 0.05 priority margin. Switching priorities after such a bite can abandon a valuable carcass before appetite or reproductive condition is reached, despite a safe water reserve. Drinking has the reciprocal problem.

Intent now retains an available drinking episode or meat meal until `creatureResourceRecoveryRatio` (default 0.95), at least the individual's inherited initiation threshold. It yields when the competing meter is at/below half its inherited need threshold, matching the existing emergency dietary reserve convention. Actual depletion or leaving the resource also ends continuation. The previous intent is sufficient episode state; there is no timer, free food, modified catch probability or population controller. Grass/berry meal thresholds are unchanged. Water recovery is shared by all species.

0.95 represents near-full existing capacity, not a predator-count target. A trial that merely raised the stopping threshold without preventing non-emergency priority interruption was insufficient. Independent mechanism tests reproduce the premature switching; finite-resource normalized-meter tests demonstrate actual recovery. The selection threshold, maternal costs, gestation, cooldown, lifetime, offspring sex and founder counts are unchanged.

## Mate opportunities and observed contacts

Physiologically eligible animals may acquire a visible partner below appetite when no immediate meal/drink is available. Blind mate searches still require the existing satiation/eligibility gates. Conception continues to use the existing eligibility, visibility, commitment and seeded chance rules.

`mate-memory.js` owns creature-local observations in `reproduction.contacts`: at most four opposite-sex same-species contacts, refreshed at most once per second and expired after 120 simulated seconds (configurable; zero disables). Contacts are observed irrespective of present fertility, so earlier social encounters remain useful later. Entries contain ID, copied position and observation tick, never live entity references or remote state. Healthy unsuccessful mate seekers can revisit a reachable last-observed location before random search. Reaching an unsuccessful location discards it; hidden/dead actors cannot reveal updated positions or be used to conceive remotely. No permanent group membership or forced pairing is added.

120 seconds is one default reproductive cooldown and a bounded information horizon; it was not optimized against final population counts. Existing inherited colour preference ranks live candidates; memory does not override it. Start-of-tick spatial data and visibility policy are retained. Route-cache writes belong to the world and use the existing deterministic navigator. No major tick stage changes.

## Accounting

Actual consumption updates constant-size species × food counters, including capped energy gain and feeding ticks. Kills set an explicit lethal predation event; death classification gives that event precedence over coincident aging. Otherwise age → injury → thirst → starvation precedence remains explicit. Species/global death totals and UI summaries include predation separately. Baseline `injury` counts include predation and must not be silently compared as the same classification.

## Risks

Recovery changes travel/hunting/mating timing and hence RNG trajectories. More water recovery also affects herbivores. Contact memory may guide an animal toward a location that is no longer useful; bounded retention, arrival invalidation and reachability checks limit that cost. Small founder groups retain sex-loss and isolation risk. Late scarcity, competition and aging must still constrain population growth. Multi-seed long runs, scarcity scenarios, independent replay and performance measurements are required; a ten-minute improvement is not an equilibrium claim.
