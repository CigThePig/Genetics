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
The authoritative canon is defined in context/architecture.md → “Canonical Ecosystem (Locked)”. Future tracks must reference that section and avoid generic species placeholders.

---

## Project pillars (non-negotiable)

1) **Evolution is emergent**  
Genes → phenotype → survival/reproduction → inheritance + mutation → population shifts.

2) **No free stats**  
Every improvement increases cost or vulnerability elsewhere.

3) **Chases matter**  
Multi-hit health, stamina-gated sprinting, alertness-gated reaction and evasion.

4) **The map matters**  
Water, cover, rough terrain, and plant distribution create hotspots, routes, and ambush patterns.

5) **Color is universal**  
All species evolve body color and mate preferences; each species perceives color differently; color affects both mating and detection.

---

## Repo structure (context-first)

This project keeps important context in `/context/` so agents (and humans) can work reliably:

- `AGENTS.md`  
  Rules and constraints for AI coding help.

- `context/track-index.md`  
  The official roadmap broken into Tracks (the “menu” for creating work).

- `context/planning-checklist.md`  
  The repeatable ritual for making tracks: Recon → Spec → Blueprint → Plan.

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

### 1) Create a track (planning only, no code)
Pick the next Track from `context/track-index.md` and generate:
- `tracks/YYYY-MM-DD-track-N-slug/spec.md`
- `tracks/YYYY-MM-DD-track-N-slug/blueprint.md` (no code)
- `tracks/YYYY-MM-DD-track-N-slug/plan.md`

Update:
- `context/active-track.md`
- `context/repo-map.md`

### 2) Execute one phase at a time
Follow the track’s `plan.md`:
- implement **one phase**
- verify it
- mark checkboxes
- update repo-map if files/roles changed
- stop and review before next phase

### 3) Close out
When the track is done:
- add a summary to `context/history.md`
- clear `context/active-track.md`

---

## Development

This repo is scaffolding-only but has a working dev loop:

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Tests: `npm test`

---

## Hosting

Target hosting is GitHub Pages (shareable link, mobile-first).

---

## License

MIT. See `LICENSE`.
