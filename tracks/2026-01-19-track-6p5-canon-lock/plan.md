# Plan — Track 6.5: Canon Lock + Species Retrofit

## Recon Summary
- Files likely to change: src/sim/species.js (new), src/sim/creatures/index.js, src/render/renderer.js, src/main.js, src/sim/sim.js, src/ui/index.js, context/architecture.md, context/product.md, context/README.md, context/track-index.md, tracks/2026-01-19-track-7-survival-actions-sprinting-death/{spec,blueprint}.md, context/repo-map.md, context/active-track.md.
- Invariants: No tick order change; determinism must remain intact; renderer must remain read-only.
- Risks: Canon definitions duplicated across docs; UI metrics drift from sim summary.
- Verification: run tests + spot-check inspector/metrics for species.

---

## Phase 1 — Canon alignment + species retrofit

### Tasks
- [ ] Add canonical species module (src/sim/species.js) with deterministic spawn helper.
- [ ] Assign species on creature creation (src/sim/creatures/index.js).
- [ ] Render canonical shapes per species (src/render/renderer.js).
- [ ] Display species in inspector (src/main.js).
- [ ] Expose per-species counts in sim summary + UI metrics (src/sim/sim.js, src/ui/index.js).
- [ ] Define a single canon source of truth in context docs and reference it elsewhere.
- [ ] Update track-index + Track 7 spec/blueprint to reference canon and avoid generic species.
- [ ] Update context/repo-map.md for new module/role changes.
- [ ] Update context/active-track.md with current phase status.
- [ ] Reminder: update /context/repo-map.md when files/roles change.

### Files touched
- src/sim/species.js
- src/sim/creatures/index.js
- src/render/renderer.js
- src/main.js
- src/sim/sim.js
- src/ui/index.js
- context/architecture.md
- context/product.md
- context/README.md
- context/track-index.md
- tracks/2026-01-19-track-7-survival-actions-sprinting-death/spec.md
- tracks/2026-01-19-track-7-survival-actions-sprinting-death/blueprint.md
- context/repo-map.md
- context/active-track.md

### Verification
- [ ] Species appears on creature objects (deterministic assignment).
- [ ] Canvas shows distinct shapes per species.
- [ ] Inspector shows species.
- [ ] Metrics show total creatures + counts by species.
- [ ] Track 7 docs reference canon and avoid generic species phrasing.
- [ ] ✅ Tests: npm test.

### Stop point
- Pause after Phase 1 verification for review before any further scope.
