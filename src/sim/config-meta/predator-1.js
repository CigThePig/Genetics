export const metaPredator1 = {
  creaturePredatorRestThreshold: {
    label: 'Rest When Energy >',
    description: 'Energy ratio to switch to resting.',
    min: 0.3,
    max: 1,
    step: 0.05,
    category: 'predator',
    control: 'slider'
  },
  creaturePredatorHuntThreshold: {
    label: 'Hunt When Energy <',
    description: 'Energy ratio to start hunting.',
    min: 0.1,
    max: 0.8,
    step: 0.05,
    category: 'predator',
    control: 'slider'
  },
  creatureTargetingRange: {
    label: 'Targeting Range',
    description: 'Predator target search range.',
    min: 5,
    max: 30,
    step: 1,
    unit: 'tiles',
    category: 'predator',
    control: 'slider'
  },
  creatureTargetingDistanceWeight: {
    label: 'Targeting Distance Weight',
    description: 'Score = speciesWeight − distance × weight.',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePredatorRestEnabled: {
    label: 'Predator Rest Enabled',
    description: 'Allow predators to rest when satiated.',
    type: 'boolean',
    category: 'predator'
  },
  creaturePredatorPatrolSpeed: {
    label: 'Predator Patrol Speed',
    description: 'Defined in simConfig but not referenced elsewhere in the current code.',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePackRelocationEnabled: {
    label: 'Pack Relocation Enabled',
    description: 'Enable pack relocation behavior.',
    type: 'boolean',
    category: 'predator'
  },
  creaturePackRelocateAfterSeconds: {
    label: 'Relocate After (s)',
    description: 'Time of staleness before relocation triggers.',
    min: 0,
    max: 600,
    step: 1,
    unit: 's',
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePackRelocateMinDistance: {
    label: 'Relocate Min Distance',
    description: 'Candidate new homes must be at least this far from current home.',
    min: 0,
    max: 200,
    step: 1,
    unit: 'tiles',
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePackRelocateSearchRadius: {
    label: 'Relocate Search Radius',
    description: 'Radius within which relocation candidates are sampled.',
    min: 0,
    max: 240,
    step: 1,
    unit: 'tiles',
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePackRelocateSampleAttempts: {
    label: 'Relocate Sample Attempts',
    description: 'Number of random candidates evaluated for new homes.',
    min: 1,
    max: 80,
    step: 1,
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePackRelocateAvoidWater: {
    label: 'Pack Relocate Avoid Water',
    description: 'Avoid water tiles when relocating.',
    type: 'boolean',
    category: 'predator'
  },
  creaturePackEnabled: {
    label: 'Pack Enabled',
    description: 'Enable predator pack behavior.',
    type: 'boolean',
    category: 'predator'
  },
  creaturePackSpacing: {
    label: 'Pack Spacing',
    description: 'Formation spacing for followers around the leader.',
    min: 1,
    max: 12,
    step: 0.5,
    unit: 'tiles',
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePredatorPatrolRadius: {
    label: 'Patrol Radius',
    description: 'Radius for predator patrol.',
    min: 10,
    max: 50,
    step: 5,
    unit: 'tiles',
    category: 'predator',
    control: 'slider'
  },
  creaturePredatorPatrolRetargetTimeMin: {
    label: 'Patrol Retarget Min (s)',
    description: 'Min waypoint commit time before choosing a new patrol heading.',
    min: 0.25,
    max: 30,
    step: 0.25,
    unit: 's',
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePredatorPatrolRetargetTimeMax: {
    label: 'Patrol Retarget Max (s)',
    description: 'Max waypoint commit time before choosing a new patrol heading.',
    min: 0.25,
    max: 60,
    step: 0.25,
    unit: 's',
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePredatorPatrolPreySightingWeight: {
    label: 'Prey Sighting Priority',
    description: 'Chance to patrol toward remembered prey locations.',
    min: 0,
    max: 1,
    step: 0.1,
    category: 'predator',
    control: 'slider'
  },
  creaturePredatorPatrolGrassWeight: {
    label: 'Grass Area Priority',
    description: 'Chance to patrol toward high-grass areas.',
    min: 0,
    max: 1,
    step: 0.1,
    category: 'predator',
    control: 'slider'
  },
  creaturePredatorPatrolPauseDuration: {
    label: 'Patrol Pause Duration',
    description: 'Seconds predator pauses at waypoint to scan.',
    min: 0,
    max: 5,
    step: 0.5,
    unit: 's',
    category: 'predator',
    control: 'slider'
  },
  creaturePredatorPatrolMemoryDecay: {
    label: 'Patrol Memory Decay',
    description: 'How fast prey sighting memories fade.',
    min: 0.001,
    max: 0.1,
    step: 0.005,
    unit: '/s',
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creaturePredatorPatrolMemoryMax: {
    label: 'Patrol Memory Max',
    description: 'Maximum prey sighting memories to retain.',
    min: 1,
    max: 20,
    step: 1,
    category: 'predator',
    control: 'slider',
    advanced: true
  },
  creatureTargetingPreferences: {
    label: 'Targeting Preferences (JSON)',
    description: 'Predator target weights by species.',
    type: 'json',
    control: 'json',
    category: 'predator',
    advanced: true
  }
};
