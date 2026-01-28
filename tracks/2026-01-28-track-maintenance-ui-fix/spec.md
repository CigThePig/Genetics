# Track — Maintenance: UI Config Panel Fixes

## Goal
Deliver a safer, clearer config panel by fixing boolean flag handling, exposing verified hidden knobs, and upgrading the UI controls/layout without changing simulation behavior or defaults. The scope and sequencing follow `context/UI-FIX`.

## Non-goals
- Any simulation logic changes or default tuning adjustments.
- Legacy compatibility for numeric booleans beyond writing true/false.
- Exposing complex structured knobs (arrays/objects) before Phase 3.

## Includes
1. **Phase 1 — Boolean trap + hidden knobs**
   - Fix boolean flag inputs to read/write true/false.
   - Add configMeta coverage for verified hidden primitive knobs.
   - Ensure config categories render even when not pre-declared.
2. **Phase 2 — UI reorg + real controls + descriptions**
   - Collapsible categories, better control types (toggle/slider/select).
   - Use configMeta descriptions/units to improve clarity and mobile ergonomics.
3. **Phase 3 — Power tuning + structured editors**
   - Search/filter, favorites, preset import/export.
   - Safe JSON editor for complex knobs with validation.

## Acceptance
- Boolean flags toggle off correctly (config writes true/false).
- Verified hidden primitive knobs are visible and editable in the intended categories.
- Categories never silently disappear due to missing metadata.
- UI becomes clearer and mobile-friendly with labels/units/descriptions.
- Advanced power features (search/favorites/presets/JSON editor) are available without altering sim defaults.

## Risks
- Accidentally changing sim behavior via config defaults.
- Mis-typing a knob (boolean vs numeric) causing toggles to behave incorrectly.
- UI regressions on mobile due to layout/control changes.

## Verification
- Manual UI checks per phase (see plan): toggle boolean flags, verify category visibility, confirm hidden knobs appear, ensure controls render correctly on mobile widths, validate import/export/JSON editor behavior.
