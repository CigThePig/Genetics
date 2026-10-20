# Architecture and diagnosis

Baseline commit: b9afecd (Track 11 merge). Existing major order is Sense → Decide → Act → Costs → LifeHistory → Regen → Metrics. The spatial index is fresh for decisions and rebuilt after movement before reproduction.

Confirmed source findings:

- Packs are species-wide; rotating formation slots follow the lowest-ID animal regardless of distance.
- Simple-herd force selection bypasses persistent wander when any offset exists. Normalized cohesion and separation retain full force at tiny errors, encouraging circulation.
- Movement contagion measures behaviour phase rather than displacement and its output is unused by authoritative pacing.
- Patrols retarget after 3–8 seconds without accounting for route length; hungry search intents bypass patrols.
- Predator rest hysteresis suppresses hunting down to 50% energy; ubiquitous fallback grass fills them before this. Food perception seeks the nearest food rather than meat priority.
- Same-tick warning propagation cascades in array order and remembered warnings can refresh one another indefinitely.
- Immediate water collision avoidance rotates heading/velocity by up to 135 degrees, bypassing turn limits. Target movement has no arrival braking.

Replacement responsibilities:

- Creature-owned persistent locomotion goals arbitrate after survival intent; local social influence selects occasional travel/rejoin goals, not continuous centre attraction. Personal-space correction is bounded and zero outside a comfort band.
- Local bounded groups have deterministic IDs with persistence/hysteresis and no entity references. Pack search owns bounded visited/prey memory and distance-aware commitments. Followers share useful destinations without formation slots.
- Threat sensing uses Track 11 visibility, previous-tick alarm snapshots and finite expiry; escape decisions score individual safety and traversability and retain a short route commitment.
- Navigation caches belong to the world, are invalidated by terrain version, and guide around static water. Physical movement retains heading/acceleration authority.
- Predator fallback foods remain available as emergency nutrition; hunting starts before emergency reserves and food perception observes this policy.

Risks: altered encounters change demography; increased navigation work must be bounded; goal persistence must yield to needs and danger; warning expiry must not create fear loops; diagnosis/replay is observational and must not consume authoritative RNG.
