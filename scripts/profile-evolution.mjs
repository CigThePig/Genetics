import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { worldProvenance } from './world-provenance.mjs';
import assert from 'node:assert/strict';
const [out, ...roots] = process.argv.slice(2);
assert(
  out && roots.length === 2,
  'Usage: node scripts/profile-evolution.mjs <out.json> <baseline-root> <candidate-root>'
);
const results = [];
for (const root of roots) {
  const at = (p) => pathToFileURL(resolve(root, 'src', p));
  const [{ createSim }, { createPerfSampler }, { setActivePerf }, { recordColourHistory }] =
    await Promise.all([
      import(at('sim/sim.js')),
      import(at('metrics/perf.js')),
      import(at('metrics/perf-registry.js')),
      import(at('sim/colour-metrics.js'))
    ]);
  const sim = createSim({ seed: 42, creatureCount: 480, creaturePredatorCount: 48 });
  for (let i = 0; i < 120; i++) sim.tick();
  const perf = createPerfSampler({ windowMs: 1e9 });
  setActivePerf(perf);
  let escapeSamples = 0,
    threatSamples = 0;
  for (let i = 0; i < 600; i++) {
    sim.tick();
    for (const c of sim.state.creatures) {
      escapeSamples += Number(!!c.herding?.isThreatened);
      threatSamples += c.herding?.nearbyThreats ?? 0;
    }
  }
  setActivePerf(null);
  const memory = createSim({ seed: 42 });
  for (let i = 1; i <= 140; i++) {
    memory.state.tick = i * 600;
    recordColourHistory(memory.state, memory.config);
  }
  results.push({
    source: worldProvenance(root),
    root,
    count: 480,
    ticks: 600,
    timers: perf.snapshot().timers.sort((a, b) => b.avgMs - a.avgMs),
    escapeSamples,
    threatSamples,
    historySnapshots: memory.state.colourHistory.length,
    historyBytes: Buffer.byteLength(JSON.stringify(memory.state.colourHistory)),
    baselineBytes: Buffer.byteLength(JSON.stringify(memory.state.colourBaseline))
  });
}
writeFileSync(out, JSON.stringify(results, null, 2));
