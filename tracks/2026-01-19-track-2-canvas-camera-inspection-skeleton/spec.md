# Track 2 — Canvas + Camera + Inspection Skeleton (Steps 6–10)

## Goal
Make the world viewable and navigable on touch screens with a minimal inspection and metrics scaffold, plus persistent settings and a worker-ready architecture stub.

## Scope (from Track Index)
Includes:
1) Canvas renderer + camera pan/zoom (touch)
2) Tap inspector stub (location or entity)
3) Metrics panel skeleton
4) Save/load settings (seed, speed, toggles)
5) Worker-ready architecture stub

## Acceptance
- Touch camera feels good (drag + pinch).
- Inspector shows something meaningful.
- Settings persist across refresh.

## Risks
- Touch handling conflicts with UI overlays.
- Performance issues from redraw patterns.

## Verification
- Manual: camera works on phone (pinch/drag).
- Manual: settings persist after refresh.
