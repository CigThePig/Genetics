# Plan — Maintenance: Creature Render Pass

## Recon Summary
- Files likely to change:
  - src/render/renderer.js (add creature render pass aligned with camera transforms).
- Key modules/functions involved:
  - render(sim), drawTerrain, plant drawing helpers, camera transforms in renderer.
- Invariants to respect:
  - Render is read-only and deterministic.
  - Draw order remains terrain → plants → creatures → overlays.
- Cross-module side effects:
  - Visual-only change; no sim data mutation.
- Tick order impact:
  - None; render remains post-tick.
- Observability impact:
  - Visual markers for creatures (no metrics change).
- File rules impact:
  - No new system; keep renderer file under limits.
- Risks/regressions:
  - Coordinate mismatch with terrain; performance impact if bounds checks missing.
- Verification commands/checks:
  - Manual: verify creature markers align with terrain under pan/zoom.

---

## Phase 1 — Add creature render pass

### Tasks
- [x] Add creature render pass after terrain + plant drawing.
- [x] Convert creature world positions to canvas coordinates using existing camera transforms.
- [x] Render simple markers for visible creatures only.
- [x] Keep rendering read-only and deterministic.
- [x] Confirm draw order is terrain → plants → creatures → overlays.
- [x] Update /context/repo-map.md if any files/roles change.

### Files touched
- src/render/renderer.js
- context/repo-map.md (if roles/files change)

### Verification
- Manual: pan/zoom to confirm creature markers align with terrain tiles.

### Stop point
- Pause for review after Phase 1 verification.
