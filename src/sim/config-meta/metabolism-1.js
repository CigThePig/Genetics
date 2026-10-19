export const metaMetabolism1 = {
  creatureBasalEnergyDrain: {
    label: 'Energy Drain/s',
    description: 'Baseline energy drain per second.',
    min: 0,
    max: 0.1,
    step: 0.001,
    unit: '/s',
    category: 'metabolism',
    control: 'slider'
  },
  creatureBasalWaterDrain: {
    label: 'Water Drain/s',
    description: 'Baseline water drain per second.',
    min: 0,
    max: 0.1,
    step: 0.001,
    unit: '/s',
    category: 'metabolism',
    control: 'slider'
  },
  creatureBasalStaminaDrain: {
    label: 'Basal Stamina Drain/s',
    description: 'Baseline stamina drain per second.',
    min: 0,
    max: 0.1,
    step: 0.001,
    unit: '/s',
    category: 'metabolism',
    control: 'slider',
    advanced: true
  },
  creatureSprintStartThreshold: {
    label: 'Sprint Start Threshold',
    description: 'Starts sprinting when stamina ratio meets this threshold.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'metabolism',
    control: 'slider',
    advanced: true
  },
  creatureSprintStopThreshold: {
    label: 'Sprint Stop Threshold',
    description: 'Stops sprinting when stamina ratio drops below this threshold.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'metabolism',
    control: 'slider',
    advanced: true
  },
  creatureSprintStaminaDrain: {
    label: 'Sprint Drain/s',
    description: 'Stamina drain while sprinting.',
    min: 0,
    max: 1,
    step: 0.01,
    unit: '/s',
    category: 'metabolism',
    control: 'slider'
  },
  creatureStaminaRegen: {
    label: 'Stamina Regen/s',
    description: 'Stamina recovery per second.',
    min: 0,
    max: 1,
    step: 0.01,
    unit: '/s',
    category: 'metabolism',
    control: 'slider'
  },
  creatureEatAmount: {
    label: 'Eat Amount/s',
    description: 'Food consumed per second while eating.',
    min: 0.1,
    max: 2,
    step: 0.1,
    unit: '/s',
    category: 'metabolism',
    control: 'slider'
  },
  creatureDrinkAmount: {
    label: 'Drink Amount/s',
    description: 'Water gained per second while drinking.',
    min: 0.1,
    max: 2,
    step: 0.1,
    unit: '/s',
    category: 'metabolism',
    control: 'slider'
  },
  creatureDrinkConcernMargin: {
    label: 'Drink Concern Margin',
    description: 'Buffer above drink threshold for concern.',
    min: 0,
    max: 0.35,
    step: 0.01,
    category: 'metabolism',
    control: 'slider'
  },
  creatureNeedSwitchMargin: {
    label: 'Need Switch Margin',
    description: 'Hysteresis margin for hunger vs thirst.',
    min: 0,
    max: 0.2,
    step: 0.01,
    category: 'metabolism',
    control: 'slider'
  },
  creatureDrinkThreshold: {
    label: 'Drink Threshold',
    description: 'Water ratio below which thirst triggers.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'metabolism',
    control: 'slider'
  },
  creatureEatThreshold: {
    label: 'Eat Threshold',
    description: 'Energy ratio below which hunger triggers.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'metabolism',
    control: 'slider'
  },
  creatureGrassEatMin: {
    label: 'Min Grass Eat',
    description: 'Minimum grass required to eat.',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'metabolism',
    control: 'slider',
    advanced: true
  },
  creatureBerryEatMin: {
    label: 'Min Berry Eat',
    description: 'Minimum berries required to eat.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'metabolism',
    control: 'slider',
    advanced: true
  }
};
