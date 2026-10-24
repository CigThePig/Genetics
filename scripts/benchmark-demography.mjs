// Run alone; Node timings are not physical-phone FPS/TPS certification.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
const allowBehaviorChange = process.argv.includes('--allow-behavior-change');
const roots = process.argv.slice(2).filter((arg) => arg !== '--allow-behavior-change');
assert.equal(roots.length, 2);
for (let trial = 0; trial < 3; trial++)
  for (const count of [80, 240, 480]) {
    const hashes = [];
    for (const root of trial % 2 ? [...roots].reverse() : roots) {
      const { createSim } = await import(pathToFileURL(resolve(root, 'src/sim/sim.js')));
      const sim = createSim({
        seed: 42,
        creatureCount: count,
        creaturePredatorCount: Math.round(count / 10)
      });
      const times = [];
      const initialCount = sim.state.creatures.length;
      for (let i = 0; i < 720; i++) {
        const start = performance.now();
        sim.tick();
        if (i >= 120) times.push(performance.now() - start);
      }
      times.sort((a, b) => a - b);
      if (allowBehaviorChange)
        assert.equal(sim.state.creatures.length, initialCount, 'Equal actor workload changed');
      const hash = createHash('sha256').update(JSON.stringify(sim.state.creatures)).digest('hex');
      hashes.push(hash);
      console.log(
        JSON.stringify({
          root,
          trial,
          count,
          ticks: 600,
          median: times[300],
          p95: times[570],
          mean: times.reduce((a, b) => a + b, 0) / 600,
          final: sim.state.creatures.length,
          creatureHash: hash,
          serializedMetricsBytes: Buffer.byteLength(JSON.stringify(sim.state.metrics))
        })
      );
    }
    if (!allowBehaviorChange)
      assert.equal(
        hashes[0],
        hashes[1],
        'Equal workload actor states diverged before juvenile maturation'
      );
  }
