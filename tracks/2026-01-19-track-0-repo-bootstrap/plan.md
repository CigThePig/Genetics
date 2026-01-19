# Track 0 — Plan (Repo Bootstrap)

## Recon Summary
- (pending)

---

## Phase 1 — Vite app boot + standard layout (Steps 1–3)

### Tasks
- [ ] Scaffold Vite app boot with minimal entry.
- [ ] Create standard src/ layout (sim/render/ui).
- [ ] Add placeholder modules for future systems (stubs only).
- [ ] Update /context/repo-map.md if files/roles change.

### Files Touched
- (planned) index.html
- (planned) src/main.js
- (planned) src/sim/*
- (planned) src/render/*
- (planned) src/ui/*
- (planned) src/input/*
- (planned) src/metrics/*
- (planned) context/repo-map.md

### Verification Checklist
- [ ] npm run dev starts without errors.

### Stop Point
- Pause for review after confirming the dev server boots.

---

## Phase 2 — Tests + npm scripts (Steps 4–5)

### Tasks
- [ ] Decide on Vitest and add a smoke test.
- [ ] Ensure npm scripts exist for dev/build/preview/test.
- [ ] Update /context/repo-map.md if files/roles change.

### Files Touched
- (planned) package.json
- (planned) tests/*
- (planned) context/repo-map.md

### Verification Checklist
- [ ] npm test passes.
- [ ] npm run build completes.

### Stop Point
- Pause for review after tests and build succeed.

---

## Phase 3 — Pages base path + deploy workflow + docs (Steps 6–7)

### Tasks
- [ ] Configure Vite base path for /Genetics/.
- [ ] Add GitHub Actions workflow to deploy dist/ to Pages.
- [ ] Ensure docs reflect scaffolding + Pages setup.
- [ ] Update /context/repo-map.md if files/roles change.

### Files Touched
- (planned) vite.config.js
- (planned) .github/workflows/deploy.yml
- (planned) README.md
- (planned) context/repo-map.md

### Verification Checklist
- [ ] npm run build completes with the Pages base path.

### Stop Point
- Pause for review after docs and deploy workflow are in place.
