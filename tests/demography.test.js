import { describe, it, expect } from 'vitest';
import { createSim } from '../src/sim/sim.js';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { createRng } from '../src/sim/rng.js';
import {
  updateCreatureReproduction,
  isReadyToReproduce
} from '../src/sim/creatures/reproduction.js';
import {
  resolveCreatureMaturityScale,
  resolveCreatureMaxAgeTicks
} from '../src/sim/creatures/aging.js';
import { createDefaultMetrics } from '../src/sim/metrics-factory.js';

const species = ['square', 'circle', 'triangle', 'octagon'];
function fixture(kind, pregnancy = true) {
  const sim = createSim({ seed: 42, creatureCount: 0, worldWidth: 10, worldHeight: 10 });
  const config = {
    ...sim.config,
    creatureConceptionChance: 1,
    creaturePregnancyEnabled: pregnancy,
    creatureGestationTime: 1,
    creatureGestationTraitEnabled: false,
    colourCamouflageEnabled: false
  };
  const creatures = ['female', 'male'].map((sex, id) => ({
    id,
    species: kind,
    sex,
    position: { x: 5.5, y: 5.5 },
    ageTicks: 6000,
    maturityScale: 1,
    genome: { growthRate: 0.5, longevity: 0.5 },
    traits: {},
    meters: { energy: 1, water: 1, hp: 1, stamina: 1 },
    reproduction: { cooldownTicks: 0 }
  }));
  return {
    creatures,
    config,
    world: createWorldGrid({ width: 10, height: 10, defaultTerrain: 'plains' }),
    rng: createRng(42),
    metrics: createDefaultMetrics()
  };
}
describe('life-history recovery ownership', () => {
  it.each(species)(
    '%s offspring can breed at their own maturity without inheriting parental recovery',
    (kind) => {
      for (const pregnancy of [true, false]) {
        const o = fixture(kind, pregnancy);
        updateCreatureReproduction(o);
        expect(o.creatures[0].reproduction.cooldownTicks).toBe(7200);
        if (pregnancy) for (let t = 0; t < 60; t++) updateCreatureReproduction(o);
        expect(o.creatures).toHaveLength(3);
        const child = o.creatures[2];
        expect(child.ageTicks).toBe(0);
        expect(child.reproduction.cooldownTicks).toBe(0);
        child.ageTicks = Math.ceil((75 * 60) / child.maturityScale);
        child.meters.energy = child.meters.water = 1;
        const parent = o.creatures.find((p) => p.sex !== child.sex);
        parent.reproduction = { cooldownTicks: 0 };
        parent.meters.energy = parent.meters.water = 1;
        o.creatures.splice(0, o.creatures.length, parent, child);
        const before = o.metrics.pregnanciesTotal + o.metrics.birthsTotal;
        updateCreatureReproduction(o);
        expect(o.metrics.pregnanciesTotal + o.metrics.birthsTotal).toBeGreaterThan(before);
        expect(child.reproduction.cooldownTicks).toBe(7200);
      }
    }
  );
  it('retains resource and maturity constraints independently of cooldown', () => {
    const o = fixture('triangle'),
      c = o.creatures[0];
    const ready = () =>
      isReadyToReproduce({
        creature: c,
        baseEnergy: 1,
        baseWater: 1,
        minEnergyRatio: 0.7,
        minWaterRatio: 0.7,
        minAgeTicks: 4500,
        sexEnabled: true,
        pregnancyEnabled: true
      });
    c.ageTicks = 4499;
    expect(ready()).toBe(false);
    c.ageTicks = 4500;
    expect(ready()).toBe(true);
    c.meters.water = 0.69;
    expect(ready()).toBe(false);
  });
  it('couples growth and longevity coherently without erasing genetic variation', () => {
    const o = fixture('square');
    for (const growthRate of [0, 0.5, 1])
      for (const longevity of [0, 0.5, 1]) {
        const genome = { growthRate, longevity };
        const scale = resolveCreatureMaturityScale({ genome, config: o.config });
        const lifespan = resolveCreatureMaxAgeTicks({ genome, config: o.config });
        expect(lifespan).toBeGreaterThan(4500 / scale);
        expect((lifespan * scale) / 60).toBeCloseTo(540 * (0.75 + 0.6 * longevity), 1);
      }
  });
});
describe('mating attempt accounting', () => {
  it.each(species)(
    'counts each %s pair once and distinguishes failure from no opportunity',
    (kind) => {
      const o = fixture(kind);
      o.config.creatureConceptionChance = 0;
      updateCreatureReproduction(o);
      expect(o.metrics.matingAttemptsTotal).toBe(1);
      expect(o.metrics.matingFailuresTotal).toBe(1);
      expect(o.metrics.matingAttemptsBySpecies[kind]).toBe(1);
      expect(o.metrics.matingFailuresBySpecies[kind]).toBe(1);
      expect(o.metrics.pregnanciesTotal).toBe(0);
      updateCreatureReproduction(o);
      expect(o.metrics.matingAttemptsTotal).toBe(1);
      for (const c of o.creatures) c.reproduction.cooldownTicks = 0;
      o.config.creatureConceptionChance = 1;
      updateCreatureReproduction(o);
      expect(o.metrics.matingAttemptsTotal).toBe(2);
      expect(o.metrics.matingAttemptsTotal).toBe(
        o.metrics.pregnanciesTotal + o.metrics.matingFailuresTotal
      );
      expect(o.metrics.matingFailuresTotal).toBe(1);
    }
  );
  it('keeps counters independent and clears them on reset', () => {
    const a = createSim({ creatureCount: 0 }),
      b = createSim({ creatureCount: 0 });
    a.state.metrics.matingAttemptsBySpecies.square = 9;
    expect(b.state.metrics.matingAttemptsBySpecies.square).toBe(0);
    a.setSeed(1);
    expect(a.state.metrics.matingAttemptsBySpecies.square).toBe(0);
    expect(a.getSummary().matingAttemptsTotal).toBe(0);
  });
});
describe('diagnostics are observational', () => {
  it('records failed attempts, pregnancy and birth without changing RNG or animals', () => {
    const a = fixture('octagon'),
      b = fixture('octagon');
    b.metrics = null;
    for (let t = 0; t < 8000; t++) {
      updateCreatureReproduction(a);
      updateCreatureReproduction(b);
    }
    expect(a.creatures).toEqual(b.creatures);
    expect(a.rng.nextFloat()).toBe(b.rng.nextFloat());
    expect(a.metrics.birthsTotal).toBeGreaterThan(0);
  });
});
function movingPair(kind, barrier = false) {
  const sim = createSim({
    seed: 42,
    creatureCount: 8,
    creaturePredatorCount: 4,
    worldWidth: 40,
    worldHeight: 20,
    creatureConceptionChance: 1,
    colourCamouflageEnabled: false
  });
  sim.state.creatures = sim.state.creatures.filter((c) => c.species === kind);
  sim.state.world = createWorldGrid({
    width: 40,
    height: 20,
    defaultTerrain: 'plains',
    defaultGrass: 0
  });
  if (barrier)
    for (let y = 0; y < 20; y++)
      for (let x = 15; x < 25; x++) sim.state.world.setTerrainAt(x, y, 'water');
  for (const [i, c] of sim.state.creatures.entries()) {
    c.ageTicks = 6000;
    c.position = { x: barrier ? (i ? 26.5 : 13.5) : 5.5 + i * 15, y: 10.5 };
  }
  return sim;
}
describe('full movement to reproductive opportunity', () => {
  it.each(species)('%s approaches an observed partner outside conception range', (kind) => {
    const sim = movingPair(kind),
      initial = sim.state.creatures.map((c) => ({ ...c.position }));
    expect(Math.abs(initial[1].x - initial[0].x)).toBeGreaterThan(
      sim.config.creatureReproductionRangeWhileSeeking
    );
    for (let t = 0; t < 1200 && sim.state.metrics.pregnanciesTotal === 0; t++) sim.tick();
    expect(sim.state.metrics.pregnanciesTotal).toBe(1);
    const [a, b] = sim.state.creatures;
    expect(
      Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y)
    ).toBeLessThanOrEqual(sim.config.creatureReproductionRangeWhileSeeking);
    expect(
      sim.state.creatures.some(
        (c, i) => Math.hypot(c.position.x - initial[i].x, c.position.y - initial[i].y) > 3
      )
    ).toBe(true);
  });
  it.each(species)(
    '%s cannot mate or cross a water barrier wider than the interaction range',
    (kind) => {
      const sim = movingPair(kind, true);
      for (let t = 0; t < 1800; t++) sim.tick();
      expect(sim.state.metrics.pregnanciesTotal).toBe(0);
      expect(sim.state.creatures).toHaveLength(2);
      expect(sim.state.creatures[0].position.x).toBeLessThan(15);
      expect(sim.state.creatures[1].position.x).toBeGreaterThanOrEqual(25);
    }
  );
});
