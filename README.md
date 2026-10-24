# Genetics

Mobile-first, shareable browser simulation where evolution emerges from ecology, terrain, predation, mate choice, and genetics.

For project vision, workflow, and roadmap details see `context/README.md` and the files under `context/`.

## Quickstart

```bash
npm ci
npm run dev
```

Other useful commands:

```bash
npm test
npm run verify
npm run build
npm run preview
```

Code quality tools:

```bash
npm run lint
npm run format
npm run format:check
```

### Local preview vs. GitHub Pages

Vite’s base path defaults to `/Genetics/` to match the GitHub Pages project site. If you want to preview at `/` locally, override it:

```bash
VITE_BASE=/ npm run build
npm run preview
```

## Regional colour evolution (Track 11)

Worlds now contain coherent forest, plains, sand and rock habitats with local drinking sources. Body colour and mate preferences are inherited by all four shapes. Colour changes detection against the local background; soft mate preferences compete with travel costs.

Use **Inspector → Colour & habitat** for swatches and individual traits, and **Graphs → Colour evolution** to compare founding/earlier populations with later samples. Hue bins wrap from red back to red; counts accompany the distributions. In Configuration, search **Biome classification view** for flat diagnostic colours, **Habitat scale** / **Biome prevalence** for generation controls, or **Colour camouflage** / **Colour mate choice** to isolate effects. Rebuild after initial-colour or geography changes. Mobile zoom-out supports map overviews.

Verification and ecological limitations: [Track 11 evidence](tracks/2026-10-19-track-11-regional-colour-evolution/evidence.md). Geography and selection mechanisms are implemented; long-term balance/adaptive divergence remain subjects for Track 13.

## Repository map

- Architecture + invariants: `context/architecture.md`
- Track roadmap: `context/track-index.md`
- Workflow and planning checklist: `context/workflow.md`, `context/planning-checklist.md`
- Master index of files: `context/repo-map.md`

## Deployment (GitHub Pages)

This repo deploys to GitHub Pages as a project site at:
`https://CigThePig.github.io/Genetics/`

The workflow in `.github/workflows/deploy.yml` builds the site and publishes `dist/`. Vite’s production base path is set to `/Genetics/` so assets resolve correctly on Pages.

If you rename this repo, update:

- The GitHub Pages URL in this README.
- The `VITE_BASE` value in `.github/workflows/deploy.yml`.
- Any other references to `/Genetics/` in deployment docs.

## License

MIT. See `LICENSE`.

## Inherited trait history and evolutionary experiments

**Graphs → Evolution history** now compares inherited speed, perception, metabolism,
growth, longevity and vigilance distributions with founders or an earlier sample. Counts and
mean/SD accompany the histogram; colour histories remain available. Distribution
changes can reflect drift, migration and age composition as well as selection.
They do not by themselves establish adaptation.

New worlds copy either parent's value independently at each quantitative locus
before the existing noise/mutation steps. This preserves inherited alternatives
instead of blending every difference. Configuration → **Inheritance model** can
select **Legacy blending** for comparison; its existing mix-chance control is
inactive in segregating mode. Older settings without this key use the new default
when rebuilt. A selector change shows a pending-rebuild banner; the active world keeps its inheritance model until a world rebuild. No live genome is rewritten, no adaptive outcome is assigned, and
extinction remains possible.

[Investigation, evidence and limits](tracks/2026-10-23-emergent-evolution/evidence.md) ·
[Reproduce the experiments](tracks/2026-10-23-emergent-evolution/tooling.md)

Inherited vigilance now changes how close observed danger can approach before an
animal interrupts feeding or drinking to escape. Its buffer appears in the
inspector; caution can buy distance while costing resource opportunities.
[Ecological selection, reciprocal transfers and remaining limits](tracks/2026-10-23-emergent-evolution/continuation.md)
reports what was demonstrated and why ordinary habitat adaptation remains unproven.
