# Track 3 — World Grid & Terrain Foundations

## Goal
Build a deterministic world map with terrain types that affect movement, perception, and plant capacity, and render it so the map is visually readable.

## Included Steps (from Track Index)
11) World grid data structure
12) Terrain generator v1 (blobs)
13) Terrain effects table (friction, perception, plant cap)
14) Terrain rendering
15) Water + shore corridors

## Acceptance
- Terrain types exist and are visually distinct.
- Terrain modifiers are queryable by sim systems.

## Risks
- Terrain generation produces noisy or unreadable maps.

## Verification
- Manual: terrain is coherent and repeatable by seed.
- Manual: terrain effects table returns expected values.
