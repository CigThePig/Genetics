# Track 0 — Repo Bootstrap (Scaffolding)

## Goal
Establish a working dev loop and standard structure without simulation logic.

## Scope (Included)
1) Vite init (or equivalent) with minimal app boot
2) Standard src/ layout (sim/render/ui)
3) Placeholder modules for future systems (stubs only)
4) Decide test runner (Vitest preferred) and add a smoke test
5) Basic npm scripts (dev/build/preview/test)
6) GitHub Pages base-path configured in Vite for /Genetics/
7) GitHub Actions deploy workflow publishes dist/ to Pages

## Acceptance Criteria
- npm run dev/build/preview/test work.
- src/ contains sim/render/ui stubs and main entry.
- Docs match the scaffolded structure and Pages setup.

## Risks
- Docs drift from actual tooling.

## Verification
- Run dev/build/test successfully on a clean clone.
