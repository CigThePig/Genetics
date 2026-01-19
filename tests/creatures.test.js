import { describe, expect, it } from 'vitest';
import { createSim } from '../src/sim/sim.js';

describe('creature metabolism', () => {
  it('applies basal drains each tick', () => {
    const sim = createSim({
      seed: 101,
      creatureCount: 1,
      creatureBaseEnergy: 1,
      creatureBaseWater: 1,
      creatureBaseStamina: 1,
      creatureBasalEnergyDrain: 0.1,
      creatureBasalWaterDrain: 0.2,
      creatureBasalStaminaDrain: 0.05,
      creatureLifeStages: [
        {
          id: 'adult',
          label: 'Adult',
          minAge: 0,
          movementScale: 1,
          metabolismScale: 1
        }
      ]
    });

    sim.tick();
    const [creature] = sim.state.creatures;

    expect(creature.meters.energy).toBeCloseTo(0.9, 5);
    expect(creature.meters.water).toBeCloseTo(0.8, 5);
    expect(creature.meters.stamina).toBeCloseTo(0.95, 5);
  });
});
