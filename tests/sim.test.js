import { describe, expect, it } from 'vitest';
import { createSim } from '../src/sim/sim.js';

describe('sim scaffold', () => {
  it('creates a sim with default config', () => {
    const sim = createSim();
    expect(sim.config.seed).toBe(1);
  });
});
