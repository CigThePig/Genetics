# Track 0 — Blueprint (Repo Bootstrap)

## Intent

Stand up the scaffolding needed for a minimal app boot, standard module layout, tests, and deployment plumbing.

## Design Notes (No Code)

- Use Vite as the build tool with an index entry and a minimal app boot.
- Establish the src/ directory structure with stubs for sim/render/ui and any required entry modules.
- Add placeholder modules for future systems without implementing logic.
- Choose Vitest as the test runner and include a smoke test that exercises the scaffolding.
- Ensure npm scripts exist for dev/build/preview/test.
- Configure Vite base path for GitHub Pages at /Genetics/.
- Add a GitHub Actions workflow that builds and deploys dist/ to Pages.

## Files & Responsibilities

- src/main.js: minimal app boot + wiring only.
- src/sim/\*: simulation orchestrator/config stubs.
- src/render/\*: renderer stub.
- src/ui/\*: UI shell stub.
- src/input/_, src/metrics/_: placeholder system entries (stubs only).
- tests/\*: Vitest smoke test.
- vite.config.js: base path config for Pages.
- package.json: scripts and dev dependencies.
- .github/workflows/deploy.yml: Pages deploy pipeline.
- index.html/README.md/context docs: document the structure and usage.

## Risks

- Docs can diverge from actual scripts or structure.
- Pages base path mismatch can break asset loading.

## Verification Strategy

- Run npm run dev/build/preview/test in a clean environment.
- Confirm docs reflect the created scaffold and Pages setup.
