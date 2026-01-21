# Track 10.5 — Timebase + Survival + Visibility + Map Scale (Spec)

## Goals
- Normalize simulation timebase so 1x speed is stable in ticks/sec independent of display refresh.
- Restore survivability by aligning drains/ages/thresholds to real seconds after timebase fix.
- Increase creature visibility to ~1 tile size without breaking alignment or inspection accuracy.
- Expand world area to 4× while preserving resource density and enabling clustered species spawning.

## Non-goals
- No new simulation systems or rendering features beyond timebase, survival pacing, visibility, and map scale adjustments.
- No changes to tick order, determinism model, or RNG architecture.
- No implementation in this planning-only run.

## Acceptance Criteria
### A) Timebase normalization
- At 1x speed, ticks/sec remains stable across 60 Hz and 120 Hz displays (within a small tolerance).
- Movement speed in tiles/sec is sane relative to prior expectations (no “teleporting” at 1x).
- Pausing/resuming does not accumulate massive time debt.

### B) Survival pacing
- After timebase fix, early mass deaths largely disappear (≤ 10% deaths in first 60s on default seed).
- Median time-to-death is substantially longer than current baseline and aligns to seconds-based tuning.
- Basal drain, thresholds, and starting reserves are expressed in per-second terms (or converted deterministically).

### C) Creature visibility + alignment
- Creature marker radius is ~1 tile (±20%) and clearly visible at default zoom.
- Tap/inspect selects the intended creature accurately at default zoom.
- No obvious edge culling pop-in when creatures approach view boundaries.

### D) Map scale + density + population
- World area is 4× (2× width and 2× height) with resource densities preserved.
- Density-preserving counts are applied for bushes/grass patches/terrain blobs/water corridors.
- Population increases to 20 per species (80 total) with four nearby clusters (one per species).
- Spawn clustering is land-safe (no mass spawning in water) and remains deterministic by seed.

## Spawn + Density Requirements (Explicit)
- Map size: 60×40 → 120×80 (or equivalent 4× area).
- Density scaling targets:
  - bushCount: 24 → 96
  - grassPatchCount: 28 → 112
  - terrainBlobCount: 18 → 72
  - waterCorridorCount: 3 → 12
- Population: 20 per species (Squares/Triangles/Circles/Octagons) for 80 total.
- Spawn distribution: four nearby clusters (one per species), not uniform scatter.
