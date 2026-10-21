import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const root = resolve(args.root ?? '.');
const { createSim } = await import(pathToFileURL(resolve(root, 'src/sim/sim.js')));
const species = ['square', 'triangle', 'circle', 'octagon'];
const ticks = Number(args.ticks ?? 36000);
assert(Number.isInteger(ticks) && ticks > 0, '--ticks must be a positive integer');
const seeds = (args.seeds ?? '1,42,1337').split(',').map(Number);
assert(seeds.length && seeds.every(Number.isInteger), '--seeds must be comma-separated integers');
const overrides = JSON.parse(args.config ?? '{}');
const predators = new Set(['triangle', 'octagon']);
assert(!args.only || predators.has(args.only), '--only must be triangle or octagon');
assert(
  overrides && typeof overrides === 'object' && !Array.isArray(overrides),
  '--config must be a JSON object'
);
if (args['founder-ages'])
  assert(
    Number(args['founder-ages']) >= 0 && Number(args['founder-ages']) < 1,
    '--founder-ages must be a lifespan fraction in [0,1)'
  );
for (const seed of seeds) {
  const sim = createSim({ ...overrides, seed });
  if (args.only)
    sim.state.creatures = sim.state.creatures.filter(
      (c) => !predators.has(c.species) || c.species === args.only
    );
  if (args['founder-ages']) {
    const { createRng } = await import(pathToFileURL(resolve(root, 'src/sim/rng.js')));
    const ages = createRng(seed + 7919);
    for (const c of sim.state.creatures)
      c.ageTicks = Math.floor(ages.nextFloat() * c.maxAgeTicks * Number(args['founder-ages']));
  }
  if (args['no-prey'] === 'true')
    sim.state.creatures = sim.state.creatures.filter((c) => predators.has(c.species));
  const initial = sim.state.creatures.length;
  const initialLifetimes = sim.state.creatures.map((c) => ({
    id: c.id,
    species: c.species,
    sex: c.sex,
    maxAgeTicks: c.maxAgeTicks,
    maturityScale: c.maturityScale,
    traits: c.traits
  }));
  const life = new Map(sim.state.creatures.map((c) => [c.id, c]));
  const deaths = [],
    history = [],
    births = [];
  const physiologicalTicks = Object.fromEntries(
    species.map((s) => [s, { eligible: 0, eligibleMale: 0, eligibleFemale: 0 }])
  );
  const activity = Object.fromEntries(species.map((s) => [s, {}]));
  const extinct = Object.fromEntries(species.map((s) => [s, null]));
  const max = Object.fromEntries(species.map((s) => [s, 0]));
  const generations = Object.fromEntries(species.map((s) => [s, {}]));
  const nutrition = Object.fromEntries(
    species.map((s) => [
      s,
      { positiveEnergy: 0, negativeEnergy: 0, huntDistance: 0, huntStaminaLoss: 0, outcomes: {} }
    ])
  );
  const snapshot = () => {
    const rows = Object.fromEntries(
      species.map((s) => [
        s,
        {
          n: 0,
          male: 0,
          female: 0,
          matureMale: 0,
          matureFemale: 0,
          ready: 0,
          pregnant: 0,
          energy: 0,
          water: 0,
          maxGeneration: 0,
          juvenile: 0,
          nearestPrey: 0,
          nearestMate: 0,
          mateSamples: 0
        }
      ])
    );
    for (const c of sim.state.creatures) {
      const r = rows[c.species];
      r.n++;
      r[c.sex]++;
      const mature =
        c.ageTicks * c.maturityScale >=
        sim.config.creatureReproductionMinAge * sim.config.ticksPerSecond;
      if (mature) r[c.sex === 'male' ? 'matureMale' : 'matureFemale']++;
      if (
        mature &&
        c.reproduction.cooldownTicks <= 0 &&
        c.meters.energy >=
          sim.config.creatureBaseEnergy * sim.config.creatureReproductionMinEnergyRatio &&
        c.meters.water >=
          sim.config.creatureBaseWater * sim.config.creatureReproductionMinWaterRatio &&
        !c.reproduction.pregnancy?.isPregnant
      )
        r.ready++;
      r.pregnant += Number(!!c.reproduction.pregnancy?.isPregnant);
      r.energy += c.meters.energy;
      r.water += c.meters.water;
      r.maxGeneration = Math.max(r.maxGeneration, c.generation);
      r.juvenile += Number(!mature);
      if (predators.has(c.species)) {
        const distance = (d) =>
          Math.hypot(c.position.x - d.position.x, c.position.y - d.position.y);
        const prey = sim.state.creatures.filter(
          (d) => d.species === (c.species === 'triangle' ? 'circle' : 'square')
        );
        r.nearestPrey += prey.length ? Math.min(...prey.map(distance)) : 0;
        const mates = sim.state.creatures.filter((d) => d.species === c.species && d.sex !== c.sex);
        if (mates.length) {
          r.nearestMate += Math.min(...mates.map(distance));
          r.mateSamples++;
        }
      }
    }
    for (const s of species) {
      const r = rows[s];
      max[s] = Math.max(max[s], r.n);
      if (!r.n && extinct[s] === null) extinct[s] = sim.state.tick;
      if (r.n) {
        r.energy /= r.n;
        r.water /= r.n;
        r.nearestPrey /= r.n;
      }
      if (r.mateSamples) r.nearestMate /= r.mateSamples;
    }
    history.push({
      tick: sim.state.tick,
      species: rows,
      births: { ...sim.state.metrics.birthsBySpeciesTotal },
      kills: { ...sim.state.metrics.killsByPredatorSpecies },
      deaths: { ...sim.state.metrics.deathsBySpeciesTotal }
    });
  };
  snapshot();
  const start = performance.now();
  for (let t = 0; t < ticks; t++) {
    const before = sim.state.creatures
      .filter((c) => predators.has(c.species))
      .map((c) => ({
        c,
        energy: c.meters.energy,
        stamina: c.meters.stamina,
        x: c.position.x,
        y: c.position.y,
        hunt: c.intent?.type === 'hunt'
      }));
    sim.tick();
    const ids = new Set();
    for (const c of sim.state.creatures) {
      ids.add(c.id);
      if (!life.has(c.id)) {
        life.set(c.id, c);
        births.push({
          id: c.id,
          species: c.species,
          sex: c.sex,
          generation: c.generation,
          tick: sim.state.tick
        });
      }
      if (
        c.ageTicks * c.maturityScale >=
          sim.config.creatureReproductionMinAge * sim.config.ticksPerSecond &&
        c.reproduction.cooldownTicks <= 0 &&
        !c.reproduction.pregnancy?.isPregnant &&
        c.meters.energy >=
          sim.config.creatureBaseEnergy * sim.config.creatureReproductionMinEnergyRatio &&
        c.meters.water >=
          sim.config.creatureBaseWater * sim.config.creatureReproductionMinWaterRatio
      ) {
        const r = physiologicalTicks[c.species];
        r.eligible++;
        r[c.sex === 'male' ? 'eligibleMale' : 'eligibleFemale']++;
      }
    }
    for (const [id, c] of life)
      if (!ids.has(id)) {
        deaths.push({
          id,
          species: c.species,
          sex: c.sex,
          generation: c.generation,
          tick: sim.state.tick,
          age: c.ageTicks,
          maxAge: c.maxAgeTicks,
          cause: c.deathCause,
          lifeStage: c.lifeStage?.id,
          traits: c.traits,
          meters: { ...c.meters },
          position: { ...c.position },
          pregnant: !!c.reproduction.pregnancy?.isPregnant,
          intent: c.intent?.type
        });
        life.delete(id);
      }
    for (const { c, energy, stamina, x, y, hunt } of before) {
      const a = activity[c.species],
        n = nutrition[c.species];
      const key = c.intent?.type + (c.intent?.foodType ? ':' + c.intent.foodType : '');
      a[key] = (a[key] ?? 0) + 1;
      const delta = c.meters.energy - energy;
      n[delta > 0 ? 'positiveEnergy' : 'negativeEnergy'] += Math.abs(delta);
      if (hunt) {
        n.huntDistance += Math.hypot(c.position.x - x, c.position.y - y);
        n.huntStaminaLoss += Math.max(0, stamina - c.meters.stamina);
      }
      if (c.chase?.lastOutcomeTick === sim.state.tick) {
        const o = c.chase.lastOutcome;
        n.outcomes[o] = (n.outcomes[o] ?? 0) + 1;
      }
    }
    if (sim.state.tick % 600 === 0) snapshot();
    if (args.progress === 'true' && sim.state.tick % 36000 === 0)
      console.error(
        JSON.stringify({ seed, tick: sim.state.tick, population: sim.state.creatures.length })
      );
    if (
      sim.state.creatures.length !==
      initial + sim.state.metrics.birthsTotal - sim.state.metrics.deathsTotal
    )
      throw new Error('Population accounting');
  }
  for (const c of sim.state.creatures) {
    const g = generations[c.species];
    g[c.generation] = (g[c.generation] ?? 0) + 1;
  }
  console.log(
    JSON.stringify({
      seed,
      ticks,
      root,
      overrides,
      only: args.only,
      noPrey: args['no-prey'],
      founderAges: args['founder-ages'],
      initialLifetimes,
      births,
      physiologicalTicks,
      finalTraits: sim.state.creatures.map((c) => ({
        id: c.id,
        species: c.species,
        traits: c.traits
      })),
      milliseconds: performance.now() - start,
      initial,
      max,
      extinct,
      generations,
      activity,
      nutrition,
      deaths,
      history,
      metrics: sim.state.metrics,
      hash: createHash('sha256')
        .update(JSON.stringify({ creatures: sim.state.creatures, summary: sim.getSummary() }))
        .digest('hex')
    })
  );
}
