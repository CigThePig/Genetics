import { describe, it, expect } from 'vitest';
import { threatChoice } from '../scripts/threat-choice.mjs';
import { resolveEscapeDistance } from '../src/sim/creatures/herding-simple-helpers.js';
import { createSim } from '../src/sim/sim.js';

describe('inherited vigilance and escape opportunity cost', () => {
  it('makes different decisions at the same observed danger, paying in feeding time', async () => {
    const bold = await threatChoice({ gene: 0.1, distance: 8 });
    const cautious = await threatChoice({ gene: 0.9, distance: 8 });
    expect(bold.firstEscapeTick).toBe(null);
    expect(cautious.firstEscapeTick).toBe(1);
    expect(cautious.escapingSeconds).toBeGreaterThan(bold.escapingSeconds);
    expect(cautious.meanEnergy).toBeLessThan(bold.meanEnergy);
    expect(cautious.feedingWhileEscapingSeconds).toBe(0);
  });
  it('never responds to an unseen predator and retains close-danger escape even at low vigilance', async () => {
    expect((await threatChoice({ gene: 0.9, distance: 20 })).firstEscapeTick).toBe(null);
    expect((await threatChoice({ gene: 0.1, distance: 1.5 })).firstEscapeTick).toBe(1);
  });
  it('uses phenotype first and keeps the central phenotype at the configured threshold', () => {
    const config = { creatureBehaviorAlertToFleeThreshold: 8, creatureAlertnessBase: 0.6 };
    expect(
      resolveEscapeDistance({ traits: { alertness: 0.6 }, genome: { alertness: 0 } }, config)
    ).toBe(8);
    expect(resolveEscapeDistance({ traits: { alertness: 0 } }, config)).toBe(2);
    expect(resolveEscapeDistance({}, config)).toBe(8);
  });
  it('replays with independent worlds and resets all inherited policy state', () => {
    const a = createSim({ seed: 42, creatureCount: 12 });
    const b = createSim({ seed: 42, creatureCount: 12 });
    for (let i = 0; i < 240; i++) {
      a.tick();
      b.tick();
    }
    expect(a.state.creatures).toEqual(b.state.creatures);
    const before = structuredClone(a.state.creatures);
    a.setSeed(42);
    for (let i = 0; i < 240; i++) a.tick();
    expect(a.state.creatures).toEqual(before);
  });
});
