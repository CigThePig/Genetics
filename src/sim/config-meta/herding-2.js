export const metaHerding2 = {
  creatureHerdingTargetBlendIsolationBoost: {
    label: 'Legacy: Isolation Boost',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
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
    label: 'Legacy: Regroup Strength',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingRegroupIntervalSeconds: {
    label: 'Legacy: Regroup Interval (s)',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0.1,
    max: 5,
    step: 0.1,
    unit: 's',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingAnchorEnabled: {
    label: 'Legacy: Anchor Enabled',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    type: 'boolean',
    category: 'herding',
    advanced: true
  },
  creatureHerdingAnchorEvalSeconds: {
    label: 'Legacy: Anchor Eval (s)',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0.25,
    max: 6,
    step: 0.25,
    unit: 's',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingAnchorCooldownSeconds: {
    label: 'Legacy: Anchor Cooldown (s)',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0.25,
    max: 6,
    step: 0.25,
    unit: 's',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingAnchorSearchRadius: {
    label: 'Legacy: Anchor Search Radius',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingAnchorCandidateCount: {
    label: 'Legacy: Anchor Candidates',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 1,
    max: 40,
    step: 1,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingAnchorDriftSpeed: {
    label: 'Legacy: Anchor Drift Speed',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 10,
    step: 0.1,
    unit: 'tiles/s',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingAnchorPullStrength: {
    label: 'Legacy: Anchor Pull Strength',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 2,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingAnchorSoftRadiusBase: {
    label: 'Legacy: Anchor Soft Radius Base',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingAnchorSoftRadiusScale: {
    label: 'Legacy: Anchor Soft Radius Scale',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0.1,
    max: 3,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingAnchorMaxInfluenceDistance: {
    label: 'Legacy: Anchor Max Influence',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingAnchorFoodSampleRadius: {
    label: 'Legacy: Anchor Food Radius',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 1,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingAnchorWaterSearchMax: {
    label: 'Legacy: Anchor Water Search',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingAnchorThreatHalfLifeSeconds: {
    label: 'Legacy: Anchor Threat Half-Life (s)',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 1,
    max: 30,
    step: 0.5,
    unit: 's',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingAnchorSwitchMargin: {
    label: 'Legacy: Anchor Switch Margin',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0.1,
    max: 1,
    step: 0.05,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureHerdingAnchorRandomness: {
    label: 'Legacy: Anchor Randomness',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
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
    label: 'Legacy: Water Rendezvous Eval (s)',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0.25,
    max: 12,
    step: 0.25,
    unit: 's',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureWaterRendezvousCooldownSeconds: {
    label: 'Legacy: Water Rendezvous Cooldown (s)',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0.25,
    max: 12,
    step: 0.25,
    unit: 's',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureWaterRendezvousSearchRadius: {
    label: 'Legacy: Water Rendezvous Radius',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 5,
    max: 120,
    step: 1,
    unit: 'tiles',
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureWaterRendezvousCandidateCount: {
    label: 'Legacy: Water Rendezvous Candidates',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 4,
    max: 32,
    step: 1,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creatureWaterRendezvousThirstPressureThreshold: {
    label: 'Legacy: Water Rendezvous Pressure',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 0.5,
    step: 0.01,
    category: 'herding',
    control: 'slider',
    advanced: true
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
    label: 'Legacy: Water Rendezvous Anchor',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    type: 'boolean',
    category: 'herding',
    advanced: true
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
    label: 'Legacy: Post-Drink Anchor Boost',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creaturePostDrinkRegroupDeadzoneMultiplier: {
    label: 'Legacy: Post-Drink Deadzone Mult',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'herding',
    control: 'slider',
    advanced: true
  },
  creaturePostDrinkRegroupTargetBlendBoost: {
    label: 'Legacy: Post-Drink Target Blend',
    description: 'Legacy preset compatibility. Inactive in the local goal engine.',
    min: 0,
    max: 1,
    step: 0.02,
    category: 'herding',
    control: 'slider',
    advanced: true
  }
};
