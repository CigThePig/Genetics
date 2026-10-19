export const metaHerding2 = {
  creatureHerdingTargetBlendIsolationBoost: {
    label: 'Isolation Boost',
    description: 'Extra blend when isolated.',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingUseWorker: {
    label: 'Herding Worker',
    description:
      'Legacy setting. Authoritative herding runs synchronously to preserve seeded replay.',
    min: 0,
    max: 1,
    step: 1,
    category: 'herding',
    control: 'number',
    advanced: true
  },
  creatureHerdingRegroupEnabled: {
    label: 'Regroup Assist',
    description: 'Enable regroup assist behavior.',
    type: 'boolean',
    category: 'herding'
  },
  creatureHerdingRegroupMinLocalHerdSize: {
    label: 'Regroup Min Herd',
    description: 'Min local herd size for regroup.',
    min: 1,
    max: 10,
    step: 1,
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingRegroupRange: {
    label: 'Regroup Range',
    description: 'Range for regroup pull.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingRegroupStrength: {
    label: 'Regroup Strength',
    description: 'Strength of regroup pull.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingRegroupIntervalSeconds: {
    label: 'Regroup Interval (s)',
    description: 'Seconds between regroup evaluations.',
    min: 0.1,
    max: 5,
    step: 0.1,
    unit: 's',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorEnabled: {
    label: 'Anchor Enabled',
    description: 'Enable herd anchor system.',
    type: 'boolean',
    category: 'herding'
  },
  creatureHerdingAnchorEvalSeconds: {
    label: 'Anchor Eval (s)',
    description: 'Seconds between anchor evaluations.',
    min: 0.25,
    max: 6,
    step: 0.25,
    unit: 's',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorCooldownSeconds: {
    label: 'Anchor Cooldown (s)',
    description: 'Cooldown after anchor switch.',
    min: 0.25,
    max: 6,
    step: 0.25,
    unit: 's',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorSearchRadius: {
    label: 'Anchor Search Radius',
    description: 'Radius for anchor candidates.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorCandidateCount: {
    label: 'Anchor Candidates',
    description: 'Number of anchor candidates.',
    min: 1,
    max: 40,
    step: 1,
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorDriftSpeed: {
    label: 'Anchor Drift Speed',
    description: 'Anchor drift speed toward target.',
    min: 0,
    max: 10,
    step: 0.1,
    unit: 'tiles/s',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorPullStrength: {
    label: 'Anchor Pull Strength',
    description: 'Strength of anchor pull.',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorSoftRadiusBase: {
    label: 'Anchor Soft Radius Base',
    description: 'Base soft radius for anchor pull.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorSoftRadiusScale: {
    label: 'Anchor Soft Radius Scale',
    description: 'Scale for soft radius vs herd size.',
    min: 0.1,
    max: 3,
    step: 0.05,
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorMaxInfluenceDistance: {
    label: 'Anchor Max Influence',
    description: 'Max distance for anchor pull.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorFoodSampleRadius: {
    label: 'Anchor Food Radius',
    description: 'Food sampling radius for anchors.',
    min: 0,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorWaterSearchMax: {
    label: 'Anchor Water Search',
    description: 'Max steps for water search scoring.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorThreatHalfLifeSeconds: {
    label: 'Anchor Threat Half-Life (s)',
    description: 'Threat decay half-life for anchors.',
    min: 1,
    max: 30,
    step: 0.5,
    unit: 's',
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorSwitchMargin: {
    label: 'Anchor Switch Margin',
    description: 'Margin required to switch anchors.',
    min: 0.1,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider'
  },
  creatureHerdingAnchorRandomness: {
    label: 'Anchor Randomness',
    description: 'Randomness added to anchor scores.',
    min: 0,
    max: 0.25,
    step: 0.01,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureWaterRendezvousEnabled: {
    label: 'Water Rendezvous',
    description: 'Enable herd water rendezvous targets.',
    type: 'boolean',
    category: 'herding'
  },
  creatureWaterRendezvousEvalSeconds: {
    label: 'Water Rendezvous Eval (s)',
    description: 'Seconds between rendezvous evaluation.',
    min: 0.25,
    max: 12,
    step: 0.25,
    unit: 's',
    category: 'herding',
    control: 'slider'
  },
  creatureWaterRendezvousCooldownSeconds: {
    label: 'Water Rendezvous Cooldown (s)',
    description: 'Cooldown after switching rendezvous.',
    min: 0.25,
    max: 12,
    step: 0.25,
    unit: 's',
    category: 'herding',
    control: 'slider'
  },
  creatureWaterRendezvousSearchRadius: {
    label: 'Water Rendezvous Radius',
    description: 'Search radius for rendezvous targets.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureWaterRendezvousCandidateCount: {
    label: 'Water Rendezvous Candidates',
    description: 'Candidates evaluated per species.',
    min: 4,
    max: 32,
    step: 1,
    category: 'herding',
    control: 'slider'
  },
  creatureWaterRendezvousThirstPressureThreshold: {
    label: 'Water Rendezvous Pressure',
    description: 'Thirst pressure needed to evaluate.',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'herding',
    control: 'slider'
  },
  creatureWaterRendezvousMaxDistance: {
    label: 'Water Rendezvous Max Dist',
    description: 'Max distance for individual use.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider'
  },
  creatureWaterRendezvousPreferHerdAnchor: {
    label: 'Water Rendezvous Anchor',
    description: 'Prefer herd anchor for sampling.',
    type: 'boolean',
    category: 'herding'
  },
  creatureWaterRendezvousCommitSeconds: {
    label: 'Water Rendezvous Commit (s)',
    description: 'Seconds to commit to rendezvous.',
    min: 0.25,
    max: 12,
    step: 0.25,
    unit: 's',
    category: 'herding',
    control: 'slider'
  },
  creaturePostDrinkRegroupSeconds: {
    label: 'Post-Drink Regroup (s)',
    description: 'Regroup duration after drinking.',
    min: 0.25,
    max: 12,
    step: 0.25,
    unit: 's',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creaturePostDrinkRegroupAnchorBoost: {
    label: 'Post-Drink Anchor Boost',
    description: 'Boost anchor pull after drinking.',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creaturePostDrinkRegroupDeadzoneMultiplier: {
    label: 'Post-Drink Deadzone Mult',
    description: 'Deadzone multiplier after drinking.',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creaturePostDrinkRegroupTargetBlendBoost: {
    label: 'Post-Drink Target Blend',
    description: 'Target blend boost after drinking.',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'herding',
    control: 'slider',
    advanced: true
  }
};
