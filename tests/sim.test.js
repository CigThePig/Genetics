import { describe, expect, it } from 'vitest';
import { createSim } from '../src/sim/sim.js';

describe('sim scaffold', () => {
  it('creates a sim with default config', () => {
    const sim = createSim();
    expect(sim.config.seed).toBe(1);
  });

  it('produces deterministic summaries for the same seed', () => {
    const seed = 12345;
    const ticks = 5;
    const runSim = () => {
      const sim = createSim({ seed });
      for (let i = 0; i < ticks; i += 1) {
        sim.tick();
      }
      return sim.getSummary();
    };

    expect(runSim()).toEqual(runSim());
  });
});
