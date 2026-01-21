import { describe, expect, it } from 'vitest';
import { createSim } from '../src/sim/sim.js';

describe('genetics mutation determinism', () => {
  it('produces deterministic mutation summaries for the same seed', () => {
    const seed = 2026;
    const ticks = 4;
    const config = {
      seed,
      creatureCount: 8,
      creaturePregnancyEnabled: false,
      creatureReproductionMinAgeTicks: 0,
      creatureReproductionMinEnergyRatio: 0,
      creatureReproductionMinWaterRatio: 0,
      creatureReproductionCooldownTicks: 1,
      creatureReproductionRange: 100,
      creatureReproductionEnergyCost: 0,
      creatureReproductionWaterCost: 0,
      creatureReproductionStaminaCost: 0,
      creatureGenomeMutationRate: 1,
      creatureGenomeMutationStrength: 0.2,
      creatureGenomePleiotropyScale: 0.25
    };

    const runSim = () => {
      const sim = createSim(config);
      for (let i = 0; i < ticks; i += 1) {
        sim.tick();
      }
      return sim.getSummary();
    };

    const first = runSim();
    const second = runSim();

    expect(first).toEqual(second);
    expect(first.mutationTotal).toBeGreaterThan(0);
    expect(first.mutationStrengthTotal).toBeGreaterThan(0);
  });
});
