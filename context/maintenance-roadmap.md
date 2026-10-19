# Maintenance Roadmap — Code Health Fixes

Historical maintenance plan, completed and reconciled in context/phase-completion-2026-10-19.md. Current agent rules live in AGENTS.md; the original staged prompts below do not impose review gates or file-size requirements.

Created: 2025-01-22
Purpose: Fix accumulated technical debt before continuing to Track 11.

This roadmap addresses issues found during code review. Each task is designed to be small, focused, and low-risk. We'll do them one at a time.

---

## Why This Matters (Plain English)

Your project has great architecture and planning, but some files have grown too large and some code is duplicated in multiple places. This makes the code:

- Harder to understand when unrelated responsibilities share state
- More likely to have bugs (duplicate code can drift out of sync)
- Harder to find things when you need to change them

Fixing this now prevents bigger problems later.

---

## The Roadmap (In Order)

### Phase 1: Critical File Splits (Structural)

**Task 1.1: Extract life-stages to shared module**

- What: The life stage code (juvenile/adult/elder) is copy-pasted in two files
- Why: If you change one, you have to remember to change the other
- Risk: Low — this is just moving code, not changing behavior
- Files touched:
  - NEW: `src/sim/creatures/life-stages.js`
  - EDIT: `src/sim/creatures/index.js`
  - EDIT: `src/sim/creatures/reproduction.js`
- Size: ~80 lines moved

**Task 1.2: Extract config resolver helpers**

- What: There are 20+ helper functions like `resolveRatio()`, `resolveDistance()` that are duplicated
- Why: Same reason — duplicate code drifts
- Risk: Low
- Files touched:
  - NEW: `src/sim/utils/resolvers.js`
  - EDIT: `src/sim/creatures/index.js`
  - EDIT: `src/sim/creatures/reproduction.js`
- Size: ~100 lines consolidated

**Task 1.3: Split creatures/index.js into focused modules**

- What: This file combined several responsibilities. Split into logical pieces.
- Why: Clear responsibilities make behavior easier to find and test
- Risk: Medium — more files to coordinate, but each is simpler
- Files touched:
  - NEW: `src/sim/creatures/spawn.js` (~150 lines)
  - NEW: `src/sim/creatures/movement.js` (~200 lines)
  - NEW: `src/sim/creatures/metabolism.js` (~100 lines)
  - NEW: `src/sim/creatures/intent.js` (~150 lines)
  - NEW: `src/sim/creatures/death.js` (~80 lines)
  - EDIT: `src/sim/creatures/index.js` (becomes ~200 line re-export hub)
- Size: ~700 lines reorganized

---

### Phase 2: Main.js Cleanup

**Task 2.1: Extract inspector formatters**

- What: 150+ lines of formatting functions for the tap-to-inspect feature
- Why: main.js should just wire things together, not contain display logic
- Risk: Low
- Files touched:
  - NEW: `src/ui/inspector-formatters.js`
  - EDIT: `src/main.js`
- Size: ~160 lines moved

**Task 2.2: Extract metrics initialization**

- What: The default metrics object is written out twice in sim.js
- Why: If you add a new metric, you have to add it in two places
- Risk: Low
- Files touched:
  - EDIT: `src/sim/sim.js`
- Size: ~40 lines consolidated

---

### Phase 3: Naming Consistency

**Task 3.1: Audit ticks vs seconds naming**

- What: Some variables say "ticks" when they mean seconds, or vice versa
- Why: Confusing when tuning the simulation
- Risk: Low (just renaming)
- Files touched: Multiple config and creature files
- Size: Variable names only, no logic changes

**Task 3.2: Document time conventions**

- What: Add a section to architecture.md explaining the time system
- Why: Future you (and AI tools) will know the rules
- Risk: None
- Files touched:
  - EDIT: `context/architecture.md`
- Size: ~20 lines added

---

### Phase 4: Quick Wins (Optional but Nice)

**Task 4.1: Add species colors to renderer**

- What: Currently all creatures are yellow; make each species a different color
- Why: Easier to see what's happening in the simulation
- Risk: Very low (visual only)
- Files touched:
  - EDIT: `src/render/renderer.js`
- Size: ~15 lines

**Task 4.2: Extract magic numbers to config**

- What: Some numbers like `spawnRetries = 20` are buried in code
- Why: Easier to tune if they're in config.js with everything else
- Risk: Low
- Files touched:
  - EDIT: `src/sim/config.js`
  - EDIT: `src/sim/creatures/index.js` (or spawn.js after split)
- Size: ~10 lines moved

---

## How We'll Work Together

1. **I'll do the coding** — you don't need to write code
2. **One task at a time** — we finish and verify each before moving on
3. **I'll explain what I'm doing** — so you understand the changes
4. **You verify it works** — run `npm test` and `npm run dev` after each task
5. **We update repo-map.md** — as required by your workflow

---

## Estimated Effort

| Phase   | Tasks | Complexity | Time Estimate |
| ------- | ----- | ---------- | ------------- |
| Phase 1 | 3     | Medium     | 1-2 sessions  |
| Phase 2 | 2     | Low        | 1 session     |
| Phase 3 | 2     | Low        | 1 session     |
| Phase 4 | 2     | Very Low   | Optional      |

Total: 3-5 working sessions to complete everything.

---

## Success Criteria

After all tasks:

- [x] Creature subsystem responsibilities extracted from index.js
- [x] Entrypoint focused on application wiring
- [x] No duplicated life-stage code (extracted to life-stages.js)
- [x] No duplicated resolver functions (extracted to utils/resolvers.js)
- [x] Ticks/seconds naming is documented (comments added to config.js)
- [x] All tests still pass (verify with npm test)
- [x] Simulation behaves identically (verify same seed = same results)

---

## Ready to Start?

When you're ready, say "Let's start Task 1.1" and I'll begin with extracting the life-stages module. I'll show you exactly what I'm doing and why at each step.

## Completion review — 2026-10-19

Phases 1–2 were already implemented and pass the current suite. Phase 3 now has an explicit time/unit section in architecture. Phase 4 species colors already exist; spawn/anchor retry limits are now configurable with unchanged defaults. Current tests, deterministic replay and seeded soaks pass. See `context/phase-completion-2026-10-19.md` for evidence and scope. The original session instructions above are retained as history; this roadmap's implementation is complete.
