// Controlled cohorts use the real simulation; fixture changes are explicit, never production defaults.
export const scenarioNames = [
  'solitary',
  'peaceful',
  'travel',
  'rejoin',
  'search',
  'divided',
  'approach',
  'pursuit',
  'water',
  'multiple',
  'recovery'
];
export function createScenario(createSim, name, seed = 1) {
  if (name === 'default') return createSim({ seed });
  const sim = createSim({
    seed,
    worldWidth: 80,
    worldHeight: 80,
    creatureReproductionEnabled: false,
    creatureBasalEnergyDrain: 0,
    creatureBasalWaterDrain: 0,
    creatureMateSeekingEnabled: false,
    creatureWaterRendezvousEnabled: false,
    colourCamouflageEnabled: false
  });
  const world = sim.state.world;
  for (let y = 0; y < world.height; y++)
    for (let x = 0; x < world.width; x++) {
      world.setTerrainAt(x, y, 'plains');
      world.setGrassAt(x, y, 0.8);
    }
  world.bushes = [];
  world.carcasses = [];
  const herb = sim.state.creatures
    .filter((c) => c.species === 'circle')
    .slice(0, name === 'solitary' ? 1 : 9);
  const pred = sim.state.creatures
    .filter((c) => c.species === 'triangle')
    .slice(0, ['search', 'divided', 'multiple'].includes(name) ? 4 : 1);
  const peaceful = ['solitary', 'peaceful', 'travel', 'rejoin'].includes(name);
  sim.state.creatures = [...herb, ...(peaceful ? [] : pred)];
  if (['search', 'divided'].includes(name)) sim.state.creatures = pred;
  for (const [i, c] of herb.entries()) {
    c.position = { x: 40 + (i % 3) * 3, y: 32 + Math.floor(i / 3) * 3 };
    c.meters.energy = 0.95;
    c.meters.water = 0.98;
    c.motion = { heading: 0 };
    c.ageTicks = 0;
  }
  if (name === 'rejoin') herb[0].position = { x: 23, y: 32 };
  for (const [i, c] of pred.entries()) {
    c.position = { x: 22 - i * 2, y: 34 + i * 2 };
    c.meters.energy = 0.55;
    c.meters.water = 0.98;
    c.motion = { heading: 0 };
  }
  if (name === 'multiple') pred[2].position = { x: 63, y: 35 };
  if (name === 'divided') {
    pred[2].position = { x: 64, y: 62 };
    pred[3].position = { x: 67, y: 62 };
  }
  if (['water', 'divided'].includes(name))
    for (let y = 4; y < 76; y++) {
      if (y >= 42 && y <= 48) continue;
      world.setTerrainAt(35, y, 'water');
      world.setTerrainAt(36, y, 'water');
    }
  if (name === 'travel')
    for (const c of herb) {
      c.meters.energy = 0.55;
      for (let y = 25; y < 48; y++) for (let x = 30; x < 53; x++) world.setGrassAt(x, y, 0);
    }
  if (name === 'approach') {
    pred[0].pack = {
      waypoint: { x: 41, y: 36 },
      waypointTicksRemaining: 10000,
      home: { ...pred[0].position }
    };
    for (const c of herb)
      c.behaviorState = {
        state: 'relaxed',
        phase: 'paused',
        phaseLockedUntilTick: 180,
        lockedUntilTick: 0,
        ticksInState: 0,
        ticksInPhase: 0
      };
  }
  if (name === 'pursuit') pred[0].position = { x: 37, y: 34 };
  return sim;
}
export function scenarioStep(sim, name) {
  // Remove the threat after 15 seconds to isolate recovery without killing it.
  if (name === 'recovery' && sim.state.tick === 900)
    sim.state.creatures = sim.state.creatures.filter((c) => c.species === 'circle');
  sim.tick();
}
