# Creature presentation architecture

## Source and reuse

Pinned upstream: [idlerunner00/procedural-pixel-creatures](https://github.com/idlerunner00/procedural-pixel-creatures)
**a2207c4bd6f1be51d426684cf58f11668def7579**, MIT, copyright 2026 idlerunner00.
`tools/creature-baker/vendor/Core` contains 60 unchanged C# source files; the
61-file hash manifest includes LICENSE. The browser distribution includes the full
license at `licenses/procedural-pixel-creatures.txt`. `npm run verify` checks both
provenance and distributed license equality. No extra upstream package dependencies
are declared by the engine-independent core.

This is a hybrid compilation of actual upstream anatomy and animation, plus a
targeted browser rasterizer. It is not a browser rewrite of the family generators.

| Component                                                  | Reuse / adaptation                                                                                                                                                                             |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QuadrupedFamily, ReptileFamily                             | Original anatomy builders; Genetics supplies constrained species parameters and two continuous speed endpoints.                                                                                |
| AnatomyBuilder, Skeleton, Shapes                           | Original bone hierarchy, attached ellipsoids/cones/plates, head, limbs, ears, horns and tail construction.                                                                                     |
| CreatureFactory / Genome / PCG streams                     | Original deterministic compile-time model construction. No upstream inheritance or ecology runs in the game.                                                                                   |
| CreatureMotor / RigDriver / LeggedLocomotion / SpringChain | Original fixed-step motor compiles idle, walk, run, action, rest and hit poses; gait timing is locked to each sampled cycle.                                                                   |
| CreatureRenderer / PixelFrame / PNG encoder                | Unmodified reference rendering produces eight reproducible PNGs beside the compiler.                                                                                                           |
| Browser raster.js                                          | Port of PixelCamera projection, ellipsoid inverse quadratic, exact rounded-cone ray intersection and plate barycentrics, depth/normal shading. Modified palette and restrained coat treatment. |
| Browser appearance.js / view.js                            | Genetics-specific genotype adapter, state/odometer playback, morphing, culling integration and bounded caches.                                                                                 |

The full original Core is retained as reviewable compiler source, including unused
families. It is **not bundled as a .NET runtime**. No Godot runtime/workshop, terrain
engine, gear content, upstream breeding system, asynchronous Godot queue, or
Plantfolk extension is integrated. The browser omits the original per-group SDF
fillet field, full material library, microtexture/contact-shadow passes, expression
moods and dynamic IK/spring solving. It samples the original solved motion instead.
Close same-group surfaces receive a limited normal blend, not a claim of exact
upstream soft-union parity. Original reference PNGs intentionally use the original
camera/palette and differ from Genetics output.

## Integration decision

Three approaches were examined:

- **Full .NET WebAssembly:** Core has no Godot dependencies, so this is plausible.
  SDK 8.0.415 downloaded and runs the compiler/Core, but CLI/workload and MSBuild
  startup fail here on unavailable process metadata (`Process.StartTime` /
  `ProcessName`). No WASM download size, interoperability, mobile throughput or
  initialization benchmark was obtained. This executor failure does not prove WASM
  is infeasible on supported hosts. Carrying a runtime plus per-actor CPU raster
  work is an unverified cost for this Canvas application.
- **Whole JavaScript port:** approximately 18,833 original C# lines across Core,
  with deterministic math, anatomy, motion and material dependencies. A complete
  manual port would duplicate a large proven implementation and create ongoing
  synchronization risk. The analytical raster subset was prototyped and measured;
  a full port was not represented as completed.
- **Selected hybrid:** compile the original builders and fixed-step animation to
  posed parametric primitives. At runtime interpolate anatomy continuously from
  inherited input and rasterize/cache in ordinary Canvas. The checked-in geometry
  avoids runtime/toolchain initialization, preserves upstream anatomy/motion code,
  and works on static GitHub Pages without headers, WASM or new npm dependencies.
  The measured browser cost and limits are in [evidence.md](evidence.md).

Geometry is baked, **individual creatures are not baked presets**. There are two
anatomical endpoints per species, not a finite list of randomly assigned animals.
Matching primitive topology is asserted. Every rendered individual interpolates
those endpoints using its actual speed locus and applies other continuous
inherited appearance parameters. Each endpoint has all motor clips. The generated
version-1 ES module is approximately 1.4 MB source; Vite compresses the shared art
chunk to approximately 263 kB gzip. No original high-precision cross-platform
math promise is made for the JavaScript raster. Repeatability is tested within
the same runtime; authoritative simulation determinism is a separate invariant.

## Four species and shared art direction

Ecological identifiers, labels and census symbols remain unchanged.

| Existing species / actual diet | Artwork     | Distinguishing anatomy                                                         |
| ------------------------------ | ----------- | ------------------------------------------------------------------------------ |
| Square / berries, grass        | Brambleback | Compact rodent-like forager, round ears, blunt head, stout body and tiny tail. |
| Circle / grass, berries        | Meadowhorn  | Taller hoofed grazer, long ears, raised shoulders and short horns.             |
| Triangle / meat first          | Needlefox   | Lean digitigrade hunter, pointed ears, long muzzle and fuller tail.            |
| Octagon / meat first           | Reedstalker | Low reptilian hunter, splayed limbs, broad head and long tapered tail.         |

These names describe art, not new biological classes, defenses or species rules.
All use the same logical-pixel treatment, selective outer edge and restrained
surface detail. A 62-degree orthographic camera retains useful head/leg volume
while mapping ground motion to the flat Genetics world. Heading is negated into
upstream yaw and quantized to sixteen directions. The camera never changes world
positions. Bounds derive from every baked pose and anatomical endpoint, rather
than a guessed body-length crop; long tails must fit in every direction.

Visual review rejected the initial flat shading, overly similar proportions and
tiny overview footprint. Refinements changed the original generator parameters,
coat sampling, shading, framing and fallback initialization. Evidence contains
uncurated seeded populations, families, extremes, silhouettes and actual app views.

## Genotype mapping and colour ecology

| Authoritative value      | Presentation only                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Species                  | Fixed family anatomy and constrained component choices.                            |
| Speed locus              | Continuous interpolation of original torso/leg proportion targets.                 |
| Perception locus         | Small eye-stamp size variation. No additional sight advantage.                     |
| Basal energy drain locus | Restrained 0.92–1.08 lateral breadth. No new mass/cost rule.                       |
| Longevity locus          | Smooth phase of a body-anchored coat pattern. No longevity-dependent protection.   |
| Body phenotype RGB       | Exact centre colour of the shading ramp; inherited HSL fallback for legacy actors. |
| Actual life stage        | Juvenile 0.72, adult 1, elder 0.96 presentation scale.                             |

These are a deliberately small set of visual correlations, not new causal
biological mechanics. There are no new cosmetic loci, independent cosmetic
inheritance calls or new RNG draws. Existing segregation/noise/mutation drives
both functional and visible variation. An individual ID does not reroll anatomy
or markings. A colour mutation cannot reroll its body plan. Genetics' actual
paternal snapshot, births and mutation ownership remain untouched.

All ordinary body, appendage and horn colours derive from the phenotype RGB.
Shading/markings use small signed RGB offsets (at most 0.12 before quantization);
there are no independent hues, white patches or foreign material palettes.
Tiny eyes are a dark neutral detail. Detection/mate choice still use the existing
body sample. This is a bounded presentation approximation, not pixel-perfect
whole-sprite camouflage or a new visual-perception model. The old shapes also had
non-phenotypic shadows/outlines/highlights. Exact simulation source equality and
palette constraints prevent silent changes to selection mechanics; do not claim
that rasterized mean RGB is identical to the phenotype sample.

## Animation and time

Genetics alone supplies position, `motion.heading`, actual velocity, sprint/flight/
chase state, intent, life stage, elapsed simulation seconds and life-story odometer.
A stationary actor never receives a running pose merely because it has a hunt
intent. Moving animals use the appropriate upstream walk/run clip. Walk/run phase
comes from **actual accumulated displacement**, calibrated against the original
clip's exported root speed and cycle duration. Stationary idle/action/rest phase
uses simulation seconds. Missing legacy odometers use simulation-time velocity;
there is no wall-clock phase. Pause freezes these inputs and 2× follows them.
State changes blend geometry over 0.18 simulated seconds in four steps.

Eating and drinking use a restrained upstream action clip; resting uses the
settled original rest pose. Hunt and flight use actual locomotion rather than
invented event animations. Hit is available in the lab, but the current production
combat owner records immediate lethal capture, not a reusable nonlethal hit event.
No injury/attack event or social/reproductive animation is fabricated. Death
removes the live animal immediately; existing carcass and memorial owners retain
their behavior. Memorials do not contain genomes, so they do not invent a portrait.

Baked eight-frame locomotion and sixteen-way facing are approximations: sharp
turns/contact changes and heavy deferred workloads can still show some foot drift.
This is not the original live spring/IK engine running in the browser. Idle/rest
have twelve samples. Distant LOD freezes pose and uses eight headings.

## Ownership, lifecycle and memory

`createCreatureView` belongs to one renderer, and a separate small instance serves
the inspector. A WeakMap holds actor presentation descriptions; no authoritative
creature is mutated. A content key includes version, species, all mapped inherited
values, exact phenotype RGB, resolution, pose, direction and transition. No
quantization merges distinct genotypes in the appearance cache.

Frame canvases use an LRU with a 12 MiB RGBA budget (inspector 512 KiB). Old canvas
storage is explicitly released on eviction/reset/destroy. Bookkeeping, parsed
immutable geometry, temporary raster arrays, browser canvas overhead and GC are
additional: the RGBA budget is not a whole-process memory bound.

A 3 ms **soft** generation budget schedules subsequent poses. First visible
representations are synchronous, including paused births/pans, so animals normally
appear as organisms immediately. This cold path can exceed the frame budget and
is measured separately. Deferred descriptors use a bounded 512-entry FIFO keyed
by presentation actors, without simulation references. Newer requests replace
pending poses, and FIFO service avoids starving the last actors in a crowded view.
The previous available pose is used while a new pose waits. Deferred work can
therefore lower animation freshness; no hard 60-FPS or latency bound is promised.

Overview/normal/close raster resolutions are 24/48/80 pixels. Narrow screens cap world animals at 48 pixels. Visible-cohort admission reserves room for two current cohorts, dropping 80→48→24 as the working set grows; this prevents cache self-eviction. Inspector portraits remain independent. Viewport culling runs
before model/frame creation, with margins for the enlarged artwork. World identity
changes clear all caches and pending work, including empty worlds. Births initialize
lazily, deaths leave only bounded reusable LRU frames, and separate simulations do
not share presentation caches. The renderer exposes diagnostics and `destroy()`.
Generation failures log the first three diagnostics and fall back to a species
marker for that animal; failure counts remain available. The old marker is not the
normal initial or distant representation.

## UI, persistence and maintenance

Selection/hit testing and Follow remain at authoritative ground positions. Artwork
extends beyond that point, so click the body centre. The inspector adds a reusable
portrait without replacing focused family/section controls. Portraits use elapsed
simulation time, clear on resets and avoid inventing art for genome-less memorials.
The separate responsive `creature-lab.html` has 44px controls and is a second Vite
entry, included in Pages builds. No major unrelated UI redesign is included.

The app persists settings, not complete live-world saves. No migration is needed:
appearance is derived on demand. `APPEARANCE_VERSION = 1` versions the mapping and
cache representation; baked source has its own version and pinned upstream SHA.
An old actor with missing loci deterministically gets safe defaults; its genome
is never rewritten. There is no claim of compatibility with nonexistent live saves.

To update upstream, compare the pinned commit first, import unchanged Core files,
update license/hash manifest, then modify **Program.cs**, not vendored builders.
Rebake, inspect the original reference PNGs and Genetics sheets, and update mapping
version when output changes. Recheck matching topology and all-pose bounds. Keep
future ecology changes in a separate reviewed scope.

## Reproduction

```sh
npm ci
npm run verify
npm run dev
# Open /Genetics/creature-lab.html or the main application.

dotnet run --project tools/creature-baker -- src/render/creatures/anatomy.js
# Equivalent helper; normal hosts use the SDK:
node scripts/bake-creature-art.mjs
# This executor's process-metadata workaround, with a local .NET 8 SDK:
DOTNET_ROOT=/path/to/dotnet node scripts/bake-creature-art.mjs --direct

PLAYWRIGHT_MODULE=/absolute/path/to/playwright-core/index.mjs \
BROWSER_EXECUTABLE=/path/to/chromium \
node scripts/verify-creature-art-browser.mjs
```

The browser runner instruments the app **only in its HTTP response**, not production
source. Measurements include rendered cohorts with all actual genome records,
stationary and synthetic moving presentation snapshots; these are renderer
workloads, not claims about 500-actor ecological TPS. Actual live-loop observations
are separate. Use `--baseline` from a clean pinned-main worktree with the same
external browser tools and `ART_EVIDENCE_DIR` to write paired output.

Other references were read for concepts: [Vex](https://github.com/uilianks/vex),
[Pxl](https://github.com/crsolver/claude-pxl) and
[Doodle-Anim](https://github.com/feitangyuan/doodle-anim). Reusable parts, explicit
palette ramps, seekable time and uncurated inspection reinforced this design.
None of their code, styles or dependencies was imported.
