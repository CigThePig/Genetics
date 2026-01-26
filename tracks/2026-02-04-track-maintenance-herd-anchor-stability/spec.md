# Maintenance Track — Herd Anchor Stability + Wander Cohesion

Goal:
- Prevent herbivore herds from diffusing into single-file “ants” by improving long-run cohesion, wander correlation, and gentle patch anchoring without affecting predator behavior.

Scope:
- Rebalance herding defaults to reduce diffusion and keep subtle steering.
- Add wander-in-herd tuning to bias and smooth wander headings.
- Add intelligent patch-preference herd anchors for herbivores with low-frequency evaluation, drift, and hysteresis.
- Ensure sync + worker flows apply the same anchor influence (main-thread only anchor evaluation).
- Add a sanity test for anchor validity (bounds + non-water).

Acceptance:
- Herbivore herds remain cohesive for multiple minutes without predators and avoid ant-like diffusion.
- Movement remains smooth (no constant micro-rotation swarm behavior).
- Anchor selection is stable, bounded, and avoids water/out-of-bounds tiles.
- Predator behavior is unchanged (no herding/anchor for triangles or octagons).
- Worker mode behaves similarly to sync mode.

Risks:
- Over-strong anchor could override urgent needs or feel like a global magnet.
- Nondeterminism if random sampling bypasses central RNG.
- Performance regressions if anchor evaluation is too frequent or too heavy.

Verification:
- Automated: new herd anchor sanity test passes.
- Manual: observe herd cohesion and smooth movement with predators off/low; confirm regrouping after split.
- Manual: toggle worker mode and compare behavior consistency.
