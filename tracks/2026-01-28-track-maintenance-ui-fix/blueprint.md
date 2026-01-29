# Blueprint — Maintenance: UI Config Panel Fixes

## Overview
Implement the UI config panel fixes in three phases as defined in `context/UI-FIX`, then apply a fourth polish phase covering graphs/inspector usability, without touching simulation behavior or defaults. The work is UI/schema focused and must keep determinism intact by avoiding sim logic edits.

## Scope mapping (from UI-FIX)
- **Phase 1:** Boolean flag handling + configMeta coverage for hidden primitive knobs + category visibility fixes.
- **Phase 2:** UI reorganization (collapsible categories) and correct control types with descriptions/units.
- **Phase 3:** Power features (search/favorites/preset import/export) and safe editing for structured knobs.
- **Phase 4:** UI polish (persisted config collapse state, bottom-sheet graphs handle + FAB, inspector clear button).

## Data + schema changes
- Extend `configMeta` to accurately type boolean flags and expose additional verified primitive knobs.
- Later phases add UI schema hints (`description`, `unit`, `control`, `advanced`) aligned to verified documentation.
- Structured knobs are flagged for JSON editing only in Phase 3.

## UI behavior changes
- Boolean fields render as toggles and write true/false.
- Category definitions cover all configMeta categories with fallback ordering.
- Collapsible UI groups and improved control types (sliders/selects) based on configMeta.
- Power features: search/filter, favorites with persistence, preset export/import, JSON editor with validation.
- Graphs panel behaves like a bottom sheet with handle + drag and can be opened via a Graphs FAB.
- Inspector includes a clear-selection control.

## Files likely touched
- `src/ui/config-panel.js` (primary UI logic)
- `src/sim/config.js` (configMeta definitions)
- `src/styles.css` (control styling, responsive layout)
- `src/main.js` (only if wiring requires batch apply or reset hooks)
- `context/verified-config-knobs-batches-1-27.md` (reference only)

## Risks & mitigations
- **Behavior drift:** Restrict changes to configMeta/UI; avoid modifying simConfig defaults.
- **Boolean/numeric mismatch:** Cross-check with verified doc and existing config gates.
- **UI regressions:** Manual checks on narrow viewport; use progressive enhancements.
- **Structured knob safety:** Validate JSON before apply; apply only known keys.

## Verification approach
- Manual checks per phase (see plan) using the config panel in the running app.
- Validate that no sim logic or defaults changed by diff inspection.
