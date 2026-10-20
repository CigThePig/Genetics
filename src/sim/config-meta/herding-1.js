export const metaHerding1 = {
  creatureHerdingStrength: {
    label: 'Legacy: Herd Cohesion',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingEnabled: {
    label: 'Herding Enabled',
    description: 'Enable herding for herbivores.',
    type: 'boolean',
    category: 'herding'
  },
  creatureHerdingSimpleMode: {
    label: 'Legacy: Simple Herding Mode',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    type: 'boolean',
    category: 'herding',
    advanced: true
  },
  creatureSimpleHerdingSeparationRadius: {
    label: 'Separation Radius',
    description: 'Distance at which creatures push away from each other.',
    min: 0.5,
    max: 8,
    step: 0.5,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureSimpleHerdingAlignmentRadius: {
    label: 'Legacy: Alignment Radius',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 1,
    max: 20,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureSimpleHerdingCohesionRadius: {
    label: 'Cohesion Radius',
    description: 'Distance at which creatures pull toward herd center.',
    min: 1,
    max: 30,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureSimpleHerdingSeparationStrength: {
    label: 'Separation Strength',
    description: 'Force of pushing away from too-close neighbors.',
    min: 0,
    max: 2,
    step: 0.1,
    category: 'herding',
    control: 'slider'
  },
  creatureSimpleHerdingAlignmentStrength: {
    label: 'Legacy: Alignment Strength',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 2,
    step: 0.1,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureSimpleHerdingCohesionStrength: {
    label: 'Legacy: Cohesion Strength',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 2,
    step: 0.1,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureSimpleHerdingThreatRange: {
    label: 'Threat Detection Range',
    description: 'Distance at which predators are detected.',
    min: 1,
    max: 25,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureSimpleHerdingThreatStrength: {
    label: 'Legacy: Flee Strength',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 3,
    step: 0.1,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureSimpleHerdingSmoothing: {
    label: 'Legacy: Herding Smoothing',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0.1,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingHeadingBlend: {
    label: 'Legacy: Heading Blend',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureThreatPropagationRadius: {
    label: 'Threat Propagation Radius',
    description: 'How far threat alerts spread through the herd.',
    min: 1,
    max: 20,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureThreatPropagationHops: {
    label: 'Threat Propagation Hops',
    description: 'Maximum propagation depth for threat alerts.',
    min: 0,
    max: 5,
    step: 1,
    category: 'herding',
    control: 'slider'
  },
  creatureThreatDecaySeconds: {
    label: 'Threat Memory',
    description: 'How long creatures stay threatened after losing sight of predator.',
    min: 0.5,
    max: 10,
    step: 0.5,
    unit: 'seconds',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdMovementContagionRadius: {
    label: 'Movement Contagion Radius',
    description: 'Distance at which movement spreads through the herd.',
    min: 1,
    max: 15,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdMovementContagionDelay: {
    label: 'Movement Contagion Delay',
    description: 'Delay before movement spreads to nearby creatures.',
    min: 0.1,
    max: 2,
    step: 0.1,
    unit: 's',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdMovementContagionChance: {
    label: 'Movement Contagion Chance',
    description: 'Probability to start moving when neighbors are moving.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdLeadershipDecay: {
    label: 'Legacy: Leadership Decay',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0.001,
    max: 0.1,
    step: 0.005,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingAlignmentStrength: {
    label: 'Legacy: Herd Alignment',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingMinGroupSize: {
    label: 'Min Group Size',
    description: 'Minimum local herd size required for alignment/cohesion logic.',
    min: 1,
    max: 12,
    step: 1,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingThreatRange: {
    label: 'Legacy: Threat Detect Range',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 2,
    max: 20,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingThreatStrength: {
    label: 'Legacy: Flee Strength',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 0.5,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingIdealDistance: {
    label: 'Legacy: Herd Spacing',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 2,
    max: 10,
    step: 0.5,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingRange: {
    label: 'Legacy: Herd Range',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 4,
    max: 30,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingSeparation: {
    label: 'Legacy: Herd Separation',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 1,
    max: 6,
    step: 0.2,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingComfortMax: {
    label: 'Legacy: Herd Comfort Max',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 2,
    max: 12,
    step: 0.5,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingComfortMin: {
    label: 'Legacy: Comfort Min (Reserved)',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 10,
    step: 0.5,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingSeparationMultiplier: {
    label: 'Legacy: Separation Multiplier',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0.5,
    max: 4,
    step: 0.1,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingOffsetDeadzone: {
    label: 'Legacy: Offset Deadzone',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 0.2,
    step: 0.01,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingOffsetSmoothing: {
    label: 'Legacy: Offset Smoothing',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingHeadingBlendMax: {
    label: 'Legacy: Herd Heading Blend',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 0.5,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingTargetBlendEnabled: {
    label: 'Legacy: Target Blend Enabled',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    type: 'boolean',
    category: 'herding',
    advanced: true
  },
  creatureHerdingTargetBlendMax: {
    label: 'Legacy: Target Blend Max',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 0.35,
    step: 0.01,
    category: 'herding',
    control: 'slider',
    advanced: true
  }
};
