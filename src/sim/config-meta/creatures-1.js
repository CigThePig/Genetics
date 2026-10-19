export const metaCreatures1 = {
  creatureSpawnRetries: {
    label: 'Spawn Land Attempts',
    description: 'Maximum land-position attempts for each creature at spawn.',
    min: 1,
    max: 1000,
    step: 1,
    unit: 'count',
    category: 'creatures',
    advanced: true
  },
  creatureSpawnAnchorRetries: {
    label: 'Spawn Anchor Attempts',
    description: 'Maximum land-position attempts when choosing a species anchor.',
    min: 1,
    max: 1000,
    step: 1,
    unit: 'count',
    category: 'creatures',
    advanced: true
  },
  creatureCount: {
    label: 'Creature Count',
    description: 'Total starting population.',
    min: 0,
    max: 500,
    step: 10,
    category: 'creatures',
    control: 'slider'
  },
  creaturePredatorCount: {
    label: 'Predator Count',
    description: 'Number of predators at start.',
    min: 0,
    max: 50,
    step: 1,
    category: 'creatures',
    control: 'slider'
  },
  creatureSpawnSpeciesAnchorSpread: {
    label: 'Spawn Species Spread',
    description: 'Distance between species anchors at spawn.',
    min: 0,
    max: 60,
    step: 1,
    unit: 'tiles',
    category: 'creatures',
    control: 'slider'
  },
  creatureSpawnClusterSpread: {
    label: 'Spawn Cluster Spread',
    description: 'Fallback anchor spread for spawn clusters.',
    min: 0,
    max: 40,
    step: 1,
    unit: 'tiles',
    category: 'creatures',
    control: 'slider',
    advanced: true
  },
  creatureSpawnClusterJitter: {
    label: 'Spawn Cluster Jitter',
    description: 'Random spread around species anchors.',
    min: 0,
    max: 12,
    step: 0.5,
    unit: 'tiles',
    category: 'creatures',
    control: 'slider',
    advanced: true
  },
  creatureSpawnPredatorAnchorDistance: {
    label: 'Predator Spawn Dist',
    description: 'Min predator distance from herbivores.',
    min: 0,
    max: 200,
    step: 2,
    unit: 'tiles',
    category: 'creatures',
    control: 'slider'
  },
  creatureBaseSpeed: {
    label: 'Base Speed',
    description: 'Base movement speed before traits.',
    min: 1,
    max: 30,
    step: 1,
    unit: 'tiles/s',
    category: 'creatures',
    control: 'slider'
  },
  creatureBaseEnergy: {
    label: 'Base Energy',
    description: 'Starting energy baseline.',
    min: 0.1,
    max: 5,
    step: 0.1,
    category: 'creatures',
    control: 'slider'
  },
  creatureBaseWater: {
    label: 'Base Water',
    description: 'Starting water baseline.',
    min: 0.1,
    max: 5,
    step: 0.1,
    category: 'creatures',
    control: 'slider'
  },
  creatureBaseStamina: {
    label: 'Base Stamina',
    description: 'Starting stamina baseline.',
    min: 0.1,
    max: 5,
    step: 0.1,
    category: 'creatures',
    control: 'slider',
    advanced: true
  },
  creatureBaseHp: {
    label: 'Base HP',
    description: 'Starting HP baseline.',
    min: 0.1,
    max: 5,
    step: 0.1,
    category: 'creatures',
    control: 'slider',
    advanced: true
  },
  creatureSexEnabled: {
    label: 'Sex Enabled',
    description: 'Enable sex-based reproduction rules.',
    type: 'boolean',
    category: 'creatures'
  },
  creatureSexInitialSplitMode: {
    label: 'Sex Split Mode',
    description: 'Exact 50/50 split or alternating assignment.',
    type: 'select',
    category: 'creatures',
    control: 'select',
    options: [
      { label: 'Exact', value: 'exact' },
      { label: 'Alternate', value: 'alternate' }
    ]
  }
};
