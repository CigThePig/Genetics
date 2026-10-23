import { describe, it, expect } from 'vitest';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { createRng } from '../src/sim/rng.js';
import { simConfig } from '../src/sim/config.js';
import { navigationTarget, clearLandLine } from '../src/sim/creatures/navigation.js';
import { pickSearchTarget } from '../src/sim/creatures/intent-helpers.js';
import { updateCreatureMovement } from '../src/sim/creatures/movement.js';
import { updateCreatureReproduction } from '../src/sim/creatures/reproduction.js';
import { selectMateTarget } from '../src/sim/creatures/reproduction-helpers.js';
import { startCreatureChase, updateCreatureChase } from '../src/sim/creatures/chase.js';
import { applyCreatureCombat } from '../src/sim/creatures/combat.js';

const world = () => createWorldGrid({ width: 12, height: 12, defaultTerrain: 'plains' });
const animal = (id, x, y, species = 'circle') => ({
  id,
  species,
  sex: id % 2 ? 'female' : 'male',
  position: { x, y },
  ageTicks: 10000,
  meters: { energy: 1, water: 1, stamina: 1, hp: 1 },
  reproduction: { cooldownTicks: 0 },
  traits: { speed: 3 },
  intent: { type: 'wander' },
  motion: { heading: Math.PI / 2 }
});

describe('maintenance: reachable movement goals', () => {
  it('retains a nearby corner until the next waypoint is visible', () => {
    const w = world();
    w.setTerrainAt(2, 1, 'water');
    const c = animal(0, 1.8, 1.8);
    const goal = { x: 3.5, y: 2.5 };
    const route = {};
    for (let i = 0; i < 2; i++) {
      const next = navigationTarget(w, c.position, goal, route);
      expect(next).toEqual({ x: 1.5, y: 2.5 });
      expect(clearLandLine(w, c.position, next)).toBe(true);
    }
    c.intent = { type: 'seek', target: goal };
    const options = { creatures: [c], world: w, config: simConfig, rng: createRng(1) };
    for (let i = 0; i < 600; i++) {
      updateCreatureMovement(options);
      expect(w.getTerrainAt(Math.floor(c.position.x), Math.floor(c.position.y))).not.toBe('water');
    }
    expect(Math.hypot(c.position.x - goal.x, c.position.y - goal.y)).toBeLessThan(0.8);
  });

  it('does not commit exploration to disconnected land', () => {
    const w = world();
    for (let y = 0; y < w.height; y++) w.setTerrainAt(6, y, 'water');
    const c = animal(0, 4.5, 5.5);
    const rng = createRng(42);
    let unreachable = 0;
    for (let i = 0; i < 100; i++) {
      c.search = null;
      const target = pickSearchTarget({
        creature: c,
        goal: 'food',
        config: simConfig,
        world: w,
        rng
      });
      if (target && !navigationTarget(w, c.position, target)) unreachable++;
    }
    expect(unreachable).toBe(0);
  });
});

describe('maintenance: physical interactions respect water barriers', () => {
  it.each([false, true])(
    'prevents conception across water (committed: %s), permits it on land',
    (committed) => {
      const w = world();
      for (let y = 0; y < w.height; y++) w.setTerrainAt(5, y, 'water');
      const a = animal(0, 4.8, 5.5),
        b = animal(1, 6.1, 5.5);
      if (committed) {
        a.reproduction.mate = { targetId: b.id, commitTicksRemaining: 60 };
        b.reproduction.mate = { targetId: a.id, commitTicksRemaining: 60 };
      }
      const config = { ...simConfig, creatureConceptionChance: 1, colourCamouflageEnabled: false };
      // Observation can cross water; conception requires physical access.
      expect(
        selectMateTarget({
          source: a,
          creatures: [a, b],
          maxDistanceSq: 9,
          baseEnergy: 1,
          baseWater: 1,
          minEnergyRatio: 0.5,
          minWaterRatio: 0.5,
          minAgeTicks: 1,
          sexEnabled: true,
          pregnancyEnabled: true,
          world: w,
          config
        })
      ).toBe(b);
      const options = { creatures: [a, b], world: w, config, rng: createRng(1), metrics: {} };
      updateCreatureReproduction(options);
      expect(b.reproduction.pregnancy.isPregnant).toBe(false);
      expect(options.metrics.matingAttemptsTotal ?? 0).toBe(0);
      w.setTerrainAt(5, 5, 'plains');
      updateCreatureReproduction(options);
      expect(b.reproduction.pregnancy.isPregnant).toBe(true);
    }
  );

  it('does not catch prey through a diagonal water corner, but catches on open land', () => {
    const w = world();
    w.setTerrainAt(2, 1, 'water');
    const hunter = animal(0, 1.9, 1.9, 'triangle'),
      prey = animal(1, 2.1, 2.1);
    hunter.intent = { type: 'hunt' };
    const config = { ...simConfig, creatureBehaviorStateEnabled: false };
    const metrics = {};
    startCreatureChase({ creature: hunter, target: prey, metrics, config, tick: 1 });
    const options = { creatures: [hunter, prey], world: w, config, metrics, tick: 2 };
    updateCreatureChase(options);
    applyCreatureCombat(options);
    expect(prey.meters.hp).toBe(1);
    expect(metrics.chaseSuccesses ?? 0).toBe(0);
    w.setTerrainAt(2, 1, 'plains');
    options.tick++;
    updateCreatureChase(options);
    applyCreatureCombat(options);
    expect(prey.meters.hp).toBe(0);
    expect(metrics.killsTotal).toBe(1);
  });
});
