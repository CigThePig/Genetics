# Track 3 — Blueprint: World Grid & Terrain Foundations

## Overview
Introduce a deterministic world grid with terrain types and a terrain effects lookup. Terrain generation uses a blob-based algorithm driven by the central RNG. Rendering reads the grid and paints terrain tiles, including water and shore corridors, while keeping sim tick logic unchanged.

## File Plan (no code)
- Update/create a world grid module to own terrain cell data and accessors.
- Add a terrain generation module that consumes RNG + config to populate the grid with blobbed terrain regions.
- Add a terrain effects table module that maps terrain type → modifiers (friction, perception, plant cap).
- Extend rendering to draw terrain tiles with clear, distinct colors/textures.
- Extend settings/config as needed for grid size and terrain tuning values.
- Wire the grid + terrain generation into sim initialization and ensure determinism via the central RNG.

## Data & State
- World grid
  - Dimensions, cell array, and terrain type per cell.
  - Accessor functions to read terrain type at world/cell coordinates.
- Terrain effects table
  - Static map of terrain type to modifiers (friction, perception, plant cap).

## Algorithms & Determinism
- Terrain generation v1
  - Use blob placement seeded by RNG with stable iteration order.
  - Inputs: grid dimensions, RNG, configurable counts/sizes, and terrain types.
  - Output: terrain type assigned to each cell.
- Water + shore corridors
  - Ensure coherent water regions with adjacent shore tiles; preserve determinism.

## Rendering
- Terrain rendering reads the grid and draws tiles in a deterministic, view-only pass.
- Visual palette should clearly distinguish terrain types (including water/shore).

## Observability
- Terrain effects must be queryable by sim systems (e.g., via a lookup function).
- Inspector/metrics changes are not required in this track but may be added later.

## Risks & Mitigations
- Risk: noisy terrain distribution → tune blob sizes/counts and smoothing rules.
- Risk: nondeterminism → ensure all randomness flows through the central RNG and iterate deterministically.
