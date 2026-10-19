import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createSim } from '../src/sim/sim.js';

const ticks = Number(
  process.argv.find((arg) => arg.startsWith('--ticks='))?.split('=')[1] ?? 18000
);
assert(Number.isInteger(ticks) && ticks > 0, '--ticks must be a positive integer');

for (const seed of [1, 42, 1337]) {
  const sim = createSim({ seed });
  const initialPopulation = sim.state.creatures.length;
  let maxPopulation = initialPopulation;
  for (let tick = 0; tick < ticks; tick++) {
    sim.tick();
    const ids = new Set();
    for (const creature of sim.state.creatures) {
      assert(!ids.has(creature.id), `Seed ${seed}: duplicate creature ID at tick ${tick}`);
      ids.add(creature.id);
      const { x, y } = creature.position;
      assert(Number.isFinite(x) && Number.isFinite(y), `Seed ${seed}: non-finite position`);
      assert(x >= 0 && x < sim.state.world.width && y >= 0 && y < sim.state.world.height);
      for (const meter of Object.values(creature.meters)) {
        assert(Number.isFinite(meter) && meter >= 0, `Seed ${seed}: invalid meter`);
      }
    }
    assert.equal(
      sim.state.creatures.length,
      initialPopulation + sim.state.metrics.birthsTotal - sim.state.metrics.deathsTotal,
      `Seed ${seed}: population accounting at tick ${tick}`
    );
    maxPopulation = Math.max(maxPopulation, sim.state.creatures.length);
  }
  const summary = sim.getSummary();
  const hash = createHash('sha256')
    .update(JSON.stringify({ creatures: sim.state.creatures, summary }))
    .digest('hex');
  console.log(
    JSON.stringify({
      seed,
      ticks,
      maxPopulation,
      population: summary.creatureCount,
      species: [
        summary.squaresCount,
        summary.trianglesCount,
        summary.circlesCount,
        summary.octagonsCount
      ],
      pregnancies: summary.pregnanciesTotal,
      births: summary.birthsTotal,
      chases: summary.chaseAttempts,
      kills: summary.killsTotal,
      deaths: summary.deathsTotal,
      hash
    })
  );
}
