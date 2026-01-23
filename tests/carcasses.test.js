import { describe, expect, it } from 'vitest';
import {
  consumeMeatAt,
  findCarcassAt,
  spawnCarcass,
  updateCarcasses
} from '../src/sim/plants/carcasses.js';

describe('carcasses', () => {
  it('spawns, merges, and consumes meat at a cell', () => {
    const world = { carcasses: [], carcassIdCounter: 0 };
    const config = { carcassMaxMeatPerCell: 1.5 };

    const first = spawnCarcass({ world, x: 2, y: 3, meat: 1, config });
    expect(first?.meat).toBeCloseTo(1, 5);
    expect(world.carcasses.length).toBe(1);

    const merged = spawnCarcass({ world, x: 2, y: 3, meat: 1, config });
    expect(merged?.meat).toBeCloseTo(1.5, 5);
    expect(world.carcasses.length).toBe(1);

    const consumed = consumeMeatAt({ world, x: 2, y: 3, amount: 0.4 });
    expect(consumed).toBeCloseTo(0.4, 5);
    const carcass = findCarcassAt(world, 2, 3);
    expect(carcass?.meat).toBeCloseTo(1.1, 5);

    const consumedAll = consumeMeatAt({ world, x: 2, y: 3, amount: 2 });
    expect(consumedAll).toBeCloseTo(1.1, 5);
    expect(findCarcassAt(world, 2, 3)).toBeNull();
  });

  it('decays meat over time and removes empty carcasses', () => {
    const world = { carcasses: [], carcassIdCounter: 0 };
    const config = { carcassDecayRate: 0.2, ticksPerSecond: 1 };

    spawnCarcass({ world, x: 1, y: 1, meat: 0.3, config });
    let summary = updateCarcasses({ world, config });
    expect(summary.count).toBe(1);
    expect(summary.totalMeat).toBeCloseTo(0.1, 5);

    summary = updateCarcasses({ world, config });
    expect(summary.count).toBe(0);
    expect(summary.totalMeat).toBeCloseTo(0, 5);
  });
});
