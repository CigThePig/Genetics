// Constructed observation/foraging fixture, not wild adaptive-evolution evidence.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
import { worldProvenance } from './world-provenance.mjs';
export async function threatChoice({
  root = '.',
  gene = 0.5,
  distance = 8,
  seed = 1,
  seconds = 10
} = {}) {
  const at = (p) => pathToFileURL(resolve(root, 'src/sim', p));
  const [
    { createSim },
    { createCreatureTraits },
    { createRng },
    { updateCreatureHerding },
    { updateBehaviorIntegration },
    { updateCreatureMovement },
    { applyCreatureActions }
  ] = await Promise.all([
    import(at('sim.js')),
    import(at('creatures/traits.js')),
    import(at('rng.js')),
    import(at('creatures/herding.js')),
    import(at('creatures/behavior-integration.js')),
    import(at('creatures/movement.js')),
    import(at('creatures/actions.js'))
  ]);
  const sim = createSim({
    seed,
    worldWidth: 40,
    worldHeight: 24,
    creatureCount: 4,
    creaturePredatorCount: 2,
    bushCount: 0,
    colourCamouflageEnabled: false
  });
  const prey = sim.state.creatures.find((c) => c.species === 'circle');
  const predator = sim.state.creatures.find((c) => c.species === 'triangle');
  const creatures = [prey, predator],
    world = sim.state.world,
    config = sim.config,
    rng = createRng(seed);
  for (let y = 0; y < world.height; y++)
    for (let x = 0; x < world.width; x++) {
      world.setTerrainAt(x, y, 'plains');
      world.setGrassAt(x, y, 1);
    }
  prey.genome.alertness = gene;
  prey.traits = createCreatureTraits({ config, species: prey.species, genome: prey.genome });
  prey.position = { x: 15.5, y: 12.5 };
  predator.position = { x: 15.5 + distance, y: 12.5 };
  prey.intent = { type: 'eat', foodType: 'grass' };
  prey.meters.energy = 0.1;
  predator.intent = { type: 'rest' };
  let escaping = 0,
    firstEscapeTick = null,
    feedingTicks = 0,
    feedingWhileEscaping = 0,
    energyIntegral = 0;
  for (let tick = 1; tick <= seconds * config.ticksPerSecond; tick++) {
    const options = { creatures, config, rng, world, tick, metrics: sim.state.metrics };
    updateCreatureHerding(options);
    updateBehaviorIntegration(options);
    if (prey.herding.isThreatened) {
      escaping++;
      firstEscapeTick ??= tick;
    }
    updateCreatureMovement({ ...options, creatures: [prey] });
    const before = prey.meters.energy;
    applyCreatureActions({ ...options, creatures: [prey] });
    if (prey.meters.energy > before) {
      feedingTicks++;
      if (prey.herding.isThreatened) feedingWhileEscaping++;
    }
    energyIntegral += prey.meters.energy / config.ticksPerSecond;
  }
  return {
    seed,
    gene,
    distance,
    seconds,
    alertness: prey.traits.alertness,
    escapingSeconds: escaping / config.ticksPerSecond,
    firstEscapeTick,
    feedingSeconds: feedingTicks / config.ticksPerSecond,
    energy: prey.meters.energy,
    meanEnergy: energyIntegral / seconds,
    feedingWhileEscapingSeconds: feedingWhileEscaping / config.ticksPerSecond,
    position: prey.position
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = Object.fromEntries(
    process.argv.slice(2).map((s) => s.replace(/^--/, '').split('='))
  );
  const source = worldProvenance(args.root ?? '.');
  const results = [];
  for (const seed of [1, 42, 1337, 2, 7, 19])
    for (const gene of [0.1, 0.5, 0.9])
      for (const distance of [4, 8, 11])
        results.push(await threatChoice({ root: args.root, seed, gene, distance }));
  writeFileSync(
    args.out,
    JSON.stringify(
      {
        source,
        description:
          'Stationary observed predator; fixed grass-feeding intent and uniform grass. Production herding, behavior, movement, and feeding; no pursuit or reproduction. Measures decision and opportunity cost only.',
        results
      },
      null,
      2
    )
  );
}
