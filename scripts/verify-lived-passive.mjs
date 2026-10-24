import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createSim } from '../src/sim/sim.js';
const baselineDirectory = process.argv[2];
assert(baselineDirectory, 'Pass a checkout of baseline 48297bf');
const { createSim: original } = await import(
  pathToFileURL(resolve(baselineDirectory, 'src/sim/sim.js'))
);
for (const seed of [1, 42, 1337]) {
  const a = original({ seed }),
    b = createSim({ seed, creatureDangerMemorySeconds: 0 });
  for (let tick = 0; tick < 3600; tick++) {
    a.tick();
    b.tick();
  }
  const stripped = b.state.creatures.map(
    ({ lifeStory: _story, experience: _experience, ...c }) => c
  );
  assert.deepEqual(a.state.creatures, stripped);
  assert.deepEqual(a.state.metrics, b.state.metrics);
  assert.equal(a.state.lastRoll, b.state.lastRoll);
  console.log(
    JSON.stringify({ seed, ticks: 3600, baseline: '48297bf', memoryDisabledMatches: true })
  );
}
