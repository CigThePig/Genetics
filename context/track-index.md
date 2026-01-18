# Track Index (Roadmap → Tracks)

Purpose:
- Defines the ordered track sequence for building the full game.
- Each track is a bounded unit of work that produces a playable improvement.
- Each track must produce:
  - spec.md (intent + acceptance)
  - blueprint.md (file plan + APIs + risks, no code)
  - plan.md (phases + verification + stop points)

Rules:
- Follow track order unless explicitly overridden.
- Each track should be achievable without touching more than a handful of systems.
- New system = new file. No file > 600 LOC.

---

## Track 1 — Developer Visibility & Control (Steps 1–5)
Goal: Make iteration measurable and deterministic from day one.
Includes:
1) FPS overlay + toggle
2) Minimal UI shell (play/pause/step/speed)
3) Seeded RNG module
4) Determinism smoke test (same seed => same summary)
5) Context pack + repo-map validation

Acceptance:
- FPS visible + toggle works on mobile and desktop.
- Seed is displayed and affects outcomes.
- Determinism check passes for N ticks.
- Repo-map updated for any new files.

Risks:
- Accidental nondeterminism (Math.random, time-based drift).

Verification:
- Manual: UI works on phone.
- Automated: determinism test passes.

---

## Track 2 — Canvas + Camera + Inspection Skeleton (Steps 6–10)
Goal: Make the world viewable and navigable on touch screens.
Includes:
6) Canvas renderer + camera pan/zoom (touch)
7) Tap inspector stub (location or entity)
8) Metrics panel skeleton
9) Save/load settings (seed, speed, toggles)
10) Worker-ready architecture stub

Acceptance:
- Touch camera feels good (drag + pinch).
- Inspector shows something meaningful.
- Settings persist across refresh.

Risks:
- Touch handling conflicts with UI overlays.
- Performance issues from redraw patterns.

Verification:
- Manual: camera works on phone (pinch/drag).
- Manual: settings persist after refresh.

---

## Track 3 — World Grid & Terrain Foundations (Steps 11–15)
Goal: Build a real map that changes movement, sight, and plants.
Includes:
11) World grid data structure
12) Terrain generator v1 (blobs)
13) Terrain effects table (friction, perception, plant cap)
14) Terrain rendering
15) Water + shore corridors

Acceptance:
- Terrain types exist and are visually distinct.
- Terrain modifiers are queryable by sim systems.

Risks:
- Terrain generation produces noisy/unreadable maps.

Verification:
- Manual: terrain is coherent and repeatable by seed.
- Manual: terrain effects table returns expected values.

---

## Track 4 — Plant Economy: Grass, Stress, Bushes, Berries (Steps 16–20)
Goal: Create the ecological “heartbeat.”
Includes:
16) Grass regrowth to cap
17) Diminishing regrowth near cap
18) Overgrazing stress
19) Stress recovery
20) Bush entities + berry pool

Acceptance:
- Grass cycles and stress is observable.
- Bushes exist and have health + berries.

Risks:
- Regrowth feels too fast or collapses too easily.

Verification:
- Manual: watch grass recover and stress respond.
- Metrics: grass average and stressed cells update.

---

## Track 5 — Plant Economy: Recovery, Rendering, Metrics (Steps 21–25)
Goal: Make plant dynamics visible and tunable.
Includes:
21) Bush recovery
22) Berry regeneration tied to bush health
23) Plant rendering
24) Plant metrics
25) “Known seed” hotspot validation

Acceptance:
- Berry hotspots cycle instead of infinite growth.
- Metrics show plant state clearly.
- Known seed produces visible hotspots.

Risks:
- Visuals fail to communicate plant state.
- Metrics too noisy or expensive.

Verification:
- Manual: hotspot seed produces repeatable pattern.
- Metrics: berry totals and bush health change over time.

---

## Track 6 — Creature Core: Meters, Stages, Movement (Steps 26–30)
Goal: Creatures exist as the universal machine.
Includes:
26) Creature model + meters
27) Life stages scaling
28) Basal metabolism drains
29) Movement with terrain friction
30) Thirst/hunger priority

Acceptance:
- Creatures move, drain, and choose basic priorities.
- Life stage affects effectiveness.

Risks:
- Priority logic thrashes between needs.
- Movement becomes jittery under friction.

Verification:
- Manual: observe stable behavior switching.
- Inspector: meters and life stage visible.

---

## Track 7 — Survival Actions + Sprinting + Death (Steps 31–35)
Goal: The loop becomes “alive.”
Includes:
31) Drinking behavior
32) Grass eating
33) Stamina + sprinting
34) Death conditions
35) Population counters

Acceptance:
- Creatures can live/die based on meters and environment.
- Counters reflect births/deaths (births may be placeholder until Track 10).

Risks:
- Death spiral from poorly tuned drains.
- Sprint logic dominates movement.

Verification:
- Manual: creatures drink/eat appropriately.
- Metrics: population changes and death causes recorded.

---

## Track 8 — Food Web + Perception + Memory (Steps 36–42)
Goal: Turn wandering dots into ecology participants.
Includes:
36) Diet ranking + fallback rules
37) Food properties (nutrition/handling/risk)
38) Digestive efficiency biases
39) Perception v1 (sight + terrain)
40) Alertness + reaction delay
41) Memory records (food/water/danger/mate spots)
42) Scout vs route-runner emergence

Acceptance:
- Distinct foraging styles emerge.
- Threat response begins to feel real.

Risks:
- Perception too strong/weak causing unrealistic behaviors.
- Memory becomes too heavy computationally.

Verification:
- Manual: observe scouts vs route runners.
- Inspector: memory entries visible (summary).

---

## Track 9 — Predation + Chase Dynamics (Steps 43–44)
Goal: Chases matter before combat exists.
Includes:
43) Target scoring
44) Chase loop (stamina + losing target)

Acceptance:
- Predator behavior creates chase arcs and stragglers.

Risks:
- Predator selection feels random.
- Pursuit stability causes constant target loss.

Verification:
- Manual: observe consistent target choice logic.
- Metrics: chase attempts and outcomes recorded.

---

## Track 10 — Combat + Reproduction + Genetics + Color + Stability (Steps 45–50)
Goal: Finish the evolution engine and make it visible.
Includes:
45) Multi-hit combat + cooldowns
46) Hit probability + evasion
47) Wounded + healing
48) Reproduction loop
49) Genome + inheritance + mutation + pleiotropy tradeoffs
50) Universal color integration + stability controls + final observability polish

Acceptance:
- Evolution reliably produces visible divergence.
- Color affects detection and mating across species.
- Stability prevents trivial collapse/explosion.
- Observability makes cause-and-effect legible.

Risks:
- Too many coupled systems cause instability or performance issues.
- Color system dominates outcomes in unintended ways.

Verification:
- Run long sim with a few seeds and confirm:
  - trait distributions shift over time
  - populations cycle rather than instantly collapse/explode
  - color distributions and mate preferences drift
  - death causes are plausible (not all starvation or all predation)