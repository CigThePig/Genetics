import { describe, it, expect } from 'vitest';
import { createSim } from '../src/sim/sim.js';
import { createDefaultMetrics } from '../src/sim/metrics-factory.js';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { spawnCarcass } from '../src/sim/plants/carcasses.js';
import { applyCreatureActions } from '../src/sim/creatures/actions.js';
import { applyCreatureDeaths, selectDeathCause } from '../src/sim/creatures/death.js';
import { applyCreatureCombat } from '../src/sim/creatures/combat.js';

const actor = (id, species = 'triangle') => ({
  id,
  species,
  position: { x: 5.5, y: 5.5 },
  ageTicks: 0,
  maxAgeTicks: 600,
  meters: { hp: 1, energy: 0.99, water: 1, stamina: 1 },
  traits: { foodEfficiency: { meat: 2 } },
  intent: { type: 'eat', foodType: 'meat' }
});
describe('ecological accounting', () => {
  it('credits actual capped food energy and consumed meat to the eating species', () => {
    const world = createWorldGrid({ width: 10, height: 10 }),
      metrics = createDefaultMetrics();
    spawnCarcass({ world, x: 5, y: 5, meat: 1, config: {} });
    const c = actor(1, 'octagon');
    const config = {
      ticksPerSecond: 60,
      creatureEatAmount: 0.6,
      creatureFoodProperties: { meat: { nutrition: 4 } }
    };
    applyCreatureActions({ creatures: [c], world, config, metrics });
    expect(c.meters.energy).toBe(1);
    expect(metrics.feedingBySpecies.octagon.meat.consumed).toBeCloseTo(0.01);
    expect(metrics.feedingBySpecies.octagon.meat.energy).toBeCloseTo(0.01);
    expect(metrics.feedingBySpecies.octagon.meat.ticks).toBe(1);
    expect(metrics.feedingBySpecies.triangle.meat.consumed).toBe(0);
    world.carcasses = [];
    applyCreatureActions({ creatures: [c], world, config, metrics });
    expect(metrics.feedingBySpecies.octagon.meat.ticks).toBe(1);
  });
  it('attributes a lethal catch to predation even at a coincident lifespan boundary', () => {
    const world = createWorldGrid({ width: 10, height: 10 }),
      metrics = createDefaultMetrics();
    const predator = actor(0),
      prey = actor(1, 'circle');
    prey.ageTicks = prey.maxAgeTicks;
    predator.chase = { lastOutcome: 'caught', lastOutcomeTick: 10, lastTargetId: 1 };
    const creatures = [predator, prey];
    const config = { creatureBehaviorStateEnabled: false };
    applyCreatureCombat({ creatures, world, metrics, config, tick: 10 });
    applyCreatureDeaths({ creatures, metrics, config });
    expect(metrics.killsTotal).toBe(1);
    expect(metrics.deathsByCause.predation).toBe(1);
    expect(metrics.deathsByCause.age).toBe(0);
    expect(metrics.deathsByCauseBySpecies.circle.predation).toBe(1);
    expect(creatures).toEqual([predator]);
  });
  it('retains explicit deterministic precedence for simultaneous non-event terminal conditions', () => {
    const c = actor(1);
    c.meters = { hp: 0, energy: 0, water: 0 };
    expect(selectDeathCause({ creature: c, maxAgeTicks: 600 })).toBe('injury');
    c.meters.hp = 1;
    expect(selectDeathCause({ creature: c, maxAgeTicks: 600 })).toBe('thirst');
    c.meters.water = 1;
    expect(selectDeathCause({ creature: c, maxAgeTicks: 600 })).toBe('starvation');
  });
  it('keeps counters instance-owned and resets them', () => {
    const a = createSim({ creatureCount: 0, worldWidth: 12, worldHeight: 12 }),
      b = createSim({ creatureCount: 0, worldWidth: 12, worldHeight: 12 });
    a.state.metrics.feedingBySpecies.triangle.meat.energy = 7;
    expect(b.state.metrics.feedingBySpecies.triangle.meat.energy).toBe(0);
    a.setSeed(42);
    expect(a.state.metrics.feedingBySpecies.triangle.meat.energy).toBe(0);
  });
});

// No food is supplied: this isolates encountering an eligible partner from finding a meal.
import { updateCreatureIntent } from '../src/sim/creatures/intent.js';
import { updateCreatureReproduction } from '../src/sim/creatures/reproduction.js';
import { createRng } from '../src/sim/rng.js';
import { simConfig } from '../src/sim/config.js';
const courtship = () => {
  const world = createWorldGrid({ width: 20, height: 20, defaultGrass: 0 });
  const creatures = [actor(0), actor(1)];
  for (const [i, c] of creatures.entries()) {
    c.sex = i === 0 ? 'male' : 'female';
    c.ageTicks = 6000;
    c.maturityScale = 1;
    c.reproduction = { cooldownTicks: 0 };
    c.position = { x: 5.5 + i * 3, y: 5.5 };
    c.meters.energy = 0.72;
    c.meters.water = 0.9;
    c.priority = 'hunger';
    c.traits.eatThreshold = 0.75;
    c.traits.drinkThreshold = 0.75;
  }
  return {
    world,
    creatures,
    config: { ...simConfig, creatureConceptionChance: 1, colourCamouflageEnabled: false },
    rng: createRng(42),
    metrics: createDefaultMetrics()
  };
};
describe('reproductive opportunity below appetite', () => {
  it('courts an observed eligible partner when no meal is immediately available', () => {
    const o = courtship();
    updateCreatureIntent(o);
    expect(o.creatures.map((c) => c.intent.type)).toEqual(['mate', 'mate']);
    updateCreatureReproduction(o);
    expect(o.metrics.pregnanciesTotal).toBe(1);
  });
  it('does not replace real food with courting, or search blindly below appetite', () => {
    const o = courtship();
    spawnCarcass({ world: o.world, x: 5, y: 5, meat: 1, config: o.config });
    updateCreatureIntent(o);
    expect(o.creatures[0].intent.type).toBe('eat');
    const p = courtship();
    p.creatures[1].position.x = 19.5;
    p.config.creatureMateSeekRange = 4;
    updateCreatureIntent(p);
    expect(p.creatures[0].intent.type).not.toBe('mate');
    expect(p.creatures[0].search.goal).toBe('food');
  });
  it('requires real opposite-sex partners, adequate reserves, maturity and cooldown', () => {
    for (const change of [
      (c) => (c.sex = 'male'),
      (c) => (c.meters.energy = 0.69),
      (c) => (c.ageTicks = 0),
      (c) => (c.reproduction.cooldownTicks = 100)
    ]) {
      const o = courtship();
      change(o.creatures[1]);
      updateCreatureIntent(o);
      updateCreatureReproduction(o);
      expect(o.creatures[0].intent.type).not.toBe('mate');
      expect(o.metrics.pregnanciesTotal).toBe(0);
    }
  });
});

import { updateMateMemories, rememberedMatePosition } from '../src/sim/creatures/mate-memory.js';
describe('observed mate contacts', () => {
  it('records immature contacts and later searches the last observed location rather than hidden live coordinates', () => {
    const o = courtship(),
      [source, mate] = o.creatures;
    source.ageTicks = 0;
    mate.ageTicks = 0;
    updateMateMemories({ ...o, tick: 1 });
    expect(source.reproduction.contacts.entries).toHaveLength(1);
    const seen = { ...mate.position };
    mate.position = { x: 18, y: 18 };
    source.position = { x: 1, y: 1 };
    source.ageTicks = 6000;
    source.meters.energy = 0.95;
    o.config.creatureMateSeekRange = 4;
    updateCreatureIntent({ ...o, tick: 61 });
    expect(source.intent.type).toBe('seek');
    expect(source.search.goal).toBe('mate');
    expect(source.intent.target).toEqual(seen);
    expect(source.intent.target).not.toEqual(mate.position);
    updateCreatureReproduction(o);
    expect(o.metrics.pregnanciesTotal).toBe(0);
  });
  it('expires and visits old contacts and clears memory when disabled', () => {
    const o = courtship(),
      c = o.creatures[0];
    o.config.creatureMateMemorySeconds = 1;
    updateMateMemories({ ...o, tick: 1 });
    const location = { ...o.creatures[1].position };
    o.creatures.pop();
    updateMateMemories({ ...o, tick: 62 });
    expect(c.reproduction.contacts.entries).toEqual([]);
    c.reproduction.contacts.entries = [{ id: 1, position: location, tick: 62 }];
    c.position = location;
    expect(rememberedMatePosition(c, o.world)).toBe(null);
    expect(c.reproduction.contacts.entries).toEqual([]);
    c.reproduction.contacts.entries = [{ id: 1, position: location, tick: 62 }];
    o.config.creatureMateMemorySeconds = 0;
    updateMateMemories({ ...o, tick: 63 });
    expect(c.reproduction.contacts).toBe(null);
  });
  it('bounds contact storage, excludes dead and same-sex actors, and does not create unseen contacts', () => {
    const o = courtship(),
      source = o.creatures[0];
    o.creatures = [
      source,
      ...Array.from({ length: 10 }, (_, i) => ({
        ...actor(i + 1),
        sex: 'female',
        position: { x: 7 + i * 0.05, y: 5.5 }
      })),
      { ...actor(11), sex: 'male' },
      { ...actor(12), sex: 'female', meters: { hp: 0 } },
      { ...actor(13), sex: 'female', position: { x: 19, y: 19 } }
    ];
    o.config.creatureMateSeekRange = 5;
    updateMateMemories({ ...o, tick: 1 });
    expect(source.reproduction.contacts.entries.map((e) => e.id)).toEqual([1, 2, 3, 4]);
  });
  it('does not keep guiding a healthy animal to an inaccessible contact across disconnected land', () => {
    const o = courtship(),
      c = o.creatures[0];
    for (let y = 0; y < 20; y++) o.world.setTerrainAt(7, y, 'water');
    c.reproduction.contacts = { entries: [{ id: 1, position: { x: 9, y: 5.5 }, tick: 1 }] };
    expect(rememberedMatePosition(c, o.world)).toBe(null);
  });
});

import { updateCreatureBasalMetabolism } from '../src/sim/creatures/metabolism.js';
describe('resource recovery episodes', () => {
  const recoveryCase = () => {
    const c = actor(0),
      world = createWorldGrid({ width: 12, height: 12, defaultGrass: 0 });
    c.meters.energy = 0.55;
    c.meters.water = 0.5;
    c.traits.eatThreshold = 0.75;
    c.traits.drinkThreshold = 0.75;
    c.intent = { type: 'eat', foodType: 'meat' };
    c.priority = 'thirst';
    spawnCarcass({ world, x: 5, y: 5, meat: 3.5, config: simConfig });
    world.setTerrainAt(4, 5, 'water');
    return {
      creatures: [c],
      world,
      config: { ...simConfig, creatureMateSeekingEnabled: false },
      rng: createRng(1),
      metrics: createDefaultMetrics()
    };
  };
  it('finishes an available meal despite a slightly lower safe water reserve', () => {
    const o = recoveryCase();
    updateCreatureIntent(o);
    expect(o.creatures[0].intent).toMatchObject({ type: 'eat', foodType: 'meat' });
  });
  it('continues drinking despite a slightly lower safe energy reserve', () => {
    const o = recoveryCase(),
      c = o.creatures[0];
    c.intent = { type: 'drink' };
    c.priority = 'hunger';
    c.meters.energy = 0.5;
    c.meters.water = 0.55;
    updateCreatureIntent(o);
    expect(c.intent.type).toBe('drink');
  });
  it('uses normalized reserves and reaches recovery on finite resources rather than stopping at appetite', () => {
    const o = recoveryCase(),
      c = o.creatures[0];
    o.config.creatureBaseEnergy = 2;
    o.config.creatureBaseWater = 2;
    c.meters.energy = 0.8;
    c.meters.water = 0.9;
    c.intent = { type: 'wander' };
    for (let tick = 1; tick <= 300; tick++) {
      updateCreaturePriorityForRecovery(o);
      updateCreatureIntent({ ...o, tick });
      applyCreatureActions(o);
      updateCreatureBasalMetabolism(o);
    }
    expect(c.meters.energy / 2).toBeGreaterThan(0.9);
    expect(c.meters.water / 2).toBeGreaterThan(0.9);
    expect(o.metrics.feedingBySpecies.triangle.meat.consumed).toBeLessThan(3.5);
    expect(c.meters.energy).toBeLessThanOrEqual(2);
  });
  it('yields a meal to emergency thirst and drinking to emergency hunger', () => {
    const a = recoveryCase();
    a.creatures[0].meters.water = 0.1;
    updateCreatureIntent(a);
    expect(a.creatures[0].intent.type).toBe('drink');
    const b = recoveryCase(),
      c = b.creatures[0];
    c.intent = { type: 'drink' };
    c.priority = 'hunger';
    c.meters.energy = 0.1;
    updateCreatureIntent(b);
    expect(c.intent.type).toBe('eat');
  });
  it('cannot continue a meal after meat is gone', () => {
    const o = recoveryCase();
    o.world.carcasses = [];
    updateCreatureIntent(o);
    expect(o.creatures[0].intent.type).not.toBe('eat');
  });
});
import { updateCreaturePriority as updateCreaturePriorityForRecovery } from '../src/sim/creatures/intent.js';
