# Newest review and agent guidance refresh

Baseline: `0b8d1fd2c1875782e463bd99713ef89ed0641eb5`, PR #136. This report supersedes the earlier review report's claim that distant-threat assessment fully resumes normal behavior. Earlier verification remains evidence for those earlier revisions.

## Review dispositions

| Finding                                                                                                 | Resolution                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Repeated distant-threat alerts](https://github.com/CigThePig/Genetics/pull/136#discussion_r4316203759) | Valid. Behavior state remembers the assessed distance, suppressing another assessment for an unchanged or farther direct threat. A closer threat or one now inside the configured flee threshold bypasses that suppression; absence of direct threats clears it. Both herd modes have multi-tick integration coverage, including closer/returning predators and live threshold changes. Alert lock and close-danger escalation remain intact. |
| [Stylesheet line cap](https://github.com/CigThePig/Genetics/pull/136#discussion_r4316203771)            | The user explicitly requested removal of this rule. Removed caps and size-triggered splits from current guidance and duplicate references. Module organization now depends on responsibility, state ownership, coupling and testability. No stylesheet split is required solely to satisfy the retired cap.                                                                                                                                   |
| [Anchor food radius minimum](https://github.com/CigThePig/Genetics/pull/136#discussion_r4316203784)     | Valid. Metadata minimum is one tile, matching the runtime resolver. Shared preset validation rejects zero on import; accepted values round-trip without silently changing meaning.                                                                                                                                                                                                                                                            |

## Agent rule audit

The repository has one `AGENTS.md` and no nested agent files or separate Copilot/Cursor rule files. Reviewed all its rule groups and their current companion guidance in workflow, planning checklist, code style, track index, repo map, architecture, product, context overview and tech stack. Also reviewed the old UI prompts and maintenance roadmap. Completed track documents and dated evidence retain historical context; current guidance explicitly gives them no standing procedural authority.

| Rule group                                         | Decision                                                                                                                                                                                                                                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bootstrap and required reading                     | Use existing `npm ci`/verify/lint/format/soak scripts; remove the obsolete “planned after Track 0” tooling note. Read relevant source/design/tests rather than every document in a fixed order for every task.                                                                |
| Track order, active pointer and planning artifacts | Preserve roadmap scope and accurate active status for substantial work. Explicit requests override default order. Small fixes use a concise PR checklist; substantial work uses track artifacts. Planning-only requests stay planning-only.                                   |
| Phase execution, deviations and plan lint          | Verify and record phases, then continue through authorized scope. Remove automatic per-phase conversation stops, mandatory stop-point boilerplate and rigid no-code blueprint requirements. Preserve explicit requested review gates and document material design deviations. |
| Repo map and closeout                              | Preserve responsibility/index updates, tooling updates, substantial history and active-pointer cleanup; avoid documenting every trivial edit as a new track.                                                                                                                  |
| File organization and entrypoint                   | Remove hard/soft/entrypoint size limits and “new system always means new file.” Keep cohesive boundaries, explicit state ownership and focused entrypoint wiring.                                                                                                             |
| Simulation, traits and observability               | Retain seeded determinism, central passed RNG, tick order, render isolation, trait-first reads, units and useful metrics/inspection. Clarify current config module locations, implemented genetics, runtime food-web differences and synchronous worker boundaries.           |
| Mobile and performance                             | Retain touch/narrow-screen support. Require measured motivation and deterministic boundaries before a worker migration.                                                                                                                                                       |
| Testing and risk gates                             | Keep meaningful formula/behavior regressions and current standard checks. Remove blanket approval requirements for routine in-scope deletion/refactoring. Preserve user work and authorization boundaries for destructive operations, merges and deployments.                 |

The rule review changes process and documentation, not ecosystem design. Threat-assessment changes intentionally affect seeded trajectories.

## Verification checklist

- [x] Reproduce both runtime/config findings with failing regressions before repairs.
- [x] Pass focused alert integration, import validation and runtime-radius parity tests.
- [x] Run standard verification and seeded smoke checks on the final code.
- [x] Exercise the affected config control and JSON imports in Chromium.
- [x] Reconcile current guidance references, history and active status.

## Results for this revision

- `npm run verify` passes: 120 tests in 12 files, ESLint, repository formatting and production build. Four new regression cases were observed failing before the repairs and passing afterward.
- Chromium at 1280×800 passes the affected slider/number minimum check, valid radius export/import, zero-import rejection and playback/pause/step, with no page errors.
- Current guidance passes stale-rule and literal file-reference checks. Historical prompt documents are explicitly labeled; completed plans are not rewritten as if their original execution followed today's rules.
- `npm run test:soak -- --ticks=3600` passes seeds 1, 42 and 1337 with bounds, finite meters, live IDs and population accounting checked every tick. All retain 80 creatures, with zero deaths, births or hunts in this initial simulated minute. This is smoke evidence; the alert regression scenarios test escalation directly and these short runs do not establish long-run ecological balance.

| Seed | State hash (SHA-256)                                               |
| ---- | ------------------------------------------------------------------ |
| 1    | `8bac2a6e1a5b16119fb3837488e25ce78d56f441bf43ca75fd50b648dcc13dc5` |
| 42   | `908fa89e91968e6e18c45a33d48a1fc2bfbd5c94089638e5c9c50ccfdb9dcb84` |
| 1337 | `7e48a9ce37a7830eef1a3cfcf54cc213c16310063f5c52abd9a9c299d4c3bb43` |

Local checks are distinct from hosted CI. No merge or deployment is performed.
