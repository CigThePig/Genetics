# 🧬 Genetics Simulation — Verified Configuration Knobs (Batches 1–16.5)

This document lists configuration values that have been **verified directly against the codebase**.

Each entry includes:
- **Label** (UI-facing)
- **Key** (config property name)
- **UI** status:
  - ✅ **UI** = currently exposed in `configMeta` (Config Panel)
  - ❌ **Hidden** = used by simulation code, but **not** exposed in `configMeta` yet
  - 🚫 **Excluded** = present in `configMeta`, but recommended **not** to expose because the game already has a top-level speed control
- **Verified behavior** (plain English)
- **Code** (primary module(s) where it is used)

> Scope covered: **Population & Spawning**, **Food Sources**, **Feeding/Drinking**, **Foraging/Perception/Memory**, and **Reproduction/Mate Seeking**.

---


## ⚠ UI typing warning (important for “Enabled” flags)

The current config panel parses all inputs as **numbers** (via `parseFloat`). Several feature flags in the sim are gated with checks like:

- `config.someFlag !== false`

That means setting a UI value to `0` does **not** disable the feature (`0 !== false` is true). Only a literal boolean `false` disables it.

This affects (verified so far):
- `creatureGrazeEnabled`
- `creatureHerdingTargetBlendEnabled`
- `creaturePackEnabled`
- `creaturePackRelocationEnabled`
- `creaturePackRelocateAvoidWater`
- `creaturePredatorRestEnabled`
- `creatureHerdingEnabled`

**Recommendation for future UI work:** render these as real booleans (toggles) and write `true/false` into config, or change the gates to accept `0/1` explicitly.


The current config panel parses all inputs as **numbers** (via `parseFloat`). Several feature flags in the sim are gated with checks like:

- `config.someFlag !== false`

That means setting a UI value to `0` does **not** disable the feature (`0 !== false` is true). Only a literal boolean `false` disables it.

This affects (verified so far):
- `creatureGrazeEnabled`
- `creatureHerdingTargetBlendEnabled`

**Recommendation for future UI work:** render these as real booleans (toggles) and write `true/false` into config, or change the gates to accept `0/1` explicitly.


## ⏱ Timing (excluded from config panel)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Simulation ticks per second | `ticksPerSecond` | 🚫 Excluded | Controls internal tick rate (separate from the top-bar speed multiplier). Recommended to keep out of the config panel since you already have 1x/2x/4x speed. | `src/sim/config.js` (sim config) |

---

## 🌍 Population & Spawning

### Starting Population

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Total Creatures | `creatureCount` | ✅ UI | Total number of creatures spawned at world start/reset. | `src/sim/creatures/spawn.js` |
| Predator Count | `creaturePredatorCount` | ✅ UI | Number of predators at start. If unset, defaults to ~10% of total. Predators are split: Triangles get ceil(half), Octagons get the rest. Herbivores are the remainder split: Squares get ceil(half), Circles get the rest. | `spawn.js` |

### Spawn Geography

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Predator Start Separation | `creatureSpawnPredatorAnchorDistance` | ✅ UI | Minimum distance predators spawn away from the herbivore base anchor at simulation start. Tries to find land at least this far away; falls back to farthest found if necessary. | `spawn.js` |
| Species Anchor Spread | `creatureSpawnSpeciesAnchorSpread` | ✅ UI | Max distance each species’ anchor may be from its group base anchor (herbivore base vs predator base). Controls squares vs circles separation and triangles vs octagons separation at start. | `spawn.js` |
| Anchor Spread Fallback | `creatureSpawnClusterSpread` | ❌ Hidden | Used as default “species anchor spread” if `creatureSpawnSpeciesAnchorSpread` is not set. | `spawn.js` |

### Spawn Clustering

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Cluster Jitter | `creatureSpawnClusterJitter` | ❌ Hidden | Random spread of individual creatures around their species anchor at spawn. Higher = looser clusters. Placement retries until a non-water tile is found (fixed retry budget). | `spawn.js` |

### Starting Stats Baselines

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Base Speed | `creatureBaseSpeed` | ✅ UI | Baseline speed used to generate or fall back to creature movement speed (traits modify this). | `src/sim/creatures/traits.js` + movement modules |
| Base Energy | `creatureBaseEnergy` | ✅ UI | Starting energy and baseline “full energy” reference for normalization (energy ratios use this). | `spawn.js`, `intent.js`, `actions.js` |
| Base Water | `creatureBaseWater` | ✅ UI | Starting water and baseline “full water” reference for normalization (water ratios use this). | `spawn.js`, `intent.js`, `actions.js` |
| Base Stamina | `creatureBaseStamina` | ❌ Hidden | Starting stamina and baseline stamina cap used in chase/metabolism decisions and newborn clamping. | `spawn.js`, `metabolism.js`, `chase.js`, `reproduction.js` |
| Base HP | `creatureBaseHp` | ❌ Hidden | Starting HP and baseline cap used when spawning creatures and clamping newborn HP. | `spawn.js`, `reproduction.js` |

### Sex System (Spawn + Reproduction)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Sex System Enabled | `creatureSexEnabled` | ❌ Hidden | If false, spawned creatures have `sex: null` and sex-based mate rules are bypassed. | `spawn.js`, `reproduction.js`, `intent.js` |
| Initial Sex Split Mode | `creatureSexInitialSplitMode` | ❌ Hidden | If `'exact'`, spawns try to start near 50/50 per species using queues; otherwise assigns alternating sex by spawn order. | `spawn.js` |

---

## 🌱 Food Sources — Grass

### Supply & Distribution (initial seeding + regrowth)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Grass capacity per tile | `grassCap` | ❌ Hidden | Max grass per cell before terrain modifiers. Caps both initial seeding and regrowth. | `src/sim/plant-generator.js`, `src/sim/plants/grass.js` |
| Initial grass amount | `grassInitialAmount` | ❌ Hidden | Base grass amount used during world initialization; feeds both baseline fill and patch seeding. | `plant-generator.js` |
| Baseline grass ratio | `grassPatchBaseRatio` | ❌ Hidden | Fraction of `grassInitialAmount` applied everywhere before patches. Higher values make the whole map grassy even without many patches. | `plant-generator.js` |
| Grass patch count | `grassPatchCount` | ❌ Hidden | Number of circular-ish patches seeded at world start. | `plant-generator.js` |
| Patch min radius | `grassPatchMinRadius` | ❌ Hidden | Minimum radius for a patch. | `plant-generator.js` |
| Patch max radius | `grassPatchMaxRadius` | ❌ Hidden | Maximum radius for a patch. | `plant-generator.js` |
| Patch falloff power | `grassPatchFalloffPower` | ❌ Hidden | Controls how sharply a patch fades from center to edge: `strength = (1 - dist/radius) ^ power`. | `plant-generator.js` |
| Grass regrowth per second | `grassRegrowthRate` | ✅ UI | Per-second regrowth scaled per tick: `rate * (1/tps)`, then reduced near full by a diminishing-returns curve. | `grass.js` |
| Regrowth diminish power | `grassRegrowthDiminishPower` | ❌ Hidden | Shapes how regrowth slows as grass approaches cap: `mult = remainingFraction ^ power`. | `grass.js` |

### Stress & Recovery (overgrazing scars)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Stress threshold | `grassStressThreshold` | ❌ Hidden | Fullness ratio below which a cell begins accumulating stress. | `grass.js` |
| Stress increase rate | `grassStressIncrease` | ❌ Hidden | Per-second stress gain when below threshold (scaled per tick). | `grass.js` |
| Stress recovery threshold | `grassStressRecoveryThreshold` | ❌ Hidden | Fullness ratio above which a cell starts recovering (stress decays). | `grass.js` |
| Stress recovery rate | `grassStressRecoveryRate` | ❌ Hidden | Per-second stress decay when recovering (scaled per tick). | `grass.js` |
| Stress visible threshold | `grassStressVisibleThreshold` | ❌ Hidden | Threshold for marking a cell “visibly stressed” for diagnostics/visuals (does not directly change growth). | `grass.js` |

---

## 🌿 Food Sources — Bushes & Berries

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Bush count | `bushCount` | ❌ Hidden | Number of bushes spawned lazily when `world.bushes` is empty. Placed on non-water tiles; unique cells enforced. | `src/sim/plants/bushes.js` |
| Bush initial health | `bushInitialHealth` | ❌ Hidden | Starting bush health (0–1). Berry regen is multiplied by health. | `bushes.js` |
| Bush recovery rate | `bushRecoveryRate` | ❌ Hidden | Per-second bush health recovery up to 1.0 (scaled per tick). | `bushes.js` |
| Berry max | `bushBerryMax` | ❌ Hidden | Max berries stored per bush. | `bushes.js` |
| Initial berries | `bushInitialBerries` | ❌ Hidden | Starting berries per bush (clamped to `[0, berryMax]`). | `bushes.js` |
| Berry regen per second | `bushBerryRegenRate` | ✅ UI | Per-second berry regen (scaled per tick) multiplied by bush health; clamped to `berryMax`. | `bushes.js` |

---

## 🥩 Food Sources — Carcasses

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Carcass base yield | `carcassBaseYield` | ✅ UI | Meat spawned when prey is killed. Juveniles yield 60% (scale 0.6). | `src/sim/plants/carcasses.js`, `src/sim/creatures/combat.js` |
| Max meat per cell | `carcassMaxMeatPerCell` | ❌ Hidden | Caps meat stacking on a single tile; additional kills on same cell add meat but clamp to this cap. | `carcasses.js` |
| Carcass decay per second | `carcassDecayRate` | ✅ UI | Per-second meat decay (scaled per tick). When meat hits 0, carcass is removed. Carcass `ageTicks` increments each update. | `carcasses.js` |

---

## 🍽 Creatures — Feeding & Drinking (demand side)

### Need Switching

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Need switch margin | `creatureNeedSwitchMargin` | ❌ Hidden | Priority hysteresis preventing rapid hunger↔thirst flip-flopping when both are close. | `src/sim/creatures/intent.js` |

### Drinking

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Drink threshold | `creatureDrinkThreshold` | ❌ Hidden | Water ratio below which creatures consider drinking/seeking water. `canDrink` is additionally gated by nearby water. | `intent.js` |
| Drink concern margin | `creatureDrinkConcernMargin` | ✅ UI | Defines a “concerned thirst” buffer above `drinkThreshold` (clamped to max 0.35). Used to gate other behaviors (e.g., suppress some actions when no water nearby). | `intent.js` |
| Drink amount | `creatureDrinkAmount` | ✅ UI | Water gained per second while drinking: `amount * (1/tps)`, clamped to baseWater. | `src/sim/creatures/actions.js` |

### Eating

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Eat threshold | `creatureEatThreshold` | ❌ Hidden | Energy ratio below which creatures consider eating/seeking food. | `intent.js` |
| Eat amount | `creatureEatAmount` | ✅ UI | Food consumed per second while eating: `amount * (1/tps)` from chosen source, then converted to energy. | `actions.js` |
| Minimum grass eat | `creatureGrassEatMin` | ❌ Hidden | Minimum grass required for a tile to count as edible/choosable; used in intent selection and perception. | `intent.js`, `actions.js`, `src/sim/creatures/perception.js` |
| Minimum berry eat | `creatureBerryEatMin` | ❌ Hidden | Minimum berries required for a tile to count as edible/choosable; used in intent selection and perception. | `intent.js`, `actions.js`, `perception.js` |

### Energy Conversion (nutrition + efficiency)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Food nutrition values | `creatureFoodProperties.*.nutrition` | ❌ Hidden | Energy gained from consumed food: `energyGain = consumed * nutrition * digestiveEfficiency`. (`handling` and `risk` exist but are not used elsewhere yet.) | `src/sim/creatures/food.js`, `actions.js` |
| Base food efficiency | `creatureFoodEfficiency` | ❌ Hidden | Baseline digestive efficiency per food type (used when trait override not present). | `food.js` |
| Species food efficiency bias | `creatureTraitMultipliers.*.foodEfficiency` | ❌ Hidden | Species-specific multipliers applied when building traits that influence digestive efficiency. | `src/sim/creatures/traits.js`, `food.js` |

---

## 🧭 Creatures — Foraging, Perception, Alertness & Memory (Batch 6)

### Long-range exploration search (food/water/mate goals)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Search radius (min) | `creatureSearchRadiusMin` | ✅ UI | Initial radius used when starting a search goal (`food`, `water`, `mate`). | `src/sim/creatures/intent.js` (`resolveSearchConfig`, `pickSearchTarget`) |
| Search radius (max) | `creatureSearchRadiusMax` | ✅ UI | Max radius search can expand to; defaults to `max(world.width, world.height)` if unset. | `intent.js` |
| Search growth multiplier | `creatureSearchRadiusGrowth` | ✅ UI | Multiplier applied when retargeting: `radius = clamp(min,max, radius * growth)` with minimum enforced `>= 1.01`. | `intent.js` |
| Search arrive distance | `creatureSearchArriveDistance` | ✅ UI | Creature keeps current search target until within this distance; prevents target thrashing. | `intent.js` |

**Verified behavior notes (no knobs):**
- Retarget heading uses a golden angle step (`2.399963...`, ~137.5°) plus jitter (`±0.35 rad`) for broad coverage.
- Targets snap to cell centers (`x+0.5, y+0.5`) and attempt to avoid water by scanning nearby offsets (out to `r<=6`).

### Local perception (food + water scanning)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Perception range (base) | `creaturePerceptionRange` | ❌ Hidden | Base local scan radius for food/water perception (traits and terrain can modify; clamped by max). Cached by cell to avoid rescans when staying in same tile. | `src/sim/creatures/perception.js` |
| Perception range (max) | `creaturePerceptionRangeMax` | ❌ Hidden | Hard ceiling for effective perception radius after modifiers. | `perception.js` |

### Alertness & reaction gating

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Base alertness | `creatureAlertnessBase` | ❌ Hidden | Baseline alertness (unless trait overrides). Higher alertness reduces reaction delay to perception changes. | `src/sim/creatures/alertness.js` |
| Reaction delay | `creatureReactionDelay` | ❌ Hidden | Base reaction delay (seconds). When perception changes, a cooldown is applied; while cooldown > 0, the creature may skip intent updates (`!canReact`). | `alertness.js`, `intent.js` |

### Memory (water + food location memory)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Memory capacity | `creatureMemoryMaxEntries` | ❌ Hidden | Max number of memory entries per creature; trimming keeps strongest/most relevant entries. | `src/sim/creatures/memory.js` |
| Memory decay rate | `creatureMemoryDecay` | ❌ Hidden | Strength decays per tick using a per-second rate scaled by `1/tps`; entries below min strength are removed. | `memory.js` |
| Forget threshold | `creatureMemoryMinStrength` | ❌ Hidden | Entries below this strength are deleted during decay. | `memory.js` |
| Merge nearby memories | `creatureMemoryMergeDistance` | ❌ Hidden | New entries within this distance of same-type entries are merged (same foodType required for food entries). | `memory.js` |
| Visit penalty | `creatureMemoryVisitPenalty` | ❌ Hidden | If a creature reaches a memory target and the resource is missing, entry strength is multiplied by this penalty and intent falls back to wander. | `intent.js` + `memory.js` (`applyMemoryPenalty`) |
| Allow water memory while in herd | `creatureWaterMemoryInHerdEnabled` | ✅ UI | Controls whether water memory entries are written while the creature is “in herd” (suppression behavior exists in memory writing logic). | `memory.js` |

---

## 💞 Creatures — Reproduction & Mate Seeking (Batches 7–8)

### Mate seeking: enable + lock-on behavior

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Mate seeking enabled | `creatureMateSeekingEnabled` | ❌ Hidden | Enables mate seeking state and selection. When off, creatures do not select mate targets and do not run mate search goal logic. | `intent.js` |
| Mate lock-on range | `creatureMateSeekRange` | ❌ Hidden | Max radius used to select a specific mate target (closest valid). If none in range, creature uses exploration search goal `mate`. | `intent.js`, `reproduction.js` (`selectMateTarget`) |
| Mate target commitment time | `creatureMateSeekCommitTime` | ❌ Hidden | Seconds to commit to the current mate target before reevaluating. Stored as commit ticks and decremented each tick. | `intent.js` |
| Mate seek overrides needs | `creatureMateSeekPriorityOverridesNeeds` | ❌ Hidden | If true, mate seeking can happen even when hungry/thirsty would normally block it. If false, requires `!canDrink && !canEat` (plus extra herbivore no-water concern gating). | `intent.js` |

### Reproduction eligibility

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Min reproduction age | `creatureReproductionMinAge` | ✅ UI | Minimum effective age required to reproduce (age ticks scaled by maturity). | `intent.js`, `reproduction.js` (`isReadyToReproduce`) |
| Min energy ratio | `creatureReproductionMinEnergyRatio` | ❌ Hidden | Requires `energy/baseEnergy >= ratio` for reproduction readiness. | `reproduction.js` |
| Min water ratio | `creatureReproductionMinWaterRatio` | ❌ Hidden | Requires `water/baseWater >= ratio` for reproduction readiness. | `reproduction.js` |
| Pregnancy enabled | `creaturePregnancyEnabled` | ❌ Hidden | Enables pregnancy mode (if sex enabled). Blocks pregnant females from reproducing again until resolved. | `reproduction.js`, `intent.js` |

### Mating completion distance

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Reproduction range | `creatureReproductionRange` | ❌ Hidden | Base distance threshold for mating completion. | `reproduction.js` |
| Reproduction range while seeking | `creatureReproductionRangeWhileSeeking` | ❌ Hidden | Larger mating completion range used when `intent.type === 'mate'`. | `reproduction.js` (`activeRange`) |

### Cooldowns and costs

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Reproduction cooldown | `creatureReproductionCooldown` | ✅ UI | Cooldown (seconds) applied to both parents after successful mating (or conception success in pregnancy mode). | `reproduction.js` |
| Failed reproduction cooldown | `creatureReproductionFailedCooldown` | ❌ Hidden | Shorter cooldown used when pregnancy mode is enabled and conception fails. | `reproduction.js` |
| Failed cost multiplier | `creatureReproductionFailedCostMultiplier` | ❌ Hidden | Multiplies energy/water/stamina costs on failed conception attempts. | `reproduction.js` |
| Reproduction energy cost | `creatureReproductionEnergyCost` | ❌ Hidden | Energy deducted from both parents per mating attempt (scaled by failed multiplier if applicable). | `reproduction.js` |
| Reproduction water cost | `creatureReproductionWaterCost` | ❌ Hidden | Water deducted from both parents per mating attempt (scaled by failed multiplier if applicable). | `reproduction.js` |
| Reproduction stamina cost | `creatureReproductionStaminaCost` | ❌ Hidden | Stamina deducted from both parents per mating attempt (scaled by failed multiplier if applicable). | `reproduction.js` |

### Conception & gestation

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Conception chance | `creatureConceptionChance` | ✅ UI | In pregnancy mode, mating triggers a conception roll (`rng < chance`). Failures use failed cooldown/cost behavior. | `reproduction.js` |
| Gestation time | `creatureGestationTime` | ✅ UI | Base gestation duration (seconds), converted to ticks using TPS. | `reproduction.js` |
| Gestation trait enabled | `creatureGestationTraitEnabled` | ❌ Hidden | If false, gestation multiplier is forced to 1 (traits cannot modify gestation length). | `reproduction.js` |
| Pregnancy metabolism multiplier | `creaturePregnancyMetabolismMultiplier` | ❌ Hidden | Adds extra basal energy/water drain during pregnancy relative to baseline drains (scaled per tick and life stage). | `reproduction.js` |
| Pregnancy move speed multiplier | `creaturePregnancyMoveSpeedMultiplier` | ❌ Hidden | Multiplies movement distance for pregnant females. | `src/sim/creatures/movement.js` |

### Miscarriage

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Miscarriage enabled | `creaturePregnancyMiscarriageEnabled` | ❌ Hidden | Enables miscarriage checks during pregnancy. | `reproduction.js` |
| Miscarriage energy ratio | `creaturePregnancyMiscarriageEnergyRatio` | ❌ Hidden | If `energyRatio < threshold`, miscarriage roll can occur. | `reproduction.js` |
| Miscarriage chance (per second) | `creaturePregnancyMiscarriageChancePerSecond` | ✅ UI | Per-second miscarriage probability converted to per-tick stable probability via TPS. | `reproduction.js` |
| Miscarriage chance (per tick, legacy) | `creaturePregnancyMiscarriageChancePerTick` | ❌ Hidden | Backward-compatible fallback when per-second is not provided. | `reproduction.js` |

### Offspring starting meters (newborn initialization)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Offspring energy | `creatureOffspringEnergy` | ❌ Hidden | Base newborn energy before newborn multiplier and clamping to baseEnergy. | `reproduction.js` |
| Offspring water | `creatureOffspringWater` | ❌ Hidden | Base newborn water before newborn multiplier and clamping to baseWater. | `reproduction.js` |
| Offspring stamina | `creatureOffspringStamina` | ❌ Hidden | Base newborn stamina before newborn multiplier and clamping to baseStamina. | `reproduction.js` |
| Offspring HP | `creatureOffspringHp` | ❌ Hidden | Base newborn HP before newborn multiplier and clamping to baseHp. | `reproduction.js` |

### Newborn meter bonuses based on gestation speed

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Fast gestation newborn multiplier | `creatureBirthChildStartingMetersFastMultiplier` | ❌ Hidden | Newborn meter multiplier when gestation multiplier is below the “fast” threshold. | `reproduction.js` (`resolveNewbornMeterMultiplier`) |
| Slow gestation newborn multiplier | `creatureBirthChildStartingMetersSlowMultiplier` | ❌ Hidden | Newborn meter multiplier when gestation multiplier is above the “slow” threshold. | `reproduction.js` |
| Fast threshold (below) | `creatureBirthChildStartingMetersFastIfMultiplierBelow` | ❌ Hidden | If `gestationMultiplier < threshold`, apply fast multiplier. | `reproduction.js` |
| Slow threshold (above) | `creatureBirthChildStartingMetersSlowIfMultiplierAbove` | ❌ Hidden | If `gestationMultiplier > threshold`, apply slow multiplier. | `reproduction.js` |

### Verified mate-finding mechanics (behavior notes, no knobs)

- If a creature can consider mating but no valid mate is within `creatureMateSeekRange`, it uses the **search goal** `mate` (same spiral/golden-angle exploration system as food/water) and sets intent to `seek` toward that exploration target.
- When a mate target exists, it is stored as `reproduction.mate.targetId` with a **commit timer**; the target is revalidated and only replaced when invalid or commit expires.
- Mate target selection chooses the **closest valid candidate** within range (uses spatial index if available for speed).

---


---

## 🧭 Creatures — Movement (Batch 9)

### Turning & wandering (including in-herd modifiers)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Turn rate (rad/s) | `creatureMaxTurnRateRadPerSecond` | ✅ UI | Maximum heading change per second. Per tick: `maxTurnPerTick = rate * (1/tps)` and heading turns toward desired heading with this clamp (no snapping). Default in sim config: 1.8. | `src/sim/creatures/movement.js` |
| Wander retarget min (s) | `creatureWanderRetargetTimeMin` | ✅ UI | Minimum commit time before choosing a new wander heading. Sampled uniformly between min/max seconds, converted to ticks via `trunc(seconds*tps)` with `>=1` safety. Min clamped to `>=0.2`. Default: 4.0s. | `movement.js` |
| Wander retarget max (s) | `creatureWanderRetargetTimeMax` | ✅ UI | Maximum commit time before choosing a new wander heading. Max clamped to `>= min`. Default: 10.0s. | `movement.js` |
| Wander turn jitter (rad) | `creatureWanderTurnJitter` | ✅ UI | On wander retarget, heading is offset by `(rng*2-1)*jitter` radians (then boundary blending may modify). Default: 0.12 rad. | `movement.js` |
| In-herd heading bias | `creatureWanderInHerdHeadingBias` | ✅ UI | While “in herd”, blends base heading toward herd heading: `base = blendAngles(current, herd, bias)` before jitter is applied. Default: 0.65. | `movement.js` |
| In-herd retarget mult | `creatureWanderInHerdRetargetMultiplier` | ✅ UI | Multiplies wander min/max retarget times while in herd; higher = fewer retargets = tighter cohesion. Clamped 0.1–3.0. Default: 1.6. | `movement.js` |
| In-herd jitter mult | `creatureWanderInHerdJitterMultiplier` | ✅ UI | Multiplies wander jitter while in herd: `effectiveJitter = jitter * mult`. **Note:** code clamps mult to **0–1**, so values >1 have no effect currently. Default: 0.35. | `movement.js` |

### Boundary avoidance (wandering-only)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Boundary avoid distance | `creatureBoundaryAvoidDistance` | ❌ Hidden | Distance from edge where avoidance begins. Within this band, avoidance strength increases with quadratic proximity. Default fallback: 8. | `movement.js` |
| Boundary avoid strength | `creatureBoundaryAvoidStrength` | ❌ Hidden | Controls how strongly boundary avoidance affects wandering (blends retarget headings, can force earlier retargets, and can steer mid-commit). Clamped 0–1. Default fallback: 0.6. | `movement.js` |

### Faster turning while fleeing

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Flee max turn multiplier | `creatureFleeMaxTurnMultiplier` | ❌ Hidden | When `herding.isThreatened` is true, max turn per tick is multiplied by this value (>=1), enabling sharp evasive turns even with calm default turning. Default: 2.5. | `movement.js` |

---

## 🧭 Creatures — Target Following Steering (Batch 9.5)

Target-following applies when intent is a moving intent (e.g., `seek`, `mate`, `hunt`, patrol-like). Creatures do not move for `eat`, `drink`, or `rest`.

### Herd-aware target blending (herbivores only)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Target blend enabled | `creatureHerdingTargetBlendEnabled` | ✅ UI | Enables blending the target direction with herd direction during targeted movement. **⚠ UI warning applies:** checked as `configValue !== false`, so numeric `0` does not disable it. | `movement.js`, `ui/config-panel.js` |
| Target blend max | `creatureHerdingTargetBlendMax` | ✅ UI | Caps how much herding can pull the desired direction away from the target direction; final `blendWeight` is clamped to `<= blendMax`. | `movement.js` |
| Isolation boost | `creatureHerdingTargetBlendIsolationBoost` | ✅ UI | If `localHerdSize < creatureHerdingRegroupMinLocalHerdSize`, increases blend weight based on how isolated the creature is (then clamps to `<= blendMax`). | `movement.js` |
| Regroup min local herd size | `creatureHerdingRegroupMinLocalHerdSize` | ✅ UI | Defines the “isolated” threshold used by isolation boost logic during target blending. | `movement.js` |

### Post-drink regroup steering boost

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Post-drink regroup seconds | `creaturePostDrinkRegroupSeconds` | ✅ UI | After drinking, sets `postDrinkRegroupTicks` and `postDrinkRegroupMaxTicks` based on seconds*tps; provides a temporary regroup window. | `src/sim/creatures/actions.js`, `movement.js` |
| Post-drink target blend boost | `creaturePostDrinkRegroupTargetBlendBoost` | ✅ UI | Temporarily increases target blend cap after drinking, scaled by remaining post-drink ratio (`ticksRemaining / maxTicks`). | `movement.js`, `actions.js` |

**Verified behavior notes (no knobs):**
- Water avoidance: if the next step lands in water, movement tries alternate headings (±45°, ±90°, ±135°) and uses the first non-water step; otherwise stays put.
- Target blending uses vector blending (not angle interpolation) to avoid wrap artifacts.

---

## 🌾 Creatures — Grazing Duty Cycle (Batch 10)

Grazing is a behavior layer that can replace `wander` with `graze` for herbivores who are comfortable and in a sufficiently large herd, producing an idle/move duty-cycle.

### Graze gating (intent selection)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Graze enabled | `creatureGrazeEnabled` | ✅ UI | Enables grazing feature. **⚠ UI warning applies:** checked as `configValue !== false`, so numeric `0` does not disable it. | `src/sim/creatures/intent.js`, `src/sim/creatures/movement.js`, `ui/config-panel.js` |
| Graze min energy ratio | `creatureGrazeMinEnergyRatio` | ✅ UI | Requires `energyRatio >= threshold` to enter/maintain grazing. Default fallback: 0.75. | `intent.js` |
| Graze min water ratio | `creatureGrazeMinWaterRatio` | ✅ UI | Requires `waterRatio >= threshold` to enter/maintain grazing. Default fallback: 0.75. | `intent.js` |
| Graze min local herd size | `creatureGrazeMinLocalHerdSize` | ✅ UI | Requires `localHerdSize >= threshold` for grazing. Default fallback: 3. | `intent.js`, `movement.js` |

### Graze duty-cycle (movement behavior)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Graze idle min (s) | `creatureGrazeIdleSecondsMin` | ✅ UI | Minimum idle duration sampled for grazing duty-cycle; seconds sampled uniformly then converted to ticks via `trunc(seconds*tps)`. Default fallback: 1.5s. | `movement.js` |
| Graze idle max (s) | `creatureGrazeIdleSecondsMax` | ✅ UI | Maximum idle duration for grazing duty-cycle. Default fallback: 4.0s. | `movement.js` |
| Graze move min (s) | `creatureGrazeMoveSecondsMin` | ✅ UI | Minimum move duration sampled for grazing duty-cycle. Default fallback: 1.0s. | `movement.js` |
| Graze move max (s) | `creatureGrazeMoveSecondsMax` | ✅ UI | Maximum move duration for grazing duty-cycle. Default fallback: 3.0s. | `movement.js` |
| Graze speed multiplier | `creatureGrazeSpeedMultiplier` | ✅ UI | While in the “move” phase of grazing, multiplies movement distance by this value (clamped 0–1). Default fallback: 0.35. | `movement.js` |

**Verified behavior notes (no knobs):**
- Grazing duty-cycle applies only when `intent.type === 'graze'` and the creature has no target (grazing never slows goal-following).
- Grazing intent activates only when a creature would otherwise wander, has no memory target, is not threatened, and is not a predator species.

---

## 🔥 Creatures — Metabolism + Sprint + Stamina Loop (Batch 11)

### Basal drains (always-on)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Basal energy drain/s | `creatureBasalEnergyDrain` | ✅ UI | Every tick: `energy -= drain * (1/tps) * lifeStage.metabolismScale` (trait override supported). | `src/sim/creatures/metabolism.js` |
| Basal water drain/s | `creatureBasalWaterDrain` | ✅ UI | Every tick: `water -= drain * (1/tps) * lifeStage.metabolismScale` (trait override supported). | `metabolism.js` |
| Basal stamina drain/s | `creatureBasalStaminaDrain` | ❌ Hidden | Every tick: `stamina -= drain * (1/tps) * lifeStage.metabolismScale` (trait override supported). | `metabolism.js` |

### Sprint decision (hysteresis thresholds)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Base stamina (max) | `creatureBaseStamina` | ❌ Hidden | Baseline “full stamina” cap used for ratios and regen clamp. | `metabolism.js`, `movement.js` |
| Sprint start threshold | `creatureSprintStartThreshold` | ❌ Hidden | If not sprinting: starts sprint when `staminaRatio >= start`. Trait override supported. | `metabolism.js` |
| Sprint stop threshold | `creatureSprintStopThreshold` | ❌ Hidden | If sprinting: continues while `staminaRatio > min(start, stop)`; safety clamp prevents inverted hysteresis. Trait override supported. | `metabolism.js` |

### Sprint effects (speed + costs)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Sprint speed multiplier | `creatureSprintSpeedMultiplier` | ❌ Hidden | When sprinting, multiplies movement distance; trait override supported. Default in sim config: 1.7. | `src/sim/creatures/movement.js` |
| Sprint stamina drain/s | `creatureSprintStaminaDrain` | ✅ UI | If sprinting, each tick: `stamina -= drain * (1/tps) * lifeStage.metabolismScale` (in addition to basal stamina drain). Trait override supported. | `metabolism.js` |

### Stamina regeneration

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Stamina regen/s | `creatureStaminaRegen` | ✅ UI | If not sprinting: `stamina += regen*(1/tps)*lifeStage.metabolismScale`, clamped to `baseStamina`. Trait override supported. | `metabolism.js` |

**Verified behavior notes (no knobs):**
- Sprint is forced off while `intent.type` is `eat` or `drink`.

---

## 🧠 Pressure → Behavior wiring (Batch 11.5)

### Hunger/thirst gates

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Eat threshold | `creatureEatThreshold` | ❌ Hidden | `canEat = (energyRatio < threshold)`; influences priority and food intents. | `src/sim/creatures/intent.js` |
| Drink threshold | `creatureDrinkThreshold` | ❌ Hidden | `canDrink = (waterRatio < threshold) && hasNearbyWater`; influences priority and water intents. | `intent.js` |
| Drink concern margin | `creatureDrinkConcernMargin` | ✅ UI | Defines “concerned thirst” band: `min(0.98, drinkThreshold + margin)`; used to suppress optional behaviors when no water nearby. | `intent.js` |
| Need switch margin | `creatureNeedSwitchMargin` | ❌ Hidden | Priority hysteresis preventing rapid hunger↔thirst flipping when close. | `intent.js` |

### Restore knobs (close the loop)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Drink amount | `creatureDrinkAmount` | ✅ UI | Restores water while drinking: `amount*(1/tps)` clamped to baseWater. | `src/sim/creatures/actions.js` |
| Eat amount | `creatureEatAmount` | ✅ UI | Consumes food at `amount*(1/tps)` and converts to energy using nutrition*efficiency. | `actions.js`, `src/sim/creatures/food.js` |

---


---

## 🐺 Predators — Rest/Hunt + Pack Patrol + Relocation (Batch 12)

### Predator rest/hunt hysteresis

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Predator rest enabled | `creaturePredatorRestEnabled` | ❌ Hidden | Enables predator “rest” mode. Resting blocks hunt initiation. **⚠ UI warning applies:** gated as `configValue !== false`. | `src/sim/creatures/intent.js` |
| Rest when energy ≥ | `creaturePredatorRestThreshold` | ✅ UI | If rest enabled, predators enter/maintain resting state when `energyRatio >= threshold`. | `intent.js` |
| Hunt when energy < | `creaturePredatorHuntThreshold` | ✅ UI | Resting predators only exit rest state when `energyRatio < threshold` (hysteresis). | `intent.js` |

**Verified behavior notes (no knobs):**
- Predator identification for rest/hunt logic is diet-based: meat must be edible and be the **top** preference.
- Resting does not create an `intent='rest'`; it only blocks initiating/continuing hunts.

### Pack behavior (wandering-only)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Pack enabled | `creaturePackEnabled` | ✅ UI | Enables pack behavior for Triangle/Octagon species. Pack formation/patrol applies only when `intent.type === 'wander'`. **⚠ UI warning applies:** gated as `configValue !== false`. | `src/sim/creatures/pack.js` |
| Patrol radius | `creaturePredatorPatrolRadius` | ✅ UI | Leader chooses patrol waypoints within this radius of pack home. Min clamp 5 tiles. | `pack.js` |
| Patrol retarget min (s) | `creaturePredatorPatrolRetargetTimeMin` | ❌ Hidden | Min waypoint commit time; seconds sampled uniformly and converted to ticks via `trunc(seconds*tps)` with `>=1` safety. Default 3s. | `pack.js` |
| Patrol retarget max (s) | `creaturePredatorPatrolRetargetTimeMax` | ❌ Hidden | Max waypoint commit time; max clamped to >= min. Default 8s. | `pack.js` |
| Pack spacing | `creaturePackSpacing` | ❌ Hidden | Formation spacing for followers around leader; min clamp 1. Default 3.5. | `pack.js` |

### Pack relocation (home migration)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Relocation enabled | `creaturePackRelocationEnabled` | ❌ Hidden | Enables pack home relocation when leader is not engaged in chase. **⚠ UI warning applies:** gated as `configValue !== false`. | `pack.js` |
| Relocate after (s) | `creaturePackRelocateAfterSeconds` | ❌ Hidden | Time of “staleness” before relocation triggers. | `pack.js` |
| Relocate min distance | `creaturePackRelocateMinDistance` | ❌ Hidden | Candidate new homes must be at least this far from current home. | `pack.js` |
| Relocate search radius | `creaturePackRelocateSearchRadius` | ❌ Hidden | Radius within which relocation candidates are sampled; sampling uses sqrt distribution for uniform area coverage. | `pack.js` |
| Relocate sample attempts | `creaturePackRelocateSampleAttempts` | ❌ Hidden | Number of random candidates evaluated when choosing a new home. | `pack.js` |
| Relocate avoid water | `creaturePackRelocateAvoidWater` | ❌ Hidden | Rejects water tiles as relocation candidates. **⚠ UI warning applies:** gated as `configValue !== false`. | `pack.js` |

### Predator targeting support

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Targeting range | `creatureTargetingRange` | ✅ UI | Max prey scan radius for predator target selection; also feeds chase loseDistance default when `creatureChaseLoseDistance` is unset. Falls back to perception range if unset. | `src/sim/creatures/targeting.js`, `src/sim/creatures/chase.js` |

---

## 🐺 Predators — Rest/Hunt/Scavenge competition + pack timing (Batch 12.5)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Hungry below energy ratio | `creatureEatThreshold` | ❌ Hidden | Predators enter hunger logic when energy ratio drops below this. This can be true while still “resting” due to rest hysteresis. | `intent.js` |

**Verified behavior notes (no knobs):**
- While resting, predators do not initiate hunts but will scavenge/forage using their diet fallback (grass/berries/meat).
- Pack formation/patrol applies only while wandering; hunger typically switches intent away from wander, so packs stop affecting them when hungry.
- `creaturePredatorRestThreshold`, `creaturePredatorHuntThreshold`, and `creatureEatThreshold` create a mid-band where predators are hungry but still resting.

---

## 🏃 Predators — Chase Mechanics (Batch 13)

### Chase thresholds and timers

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Chase start threshold | `creatureChaseStartThreshold` | ✅ UI | Minimum stamina ratio required to start a chase; also blocked by chase rest cooldown. | `src/sim/creatures/chase.js` |
| Chase stop threshold | `creatureChaseStopThreshold` | ✅ UI | If stamina ratio drops below stop, chase ends immediately with outcome `exhausted`. | `chase.js` |
| Chase lose time (s) | `creatureChaseLoseTime` | ✅ UI | Allowed time without being within loseDistance; beyond that chase ends with outcome `lost`. Converted with `trunc(seconds*tps)` (can become 0). | `chase.js` |
| Chase rest time (s) | `creatureChaseRestTime` | ✅ UI | Cooldown after any chase conclusion (`caught`, `lost`, `exhausted`). While resting, new chases cannot start. Converted with `trunc(seconds*tps)` (can become 0). | `chase.js` |

### Hidden chase distances

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Lose distance | `creatureChaseLoseDistance` | ❌ Hidden | Distance within which prey counts as “seen” (updates lastSeenTick/lastKnownPosition). Default: `targetingRange * 1.25` if unset. | `chase.js` |
| Catch distance | `creatureChaseCatchDistance` | ❌ Hidden | Distance at which chase concludes as `caught`. Default fallback 0.6. | `chase.js` |

---

## 🎯 Predators — Target Selection Scoring (Batch 13.5)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Targeting preferences | `creatureTargetingPreferences` | ❌ Hidden | Per predator-species weights for prey species. Defaults: triangles prefer circles(1)/squares(0.8); octagons prefer squares(1)/circles(0.8). | `src/sim/creatures/targeting.js` |
| Targeting distance weight | `creatureTargetingDistanceWeight` | ❌ Hidden | Score = speciesWeight − distance * weight. Default 0.12. Tie-break: closer, then lower id. | `targeting.js` |
| Targeting range | `creatureTargetingRange` | ✅ UI | Candidate prey must be within this radius. Falls back to perception range if unset. | `targeting.js` |

**Verified coupling notes (no knobs):**
- Increasing targeting range increases default chase loseDistance (if loseDistance not explicitly set).
- `creatureChaseLoseTime` and `creatureChaseRestTime` are `trunc(seconds*tps)` and can become 0 if set too small.

---

## 🎯 Predators — Targeting Rules Beyond Scoring (Batch 14)

**Verified behavior notes (no knobs):**
- Targeting does not consider prey HP, age, weakness, isolation, or line-of-sight. It uses only weights and distance scoring within range.
- Predators do not retarget mid-chase; targeting runs only when not actively chasing a valid target.

---

## 🍖 Predators — Hunting vs Scavenging vs Foraging (Batch 14.5)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Eat amount | `creatureEatAmount` | ✅ UI | Food consumed per second while eating; applies to grass/berries/meat and converts to energy via nutrition*efficiency. | `src/sim/creatures/actions.js`, `src/sim/creatures/food.js` |
| Min grass eat | `creatureGrassEatMin` | ❌ Hidden | Minimum grass required for a tile to count as edible/choosable; used in intent selection and perception. | `intent.js`, `actions.js`, `perception.js` |
| Min berry eat | `creatureBerryEatMin` | ❌ Hidden | Minimum berries required for a tile to count as edible/choosable; used in intent selection and perception. | `intent.js`, `actions.js`, `perception.js` |

**Verified behavior notes (no knobs):**
- Predators attempt to start a hunt before checking “eat what’s on the current tile” when meat is top preference and hunting is allowed.
- Predators can perceive and seek carcasses (meat) via the perception system.

---

## 🗡 Combat + Death (Batch 15)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Carcass base yield | `carcassBaseYield` | ✅ UI | Meat spawned on kill; juveniles yield 60%. | `src/sim/creatures/combat.js`, `src/sim/plants/carcasses.js` |
| Carcass max meat per cell | `carcassMaxMeatPerCell` | ❌ Hidden | Caps stacking meat on one tile; new carcasses add and clamp. | `carcasses.js` |
| Carcass decay rate | `carcassDecayRate` | ✅ UI | Per-second decay scaled per tick; carcass removed at 0 meat. | `carcasses.js` |
| Max age (s) | `creatureMaxAge` | ✅ UI | Global max age in seconds (used if per-creature maxAgeTicks not set). Death causes include age, injury(hp<=0), thirst, starvation. | `src/sim/creatures/death.js` |

**Verified behavior notes (no knobs):**
- Combat is binary: chase outcome `caught` sets prey HP to 0 and spawns a carcass the same tick.
- Carcasses decay starting the same tick they spawn (plants update after deaths).

---

## 🐑 Herding Core Forces (Batch 16)

### Core force knobs

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Herding enabled | `creatureHerdingEnabled` | ❌ Hidden | Enables herding system. **⚠ UI warning applies:** gated as `configValue !== false`. | `src/sim/creatures/herding.js` |
| Herding range | `creatureHerdingRange` | ✅ UI | Radius for collecting same-species neighbors (spatial index or linear scan). Default 10. | `herding.js` |
| Herding strength | `creatureHerdingStrength` | ✅ UI | Global scalar applied to all herding forces (clamped 0–1). Default 0.03. | `herding.js` |
| Separation distance | `creatureHerdingSeparation` | ✅ UI | Personal space radius; neighbors within this push away. Default 2.5. | `herding.js` |
| Separation multiplier | `creatureHerdingSeparationMultiplier` | ✅ UI | Scales separation contribution relative to base strength. Default 1.5. | `herding.js` |
| Alignment strength | `creatureHerdingAlignmentStrength` | ✅ UI | Scales alignment contribution; only applies if enough neighbors. Default 0.4; boosted ×1.5 when threatened. | `herding.js` |
| Min group size | `creatureHerdingMinGroupSize` | ❌ Hidden | Minimum local herd size required for alignment/cohesion logic to engage. Default 2. | `herding.js` |
| Ideal distance | `creatureHerdingIdealDistance` | ✅ UI | Inner comfort boundary; within this distance to herd center, cohesion returns null. Default 4. | `herding.js` |
| Comfort max | `creatureHerdingComfortMax` | ✅ UI | Outer comfort boundary shaping cohesion ramp. Default 4.5; tightened to 70% when threatened. | `herding.js` |
| Offset deadzone | `creatureHerdingOffsetDeadzone` | ✅ UI | If raw offset magnitude < threshold, treat as zero before smoothing. Default 0.04; halved when in “real herd”. | `herding.js` |
| Offset smoothing | `creatureHerdingOffsetSmoothing` | ✅ UI | Exponential smoothing alpha for offsets (0–1). Default 0.25. | `herding.js` |

---

## 🐑 Herding ↔ Movement Seam (Batch 16.5)

| Label | Key | UI | Verified behavior | Code |
|---|---|---:|---|---|
| Herd heading blend max | `creatureHerdingHeadingBlendMax` | ✅ UI | Caps how strongly herding offset can bend desired heading: `desired = blendAngles(desired, herdHeading, blendMax)`. Default 0.55. | `src/sim/creatures/movement.js` |
| Threat blend multiplier | `creatureHerdingHeadingBlendThreatMultiplier` | ❌ Hidden | When threatened, multiplies blendMax: `min(1, blendMax*mult)`. Default 1.25. | `movement.js` |
| Offset max magnitude | `creatureHerdingOffsetMaxMagnitude` | ❌ Hidden | Caps magnitude of herding offset before storing targetOffset (prevents massive vectors). Default 1.0. | `src/sim/creatures/herding.js` |
| Suppress herding during seek | `creatureHerdingSuppressDuringSeek` | ❌ Hidden | Reduces/bypasses herding heading blend during non-wander intents so creatures can reach targets. | `movement.js` |

**Verified interaction note (no knobs):**
- Target blending (Batch 9.5) and herding heading blend (16.5) can both apply in the same tick; target blending is applied before the herding angle blend.

---

## ✅ End of Verified Knobs (Batches 1–16.5)
