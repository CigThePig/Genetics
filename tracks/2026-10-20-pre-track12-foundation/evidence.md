# Behavioural verification evidence

Baseline: **b9afecd616fa19ee49354c8b6a0a8bfd7cc9be25** (current main at task start). All reported measurements below come from actual recorded runs. Different implementations intentionally change decision/RNG consumption; comparisons are whole trajectories, not statistically isolated effect estimates. All three seeds are reported, including losses.

## Default ecosystems — 36,000 ticks / 600 simulated seconds

| Seed | Version  | Population | Births | Pursuits | Catches | Age deaths | Thirst deaths | Starvation deaths | Square / triangle / circle / octagon | Mean tick ms |
| ---- | -------- | ---------: | -----: | -------: | ------: | ---------: | ------------: | ----------------: | ------------------------------------ | -----------: |
| 1    | baseline |        199 |    199 |       13 |       0 |         80 |             0 |                 0 | 99 / 3 / 93 / 4                      |         4.82 |
| 1    | final    |         55 |    100 |       67 |      26 |         28 |            61 |                10 | 35 / 1 / 19 / 0                      |         3.11 |
| 42   | baseline |        202 |    202 |        3 |       0 |         80 |             0 |                 0 | 95 / 1 / 102 / 4                     |         4.62 |
| 42   | final    |        101 |    118 |       63 |      21 |         59 |            11 |                 6 | 30 / 1 / 70 / 0                      |         3.56 |
| 1337 | baseline |        224 |    222 |        0 |       0 |         78 |             0 |                 0 | 103 / 8 / 109 / 4                    |         5.20 |
| 1337 | final    |        114 |    140 |       42 |      17 |         60 |            22 |                 7 | 34 / 1 / 76 / 3                      |         4.99 |

The standard soak independently executes the same three final worlds, checking finite/nonnegative meters, bounds, unique IDs and exact births/deaths accounting every tick. Its complete creature/summary hashes match the recorder runs exactly for all three seeds; see [soak and replay results](evidence/soak-and-replay.json). Timings, telemetry sampling and browser playback do not enter authoritative decisions.

Predation now occurs in all default seeds without disabling camouflage, replacing geography, forcing encounters or manufacturing catches. This is a working search → acquisition → pursuit → catch chain, not proof of demographic equilibrium. Octagons disappear in seeds 1 and 42 by ten minutes; seed 1337 retains both predator species. Thirst/starvation also occur. The change lowers total population through both direct predation and altered travel/reproduction/survival. Those losses are material results, not hidden as a success statistic. A ten-minute run spans major founder age deaths, but does not establish multi-hour stability.

## Controlled scenarios — 3,600 ticks / 60 simulated seconds

All eleven fixtures run with seeds 1, 42 and 1337. Controlled baselines were recaptured after isolating basal need drains; default-world baselines retain normal ecology. Initial conditions and exact commands are in [tooling.md](tooling.md).

| Scenario | Seed | Baseline pursuits / catches | Final pursuits / catches | Baseline mean path / net tiles | Final mean path / net tiles |
| -------- | ---- | --------------------------- | ------------------------ | ------------------------------ | --------------------------- |
| solitary | 1    | 0 / 0                       | 0 / 0                    | 222.9 / 47.4                   | 149.9 / 27.7                |
| solitary | 42   | 0 / 0                       | 0 / 0                    | 229.2 / 48.0                   | 140.9 / 16.2                |
| solitary | 1337 | 0 / 0                       | 0 / 0                    | 213.6 / 39.7                   | 125.0 / 7.8                 |
| peaceful | 1    | 0 / 0                       | 0 / 0                    | 46.7 / 27.6                    | 73.8 / 19.4                 |
| peaceful | 42   | 0 / 0                       | 0 / 0                    | 53.2 / 6.6                     | 92.7 / 23.0                 |
| peaceful | 1337 | 0 / 0                       | 0 / 0                    | 52.4 / 7.0                     | 78.1 / 13.3                 |
| travel   | 1    | 0 / 0                       | 0 / 0                    | 169.8 / 18.4                   | 126.4 / 28.0                |
| travel   | 42   | 0 / 0                       | 0 / 0                    | 138.3 / 23.2                   | 120.8 / 26.2                |
| travel   | 1337 | 0 / 0                       | 0 / 0                    | 117.4 / 33.5                   | 119.0 / 23.0                |
| rejoin   | 1    | 0 / 0                       | 0 / 0                    | 56.0 / 9.8                     | 81.4 / 16.9                 |
| rejoin   | 42   | 0 / 0                       | 0 / 0                    | 54.1 / 17.6                    | 105.5 / 24.5                |
| rejoin   | 1337 | 0 / 0                       | 0 / 0                    | 51.9 / 22.2                    | 89.0 / 19.7                 |
| search   | 1    | 0 / 0                       | 0 / 0                    | 207.3 / 10.4                   | 195.4 / 47.5                |
| search   | 42   | 0 / 0                       | 0 / 0                    | 220.6 / 6.3                    | 219.6 / 38.1                |
| search   | 1337 | 0 / 0                       | 0 / 0                    | 212.4 / 12.1                   | 190.6 / 51.9                |
| divided  | 1    | 0 / 0                       | 0 / 0                    | 212.1 / 33.7                   | 200.0 / 36.9                |
| divided  | 42   | 0 / 0                       | 0 / 0                    | 217.9 / 31.5                   | 168.8 / 36.1                |
| divided  | 1337 | 0 / 0                       | 0 / 0                    | 212.0 / 27.7                   | 228.0 / 39.3                |
| approach | 1    | 0 / 0                       | 1 / 1                    | 109.0 / 33.7                   | 164.8 / 26.0                |
| approach | 42   | 0 / 0                       | 1 / 1                    | 97.8 / 29.6                    | 139.1 / 39.4                |
| approach | 1337 | 0 / 0                       | 2 / 1                    | 101.0 / 29.0                   | 155.1 / 34.7                |
| pursuit  | 1    | 2 / 0                       | 1 / 1                    | 128.8 / 29.1                   | 122.7 / 36.3                |
| pursuit  | 42   | 2 / 0                       | 1 / 1                    | 122.2 / 21.1                   | 128.2 / 34.8                |
| pursuit  | 1337 | 1 / 0                       | 1 / 1                    | 155.7 / 32.7                   | 148.7 / 28.4                |
| water    | 1    | 0 / 0                       | 3 / 1                    | 102.2 / 20.1                   | 145.5 / 25.5                |
| water    | 42   | 0 / 0                       | 2 / 1                    | 68.1 / 30.7                    | 135.6 / 38.9                |
| water    | 1337 | 0 / 0                       | 3 / 1                    | 67.6 / 15.2                    | 150.2 / 44.9                |
| multiple | 1    | 0 / 0                       | 5 / 4                    | 186.3 / 20.2                   | 125.4 / 38.4                |
| multiple | 42   | 0 / 0                       | 4 / 2                    | 146.0 / 24.9                   | 134.2 / 38.2                |
| multiple | 1337 | 0 / 0                       | 4 / 3                    | 133.4 / 32.4                   | 161.5 / 36.2                |
| recovery | 1    | 0 / 0                       | 1 / 1                    | 78.6 / 20.1                    | 100.7 / 22.2                |
| recovery | 42   | 0 / 0                       | 2 / 0                    | 87.4 / 33.6                    | 115.4 / 29.5                |
| recovery | 1337 | 0 / 0                       | 0 / 0                    | 52.3 / 15.5                    | 98.6 / 18.0                 |

### Interpreting motion

- Peaceful seed 1: baseline mean path/net 46.7/27.6 tiles, final 73.8/19.4. This is **not** a claim that less movement is inherently better. The final group stays more locally while individual destinations differ. Stationary occupancy changes from 64.9% to 20.2% after removing competing pause cycles; animals still pause, graze and travel. Remaining grazing activity can be adjusted with the existing behaviour timing controls.
- Search seed 1: path/net 207.3/10.4 → 195.4/47.5 tiles; unique 4×4 cells per predator 35.8 → 58.0. Baseline traces repeatedly cross a small home area. Final routes cover a broader interior, with independent persistent scouting paths rather than rotating slots. Net displacement and coverage support this specific observation; they do not measure animal intelligence on their own.
- Pursuit/multiple-threat fixtures demonstrate both catches and survival. Individual trajectories leave danger in different directions; close threats can interrupt an alert pause. Opposing threats cannot cancel into an undefined zero flee vector.
- Water/divided fixtures and the retained-route regression exercise barrier openings; headings no longer snap to collision escape angles. The full-route test requires arriving on the far side, not merely returning a valid steering vector.
- Recovery explicitly removes a threat at 15 s. Alarm snapshots expire without mutual refresh; animals return to ordinary goals and can rejoin local companions. A caught animal is absent thereafter, rather than reappearing for playback.

## Problems found and retested

1. Source tracing confirmed species-wide packs, force-first wandering, unused movement-contagion output, and phase-based motion detection. Replaced by geographical membership, individual goal arbitration, actual-velocity observation and one authoritative social engine. Membership/death/splitting/replay regressions pass.
2. The first extended implementation exposed route oscillation and thirst deaths. Retained compact routes and explicit full-route arrival tests replaced the short greedy lookahead. Water memory suppression was also inconsistent with individual autonomy, so the default now retains individual water memories and local water sharing. Final runs still report ecological deaths honestly.
3. Slow stalking continued after prey visibly escaped. Charging now responds to observed radial velocity; it does not read hidden prey intent. Existing wind-up/catch guards and controlled pursuit tests remain in the suite.
4. Early search plots showed tight parallel routes and destinations clamped onto edges. Members now retain locally varied scouting destinations, and out-of-bounds search samples are rejected. Final quantitative/visual records were regenerated after these changes.
5. Peaceful fixtures originally became water searches after about twenty seconds. Controlled fixtures now explicitly disable basal energy/water drain; full default/stress worlds remain unchanged. Baselines and final controlled records were recaptured with the same fixture definitions.
6. Formatting checks initially exhausted memory parsing raw motion histories. Recordings now use gzip and generated evidence is excluded from formatting, while all source/tests/handwritten reports remain checked. Browser downloads through the usual CDN failed; an external Chromium package provided a working browser. No runtime dependency was added.

## Automated coverage

186 tests cover existing colour/regional/mating/inheritance/reproduction behaviour plus local pack membership, distant separation, retention hysteresis, splitting, leader loss, deterministic IDs/input ordering, goal persistence and survival priority, personal-space dead bands, actual motion, terrain edits/routes, arrival braking, turn limits, sprint incentives, finite snapshot alarms, multiple threats, shore escape, feeding priorities, active pursuit retention, committed searches and seeded pursuit/recovery. Historical tests asserting removed force/anchor internals were updated to assert the replacement behaviour; meaningful safety/behaviour expectations were retained.

## Visual and temporal evidence

- [Trajectory comparisons](evidence/trajectory-comparison.png) cover the full recorded minute. Start circles and final-live crosses distinguish displacement from total path length.
- Video generation tools are included; video binaries are omitted at the user's request. Selected compressed controlled-motion recordings and the trajectory plot remain included.
- The browser temporal viewer supports every controlled scenario, all three seeds, normal/accelerated playback, seeking, destinations, headings and alarms. `?long=1` loads ten-minute default history. Recorded coordinate interpolation is display-only.
- [Browser results](evidence/browser/results.json) record read-only rendering, narrow-screen controls, all twelve scenario playbacks and timings. Screenshot binaries are omitted to expedite submission. Visual inspection also used the recorded temporal viewer and trajectory comparisons.

## Performance and scale

The paired long-run table measures wall time inside tick calls only. These runs shared the host with other verification; population/behaviour workload also differs. They are indicative totals, not controlled microbenchmarks or a universal FPS guarantee. Route fields are capped at 24 per world; per-creature retained paths and bounded social/search memory replace unlimited histories in production. Recording overhead is developer-only.

A separate 180×240 world with 240 starting animals and 0.3× starting grass/regrowth/berry regeneration was run for 3,600 ticks (seed 42). Final population 240, pursuits 0, catches 0; mean tick 14.37 ms. This is a one-minute scale/scarcity check, not long-run balance evidence.

See [Track 12 readiness](track12-readiness.md) for combat ownership/timing and wounds/healing integration. Multi-hit combat, wounds and healing are not part of this change.

## Delivery scope

Video and browser screenshot binaries, final ten-minute motion archives, and the stress motion archive are omitted to expedite the PR as requested. Their aggregate numeric results and replay hashes remain included; large per-animal JSON exports are also omitted and can be regenerated. The scenario/recording/browser tools regenerate these artifacts; controlled comparison recordings and trajectory/contact-sheet figures already uploaded are included. Optional `?long=1` playback requires regenerating the final long recording first.
