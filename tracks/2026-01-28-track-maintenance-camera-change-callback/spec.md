# Maintenance Track — Camera Change Callback

## Goal

Allow camera input to trigger a render while the simulation is paused without mutating sim state.

## Includes

- Add an input callback that fires after camera pan/zoom updates.
- Wire the callback in main to re-render when paused.
- Keep the callback read-only (render only).

## Acceptance

- Camera pan/zoom updates the view when the sim is paused.
- Running sim behavior is unchanged.
- Callback does not mutate sim state.

## Risks

- Accidental sim mutation from render-time logic.
- Extra renders while running if guard logic is incorrect.

## Verification

- Manual: pause the sim, pan/zoom, and confirm the view updates without advancing ticks.
