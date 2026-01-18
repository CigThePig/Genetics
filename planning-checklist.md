# Planning Checklist (Ritual for creating Tracks from Track Index)

Purpose:
- Generate spec/blueprint/plan reliably as the repo grows.
- Prevent drift by always pulling the same canonical inputs.
- Make "Create Track N" deterministic and repeatable.

Canonical Inputs (always read):
1) /AGENTS.md
2) /context/track-index.md
3) /context/repo-map.md
4) /context/product.md
5) /context/architecture.md
6) /context/history.md (optional but recommended once it has entries)

Golden rule:
- Do NOT plan from memory.
- Plans are derived from: Track Index + current repo state + Recon Summary.

---

## Step 0) Choose scope
Default:
- Pick Track N from /context/track-index.md.

Custom:
- If user explicitly requests a custom track, write it in the same format as Track Index items
  (Goal, Includes, Acceptance, Risks, Verification).

---

## Step A) CREATE TRACK N (skeleton + artifacts)
When asked "Create Track N":

1) Create folder: /tracks/YYYY-MM-DD-track-N-short-slug/
2) Generate:
   - spec.md
   - blueprint.md (NO CODE)
   - plan.md
3) Update:
   - /context/active_track.md (point to the new folder)
   - /context/repo-map.md (add the new track folder entry)

### Codex prompt: CREATE TRACK N (NO CODE)
Paste to Codex:

Read AGENTS.md and:
- /context/track-index.md
- /context/repo-map.md
- /context/product.md
- /context/architecture.md
- /context/workflow.md
- /context/history.md

Task:
Create Track <N> exactly as defined in track-index.md.

Rules:
- Do not write code.
- Create the track folder /tracks/YYYY-MM-DD-track-<N>-<slug>/.
- Generate spec.md, blueprint.md (no code), plan.md.
- Plan must include phases mapped to the "Includes" steps for Track N.
- Each phase must include: tasks, files touched, verification, stop point.
- Include a "Recon Summary" section at the top of plan.md (can be empty initially).
- Update /context/active_track.md to point to this track.
- Update /context/repo-map.md with the new track folder entry.

---

## Step B) Recon (refresh relevant context WITHOUT bloat)
Goal:
- Identify what’s relevant before blueprint/implementation.

Output:
- Files likely to change (why)
- Key modules/functions involved (or "not found yet")
- Invariants to respect (tick order, determinism, file rules)
- Cross-module side effects (who depends on this? what could break?)
- Tick order impact (does this require changing or depending on tick order?)
- Observability impact (does this require a new metric or inspector field?)
- File rules impact (new system => new file; any file at risk of exceeding 600 LOC?)
- Risks/regressions
- Verification commands/checks

Store Recon:
- Paste into tracks/<id>/plan.md under "Recon Summary".

### Codex prompt: RECON ONLY (NO CODE)
Read AGENTS.md, then read:
- /context/repo-map.md
- /context/product.md
- /context/architecture.md
- /context/history.md
- the active track files

My change request is the active track scope.
Do NOT modify code.

Produce a Recon Summary with:
- files likely to change (why)
- key modules/functions involved
- invariants to respect
- cross-module side effects
- tick order impact
- observability impact (new metric/inspector field required?)
- file rules impact (new system/new file, 600 LOC risk)
- risks/regressions
- verification commands/checks

---

## Step C) Spec / Blueprint / Plan refinement
If the initial artifacts need tightening:
- Update spec.md first
- Then blueprint.md
- Then plan.md

Blueprint must contain NO CODE.
Plan must map directly to included steps from track-index.

---

## Step D) Execute (Builder mode)
### Codex prompt: BUILD ONE PHASE ONLY
Read AGENTS.md and the active track.
Implement Phase <N> only.
- Follow plan.md precisely.
- Run verification for the phase.
- Update plan checkboxes.
- Update /context/repo-map.md if any files were added or roles changed.
Stop after Phase <N> is verified.

---

## Step E) Closeout (GC)
When track complete:
- Append summary to /context/history.md (include Track N).
- Clear /context/active_track.md.
- Ensure /context/repo-map.md matches reality.