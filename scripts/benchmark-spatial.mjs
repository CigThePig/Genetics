import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createSim } from '../src/sim/sim.js';
import { writeFileSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const { createSim: original } = await import(
  pathToFileURL(
    resolve(args['baseline-root'] ?? '/tmp/genetics-spatial-original', 'src/sim/sim.js')
  )
);
const rows = [];
const percentile = (a, p) => a[Math.floor((a.length - 1) * p)];
const variants = [
  ['original', original, {}],
  ['default', createSim, {}]
];
if (args['experimental-root']) {
  const { createSim: experimental } = await import(
    pathToFileURL(resolve(args['experimental-root'], 'src/sim/sim.js'))
  );
  variants.push(['range-option', experimental, { creatureResidencyWeight: 1.2 }]);
}
for (let trial = 0; trial < 3; trial++)
  for (const [name, build, config] of trial % 2 ? [...variants].reverse() : variants) {
    global.gc?.();
    const before = process.memoryUsage().heapUsed;
    const start = performance.now();
    const sim = build({ seed: 42, ...config });
    const initMs = performance.now() - start;
    global.gc?.();
    const retainedMiB = (process.memoryUsage().heapUsed - before) / 1048576;
    const stateBytes = Buffer.byteLength(JSON.stringify(sim.state));
    for (let t = 0; t < 2400; t++) sim.tick();
    const times = [];
    for (let t = 0; t < 1200; t++) {
      const start = performance.now();
      sim.tick();
      times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    const row = {
      name,
      trial,
      initMs,
      retainedMiB,
      stateBytes,
      finalPopulation: sim.state.creatures.length,
      learnedRanges: sim.state.creatures.filter((c) => c.residency?.center).length,
      tickMs: {
        mean: times.reduce((a, b) => a + b, 0) / times.length,
        p50: percentile(times, 0.5),
        p95: percentile(times, 0.95),
        p99: percentile(times, 0.99)
      }
    };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
writeFileSync(
  args.out ?? '/tmp/spatial-performance.json',
  JSON.stringify(
    {
      protocol:
        'Alternating order, seed 42, 2400 warmup + 1200 measured ticks per trial; default 80 founders. Different behavior trajectories can change actor counts. Shared execution host, not device certification.',
      rows
    },
    null,
    2
  )
);
