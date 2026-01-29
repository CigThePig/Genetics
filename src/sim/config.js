/**
 * Simulation Configuration
 *
 * TIME VALUE CONVENTIONS (STANDARDIZED):
 * - ticksPerSecond: Number of simulation ticks per real second (default: 60)
 * - All time-based config values are in SECONDS
 * - Resolver functions convert seconds → ticks internally using ticksPerSecond
 * - Drain/regen rates are per-second rates, scaled by tickScale (1/ticksPerSecond)
 *
 * CATEGORIES:
 * - World: terrain, tiles, world size
 * - Plants: grass regrowth, bushes, berries
 * - Creatures: population, movement, needs, reproduction
 * - Genetics: genome defaults, mutation rates
 */
export const simConfig = {
  // === SIMULATION ===
  seed: 1,
  hotspotSeed: 1337,
  ticksPerSecond: 60,

  // === WORLD ===
  tileSize: 20,
  worldWidth: 120,
  worldHeight: 160,
  defaultTerrain: 'plains',
  waterTerrain: 'water',
  shoreTerrain: 'shore',
  terrainTypes: ['plains', 'forest', 'rock', 'sand', 'shore', 'water'],

  // Enhanced terrain generation (noise-based)
  terrainNoiseScale: 0.035, // Controls terrain feature size (smaller = larger features)
  terrainWaterLevel: -0.28, // Height threshold for water (-1 to 1)
  terrainShoreLevel: -0.18, // Height threshold for shore
  terrainWaterCoverageMultiplier: 0.75, // 0..1 scales total water coverage
  terrainRockThreshold: 0.72, // Roughness threshold for rock formation
  terrainForestMoisture: 0.58, // Moisture threshold for forest biome
  terrainSandMoisture: 0.32, // Moisture threshold below which sand appears

  // Legacy terrain settings (for fallback)
  terrainBlobCount: 72,
  terrainBlobMinRadius: 2,
  terrainBlobMaxRadius: 6,
  waterCorridorCount: 8,
  waterCorridorMinLength: 10,
  waterCorridorMaxLength: 22,
  waterCorridorWidth: 2,
  waterCorridorTurnChance: 0.35,

  // === PLANTS: GRASS ===
  grassCap: 1,
  grassRegrowthRate: 0.01, // per second (was 0.02 - slightly faster recovery)
  grassRegrowthDiminishPower: 1.5,
  grassInitialAmount: 0.12, // (was 0.2 - more starting food)
  grassPatchCount: 112,
  grassPatchMinRadius: 2,
  grassPatchMaxRadius: 7,
  grassPatchFalloffPower: 1.6,
  grassPatchBaseRatio: 0.1,
  grassStressThreshold: 0.15,
  grassStressIncrease: 0.02,
  grassStressRecoveryRate: 0.018, // (was 0.015 - faster stress recovery)
  grassStressRecoveryThreshold: 0.35,
  grassStressVisibleThreshold: 0.1,
  grassCoverageThreshold: 0.1,
  grassHotspotThreshold: 0.75,

  // === PLANTS: BUSHES ===
  bushCount: 96,
  bushInitialHealth: 0.85,
  bushBerryMax: 12,
  bushInitialBerries: 4, // (was 6 - more starting berries)
  bushRecoveryRate: 0.006, // (was 0.01 - slightly faster bush recovery)
  bushBerryRegenRate: 0.1, // (was 0.25 - faster berry regen)

  // === PLANTS: CARCASSES ===
  carcassBaseYield: 3.5, // (was 3.0 - more meat per kill keeps predators full longer)
  carcassMaxMeatPerCell: 6,
  carcassDecayRate: 0.012, // (was 0.015 - slower decay, carcass lasts longer)

  // === CREATURES: SPAWNING ===
  creatureCount: 80,
  creaturePredatorCount: 8, // (was 5 - more predators for better ecosystem pressure)
  creatureSpawnClusterSpread: 12,
  creatureSpawnSpeciesAnchorSpread: 18,
  creatureSpawnPredatorAnchorDistance: 40,
  creatureSpawnClusterJitter: 4,

  // === CREATURES: MOVEMENT STYLE ===
  // Controls how creatures turn and commit to directions
  creatureMaxTurnRateRadPerSecond: 1.8, // slower turns for calmer movement
  creatureWanderRetargetTimeMin: 4.0, // seconds before picking new wander heading
  creatureWanderRetargetTimeMax: 10.0, // seconds max before retarget
  creatureWanderTurnJitter: 0.12, // radians - noise only on retarget, not every tick
  creatureWanderInHerdRetargetMultiplier: 1.6,
  creatureWanderInHerdJitterMultiplier: 0.35,
  creatureWanderInHerdHeadingBias: 0.65,
  creatureFleeMaxTurnMultiplier: 2.5, // faster turning when threatened
  creatureBoundaryAvoidDistance: 8,
  creatureBoundaryAvoidStrength: 0.6,
  creatureGrazeEnabled: true,
  creatureGrazeSpeedMultiplier: 0.35,
  creatureGrazeIdleSecondsMin: 1.5,
  creatureGrazeIdleSecondsMax: 4.0,
  creatureGrazeMoveSecondsMin: 1.0,
  creatureGrazeMoveSecondsMax: 3.0,
  creatureGrazeMinEnergyRatio: 0.75,
  creatureGrazeMinWaterRatio: 0.75,
  creatureGrazeMinLocalHerdSize: 3,

  // === CREATURES: MOVEMENT PHYSICS ===
  // Velocity-based movement gives creatures mass and inertia
  creatureAcceleration: 0.15, // how fast creatures reach top speed (0-1)
  creatureDeceleration: 0.12, // how fast creatures slow down when stopping (0-1)
  creatureFrictionDrag: 0.02, // passive slowdown each tick (0-0.2)

  // Turn momentum (rotational inertia)
  creatureAngularAcceleration: 0.08, // how fast turn rate changes (0-1)
  creatureSpeedTurnPenalty: 0.6, // higher speed = slower max turn (0-1)

  // === CREATURES: INTENT SPEED MULTIPLIERS ===
  // Different intents produce visibly different movement speeds
  creatureIntentSpeedWander: 0.4, // slow amble
  creatureIntentSpeedGraze: 0.25, // very slow, meandering
  creatureIntentSpeedSeek: 0.7, // purposeful but not rushed
  creatureIntentSpeedMate: 0.6, // moderate
  creatureIntentSpeedHunt: 0.85, // stalking phase
  creatureIntentSpeedHuntChase: 1.0, // active chase

  // Long-range need search (when no target is perceived or remembered)
  creatureSearchRadiusMin: 12, // tiles
  creatureSearchRadiusMax: 90, // tiles
  creatureSearchRadiusGrowth: 1.35, // multiplier per failed attempt
  creatureSearchArriveDistance: 1.25, // tiles (distance to consider target reached)

  // === CREATURES: HERDING ===
  // Only herbivores (squares, circles) herd - predators hunt independently
  creatureHerdingEnabled: true,
  creatureHerdingSimpleMode: true, // true = use simple 3-rule boid system, false = complex system

  // === CREATURES: SIMPLE HERDING (3-rule boid system) ===
  creatureSimpleHerdingSeparationRadius: 2.5, // tiles - push away from neighbors
  creatureSimpleHerdingAlignmentRadius: 7, // tiles - match neighbor headings
  creatureSimpleHerdingCohesionRadius: 11, // tiles - pull toward herd center
  creatureSimpleHerdingSeparationStrength: 1.2,
  creatureSimpleHerdingAlignmentStrength: 0.8,
  creatureSimpleHerdingCohesionStrength: 0.5,
  creatureSimpleHerdingThreatRange: 12, // tiles - predator detection range
  creatureSimpleHerdingThreatStrength: 1.5,
  creatureSimpleHerdingSmoothing: 0.3, // offset smoothing (prevents jitter)
  creatureHerdingHeadingBlend: 0.5, // how much herd heading influences creature heading

  // Threat propagation - alerts spread through herd
  creatureThreatPropagationRadius: 9, // tiles - how far threat alerts spread
  creatureThreatPropagationHops: 2, // max propagation depth
  creatureThreatDecaySeconds: 2.0, // how long creatures stay threatened after losing sight

  // Herd movement waves - creates emergent leadership and wave effects
  creatureHerdMovementContagionRadius: 6, // tiles - how far movement spreads
  creatureHerdMovementContagionDelay: 0.3, // seconds before contagion takes effect
  creatureHerdMovementContagionChance: 0.4, // base chance to start moving when neighbors move
  creatureHerdLeadershipDecay: 0.02, // how fast leadership score decays

  // === CREATURES: COMPLEX HERDING (legacy) ===
  creatureHerdingRange: 14, // (was 12 - wider herding awareness)
  creatureHerdingThreatRange: 10, // (was 8 - better predator detection)
  creatureHerdingStrength: 0.18, // calmer cohesion
  creatureHerdingThreatStrength: 0.25, // (was 0.2 - stronger flee response)
  creatureHerdingMinGroupSize: 2,
  creatureHerdingSeparation: 2.6,
  creatureHerdingIdealDistance: 5.0,
  creatureHerdingAlignmentStrength: 0.7, // relative to base strength
  creatureHerdingComfortMin: 2.0, // inside comfort band, minimal steering
  creatureHerdingComfortMax: 6.5, // outside this, cohesion kicks in
  creatureHerdingSeparationMultiplier: 0.95,
  creatureHerdingOffsetDeadzone: 0.02,
  creatureHerdingOffsetSmoothing: 0.25,
  creatureHerdingHeadingBlendMax: 0.32,
  creatureHerdingTargetBlendEnabled: true,
  creatureHerdingTargetBlendMax: 0.12,
  creatureHerdingTargetBlendIsolationBoost: 0.25,
  creatureHerdingUseWorker: 0, // 0 = sync (default), 1 = offload to Web Worker
  creatureHerdingRegroupEnabled: true,
  creatureHerdingRegroupMinLocalHerdSize: 3,
  creatureHerdingRegroupRange: 45,
  creatureHerdingRegroupStrength: 0.35,
  creatureHerdingRegroupIntervalSeconds: 0.6,
  creatureHerdingAnchorEnabled: true,
  creatureHerdingAnchorEvalSeconds: 1.5,
  creatureHerdingAnchorCooldownSeconds: 4.0,
  creatureHerdingAnchorSearchRadius: 28,
  creatureHerdingAnchorCandidateCount: 12,
  creatureHerdingAnchorDriftSpeed: 2.2,
  creatureHerdingAnchorPullStrength: 0.55,
  creatureHerdingAnchorSoftRadiusBase: 6.0,
  creatureHerdingAnchorSoftRadiusScale: 1.25,
  creatureHerdingAnchorMaxInfluenceDistance: 60,
  creatureHerdingAnchorFoodSampleRadius: 3,
  creatureHerdingAnchorWaterSearchMax: 16,
  creatureHerdingAnchorThreatHalfLifeSeconds: 8.0,
  creatureHerdingAnchorSwitchMargin: 0.15,
  creatureHerdingAnchorRandomness: 0.08,

  // === CREATURES: WATER RENDEZVOUS ===
  creatureWaterRendezvousEnabled: true,
  creatureWaterRendezvousEvalSeconds: 1.0,
  creatureWaterRendezvousCooldownSeconds: 5.0,
  creatureWaterRendezvousSearchRadius: 26,
  creatureWaterRendezvousCandidateCount: 18,
  creatureWaterRendezvousThirstPressureThreshold: 0.12,
  creatureWaterRendezvousMaxDistance: 70,
  creatureWaterRendezvousPreferHerdAnchor: true,
  creatureWaterRendezvousCommitSeconds: 2.5,

  // === CREATURES: POST-DRINK REGROUP ===
  creaturePostDrinkRegroupSeconds: 4.0,
  creaturePostDrinkRegroupAnchorBoost: 0.35,
  creaturePostDrinkRegroupDeadzoneMultiplier: 0.6,
  creaturePostDrinkRegroupTargetBlendBoost: 0.22,

  // === CREATURES: BASE STATS ===
  creatureBaseEnergy: 1,
  creatureBaseWater: 1,
  creatureBaseStamina: 1,
  creatureBaseHp: 1,
  creatureBaseSpeed: 10, // (was 9 - slightly faster base movement)

  // === CREATURES: PERCEPTION & ALERTNESS ===
  creaturePerceptionRange: 5, // (was 4 - better awareness)
  creaturePerceptionRangeMax: 8, // (was 7)
  creatureAlertnessBase: 0.6, // (was 0.55 - more alert)
  creatureReactionDelay: 0.033, // seconds (unchanged)

  // === CREATURES: TARGETING & CHASE ===
  creatureTargetingRange: 12, // (was 10 - predators can spot prey further)
  creatureTargetingDistanceWeight: 0.12,
  creatureTargetingPreferences: {
    triangle: { circle: 1, square: 0.8 },
    octagon: { square: 1, circle: 0.8 }
  },
  creatureChaseStartThreshold: 0.55, // (was 0.6 - start chasing with less stamina)
  creatureChaseStopThreshold: 0.2, // (was 0.25 - push harder before giving up)
  creatureChaseLoseDistance: 14, // (was 12 - longer chase persistence)
  creatureChaseLoseTime: 0.3, // (was 0.25 - more time before losing target)
  creatureChaseCatchDistance: 1.0,
  creatureChaseRestTime: 0.15, // (was 0.1 - slightly longer rest after chase)

  // === CREATURES: PREDATOR BEHAVIOR ===
  // When well-fed, predators patrol instead of constantly hunting
  creaturePredatorRestEnabled: true,
  creaturePredatorRestThreshold: 0.75, // (was 0.7 - rest slightly earlier)
  creaturePredatorHuntThreshold: 0.5, // (was 0.4 - start hunting sooner)
  creaturePredatorPatrolSpeed: 0.45, // (was 0.4 - slightly faster patrol)

  // === CREATURES: PACK BEHAVIOR ===
  // Predators form packs and patrol with waypoints
  creaturePackEnabled: true,
  creaturePackSpacing: 3.5, // distance between pack members
  creaturePredatorPatrolRadius: 25, // how far from home to patrol
  creaturePredatorPatrolRetargetTimeMin: 3, // seconds before new waypoint
  creaturePredatorPatrolRetargetTimeMax: 8, // seconds max before retarget

  // Patrol waypoint intelligence
  creaturePredatorPatrolMemoryDecay: 0.015, // memory decay rate per second
  creaturePredatorPatrolMemoryMax: 8, // max prey sighting memories
  creaturePredatorPatrolPreySightingWeight: 0.6, // chance to patrol toward prey sighting
  creaturePredatorPatrolGrassWeight: 0.3, // chance to patrol toward grass
  creaturePredatorPatrolPauseDuration: 1.5, // seconds to pause at waypoint

  // Pack relocation (triangles/octagons)
  creaturePackRelocationEnabled: true,
  creaturePackRelocateAfterSeconds: 20, // how long “stale” before relocating
  creaturePackRelocateMinDistance: 25, // new home must be meaningfully far
  creaturePackRelocateSearchRadius: 80, // how far leader can look for new home
  creaturePackRelocateSampleAttempts: 20, // random samples to find viable land tile
  creaturePackRelocateAvoidWater: true,

  // === CREATURES: BEHAVIOR STATE MACHINE ===
  // State machine prevents rapid intent flickering
  creatureBehaviorStateEnabled: true,

  // RELAXED state - natural pauses while wandering/grazing
  creatureBehaviorRelaxedMinSeconds: 1.0,
  creatureBehaviorRelaxedPauseMinSeconds: 1.0,
  creatureBehaviorRelaxedPauseMaxSeconds: 4.0,
  creatureBehaviorRelaxedMoveMinSeconds: 3.0,
  creatureBehaviorRelaxedMoveMaxSeconds: 8.0,
  creatureBehaviorRelaxedPauseProbability: 0.4,
  creatureBehaviorRelaxedGrazePauseRatio: 0.65, // grazing creatures pause more

  // ALERT state - freeze and look at threat
  creatureBehaviorAlertMinSeconds: 0.5,
  creatureBehaviorAlertMaxSeconds: 1.5,
  creatureBehaviorAlertToFleeThreshold: 8, // tiles - flee if predator closer than this

  // TRAVELING state
  creatureBehaviorTravelingMinSeconds: 2.0,

  // FORAGING state
  creatureBehaviorForagingMinSeconds: 1.0,

  // FLEEING state
  creatureBehaviorFleeingMinSeconds: 0.5,

  // HUNTING state (predators)
  creatureBehaviorHuntSpottingSeconds: 0.7,
  creatureBehaviorHuntStalkingMinSeconds: 2.0,
  creatureBehaviorHuntStalkingMaxSeconds: 5.0,
  creatureBehaviorHuntCooldownSeconds: 1.5,
  creatureBehaviorHuntPounceRange: 3.5, // tiles - distance to trigger charge
  creatureBehaviorHuntStalkSpeed: 0.35, // speed multiplier when stalking

  // RESTING state
  creatureBehaviorRestingMinSeconds: 2.0,

  // FEEDING state (predators)
  creatureBehaviorFeedingMinSeconds: 3.0,
  creatureBehaviorFeedingMaxSeconds: 8.0,
  creatureBehaviorSatiationThreshold: 0.8, // energy ratio for "full"

  // Environment awareness pauses
  creatureBehaviorEnvironmentPauseEnabled: true,
  creatureBehaviorEnvironmentPauseSeconds: 0.5,
  creatureBehaviorEnvironmentPauseProbability: 0.3,

  // === CREATURES: MEMORY ===
  creatureMemoryMaxEntries: 12,
  creatureMemoryDecay: 0.018, // (was 0.02 - memories last slightly longer)
  creatureMemoryMinStrength: 0.05,
  creatureMemoryMergeDistance: 1.5,
  creatureMemoryVisitPenalty: 0.5,
  creatureWaterMemoryInHerdEnabled: false,

  // === CREATURES: METABOLISM ===
  creatureBasalEnergyDrain: 0.007, // (was 0.008 - slightly slower drain)
  creatureBasalWaterDrain: 0.009, // (was 0.01 - slightly slower drain)
  creatureBasalStaminaDrain: 0.003, // (was 0.004 - slower passive stamina loss)

  // === CREATURES: SPRINT ===
  creatureSprintStartThreshold: 0.65, // (was 0.7 - sprint with slightly less stamina)
  creatureSprintStopThreshold: 0.35, // (was 0.4 - push sprinting further)
  creatureSprintSpeedMultiplier: 1.7, // (was 1.6 - faster sprinting)
  creatureSprintStaminaDrain: 0.25, // (was 0.3 - slower sprint drain = longer chases)
  creatureStaminaRegen: 0.2, // (was 0.18 - faster stamina recovery)

  // === CREATURES: REPRODUCTION ===
  creatureReproductionMinAge: 75, // (was 90 - mature faster)
  creatureReproductionMinEnergyRatio: 0.7, // (was 0.8 - easier to reproduce)
  creatureReproductionMinWaterRatio: 0.7, // (was 0.8 - easier to reproduce)
  creatureReproductionCooldown: 120, // (was 180 - faster reproduction cycle)
  creatureReproductionFailedCooldown: 15, // (was 20 - try again sooner)
  creatureReproductionFailedCostMultiplier: 0.4, // (was 0.5 - less penalty for failed mating)
  creatureReproductionRange: 2.5,

  // === CREATURES: SEX & PREGNANCY ===
  creatureSexEnabled: true,
  creaturePregnancyEnabled: true,
  creatureSexInitialSplitMode: 'exact',
  creatureConceptionChance: 0.6, // (was 0.5 - higher conception rate)
  creatureGestationTime: 45, // (was 60 - faster pregnancy)
  creatureGestationTraitEnabled: true,
  creaturePregnancyMetabolismMultiplier: 1.12, // (was 1.15 - less pregnancy cost)
  creaturePregnancyMoveSpeedMultiplier: 0.92, // (was 0.9 - less speed penalty)
  creaturePregnancyMiscarriageEnabled: true,
  creaturePregnancyMiscarriageEnergyRatio: 0.12, // (was 0.15 - miscarriage at lower energy)
  // Probability per second while below the miscarriage energy threshold.
  creaturePregnancyMiscarriageChancePerSecond: 0.35, // (was 0.4528 - lower miscarriage rate)

  // === CREATURES: MATE SEEKING ===
  creatureMateSeekingEnabled: true,
  creatureMateSeekRange: 28, // (was 25 - wider mate search)
  creatureMateSeekCommitTime: 0.8, // (was 1 - faster commitment)
  creatureReproductionRangeWhileSeeking: 7, // (was 6 - easier to complete mating)
  creatureMateSeekPriorityOverridesNeeds: false,

  // === CREATURES: OFFSPRING ===
  creatureBirthChildStartingMetersFastMultiplier: 0.88, // (was 0.85 - healthier fast-gestation babies)
  creatureBirthChildStartingMetersSlowMultiplier: 1.08, // (was 1.1 - slightly less bonus)
  creatureBirthChildStartingMetersFastIfMultiplierBelow: 0.9,
  creatureBirthChildStartingMetersSlowIfMultiplierAbove: 1.1,
  creatureReproductionEnergyCost: 0.18, // (was 0.2 - less costly reproduction)
  creatureReproductionWaterCost: 0.12, // (was 0.15 - less costly reproduction)
  creatureReproductionStaminaCost: 0.04, // (was 0.05)
  creatureOffspringEnergy: 0.65, // (was 0.6 - offspring start healthier)
  creatureOffspringWater: 0.65, // (was 0.6)
  creatureOffspringStamina: 0.65, // (was 0.6)
  creatureOffspringHp: 0.85, // (was 0.8)

  // === CREATURES: NEEDS & EATING ===
  creatureNeedSwitchMargin: 0.05,
  creatureDrinkConcernMargin: 0.18,
  creatureDrinkThreshold: 0.75, // (was 0.8 - drink slightly less often)
  creatureDrinkAmount: 0.7, // (was 0.6 - drink faster)
  creatureEatThreshold: 0.75, // (was 0.8 - eat slightly less often)
  creatureEatAmount: 0.55, // (was 0.5 - eat slightly faster)
  creatureGrassEatMin: 0.04, // (was 0.05 - can eat scarcer grass)
  creatureBerryEatMin: 0.08, // (was 0.1 - can eat fewer berries)

  // === CREATURES: FOOD PROPERTIES ===
  creatureFoodProperties: {
    grass: { nutrition: 1, handling: 1, risk: 0.02 },
    berries: { nutrition: 1.3, handling: 1, risk: 0.04 }, // (was 1.2 - berries more nutritious)
    meat: { nutrition: 4.5, handling: 1.2, risk: 0.12 } // (was 4.0 - meat more nutritious)
  },
  creatureFoodEfficiency: {
    grass: 1,
    berries: 1,
    meat: 1
  },
  creatureTraitMultipliers: {
    square: {
      foodEfficiency: { berries: 1.3, grass: 0.75, meat: 0.65 } // (was 1.25 for berries)
    },
    triangle: {
      foodEfficiency: { meat: 1.3, grass: 0.7, berries: 0.7 } // (was 1.25 for meat)
    },
    circle: {
      foodEfficiency: { grass: 1.3, berries: 0.8, meat: 0.6 } // (was 1.25 for grass)
    },
    octagon: {
      foodEfficiency: { meat: 1.25, grass: 0.75, berries: 0.7 } // (was 1.2 for meat)
    }
  },

  // === GENETICS: GENOME DEFAULTS ===
  creatureGenomeDefaults: {
    default: {
      speed: 0.5,
      perceptionRange: 0.5,
      alertness: 0.5,
      reactionDelay: 0.5, // normalized 0-1
      basalEnergyDrain: 0.5,
      basalWaterDrain: 0.5,
      basalStaminaDrain: 0.5,
      sprintStartThreshold: 0.5,
      sprintStopThreshold: 0.5,
      sprintSpeedMultiplier: 0.5,
      sprintStaminaDrain: 0.5,
      staminaRegen: 0.5,
      drinkThreshold: 0.5,
      drinkAmount: 0.5,
      eatThreshold: 0.5,
      eatAmount: 0.5,
      grassEatMin: 0.5,
      berryEatMin: 0.5,
      // Life history genes
      gestationMultiplier: 0.5,
      growthRate: 0.5,
      longevity: 0.5
    },
    square: {},
    triangle: {},
    circle: {},
    octagon: {}
  },
  creatureGenomeRanges: {},
  creatureGestationMultiplier: 1,
  creatureGenomeJitter: 0.1, // (was 0.08 - more initial variation)
  creatureGenomeMutationRate: 0.2, // (was 0.18 - slightly more mutations)
  creatureGenomeMutationStrength: 0.12, // (was 0.1 - stronger mutations for faster evolution)
  creatureGenomePleiotropyScale: 0.18,
  // Inheritance: small noise makes offspring close to but not identical to parents
  creatureGenomeInheritanceNoise: 0.03, // adds small random deviation during inheritance
  // Inheritance: mix chance controls blend vs midpoint (1 = always random blend)
  creatureGenomeInheritanceMixChance: 1,
  // Aging: "grow fast, die fast" coupling exponent (1 = full coupling, 0 = no coupling)
  creatureGrowthLongevityCoupling: 1,

  // === TRAIT TRADEOFFS ===
  // Positive traits have deterministic costs (applied at birth, fixed for life)
  // Speed costs energy/water metabolism
  creatureTradeoffSpeedToEnergyDrainScale: 0.6,
  creatureTradeoffSpeedToWaterDrainScale: 0.4,
  // Sprint speed costs sprint stamina drain
  creatureTradeoffSprintToStaminaDrainScale: 0.7,
  // Perception costs reaction delay (wide vision = slower processing)
  creatureTradeoffPerceptionToReactionDelayScale: 0.5,

  // === CREATURES: LIFESPAN ===
  creatureMaxAge: 540, // (was 600 - slightly shorter lifespan creates faster generations)
  creatureLifeStages: [
    {
      id: 'juvenile',
      label: 'Juvenile',
      minAge: 0, // seconds
      movementScale: 0.88, // (was 0.85 - juveniles slightly faster)
      metabolismScale: 0.88 // (was 0.9 - juveniles slightly more efficient)
    },
    {
      id: 'adult',
      label: 'Adult',
      minAge: 100, // (was 120 - reach adulthood faster)
      movementScale: 1,
      metabolismScale: 1
    },
    {
      id: 'elder',
      label: 'Elder',
      minAge: 280, // (was 300 - become elder slightly earlier)
      movementScale: 0.78, // (was 0.75 - elders slightly faster)
      metabolismScale: 1.08 // (was 1.1 - elders slightly more efficient)
    }
  ],
  creatureInspectRadius: 6
};

/**
 * Config metadata for UI generation.
 * Defines which config values are editable and how to display them.
 */
export const configMeta = {
  // Simulation
  seed: {
    label: 'Seed',
    description: 'RNG seed for terrain, plants, and creature spawn.',
    min: 1,
    max: 999999,
    step: 1,
    category: 'simulation',
    control: 'number'
  },
  hotspotSeed: {
    label: 'Hotspot Seed',
    description: 'Defined in simConfig but not referenced elsewhere in the current code.',
    min: 1,
    max: 999999,
    step: 1,
    category: 'simulation',
    control: 'number',
    advanced: true
  },

  // World
  worldWidth: {
    label: 'World Width',
    description: 'Horizontal map size.',
    min: 40,
    max: 400,
    step: 5,
    unit: 'tiles',
    category: 'world',
    control: 'slider'
  },
  worldHeight: {
    label: 'World Height',
    description: 'Vertical map size.',
    min: 40,
    max: 400,
    step: 5,
    unit: 'tiles',
    category: 'world',
    control: 'slider'
  },
  defaultTerrain: {
    label: 'Default Terrain',
    description: 'Baseline terrain before generation.',
    category: 'world',
    type: 'select',
    control: 'select',
    options: [
      { label: 'Plains', value: 'plains' },
      { label: 'Forest', value: 'forest' },
      { label: 'Rock', value: 'rock' },
      { label: 'Sand', value: 'sand' },
      { label: 'Shore', value: 'shore' },
      { label: 'Water', value: 'water' }
    ]
  },
  waterTerrain: {
    label: 'Water Terrain',
    description: 'Terrain type treated as water.',
    category: 'world',
    type: 'select',
    control: 'select',
    options: [
      { label: 'Water', value: 'water' },
      { label: 'Shore', value: 'shore' },
      { label: 'Plains', value: 'plains' },
      { label: 'Forest', value: 'forest' },
      { label: 'Rock', value: 'rock' },
      { label: 'Sand', value: 'sand' }
    ]
  },
  shoreTerrain: {
    label: 'Shore Terrain',
    description: 'Terrain type treated as shore.',
    category: 'world',
    type: 'select',
    control: 'select',
    options: [
      { label: 'Shore', value: 'shore' },
      { label: 'Water', value: 'water' },
      { label: 'Plains', value: 'plains' },
      { label: 'Forest', value: 'forest' },
      { label: 'Rock', value: 'rock' },
      { label: 'Sand', value: 'sand' }
    ]
  },
  terrainNoiseScale: {
    label: 'Terrain Noise Scale',
    description: 'Noise sampling scale (smaller = larger features).',
    min: 0.005,
    max: 0.12,
    step: 0.005,
    category: 'world',
    control: 'slider'
  },
  terrainWaterLevel: {
    label: 'Terrain Water Level',
    description: 'Height threshold for water before coverage scaling.',
    min: -1,
    max: 1,
    step: 0.02,
    category: 'world',
    control: 'slider'
  },
  terrainShoreLevel: {
    label: 'Terrain Shore Level',
    description: 'Height threshold for shore before coverage scaling.',
    min: -1,
    max: 1,
    step: 0.02,
    category: 'world',
    control: 'slider'
  },
  terrainWaterCoverageMultiplier: {
    label: 'Water Coverage Mult',
    description: 'Scales water coverage relative to baseline.',
    min: 0.1,
    max: 1,
    step: 0.05,
    category: 'world',
    control: 'slider'
  },
  terrainRockThreshold: {
    label: 'Terrain Rock Threshold',
    description: 'Roughness threshold for rock biome.',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'world',
    control: 'slider'
  },
  terrainForestMoisture: {
    label: 'Terrain Forest Moisture',
    description: 'Moisture threshold for forest biome.',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'world',
    control: 'slider'
  },
  terrainSandMoisture: {
    label: 'Terrain Sand Moisture',
    description: 'Moisture threshold for sand biome.',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'world',
    control: 'slider'
  },
  waterCorridorCount: {
    label: 'River Count',
    description: 'Number of rivers (scaled by water coverage).',
    min: 0,
    max: 24,
    step: 1,
    category: 'world',
    control: 'slider'
  },
  waterCorridorWidth: {
    label: 'River Width',
    description: 'River half-width when painting water cells.',
    min: 1,
    max: 6,
    step: 1,
    unit: 'tiles',
    category: 'world',
    control: 'slider'
  },
  terrainBlobCount: {
    label: 'Legacy Terrain Blobs',
    description: 'Legacy blob painter count (unused by default).',
    min: 0,
    max: 200,
    step: 1,
    category: 'world',
    control: 'slider',
    advanced: true
  },
  terrainBlobMinRadius: {
    label: 'Legacy Blob Min Radius',
    description: 'Legacy blob painter min radius.',
    min: 1,
    max: 12,
    step: 1,
    unit: 'tiles',
    category: 'world',
    control: 'slider',
    advanced: true
  },
  terrainBlobMaxRadius: {
    label: 'Legacy Blob Max Radius',
    description: 'Legacy blob painter max radius.',
    min: 1,
    max: 20,
    step: 1,
    unit: 'tiles',
    category: 'world',
    control: 'slider',
    advanced: true
  },
  waterCorridorMinLength: {
    label: 'Legacy River Min Length',
    description: 'Legacy corridor min length.',
    min: 1,
    max: 60,
    step: 1,
    unit: 'tiles',
    category: 'world',
    control: 'slider',
    advanced: true
  },
  waterCorridorMaxLength: {
    label: 'Legacy River Max Length',
    description: 'Legacy corridor max length.',
    min: 1,
    max: 80,
    step: 1,
    unit: 'tiles',
    category: 'world',
    control: 'slider',
    advanced: true
  },
  waterCorridorTurnChance: {
    label: 'Legacy River Turn Chance',
    description: 'Legacy corridor turn probability.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'world',
    control: 'slider',
    advanced: true
  },

  // Rendering
  tileSize: {
    label: 'Tile Size (px)',
    description: 'Rendering scale per tile.',
    min: 6,
    max: 40,
    step: 1,
    unit: 'px',
    category: 'rendering',
    control: 'slider'
  },

  // Input
  creatureInspectRadius: {
    label: 'Inspect Radius (tiles)',
    description: 'Tap radius for selecting creatures.',
    min: 1,
    max: 20,
    step: 1,
    unit: 'tiles',
    category: 'input',
    control: 'slider'
  },

  // Creatures: Base Stats
  creatureCount: {
    label: 'Creature Count',
    description: 'Total starting population.',
    min: 0,
    max: 500,
    step: 10,
    category: 'creatures',
    control: 'slider'
  },
  creaturePredatorCount: {
    label: 'Predator Count',
    description: 'Number of predators at start.',
    min: 0,
    max: 50,
    step: 1,
    category: 'creatures',
    control: 'slider'
  },
  creatureSpawnSpeciesAnchorSpread: {
    label: 'Spawn Species Spread',
    description: 'Distance between species anchors at spawn.',
    min: 0,
    max: 60,
    step: 1,
    unit: 'tiles',
    category: 'creatures',
    control: 'slider'
  },
  creatureSpawnClusterSpread: {
    label: 'Spawn Cluster Spread',
    description: 'Fallback anchor spread for spawn clusters.',
    min: 0,
    max: 40,
    step: 1,
    unit: 'tiles',
    category: 'creatures',
    control: 'slider',
    advanced: true
  },
  creatureSpawnClusterJitter: {
    label: 'Spawn Cluster Jitter',
    description: 'Random spread around species anchors.',
    min: 0,
    max: 12,
    step: 0.5,
    unit: 'tiles',
    category: 'creatures',
    control: 'slider',
    advanced: true
  },
  creatureSpawnPredatorAnchorDistance: {
    label: 'Predator Spawn Dist',
    description: 'Min predator distance from herbivores.',
    min: 0,
    max: 200,
    step: 2,
    unit: 'tiles',
    category: 'creatures',
    control: 'slider'
  },
  creatureBaseSpeed: {
    label: 'Base Speed',
    description: 'Base movement speed before traits.',
    min: 1,
    max: 30,
    step: 1,
    unit: 'tiles/s',
    category: 'creatures',
    control: 'slider'
  },

  // Movement Physics
  creatureAcceleration: {
    label: 'Acceleration',
    description: 'How fast creatures reach top speed. Higher = snappier movement.',
    min: 0.01,
    max: 1,
    step: 0.01,
    category: 'physics',
    control: 'slider'
  },
  creatureDeceleration: {
    label: 'Deceleration',
    description: 'How fast creatures slow down when stopping. Higher = quicker stops.',
    min: 0.01,
    max: 1,
    step: 0.01,
    category: 'physics',
    control: 'slider'
  },
  creatureFrictionDrag: {
    label: 'Friction Drag',
    description: 'Passive slowdown each tick. Creates natural coasting.',
    min: 0,
    max: 0.2,
    step: 0.005,
    category: 'physics',
    control: 'slider'
  },
  creatureAngularAcceleration: {
    label: 'Angular Acceleration',
    description: 'How fast turn rate changes. Lower = smoother, more momentum.',
    min: 0.01,
    max: 1,
    step: 0.01,
    category: 'physics',
    control: 'slider'
  },
  creatureSpeedTurnPenalty: {
    label: 'Speed Turn Penalty',
    description: 'How much speed reduces turn rate. Higher = wider turns when fast.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'physics',
    control: 'slider'
  },

  // Intent Speed Multipliers
  creatureIntentSpeedWander: {
    label: 'Wander Speed',
    description: 'Speed multiplier when wandering aimlessly.',
    min: 0.1,
    max: 1.5,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureIntentSpeedGraze: {
    label: 'Graze Speed',
    description: 'Speed multiplier when grazing (very slow).',
    min: 0.1,
    max: 1,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureIntentSpeedSeek: {
    label: 'Seek Speed',
    description: 'Speed multiplier when seeking food or water.',
    min: 0.1,
    max: 1.5,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureIntentSpeedMate: {
    label: 'Mate Seek Speed',
    description: 'Speed multiplier when seeking a mate.',
    min: 0.1,
    max: 1.5,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureIntentSpeedHunt: {
    label: 'Hunt Stalk Speed',
    description: 'Speed multiplier during stalking phase of hunt.',
    min: 0.1,
    max: 1.5,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureIntentSpeedHuntChase: {
    label: 'Hunt Chase Speed',
    description: 'Speed multiplier during active chase.',
    min: 0.5,
    max: 2,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },

  creatureBaseEnergy: {
    label: 'Base Energy',
    description: 'Starting energy baseline.',
    min: 0.1,
    max: 5,
    step: 0.1,
    category: 'creatures',
    control: 'slider'
  },
  creatureBaseWater: {
    label: 'Base Water',
    description: 'Starting water baseline.',
    min: 0.1,
    max: 5,
    step: 0.1,
    category: 'creatures',
    control: 'slider'
  },
  creatureBaseStamina: {
    label: 'Base Stamina',
    description: 'Starting stamina baseline.',
    min: 0.1,
    max: 5,
    step: 0.1,
    category: 'creatures',
    control: 'slider',
    advanced: true
  },
  creatureBaseHp: {
    label: 'Base HP',
    description: 'Starting HP baseline.',
    min: 0.1,
    max: 5,
    step: 0.1,
    category: 'creatures',
    control: 'slider',
    advanced: true
  },
  creatureSexEnabled: {
    label: 'Sex Enabled',
    description: 'Enable sex-based reproduction rules.',
    type: 'boolean',
    category: 'creatures'
  },
  creatureSexInitialSplitMode: {
    label: 'Sex Split Mode',
    description: 'Exact 50/50 split or alternating assignment.',
    type: 'select',
    category: 'creatures',
    control: 'select',
    options: [
      { label: 'Exact', value: 'exact' },
      { label: 'Alternate', value: 'alternate' }
    ]
  },

  // Creatures: Metabolism
  creatureBasalEnergyDrain: {
    label: 'Energy Drain/s',
    description: 'Baseline energy drain per second.',
    min: 0,
    max: 0.1,
    step: 0.001,
    unit: '/s',
    category: 'metabolism',
    control: 'slider'
  },
  creatureBasalWaterDrain: {
    label: 'Water Drain/s',
    description: 'Baseline water drain per second.',
    min: 0,
    max: 0.1,
    step: 0.001,
    unit: '/s',
    category: 'metabolism',
    control: 'slider'
  },
  creatureBasalStaminaDrain: {
    label: 'Basal Stamina Drain/s',
    description: 'Baseline stamina drain per second.',
    min: 0,
    max: 0.1,
    step: 0.001,
    unit: '/s',
    category: 'metabolism',
    control: 'slider',
    advanced: true
  },
  creatureSprintStartThreshold: {
    label: 'Sprint Start Threshold',
    description: 'Starts sprinting when stamina ratio meets this threshold.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'metabolism',
    control: 'slider',
    advanced: true
  },
  creatureSprintStopThreshold: {
    label: 'Sprint Stop Threshold',
    description: 'Stops sprinting when stamina ratio drops below this threshold.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'metabolism',
    control: 'slider',
    advanced: true
  },
  creatureSprintStaminaDrain: {
    label: 'Sprint Drain/s',
    description: 'Stamina drain while sprinting.',
    min: 0,
    max: 1,
    step: 0.01,
    unit: '/s',
    category: 'metabolism',
    control: 'slider'
  },
  creatureStaminaRegen: {
    label: 'Stamina Regen/s',
    description: 'Stamina recovery per second.',
    min: 0,
    max: 1,
    step: 0.01,
    unit: '/s',
    category: 'metabolism',
    control: 'slider'
  },
  creatureEatAmount: {
    label: 'Eat Amount/s',
    description: 'Food consumed per second while eating.',
    min: 0.1,
    max: 2,
    step: 0.1,
    unit: '/s',
    category: 'metabolism',
    control: 'slider'
  },
  creatureDrinkAmount: {
    label: 'Drink Amount/s',
    description: 'Water gained per second while drinking.',
    min: 0.1,
    max: 2,
    step: 0.1,
    unit: '/s',
    category: 'metabolism',
    control: 'slider'
  },
  creatureDrinkConcernMargin: {
    label: 'Drink Concern Margin',
    description: 'Buffer above drink threshold for concern.',
    min: 0,
    max: 0.35,
    step: 0.01,
    category: 'metabolism',
    control: 'slider'
  },
  creatureNeedSwitchMargin: {
    label: 'Need Switch Margin',
    description: 'Hysteresis margin for hunger vs thirst.',
    min: 0,
    max: 0.2,
    step: 0.01,
    category: 'metabolism',
    control: 'slider'
  },
  creatureDrinkThreshold: {
    label: 'Drink Threshold',
    description: 'Water ratio below which thirst triggers.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'metabolism',
    control: 'slider'
  },
  creatureEatThreshold: {
    label: 'Eat Threshold',
    description: 'Energy ratio below which hunger triggers.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'metabolism',
    control: 'slider'
  },
  creatureGrassEatMin: {
    label: 'Min Grass Eat',
    description: 'Minimum grass required to eat.',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'metabolism',
    control: 'slider',
    advanced: true
  },
  creatureBerryEatMin: {
    label: 'Min Berry Eat',
    description: 'Minimum berries required to eat.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'metabolism',
    control: 'slider',
    advanced: true
  },

  // Predator Behavior
  creaturePredatorRestThreshold: {
    label: 'Rest When Energy >',
    description: 'Energy ratio to switch to resting.',
    min: 0.3,
    max: 1,
    step: 0.05,
    category: 'predator',
    control: 'slider'
  },
  creaturePredatorHuntThreshold: {
    label: 'Hunt When Energy <',
    description: 'Energy ratio to start hunting.',
    min: 0.1,
    max: 0.8,
    step: 0.05,
    category: 'predator',
    control: 'slider'
  },
  creatureTargetingRange: {
    label: 'Targeting Range',
    description: 'Predator target search range.',
    min: 5,
    max: 30,
    step: 1,
    unit: 'tiles',
    category: 'predator',
    control: 'slider'
  },
  creatureTargetingDistanceWeight: {
    label: 'Targeting Distance Weight',
    description: 'Score = speciesWeight − distance × weight.',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePredatorRestEnabled: {
    label: 'Predator Rest Enabled',
    description: 'Allow predators to rest when satiated.',
    type: 'boolean',
    category: 'predator'
  },
  creaturePredatorPatrolSpeed: {
    label: 'Predator Patrol Speed',
    description: 'Defined in simConfig but not referenced elsewhere in the current code.',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePackRelocationEnabled: {
    label: 'Pack Relocation Enabled',
    description: 'Enable pack relocation behavior.',
    type: 'boolean',
    category: 'predator'
  },
  creaturePackRelocateAfterSeconds: {
    label: 'Relocate After (s)',
    description: 'Time of staleness before relocation triggers.',
    min: 0,
    max: 600,
    step: 1,
    unit: 's',
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePackRelocateMinDistance: {
    label: 'Relocate Min Distance',
    description: 'Candidate new homes must be at least this far from current home.',
    min: 0,
    max: 200,
    step: 1,
    unit: 'tiles',
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePackRelocateSearchRadius: {
    label: 'Relocate Search Radius',
    description: 'Radius within which relocation candidates are sampled.',
    min: 0,
    max: 240,
    step: 1,
    unit: 'tiles',
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePackRelocateSampleAttempts: {
    label: 'Relocate Sample Attempts',
    description: 'Number of random candidates evaluated for new homes.',
    min: 1,
    max: 80,
    step: 1,
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePackRelocateAvoidWater: {
    label: 'Pack Relocate Avoid Water',
    description: 'Avoid water tiles when relocating.',
    type: 'boolean',
    category: 'predator'
  },

  // Herding Behavior
  creatureHerdingStrength: {
    label: 'Herd Cohesion',
    description: 'Base cohesion strength for herding.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingEnabled: {
    label: 'Herding Enabled',
    description: 'Enable herding for herbivores.',
    type: 'boolean',
    category: 'herding'
  },
  creatureHerdingSimpleMode: {
    label: 'Simple Herding Mode',
    description: 'Use simple 3-rule boid system instead of complex herding.',
    type: 'boolean',
    category: 'herding'
  },

  // Simple Herding
  creatureSimpleHerdingSeparationRadius: {
    label: 'Separation Radius',
    description: 'Distance at which creatures push away from each other.',
    min: 0.5,
    max: 8,
    step: 0.5,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureSimpleHerdingAlignmentRadius: {
    label: 'Alignment Radius',
    description: 'Distance at which creatures match neighbor headings.',
    min: 1,
    max: 20,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureSimpleHerdingCohesionRadius: {
    label: 'Cohesion Radius',
    description: 'Distance at which creatures pull toward herd center.',
    min: 1,
    max: 30,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureSimpleHerdingSeparationStrength: {
    label: 'Separation Strength',
    description: 'Force of pushing away from too-close neighbors.',
    min: 0,
    max: 2,
    step: 0.1,
    category: 'herding',
    control: 'slider'
  },
  creatureSimpleHerdingAlignmentStrength: {
    label: 'Alignment Strength',
    description: 'Force of matching neighbor headings.',
    min: 0,
    max: 2,
    step: 0.1,
    category: 'herding',
    control: 'slider'
  },
  creatureSimpleHerdingCohesionStrength: {
    label: 'Cohesion Strength',
    description: 'Force of pulling toward herd center.',
    min: 0,
    max: 2,
    step: 0.1,
    category: 'herding',
    control: 'slider'
  },
  creatureSimpleHerdingThreatRange: {
    label: 'Threat Detection Range',
    description: 'Distance at which predators are detected.',
    min: 1,
    max: 25,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureSimpleHerdingThreatStrength: {
    label: 'Flee Strength',
    description: 'Force of fleeing from predators.',
    min: 0,
    max: 3,
    step: 0.1,
    category: 'herding',
    control: 'slider'
  },
  creatureSimpleHerdingSmoothing: {
    label: 'Herding Smoothing',
    description: 'How smoothly herding forces are applied (prevents jitter).',
    min: 0.1,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingHeadingBlend: {
    label: 'Heading Blend',
    description: 'How much herd heading influences creature heading.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider'
  },
  creatureThreatPropagationRadius: {
    label: 'Threat Propagation Radius',
    description: 'How far threat alerts spread through the herd.',
    min: 1,
    max: 20,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureThreatPropagationHops: {
    label: 'Threat Propagation Hops',
    description: 'Maximum propagation depth for threat alerts.',
    min: 0,
    max: 5,
    step: 1,
    category: 'herding',
    control: 'slider'
  },
  creatureThreatDecaySeconds: {
    label: 'Threat Memory',
    description: 'How long creatures stay threatened after losing sight of predator.',
    min: 0.5,
    max: 10,
    step: 0.5,
    unit: 'seconds',
    category: 'herding',
    control: 'slider'
  },

  // Herd Movement Waves
  creatureHerdMovementContagionRadius: {
    label: 'Movement Contagion Radius',
    description: 'Distance at which movement spreads through the herd.',
    min: 1,
    max: 15,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdMovementContagionDelay: {
    label: 'Movement Contagion Delay',
    description: 'Delay before movement spreads to nearby creatures.',
    min: 0.1,
    max: 2,
    step: 0.1,
    unit: 's',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdMovementContagionChance: {
    label: 'Movement Contagion Chance',
    description: 'Probability to start moving when neighbors are moving.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdLeadershipDecay: {
    label: 'Leadership Decay',
    description: 'How fast leadership score decays when not moving.',
    min: 0.001,
    max: 0.1,
    step: 0.005,
    category: 'herding',
    control: 'slider',
    advanced: true
  },

  creatureHerdingAlignmentStrength: {
    label: 'Herd Alignment',
    description: 'Alignment weight for herd headings.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingMinGroupSize: {
    label: 'Min Group Size',
    description: 'Minimum local herd size required for alignment/cohesion logic.',
    min: 1,
    max: 12,
    step: 1,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingThreatRange: {
    label: 'Threat Detect Range',
    description: 'Predator detection radius.',
    min: 2,
    max: 20,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingThreatStrength: {
    label: 'Flee Strength',
    description: 'Threat steering strength.',
    min: 0,
    max: 0.5,
    step: 0.05,
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingIdealDistance: {
    label: 'Herd Spacing',
    description: 'Ideal herd spacing distance.',
    min: 2,
    max: 10,
    step: 0.5,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingRange: {
    label: 'Herd Range',
    description: 'Local neighbor range for herding.',
    min: 4,
    max: 30,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingSeparation: {
    label: 'Herd Separation',
    description: 'Separation distance within the herd.',
    min: 1,
    max: 6,
    step: 0.2,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingComfortMax: {
    label: 'Herd Comfort Max',
    description: 'Comfort band max distance.',
    min: 2,
    max: 12,
    step: 0.5,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingComfortMin: {
    label: 'Comfort Min (Reserved)',
    description: 'Resolved but currently unused in steering logic (reserved).',
    min: 0,
    max: 10,
    step: 0.5,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingSeparationMultiplier: {
    label: 'Separation Multiplier',
    description: 'Scales separation contribution.',
    min: 0.5,
    max: 4,
    step: 0.1,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingOffsetDeadzone: {
    label: 'Offset Deadzone',
    description: 'Deadzone for herding offset.',
    min: 0,
    max: 0.2,
    step: 0.01,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingOffsetSmoothing: {
    label: 'Offset Smoothing',
    description: 'Smoothing factor for herding offset.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingHeadingBlendMax: {
    label: 'Herd Heading Blend',
    description: 'Max heading blend factor.',
    min: 0,
    max: 0.5,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingTargetBlendEnabled: {
    label: 'Target Blend Enabled',
    description: 'Blend toward targets during herding.',
    type: 'boolean',
    category: 'herding'
  },
  creatureHerdingTargetBlendMax: {
    label: 'Target Blend Max',
    description: 'Max target blend amount.',
    min: 0,
    max: 0.35,
    step: 0.01,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingTargetBlendIsolationBoost: {
    label: 'Isolation Boost',
    description: 'Extra blend when isolated.',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingUseWorker: {
    label: 'Herding Worker',
    description: 'Use Web Worker for herding offsets.',
    min: 0,
    max: 1,
    step: 1,
    category: 'herding',
    control: 'number',
    advanced: true
  },
  creatureHerdingRegroupEnabled: {
    label: 'Regroup Assist',
    description: 'Enable regroup assist behavior.',
    type: 'boolean',
    category: 'herding'
  },
  creatureHerdingRegroupMinLocalHerdSize: {
    label: 'Regroup Min Herd',
    description: 'Min local herd size for regroup.',
    min: 1,
    max: 10,
    step: 1,
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingRegroupRange: {
    label: 'Regroup Range',
    description: 'Range for regroup pull.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingRegroupStrength: {
    label: 'Regroup Strength',
    description: 'Strength of regroup pull.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingRegroupIntervalSeconds: {
    label: 'Regroup Interval (s)',
    description: 'Seconds between regroup evaluations.',
    min: 0.1,
    max: 5,
    step: 0.1,
    unit: 's',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorEnabled: {
    label: 'Anchor Enabled',
    description: 'Enable herd anchor system.',
    type: 'boolean',
    category: 'herding'
  },
  creatureHerdingAnchorEvalSeconds: {
    label: 'Anchor Eval (s)',
    description: 'Seconds between anchor evaluations.',
    min: 0.25,
    max: 6,
    step: 0.25,
    unit: 's',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorCooldownSeconds: {
    label: 'Anchor Cooldown (s)',
    description: 'Cooldown after anchor switch.',
    min: 0.25,
    max: 6,
    step: 0.25,
    unit: 's',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorSearchRadius: {
    label: 'Anchor Search Radius',
    description: 'Radius for anchor candidates.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorCandidateCount: {
    label: 'Anchor Candidates',
    description: 'Number of anchor candidates.',
    min: 1,
    max: 40,
    step: 1,
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorDriftSpeed: {
    label: 'Anchor Drift Speed',
    description: 'Anchor drift speed toward target.',
    min: 0,
    max: 10,
    step: 0.1,
    unit: 'tiles/s',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorPullStrength: {
    label: 'Anchor Pull Strength',
    description: 'Strength of anchor pull.',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorSoftRadiusBase: {
    label: 'Anchor Soft Radius Base',
    description: 'Base soft radius for anchor pull.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorSoftRadiusScale: {
    label: 'Anchor Soft Radius Scale',
    description: 'Scale for soft radius vs herd size.',
    min: 0.1,
    max: 3,
    step: 0.05,
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorMaxInfluenceDistance: {
    label: 'Anchor Max Influence',
    description: 'Max distance for anchor pull.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorFoodSampleRadius: {
    label: 'Anchor Food Radius',
    description: 'Food sampling radius for anchors.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorWaterSearchMax: {
    label: 'Anchor Water Search',
    description: 'Max steps for water search scoring.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorThreatHalfLifeSeconds: {
    label: 'Anchor Threat Half-Life (s)',
    description: 'Threat decay half-life for anchors.',
    min: 1,
    max: 30,
    step: 0.5,
    unit: 's',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorSwitchMargin: {
    label: 'Anchor Switch Margin',
    description: 'Margin required to switch anchors.',
    min: 0.1,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorRandomness: {
    label: 'Anchor Randomness',
    description: 'Randomness added to anchor scores.',
    min: 0,
    max: 0.25,
    step: 0.01,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureWaterRendezvousEnabled: {
    label: 'Water Rendezvous',
    description: 'Enable herd water rendezvous targets.',
    type: 'boolean',
    category: 'herding'
  },
  creatureWaterRendezvousEvalSeconds: {
    label: 'Water Rendezvous Eval (s)',
    description: 'Seconds between rendezvous evaluation.',
    min: 0.25,
    max: 12,
    step: 0.25,
    unit: 's',
    category: 'herding',
    control: 'slider'
  },
  creatureWaterRendezvousCooldownSeconds: {
    label: 'Water Rendezvous Cooldown (s)',
    description: 'Cooldown after switching rendezvous.',
    min: 0.25,
    max: 12,
    step: 0.25,
    unit: 's',
    category: 'herding',
    control: 'slider'
  },
  creatureWaterRendezvousSearchRadius: {
    label: 'Water Rendezvous Radius',
    description: 'Search radius for rendezvous targets.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureWaterRendezvousCandidateCount: {
    label: 'Water Rendezvous Candidates',
    description: 'Candidates evaluated per species.',
    min: 4,
    max: 32,
    step: 1,
    category: 'herding',
    control: 'slider'
  },
  creatureWaterRendezvousThirstPressureThreshold: {
    label: 'Water Rendezvous Pressure',
    description: 'Thirst pressure needed to evaluate.',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'herding',
    control: 'slider'
  },
  creatureWaterRendezvousMaxDistance: {
    label: 'Water Rendezvous Max Dist',
    description: 'Max distance for individual use.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureWaterRendezvousPreferHerdAnchor: {
    label: 'Water Rendezvous Anchor',
    description: 'Prefer herd anchor for sampling.',
    type: 'boolean',
    category: 'herding'
  },
  creatureWaterRendezvousCommitSeconds: {
    label: 'Water Rendezvous Commit (s)',
    description: 'Seconds to commit to rendezvous.',
    min: 0.25,
    max: 12,
    step: 0.25,
    unit: 's',
    category: 'herding',
    control: 'slider'
  },
  creaturePostDrinkRegroupSeconds: {
    label: 'Post-Drink Regroup (s)',
    description: 'Regroup duration after drinking.',
    min: 0.25,
    max: 12,
    step: 0.25,
    unit: 's',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creaturePostDrinkRegroupAnchorBoost: {
    label: 'Post-Drink Anchor Boost',
    description: 'Boost anchor pull after drinking.',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creaturePostDrinkRegroupDeadzoneMultiplier: {
    label: 'Post-Drink Deadzone Mult',
    description: 'Deadzone multiplier after drinking.',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creaturePostDrinkRegroupTargetBlendBoost: {
    label: 'Post-Drink Target Blend',
    description: 'Target blend boost after drinking.',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'herding',
    control: 'slider',
    advanced: true
  },

  // Perception & Alertness
  creaturePerceptionRange: {
    label: 'Perception Range',
    description: 'Base local scan radius.',
    min: 1,
    max: 20,
    step: 0.5,
    unit: 'tiles',
    category: 'perception',
    control: 'slider'
  },
  creaturePerceptionRangeMax: {
    label: 'Perception Range Max',
    description: 'Maximum effective perception range.',
    min: 1,
    max: 30,
    step: 0.5,
    unit: 'tiles',
    category: 'perception',
    control: 'slider'
  },
  creatureAlertnessBase: {
    label: 'Alertness Base',
    description: 'Baseline alertness level.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'perception',
    control: 'slider'
  },
  creatureReactionDelay: {
    label: 'Reaction Delay (s)',
    description: 'Base reaction delay after perception changes.',
    min: 0,
    max: 0.5,
    step: 0.005,
    unit: 's',
    category: 'perception',
    control: 'slider',
    advanced: true
  },

  // Memory
  creatureMemoryMaxEntries: {
    label: 'Memory Max Entries',
    description: 'Max memory entries per creature.',
    min: 0,
    max: 30,
    step: 1,
    category: 'memory',
    control: 'slider',
    advanced: true
  },
  creatureMemoryDecay: {
    label: 'Memory Decay',
    description: 'Memory decay rate per second.',
    min: 0,
    max: 0.1,
    step: 0.005,
    unit: '/s',
    category: 'memory',
    control: 'slider',
    advanced: true
  },
  creatureMemoryMinStrength: {
    label: 'Memory Min Strength',
    description: 'Threshold below which memories are removed.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'memory',
    control: 'slider',
    advanced: true
  },
  creatureMemoryMergeDistance: {
    label: 'Memory Merge Dist',
    description: 'Distance for merging nearby memories.',
    min: 0,
    max: 10,
    step: 0.1,
    unit: 'tiles',
    category: 'memory',
    control: 'slider',
    advanced: true
  },
  creatureMemoryVisitPenalty: {
    label: 'Memory Visit Penalty',
    description: 'Penalty when memory target is empty.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'memory',
    control: 'slider',
    advanced: true
  },
  creatureWaterMemoryInHerdEnabled: {
    label: 'Water Memory In Herd',
    description: 'Allow water memories while in herd.',
    type: 'boolean',
    category: 'memory'
  },

  // Movement Style
  creatureMaxTurnRateRadPerSecond: {
    label: 'Turn Rate (rad/s)',
    description: 'Max turn rate per second.',
    min: 1,
    max: 8,
    step: 0.5,
    unit: 'rad/s',
    category: 'movement',
    control: 'slider'
  },
  creatureBoundaryAvoidDistance: {
    label: 'Boundary Avoid Distance',
    description:
      'Distance from edge where avoidance begins; avoidance strength grows with quadratic proximity.',
    min: 0,
    max: 60,
    step: 1,
    unit: 'tiles',
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureBoundaryAvoidStrength: {
    label: 'Boundary Avoid Strength',
    description:
      'Controls how strongly boundary avoidance affects wandering (clamped 0–1).',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureFleeMaxTurnMultiplier: {
    label: 'Flee Max Turn Multiplier',
    description:
      'When threatened, multiplies max turn per tick to enable sharper evasive turns.',
    min: 1,
    max: 4,
    step: 0.1,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureWanderRetargetTimeMin: {
    label: 'Wander Min (s)',
    description: 'Min seconds between wander retarget.',
    min: 0.2,
    max: 10,
    step: 0.1,
    unit: 's',
    category: 'movement',
    control: 'slider'
  },
  creatureWanderRetargetTimeMax: {
    label: 'Wander Max (s)',
    description: 'Max seconds between wander retarget.',
    min: 1,
    max: 12,
    step: 0.5,
    unit: 's',
    category: 'movement',
    control: 'slider'
  },
  creatureGrazeEnabled: {
    label: 'Graze Enabled',
    description: 'Enable graze idling behavior.',
    type: 'boolean',
    category: 'movement'
  },
  creatureWanderTurnJitter: {
    label: 'Wander Turn Jitter',
    description: 'Heading jitter on wander retarget.',
    min: 0,
    max: 1,
    step: 0.02,
    unit: 'rad',
    category: 'movement',
    control: 'slider'
  },
  creatureWanderInHerdRetargetMultiplier: {
    label: 'Wander Herd Retarget Mult',
    description: 'Retarget interval multiplier in herds.',
    min: 0.1,
    max: 3,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureWanderInHerdJitterMultiplier: {
    label: 'Wander Herd Jitter Mult',
    description: 'Jitter multiplier in herds.',
    min: 0.1,
    max: 3,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureWanderInHerdHeadingBias: {
    label: 'Wander Herd Heading Bias',
    description: 'Bias toward herd heading.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureGrazeSpeedMultiplier: {
    label: 'Graze Speed Mult',
    description: 'Speed multiplier while grazing.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureSprintSpeedMultiplier: {
    label: 'Sprint Speed Multiplier',
    description: 'When sprinting, multiplies movement distance.',
    min: 0.5,
    max: 3,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureGrazeIdleSecondsMin: {
    label: 'Graze Idle Min (s)',
    description: 'Min idle time while grazing.',
    min: 0,
    max: 10,
    step: 0.5,
    unit: 's',
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureGrazeIdleSecondsMax: {
    label: 'Graze Idle Max (s)',
    description: 'Max idle time while grazing.',
    min: 0,
    max: 12,
    step: 0.5,
    unit: 's',
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureGrazeMoveSecondsMin: {
    label: 'Graze Move Min (s)',
    description: 'Min move time while grazing.',
    min: 0,
    max: 10,
    step: 0.5,
    unit: 's',
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureGrazeMoveSecondsMax: {
    label: 'Graze Move Max (s)',
    description: 'Max move time while grazing.',
    min: 0,
    max: 12,
    step: 0.5,
    unit: 's',
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureGrazeMinEnergyRatio: {
    label: 'Graze Min Energy',
    description: 'Min energy ratio to graze.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureGrazeMinWaterRatio: {
    label: 'Graze Min Water',
    description: 'Min water ratio to graze.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureGrazeMinLocalHerdSize: {
    label: 'Graze Min Herd',
    description: 'Min herd size to graze.',
    min: 1,
    max: 10,
    step: 1,
    category: 'movement',
    control: 'slider',
    advanced: true
  },

  creatureSearchRadiusMin: {
    label: 'Search Radius Min',
    description: 'Initial search radius for goals.',
    min: 2,
    max: 60,
    step: 1,
    unit: 'tiles',
    category: 'movement',
    control: 'slider'
  },
  creatureSearchRadiusMax: {
    label: 'Search Radius Max',
    description: 'Max search radius for goals.',
    min: 10,
    max: 200,
    step: 5,
    unit: 'tiles',
    category: 'movement',
    control: 'slider'
  },
  creatureSearchRadiusGrowth: {
    label: 'Search Growth',
    description: 'Multiplier when expanding search.',
    min: 1.05,
    max: 2,
    step: 0.05,
    category: 'movement',
    control: 'slider'
  },
  creatureSearchArriveDistance: {
    label: 'Search Arrive Dist',
    description: 'Distance to count search as reached.',
    min: 0.5,
    max: 5,
    step: 0.25,
    unit: 'tiles',
    category: 'movement',
    control: 'slider'
  },

  // Pack Behavior
  creaturePackEnabled: {
    label: 'Pack Enabled',
    description: 'Enable predator pack behavior.',
    type: 'boolean',
    category: 'predator'
  },
  creaturePackSpacing: {
    label: 'Pack Spacing',
    description: 'Formation spacing for followers around the leader.',
    min: 1,
    max: 12,
    step: 0.5,
    unit: 'tiles',
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePredatorPatrolRadius: {
    label: 'Patrol Radius',
    description: 'Radius for predator patrol.',
    min: 10,
    max: 50,
    step: 5,
    unit: 'tiles',
    category: 'predator',
    control: 'slider'
  },
  creaturePredatorPatrolRetargetTimeMin: {
    label: 'Patrol Retarget Min (s)',
    description: 'Min waypoint commit time before choosing a new patrol heading.',
    min: 0.25,
    max: 30,
    step: 0.25,
    unit: 's',
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePredatorPatrolRetargetTimeMax: {
    label: 'Patrol Retarget Max (s)',
    description: 'Max waypoint commit time before choosing a new patrol heading.',
    min: 0.25,
    max: 60,
    step: 0.25,
    unit: 's',
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePredatorPatrolPreySightingWeight: {
    label: 'Prey Sighting Priority',
    description: 'Chance to patrol toward remembered prey locations.',
    min: 0,
    max: 1,
    step: 0.1,
    category: 'predator',
    control: 'slider'
  },
  creaturePredatorPatrolGrassWeight: {
    label: 'Grass Area Priority',
    description: 'Chance to patrol toward high-grass areas.',
    min: 0,
    max: 1,
    step: 0.1,
    category: 'predator',
    control: 'slider'
  },
  creaturePredatorPatrolPauseDuration: {
    label: 'Patrol Pause Duration',
    description: 'Seconds predator pauses at waypoint to scan.',
    min: 0,
    max: 5,
    step: 0.5,
    unit: 's',
    category: 'predator',
    control: 'slider'
  },
  creaturePredatorPatrolMemoryDecay: {
    label: 'Patrol Memory Decay',
    description: 'How fast prey sighting memories fade.',
    min: 0.001,
    max: 0.1,
    step: 0.005,
    unit: '/s',
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePredatorPatrolMemoryMax: {
    label: 'Patrol Memory Max',
    description: 'Maximum prey sighting memories to retain.',
    min: 1,
    max: 20,
    step: 1,
    category: 'predator',
    control: 'slider',
    advanced: true
  },

  // Creatures: Behavior State Machine
  creatureBehaviorStateEnabled: {
    label: 'Behavior States Enabled',
    description: 'Enable behavior state machine (prevents rapid intent flickering).',
    type: 'boolean',
    category: 'behavior'
  },
  creatureBehaviorRelaxedPauseProbability: {
    label: 'Pause Probability',
    description: 'Chance to pause while in relaxed state.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'behavior',
    control: 'slider'
  },
  creatureBehaviorRelaxedGrazePauseRatio: {
    label: 'Graze Pause Ratio',
    description: 'How often grazing creatures pause (higher = more pauses).',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'behavior',
    control: 'slider'
  },
  creatureBehaviorRelaxedPauseMinSeconds: {
    label: 'Pause Duration Min',
    description: 'Minimum pause duration in relaxed state.',
    min: 0.5,
    max: 10,
    step: 0.5,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorRelaxedPauseMaxSeconds: {
    label: 'Pause Duration Max',
    description: 'Maximum pause duration in relaxed state.',
    min: 0.5,
    max: 15,
    step: 0.5,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorRelaxedMoveMinSeconds: {
    label: 'Move Duration Min',
    description: 'Minimum move duration before possible pause.',
    min: 1,
    max: 20,
    step: 0.5,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorRelaxedMoveMaxSeconds: {
    label: 'Move Duration Max',
    description: 'Maximum move duration before possible pause.',
    min: 1,
    max: 30,
    step: 0.5,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorAlertMinSeconds: {
    label: 'Alert Duration Min',
    description: 'Minimum time frozen in alert state.',
    min: 0.1,
    max: 5,
    step: 0.1,
    unit: 's',
    category: 'behavior',
    control: 'slider'
  },
  creatureBehaviorAlertMaxSeconds: {
    label: 'Alert Duration Max',
    description: 'Maximum time frozen in alert state.',
    min: 0.5,
    max: 10,
    step: 0.5,
    unit: 's',
    category: 'behavior',
    control: 'slider'
  },
  creatureBehaviorAlertToFleeThreshold: {
    label: 'Alert Flee Threshold',
    description: 'Distance at which alert transitions to fleeing.',
    min: 1,
    max: 20,
    step: 1,
    unit: 'tiles',
    category: 'behavior',
    control: 'slider'
  },
  creatureBehaviorHuntSpottingSeconds: {
    label: 'Hunt Spotting Duration',
    description: 'Time predator pauses when spotting prey.',
    min: 0.1,
    max: 3,
    step: 0.1,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorHuntStalkingMinSeconds: {
    label: 'Stalk Duration Min',
    description: 'Minimum stalking time before charging.',
    min: 0.5,
    max: 10,
    step: 0.5,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorHuntStalkingMaxSeconds: {
    label: 'Stalk Duration Max',
    description: 'Maximum stalking time before charging.',
    min: 1,
    max: 15,
    step: 0.5,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorHuntPounceRange: {
    label: 'Pounce Range',
    description: 'Distance at which stalking predator charges.',
    min: 1,
    max: 10,
    step: 0.5,
    unit: 'tiles',
    category: 'behavior',
    control: 'slider'
  },
  creatureBehaviorHuntStalkSpeed: {
    label: 'Stalk Speed',
    description: 'Speed multiplier during stalking phase.',
    min: 0.1,
    max: 0.8,
    step: 0.05,
    category: 'behavior',
    control: 'slider'
  },
  creatureBehaviorFeedingMinSeconds: {
    label: 'Feeding Duration Min',
    description: 'Minimum time predator stays at kill.',
    min: 1,
    max: 15,
    step: 0.5,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorFeedingMaxSeconds: {
    label: 'Feeding Duration Max',
    description: 'Maximum time predator stays at kill.',
    min: 2,
    max: 30,
    step: 1,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorSatiationThreshold: {
    label: 'Satiation Threshold',
    description: 'Energy ratio at which predators become "full".',
    min: 0.5,
    max: 1,
    step: 0.05,
    category: 'behavior',
    control: 'slider'
  },
  creatureBehaviorEnvironmentPauseEnabled: {
    label: 'Environment Pauses',
    description: 'Enable brief pauses when entering new terrain.',
    type: 'boolean',
    category: 'behavior'
  },
  creatureBehaviorEnvironmentPauseProbability: {
    label: 'Env Pause Probability',
    description: 'Chance to pause when entering new terrain type.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'behavior',
    control: 'slider',
    advanced: true
  },

  // Creatures: Reproduction
  creatureReproductionMinAge: {
    label: 'Min Repro Age (s)',
    description: 'Minimum age required to reproduce.',
    min: 0,
    max: 300,
    step: 10,
    unit: 's',
    category: 'reproduction',
    control: 'slider'
  },
  creatureReproductionMinEnergyRatio: {
    label: 'Repro Min Energy Ratio',
    description: 'Energy ratio required to reproduce.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureReproductionMinWaterRatio: {
    label: 'Repro Min Water Ratio',
    description: 'Water ratio required to reproduce.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureReproductionRange: {
    label: 'Repro Range',
    description: 'Base distance to complete mating.',
    min: 0.5,
    max: 12,
    step: 0.5,
    unit: 'tiles',
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureReproductionRangeWhileSeeking: {
    label: 'Repro Range (Seeking)',
    description: 'Mating range while in mate-seek intent.',
    min: 1,
    max: 20,
    step: 0.5,
    unit: 'tiles',
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureReproductionCooldown: {
    label: 'Repro Cooldown (s)',
    description: 'Cooldown after successful reproduction.',
    min: 0,
    max: 600,
    step: 10,
    unit: 's',
    category: 'reproduction',
    control: 'slider'
  },
  creatureReproductionFailedCooldown: {
    label: 'Repro Failed Cooldown (s)',
    description: 'Cooldown after failed conception.',
    min: 0,
    max: 120,
    step: 1,
    unit: 's',
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureReproductionFailedCostMultiplier: {
    label: 'Repro Failed Cost Mult',
    description: 'Cost multiplier on failed attempts.',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureReproductionEnergyCost: {
    label: 'Repro Energy Cost',
    description: 'Energy cost per mating attempt.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureReproductionWaterCost: {
    label: 'Repro Water Cost',
    description: 'Water cost per mating attempt.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureReproductionStaminaCost: {
    label: 'Repro Stamina Cost',
    description: 'Stamina cost per mating attempt.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureGestationTime: {
    label: 'Gestation (s)',
    description: 'Base gestation duration.',
    min: 10,
    max: 300,
    step: 5,
    unit: 's',
    category: 'reproduction',
    control: 'slider'
  },
  creatureGestationTraitEnabled: {
    label: 'Gestation Trait Enabled',
    description: 'Allow gestation trait modifiers.',
    type: 'boolean',
    category: 'reproduction'
  },
  creaturePregnancyEnabled: {
    label: 'Pregnancy Enabled',
    description: 'Enable pregnancy mode.',
    type: 'boolean',
    category: 'reproduction'
  },
  creatureConceptionChance: {
    label: 'Conception %',
    description: 'Chance of conception per mating.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'reproduction',
    control: 'slider'
  },
  creaturePregnancyMetabolismMultiplier: {
    label: 'Pregnancy Metabolism Mult',
    description: 'Metabolism multiplier while pregnant.',
    min: 0.5,
    max: 2,
    step: 0.02,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creaturePregnancyMoveSpeedMultiplier: {
    label: 'Pregnancy Move Speed Mult',
    description: 'Movement speed multiplier while pregnant.',
    min: 0.5,
    max: 1,
    step: 0.02,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creaturePregnancyMiscarriageEnabled: {
    label: 'Miscarriage Enabled',
    description: 'Enable miscarriage checks.',
    type: 'boolean',
    category: 'reproduction'
  },
  creaturePregnancyMiscarriageEnergyRatio: {
    label: 'Miscarriage Energy Ratio',
    description: 'Energy ratio below which miscarriage can occur.',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creaturePregnancyMiscarriageChancePerSecond: {
    label: 'Miscarriage chance/s',
    description: 'Miscarriage probability per second.',
    min: 0,
    max: 1,
    step: 0.05,
    unit: '/s',
    category: 'reproduction',
    control: 'slider'
  },
  creatureMateSeekingEnabled: {
    label: 'Mate Seeking Enabled',
    description: 'Enable mate-seeking intent.',
    type: 'boolean',
    category: 'reproduction'
  },
  creatureMateSeekRange: {
    label: 'Mate Seek Range',
    description: 'Range to lock onto a mate target.',
    min: 0,
    max: 80,
    step: 1,
    unit: 'tiles',
    category: 'reproduction',
    control: 'slider'
  },
  creatureMateSeekCommitTime: {
    label: 'Mate Seek Commit (s)',
    description: 'Commit time to current mate target.',
    min: 0,
    max: 5,
    step: 0.1,
    unit: 's',
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureMateSeekPriorityOverridesNeeds: {
    label: 'Mate Seek Overrides Needs',
    description: 'Allow mate seeking to override hunger/thirst.',
    type: 'boolean',
    category: 'reproduction'
  },
  creatureOffspringEnergy: {
    label: 'Offspring Energy',
    description: 'Base offspring energy before multipliers.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureOffspringWater: {
    label: 'Offspring Water',
    description: 'Base offspring water before multipliers.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureOffspringStamina: {
    label: 'Offspring Stamina',
    description: 'Base offspring stamina before multipliers.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureOffspringHp: {
    label: 'Offspring HP',
    description: 'Base offspring HP before multipliers.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureBirthChildStartingMetersFastMultiplier: {
    label: 'Birth Fast Mult',
    description: 'Multiplier for fast-gestation newborns.',
    min: 0.5,
    max: 1.5,
    step: 0.02,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureBirthChildStartingMetersSlowMultiplier: {
    label: 'Birth Slow Mult',
    description: 'Multiplier for slow-gestation newborns.',
    min: 0.5,
    max: 1.5,
    step: 0.02,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureBirthChildStartingMetersFastIfMultiplierBelow: {
    label: 'Birth Fast If <',
    description: 'Threshold for fast newborn multiplier.',
    min: 0.5,
    max: 1.5,
    step: 0.02,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureBirthChildStartingMetersSlowIfMultiplierAbove: {
    label: 'Birth Slow If >',
    description: 'Threshold for slow newborn multiplier.',
    min: 0.5,
    max: 1.5,
    step: 0.02,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },

  // Creatures: Lifespan
  creatureMaxAge: {
    label: 'Max Age (s)',
    description: 'Baseline maximum lifespan.',
    min: 60,
    max: 1800,
    step: 60,
    unit: 's',
    category: 'lifespan',
    control: 'slider'
  },

  // Creatures: Chase
  creatureChaseStartThreshold: {
    label: 'Chase Start',
    description: 'Stamina ratio to start chase.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'chase',
    control: 'slider'
  },
  creatureChaseStopThreshold: {
    label: 'Chase Stop',
    description: 'Stamina ratio to stop chase.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'chase',
    control: 'slider'
  },
  creatureChaseLoseTime: {
    label: 'Chase Lose (s)',
    description: 'Seconds before losing a target.',
    min: 0.05,
    max: 1,
    step: 0.05,
    unit: 's',
    category: 'chase',
    control: 'slider'
  },
  creatureChaseRestTime: {
    label: 'Chase Rest (s)',
    description: 'Rest time after a chase.',
    min: 0.05,
    max: 1,
    step: 0.05,
    unit: 's',
    category: 'chase',
    control: 'slider'
  },
  creatureChaseLoseDistance: {
    label: 'Lose Distance',
    description: 'Distance within which prey counts as seen (updates last seen).',
    min: 0,
    max: 60,
    step: 0.5,
    unit: 'tiles',
    category: 'chase',
    control: 'slider',
    advanced: true
  },
  creatureChaseCatchDistance: {
    label: 'Catch Distance',
    description: 'Distance at which chase concludes as caught.',
    min: 0,
    max: 10,
    step: 0.1,
    unit: 'tiles',
    category: 'chase',
    control: 'slider',
    advanced: true
  },

  // Plants & Carcasses
  grassCap: {
    label: 'Grass Cap',
    description: 'Max grass per tile.',
    min: 0.2,
    max: 3,
    step: 0.05,
    category: 'plants',
    control: 'slider'
  },
  grassInitialAmount: {
    label: 'Grass Initial Amount',
    description: 'Baseline grass at world start.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'plants',
    control: 'slider'
  },
  grassPatchBaseRatio: {
    label: 'Grass Patch Base Ratio',
    description: 'Fraction of initial grass everywhere.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  grassPatchCount: {
    label: 'Grass Patch Count',
    description: 'Number of grass patches seeded.',
    min: 0,
    max: 300,
    step: 1,
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  grassPatchMinRadius: {
    label: 'Grass Patch Min Radius',
    description: 'Min grass patch radius.',
    min: 1,
    max: 20,
    step: 1,
    unit: 'tiles',
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  grassPatchMaxRadius: {
    label: 'Grass Patch Max Radius',
    description: 'Max grass patch radius.',
    min: 1,
    max: 30,
    step: 1,
    unit: 'tiles',
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  grassPatchFalloffPower: {
    label: 'Grass Patch Falloff',
    description: 'Falloff power for grass patches.',
    min: 0.5,
    max: 4,
    step: 0.1,
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  grassRegrowthRate: {
    label: 'Grass Regrowth/s',
    description: 'Grass regrowth per second.',
    min: 0,
    max: 0.1,
    step: 0.005,
    unit: '/s',
    category: 'plants',
    control: 'slider'
  },
  grassRegrowthDiminishPower: {
    label: 'Grass Regrowth Diminish',
    description: 'Diminishing returns power near cap.',
    min: 0.1,
    max: 4,
    step: 0.1,
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  grassStressThreshold: {
    label: 'Grass Stress Threshold',
    description: 'Fullness ratio for stress growth.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  grassStressIncrease: {
    label: 'Grass Stress Increase',
    description: 'Stress gain per second.',
    min: 0,
    max: 0.1,
    step: 0.005,
    unit: '/s',
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  grassStressRecoveryRate: {
    label: 'Grass Stress Recovery',
    description: 'Stress decay per second.',
    min: 0,
    max: 0.1,
    step: 0.005,
    unit: '/s',
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  grassStressRecoveryThreshold: {
    label: 'Grass Stress Recover Thresh',
    description: 'Fullness ratio for stress recovery.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  grassStressVisibleThreshold: {
    label: 'Grass Stress Visible Thresh',
    description: 'Threshold for stressed cell counts.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  grassCoverageThreshold: {
    label: 'Grass Coverage Threshold',
    description: 'Coverage threshold for metrics.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  grassHotspotThreshold: {
    label: 'Grass Hotspot Threshold',
    description: 'Hotspot threshold for metrics.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  bushCount: {
    label: 'Bush Count',
    description: 'Number of bushes spawned.',
    min: 0,
    max: 200,
    step: 1,
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  bushInitialHealth: {
    label: 'Bush Initial Health',
    description: 'Starting bush health.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  bushRecoveryRate: {
    label: 'Bush Recovery Rate',
    description: 'Bush health recovery per second.',
    min: 0,
    max: 0.05,
    step: 0.001,
    unit: '/s',
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  bushBerryMax: {
    label: 'Bush Berry Max',
    description: 'Max berries per bush.',
    min: 1,
    max: 30,
    step: 1,
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  bushInitialBerries: {
    label: 'Bush Initial Berries',
    description: 'Starting berries per bush.',
    min: 0,
    max: 20,
    step: 1,
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  bushBerryRegenRate: {
    label: 'Berry Regen/s',
    description: 'Berry regeneration per second.',
    min: 0,
    max: 1,
    step: 0.05,
    unit: '/s',
    category: 'plants',
    control: 'slider'
  },
  carcassBaseYield: {
    label: 'Carcass Meat Yield',
    description: 'Meat spawned per kill.',
    min: 0.5,
    max: 10,
    step: 0.5,
    category: 'plants',
    control: 'slider'
  },
  carcassMaxMeatPerCell: {
    label: 'Carcass Max Meat/Cell',
    description: 'Max meat stacked per cell.',
    min: 0,
    max: 20,
    step: 1,
    category: 'plants',
    control: 'slider',
    advanced: true
  },
  carcassDecayRate: {
    label: 'Carcass Decay/s',
    description: 'Carcass decay per second.',
    min: 0,
    max: 0.1,
    step: 0.005,
    unit: '/s',
    category: 'plants',
    control: 'slider'
  },

  // Genetics
  creatureGenomeMutationRate: {
    label: 'Mutation Rate',
    description: 'Per-gene mutation probability.',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'genetics',
    control: 'slider'
  },
  creatureGenomeMutationStrength: {
    label: 'Mutation Strength',
    description: 'Mutation delta magnitude.',
    min: 0,
    max: 0.3,
    step: 0.01,
    category: 'genetics',
    control: 'slider'
  },
  creatureGenomeJitter: {
    label: 'Genome Jitter',
    description: 'Random variation for new genomes.',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureGenomePleiotropyScale: {
    label: 'Pleiotropy Scale',
    description: 'Tradeoff scale for beneficial mutations.',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureGenomeInheritanceNoise: {
    label: 'Inheritance Noise',
    description: 'Random noise during inheritance.',
    min: 0,
    max: 0.2,
    step: 0.01,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureGenomeInheritanceMixChance: {
    label: 'Inheritance Mix Chance',
    description: 'Chance to blend parent genes randomly.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureGestationMultiplier: {
    label: 'Gestation Trait Base',
    description: 'Base gestation trait multiplier.',
    min: 0.5,
    max: 1.5,
    step: 0.05,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureTradeoffSpeedToEnergyDrainScale: {
    label: 'Speed→Energy Drain',
    description: 'Speed tradeoff vs energy drain.',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureTradeoffSpeedToWaterDrainScale: {
    label: 'Speed→Water Drain',
    description: 'Speed tradeoff vs water drain.',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureTradeoffSprintToStaminaDrainScale: {
    label: 'Sprint→Stamina Drain',
    description: 'Sprint tradeoff vs stamina drain.',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureTradeoffPerceptionToReactionDelayScale: {
    label: 'Perception→Reaction Delay',
    description: 'Perception tradeoff vs reaction delay.',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureGrowthLongevityCoupling: {
    label: 'Growth Longevity Coupling',
    description: 'Coupling between growth rate and lifespan.',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },

  // Structured knobs (JSON editor)
  creatureFoodProperties: {
    label: 'Food Properties (JSON)',
    description: 'Nutrition/handling/risk by food type.',
    type: 'json',
    control: 'json',
    category: 'genetics',
    advanced: true
  },
  creatureFoodEfficiency: {
    label: 'Food Efficiency (JSON)',
    description: 'Base digestion efficiency by food type.',
    type: 'json',
    control: 'json',
    category: 'genetics',
    advanced: true
  },
  creatureTraitMultipliers: {
    label: 'Trait Multipliers (JSON)',
    description: 'Species multipliers for traits.',
    type: 'json',
    control: 'json',
    category: 'genetics',
    advanced: true
  },
  creatureGenomeDefaults: {
    label: 'Genome Defaults (JSON)',
    description: 'Default genome template per species.',
    type: 'json',
    control: 'json',
    category: 'genetics',
    advanced: true
  },
  creatureGenomeRanges: {
    label: 'Genome Ranges (JSON)',
    description: 'Optional per-gene min/max ranges.',
    type: 'json',
    control: 'json',
    category: 'genetics',
    advanced: true
  },
  creatureLifeStages: {
    label: 'Life Stages (JSON)',
    description: 'Stage thresholds and scaling.',
    type: 'json',
    control: 'json',
    category: 'lifespan',
    advanced: true
  },
  creatureTargetingPreferences: {
    label: 'Targeting Preferences (JSON)',
    description: 'Predator target weights by species.',
    type: 'json',
    control: 'json',
    category: 'predator',
    advanced: true
  },
  terrainTypes: {
    label: 'Terrain Types (JSON)',
    description: 'List of terrain ids.',
    type: 'json',
    control: 'json',
    category: 'world',
    advanced: true
  }
};

// ============================================================================
// CONFIG PRESETS
// ============================================================================

/**
 * Preset configurations for different behavior styles.
 * Each preset overrides specific config values to create a distinct experience.
 */
export const CONFIG_PRESETS = {
  /**
   * Natural - Default, balanced for realistic behavior.
   * Moderate speeds, natural pauses, balanced herding.
   */
  natural: {
    name: 'Natural',
    description: 'Default balanced settings for realistic creature behavior.',
    values: {
      // Movement physics
      creatureAcceleration: 0.15,
      creatureDeceleration: 0.12,
      creatureFrictionDrag: 0.02,
      creatureAngularAcceleration: 0.08,
      creatureSpeedTurnPenalty: 0.6,

      // Intent speeds
      creatureIntentSpeedWander: 0.4,
      creatureIntentSpeedGraze: 0.25,
      creatureIntentSpeedSeek: 0.7,
      creatureIntentSpeedMate: 0.6,
      creatureIntentSpeedHunt: 0.85,
      creatureIntentSpeedHuntChase: 1.0,

      // Simple herding
      creatureHerdingSimpleMode: true,
      creatureSimpleHerdingSeparationRadius: 2.5,
      creatureSimpleHerdingAlignmentRadius: 7,
      creatureSimpleHerdingCohesionRadius: 11,
      creatureSimpleHerdingSeparationStrength: 1.2,
      creatureSimpleHerdingAlignmentStrength: 0.8,
      creatureSimpleHerdingCohesionStrength: 0.5,

      // Behavior states
      creatureBehaviorStateEnabled: true,
      creatureBehaviorRelaxedPauseProbability: 0.4,
      creatureBehaviorRelaxedGrazePauseRatio: 0.65,
      creatureBehaviorAlertMinSeconds: 0.5,
      creatureBehaviorAlertMaxSeconds: 1.5,

      // Hunting
      creatureBehaviorHuntStalkSpeed: 0.35,
      creatureBehaviorHuntPounceRange: 3.5
    }
  },

  /**
   * Calm - Slower speeds, longer pauses, relaxed herds.
   * More contemplative, peaceful atmosphere.
   */
  calm: {
    name: 'Calm',
    description: 'Slower, more peaceful behavior with longer pauses and relaxed herds.',
    values: {
      // Movement physics - slower and smoother
      creatureAcceleration: 0.10,
      creatureDeceleration: 0.08,
      creatureFrictionDrag: 0.03,
      creatureAngularAcceleration: 0.06,
      creatureSpeedTurnPenalty: 0.7,

      // Intent speeds - all reduced
      creatureIntentSpeedWander: 0.3,
      creatureIntentSpeedGraze: 0.2,
      creatureIntentSpeedSeek: 0.55,
      creatureIntentSpeedMate: 0.45,
      creatureIntentSpeedHunt: 0.65,
      creatureIntentSpeedHuntChase: 0.85,

      // Simple herding - looser, more spread out
      creatureHerdingSimpleMode: true,
      creatureSimpleHerdingSeparationRadius: 3.5,
      creatureSimpleHerdingAlignmentRadius: 9,
      creatureSimpleHerdingCohesionRadius: 14,
      creatureSimpleHerdingSeparationStrength: 1.0,
      creatureSimpleHerdingAlignmentStrength: 0.6,
      creatureSimpleHerdingCohesionStrength: 0.35,

      // Behavior states - longer pauses
      creatureBehaviorStateEnabled: true,
      creatureBehaviorRelaxedPauseProbability: 0.55,
      creatureBehaviorRelaxedGrazePauseRatio: 0.75,
      creatureBehaviorRelaxedPauseMinSeconds: 2.0,
      creatureBehaviorRelaxedPauseMaxSeconds: 6.0,
      creatureBehaviorRelaxedMoveMinSeconds: 4.0,
      creatureBehaviorRelaxedMoveMaxSeconds: 12.0,
      creatureBehaviorAlertMinSeconds: 0.8,
      creatureBehaviorAlertMaxSeconds: 2.0,

      // Hunting - slower stalking
      creatureBehaviorHuntStalkSpeed: 0.25,
      creatureBehaviorHuntPounceRange: 3.0,
      creatureBehaviorHuntStalkingMinSeconds: 3.0,
      creatureBehaviorHuntStalkingMaxSeconds: 7.0
    }
  },

  /**
   * Intense - Faster action, aggressive predators, tighter herds.
   * More dynamic and exciting action.
   */
  intense: {
    name: 'Intense',
    description: 'Faster action with aggressive predators and tight, reactive herds.',
    values: {
      // Movement physics - snappier
      creatureAcceleration: 0.22,
      creatureDeceleration: 0.18,
      creatureFrictionDrag: 0.015,
      creatureAngularAcceleration: 0.12,
      creatureSpeedTurnPenalty: 0.45,

      // Intent speeds - faster
      creatureIntentSpeedWander: 0.55,
      creatureIntentSpeedGraze: 0.35,
      creatureIntentSpeedSeek: 0.85,
      creatureIntentSpeedMate: 0.75,
      creatureIntentSpeedHunt: 1.0,
      creatureIntentSpeedHuntChase: 1.2,

      // Simple herding - tighter groups
      creatureHerdingSimpleMode: true,
      creatureSimpleHerdingSeparationRadius: 2.0,
      creatureSimpleHerdingAlignmentRadius: 5,
      creatureSimpleHerdingCohesionRadius: 8,
      creatureSimpleHerdingSeparationStrength: 1.5,
      creatureSimpleHerdingAlignmentStrength: 1.0,
      creatureSimpleHerdingCohesionStrength: 0.7,

      // Threat response - stronger
      creatureSimpleHerdingThreatRange: 15,
      creatureSimpleHerdingThreatStrength: 2.0,
      creatureThreatPropagationRadius: 12,

      // Behavior states - shorter pauses
      creatureBehaviorStateEnabled: true,
      creatureBehaviorRelaxedPauseProbability: 0.25,
      creatureBehaviorRelaxedGrazePauseRatio: 0.45,
      creatureBehaviorRelaxedPauseMinSeconds: 0.5,
      creatureBehaviorRelaxedPauseMaxSeconds: 2.0,
      creatureBehaviorRelaxedMoveMinSeconds: 2.0,
      creatureBehaviorRelaxedMoveMaxSeconds: 5.0,
      creatureBehaviorAlertMinSeconds: 0.3,
      creatureBehaviorAlertMaxSeconds: 0.8,

      // Hunting - aggressive
      creatureBehaviorHuntStalkSpeed: 0.5,
      creatureBehaviorHuntPounceRange: 4.5,
      creatureBehaviorHuntStalkingMinSeconds: 1.0,
      creatureBehaviorHuntStalkingMaxSeconds: 3.0,
      creatureBehaviorHuntSpottingSeconds: 0.4
    }
  },

  /**
   * Classic - Disables new systems, approximates original behavior.
   * For users who prefer the pre-overhaul feel.
   */
  classic: {
    name: 'Classic',
    description: 'Disables new behavior systems for a simpler, original-style experience.',
    values: {
      // Movement physics - more instant
      creatureAcceleration: 0.5,
      creatureDeceleration: 0.5,
      creatureFrictionDrag: 0.005,
      creatureAngularAcceleration: 0.3,
      creatureSpeedTurnPenalty: 0.3,

      // Intent speeds - uniform
      creatureIntentSpeedWander: 0.6,
      creatureIntentSpeedGraze: 0.35,
      creatureIntentSpeedSeek: 0.8,
      creatureIntentSpeedMate: 0.7,
      creatureIntentSpeedHunt: 0.9,
      creatureIntentSpeedHuntChase: 1.0,

      // Use complex herding (original)
      creatureHerdingSimpleMode: false,

      // Behavior states - disabled/minimal
      creatureBehaviorStateEnabled: false,
      creatureBehaviorRelaxedPauseProbability: 0,
      creatureBehaviorEnvironmentPauseEnabled: false
    }
  }
};

/**
 * Applies a preset configuration to the given config object.
 * @param {object} config - The config object to modify
 * @param {string} presetName - Name of the preset to apply
 * @returns {object} The modified config object
 */
export function applyPreset(config, presetName) {
  const preset = CONFIG_PRESETS[presetName];
  if (!preset) {
    console.warn(`[config] Unknown preset: ${presetName}`);
    return config;
  }

  const newConfig = { ...config };
  for (const [key, value] of Object.entries(preset.values)) {
    if (key in simConfig) {
      newConfig[key] = value;
    }
  }

  return newConfig;
}

/**
 * Gets the list of available preset names.
 */
export function getPresetNames() {
  return Object.keys(CONFIG_PRESETS);
}

/**
 * Gets preset information.
 */
export function getPresetInfo(presetName) {
  const preset = CONFIG_PRESETS[presetName];
  if (!preset) return null;
  return {
    name: preset.name,
    description: preset.description
  };
}

// ============================================================================
// CONFIG VALIDATION
// ============================================================================

const warnConfigMetaMismatch = () => {
  const configKeys = new Set(Object.keys(simConfig));
  const metaKeys = new Set(Object.keys(configMeta));
  const extraMetaKeys = [...metaKeys].filter((key) => !configKeys.has(key));
  const missingMetaKeys = [...configKeys].filter((key) => !metaKeys.has(key));

  if (extraMetaKeys.length > 0) {
    console.warn(
      `[config] configMeta contains keys not in simConfig: ${extraMetaKeys.join(', ')}`
    );
  }
  if (missingMetaKeys.length > 0) {
    console.warn(
      `[config] simConfig contains keys missing configMeta: ${missingMetaKeys.join(', ')}`
    );
  }
};

const isDev =
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

if (isDev) {
  warnConfigMetaMismatch();
}
