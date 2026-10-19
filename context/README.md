# Genetics

A mobile-first, shareable browser simulation where evolution emerges from ecology, terrain, predation, mate choice, and universal color perception.

This repo is designed to be built with an AI-assisted workflow that keeps project context in files (not chat), so planning and implementation stay reliable as the codebase grows.

---

## What this is (high level)

You’ll watch simple species evolve over time as:

- terrain changes movement, perception, and plant regrowth
- plants create scarcity and hotspots (grass, bushes, berries)
- predators and prey produce chase narratives (stamina, alertness, injury)
- genetics + mutation shift populations through tradeoffs (no free stats)
- color evolves across all species, affects both detection and mating, and is perceived differently by each species

The goal is not scripted behavior. The goal is **emergent outcomes** you can see and inspect.

---

## Canonical ecosystem (locked)

The ecosystem design is in context/architecture.md → “Canonical Ecosystem (Locked)”. Read the audited runtime differences there before changing feeding rules; use named species rather than generic placeholders.

## Anti-drift (engine vs traits)

Do not create separate code paths per species unless explicitly required by design; prefer tables + traits.

---

## Project pillars (non-negotiable)

1. **Evolution is emergent**  
   Genes → phenotype → survival/reproduction → inheritance + mutation → population shifts.

2. **No free stats**  
   Every improvement increases cost or vulnerability elsewhere.

3. **Chases matter**  
   Multi-hit health, stamina-gated sprinting, alertness-gated reaction and evasion.

4. **The map matters**  
   Water, cover, rough terrain, and plant distribution create hotspots, routes, and ambush patterns.

5. **Color is universal**  
   All species evolve body color and mate preferences; each species perceives color differently; color affects both mating and detection.

---

## Repo structure (context-first)

This project keeps important context in `/context/` so agents (and humans) can work reliably:

- `AGENTS.md`  
  Rules and constraints for AI coding help.

- `context/track-index.md`  
  The official roadmap broken into Tracks (the “menu” for creating work).

- `context/planning-checklist.md`  
  A proportional checklist for planning substantial tracks.

- `context/repo-map.md`  
  The “master context index” of files/modules and how they interact.

Other helpful docs:

- `context/product.md` (vision + pillars)
- `context/architecture.md` (invariants like determinism + tick order)
- `context/workflow.md` (lifecycle rules)
- `context/history.md` (append-only log)
- `context/active-track.md` (pointer to current track)

---

## How to work on this repo (human or AI)

Follow `AGENTS.md` for current agent rules, `context/workflow.md` for execution and `context/planning-checklist.md` for substantial track planning. Small fixes can use a PR checklist; larger changes use track documents. Verify each phase and continue through the authorized scope unless the user requested a review checkpoint.

At closeout, record substantial results in `context/history.md`, update the repo map when responsibilities change and clear the active pointer. Completed plans and old prompt files are historical context.

## Development

- Install: `npm ci`
- Dev: `npm run dev`
- Verify: `npm run verify` (tests, lint, formatting and production build)
- Seeded checks: `npm run test:soak -- --ticks=N`
- Preview: `npm run preview`

## Hosting

Target hosting is GitHub Pages (shareable link, mobile-first).

---

## License

MIT. See `LICENSE`.
