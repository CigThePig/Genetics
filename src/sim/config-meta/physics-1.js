export const metaPhysics1 = {
  creatureAcceleration: {
    label: 'Acceleration',
    description: 'How fast creatures reach top speed. Higher = snappier movement.',
    min: 0.01,
    max: 1,
    step: 0.01,
    category: 'physics',
    control: 'slider'
  },
  creatureDeceleration: {
    label: 'Deceleration',
    description: 'How fast creatures slow down when stopping. Higher = quicker stops.',
    min: 0.01,
    max: 1,
    step: 0.01,
    category: 'physics',
    control: 'slider'
  },
  creatureFrictionDrag: {
    label: 'Friction Drag',
    description: 'Passive slowdown each tick. Creates natural coasting.',
    min: 0,
    max: 0.2,
    step: 0.005,
    category: 'physics',
    control: 'slider'
  },
  creatureAngularAcceleration: {
    label: 'Angular Acceleration',
    description: 'How fast turn rate changes. Lower = smoother, more momentum.',
    min: 0.01,
    max: 1,
    step: 0.01,
    category: 'physics',
    control: 'slider'
  },
  creatureSpeedTurnPenalty: {
    label: 'Speed Turn Penalty',
    description: 'How much speed reduces turn rate. Higher = wider turns when fast.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'physics',
    control: 'slider'
  }
};
