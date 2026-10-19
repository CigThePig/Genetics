export const metaLifespan1 = {
  creatureMaxAge: {
    label: 'Max Age (s)',
    description: 'Baseline maximum lifespan.',
    min: 60,
    max: 1800,
    step: 60,
    unit: 's',
    category: 'lifespan',
    control: 'slider'
  },
  creatureLifeStages: {
    label: 'Life Stages (JSON)',
    description: 'Stage thresholds and scaling.',
    type: 'json',
    control: 'json',
    category: 'lifespan',
    advanced: true
  }
};
