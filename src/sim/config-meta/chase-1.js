export const metaChase1 = {
  creatureChaseStartThreshold: {
    label: 'Chase Start',
    description: 'Stamina ratio to start chase.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'chase',
    control: 'slider'
  },
  creatureChaseStopThreshold: {
    label: 'Chase Stop',
    description: 'Stamina ratio to stop chase.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'chase',
    control: 'slider'
  },
  creatureChaseLoseTime: {
    label: 'Chase Lose (s)',
    description: 'Seconds before losing a target.',
    min: 0.05,
    max: 1,
    step: 0.05,
    unit: 's',
    category: 'chase',
    control: 'slider'
  },
  creatureChaseRestTime: {
    label: 'Chase Rest (s)',
    description: 'Rest time after a chase.',
    min: 0.05,
    max: 1,
    step: 0.05,
    unit: 's',
    category: 'chase',
    control: 'slider'
  },
  creatureChaseLoseDistance: {
    label: 'Lose Distance',
    description: 'Distance within which prey counts as seen (updates last seen).',
    min: 0,
    max: 60,
    step: 0.5,
    unit: 'tiles',
    category: 'chase',
    control: 'slider',
    advanced: true
  },
  creatureChaseCatchDistance: {
    label: 'Catch Distance',
    description: 'Distance at which chase concludes as caught.',
    min: 0,
    max: 10,
    step: 0.1,
    unit: 'tiles',
    category: 'chase',
    control: 'slider',
    advanced: true
  }
};
