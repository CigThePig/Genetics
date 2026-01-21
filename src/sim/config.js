export const simConfig = {
  seed: 1,
  hotspotSeed: 1337,
  ticksPerSecond: 60,
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
  grassCap: 1,
  grassRegrowthRate: 0.02,
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
  bushCount: 96,
  bushInitialHealth: 0.85,
  bushBerryMax: 12,
  bushInitialBerries: 6,
  bushRecoveryRate: 0.01,
  bushBerryRegenRate: 0.25,
  creatureCount: 80,
  creatureSpawnClusterSpread: 12,
  creatureSpawnClusterJitter: 4,
  creatureBaseEnergy: 1,
  creatureBaseWater: 1,
  creatureBaseStamina: 1,
  creatureBaseHp: 1,
  creatureBaseSpeed: 9, // tiles per second (movement is time-scaled)
  creaturePerceptionRange: 4,
  creaturePerceptionRangeMax: 7,
  creatureAlertnessBase: 0.55,
  creatureReactionDelayTicks: 2,
  creatureTargetingRange: 5,
  creatureTargetingDistanceWeight: 0.12,
  creatureTargetingPreferences: {
    triangle: { circle: 1, octagon: 0.85 },
    octagon: { square: 1 }
  },
  creatureChaseStartThreshold: 0.6,
  creatureChaseStopThreshold: 0.25,
  creatureChaseLoseDistance: 6,
  creatureChaseLoseTicks: 6,
  creatureChaseCatchDistance: 0.6,
  creatureChaseRestTicks: 6,
  creatureMemoryMaxEntries: 12,
  creatureMemoryDecay: 0.02,
  creatureMemoryMinStrength: 0.05,
  creatureMemoryMergeDistance: 1.5,
  creatureMemoryVisitPenalty: 0.5,
  creatureBasalEnergyDrain: 0.008,
  creatureBasalWaterDrain: 0.01,
  creatureBasalStaminaDrain: 0.004,
  creatureSprintStartThreshold: 0.7,
  creatureSprintStopThreshold: 0.4,
  creatureSprintSpeedMultiplier: 1.6,
  creatureSprintStaminaDrain: 0.3,
  creatureStaminaRegen: 0.18,
  creatureReproductionMinAgeTicks: 90,
  // Must be <= creatureEatThreshold/creatureDrinkThreshold or reproduction never activates.
  creatureReproductionMinEnergyRatio: 0.8,
  creatureReproductionMinWaterRatio: 0.8,
  creatureReproductionCooldownTicks: 180,
  creatureReproductionFailedCooldownTicks: 20, // cooldown (seconds) when conception fails
  creatureReproductionFailedCostMultiplier: 0.5, // scale energy/water/stamina costs on failure
  creatureReproductionRange: 2.5,
  creatureSexEnabled: true, // enable male/female assignment
  creaturePregnancyEnabled: true, // allow pregnancy/gestation pipeline
  creatureSexInitialSplitMode: 'exact', // exact 50/50 split for initial spawn
  creatureConceptionChance: 0.5, // base conception probability per pairing
  creatureGestationBaseTicks: 3600, // base gestation length (ticks, at 60 TPS ~60 seconds)
  creatureGestationTraitEnabled: true, // enable trait-based gestation length
  creaturePregnancyMetabolismMultiplier: 1.15, // hunger/water drain multiplier while pregnant
  creaturePregnancyMoveSpeedMultiplier: 0.9, // move speed multiplier while pregnant
  creaturePregnancyMiscarriageEnabled: true, // enable miscarriage checks
  creaturePregnancyMiscarriageEnergyRatio: 0.15, // energy ratio threshold for miscarriage risk
  creaturePregnancyMiscarriageChancePerTick: 0.01, // miscarriage roll per tick when below energy ratio
  creatureMateSeekingEnabled: true, // enable mate-seeking intent
  creatureMateSeekRange: 25, // max distance to notice and seek a mate
  creatureMateSeekCommitTicks: 60, // ticks to commit to a mate target
  creatureReproductionRangeWhileSeeking: 6, // expanded range when seeking a mate
  creatureMateSeekPriorityOverridesNeeds: false, // allow mate intent to override eat/drink
  creatureBirthChildStartingMetersFastMultiplier: 0.85, // newborn meters when gestation is fast
  creatureBirthChildStartingMetersSlowMultiplier: 1.1, // newborn meters when gestation is slow
  creatureBirthChildStartingMetersFastIfMultiplierBelow: 0.9, // fast gestation threshold
  creatureBirthChildStartingMetersSlowIfMultiplierAbove: 1.1, // slow gestation threshold
  creatureReproductionEnergyCost: 0.2,
  creatureReproductionWaterCost: 0.15,
  creatureReproductionStaminaCost: 0.05,
  creatureOffspringEnergy: 0.6,
  creatureOffspringWater: 0.6,
  creatureOffspringStamina: 0.6,
  creatureOffspringHp: 0.8,
  creatureNeedSwitchMargin: 0.05,
  creatureDrinkThreshold: 0.8,
  creatureDrinkAmount: 0.6,
  creatureEatThreshold: 0.8,
  creatureEatAmount: 0.5,
  creatureGrassEatMin: 0.05,
  creatureBerryEatMin: 0.1,
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
  creatureGenomeDefaults: {
    default: {
      speed: 0.5,
      perceptionRange: 0.5,
      alertness: 0.5,
      reactionDelayTicks: 0.5,
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
  creatureMaxAgeTicks: 600,
  creatureLifeStages: [
    {
      id: 'juvenile',
      label: 'Juvenile',
      minAge: 0,
      movementScale: 0.85,
      metabolismScale: 0.9
    },
    {
      id: 'adult',
      label: 'Adult',
      minAge: 120,
      movementScale: 1,
      metabolismScale: 1
    },
    {
      id: 'elder',
      label: 'Elder',
      minAge: 300,
      movementScale: 0.75,
      metabolismScale: 1.1
    }
  ],
  creatureInspectRadius: 6
};
