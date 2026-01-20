# Blueprint — Maintenance: Touch Gesture Guardrails

## Summary
Ensure the renderer canvas opts out of browser touch gestures and input handlers prevent default touch behavior to keep pan/pinch interactions inside the app.

## Scope
- Update renderer canvas setup to disable default touch actions.
- Update input pointer handlers to prevent default for touch/pointer gestures.

## Non-Goals
- Reworking input gesture math or camera behavior.
- Adding new UI or metrics.

## Systems & Data
### Updated Modules
- src/render/renderer.js — set canvas touch-action style.
- src/input/index.js — prevent default on pointer down/move/up for touch.

## Determinism & Tick Order
- No sim logic changes; tick order unaffected.

## Observability
- No new metrics required.

## Risks & Mitigations
- Risk: preventDefault could block other UI gestures. Mitigate by scoping to touch pointer events in input handlers.
