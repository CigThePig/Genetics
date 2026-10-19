export const metaColourEcology = {
  terrainRegionScale: {
    label: 'Habitat scale',
    description: 'Regional width as a fraction of world width. Rebuild world.',
    min: 0.18,
    max: 0.6,
    step: 0.02,
    category: 'world',
    control: 'slider'
  },
  terrainFragmentation: {
    label: 'Border irregularity',
    description: 'Domain warp strength. Rebuild world.',
    min: 0,
    max: 0.4,
    step: 0.02,
    category: 'world',
    control: 'slider'
  },
  terrainBiomeWeights: {
    label: 'Biome prevalence',
    description: 'Weights for extra regions; each primary biome retains a core. Rebuild world.',
    category: 'world',
    advanced: true
  },
  biomeDebugView: {
    label: 'Biome classification view',
    description: 'Flat diagnostic colours; no effect on simulation.',
    category: 'rendering',
    type: 'boolean'
  },
  colourCamouflageEnabled: {
    label: 'Colour camouflage',
    description: 'Habitat-dependent detection for prey, threats and mate acquisition.',
    category: 'perception',
    type: 'boolean'
  },
  colourMatePreferenceEnabled: {
    label: 'Colour mate choice',
    description: 'Inherited soft preferences compete with travel distance.',
    category: 'reproduction',
    type: 'boolean'
  },
  colourInitialVariation: {
    label: 'Initial colour variation',
    description: 'Initial hue spread, independent of metabolic jitter. Rebuild to apply.',
    category: 'genetics',
    min: 0,
    max: 0.5,
    step: 0.01,
    control: 'slider'
  }
};
