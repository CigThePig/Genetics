# Blueprint — Maintenance: Creature Render Pass

## Overview

Add a creature render pass in the renderer that draws simple markers aligned to the existing camera + terrain coordinate transforms.

## Scope

- Render creature markers after terrain and plants.
- Use existing origin/camera transforms to map world grid positions to canvas space.
- Skip rendering outside visible bounds.
- Keep render read-only and deterministic.

## Files & Responsibilities

- src/render/renderer.js
  - Add a creature drawing loop inside render(sim) after terrain drawing and plants.
  - Reuse the existing camera transform logic used for terrain.

## Data Flow

- Input: sim state (creature positions), renderer camera state, tile size, origin offsets.
- Output: canvas draw calls only; no sim state mutation.

## Risks

- Off-by-one bounds or transform mismatches.
- Overdraw order issues if inserted incorrectly.

## Verification

- Manual: pan/zoom to confirm creature markers track terrain tiles.
