export const metaMemory1 = {
  creatureDangerMemorySeconds: {
    label: 'Danger Place Memory',
    description:
      'How long personally experienced danger biases roaming. Fades with time; zero disables. Does not block food, water, mates or group reunion.',
    min: 0,
    max: 180,
    step: 5,
    unit: 's',
    category: 'memory',
    control: 'slider'
  },
  creatureWaterPreferLocal: {
    label: 'Prefer Local Water',
    description:
      'Use closer personally observed water before following a herd drinking destination.',
    category: 'memory',
    advanced: true
  },
  creatureMemoryMaxEntries: {
    label: 'Memory Max Entries',
    description: 'Max memory entries per creature.',
    min: 0,
    max: 30,
    step: 1,
    category: 'memory',
    control: 'slider',
    advanced: true
  },
  creatureMemoryDecay: {
    label: 'Memory Decay',
    description: 'Memory decay rate per second.',
    min: 0,
    max: 0.1,
    step: 0.005,
    unit: '/s',
    category: 'memory',
    control: 'slider',
    advanced: true
  },
  creatureMemoryMinStrength: {
    label: 'Memory Min Strength',
    description: 'Threshold below which memories are removed.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'memory',
    control: 'slider',
    advanced: true
  },
  creatureMemoryMergeDistance: {
    label: 'Memory Merge Dist',
    description: 'Distance for merging nearby memories.',
    min: 0,
    max: 10,
    step: 0.1,
    unit: 'tiles',
    category: 'memory',
    control: 'slider',
    advanced: true
  },
  creatureMemoryVisitPenalty: {
    label: 'Memory Visit Penalty',
    description: 'Penalty when memory target is empty.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'memory',
    control: 'slider',
    advanced: true
  },
  creatureWaterMemoryInHerdEnabled: {
    label: 'Water Memory In Herd',
    description: 'Allow water memories while in herd.',
    type: 'boolean',
    category: 'memory'
  }
};
