# Blueprint — Track 6.5: Canon Lock + Species Retrofit

## Overview
Retrofit the Track 6 implementation so creatures have canonical species identifiers, shapes are rendered per species, and species counts are observable. Define a single canon source of truth in context docs and align Track 7 documentation to reference it.

## Files to Update
- src/sim/species.js (new)
  - Canonical species IDs + ordered list + deterministic spawn helper.
- src/sim/creatures/index.js
  - Assign species during creature creation using deterministic helper.
- src/render/renderer.js
  - Draw square/triangle/circle/octagon markers by species.
- src/main.js
  - Inspector rows include species label.
- src/sim/sim.js
  - Summary includes per-species counts (squares/triangles/circles/octagons).
- src/ui/index.js
  - Population metrics display per-species counts.
- context/architecture.md
  - Single source-of-truth canon section for species/resources/food web/efficiency bias.
- context/product.md, context/README.md
  - Reference the canon section without duplicating full definitions.
- context/track-index.md
  - Insert Track 6.5 and note Track 6 species field + observability; update Track 7–9/11 notes to reference canon.
- tracks/2026-01-19-track-7-survival-actions-sprinting-death/{spec,blueprint}.md
  - Reference canon section and constrain grass eating to Circles.
- context/repo-map.md
  - Add new species module entry.

## Canon (single source of truth)
- Keep the authoritative canon definition in context/architecture.md under a dedicated “Canonical Ecosystem (Locked)” section.
- Other docs should reference this section rather than repeating full tables.

## Determinism
- Species assignment must be deterministic and order-based (no RNG usage required).
- Rendering remains read-only.

## Verification
- npm test passes.
- Manual: creatures show distinct shapes and inspector species; metrics include per-species counts.
