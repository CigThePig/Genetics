export const metaPerception1 = {
  creaturePerceptionRange: {
    label: 'Perception Range',
    description: 'Base local scan radius.',
    min: 1,
    max: 20,
    step: 0.5,
    unit: 'tiles',
    category: 'perception',
    control: 'slider'
  },
  creaturePerceptionRangeMax: {
    label: 'Perception Range Max',
    description: 'Maximum effective perception range.',
    min: 1,
    max: 30,
    step: 0.5,
    unit: 'tiles',
    category: 'perception',
    control: 'slider'
  },
  creatureAlertnessBase: {
    label: 'Alertness Base',
    description:
      'Baseline reaction alertness. Inherited alertness also scales the individual escape buffer relative to this baseline.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'perception',
    control: 'slider'
  },
  creatureReactionDelay: {
    label: 'Reaction Delay (s)',
    description: 'Base reaction delay after perception changes.',
    min: 0,
    max: 0.5,
    step: 0.005,
    unit: 's',
    category: 'perception',
    control: 'slider',
    advanced: true
  }
};
