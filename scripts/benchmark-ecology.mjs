// Run after other simulation jobs finish; compare equal actor workloads, not population graphs.
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
const roots = process.argv.slice(2);
for (const count of [80, 240])
  for (const root of roots) {
    const { createSim } = await import(pathToFileURL(resolve(root, 'src/sim/sim.js')));
    const s = createSim({
      seed: 42,
      creatureCount: count,
      creaturePredatorCount: Math.round(count / 10)
    });
    const times = [];
    for (let i = 0; i < 720; i++) {
      const t = performance.now();
      s.tick();
      if (i >= 120) times.push(performance.now() - t);
    }
    times.sort((a, b) => a - b);
    console.log(
      JSON.stringify({
        root,
        count,
        ticks: 600,
        median: times[300],
        p95: times[570],
        mean: times.reduce((a, b) => a + b, 0) / 600,
        final: s.state.creatures.length
      })
    );
  }
