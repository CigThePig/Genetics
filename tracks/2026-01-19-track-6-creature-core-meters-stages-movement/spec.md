# Track 6 — Creature Core: Meters, Stages, Movement

## Goal
Creatures exist as the universal machine with core meters, life stages, and basic movement/priority behavior.

## Includes (Steps 26–30)
1) Creature model + meters
2) Life stages scaling
3) Basal metabolism drains
4) Movement with terrain friction
5) Thirst/hunger priority

## Acceptance
- Creatures move, drain, and choose basic priorities.
- Life stage affects effectiveness.

## Risks
- Priority logic thrashes between needs.
- Movement becomes jittery under friction.

## Verification
- Manual: observe stable behavior switching.
- Inspector: meters and life stage visible.
