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
  worldHeight: 80,
  defaultTerrain: 'plains',
  waterTerrain: 'water',
  shoreTerrain: 'shore',
  terrainTypes: ['plains', 'forest', 'rock', 'sand', 'shore', 'water'],
  terrainBlobCount: 72,
  terrainBlobMinRadius: 2,
  terrainBlobMaxRadius: 6,
  waterCorridorCount: 12,
  waterCorridorMinLength: 10,
  waterCorridorMaxLength: 22,
  waterCorridorWidth: 3,
  waterCorridorTurnChance: 0.35,

  // === PLANTS: GRASS ===
  grassCap: 1,
  grassRegrowthRate: 0.02, // per second
  grassRegrowthDiminishPower: 1.5,
  grassInitialAmount: 0.2,
  grassPatchCount: 112,
  grassPatchMinRadius: 2,
  grassPatchMaxRadius: 7,
  grassPatchFalloffPower: 1.6,
  grassPatchBaseRatio: 0.15,
  grassStressThreshold: 0.15,
  grassStressIncrease: 0.02,
  grassStressRecoveryRate: 0.015,
  grassStressRecoveryThreshold: 0.35,
  grassStressVisibleThreshold: 0.1,
  grassCoverageThreshold: 0.1,
  grassHotspotThreshold: 0.75,

  // === PLANTS: BUSHES ===
  bushCount: 96,
  bushInitialHealth: 0.85,
  bushBerryMax: 12,
  bushInitialBerries: 6,
  bushRecoveryRate: 0.01,
  bushBerryRegenRate: 0.25,

  // === PLANTS: CARCASSES ===
  carcassBaseYield: 0.8,
  carcassMaxMeatPerCell: 2,
  carcassDecayRate: 0.02,

  // === CREATURES: SPAWNING ===
  creatureCount: 80,
  creatureSpawnClusterSpread: 12,
  creatureSpawnClusterJitter: 4,

  // === CREATURES: BASE STATS ===
  creatureBaseEnergy: 1,
  creatureBaseWater: 1,
  creatureBaseStamina: 1,
  creatureBaseHp: 1,
  creatureBaseSpeed: 9, // tiles per second

  // === CREATURES: PERCEPTION & ALERTNESS ===
  creaturePerceptionRange: 4,
  creaturePerceptionRangeMax: 7,
  creatureAlertnessBase: 0.55,
  creatureReactionDelay: 0.033, // seconds (was 2 ticks at 60 TPS)

  // === CREATURES: TARGETING & CHASE ===
  creatureTargetingRange: 5,
  creatureTargetingDistanceWeight: 0.12,
  creatureTargetingPreferences: {
    triangle: { circle: 1, octagon: 0.85 },
    octagon: { square: 1 }
  },
  creatureChaseStartThreshold: 0.6,
  creatureChaseStopThreshold: 0.25,
  creatureChaseLoseDistance: 6,
  creatureChaseLoseTime: 0.1, // seconds (was 6 ticks at 60 TPS)
  creatureChaseCatchDistance: 0.6,
  creatureChaseRestTime: 0.1, // seconds (was 6 ticks at 60 TPS)

  // === CREATURES: MEMORY ===
  creatureMemoryMaxEntries: 12,
  creatureMemoryDecay: 0.02, // per second
  creatureMemoryMinStrength: 0.05,
  creatureMemoryMergeDistance: 1.5,
  creatureMemoryVisitPenalty: 0.5,

  // === CREATURES: METABOLISM ===
  creatureBasalEnergyDrain: 0.008, // per second
  creatureBasalWaterDrain: 0.01, // per second
  creatureBasalStaminaDrain: 0.004, // per second

  // === CREATURES: SPRINT ===
  creatureSprintStartThreshold: 0.7,
  creatureSprintStopThreshold: 0.4,
  creatureSprintSpeedMultiplier: 1.6,
  creatureSprintStaminaDrain: 0.3, // per second
  creatureStaminaRegen: 0.18, // per second

  // === CREATURES: REPRODUCTION ===
  creatureReproductionMinAge: 90, // seconds until reproductive maturity
  creatureReproductionMinEnergyRatio: 0.8,
  creatureReproductionMinWaterRatio: 0.8,
  creatureReproductionCooldown: 180, // seconds between reproduction attempts
  creatureReproductionFailedCooldown: 20, // seconds cooldown when conception fails
  creatureReproductionFailedCostMultiplier: 0.5,
  creatureReproductionRange: 2.5,

  // === CREATURES: SEX & PREGNANCY ===
  creatureSexEnabled: true,
  creaturePregnancyEnabled: true,
  creatureSexInitialSplitMode: 'exact',
  creatureConceptionChance: 0.5,
  creatureGestationTime: 60, // seconds (was 3600 ticks at 60 TPS)
  creatureGestationTraitEnabled: true,
  creaturePregnancyMetabolismMultiplier: 1.15,
  creaturePregnancyMoveSpeedMultiplier: 0.9,
  creaturePregnancyMiscarriageEnabled: true,
  creaturePregnancyMiscarriageEnergyRatio: 0.15,
  creaturePregnancyMiscarriageChancePerTick: 0.01,

  // === CREATURES: MATE SEEKING ===
  creatureMateSeekingEnabled: true,
  creatureMateSeekRange: 25,
  creatureMateSeekCommitTime: 1, // seconds (was 60 ticks at 60 TPS)
  creatureReproductionRangeWhileSeeking: 6,
  creatureMateSeekPriorityOverridesNeeds: false,

  // === CREATURES: OFFSPRING ===
  creatureBirthChildStartingMetersFastMultiplier: 0.85,
  creatureBirthChildStartingMetersSlowMultiplier: 1.1,
  creatureBirthChildStartingMetersFastIfMultiplierBelow: 0.9,
  creatureBirthChildStartingMetersSlowIfMultiplierAbove: 1.1,
  creatureReproductionEnergyCost: 0.2,
  creatureReproductionWaterCost: 0.15,
  creatureReproductionStaminaCost: 0.05,
  creatureOffspringEnergy: 0.6,
  creatureOffspringWater: 0.6,
  creatureOffspringStamina: 0.6,
  creatureOffspringHp: 0.8,

  // === CREATURES: NEEDS & EATING ===
  creatureNeedSwitchMargin: 0.05,
  creatureDrinkThreshold: 0.8,
  creatureDrinkAmount: 0.6, // per second
  creatureEatThreshold: 0.8,
  creatureEatAmount: 0.5, // per second
  creatureGrassEatMin: 0.05,
  creatureBerryEatMin: 0.1,

  // === CREATURES: FOOD PROPERTIES ===
  creatureFoodProperties: {
    grass: { nutrition: 1, handling: 1, risk: 0.02 },
    berries: { nutrition: 1.1, handling: 1, risk: 0.04 },
    meat: { nutrition: 1.35, handling: 1.1, risk: 0.12 }
  },
  creatureFoodEfficiency: {
    grass: 1,
    berries: 1,
    meat: 1
  },
  creatureTraitMultipliers: {
    square: {
      foodEfficiency: { berries: 1.25, grass: 0.75, meat: 0.65 }
    },
    triangle: {
      foodEfficiency: { meat: 1.25, grass: 0.7, berries: 0.7 }
    },
    circle: {
      foodEfficiency: { grass: 1.25, berries: 0.8, meat: 0.6 }
    },
    octagon: {
      foodEfficiency: { meat: 1.2, grass: 0.75, berries: 0.7 }
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
      berryEatMin: 0.5
    },
    square: {},
    triangle: {},
    circle: {},
    octagon: {}
  },
  creatureGenomeJitter: 0.08,
  creatureGenomeMutationRate: 0.18,
  creatureGenomeMutationStrength: 0.1,
  creatureGenomePleiotropyScale: 0.18,

  // === CREATURES: LIFESPAN ===
  creatureMaxAge: 600, // seconds (600s = 10 minutes)
  creatureLifeStages: [
    {
      id: 'juvenile',
      label: 'Juvenile',
      minAge: 0, // seconds
      movementScale: 0.85,
      metabolismScale: 0.9
    },
    {
      id: 'adult',
      label: 'Adult',
      minAge: 120, // seconds
      movementScale: 1,
      metabolismScale: 1
    },
    {
      id: 'elder',
      label: 'Elder',
      minAge: 300, // seconds
      movementScale: 0.75,
      metabolismScale: 1.1
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

  // Creatures: Base Stats
  creatureCount: { label: 'Creature Count', min: 0, max: 500, step: 10, category: 'creatures' },
  creatureBaseSpeed: { label: 'Base Speed', min: 1, max: 30, step: 1, category: 'creatures' },
  creatureBaseEnergy: { label: 'Base Energy', min: 0.1, max: 5, step: 0.1, category: 'creatures' },
  creatureBaseWater: { label: 'Base Water', min: 0.1, max: 5, step: 0.1, category: 'creatures' },

  // Creatures: Metabolism
  creatureBasalEnergyDrain: { label: 'Energy Drain/s', min: 0, max: 0.1, step: 0.001, category: 'metabolism' },
  creatureBasalWaterDrain: { label: 'Water Drain/s', min: 0, max: 0.1, step: 0.001, category: 'metabolism' },
  creatureSprintStaminaDrain: { label: 'Sprint Drain/s', min: 0, max: 1, step: 0.01, category: 'metabolism' },
  creatureStaminaRegen: { label: 'Stamina Regen/s', min: 0, max: 1, step: 0.01, category: 'metabolism' },

  // Creatures: Reproduction
  creatureReproductionMinAge: { label: 'Min Repro Age (s)', min: 0, max: 300, step: 10, category: 'reproduction' },
  creatureReproductionCooldown: { label: 'Repro Cooldown (s)', min: 0, max: 600, step: 10, category: 'reproduction' },
  creatureGestationTime: { label: 'Gestation (s)', min: 10, max: 300, step: 5, category: 'reproduction' },
  creatureConceptionChance: { label: 'Conception %', min: 0, max: 1, step: 0.05, category: 'reproduction' },

  // Creatures: Lifespan
  creatureMaxAge: { label: 'Max Age (s)', min: 60, max: 1800, step: 60, category: 'lifespan' },

  // Creatures: Chase
  creatureChaseStartThreshold: { label: 'Chase Start', min: 0, max: 1, step: 0.05, category: 'chase' },
  creatureChaseStopThreshold: { label: 'Chase Stop', min: 0, max: 1, step: 0.05, category: 'chase' },
  creatureChaseLoseTime: { label: 'Chase Lose (s)', min: 0.05, max: 1, step: 0.05, category: 'chase' },
  creatureChaseRestTime: { label: 'Chase Rest (s)', min: 0.05, max: 1, step: 0.05, category: 'chase' },

  // Plants
  grassRegrowthRate: { label: 'Grass Regrowth/s', min: 0, max: 0.1, step: 0.005, category: 'plants' },
  bushBerryRegenRate: { label: 'Berry Regen/s', min: 0, max: 1, step: 0.05, category: 'plants' },

  // Genetics
  creatureGenomeMutationRate: { label: 'Mutation Rate', min: 0, max: 0.5, step: 0.01, category: 'genetics' },
  creatureGenomeMutationStrength: { label: 'Mutation Strength', min: 0, max: 0.3, step: 0.01, category: 'genetics' }
};
