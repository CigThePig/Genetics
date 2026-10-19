export const metaPlants1 = {
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
  }
};
