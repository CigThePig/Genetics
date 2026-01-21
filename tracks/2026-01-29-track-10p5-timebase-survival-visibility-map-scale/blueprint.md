# Track 10.5 — Timebase + Survival + Visibility + Map Scale (Blueprint)

> Planning only. No code in this document.

## A) Simulation speed / timebase is wrong

### Current behavior (symptoms)
- At “1x” speed, creatures move far too fast and sim time burns in seconds.
- Tick-based systems (movement, drains, growth, timers) are amplified by frame rate.

### Root-cause candidates
- The RAF loop drives sim ticks with `for (i < speed) sim.tick()`.
- `ticksPerSecond` is defined but unused, so tick rate is tied to display refresh.

### Most likely hypothesis
- The timebase is frame-driven because the RAF loop advances `speed` ticks per frame, ignoring a fixed timestep target.

### Proposed fix approach (high-level)
- Decouple tick scheduling from RAF using a fixed-timestep accumulator based on `ticksPerSecond * speedMultiplier`.
- Cap accumulator debt on pause/resume to avoid long catch-up bursts.

### Risks / coupling / dependencies
- Movement per tick (e.g., updateCreatureMovement) will slow down when timebase is corrected; all tick-based logic will change perceived pacing.
- Touch/visual feedback may “feel” slower if UI expectations are tied to old tick speed.

### What must be measured/confirmed before implementation
- Confirm RAF tick loop location and semantics in `src/main.js`.
- Confirm unused `ticksPerSecond` in `src/sim/config.js`.
- Establish current ticks/sec at 1x across monitors for baseline.

---

## B) Creatures die too quickly (mostly timebase, plus accelerants)

### Current behavior (symptoms)
- Multiple thirst deaths (and some hunger deaths) occur within seconds after start.

### Root-cause candidates
- Basal drains are applied per tick, so frame-driven ticks drain meters too fast.
- Drink behavior requires adjacency + threshold; seek depends on perception/memory range.
- Reproduction and life stage timing are tick-based and can accelerate costs.

### Most likely hypothesis
- The broken timebase is the primary reason for rapid meter depletion and early deaths.

### Proposed fix approach (high-level)
- Fix timebase first, then re-tune survival pacing in seconds (drains, thresholds, starting reserves, resource density, behavior).
- Treat post-fix survival tuning as a separate phase with metrics-driven adjustments.

### Risks / coupling / dependencies
- Any changes to basal drains or survival thresholds are determinism-sensitive and must preserve the tick order invariant.
- Behavior tuning may affect resource competition dynamics and reproduction.

### What must be measured/confirmed before implementation
- Confirm basal drain locations in `src/sim/creatures/index.js` and relevant config values in `src/sim/config.js`.
- Measure early death rates and median time-to-death before/after timebase fix.

---

## C) Creatures are too small (resizing exposes coordinate coupling)

### Current behavior (symptoms)
- Creatures are hard to see; target size is roughly one grid cell.

### Root-cause candidates
- Render radius is too small relative to tile size (`tileSize = 20`, `baseRadius = tileSize * 0.18`).
- Renderer centers creatures at `(x + 0.5) * tileSize` while sim positions are continuous tile coordinates.
- Tap/inspect comparisons use mismatched units between pixel-like worldPoint and tile coordinates.

### Most likely hypothesis
- The current render radius is undersized and will need to scale up near 1 tile, but that will expose alignment/input unit issues.

### Proposed fix approach (high-level)
- Increase render size toward ~1 tile.
- Fix render alignment assumptions, input/inspect coordinate conversion, and culling margin.

### Risks / coupling / dependencies
- Larger markers may occlude plants/terrain.
- Edge culling may pop creatures earlier if based on center only.

### What must be measured/confirmed before implementation
- Confirm render constants and offsets in `src/render/renderer.js`.
- Confirm input → world point conversion and creature selection in `src/input/index.js` and inspection helpers.

---

## D) Map is too small (must preserve density; clustered spawning)

### Current behavior (symptoms)
- Map size is limited to 60×40; resource generation uses absolute counts rather than density.

### Root-cause candidates
- `worldWidth` / `worldHeight` are fixed in `src/sim/config.js`.
- Generators are configured with absolute counts: bushes, grass patches, terrain blobs, water corridors.

### Most likely hypothesis
- Increasing map size without scaling counts will dilute resources and destabilize survival.

### Proposed fix approach (high-level)
- Expand map to 4× area (2× width, 2× height) and scale resource counts by area.
- Increase population to 20 per species with clustered spawning around four nearby centers.

### Risks / coupling / dependencies
- Resource density and spawn clustering may interact with terrain/water placement.
- Larger maps can impact render performance and camera panning expectations.

### What must be measured/confirmed before implementation
- Confirm size config in `src/sim/config.js`.
- Confirm generator parameters in `src/sim/plants/bushes.js`, `src/sim/plant-generator.js`, and `src/sim/terrain-generator.js`.
- Validate spawn logic location and species assignment flow.
