export const metaBehavior1 = {
  creatureBehaviorStateEnabled: {
    label: 'Behavior States Enabled',
    description: 'Enable behavior state machine (prevents rapid intent flickering).',
    type: 'boolean',
    category: 'behavior'
  },
  creatureBehaviorRelaxedPauseProbability: {
    label: 'Pause Probability',
    description: 'Chance to pause while in relaxed state.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'behavior',
    control: 'slider'
  },
  creatureBehaviorRelaxedGrazePauseRatio: {
    label: 'Graze Pause Ratio',
    description: 'How often grazing creatures pause (higher = more pauses).',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'behavior',
    control: 'slider'
  },
  creatureBehaviorRelaxedPauseMinSeconds: {
    label: 'Pause Duration Min',
    description: 'Minimum pause duration in relaxed state.',
    min: 0.5,
    max: 10,
    step: 0.5,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorRelaxedPauseMaxSeconds: {
    label: 'Pause Duration Max',
    description: 'Maximum pause duration in relaxed state.',
    min: 0.5,
    max: 15,
    step: 0.5,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorRelaxedMoveMinSeconds: {
    label: 'Move Duration Min',
    description: 'Minimum move duration before possible pause.',
    min: 1,
    max: 20,
    step: 0.5,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorRelaxedMoveMaxSeconds: {
    label: 'Move Duration Max',
    description: 'Maximum move duration before possible pause.',
    min: 1,
    max: 30,
    step: 0.5,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorAlertMinSeconds: {
    label: 'Alert Duration Min',
    description: 'Minimum time frozen in alert state.',
    min: 0.1,
    max: 5,
    step: 0.1,
    unit: 's',
    category: 'behavior',
    control: 'slider'
  },
  creatureBehaviorAlertMaxSeconds: {
    label: 'Alert Duration Max',
    description: 'Maximum time frozen in alert state.',
    min: 0.5,
    max: 10,
    step: 0.5,
    unit: 's',
    category: 'behavior',
    control: 'slider'
  },
  creatureBehaviorAlertToFleeThreshold: {
    label: 'Alert Flee Threshold',
    description: 'Distance at which alert transitions to fleeing.',
    min: 1,
    max: 20,
    step: 1,
    unit: 'tiles',
    category: 'behavior',
    control: 'slider'
  },
  creatureBehaviorHuntSpottingSeconds: {
    label: 'Hunt Spotting Duration',
    description: 'Time predator pauses when spotting prey.',
    min: 0.1,
    max: 3,
    step: 0.1,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorHuntStalkingMinSeconds: {
    label: 'Stalk Duration Min',
    description: 'Minimum stalking time before charging.',
    min: 0.5,
    max: 10,
    step: 0.5,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorHuntStalkingMaxSeconds: {
    label: 'Stalk Duration Max',
    description: 'Maximum stalking time before charging.',
    min: 1,
    max: 15,
    step: 0.5,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorHuntPounceRange: {
    label: 'Pounce Range',
    description: 'Distance at which stalking predator charges.',
    min: 1,
    max: 10,
    step: 0.5,
    unit: 'tiles',
    category: 'behavior',
    control: 'slider'
  },
  creatureBehaviorHuntStalkSpeed: {
    label: 'Stalk Speed',
    description: 'Speed multiplier during stalking phase.',
    min: 0.1,
    max: 0.8,
    step: 0.05,
    category: 'behavior',
    control: 'slider'
  },
  creatureBehaviorFeedingMinSeconds: {
    label: 'Feeding Duration Min',
    description: 'Minimum time predator stays at kill.',
    min: 1,
    max: 15,
    step: 0.5,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorFeedingMaxSeconds: {
    label: 'Feeding Duration Max',
    description: 'Maximum time predator stays at kill.',
    min: 2,
    max: 30,
    step: 1,
    unit: 's',
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorSatiationThreshold: {
    label: 'Satiation Threshold',
    description: 'Energy ratio at which predators become "full".',
    min: 0.5,
    max: 1,
    step: 0.05,
    category: 'behavior',
    control: 'slider'
  },
  creatureBehaviorEnvironmentPauseEnabled: {
    label: 'Environment Pauses',
    description: 'Enable brief pauses when entering new terrain.',
    type: 'boolean',
    category: 'behavior'
  },
  creatureBehaviorEnvironmentPauseProbability: {
    label: 'Env Pause Probability',
    description: 'Chance to pause when entering new terrain type.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'behavior',
    control: 'slider',
    advanced: true
  },
  creatureBehaviorRelaxedMinSeconds: {
    label: 'Relaxed Min Seconds',
    description: 'Simulation time setting.',
    min: 0,
    max: 60,
    step: 0.1,
    category: 'behavior',
    unit: 's',
    advanced: true
  },
  creatureBehaviorTravelingMinSeconds: {
    label: 'Traveling Min Seconds',
    description: 'Simulation time setting.',
    min: 0,
    max: 60,
    step: 0.1,
    category: 'behavior',
    unit: 's',
    advanced: true
  },
  creatureBehaviorForagingMinSeconds: {
    label: 'Foraging Min Seconds',
    description: 'Simulation time setting.',
    min: 0,
    max: 60,
    step: 0.1,
    category: 'behavior',
    unit: 's',
    advanced: true
  },
  creatureBehaviorFleeingMinSeconds: {
    label: 'Fleeing Min Seconds',
    description: 'Simulation time setting.',
    min: 0,
    max: 60,
    step: 0.1,
    category: 'behavior',
    unit: 's',
    advanced: true
  },
  creatureBehaviorHuntCooldownSeconds: {
    label: 'Hunt Cooldown Seconds',
    description: 'Simulation time setting.',
    min: 0,
    max: 60,
    step: 0.1,
    category: 'behavior',
    unit: 's',
    advanced: true
  },
  creatureBehaviorRestingMinSeconds: {
    label: 'Resting Min Seconds',
    description: 'Simulation time setting.',
    min: 0,
    max: 60,
    step: 0.1,
    category: 'behavior',
    unit: 's',
    advanced: true
  },
  creatureBehaviorEnvironmentPauseSeconds: {
    label: 'Environment Pause Seconds',
    description: 'Simulation time setting.',
    min: 0,
    max: 60,
    step: 0.1,
    category: 'behavior',
    unit: 's',
    advanced: true
  }
};
