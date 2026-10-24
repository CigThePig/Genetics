import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createSim } from '../src/sim/sim.js';
const seed = Number(process.argv[2] ?? 1);
const ticks = Number(process.argv[3] ?? 36000);
assert(Number.isInteger(seed) && Number.isInteger(ticks) && ticks > 0);
for (const duration of [0, 45]) {
  const sim = createSim({ seed, creatureDangerMemorySeconds: duration });
  const initial = sim.state.creatures.length;
  let memorySamples = 0,
    cautiousSamples = 0,
    maxSites = 0;
  const start = performance.now();
  for (let tick = 0; tick < ticks; tick++) {
    sim.tick();
    assert.equal(
      sim.state.creatures.length,
      initial + sim.state.metrics.birthsTotal - sim.state.metrics.deathsTotal
    );
    for (const c of sim.state.creatures) {
      assert(Number.isFinite(c.position.x) && Number.isFinite(c.position.y));
      assert(
        c.position.x >= 0 &&
          c.position.x < sim.state.world.width &&
          c.position.y >= 0 &&
          c.position.y < sim.state.world.height
      );
      for (const meter of Object.values(c.meters)) assert(Number.isFinite(meter) && meter >= 0);
      const sites = c.experience?.dangerSites.length ?? 0;
      assert(sites <= 3 && c.lifeStory.events.length <= 12);
      maxSites = Math.max(maxSites, sites);
      if (tick % 60 === 0) {
        memorySamples += Number(sites > 0);
        cautiousSamples += Number(
          c.locomotion?.reason === 'skirt remembered danger' &&
            ['wander', 'graze'].includes(c.intent?.type) &&
            !c.herding?.isThreatened
        );
      }
    }
    assert(sim.state.world.memorials.length <= 128);
  }
  console.log(
    JSON.stringify({
      seed,
      ticks,
      dangerMemorySeconds: duration,
      elapsedMs: Math.round(performance.now() - start),
      population: Object.fromEntries(
        ['square', 'circle', 'triangle', 'octagon'].map((s) => [
          s,
          sim.state.creatures.filter((c) => c.species === s).length
        ])
      ),
      births: sim.state.metrics.birthsTotal,
      deaths: sim.state.metrics.deathsByCause,
      memorySamples,
      cautiousSamples,
      maxSites,
      hash: createHash('sha256').update(JSON.stringify(sim.state.creatures)).digest('hex')
    })
  );
}
