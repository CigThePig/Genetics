export const simConfig = {
  seed: 1,
  hotspotSeed: 1337,
  ticksPerSecond: 1,
  worldWidth: 60,
  worldHeight: 40,
  defaultTerrain: 'plains',
  waterTerrain: 'water',
  shoreTerrain: 'shore',
  terrainTypes: ['plains', 'forest', 'rock', 'sand', 'shore', 'water'],
  terrainBlobCount: 18,
  terrainBlobMinRadius: 2,
  terrainBlobMaxRadius: 6,
  waterCorridorCount: 3,
  waterCorridorMinLength: 10,
  waterCorridorMaxLength: 22,
  waterCorridorWidth: 3,
  waterCorridorTurnChance: 0.35,
  grassCap: 1,
  grassRegrowthRate: 0.02,
  grassRegrowthDiminishPower: 1.5,
  grassInitialAmount: 0.2,
  grassPatchCount: 28,
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
  bushCount: 24,
  bushInitialHealth: 0.85,
  bushBerryMax: 12,
  bushInitialBerries: 6,
  bushRecoveryRate: 0.01,
  bushBerryRegenRate: 0.25,
  creatureCount: 12,
  creatureBaseEnergy: 1,
  creatureBaseWater: 1,
  creatureBaseStamina: 1,
  creatureBaseHp: 1,
  creatureBaseSpeed: 0.6,
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
  creatureMemoryMaxEntries: 12,
  creatureMemoryDecay: 0.02,
  creatureMemoryMinStrength: 0.05,
  creatureMemoryMergeDistance: 1.5,
  creatureMemoryVisitPenalty: 0.5,
  creatureBasalEnergyDrain: 0.002,
  creatureBasalWaterDrain: 0.0025,
  creatureBasalStaminaDrain: 0.0015,
  creatureSprintStartThreshold: 0.7,
  creatureSprintStopThreshold: 0.4,
  creatureSprintSpeedMultiplier: 1.6,
  creatureSprintStaminaDrain: 0.02,
  creatureStaminaRegen: 0.01,
  creatureNeedSwitchMargin: 0.05,
  creatureDrinkThreshold: 0.8,
  creatureDrinkAmount: 0.08,
  creatureEatThreshold: 0.8,
  creatureEatAmount: 0.08,
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
