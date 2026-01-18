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
0) Select Track N from /context/track-index.md (or explicit custom track request)
1) Create track folder and set /context/active_track.md
2) Recon (NO CODE): relevant files, risks, verification commands
3) Spec (derived from Track Index + Recon)
4) Blueprint (derived from Spec + Recon, NO CODE)
5) Plan (derived from Blueprint; phased checklist)

## Execution loop
- Implement ONE phase
- Verify
- Update plan checkboxes
- Update /context/repo-map.md if files were added or roles changed
- Stop for review

## Deviation protocol
If new info changes the approach:
- Write a Deviation Note in plan.md
- Update blueprint/plan before continuing

## GC (closeout)
- Append summary to /context/history.md (Track N + verification)
- Clear /context/active_track.md