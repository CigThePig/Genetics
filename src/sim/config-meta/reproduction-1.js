export const metaReproduction1 = {
  creatureMateMemorySeconds: {
    label: 'Mate Contact Memory (s)',
    description:
      'How long observed opposite-sex contact locations can guide healthy mate search. Bounded to four contacts; zero disables. Does not reveal hidden positions or force mating.',
    min: 0,
    max: 600,
    step: 10,
    unit: 's',
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureReproductionMinAge: {
    label: 'Min Repro Age (s)',
    description: 'Minimum age required to reproduce.',
    min: 0,
    max: 300,
    step: 10,
    unit: 's',
    category: 'reproduction',
    control: 'slider'
  },
  creatureReproductionMinEnergyRatio: {
    label: 'Repro Min Energy Ratio',
    description: 'Energy ratio required to reproduce.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureReproductionMinWaterRatio: {
    label: 'Repro Min Water Ratio',
    description: 'Water ratio required to reproduce.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureReproductionRange: {
    label: 'Repro Range',
    description: 'Base distance to complete mating.',
    min: 0.5,
    max: 12,
    step: 0.5,
    unit: 'tiles',
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureReproductionRangeWhileSeeking: {
    label: 'Repro Range (Seeking)',
    description: 'Mating range while in mate-seek intent.',
    min: 1,
    max: 20,
    step: 0.5,
    unit: 'tiles',
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureReproductionCooldown: {
    label: 'Repro Cooldown (s)',
    description: 'Cooldown after successful reproduction.',
    min: 0,
    max: 600,
    step: 10,
    unit: 's',
    category: 'reproduction',
    control: 'slider'
  },
  creatureReproductionFailedCooldown: {
    label: 'Repro Failed Cooldown (s)',
    description: 'Cooldown after failed conception.',
    min: 0,
    max: 120,
    step: 1,
    unit: 's',
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureReproductionFailedCostMultiplier: {
    label: 'Repro Failed Cost Mult',
    description: 'Cost multiplier on failed attempts.',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureReproductionEnergyCost: {
    label: 'Repro Energy Cost',
    description: 'Energy cost per mating attempt.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureReproductionWaterCost: {
    label: 'Repro Water Cost',
    description: 'Water cost per mating attempt.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureReproductionStaminaCost: {
    label: 'Repro Stamina Cost',
    description: 'Stamina cost per mating attempt.',
    min: 0,
    max: 1,
    step: 0.01,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureGestationTime: {
    label: 'Gestation (s)',
    description: 'Base gestation duration.',
    min: 10,
    max: 300,
    step: 5,
    unit: 's',
    category: 'reproduction',
    control: 'slider'
  },
  creatureGestationTraitEnabled: {
    label: 'Gestation Trait Enabled',
    description: 'Allow gestation trait modifiers.',
    type: 'boolean',
    category: 'reproduction'
  },
  creaturePregnancyEnabled: {
    label: 'Pregnancy Enabled',
    description: 'Enable pregnancy mode.',
    type: 'boolean',
    category: 'reproduction'
  },
  creatureConceptionChance: {
    label: 'Conception %',
    description: 'Chance of conception per mating.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'reproduction',
    control: 'slider'
  },
  creaturePregnancyMetabolismMultiplier: {
    label: 'Pregnancy Metabolism Mult',
    description: 'Metabolism multiplier while pregnant.',
    min: 0.5,
    max: 2,
    step: 0.02,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creaturePregnancyMoveSpeedMultiplier: {
    label: 'Pregnancy Move Speed Mult',
    description: 'Movement speed multiplier while pregnant.',
    min: 0.5,
    max: 1,
    step: 0.02,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creaturePregnancyMiscarriageEnabled: {
    label: 'Miscarriage Enabled',
    description: 'Enable miscarriage checks.',
    type: 'boolean',
    category: 'reproduction'
  },
  creaturePregnancyMiscarriageEnergyRatio: {
    label: 'Miscarriage Energy Ratio',
    description: 'Energy ratio below which miscarriage can occur.',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creaturePregnancyMiscarriageChancePerSecond: {
    label: 'Miscarriage chance/s',
    description: 'Miscarriage probability per second.',
    min: 0,
    max: 1,
    step: 0.05,
    unit: '/s',
    category: 'reproduction',
    control: 'slider'
  },
  creatureMateSeekingEnabled: {
    label: 'Mate Seeking Enabled',
    description: 'Enable mate-seeking intent.',
    type: 'boolean',
    category: 'reproduction'
  },
  creatureMateSeekRange: {
    label: 'Mate Seek Range',
    description: 'Range to lock onto a mate target.',
    min: 0,
    max: 80,
    step: 1,
    unit: 'tiles',
    category: 'reproduction',
    control: 'slider'
  },
  creatureMateSeekCommitTime: {
    label: 'Mate Seek Commit (s)',
    description: 'Commit time to current mate target.',
    min: 0,
    max: 5,
    step: 0.1,
    unit: 's',
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureMateSeekPriorityOverridesNeeds: {
    label: 'Mate Seek Overrides Needs',
    description:
      'Allow eligible mating and blind mate search to override hunger/thirst, including an ongoing meal or drink. Without this, eligible animals may still court observed partners when no immediate meal or drink is available.',
    type: 'boolean',
    category: 'reproduction'
  },
  creatureOffspringEnergy: {
    label: 'Offspring Energy',
    description: 'Base offspring energy before multipliers.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureOffspringWater: {
    label: 'Offspring Water',
    description: 'Base offspring water before multipliers.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureOffspringStamina: {
    label: 'Offspring Stamina',
    description: 'Base offspring stamina before multipliers.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureOffspringHp: {
    label: 'Offspring HP',
    description: 'Base offspring HP before multipliers.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureBirthChildStartingMetersFastMultiplier: {
    label: 'Birth Fast Mult',
    description: 'Multiplier for fast-gestation newborns.',
    min: 0.5,
    max: 1.5,
    step: 0.02,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureBirthChildStartingMetersSlowMultiplier: {
    label: 'Birth Slow Mult',
    description: 'Multiplier for slow-gestation newborns.',
    min: 0.5,
    max: 1.5,
    step: 0.02,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureBirthChildStartingMetersFastIfMultiplierBelow: {
    label: 'Birth Fast If <',
    description: 'Threshold for fast newborn multiplier.',
    min: 0.5,
    max: 1.5,
    step: 0.02,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  },
  creatureBirthChildStartingMetersSlowIfMultiplierAbove: {
    label: 'Birth Slow If >',
    description: 'Threshold for slow newborn multiplier.',
    min: 0.5,
    max: 1.5,
    step: 0.02,
    category: 'reproduction',
    control: 'slider',
    advanced: true
  }
};
