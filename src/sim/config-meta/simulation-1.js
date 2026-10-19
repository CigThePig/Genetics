export const metaSimulation1 = {
  seed: {
    label: 'Seed',
    description: 'RNG seed for terrain, plants, and creature spawn.',
    min: 1,
    max: 999999,
    step: 1,
    category: 'simulation',
    control: 'number'
  },
  hotspotSeed: {
    label: 'Hotspot Seed',
    description: 'Defined in simConfig but not referenced elsewhere in the current code.',
    min: 1,
    max: 999999,
    step: 1,
    category: 'simulation',
    control: 'number',
    advanced: true
  },
  ticksPerSecond: {
    label: 'Ticks per second',
    description: 'Simulation time setting.',
    min: 1,
    max: 120,
    step: 1,
    category: 'simulation',
    unit: 'ticks/s',
    advanced: true
  }
};
