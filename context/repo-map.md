# Repo Map (Master Context Index)

Purpose:
- One-page index of important files and how they connect.
- Keeps planning accurate without dumping the whole repo into prompts.

Rules:
- Keep entries short (2–6 bullets).
- Update when files are added or roles change.

## Top-level
- AGENTS.md
  - Role: agent rules + constraints + workflow gates

## Context
- context/README.md
  - Role: project overview, pillars, and workflow summary
- context/track-index.md
  - Role: the ordered roadmap packaged into track definitions
  - Used by: planning to create tracks consistently
- context/planning-checklist.md
  - Role: the ritual + prompts for creating tracks and phases safely
- context/repo-map.md
  - Role: canonical index of modules/files and their interactions
- context/product.md
  - Role: pillars, goals, scope boundaries
- context/architecture.md
  - Role: invariants (determinism, tick order, entities)
- context/workflow.md
  - Role: lifecycle rules (Track Index → Recon → Spec → Blueprint → Plan → Build → Verify → GC)
- context/tech-stack.md
  - Role: tools, build, deploy
- context/code-style.md
  - Role: module boundaries + file rules (new system=new file, max 600 LOC)
- context/active-track.md
  - Role: pointer to current track folder + current phase/task
- context/history.md
  - Role: append-only track summaries + verification notes

## Tracks
- tracks/YYYY-MM-DD-track-N-<slug>/
  - Contains: spec.md, blueprint.md, plan.md
  - Rule: scope must match Track Index for Track N unless explicitly overridden

## Source (will be filled as src/ is created)
- src/main.js
  - Role: app entry; wires sim + renderer + UI
- src/sim/<system>.js
  - Role: one system per file (hard rule)
- src/render/renderer.js
  - Role: drawing only
- src/ui/*
  - Role: touch-first controls + inspector
