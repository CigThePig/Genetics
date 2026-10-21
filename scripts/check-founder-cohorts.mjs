import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { createSim } = await import(
  pathToFileURL(resolve(process.argv[2] ?? '../Genetics-baseline', 'src/sim/sim.js'))
);
import { createRng } from '../src/sim/rng.js';
for (const seed of [1, 42, 1337, 2, 3, 7, 19, 73, 101, 2026])
  for (const ratio of [0, 0.35, 0.65, 0.85]) {
    const s = createSim({ seed }),
      rng = createRng(seed + 7919);
    for (const c of s.state.creatures)
      c.ageTicks = Math.floor(rng.nextFloat() * c.maxAgeTicks * ratio);
    const initial = Object.fromEntries(
      ['triangle', 'octagon'].map((species) => [
        species,
        s.state.creatures
          .filter((c) => c.species === species)
          .map((c) => ({
            sex: c.sex,
            age: c.ageTicks / 60,
            mature: c.ageTicks * c.maturityScale >= 75 * 60
          }))
      ])
    );
    for (let i = 0; i < 60; i++) s.tick();
    console.log(
      JSON.stringify({
        seed,
        ratio,
        initial,
        conceptions: s.state.metrics.pregnanciesBySpeciesTotal
      })
    );
  }
