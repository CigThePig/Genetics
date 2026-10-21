// Deliberately stationary healthy pairs isolate food/water recovery from navigation.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = resolve(process.argv[2] ?? '.');
const load = (p) => import(pathToFileURL(resolve(root, 'src/sim/' + p + '.js')));
const { createSim } = await load('sim');
const { updateCreatureIntent, updateCreaturePriority } = await load('creatures/intent');
const { updateCreaturePerception } = await load('creatures/perception');
const { applyCreatureActions } = await load('creatures/actions');
const { updateCreatureBasalMetabolism } = await load('creatures/metabolism');
const { updateCreatureReproduction } = await load('creatures/reproduction');
const { applyCreatureDeaths } = await load('creatures/death');
const { createRng } = await load('rng');
const { updateCreatureLifeStages } = await load('creatures/index');
const { spawnCarcass } = await load('plants/carcasses');
for (const mode of ['meat', 'water', 'pair', 'no-food', 'same-sex', 'no-partner', 'isolated']) {
  const sim = createSim({
    seed: 42,
    worldWidth: 20,
    worldHeight: 20,
    creatureCount: 4,
    creaturePredatorCount: 4,
    colourCamouflageEnabled: false
  });
  const { world, metrics } = sim.state;
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      world.setTerrainAt(x, y, 'plains');
      world.setGrassAt(x, y, 0);
    }
  world.bushes = [];
  world.carcasses = [];
  world.setTerrainAt(9, 10, 'water');
  const creatures = sim.state.creatures.filter((c) => c.species === 'triangle');
  if (mode === 'no-partner') creatures.pop();
  if (mode === 'same-sex') creatures[1].sex = creatures[0].sex;
  if (mode === 'isolated') creatures[1].position = { x: 18.5, y: 18.5 };
  for (const [i, c] of creatures.entries()) {
    if (mode !== 'isolated' || i === 0) c.position = { x: 10.5, y: 10.5 };
    c.ageTicks = 6000;
    c.maturityScale = 1;

    c.traits.eatThreshold = 0.75;
    c.traits.drinkThreshold = 0.75;
    c.traits.basalEnergyDrain = 0.007;
    c.traits.basalWaterDrain = 0.009;
    c.meters.energy = mode === 'water' ? 1 : 0.5;
    c.meters.water = mode === 'meat' ? 1 : 0.5;
    if (mode === 'meat') c.traits.basalWaterDrain = 0;
    if (mode === 'water') c.traits.basalEnergyDrain = 0;
  }
  if (mode !== 'no-food') spawnCarcass({ world, x: 10, y: 10, meat: 6, config: sim.config });
  const rng = createRng(42),
    activity = {},
    maxEnergy = creatures[0].meters.energy,
    maxWater = creatures[0].meters.water;
  let e = maxEnergy,
    w = maxWater,
    gross = 0;
  let maxGeneration = 0;
  const ticks = mode === 'meat' || mode === 'water' ? 600 : 36000;
  for (let tick = 1; tick <= ticks; tick++) {
    const options = { creatures, config: sim.config, world, metrics, rng, tick };
    updateCreaturePriority(options);
    updateCreaturePerception(options);
    updateCreatureIntent(options);
    const before = creatures.reduce((sum, c) => sum + c.meters.energy, 0);
    applyCreatureActions(options);
    gross += creatures.reduce((sum, c) => sum + c.meters.energy, 0) - before;
    updateCreatureBasalMetabolism(options);
    updateCreatureLifeStages(options);
    if (!['meat', 'water'].includes(mode)) updateCreatureReproduction(options);
    applyCreatureDeaths(options);
    for (const c of creatures) maxGeneration = Math.max(maxGeneration, c.generation);
    if (creatures[0]) {
      e = Math.max(e, creatures[0].meters.energy);
      w = Math.max(w, creatures[0].meters.water);
      const k = creatures[0].intent.type;
      activity[k] = (activity[k] ?? 0) + 1;
    }
  }
  console.log(
    JSON.stringify({
      mode,
      root,
      ticks,
      maxEnergy: e,
      maxWater: w,
      gross,
      activity,
      population: creatures.length,
      maxGeneration,
      survivingGenerations: creatures.map((c) => c.generation),
      metrics
    })
  );
}
