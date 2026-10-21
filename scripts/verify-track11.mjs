import { simConfig } from '../src/sim/config.js';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import { createSim } from '../src/sim/sim.js';
import { generateTerrain } from '../src/sim/regional-terrain.js';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { createRng } from '../src/sim/rng.js';
import { analyzeHabitats } from '../src/sim/habitat-analysis.js';
import { colourPopulationSnapshot, COLOUR_HISTORY_LIMIT } from '../src/sim/colour-metrics.js';
const arg = (key, fallback) =>
  process.argv.find((a) => a.startsWith(`--${key}=`))?.split('=')[1] ?? fallback;
const ticks = Number(arg('ticks', 18000)),
  mode = arg('mode', 'full');
assert(Number.isInteger(ticks) && ticks >= 0);
assert(['full', 'no-camouflage', 'no-preference', 'neither', 'maps'].includes(mode));
if (mode === 'maps') {
  const baseline = arg('baseline', null);
  const generate = baseline
    ? (await import(pathToFileURL(resolve(baseline, 'src/sim/terrain-generator-enhanced.js'))))
        .generateTerrain
    : generateTerrain;
  const defaults = baseline
    ? (await import(pathToFileURL(resolve(baseline, 'src/sim/config-defaults.js')))).simConfig
    : simConfig;
  const results = [];
  for (let seed = 1; seed <= 32; seed++) {
    const world = createWorldGrid({ width: 120, height: 160 });
    const start = performance.now();
    generate({
      world,
      config: { ...defaults, seed },
      ...(baseline ? { rng: createRng(seed) } : {})
    });
    const ms = performance.now() - start;
    const a = analyzeHabitats(world);
    results.push({
      seed,
      ms,
      counts: a.counts,
      boundaryDensity: a.boundaryDensity,
      substantialFraction: a.substantialFraction,
      landConnectivity: a.landConnectivity,
      waterCoverage: a.waterCoverage,
      waterReachableFraction: a.waterReachableFraction,
      waterDistanceP95: a.waterDistanceP95
    });
  }
  console.log(JSON.stringify({ mode, results }));
} else {
  for (const seed of arg('seeds', '1,42,1337').split(',').map(Number)) {
    const sim = createSim({
      seed,
      colourCamouflageEnabled: !['neither', 'no-camouflage'].includes(mode),
      colourMatePreferenceEnabled: !['neither', 'no-preference'].includes(mode)
    });
    const start = performance.now();
    let maxPopulation = 80,
      maxTickMs = 0;
    const chunks = [];
    for (let i = 0; i < ticks; i++) {
      const before = performance.now();
      sim.tick();
      maxTickMs = Math.max(maxTickMs, performance.now() - before);
      maxPopulation = Math.max(maxPopulation, sim.state.creatures.length);
      if ((i + 1) % 600 === 0) {
        const ids = new Set();
        for (const c of sim.state.creatures) {
          assert(!ids.has(c.id));
          ids.add(c.id);
          for (const value of Object.values(c.meters)) assert(Number.isFinite(value) && value >= 0);
          for (const key of [
            'bodyHue',
            'bodySaturation',
            'bodyLightness',
            'matePreferenceHue',
            'mateChoosiness',
            'colourDiscrimination'
          ])
            assert(Number.isFinite(c.traits[key]) && c.traits[key] >= 0 && c.traits[key] <= 1);
        }
        assert(sim.state.colourHistory.length <= COLOUR_HISTORY_LIMIT);
      }
      if ((i + 1) % 6000 === 0)
        chunks.push({
          tick: i + 1,
          population: sim.state.creatures.length,
          births: sim.state.metrics.birthsTotal,
          kills: sim.state.metrics.killsTotal
        });
    }
    const elapsedMs = performance.now() - start,
      s = sim.getSummary();
    const snapshot = colourPopulationSnapshot(sim.state.creatures, ticks, sim.state.world);
    const hash = createHash('sha256')
      .update(JSON.stringify({ creatures: sim.state.creatures, summary: s }))
      .digest('hex');
    console.log(
      JSON.stringify({
        mode,
        seed,
        ticks,
        elapsedMs,
        averageTickMs: elapsedMs / Math.max(1, ticks),
        maxTickMs,
        maxPopulation,
        chunks,
        population: s.creatureCount,
        species: [s.squaresCount, s.trianglesCount, s.circlesCount, s.octagonsCount],
        births: s.birthsTotal,
        pregnancies: s.pregnanciesTotal,
        kills: s.killsTotal,
        chases: s.chaseAttempts,
        deaths: s.deathsTotal,
        historyLength: sim.state.colourHistory.length,
        historyBytes: JSON.stringify(sim.state.colourHistory).length,
        snapshot,
        hash
      })
    );
  }
}
