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
  creatureGrazeEnabled: true,
  creatureGrazeSpeedMultiplier: 0.35,
  creatureGrazeIdleSecondsMin: 1.5,
  creatureGrazeIdleSecondsMax: 4.0,
  creatureGrazeMoveSecondsMin: 1.0,
  creatureGrazeMoveSecondsMax: 3.0,
  creatureGrazeMinEnergyRatio: 0.75,
  creatureGrazeMinWaterRatio: 0.75,
  creatureGrazeMinLocalHerdSize: 3,

  // Long-range need search (when no target is perceived or remembered)
  creatureSearchRadiusMin: 12, // tiles
  creatureSearchRadiusMax: 90, // tiles
  creatureSearchRadiusGrowth: 1.35, // multiplier per failed attempt
  creatureSearchArriveDistance: 1.25, // tiles (distance to consider target reached)

  // === CREATURES: HERDING ===
  // Only herbivores (squares, circles) herd - predators hunt independently
  creatureHerdingEnabled: true,
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
  // Pack relocation (triangles/octagons)
  creaturePackRelocationEnabled: true,
  creaturePackRelocateAfterSeconds: 20, // how long “stale” before relocating
  creaturePackRelocateMinDistance: 25, // new home must be meaningfully far
  creaturePackRelocateSearchRadius: 80, // how far leader can look for new home
  creaturePackRelocateSampleAttempts: 20, // random samples to find viable land tile
  creaturePackRelocateAvoidWater: true,

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
  ticksPerSecond: { label: 'Ticks/Second', min: 1, max: 120, step: 1, category: 'simulation' },

  // World
  terrainWaterCoverageMultiplier: {
    label: 'Water Coverage Mult',
    min: 0.1,
    max: 1,
    step: 0.05,
    category: 'world'
  },

  // Creatures: Base Stats
  creatureCount: { label: 'Creature Count', min: 0, max: 500, step: 10, category: 'creatures' },
  creaturePredatorCount: {
    label: 'Predator Count',
    min: 0,
    max: 50,
    step: 1,
    category: 'creatures'
  },
  creatureSpawnSpeciesAnchorSpread: {
    label: 'Spawn Species Spread',
    min: 0,
    max: 60,
    step: 1,
    category: 'creatures'
  },
  creatureSpawnPredatorAnchorDistance: {
    label: 'Predator Spawn Dist',
    min: 0,
    max: 200,
    step: 2,
    category: 'creatures'
  },
  creatureBaseSpeed: { label: 'Base Speed', min: 1, max: 30, step: 1, category: 'creatures' },
  creatureBaseEnergy: { label: 'Base Energy', min: 0.1, max: 5, step: 0.1, category: 'creatures' },
  creatureBaseWater: { label: 'Base Water', min: 0.1, max: 5, step: 0.1, category: 'creatures' },

  // Creatures: Metabolism
  creatureBasalEnergyDrain: {
    label: 'Energy Drain/s',
    min: 0,
    max: 0.1,
    step: 0.001,
    category: 'metabolism'
  },
  creatureBasalWaterDrain: {
    label: 'Water Drain/s',
    min: 0,
    max: 0.1,
    step: 0.001,
    category: 'metabolism'
  },
  creatureSprintStaminaDrain: {
    label: 'Sprint Drain/s',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'metabolism'
  },
  creatureStaminaRegen: {
    label: 'Stamina Regen/s',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'metabolism'
  },
  creatureEatAmount: { label: 'Eat Amount/s', min: 0.1, max: 2, step: 0.1, category: 'metabolism' },
  creatureDrinkAmount: {
    label: 'Drink Amount/s',
    min: 0.1,
    max: 2,
    step: 0.1,
    category: 'metabolism'
  },
  creatureDrinkConcernMargin: {
    label: 'Drink Concern Margin',
    min: 0,
    max: 0.35,
    step: 0.01,
    category: 'metabolism'
  },

  // Predator Behavior
  creaturePredatorRestThreshold: {
    label: 'Rest When Energy >',
    min: 0.3,
    max: 1,
    step: 0.05,
    category: 'predator'
  },
  creaturePredatorHuntThreshold: {
    label: 'Hunt When Energy <',
    min: 0.1,
    max: 0.8,
    step: 0.05,
    category: 'predator'
  },
  creatureTargetingRange: {
    label: 'Targeting Range',
    min: 5,
    max: 30,
    step: 1,
    category: 'predator'
  },

  // Herding Behavior
  creatureHerdingStrength: {
    label: 'Herd Cohesion',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'herding'
  },
  creatureHerdingAlignmentStrength: {
    label: 'Herd Alignment',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'herding'
  },
  creatureHerdingThreatRange: {
    label: 'Threat Detect Range',
    min: 2,
    max: 20,
    step: 1,
    category: 'herding'
  },
  creatureHerdingThreatStrength: {
    label: 'Flee Strength',
    min: 0,
    max: 0.5,
    step: 0.05,
    category: 'herding'
  },
  creatureHerdingIdealDistance: {
    label: 'Herd Spacing',
    min: 2,
    max: 10,
    step: 0.5,
    category: 'herding'
  },
  creatureHerdingRange: {
    label: 'Herd Range',
    min: 4,
    max: 30,
    step: 1,
    category: 'herding'
  },
  creatureHerdingSeparation: {
    label: 'Herd Separation',
    min: 1,
    max: 6,
    step: 0.2,
    category: 'herding'
  },
  creatureHerdingComfortMax: {
    label: 'Herd Comfort Max',
    min: 2,
    max: 12,
    step: 0.5,
    category: 'herding'
  },
  creatureHerdingSeparationMultiplier: {
    label: 'Separation Multiplier',
    min: 0.5,
    max: 4,
    step: 0.1,
    category: 'herding'
  },
  creatureHerdingOffsetDeadzone: {
    label: 'Offset Deadzone',
    min: 0,
    max: 0.2,
    step: 0.01,
    category: 'herding'
  },
  creatureHerdingOffsetSmoothing: {
    label: 'Offset Smoothing',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'herding'
  },
  creatureHerdingHeadingBlendMax: {
    label: 'Herd Heading Blend',
    min: 0,
    max: 0.5,
    step: 0.05,
    category: 'herding'
  },
  creatureHerdingTargetBlendEnabled: {
    label: 'Target Blend Enabled',
    min: 0,
    max: 1,
    step: 1,
    category: 'herding'
  },
  creatureHerdingTargetBlendMax: {
    label: 'Target Blend Max',
    min: 0,
    max: 0.35,
    step: 0.01,
    category: 'herding'
  },
  creatureHerdingTargetBlendIsolationBoost: {
    label: 'Isolation Boost',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'herding'
  },
  creatureHerdingUseWorker: {
    label: 'Herding Worker',
    min: 0,
    max: 1,
    step: 1,
    category: 'herding'
  },
  creatureHerdingRegroupEnabled: {
    label: 'Regroup Assist',
    min: 0,
    max: 1,
    step: 1,
    category: 'herding'
  },
  creatureHerdingRegroupMinLocalHerdSize: {
    label: 'Regroup Min Herd',
    min: 1,
    max: 10,
    step: 1,
    category: 'herding'
  },
  creatureHerdingRegroupRange: {
    label: 'Regroup Range',
    min: 5,
    max: 120,
    step: 1,
    category: 'herding'
  },
  creatureHerdingRegroupStrength: {
    label: 'Regroup Strength',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'herding'
  },
  creatureHerdingRegroupIntervalSeconds: {
    label: 'Regroup Interval (s)',
    min: 0.1,
    max: 5,
    step: 0.1,
    category: 'herding'
  },
  creatureHerdingAnchorEnabled: {
    label: 'Anchor Enabled',
    min: 0,
    max: 1,
    step: 1,
    category: 'herding'
  },
  creatureHerdingAnchorEvalSeconds: {
    label: 'Anchor Eval (s)',
    min: 0.25,
    max: 6,
    step: 0.25,
    category: 'herding'
  },
  creatureHerdingAnchorCooldownSeconds: {
    label: 'Anchor Cooldown (s)',
    min: 0.25,
    max: 6,
    step: 0.25,
    category: 'herding'
  },
  creatureHerdingAnchorSearchRadius: {
    label: 'Anchor Search Radius',
    min: 5,
    max: 120,
    step: 1,
    category: 'herding'
  },
  creatureHerdingAnchorCandidateCount: {
    label: 'Anchor Candidates',
    min: 1,
    max: 40,
    step: 1,
    category: 'herding'
  },
  creatureHerdingAnchorDriftSpeed: {
    label: 'Anchor Drift Speed',
    min: 0,
    max: 10,
    step: 0.1,
    category: 'herding'
  },
  creatureHerdingAnchorPullStrength: {
    label: 'Anchor Pull Strength',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'herding'
  },
  creatureHerdingAnchorSoftRadiusBase: {
    label: 'Anchor Soft Radius Base',
    min: 5,
    max: 120,
    step: 1,
    category: 'herding'
  },
  creatureHerdingAnchorSoftRadiusScale: {
    label: 'Anchor Soft Radius Scale',
    min: 0.1,
    max: 3,
    step: 0.05,
    category: 'herding'
  },
  creatureHerdingAnchorMaxInfluenceDistance: {
    label: 'Anchor Max Influence',
    min: 5,
    max: 120,
    step: 1,
    category: 'herding'
  },
  creatureHerdingAnchorFoodSampleRadius: {
    label: 'Anchor Food Radius',
    min: 5,
    max: 120,
    step: 1,
    category: 'herding'
  },
  creatureHerdingAnchorWaterSearchMax: {
    label: 'Anchor Water Search',
    min: 5,
    max: 120,
    step: 1,
    category: 'herding'
  },
  creatureHerdingAnchorThreatHalfLifeSeconds: {
    label: 'Anchor Threat Half-Life (s)',
    min: 1,
    max: 30,
    step: 0.5,
    category: 'herding'
  },
  creatureHerdingAnchorSwitchMargin: {
    label: 'Anchor Switch Margin',
    min: 0.1,
    max: 1,
    step: 0.05,
    category: 'herding'
  },
  creatureHerdingAnchorRandomness: {
    label: 'Anchor Randomness',
    min: 0,
    max: 0.25,
    step: 0.01,
    category: 'herding'
  },
  creatureWaterRendezvousEnabled: {
    label: 'Water Rendezvous',
    min: 0,
    max: 1,
    step: 1,
    category: 'herding'
  },
  creatureWaterRendezvousEvalSeconds: {
    label: 'Water Rendezvous Eval (s)',
    min: 0.25,
    max: 12,
    step: 0.25,
    category: 'herding'
  },
  creatureWaterRendezvousCooldownSeconds: {
    label: 'Water Rendezvous Cooldown (s)',
    min: 0.25,
    max: 12,
    step: 0.25,
    category: 'herding'
  },
  creatureWaterRendezvousSearchRadius: {
    label: 'Water Rendezvous Radius',
    min: 5,
    max: 120,
    step: 1,
    category: 'herding'
  },
  creatureWaterRendezvousCandidateCount: {
    label: 'Water Rendezvous Candidates',
    min: 4,
    max: 32,
    step: 1,
    category: 'herding'
  },
  creatureWaterRendezvousThirstPressureThreshold: {
    label: 'Water Rendezvous Pressure',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'herding'
  },
  creatureWaterRendezvousMaxDistance: {
    label: 'Water Rendezvous Max Dist',
    min: 5,
    max: 120,
    step: 1,
    category: 'herding'
  },
  creatureWaterRendezvousPreferHerdAnchor: {
    label: 'Water Rendezvous Anchor',
    min: 0,
    max: 1,
    step: 1,
    category: 'herding'
  },
  creatureWaterRendezvousCommitSeconds: {
    label: 'Water Rendezvous Commit (s)',
    min: 0.25,
    max: 12,
    step: 0.25,
    category: 'herding'
  },
  creaturePostDrinkRegroupSeconds: {
    label: 'Post-Drink Regroup (s)',
    min: 0.25,
    max: 12,
    step: 0.25,
    category: 'herding'
  },
  creaturePostDrinkRegroupAnchorBoost: {
    label: 'Post-Drink Anchor Boost',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'herding'
  },
  creaturePostDrinkRegroupDeadzoneMultiplier: {
    label: 'Post-Drink Deadzone Mult',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'herding'
  },
  creaturePostDrinkRegroupTargetBlendBoost: {
    label: 'Post-Drink Target Blend',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'herding'
  },

  // Memory
  creatureWaterMemoryInHerdEnabled: {
    label: 'Water Memory In Herd',
    min: 0,
    max: 1,
    step: 1,
    category: 'memory'
  },

  // Movement Style
  creatureMaxTurnRateRadPerSecond: {
    label: 'Turn Rate (rad/s)',
    min: 1,
    max: 8,
    step: 0.5,
    category: 'movement'
  },
  creatureWanderRetargetTimeMin: {
    label: 'Wander Min (s)',
    min: 0.2,
    max: 10,
    step: 0.1,
    category: 'movement'
  },
  creatureWanderRetargetTimeMax: {
    label: 'Wander Max (s)',
    min: 1,
    max: 12,
    step: 0.5,
    category: 'movement'
  },
  creatureGrazeEnabled: {
    label: 'Graze Enabled',
    min: 0,
    max: 1,
    step: 1,
    category: 'movement'
  },
  creatureWanderTurnJitter: {
    label: 'Wander Turn Jitter',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'movement'
  },
  creatureWanderInHerdRetargetMultiplier: {
    label: 'Wander Herd Retarget Mult',
    min: 0.1,
    max: 3,
    step: 0.05,
    category: 'movement'
  },
  creatureWanderInHerdJitterMultiplier: {
    label: 'Wander Herd Jitter Mult',
    min: 0.1,
    max: 3,
    step: 0.05,
    category: 'movement'
  },
  creatureWanderInHerdHeadingBias: {
    label: 'Wander Herd Heading Bias',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'movement'
  },
  creatureGrazeSpeedMultiplier: {
    label: 'Graze Speed Mult',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'movement'
  },
  creatureGrazeIdleSecondsMin: {
    label: 'Graze Idle Min (s)',
    min: 0,
    max: 10,
    step: 0.5,
    category: 'movement'
  },
  creatureGrazeIdleSecondsMax: {
    label: 'Graze Idle Max (s)',
    min: 0,
    max: 12,
    step: 0.5,
    category: 'movement'
  },
  creatureGrazeMoveSecondsMin: {
    label: 'Graze Move Min (s)',
    min: 0,
    max: 10,
    step: 0.5,
    category: 'movement'
  },
  creatureGrazeMoveSecondsMax: {
    label: 'Graze Move Max (s)',
    min: 0,
    max: 12,
    step: 0.5,
    category: 'movement'
  },
  creatureGrazeMinEnergyRatio: {
    label: 'Graze Min Energy',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'movement'
  },
  creatureGrazeMinWaterRatio: {
    label: 'Graze Min Water',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'movement'
  },
  creatureGrazeMinLocalHerdSize: {
    label: 'Graze Min Herd',
    min: 1,
    max: 10,
    step: 1,
    category: 'movement'
  },

  creatureSearchRadiusMin: {
    label: 'Search Radius Min',
    min: 2,
    max: 60,
    step: 1,
    category: 'movement'
  },
  creatureSearchRadiusMax: {
    label: 'Search Radius Max',
    min: 10,
    max: 200,
    step: 5,
    category: 'movement'
  },
  creatureSearchRadiusGrowth: {
    label: 'Search Growth',
    min: 1.05,
    max: 2,
    step: 0.05,
    category: 'movement'
  },
  creatureSearchArriveDistance: {
    label: 'Search Arrive Dist',
    min: 0.5,
    max: 5,
    step: 0.25,
    category: 'movement'
  },

  // Pack Behavior
  creaturePackEnabled: {
    label: 'Pack Enabled',
    min: 0,
    max: 1,
    step: 1,
    category: 'predator'
  },
  creaturePredatorPatrolRadius: {
    label: 'Patrol Radius',
    min: 10,
    max: 50,
    step: 5,
    category: 'predator'
  },

  // Creatures: Reproduction
  creatureReproductionMinAge: {
    label: 'Min Repro Age (s)',
    min: 0,
    max: 300,
    step: 10,
    category: 'reproduction'
  },
  creatureReproductionCooldown: {
    label: 'Repro Cooldown (s)',
    min: 0,
    max: 600,
    step: 10,
    category: 'reproduction'
  },
  creatureGestationTime: {
    label: 'Gestation (s)',
    min: 10,
    max: 300,
    step: 5,
    category: 'reproduction'
  },
  creatureConceptionChance: {
    label: 'Conception %',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'reproduction'
  },
  creaturePregnancyMiscarriageChancePerSecond: {
    label: 'Miscarriage chance/s',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'reproduction'
  },

  // Creatures: Lifespan
  creatureMaxAge: { label: 'Max Age (s)', min: 60, max: 1800, step: 60, category: 'lifespan' },

  // Creatures: Chase
  creatureChaseStartThreshold: {
    label: 'Chase Start',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'chase'
  },
  creatureChaseStopThreshold: {
    label: 'Chase Stop',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'chase'
  },
  creatureChaseLoseTime: {
    label: 'Chase Lose (s)',
    min: 0.05,
    max: 1,
    step: 0.05,
    category: 'chase'
  },
  creatureChaseRestTime: {
    label: 'Chase Rest (s)',
    min: 0.05,
    max: 1,
    step: 0.05,
    category: 'chase'
  },

  // Plants & Carcasses
  grassRegrowthRate: {
    label: 'Grass Regrowth/s',
    min: 0,
    max: 0.1,
    step: 0.005,
    category: 'plants'
  },
  bushBerryRegenRate: { label: 'Berry Regen/s', min: 0, max: 1, step: 0.05, category: 'plants' },
  carcassBaseYield: {
    label: 'Carcass Meat Yield',
    min: 0.5,
    max: 10,
    step: 0.5,
    category: 'plants'
  },
  carcassDecayRate: { label: 'Carcass Decay/s', min: 0, max: 0.1, step: 0.005, category: 'plants' },

  // Genetics
  creatureGenomeMutationRate: {
    label: 'Mutation Rate',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'genetics'
  },
  creatureGenomeMutationStrength: {
    label: 'Mutation Strength',
    min: 0,
    max: 0.3,
    step: 0.01,
    category: 'genetics'
  }
};
