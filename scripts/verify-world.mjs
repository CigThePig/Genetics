// Reproducible geography/initialization/ecology evidence; --root can select a baseline checkout.
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { worldProvenance } from './world-provenance.mjs';
import assert from 'node:assert/strict';
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const root = resolve(arg('root', '.'));
const load = (p) => import(pathToFileURL(resolve(root, p)));
const { createSim } = await load('src/sim/sim.js');
const { analyzeHabitats, neighborsOf } = await load('src/sim/habitat-analysis.js');
const { generateTerrain } = await load('src/sim/regional-terrain.js');
const { createWorldGrid } = await load('src/sim/world-grid.js');
const { createRng } = await load('src/sim/rng.js');
const { simConfig } = await load('src/sim/config.js');
const { HABITATS, habitatRgbAt } = await load('src/sim/habitat-colours.js');
const provenance = worldProvenance(root);
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
    // Only historical baseline checkouts require an RNG-based terrain API.
    const legacyOptions = root === resolve('.') ? {} : { rng: createRng(seed) };
    generateTerrain({ world, config, ...legacyOptions });
    times.push(performance.now() - t);
  }
  const analysis = analyzeHabitats(world);
  // Existing access metrics conservatively measure permanent-water adjacency.
  // Actual drinking also recognizes traversable wet headwaters/shore and the
  // action system's one-cell neighbourhood, so measure that contract separately.
  const drinkDistance = new Int32Array(world.cells.length).fill(-1),
    queue = [];
  for (let i = 0; i < world.cells.length; i++) {
    if (world.cells[i] === config.waterTerrain) continue;
    const x = i % width,
      y = Math.floor(i / width);
    let drinkable = false;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if (world.isWaterAt(x + dx, y + dy, config.waterTerrain, config.shoreTerrain))
          drinkable = true;
    if (drinkable) {
      drinkDistance[i] = 0;
      queue.push(i);
    }
  }
  for (let head = 0; head < queue.length; head++)
    for (const j of neighborsOf(queue[head], width, height)) {
      if (world.cells[j] === config.waterTerrain || drinkDistance[j] >= 0) continue;
      drinkDistance[j] = drinkDistance[queue[head]] + 1;
      queue.push(j);
    }
  const actual = Array.from(drinkDistance).filter((d) => d >= 0);
  analysis.drinkingDistanceP95 = percentile(actual, 0.95);
  analysis.drinkingReachableFraction =
    actual.length / (world.cells.length - (analysis.counts[config.waterTerrain] ?? 0));
  analysis.spawnSuitableCells = world.cells.filter(
    (type, i) =>
      ['forest', 'plains'].includes(type) &&
      world.habitatAccess.mainLand[i] &&
      world.habitatAccess.waterDistance[i] >= 0 &&
      world.habitatAccess.waterDistance[i] <= Math.max(12, Math.min(width, height) * 0.22)
  ).length;
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
      if (t % 6000 === 0 && arg('progress', 'false') === 'true') {
        writeFileSync(
          `${out}/seed-${seed}.progress`,
          JSON.stringify({
            seed,
            ticks: t,
            sample: samples.at(-1),
            elapsedMs: performance.now() - startTicks
          })
        );
        console.error(
          JSON.stringify({
            progress: true,
            seed,
            ticks: t,
            elapsedMs: performance.now() - startTicks
          })
        );
      }
    }
  }
  const elapsedMs = performance.now() - startTicks;
  const result = {
    ...provenance,
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
