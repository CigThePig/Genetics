# Maintenance Track — Creature Render Pass

Goal:

- Render creature markers in the canvas view after terrain and plants.

Includes:

- Add a creature render pass after terrain drawing.
- Convert creature grid positions to canvas coordinates using existing camera transforms.
- Render simple markers for visible creatures without mutating sim state.
- Preserve draw order (terrain → plants → creatures → overlays).

Acceptance:

- Creatures appear as markers at correct positions relative to terrain.
- Rendering remains read-only and deterministic.
- Draw order is unchanged aside from the new creature pass.

Risks:

- Incorrect coordinate transforms cause misaligned markers.
- Rendering loop accidentally mutates sim state.

Verification:

- Manual: observe creature markers aligned with terrain and camera pan/zoom.
