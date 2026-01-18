# Genetics

Scaffolding-only repo for a mobile-first evolution simulation. The app runs with a minimal Vite boot and stubs for future systems; no simulation logic is implemented yet.

For project vision, workflow, and roadmap details see `context/README.md` and the files under `context/`.

## Quickstart

```bash
npm install
npm run dev
```

Other useful commands:

```bash
npm run build
npm run preview
npm test
```

## Repository map

- Architecture + invariants: `context/architecture.md`
- Track roadmap: `context/track-index.md`
- Workflow and planning checklist: `context/workflow.md`, `context/planning-checklist.md`
- Master index of files: `context/repo-map.md`

## Deployment (GitHub Pages)

This repo deploys to GitHub Pages as a project site at:
`https://CigThePig.github.io/Genetics/`

The workflow in `.github/workflows/deploy.yml` builds the site and publishes `dist/`. Vite’s production base path is set to `/Genetics/` so assets resolve correctly on Pages.

## License

MIT. See `LICENSE`.
