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
  creatureSpawnRetries: 20,
  creatureSpawnAnchorRetries: 30,
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
