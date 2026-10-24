// Observer-only scaling probe; not a full-engine or physical-mobile benchmark.
import { performance } from 'node:perf_hooks';
import { createSim } from '../src/sim/sim.js';
import { observeLifeStories } from '../src/sim/life-story.js';

const samples = [];
for (const population of [80, 320, 640]) {
  const sim = createSim({ seed: 42, creatureCount: population });
  const state = sim.state;
  for (let i = 0; i < 2000; i++) observeLifeStories(state);
  global.gc?.();
  const heapBefore = process.memoryUsage().heapUsed;
  const batches = [];
  for (let batch = 0; batch < 200; batch++) {
    const start = performance.now();
    for (let i = 0; i < 100; i++) observeLifeStories(state);
    batches.push((performance.now() - start) / 100);
  }
  global.gc?.();
  const retainedHeapBytes = process.memoryUsage().heapUsed - heapBefore;
  batches.sort((a, b) => a - b);
  samples.push({
    population: state.creatures.length,
    observations: 20000,
    batchMeanMsP50: batches[100],
    batchMeanMsP95: batches[190],
    estimatedMsPerSecondAt120TPS: batches[100] * 120,
    retainedHeapBytes
  });
}
console.log(
  JSON.stringify(
    {
      node: process.version,
      scope:
        'Steady-state observer only, seed 42; repeated reads of unchanged actors. Batch timing includes GC pauses, but does not measure allocation rate, full simulation, browser frames or physical phones.',
      samples
    },
    null,
    2
  )
);
