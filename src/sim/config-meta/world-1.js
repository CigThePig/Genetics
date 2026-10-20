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
    label: 'Legacy: Terrain Noise Scale',
    description:
      'Legacy preset field; unused by regional generation. Noise sampling scale (smaller = larger features).',
    min: 0.005,
    max: 0.12,
    step: 0.005,
    category: 'world',
    advanced: true,
    control: 'slider'
  },
  terrainWaterLevel: {
    label: 'Legacy: Terrain Water Level',
    description:
      'Legacy preset field; unused by regional generation. Height threshold for water before coverage scaling.',
    min: -1,
    max: 1,
    step: 0.02,
    category: 'world',
    advanced: true,
    control: 'slider'
  },
  terrainShoreLevel: {
    label: 'Legacy: Terrain Shore Level',
    description:
      'Legacy preset field; unused by regional generation. Height threshold for shore before coverage scaling.',
    min: -1,
    max: 1,
    step: 0.02,
    category: 'world',
    advanced: true,
    control: 'slider'
  },
  terrainWaterCoverageMultiplier: {
    label: 'Water Coverage Mult',
    description: 'Scales regional pond size; each catchment retains a drinking source.',
    min: 0.1,
    max: 1,
    step: 0.05,
    category: 'world',
    control: 'slider'
  },
  terrainRockThreshold: {
    label: 'Legacy: Terrain Rock Threshold',
    description:
      'Legacy preset field; unused by regional generation. Roughness threshold for rock biome.',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'world',
    advanced: true,
    control: 'slider'
  },
  terrainForestMoisture: {
    label: 'Legacy: Terrain Forest Moisture',
    description:
      'Legacy preset field; unused by regional generation. Moisture threshold for forest biome.',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'world',
    advanced: true,
    control: 'slider'
  },
  terrainSandMoisture: {
    label: 'Legacy: Terrain Sand Moisture',
    description:
      'Legacy preset field; unused by regional generation. Moisture threshold for sand biome.',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'world',
    advanced: true,
    control: 'slider'
  },
  waterCorridorCount: {
    label: 'Legacy: River Count',
    description:
      'Legacy preset field; unused by regional generation. Number of rivers (scaled by water coverage).',
    min: 0,
    max: 24,
    step: 1,
    category: 'world',
    advanced: true,
    control: 'slider'
  },
  waterCorridorWidth: {
    label: 'Legacy: River Width',
    description:
      'Legacy preset field; unused by regional generation. River half-width when painting water cells.',
    min: 1,
    max: 6,
    step: 1,
    unit: 'tiles',
    category: 'world',
    advanced: true,
    control: 'slider'
  },
  terrainBlobCount: {
    label: 'Legacy: Legacy Terrain Blobs',
    description:
      'Legacy preset field; unused by regional generation. Legacy blob painter count (unused by default).',
    min: 0,
    max: 200,
    step: 1,
    category: 'world',
    control: 'slider',
    advanced: true
  },
  terrainBlobMinRadius: {
    label: 'Legacy: Legacy Blob Min Radius',
    description:
      'Legacy preset field; unused by regional generation. Legacy blob painter min radius.',
    min: 1,
    max: 12,
    step: 1,
    unit: 'tiles',
    category: 'world',
    control: 'slider',
    advanced: true
  },
  terrainBlobMaxRadius: {
    label: 'Legacy: Legacy Blob Max Radius',
    description:
      'Legacy preset field; unused by regional generation. Legacy blob painter max radius.',
    min: 1,
    max: 20,
    step: 1,
    unit: 'tiles',
    category: 'world',
    control: 'slider',
    advanced: true
  },
  waterCorridorMinLength: {
    label: 'Legacy: Legacy River Min Length',
    description: 'Legacy preset field; unused by regional generation. Legacy corridor min length.',
    min: 1,
    max: 60,
    step: 1,
    unit: 'tiles',
    category: 'world',
    control: 'slider',
    advanced: true
  },
  waterCorridorMaxLength: {
    label: 'Legacy: Legacy River Max Length',
    description: 'Legacy preset field; unused by regional generation. Legacy corridor max length.',
    min: 1,
    max: 80,
    step: 1,
    unit: 'tiles',
    category: 'world',
    control: 'slider',
    advanced: true
  },
  waterCorridorTurnChance: {
    label: 'Legacy: Legacy River Turn Chance',
    description:
      'Legacy preset field; unused by regional generation. Legacy corridor turn probability.',
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
