# Blueprint — Track 2: Canvas + Camera + Inspection Skeleton

## Intent
Provide a touch-friendly canvas renderer and camera controls, a basic inspector stub, a metrics panel shell, persistence for settings, and a worker-ready architecture stub.

## Key Requirements
- Deterministic sim remains intact (rendering is read-only).
- Touch-first controls (drag to pan, pinch to zoom).
- Inspector shows meaningful data (location or entity summary).
- Settings persist across refresh (seed/speed/toggles).
- Worker-ready stub (no worker logic yet, just architecture seams).

## Proposed File Changes (No Code)
- `src/render/renderer.js`
  - Add canvas-based render path and expose camera/view state hooks.
- `src/render/camera.js` (new)
  - Camera state + pan/zoom helpers (touch input friendly).
- `src/input/index.js`
  - Route touch events to camera controls and tap inspector interaction.
- `src/ui/index.js`
  - Inspector panel stub and metrics panel skeleton.
- `src/metrics/index.js`
  - Expand metrics shell to allow new panels/sections.
- `src/main.js`
  - Wire renderer, camera, input, UI, and settings persistence.
- `src/app/settings.js` (new)
  - Save/load settings (seed, speed, toggles) from local storage.
- `src/sim/worker.js` (new)
  - Worker-ready stub interface (placeholder module to enable future worker wiring).

## Data Flow / Interfaces (No Code)
- Camera state lives in a dedicated module; input updates camera state; renderer reads camera state only.
- Inspector flow: input detects tap → UI requests location/entity summary → renderer/sim provides read-only data for display.
- Settings persistence: UI changes flow through settings module, which stores to local storage and returns defaults on load.
- Worker-ready stub defines a clean interface boundary for a future worker-backed sim loop.

## Risks & Mitigations
- Touch event conflicts with UI overlays → ensure input routing avoids UI elements and respects capture rules.
- Performance issues from redraw patterns → throttle rendering and avoid per-event full re-renders when possible.

## Verification Notes
- Manual testing on touch device/emulation for pan/zoom and inspector tap.
- Manual refresh to confirm settings persistence.
