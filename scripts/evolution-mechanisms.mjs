// Constructed causal fixtures, not normal runs or proof of wild adaptation.
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
import { createSim } from '../src/sim/sim.js';
import { createRng } from '../src/sim/rng.js';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { createCreatureTraits } from '../src/sim/creatures/traits.js';
import { updateCreatureBasalMetabolism } from '../src/sim/creatures/metabolism.js';
import { updateCreatureMovement } from '../src/sim/creatures/movement.js';
import { updateCreatureReproduction } from '../src/sim/creatures/reproduction.js';

export function reproductiveMechanism({
  seed = 1,
  species = 'circle',
  speed = 0.1,
  environment = 'energy',
  ablate = false
} = {}) {
  const sim = createSim({
    seed,
    worldWidth: 20,
    worldHeight: 20,
    creatureCount: 24,
    creaturePredatorCount: 12,
    creatureGenomeJitter: 0,
    colourInitialVariation: 0,
    colourCamouflageEnabled: false,
    colourMatePreferenceEnabled: false,
    creatureConceptionChance: 1,
    creatureGestationTime: 1 / 60,
    creatureGestationTraitEnabled: false,
    creatureReproductionRange: 1,
    creatureReproductionRangeWhileSeeking: 1,
    creatureGenomeMutationRate: 0,
    creatureGenomeInheritanceNoise: 0,
    ...(ablate
      ? environment === 'energy'
        ? { creatureTradeoffSpeedToEnergyDrainScale: 0 }
        : { creatureGenomeRanges: { speed: { min: 1, max: 1 } } }
      : {})
  });
  const creatures = sim.state.creatures.filter((c) => c.species === species).slice(0, 2);
  const world = createWorldGrid({ width: 40, height: 10, defaultTerrain: 'plains' }),
    config = sim.config,
    rng = createRng(seed);
  for (const [i, c] of creatures.entries()) {
    c.genome.speed = speed;
    c.traits = createCreatureTraits({ config, species, genome: c.genome });
    c.sex = i ? 'female' : 'male';
    c.ageTicks = 6000;
    c.lifeStage = { id: 'adult', movementScale: 1, metabolismScale: 1 };
    c.meters = { energy: environment === 'energy' ? 0.78 : 1, water: 1, stamina: 1, hp: 1 };
    c.position = { x: environment === 'energy' ? 5 : i ? 25 : 5, y: 5 };
    c.motion = { heading: 0, currentSpeed: 0, velocity: { x: 0, y: 0 } };
    c.herding = {};
    c.pack = {};
    c.intent = i ? { type: 'rest' } : { type: 'seek', target: { x: 25, y: 5 } };
    c.reproduction.cooldownTicks = environment === 'energy' ? 480 : 0;
  }
  const options = { creatures, world, config, rng, metrics: sim.state.metrics };
  if (environment === 'energy')
    for (let i = 0; i < 480; i++) {
      updateCreatureBasalMetabolism(options);
      updateCreatureReproduction(options);
    }
  else
    for (let i = 0; i < 210; i++) updateCreatureMovement({ ...options, creatures: [creatures[0]] });
  const before = creatures.map((c) => ({
    energy: c.meters.energy,
    position: { ...c.position },
    speed: c.traits.speed,
    drain: c.traits.basalEnergyDrain
  }));
  updateCreatureReproduction(options);
  updateCreatureReproduction(options);
  return {
    seed,
    species,
    speed,
    environment,
    ablate,
    before,
    births: sim.state.metrics.birthsTotal,
    pregnancies: sim.state.metrics.pregnanciesTotal,
    offspring: creatures
      .slice(2)
      .map((c) => ({ speed: c.genome.speed, parents: c.lineage.parents }))
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = [];
  for (const seed of [1, 42, 1337])
    for (const species of ['square', 'circle', 'triangle', 'octagon'])
      for (const speed of [0.1, 0.9])
        for (const environment of ['energy', 'deadline'])
          for (const ablate of [false, true])
            results.push(reproductiveMechanism({ seed, species, speed, environment, ablate }));
  writeFileSync(
    process.argv[2],
    JSON.stringify(
      {
        description:
          'Constructed local parental pairs; fixed maturity, conception probability 1, one-tick gestation, no mutation. Energy pulse: .78 reserves and 8 seconds recovery without food. Deadline: one moving male, stationary female 20 tiles away, mating evaluated after 3.5 seconds. Production metabolism/movement/reproduction/inheritance, with cost or speed-mapping ablations.',
        results
      },
      null,
      2
    )
  );
  console.log(
    JSON.stringify(
      results.map(({ species, speed, environment, ablate, births }) => ({
        species,
        speed,
        environment,
        ablate,
        births
      }))
    )
  );
}
