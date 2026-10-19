export const metaWorld1 = {
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
  terrainTypes: {
    label: 'Terrain Types (JSON)',
    description: 'List of terrain ids.',
    type: 'json',
    control: 'json',
    category: 'world',
    advanced: true
  }
};
