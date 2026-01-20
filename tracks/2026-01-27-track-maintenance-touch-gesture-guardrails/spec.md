# Maintenance Track — Touch Gesture Guardrails

## Goal
Prevent the browser from hijacking touch gestures so canvas pan/pinch interactions stay inside the renderer.

## Includes
- Set canvas touch-action to none for the renderer canvas.
- Prevent default touch/pointer behavior during pointer down/move/up in the input system.

## Acceptance
- Touch pan/pinch on the canvas does not trigger page scroll/zoom.
- Pointer handlers still work for mouse and touch.

## Risks
- Overzealous preventDefault could affect non-canvas interactions if applied broadly.

## Verification
- Manual: touch or emulate touch in devtools; canvas interactions do not scroll/zoom the page.
