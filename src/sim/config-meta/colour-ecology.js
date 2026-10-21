export const metaColourEcology = {
  terrainRegionScale: {
    label: 'Habitat scale',
    description:
      'Characteristic relief/climate scale relative to the shorter dimension (capped at 160 tiles). Rebuild world.',
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
    description:
      'Bias environmental suitability; zero disables a biome; at least one must remain enabled. No fixed coverage quotas. Rebuild world.',
    category: 'world',
    type: 'json',
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
