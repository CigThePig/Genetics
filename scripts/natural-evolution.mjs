// Controlled habitats, full production tick. No selection weights or demographic rescue.
import { recordEvolution } from './investigate-evolution.mjs';
import { createRng, deriveSeed } from '../src/sim/rng.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export function prepareHabitat(
  sim,
  { habitat, genomes, seed, water = 'channels', polymorphism, removePredators },
  {
    createCreatureTraits,
    resolveCreatureMaturityScale,
    resolveCreatureMaxAgeTicks,
    getTerrainEffects
  }
) {
  const w = sim.state.world;
  // Identical permanent water channels every 16 tiles. Only land terrain differs.
  for (let y = 0; y < w.height; y++)
    for (let x = 0; x < w.width; x++) {
      const terrain = (water === 'edge' ? x === 0 : x % 16 === 0) ? 'water' : habitat;
      w.setTerrainAt(x, y, terrain);
      w.setGrassAt(x, y, getTerrainEffects(terrain).plantCap);
      w.setGrassStressAt(x, y, 0);
    }
  w.bushes = [];
  const rng = createRng(seed);
  if (polymorphism) {
    assert.equal(
      polymorphism,
      'alertness',
      'Only the preregistered vigilance contrast is supported'
    );
    const groups = new Map();
    for (const c of sim.state.creatures) {
      const key = `${c.species}:${c.sex}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(c);
    }
    for (const [key, cs] of groups) {
      const draw = createRng(deriveSeed(seed, `vigilance:${key}`));
      const values = cs.map((_, i) => (i % 2 ? 0.9 : 0.1));
      for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(draw.nextFloat() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
      }
      for (const [i, c] of cs.entries()) c.genome.alertness = values[i];
    }
  }

  for (const c of sim.state.creatures) {
    if (genomes) {
      const pool = genomes.filter((g) => g.species === c.species);
      assert(
        pool.length,
        `No ${c.species} genomes for transfer; do not silently replace extinct sources`
      );
      c.genome = { ...pool[Math.floor(rng.nextFloat() * pool.length)].genome };
    }
    if (genomes || polymorphism) {
      c.traits = createCreatureTraits({ config: sim.config, species: c.species, genome: c.genome });
      c.maturityScale = resolveCreatureMaturityScale({ config: sim.config, genome: c.genome });
      c.maxAgeTicks = resolveCreatureMaxAgeTicks({ config: sim.config, genome: c.genome });
    }
    // Matched placement independent of habitat and origin; life-history starts unchanged.
    let x;
    do {
      x = 1 + rng.nextFloat() * (w.width - 2);
    } while (water === 'channels' && Math.floor(x) % 16 === 0);
    c.position = { x, y: 1 + rng.nextFloat() * (w.height - 2) };
  }
  if (removePredators)
    sim.state.creatures = sim.state.creatures.filter((c) =>
      ['square', 'circle'].includes(c.species)
    );
}

export async function naturalTrial({
  root = '.',
  seed,
  habitat,
  water = 'channels',
  polymorphism,
  removePredators = false,
  seconds = 1200,
  mode = 'segregating',
  genomes,
  overrides = {}
}) {
  const at = (p) => pathToFileURL(resolve(root, 'src/sim', p));
  const helpers = {
    ...(await import(at('creatures/traits.js'))),
    ...(await import(at('creatures/aging.js'))),
    ...(await import(at('terrain-effects.js')))
  };
  const ticksPerSecond = overrides.ticksPerSecond ?? 30;
  const result = await recordEvolution({
    root,
    seed,
    ticks: seconds * ticksPerSecond,
    overrides: {
      worldWidth: 48,
      worldHeight: 24,
      creatureCount: 40,
      creaturePredatorCount: 4,
      bushCount: 0,
      ticksPerSecond,
      creatureGenomeInheritanceMode: mode,
      ...overrides
    },
    setup: (sim) =>
      prepareHabitat(
        sim,
        { seed, habitat, genomes, water, polymorphism, removePredators },
        helpers
      ),
    progress: (row) => console.error(JSON.stringify({ habitat, mode, ...row }))
  });
  result.intervention = {
    habitat,
    water: water === 'edge' ? 'x == 0' : 'x % 16 == 0',
    polymorphism: polymorphism ?? null,
    removePredators,
    initialGrass: 'terrain capacity',
    bushes: 0,
    placement: 'seeded uniform land',
    transplant: !!genomes,
    description:
      'Constructed ecology; full production decisions, movement, costs, reproduction, mutation and deaths. No adaptive fitness weights, floors or replenishment.'
  };
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => a.replace(/^--/, '').split(/=(.*)/s).slice(0, 2))
  );
  const out = args.out;
  assert(out);
  mkdirSync(resolve(out, '..'), { recursive: true });
  const lock = out + '.lock';
  mkdirSync(lock); // Exclusive claim before a long experiment starts.
  try {
    assert(!existsSync(out), 'No overwrite');
    let genomes;
    if (args.transfer) {
      const source = JSON.parse(gunzipSync(readFileSync(args.transfer)));
      genomes = source.lives.filter((c) =>
        args.founders ? c.generation === 0 : c.deathTick === null && c.generation > 0
      );
    }
    const result = await naturalTrial({
      root: args.root,
      water: args.water ?? 'channels',
      polymorphism: args.polymorphism,
      removePredators: !!args['remove-predators'],
      seed: Number(args.seed ?? 1),
      habitat: args.habitat ?? 'plains',
      seconds: Number(args.seconds ?? 1200),
      mode: args.mode ?? 'segregating',
      genomes,
      overrides: JSON.parse(args.config ?? '{}')
    });
    result.runner = Object.fromEntries(
      ['natural-evolution.mjs', 'investigate-evolution.mjs', 'world-provenance.mjs'].map((name) => [
        name,
        createHash('sha256')
          .update(readFileSync(new URL(name, import.meta.url)))
          .digest('hex')
      ])
    );
    if (args.transfer)
      result.transfer = {
        path: args.transfer,
        sha256: createHash('sha256').update(readFileSync(args.transfer)).digest('hex'),
        cohort: args.founders ? 'founders' : 'living descendants',
        poolSize: genomes.length,
        sampling: 'seeded uniform with replacement by species'
      };
    mkdirSync(resolve(out, '..'), { recursive: true });
    writeFileSync(out, gzipSync(JSON.stringify(result)));
    console.log(
      JSON.stringify({
        out,
        milliseconds: result.milliseconds,
        population: Object.fromEntries(
          Object.entries(result.history.at(-1).species).map(([s, r]) => [s, r.count])
        ),
        births: result.metrics.birthsTotal
      })
    );
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
}
