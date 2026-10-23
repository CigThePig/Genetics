// Explicit selection experiment, NOT an ordinary ecosystem run.
// Production trait mapping/inheritance/mutation, externally imposed reproductive
// sampling. Environment A rewards energy-efficient travel; B imposes a deadline.
import { createRng, deriveSeed } from '../src/sim/rng.js';
import {
  createCreatureGenome,
  inheritCreatureGenome,
  mutateCreatureGenome
} from '../src/sim/creatures/genetics.js';
import { createCreatureTraits } from '../src/sim/creatures/traits.js';
import { simConfig } from '../src/sim/config.js';
import { writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const seeds = [1, 42, 1337, 2, 7, 19, 73, 101, 2026, 3];
const n = Number(args.population ?? 1000),
  generations = Number(args.generations ?? 30);
assert(Number.isInteger(n) && n > 1 && Number.isInteger(generations) && generations > 0);
export function moments(values) {
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return { mean, variance: values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length };
}
const energyBudget = Number(args.energyBudget ?? 0.03);
const deadline = Number(args.deadline ?? 3.5);
assert(energyBudget > 0 && deadline > 0);
const results = [];
for (const seed of seeds)
  for (const mode of ['blended', 'segregating'])
    for (const mutation of [false, true])
      for (const pressure of ['neutral', 'energy', 'deadline', 'reversal']) {
        const config = {
          ...simConfig,
          creatureGenomeInheritanceMode: mode,
          ...(!mutation ? { creatureGenomeMutationRate: 0, creatureGenomeInheritanceNoise: 0 } : {})
        };
        // Exactly matched founding genomes across treatments.
        const founders = createRng(deriveSeed(seed, 'founders'));
        let population = Array.from({ length: n }, () => ({
          species: 'circle',
          genome: createCreatureGenome({ config, species: 'circle', rng: founders })
        }));
        const rng = createRng(deriveSeed(seed, 'inheritance'));
        const history = [];
        for (let generation = 0; generation <= generations; generation++) {
          const environment =
            pressure === 'reversal'
              ? generation < generations / 2
                ? 'deadline'
                : 'energy'
              : pressure;
          // Travel is 30 tiles. Available energy and deadline are explicitly imposed
          // assay conditions. Relative reproductive weights are remaining energy or
          // deadline margin, not hidden production fitness bonuses.
          const traits = population.map((c) =>
            createCreatureTraits({ config, species: c.species, genome: c.genome })
          );
          const weights = traits.map((t) =>
            environment === 'neutral'
              ? 1
              : environment === 'energy'
                ? Math.max(0, 1 - (t.basalEnergyDrain * 30) / t.speed / energyBudget)
                : Math.max(0, 1 - 30 / t.speed / deadline)
          );
          const sum = weights.reduce((s, w) => s + w, 0);
          assert(sum > 0, 'Assay exhausted its breeding pool');
          const mean = moments(population.map((c) => c.genome.speed));
          const selectedMean =
            population.reduce((s, c, i) => s + c.genome.speed * weights[i], 0) / sum;
          history.push({
            generation,
            environment,
            speed: mean,
            basalEnergyDrain: moments(population.map((c) => c.genome.basalEnergyDrain)),
            meanWeight: sum / n,
            selectionDifferential: selectedMean - mean.mean
          });
          if (generation === generations) break;
          const cumulative = [];
          let total = 0;
          for (const w of weights) cumulative.push((total += w));
          const parent = () => {
            const value = rng.nextFloat() * total;
            let lo = 0,
              hi = n - 1;
            while (lo < hi) {
              const mid = (lo + hi) >>> 1;
              if (cumulative[mid] > value) hi = mid;
              else lo = mid + 1;
            }
            return population[lo];
          };
          population = population.map(() => ({
            species: 'circle',
            genome: mutateCreatureGenome({
              genome: inheritCreatureGenome({ parentA: parent(), parentB: parent(), config, rng }),
              config,
              rng
            })
          }));
        }
        results.push({ seed, mode, mutation, pressure, n, generations, history });
      }
assert(args.out, '--out required');
const output = JSON.stringify({
  description:
    'Externally imposed reproductive sampling, production genetic/trait functions; not wild adaptation',
  seeds,
  n,
  generations,
  energyBudget,
  deadline,
  config: simConfig,
  results
});
writeFileSync(args.out, args.out.endsWith('.gz') ? gzipSync(output) : output);
console.log(JSON.stringify({ assays: results.length, n, generations, out: args.out }));
