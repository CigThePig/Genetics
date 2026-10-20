import { describe, it, expect } from 'vitest';
import { createSim } from '../src/sim/sim.js';
import { createTickClock } from '../src/app/timebase.js';
import { createRng } from '../src/sim/rng.js';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { simConfig } from '../src/sim/config.js';
import { updateCreatureReproduction } from '../src/sim/creatures/reproduction.js';
import { resolveGestationMultiplier } from '../src/sim/creatures/reproduction-helpers.js';
import { updateCreaturePack } from '../src/sim/creatures/pack.js';
import { updateCreatureHerding } from '../src/sim/creatures/herding.js';
import { updateCreatureIntent } from '../src/sim/creatures/intent.js';
import { applyCreatureActions } from '../src/sim/creatures/actions.js';

const creature = (id, x = 10, y = 10) => ({
  id,
  species: 'circle',
  sex: id % 2 ? 'male' : 'female',
  position: { x, y },
  meters: { energy: 1, water: 1, stamina: 1, hp: 1 },
  traits: {},
  ageTicks: 0,
  priority: 'hunger',
  intent: { type: 'wander' },
  reproduction: { cooldownTicks: 0 },
  herding: { herdSize: 1, isThreatened: false }
});

// Timer callbacks drive the clock; rendering at any refresh never advances the sim.
describe('Track 10.5: fixed timestep', () => {
  it.each([30, 60, 120, 144])('keeps 1x ticks independent of %s Hz rendering', (hz) => {
    const clock = createTickClock();
    clock.reset(0);
    let ticks = 0;
    let timer = 16;
    let frames = 0;
    for (let now = 0; now <= 10000; now++) {
      if (now === timer) {
        clock.advance(now, { tick: () => ticks++ });
        timer += 16;
      }
      if (Math.floor((now * hz) / 1000) > frames) frames++;
    }
    expect(ticks).toBeGreaterThanOrEqual(599);
    expect(ticks).toBeLessThanOrEqual(600);
    expect(frames).toBe(hz * 10);
  });
  it('scales speed and drops paused wall time and unbounded catch-up debt', () => {
    const clock = createTickClock();
    let ticks = 0;
    const tick = () => ticks++;
    clock.reset(0);
    for (let now = 16; now <= 1000; now += 16) clock.advance(now, { speed: 2, tick });
    expect(ticks).toBeGreaterThanOrEqual(118);
    clock.reset(100000);
    const before = ticks;
    expect(clock.advance(100001, { tick })).toBe(0);
    clock.advance(200000, { tick });
    expect(ticks - before).toBeLessThanOrEqual(15);
    clock.reset(300000);
    const capped = clock.advance(400000, { speed: 100, tick });
    expect(capped).toBe(240);
    expect(clock.advance(400000, { speed: 100, tick })).toBeLessThanOrEqual(1);
  });
});

describe('Track 10.6: pregnancy preempt checklist', () => {
  const config = {
    ...simConfig,
    ticksPerSecond: 1,
    creatureReproductionMinAge: 0,
    creatureReproductionMinEnergyRatio: 0,
    creatureReproductionMinWaterRatio: 0,
    creatureConceptionChance: 1,
    creatureGestationTime: 2,
    creatureGestationTraitEnabled: false,
    creatureReproductionRange: 10,
    creatureReproductionCooldown: 100,
    creaturePregnancyMiscarriageEnabled: false
  };

  it('blocks repeat conception, progresses during cooldown, clears on birth and counts once', () => {
    const creatures = [creature(0), creature(1, 11)];
    const world = createWorldGrid({ width: 30, height: 30 });
    const rng = createRng(10),
      metrics = {};
    const step = () => updateCreatureReproduction({ creatures, world, rng, metrics, config });
    step();
    const pregnancy = creatures[0].reproduction.pregnancy;
    expect(pregnancy.isPregnant).toBe(true);
    expect(metrics.pregnanciesTotal).toBe(1);
    creatures[1].reproduction.cooldownTicks = 0;
    step();
    expect(pregnancy.gestationTicksRemaining).toBe(1);
    expect(metrics.pregnanciesTotal).toBe(1);
    expect(creatures[0].reproduction.cooldownTicks).toBeGreaterThan(0);
    step();
    expect(pregnancy.isPregnant).toBe(false);
    expect(pregnancy.gestationTicksRemaining).toBe(0);
    expect(metrics.birthsTotal).toBe(1);
    expect(metrics.birthsLastTick).toBe(1);
    expect(creatures[2].sex).toMatch(/^(male|female)$/);
    step();
    expect(metrics.birthsTotal).toBe(1);
    expect(metrics.birthsLastTick).toBe(0);
  });

  it('clears miscarried pregnancy and does not double count next tick', () => {
    const mother = creature(0);
    mother.meters.energy = 0.1;
    mother.reproduction = {
      cooldownTicks: 100,
      pregnancy: {
        isPregnant: true,
        fatherId: 1,
        fatherGenome: {},
        gestationTicksTotal: 20,
        gestationTicksRemaining: 10
      }
    };
    const metrics = {},
      creatures = [mother];
    const options = {
      creatures,
      world: createWorldGrid({ width: 30, height: 30 }),
      rng: createRng(10),
      metrics,
      config: {
        ...config,
        creaturePregnancyMiscarriageEnabled: true,
        creaturePregnancyMiscarriageChancePerSecond: 1,
        creaturePregnancyMiscarriageEnergyRatio: 0.5
      }
    };
    updateCreatureReproduction(options);
    expect(mother.reproduction.pregnancy).toMatchObject({
      isPregnant: false,
      fatherId: null,
      fatherGenome: null,
      gestationTicksRemaining: 0
    });
    expect(metrics.miscarriagesTotal).toBe(1);
    updateCreatureReproduction(options);
    expect(metrics.miscarriagesTotal).toBe(1);
    expect(metrics.miscarriagesLastTick).toBe(0);
  });

  it('defaults gestation multiplier to one and clamps extremes', () => {
    for (const [value, expected] of [
      [undefined, 1],
      [NaN, 1],
      [-1, 0.5],
      [10, 1.5]
    ]) {
      expect(
        resolveGestationMultiplier({ creature: { traits: { gestationMultiplier: value } } })
      ).toBe(expected);
    }
  });
});

describe('maintenance phases: pack and herd behavior', () => {
  it('relocates a stale idle pack and leaves urgent needs authoritative', () => {
    const leader = {
      ...creature(0, 50, 50),
      species: 'triangle',
      pack: {
        home: { x: 50, y: 50 },
        waypoint: { x: 50, y: 50 },
        waypointTicksRemaining: 100,
        staleTicks: 1,
        patrolPauseTicks: 0
      }
    };
    const follower = { ...creature(1, 51, 50), species: 'triangle' };
    const world = createWorldGrid({ width: 100, height: 100 });
    const config = { ...simConfig, ticksPerSecond: 1, creaturePackRelocateAfterSeconds: 1 };
    updateCreaturePack({ creatures: [leader, follower], config, world, rng: createRng(2) });
    for (let i = 0; i < 3; i++)
      updateCreaturePack({ creatures: [leader, follower], config, world, rng: createRng(2) });
    expect(leader.pack.waypoint).not.toEqual({ x: 50, y: 50 });
    expect(leader.pack.waypointTicksRemaining).toBeGreaterThan(8);
    expect(follower.pack.home).toEqual(leader.pack.home);
    const home = { ...leader.pack.home };
    leader.intent = { type: 'drink', target: { x: 5, y: 5 } };
    updateCreaturePack({ creatures: [leader], config, world, rng: createRng(2) });
    expect(leader.pack.home).toEqual(home);
    expect(leader.intent.target).toEqual({ x: 5, y: 5 });
  });

  it('selects rejoining as a goal and cancels it for threats and needs', () => {
    const source = creature(0),
      kin = creature(1, 30),
      world = createWorldGrid({ width: 100, height: 100 });
    const args = { creatures: [source, kin], world, config: simConfig, rng: createRng(8) };
    updateCreatureHerding(args);
    expect(source.herding.rejoinTarget.x).toBeGreaterThan(source.position.x);
    const threat = { ...creature(3, 9), species: 'triangle' };
    updateCreatureHerding({ ...args, creatures: [source, kin, threat] });
    expect(source.herding.rejoinTarget).toBeNull();
    source.herding.threatDecayTicks = 0;
    source.intent.type = 'drink';
    updateCreatureHerding(args);
    expect(source.herding.rejoinTarget).toBeNull();
  });

  it.each([true, false])(
    'grazes only with kin and immediately responds to threats (simple %s)',
    (simple) => {
      const world = createWorldGrid({ width: 30, height: 30 });
      const creatures = [creature(0), creature(1, 11), creature(2, 12)];
      const config = {
        ...simConfig,
        creatureHerdingSimpleMode: simple,
        creatureMateSeekingEnabled: false,
        creatureWaterRendezvousEnabled: false
      };
      const rng = createRng(8);
      updateCreatureHerding({ creatures, world, config, rng, tick: 1 });
      updateCreatureIntent({ creatures, world, config, rng, tick: 1 });
      expect(creatures[0].intent.type).toBe('graze');
      const predator = { ...creature(3, 9), species: 'triangle' };
      creatures.push(predator);
      updateCreatureHerding({ creatures, world, config, rng, tick: 2 });
      updateCreatureIntent({ creatures, world, config, rng, tick: 2 });
      expect(creatures[0].herding.isThreatened).toBe(true);
      expect(creatures[0].intent.type).not.toBe('graze');
      expect(creatures[0].herding.targetOffset.x).toBeGreaterThan(0);
      const lone = creature(10);
      updateCreatureHerding({ creatures: [lone], world, config, rng, tick: 3 });
      updateCreatureIntent({ creatures: [lone], world, config, rng, tick: 3 });
      expect(lone.intent.type).toBe('wander');
    }
  );

  it('uses shared shoreline rendezvous and starts regroup after drinking', () => {
    const world = createWorldGrid({ width: 30, height: 30 });
    for (let y = 0; y < 30; y++) world.setTerrainAt(15, y, 'water');
    const creatures = [creature(0, 10, 10), creature(1, 11, 10), creature(2, 12, 10)];
    for (const c of creatures) {
      c.meters.water = 0.3;
      c.herding.herdSize = 3;
      c.priority = 'thirst';
    }
    const config = {
      ...simConfig,
      creatureHerdingSimpleMode: false,
      creatureMateSeekingEnabled: false
    };
    creatures[0].perception = { waterCell: { x: 15, y: 10 } };
    updateCreatureIntent({ creatures, world, config, rng: createRng(8), tick: 1 });
    expect(world.herdWaterTargets.circle).toBeDefined();
    expect(creatures[0].intent.target).toEqual(creatures[1].intent.target);
    creatures[0].position = { x: 14.5, y: 10.5 };
    creatures[0].intent.type = 'drink';
    applyCreatureActions({ creatures, world, config });
    expect(creatures[0].herding.postDrinkRegroupTicks).toBeGreaterThan(0);
  });
});

describe('regroup completion across both herd modes', () => {
  it.each([true, false])(
    'regroups outside local range and counts down drinking recovery (simple %s)',
    (simple) => {
      const source = creature(0),
        kin = creature(1, 40);
      source.herding.postDrinkRegroupTicks = 10;
      const world = createWorldGrid({ width: 100, height: 100 });
      const config = {
        ...simConfig,
        creatureHerdingSimpleMode: simple,
        creatureHerdingRegroupIntervalSeconds: 0.05,
        creatureHerdingAnchorEnabled: false
      };
      const rng = createRng(8),
        creatures = [source, kin];
      updateCreatureHerding({ creatures, world, config, rng, tick: 1 });
      expect(source.herding.herdSize).toBe(1);
      expect(source.herding.rejoinTarget.x).toBeGreaterThan(source.position.x);
      expect(source.herding.postDrinkRegroupTicks).toBe(9);
      source.intent = { type: 'drink' };
      updateCreatureHerding({ creatures, world, config, rng, tick: 2 });
      expect(source.herding.targetOffset).toBeNull();
      expect(source.herding.postDrinkRegroupTicks).toBe(8);
    }
  );
});

describe('phase compatibility checks', () => {
  it('replays the same authoritative behavior with either legacy worker flag', () => {
    const first = createSim({ seed: 11, creatureHerdingUseWorker: 0 });
    const second = createSim({ seed: 11, creatureHerdingUseWorker: 1 });
    for (let i = 0; i < 120; i++) {
      first.tick();
      second.tick();
    }
    expect(JSON.stringify(first.state)).toBe(JSON.stringify(second.state));
    expect(first.getSummary()).toEqual(second.getSummary());
  });

  it('preserves default spawning when retry budgets are specified explicitly', () => {
    const first = createSim({ seed: 42 });
    const second = createSim({
      seed: 42,
      creatureSpawnRetries: 20,
      creatureSpawnAnchorRetries: 30
    });
    expect(first.state.creatures).toEqual(second.state.creatures);
    expect(
      first.state.creatures.every(
        (c) =>
          first.state.world.getTerrainAt(Math.floor(c.position.x), Math.floor(c.position.y)) !==
          'water'
      )
    ).toBe(true);
  });
});
