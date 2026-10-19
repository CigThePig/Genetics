export const metaHerding1 = {
  creatureHerdingStrength: {
    label: 'Herd Cohesion',
    description: 'Base cohesion strength for herding.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingEnabled: {
    label: 'Herding Enabled',
    description: 'Enable herding for herbivores.',
    type: 'boolean',
    category: 'herding'
  },
  creatureHerdingSimpleMode: {
    label: 'Simple Herding Mode',
    description: 'Use simple 3-rule boid system instead of complex herding.',
    type: 'boolean',
    category: 'herding'
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
    label: 'Alignment Radius',
    description: 'Distance at which creatures match neighbor headings.',
    min: 1,
    max: 20,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
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
    label: 'Alignment Strength',
    description: 'Force of matching neighbor headings.',
    min: 0,
    max: 2,
    step: 0.1,
    category: 'herding',
    control: 'slider'
  },
  creatureSimpleHerdingCohesionStrength: {
    label: 'Cohesion Strength',
    description: 'Force of pulling toward herd center.',
    min: 0,
    max: 2,
    step: 0.1,
    category: 'herding',
    control: 'slider'
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
    label: 'Flee Strength',
    description: 'Force of fleeing from predators.',
    min: 0,
    max: 3,
    step: 0.1,
    category: 'herding',
    control: 'slider'
  },
  creatureSimpleHerdingSmoothing: {
    label: 'Herding Smoothing',
    description: 'How smoothly herding forces are applied (prevents jitter).',
    min: 0.1,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingHeadingBlend: {
    label: 'Heading Blend',
    description: 'How much herd heading influences creature heading.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider'
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
    label: 'Leadership Decay',
    description: 'How fast leadership score decays when not moving.',
    min: 0.001,
    max: 0.1,
    step: 0.005,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingAlignmentStrength: {
    label: 'Herd Alignment',
    description: 'Alignment weight for herd headings.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider'
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
    label: 'Threat Detect Range',
    description: 'Predator detection radius.',
    min: 2,
    max: 20,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingThreatStrength: {
    label: 'Flee Strength',
    description: 'Threat steering strength.',
    min: 0,
    max: 0.5,
    step: 0.05,
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingIdealDistance: {
    label: 'Herd Spacing',
    description: 'Ideal herd spacing distance.',
    min: 2,
    max: 10,
    step: 0.5,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingRange: {
    label: 'Herd Range',
    description: 'Local neighbor range for herding.',
    min: 4,
    max: 30,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingSeparation: {
    label: 'Herd Separation',
    description: 'Separation distance within the herd.',
    min: 1,
    max: 6,
    step: 0.2,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingComfortMax: {
    label: 'Herd Comfort Max',
    description: 'Comfort band max distance.',
    min: 2,
    max: 12,
    step: 0.5,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingComfortMin: {
    label: 'Comfort Min (Reserved)',
    description: 'Resolved but currently unused in steering logic (reserved).',
    min: 0,
    max: 10,
    step: 0.5,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingSeparationMultiplier: {
    label: 'Separation Multiplier',
    description: 'Scales separation contribution.',
    min: 0.5,
    max: 4,
    step: 0.1,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingOffsetDeadzone: {
    label: 'Offset Deadzone',
    description: 'Deadzone for herding offset.',
    min: 0,
    max: 0.2,
    step: 0.01,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingOffsetSmoothing: {
    label: 'Offset Smoothing',
    description: 'Smoothing factor for herding offset.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingHeadingBlendMax: {
    label: 'Herd Heading Blend',
    description: 'Max heading blend factor.',
    min: 0,
    max: 0.5,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingTargetBlendEnabled: {
    label: 'Target Blend Enabled',
    description: 'Blend toward targets during herding.',
    type: 'boolean',
    category: 'herding'
  },
  creatureHerdingTargetBlendMax: {
    label: 'Target Blend Max',
    description: 'Max target blend amount.',
    min: 0,
    max: 0.35,
    step: 0.01,
    category: 'herding',
    control: 'slider',
    advanced: true
  }
};
