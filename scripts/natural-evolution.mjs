// Controlled habitats, full production tick. No selection weights or demographic rescue.
import { recordEvolution } from './investigate-evolution.mjs';
import { createRng } from '../src/sim/rng.js';
import { createCreatureTraits } from '../src/sim/creatures/traits.js';
import {
  resolveCreatureMaturityScale,
  resolveCreatureMaxAgeTicks
} from '../src/sim/creatures/aging.js';
import { getTerrainEffects } from '../src/sim/terrain-effects.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

export function prepareHabitat(sim, { habitat, genomes, seed }) {
  const w = sim.state.world;
  // Identical permanent water channels every 16 tiles. Only land terrain differs.
  for (let y = 0; y < w.height; y++)
    for (let x = 0; x < w.width; x++) {
      const terrain = x % 16 === 0 ? 'water' : habitat;
      w.setTerrainAt(x, y, terrain);
      w.setGrassAt(x, y, getTerrainEffects(terrain).plantCap);
      w.setGrassStressAt(x, y, 0);
    }
  w.bushes = [];
  const rng = createRng(seed);
  const bySpecies = new Map();
  for (const c of sim.state.creatures) {
    const i = bySpecies.get(c.species) ?? 0;
    bySpecies.set(c.species, i + 1);
    if (genomes) {
      const pool = genomes.filter((g) => g.species === c.species);
      assert(
        pool.length,
        `No ${c.species} genomes for transfer; do not silently replace extinct sources`
      );
      c.genome = { ...pool[i % pool.length].genome };
      c.traits = createCreatureTraits({ config: sim.config, species: c.species, genome: c.genome });
      c.maturityScale = resolveCreatureMaturityScale({ config: sim.config, genome: c.genome });
      c.maxAgeTicks = resolveCreatureMaxAgeTicks({ config: sim.config, genome: c.genome });
    }
    // Matched placement independent of habitat and origin; life-history starts unchanged.
    let x;
    do {
      x = 1 + rng.nextFloat() * (w.width - 2);
    } while (Math.floor(x) % 16 === 0);
    c.position = { x, y: 1 + rng.nextFloat() * (w.height - 2) };
  }
}

export async function naturalTrial({
  seed,
  habitat,
  seconds = 1200,
  mode = 'segregating',
  genomes,
  overrides = {}
}) {
  const ticksPerSecond = overrides.ticksPerSecond ?? 30;
  const result = await recordEvolution({
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
    setup: (sim) => prepareHabitat(sim, { seed, habitat, genomes }),
    progress: (row) => console.error(JSON.stringify({ habitat, mode, ...row }))
  });
  result.intervention = {
    habitat,
    water: 'x % 16 == 0',
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
  assert(!existsSync(out), 'No overwrite');
  let genomes;
  if (args.transfer) {
    const source = JSON.parse(gunzipSync(readFileSync(args.transfer)));
    genomes = source.lives.filter((c) => c.deathTick === null && c.generation > 0);
  }
  const result = await naturalTrial({
    seed: Number(args.seed ?? 1),
    habitat: args.habitat ?? 'plains',
    seconds: Number(args.seconds ?? 1200),
    mode: args.mode ?? 'segregating',
    genomes,
    overrides: JSON.parse(args.config ?? '{}')
  });
  mkdirSync(resolve(out, '..'), { recursive: true });
  writeFileSync(out, gzipSync(JSON.stringify(result)));
  console.log(
    JSON.stringify({
      out,
      milliseconds: result.milliseconds,
      population: result.history.at(-1).species,
      births: result.metrics.birthsTotal
    })
  );
}
