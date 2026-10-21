// Reproducible geography/initialization/ecology evidence; --root can select a baseline checkout.
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const root = resolve(arg('root', '.'));
const load = (p) => import(pathToFileURL(resolve(root, p)));
const { createSim } = await load('src/sim/sim.js');
const { analyzeHabitats } = await load('src/sim/habitat-analysis.js');
const { generateTerrain } = await load('src/sim/regional-terrain.js');
const { createWorldGrid } = await load('src/sim/world-grid.js');
const { createRng } = await load('src/sim/rng.js');
const { simConfig } = await load('src/sim/config.js');
const { HABITATS, habitatRgbAt } = await load('src/sim/habitat-colours.js');
const fingerprint = createHash('sha256')
  .update(
    [
      'src/sim/regional-terrain.js',
      'src/sim/hydrology.js',
      'src/sim/sim.js',
      'src/sim/rng.js',
      'src/sim/plants/grass.js'
    ]
      .map((p) => {
        try {
          return readFileSync(resolve(root, p));
        } catch {
          return Buffer.from('absent:' + p);
        }
      })
      .reduce((a, b) => Buffer.concat([a, b]), Buffer.alloc(0))
  )
  .digest('hex');
const width = Number(arg('width', 120)),
  height = Number(arg('height', 160));
const seeds = arg('seeds', '1,42,1337,' + Array.from({ length: 27 }, (_, i) => i + 2).join(','))
  .split(',')
  .map(Number);
const ticks = Number(arg('ticks', 0)),
  population = Number(arg('population', 80));
const out = arg('out', 'tracks/2026-10-21-world-generation/evidence/current');
mkdirSync(out, { recursive: true });
const percentile = (a, p) =>
  a.sort((a, b) => a - b)[Math.min(a.length - 1, Math.floor(a.length * p))] ?? 0;
for (const seed of seeds) {
  const config = {
    ...simConfig,
    seed,
    worldWidth: width,
    worldHeight: height,
    creatureCount: population,
    creaturePredatorCount: Math.round(population * 0.1)
  };
  const times = [];
  let world;
  for (let trial = 0; trial < 3; trial++) {
    world = createWorldGrid({ width, height });
    const t = performance.now();
    generateTerrain({ world, config, rng: createRng(seed) });
    times.push(performance.now() - t);
  }
  const analysis = analyzeHabitats(world);
  // PPM uses the actual shared colour model; the browser runner captures the complete renderer.
  const bytes = Buffer.alloc(width * height * 3);
  for (let i = 0; i < world.cells.length; i++)
    habitatRgbAt(world, i, config, false).forEach(
      (v, c) => (bytes[i * 3 + c] = Math.round(v * 255))
    );
  writeFileSync(
    `${out}/seed-${seed}.ppm`,
    Buffer.concat([Buffer.from(`P6\n${width} ${height}\n255\n`), bytes])
  );
  if ([1, 42, 1337, 10, 17, 21].includes(seed)) {
    for (const field of [
      'heightMap',
      'moistureMap',
      'temperatureMap',
      'roughnessMap',
      'flow',
      'biomes',
      'land'
    ]) {
      const image = Buffer.alloc(width * height * 3);
      for (let i = 0; i < world.cells.length; i++) {
        let rgb;
        if (field === 'biomes')
          rgb = HABITATS[world.cells[i]].debug.match(/\w\w/g).map((v) => parseInt(v, 16));
        else if (field === 'land')
          rgb = world.habitatAccess.mainLand[i] ? [130, 175, 95] : [35, 70, 110];
        else {
          const v =
            field === 'flow'
              ? Math.log1p(world.drainage?.accumulation[i] ?? 0) / 8
              : (world[field]?.[i] ?? 0);
          rgb =
            field === 'moistureMap'
              ? [60 + v * 30, 80 + v * 140, 100 + v * 150]
              : [35 + v * 220, 45 + v * 190, 55 + v * 150];
        }
        rgb.forEach((v, c) => (image[i * 3 + c] = Math.max(0, Math.min(255, Math.round(v)))));
      }
      writeFileSync(
        `${out}/seed-${seed}-${field}.ppm`,
        Buffer.concat([Buffer.from(`P6\n${width} ${height}\n255\n`), image])
      );
    }
  }
  const start = performance.now();
  const sim = createSim(config);
  const initMs = performance.now() - start;
  const resetStart = performance.now();
  sim.setSeed(seed);
  const resetMs = performance.now() - resetStart;
  const initialVegetation = {
    grassCells: sim.state.world.grass.filter((v) => v > 0).length,
    bushes: sim.state.world.bushes?.length
  };
  const samples = [],
    timings = [];
  const startTicks = performance.now();
  for (let t = 1; t <= ticks; t++) {
    const begin = performance.now();
    sim.tick();
    timings.push(performance.now() - begin);
    if (t % 600 === 0) {
      const s = sim.getSummary();
      samples.push({
        tick: t,
        population: s.creatureCount,
        species: [s.squaresCount, s.trianglesCount, s.circlesCount, s.octagonsCount],
        births: s.birthsTotal,
        kills: s.killsTotal,
        deaths: s.deathsTotal,
        chases: s.chaseAttempts,
        pregnancies: s.pregnanciesTotal,
        generations: Object.fromEntries(
          ['square', 'triangle', 'circle', 'octagon'].map((species) => [
            species,
            Math.max(
              -1,
              ...sim.state.creatures
                .filter((c) => c.species === species)
                .map((c) => c.generation ?? 0)
            )
          ])
        ),
        deathsByCause: { ...sim.state.metrics.deathsByCause }
      });
      for (const c of sim.state.creatures) {
        assert(Number.isFinite(c.position.x + c.position.y));
        assert(Object.values(c.meters).every((v) => Number.isFinite(v) && v >= 0));
      }
      assert.equal(s.creatureCount, population + s.birthsTotal - s.deathsTotal);
    }
  }
  const elapsedMs = performance.now() - startTicks;
  const result = {
    fingerprint,
    replayHash: createHash('sha256')
      .update(
        JSON.stringify({
          creatures: sim.state.creatures,
          metrics: sim.state.metrics,
          world: sim.state.world.cells
        })
      )
      .digest('hex'),
    seed,
    width,
    height,
    population,
    ticks,
    generationMs: times,
    initMs,
    resetMs,
    analysis,
    initialVegetation,
    finalVegetation: {
      grassCells: sim.state.world.grass.filter((v) => v > 0).length,
      bushes: sim.state.world.bushes?.length
    },
    elapsedMs,
    tickMs: {
      p50: percentile(timings, 0.5),
      p95: percentile(timings, 0.95),
      p99: percentile(timings, 0.99)
    },
    samples
  };
  writeFileSync(`${out}/seed-${seed}.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
}
