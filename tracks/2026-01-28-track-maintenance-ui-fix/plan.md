# Plan — Maintenance: UI Config Panel Fixes

## Recon Summary
- **Files likely to change:**
  - `src/ui/config-panel.js` (input rendering, categories, control types, power features).
  - `src/sim/config.js` (configMeta coverage, boolean types, UI schema hints).
  - `src/styles.css` (toggle/slider styling, responsive layout, details/summary styling).
  - `src/main.js` (only if batch apply or reset hooks are required).
- **Key invariants:**
  - Do not change simulation behavior or defaults (no simConfig edits).
  - Determinism preserved; UI writes only.
  - Boolean flags must write true/false (no 0/1 for boolean types).
- **Cross-module side effects:**
  - Config panel renders based on configMeta; missing categories can hide knobs.
  - Reset logic relies on simConfig defaults; ensure defaults remain unchanged.
- **Tick order impact:** None (UI-only changes).
- **Observability impact:** None required.
- **File rules impact:** No new systems expected.
- **Risks/regressions:** Wrong type mapping, missing category rendering, mobile layout regressions.
- **Verification commands/checks:** Manual UI checks per phase; optional `npm run dev` for inspection.

---

## Phase 1 — Boolean trap + hidden knob exposure

### Tasks
- [ ] Audit `configMeta` for boolean feature flags and set `type: 'boolean'` while removing numeric min/max/step.
- [ ] Update config panel rendering to use checkboxes/toggles for boolean type and write true/false.
- [ ] Ensure panel update path sets `checked` from config for boolean inputs.
- [ ] Add missing categories to the config panel and add fallback category handling.
- [ ] Add configMeta entries for verified hidden primitive knobs (numbers/booleans/selects only).
- [ ] ✅ Reminder: update `/context/repo-map.md` if files/roles change.

### Files touched
- `src/ui/config-panel.js`
- `src/sim/config.js`
- `src/styles.css` (only if checkbox styling is needed)
- `src/main.js` (only if wiring changes are needed)

### Verification checklist
- [ ] Run dev server and open config panel.
- [ ] Toggle a boolean feature off; confirm the config writes `false` and the feature disables.
- [ ] Confirm no boolean inputs write 0/1.
- [ ] Confirm newly exposed hidden knobs appear in intended categories.
- [ ] Confirm categories like world/memory/metrics/rendering are visible.

### Stop point
- Pause after manual UI checks; do not proceed to Phase 2 without review.

---

## Phase 2 — UI reorg + real controls + descriptions

### Tasks
- [ ] Extend configMeta with `description`, `unit`, `control`, and `advanced` hints from verified doc.
- [ ] Render categories as collapsible sections with readable headers.
- [ ] Render boolean toggles, selects, sliders + number inputs based on configMeta hints.
- [ ] Show default values and highlight changed values.
- [ ] Improve mobile layout (stacked rows, larger controls).
- [ ] ✅ Reminder: update `/context/repo-map.md` if files/roles change.

### Files touched
- `src/ui/config-panel.js`
- `src/sim/config.js`
- `src/styles.css`
- `src/main.js` (only if needed for reset hooks)

### Verification checklist
- [ ] Boolean flags render as toggles.
- [ ] Sliders appear for bounded numeric knobs.
- [ ] Descriptions/units match verified doc intent.
- [ ] Layout stacks cleanly on narrow viewports.

### Stop point
- Pause after manual UI checks; do not proceed to Phase 3 without review.

---

## Phase 3 — Power tuning + structured knob editors

### Tasks
- [ ] Add search/filter over label/key/description.
- [ ] Add favorites/pinning with localStorage persistence.
- [ ] Implement preset export/import with validation.
- [ ] Add JSON editor for structured knobs with validate/apply flow.
- [ ] Add section-level reset per category.
- [ ] ✅ Reminder: update `/context/repo-map.md` if files/roles change.

### Files touched
- `src/ui/config-panel.js`
- `src/styles.css`
- `src/sim/config.js`
- `src/main.js` (optional for batch apply support)

### Verification checklist
- [ ] Search filters knobs correctly without breaking layout.
- [ ] Favorites persist across reloads.
- [ ] Export/import validates JSON and applies only known keys.
- [ ] JSON editor prevents invalid changes.
- [ ] Section reset restores defaults.

### Stop point
- Pause after manual UI checks; no further phases until review.
