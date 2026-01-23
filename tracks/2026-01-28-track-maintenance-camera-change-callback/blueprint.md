# Blueprint — Maintenance: Camera Change Callback

## Summary

Expose an input callback that runs after camera pan/zoom updates, and use it in main to re-render only when paused.

## Scope

- Extend createInput options with an onCameraChange callback.
- Invoke the callback after camera pan and zoom operations.
- Wire main to pass a handler that renders the current sim snapshot when paused.

## Non-Goals

- Changing camera math or input gesture behavior.
- Modifying sim tick order or state.

## Systems & Data

### Updated Modules

- src/input/index.js — add onCameraChange option and invoke after camera updates.
- src/main.js — pass onCameraChange handler that renders only when paused.

## Determinism & Tick Order

- No sim logic changes; tick order unaffected.
- Callback must remain read-only (render only).

## Observability

- No new metrics required (optional UI metrics refresh only).

## Risks & Mitigations

- Risk: render handler runs while sim is running. Mitigate by guarding on running state.
