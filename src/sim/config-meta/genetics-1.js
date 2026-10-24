export const metaGenetics1 = {
  creatureGenomeInheritanceMode: {
    label: 'Inheritance model',
    description:
      'Segregating copies either parent at each locus; blended averages parental values. Applies to new worlds after Rebuild World; the active world keeps its current model.',
    type: 'select',
    options: [
      { value: 'segregating', label: 'Segregating loci' },
      { value: 'blended', label: 'Legacy blending' }
    ],
    category: 'genetics'
  },
  creatureGenomeMutationRate: {
    label: 'Mutation Rate',
    description: 'Per-gene mutation probability.',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'genetics',
    control: 'slider'
  },
  creatureGenomeMutationStrength: {
    label: 'Mutation Strength',
    description: 'Mutation delta magnitude.',
    min: 0,
    max: 0.3,
    step: 0.01,
    category: 'genetics',
    control: 'slider'
  },
  creatureGenomeJitter: {
    label: 'Genome Jitter',
    description: 'Random variation for new genomes.',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureGenomePleiotropyScale: {
    label: 'Pleiotropy Scale',
    description: 'Tradeoff scale for beneficial mutations.',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureGenomeInheritanceNoise: {
    label: 'Inheritance Noise',
    description: 'Random noise during inheritance.',
    min: 0,
    max: 0.2,
    step: 0.01,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureGenomeInheritanceMixChance: {
    label: 'Inheritance Mix Chance',
    description:
      'Legacy blending only: chance of a random blend rather than midpoint. Inactive with segregating loci.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureGestationMultiplier: {
    label: 'Gestation Trait Base',
    description: 'Base gestation trait multiplier.',
    min: 0.5,
    max: 1.5,
    step: 0.05,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureTradeoffSpeedToEnergyDrainScale: {
    label: 'Speed→Energy Drain',
    description: 'Speed tradeoff vs energy drain.',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureTradeoffSpeedToWaterDrainScale: {
    label: 'Speed→Water Drain',
    description: 'Speed tradeoff vs water drain.',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureTradeoffSprintToStaminaDrainScale: {
    label: 'Sprint→Stamina Drain',
    description: 'Sprint tradeoff vs stamina drain.',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureTradeoffPerceptionToReactionDelayScale: {
    label: 'Perception→Reaction Delay',
    description: 'Perception tradeoff vs reaction delay.',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureGrowthLongevityCoupling: {
    label: 'Growth Longevity Coupling',
    description: 'Coupling between growth rate and lifespan.',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'genetics',
    control: 'slider',
    advanced: true
  },
  creatureFoodProperties: {
    label: 'Food Properties (JSON)',
    description: 'Nutrition/handling/risk by food type.',
    type: 'json',
    control: 'json',
    category: 'genetics',
    advanced: true
  },
  creatureFoodEfficiency: {
    label: 'Food Efficiency (JSON)',
    description: 'Base digestion efficiency by food type.',
    type: 'json',
    control: 'json',
    category: 'genetics',
    advanced: true
  },
  creatureTraitMultipliers: {
    label: 'Trait Multipliers (JSON)',
    description: 'Species multipliers for traits.',
    type: 'json',
    control: 'json',
    category: 'genetics',
    advanced: true
  },
  creatureGenomeDefaults: {
    label: 'Genome Defaults (JSON)',
    description: 'Default genome template per species.',
    type: 'json',
    control: 'json',
    category: 'genetics',
    advanced: true
  },
  creatureGenomeRanges: {
    label: 'Genome Ranges (JSON)',
    description: 'Optional per-gene min/max ranges.',
    type: 'json',
    control: 'json',
    category: 'genetics',
    advanced: true
  }
};
