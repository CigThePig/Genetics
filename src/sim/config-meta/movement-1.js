export const metaMovement1 = {
  creatureIntentSpeedWander: {
    label: 'Wander Speed',
    description: 'Speed multiplier when wandering aimlessly.',
    min: 0.1,
    max: 1.5,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureIntentSpeedGraze: {
    label: 'Graze Speed',
    description: 'Speed multiplier when grazing (very slow).',
    min: 0.1,
    max: 1,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureIntentSpeedSeek: {
    label: 'Seek Speed',
    description: 'Speed multiplier when seeking food or water.',
    min: 0.1,
    max: 1.5,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureIntentSpeedMate: {
    label: 'Mate Seek Speed',
    description: 'Speed multiplier when seeking a mate.',
    min: 0.1,
    max: 1.5,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureIntentSpeedHunt: {
    label: 'Hunt Stalk Speed',
    description: 'Speed multiplier during stalking phase of hunt.',
    min: 0.1,
    max: 1.5,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureIntentSpeedHuntChase: {
    label: 'Hunt Chase Speed',
    description: 'Speed multiplier during active chase.',
    min: 0.5,
    max: 2,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureMaxTurnRateRadPerSecond: {
    label: 'Turn Rate (rad/s)',
    description: 'Max turn rate per second.',
    min: 1,
    max: 8,
    step: 0.5,
    unit: 'rad/s',
    category: 'movement',
    control: 'slider'
  },
  creatureBoundaryAvoidDistance: {
    label: 'Boundary Avoid Distance',
    description:
      'Distance from edge where avoidance begins; avoidance strength grows with quadratic proximity.',
    min: 0,
    max: 60,
    step: 1,
    unit: 'tiles',
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureBoundaryAvoidStrength: {
    label: 'Boundary Avoid Strength',
    description: 'Controls how strongly boundary avoidance affects wandering (clamped 0–1).',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureFleeMaxTurnMultiplier: {
    label: 'Flee Max Turn Multiplier',
    description: 'When threatened, multiplies max turn per tick to enable sharper evasive turns.',
    min: 1,
    max: 4,
    step: 0.1,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureWanderRetargetTimeMin: {
    label: 'Wander Min (s)',
    description: 'Min seconds between wander retarget.',
    min: 0.2,
    max: 10,
    step: 0.1,
    unit: 's',
    category: 'movement',
    control: 'slider'
  },
  creatureWanderRetargetTimeMax: {
    label: 'Wander Max (s)',
    description: 'Max seconds between wander retarget.',
    min: 1,
    max: 12,
    step: 0.5,
    unit: 's',
    category: 'movement',
    control: 'slider'
  },
  creatureGrazeEnabled: {
    label: 'Graze Enabled',
    description: 'Enable graze idling behavior.',
    type: 'boolean',
    category: 'movement'
  },
  creatureWanderTurnJitter: {
    label: 'Wander Turn Jitter',
    description: 'Heading jitter on wander retarget.',
    min: 0,
    max: 1,
    step: 0.02,
    unit: 'rad',
    category: 'movement',
    control: 'slider'
  },
  creatureWanderInHerdRetargetMultiplier: {
    label: 'Legacy: Wander Herd Retarget Mult',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0.1,
    max: 3,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureWanderInHerdJitterMultiplier: {
    label: 'Legacy: Wander Herd Jitter Mult',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0.1,
    max: 3,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureWanderInHerdHeadingBias: {
    label: 'Legacy: Wander Herd Heading Bias',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureGrazeSpeedMultiplier: {
    label: 'Legacy: Graze Speed Mult',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureSprintSpeedMultiplier: {
    label: 'Sprint Speed Multiplier',
    description: 'When sprinting, multiplies movement distance.',
    min: 0.5,
    max: 3,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureGrazeIdleSecondsMin: {
    label: 'Legacy: Graze Idle Min (s)',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 10,
    step: 0.5,
    unit: 's',
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureGrazeIdleSecondsMax: {
    label: 'Legacy: Graze Idle Max (s)',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 12,
    step: 0.5,
    unit: 's',
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureGrazeMoveSecondsMin: {
    label: 'Legacy: Graze Move Min (s)',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 10,
    step: 0.5,
    unit: 's',
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureGrazeMoveSecondsMax: {
    label: 'Legacy: Graze Move Max (s)',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 12,
    step: 0.5,
    unit: 's',
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureGrazeMinEnergyRatio: {
    label: 'Graze Min Energy',
    description: 'Min energy ratio to graze.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureGrazeMinWaterRatio: {
    label: 'Graze Min Water',
    description: 'Min water ratio to graze.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureGrazeMinLocalHerdSize: {
    label: 'Graze Min Herd',
    description: 'Min herd size to graze.',
    min: 1,
    max: 10,
    step: 1,
    category: 'movement',
    control: 'slider',
    advanced: true
  },
  creatureSearchRadiusMin: {
    label: 'Search Radius Min',
    description: 'Initial search radius for goals.',
    min: 2,
    max: 60,
    step: 1,
    unit: 'tiles',
    category: 'movement',
    control: 'slider'
  },
  creatureSearchRadiusMax: {
    label: 'Search Radius Max',
    description: 'Max search radius for goals.',
    min: 10,
    max: 200,
    step: 5,
    unit: 'tiles',
    category: 'movement',
    control: 'slider'
  },
  creatureSearchRadiusGrowth: {
    label: 'Search Growth',
    description: 'Multiplier when expanding search.',
    min: 1.05,
    max: 2,
    step: 0.05,
    category: 'movement',
    control: 'slider'
  },
  creatureSearchArriveDistance: {
    label: 'Search Arrive Dist',
    description: 'Distance to count search as reached.',
    min: 0.5,
    max: 5,
    step: 0.25,
    unit: 'tiles',
    category: 'movement',
    control: 'slider'
  }
};
