# Maintenance Track — Blueprint

Purpose:

- Add per-species metrics counters, summary keys, and UI grouping while preserving existing metrics.

Systems touched:

- Metrics factory for new per-species structures.
- Creature subsystems for reproduction, death, chase, combat, and genetics mutation updates.
- Sim summary generation for flat per-species keys.
- UI metrics definitions and rendering for grouped subsections.
- Styles for subheading layout.

Files & responsibilities:

- src/sim/metrics-factory.js
  - Add per-species counter helpers and initialize new metrics fields.
- src/sim/creatures/reproduction.js
  - Reset per-species last-tick metrics and increment per-species birth/pregnancy/miscarriage counters.
  - Pass species to mutation metric helpers.
- src/sim/creatures/death.js
  - Increment per-species deaths by total and cause.
- src/sim/creatures/chase.js
  - Increment per-species chase attempts/successes/losses.
- src/sim/creatures/combat.js
  - Increment per-species predator/prey kill counts.
- src/sim/creatures/genetics.js
  - Accept species in mutation metric updates and increment per-species totals.
- src/sim/sim.js
  - Expose flat per-species summary keys for UI.
- src/ui/index.js
  - Add group metadata to metric definitions and render subheadings.
- src/styles.css
  - Style metrics subheadings for grouped layout.

Risks & mitigations:

- Stale per-tick data → reset per-species last-tick counters alongside existing resets.
- Key mismatches → reuse species constants and align UI labels with summary keys.
- UI layout drift → add subheading styling with grid spanning.
