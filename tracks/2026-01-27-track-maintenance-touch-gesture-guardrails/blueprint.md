# Blueprint — Maintenance: Touch Gesture Guardrails

## Summary

Ensure the renderer canvas opts out of browser touch gestures, input handlers prevent default touch behavior, and zoom anchors use canvas-local coordinates.

## Scope

- Update renderer canvas setup to disable default touch actions.
- Update input pointer handlers to prevent default for touch/pointer gestures.
- Convert zoom anchor inputs to canvas-local coordinates for pinch and wheel zoom.

## Non-Goals

- Reworking input gesture math or camera behavior.
- Adding new UI or metrics.

## Systems & Data

### Updated Modules

- src/render/renderer.js — set canvas touch-action style.
- src/input/index.js — prevent default on pointer down/move/up for touch.
- src/input/index.js — adjust zoom anchor coordinates to use canvas-local space.

## Determinism & Tick Order

- No sim logic changes; tick order unaffected.

## Observability

- No new metrics required.

## Risks & Mitigations

- Risk: preventDefault could block other UI gestures. Mitigate by scoping to touch pointer events in input handlers.
