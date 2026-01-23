# Workflow (Track Index → Recon → Spec → Blueprint → Plan → Build → Verify → GC)

## What changed

We use /context/track-index.md as the authoritative roadmap for creating tracks.
Planning starts by selecting Track N from track-index and generating artifacts from that definition.

## Track definition

A Track is one ordered unit of work from track-index.md that produces a verifiable improvement.

## Required per track

- spec.md (what/why/acceptance)
- blueprint.md (technical design: files/APIs/state/risks; NO CODE)
- plan.md (phases + verification per phase + stop points)
- Update /context/repo-map.md when files/roles change

## Planning sequence (scales with repo size)

0. Select Track N from /context/track-index.md (or explicit custom track request)
1. Set/update /context/active-track.md to the intended track (required before any planning or code)
2. Create track folder (if new)
3. Recon (NO CODE): relevant files, risks, verification commands
4. Spec (derived from Track Index + Recon)
5. Blueprint (derived from Spec + Recon, NO CODE)
6. Plan (derived from Blueprint; phased checklist)

## Execution loop

- Implement ONE phase
- Verify
- Update plan checkboxes
- Update /context/repo-map.md if files were added or roles changed
- Update /context/active-track.md (Current phase + Next task)
- Stop for review

## Deviation protocol

If new info changes the approach:

- Write a Deviation Note in plan.md
- Update blueprint/plan before continuing

## GC (closeout)

- Append summary to /context/history.md (Track N + verification)
- Clear /context/active-track.md
