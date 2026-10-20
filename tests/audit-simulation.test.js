import { describe, expect, it, vi } from 'vitest';
import { createSim } from '../src/sim/sim.js';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { createRng } from '../src/sim/rng.js';
import { createSpatialIndex, rebuildSpatialIndex } from '../src/sim/spatial-index.js';
import { updateCreaturePerception } from '../src/sim/creatures/perception.js';
import { selectPredatorTarget } from '../src/sim/creatures/targeting.js';
import { updateCreatureIntent } from '../src/sim/creatures/intent.js';
import { updateCreatureReproduction, selectMateTarget } from '../src/sim/creatures/reproduction.js';
import { createLifeStageState } from '../src/sim/creatures/life-stages.js';
import { updateCreatureChase } from '../src/sim/creatures/chase.js';
import { updateCreatureAlertness } from '../src/sim/creatures/alertness.js';
import { selectFoodChoice } from '../src/sim/creatures/food.js';
import { updateCreatureHerding } from '../src/sim/creatures/herding.js';
import {
  updateBehaviorIntegration,
  behaviorSpeedMultiplier
} from '../src/sim/creatures/behavior-integration.js';
import { spawnCarcass } from '../src/sim/plants/carcasses.js';
import { mergeSimConfig } from '../src/sim/utils/config.js';

const animal = (id, sex = 'female', x = 5) => ({
  id,
  sex,
  species: 'circle',
  position: { x, y: 5 },
  ageTicks: 100,
  genome: { speed: sex === 'male' ? 1 : 0 },
  meters: { energy: 1, water: 1, stamina: 1, hp: 1 },
  reproduction: { cooldownTicks: 0 },
  intent: { type: 'wander' }
});
const reproductionConfig = {
  ticksPerSecond: 1,
  creatureReproductionMinAge: 0,
  creatureConceptionChance: 1,
  creatureGestationTime: 3,
  creatureReproductionRange: 3,
  creatureReproductionCooldown: 1,
  creatureReproductionEnergyCost: 0,
  creatureReproductionWaterCost: 0,
  creatureReproductionStaminaCost: 0,
  creatureGenomeInheritanceMixChance: 0,
  creatureGenomeMutationRate: 0
};
const snapshot = (sim) =>
  JSON.stringify({
    creatures: sim.state.creatures,
    world: {
      cells: sim.state.world.cells,
      grass: sim.state.world.grass,
      bushes: sim.state.world.bushes,
      carcasses: sim.state.world.carcasses,
      anchors: sim.state.world.herdAnchors,
      water: sim.state.world.herdWaterTargets
    },
    summary: sim.getSummary()
  });

describe('repository audit: simulation isolation', () => {
  it.each([true, false])(
    'replays independent and interleaved worlds (simple mode %s)',
    (simple) => {
      const config = {
        seed: 73,
        worldWidth: 35,
        worldHeight: 35,
        creatureCount: 20,
        creatureHerdingSimpleMode: simple
      };
      const baseline = createSim(config);
      for (let i = 0; i < 160; i++) baseline.tick();
      const expected = snapshot(baseline);
      const sim = createSim(config),
        other = createSim({ ...config, seed: 4 });
      for (let i = 0; i < 160; i++) {
        sim.tick();
        other.tick();
      }
      expect(snapshot(sim)).toBe(expected);
      sim.setSeed(73);
      for (let i = 0; i < 160; i++) sim.tick();
      expect(snapshot(sim)).toBe(expected);
    }
  );

  it('never calls unseeded randomness in the default tick', () => {
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('unseeded');
    });
    try {
      const sim = createSim({ worldWidth: 20, worldHeight: 20 });
      for (let i = 0; i < 50; i++) sim.tick();
    } finally {
      random.mockRestore();
    }
  });

  it('does not use the previous simulation global index for a standalone targeting call', () => {
    const predator = { ...animal(1), species: 'triangle', position: { x: 5, y: 5 } };
    const stale = animal(20);
    rebuildSpatialIndex([stale]);
    const current = animal(30);
    expect(
      selectPredatorTarget({
        predator,
        creatures: [predator, current],
        config: { creatureTargetingRange: 5 }
      }).target
    ).toBe(current);
  });

  it('can move an indexed creature across a bucket without leaving a duplicate', () => {
    const c = animal(1),
      index = createSpatialIndex({ cellSize: 0 });
    index.add(c);
    c.position.x = 40;
    index.add(c);
    expect(index.queryNearby(40, 5, 100)).toHaveLength(1);
    expect(index.findNearest(40, 5, 0)?.creature).toBe(c);
    expect(index.queryNearby(0, 0, Infinity)).toEqual([]);
  });
});

describe('repository audit: perception and behavior', () => {
  it('refreshes depleted food without requiring the creature to leave its tile', () => {
    const world = createWorldGrid({ width: 12, height: 12 }),
      c = animal(1);
    world.setGrassAt(5, 5, 1);
    const config = { creaturePerceptionRange: 5 };
    updateCreaturePerception({ creatures: [c], config, world });
    expect(c.perception.foodCell).toEqual({ x: 5, y: 5 });
    world.setGrassAt(5, 5, 0);
    world.setGrassAt(6, 5, 1);
    updateCreaturePerception({ creatures: [c], config, world });
    expect(c.perception.foodCell).toEqual({ x: 6, y: 5 });
    expect(c.perception.changed).toBe(true);
    c.traits = { perceptionRange: 0 };
    updateCreaturePerception({ creatures: [c], config, world });
    expect(c.perception.foodCell).toBeNull();
  });

  it('chooses the nearest cell even when a diagonal appears first in a ring', () => {
    const world = createWorldGrid({ width: 12, height: 12 }),
      c = animal(1);
    world.setGrassAt(4, 4, 1);
    world.setGrassAt(5, 4, 1);
    updateCreaturePerception({ creatures: [c], world, config: { creaturePerceptionRange: 5 } });
    expect(c.perception.foodCell).toEqual({ x: 5, y: 4 });
  });

  it('does not indefinitely postpone a reaction while perception keeps changing', () => {
    const c = {
      ...animal(1),
      perception: { changed: true },
      traits: { reactionDelay: 1, alertness: 0 }
    };
    for (let i = 0; i < 3; i++)
      updateCreatureAlertness({ creatures: [c], config: { ticksPerSecond: 2 } });
    expect(c.alertness.canReact).toBe(true);
  });

  it('does not select a zero-quantity meal with omitted minimums', () => {
    expect(
      selectFoodChoice({ species: 'circle', availability: { grass: 0, berries: 0 } })
    ).toBeNull();
  });

  it('feeds on meat before starting another hunt', () => {
    const world = createWorldGrid({ width: 12, height: 12 });
    const predator = { ...animal(1), species: 'triangle', priority: 'hunger' };
    predator.meters.energy = 0.2;
    spawnCarcass({ world, x: 5, y: 5, meat: 1 });
    const prey = animal(2, 'female', 6);
    updateCreatureIntent({
      creatures: [predator, prey],
      world,
      rng: createRng(1),
      config: { creatureTargetingRange: 10 },
      tick: 1
    });
    expect(predator.intent).toMatchObject({ type: 'eat', foodType: 'meat' });
    expect(predator.chase?.targetId ?? null).toBeNull();
  });

  it('abandons a chase when survival intent changes and excludes dead prey', () => {
    const hunter = {
      ...animal(1),
      species: 'triangle',
      intent: { type: 'drink' },
      chase: { targetId: 2, restTicks: 0 }
    };
    const prey = animal(2);
    updateCreatureChase({ creatures: [hunter, prey], config: {}, tick: 1 });
    expect(hunter.chase.lastOutcome).toBe('abandoned');
    prey.meters.hp = 0;
    expect(
      selectPredatorTarget({
        predator: hunter,
        creatures: [prey],
        config: { creatureTargetingRange: 10 }
      })
    ).toBeNull();
  });

  it('clears steering when herding is disabled', () => {
    const c = { ...animal(1), herding: { isThreatened: true, targetOffset: { x: 1, y: 0 } } };
    updateCreatureHerding({ creatures: [c], config: { creatureHerdingEnabled: false } });
    expect(c.herding.isThreatened).toBe(false);
    expect(c.herding.targetOffset).toBeNull();
  });

  it('connects pause phases to movement without blocking urgent needs', () => {
    const c = animal(1),
      config = {
        ticksPerSecond: 1,
        creatureBehaviorRelaxedPauseProbability: 1,
        creatureBehaviorEnvironmentPauseEnabled: false
      };
    updateBehaviorIntegration({
      creatures: [c],
      world: createWorldGrid(),
      config,
      rng: createRng(1),
      tick: 1
    });
    expect(c.behaviorState.phase).toBe('paused');
    expect(behaviorSpeedMultiplier(c, config)).toBe(0);
    c.intent = { type: 'seek' };
    expect(behaviorSpeedMultiplier(c, config)).toBe(1);
    expect(behaviorSpeedMultiplier(c, { creatureBehaviorStateEnabled: false })).toBe(1);
  });
});

describe('repository audit: lifecycle and genetics', () => {
  it('initializes the female before a male earlier in the array chooses her', () => {
    const creatures = [animal(0, 'male'), animal(1)],
      world = createWorldGrid({ width: 20, height: 20 });
    updateCreatureReproduction({ creatures, world, rng: createRng(1), config: reproductionConfig });
    expect(creatures[1].reproduction.pregnancy.isPregnant).toBe(true);
  });

  it('preserves paternal genes after death and gives birth beside the mother', () => {
    const father = animal(0, 'male'),
      mother = animal(1),
      creatures = [father, mother];
    const world = createWorldGrid({ width: 100, height: 100 }),
      rng = createRng(1);
    updateCreatureReproduction({ creatures, world, rng, config: reproductionConfig });
    mother.reproduction.cooldownTicks = 100;
    father.position = { x: 90, y: 90 };
    father.genome.speed = 0;
    creatures.shift();
    for (let i = 0; i < 3; i++)
      updateCreatureReproduction({ creatures, world, rng, config: reproductionConfig });
    const baby = creatures.find((c) => c.ageTicks === 0);
    expect(baby).toBeDefined();
    expect(baby.genome.speed).toBe(0.5);
    expect(
      Math.hypot(baby.position.x - mother.position.x, baby.position.y - mother.position.y)
    ).toBeLessThan(1);
  });

  it('does not reuse the ID of a previously removed creature', () => {
    const creatures = [animal(0, 'male'), animal(1)],
      world = createWorldGrid({ width: 20, height: 20 });
    world.nextCreatureId = 90;
    updateCreatureReproduction({
      creatures,
      world,
      rng: createRng(1),
      config: { ...reproductionConfig, creaturePregnancyEnabled: false }
    });
    expect(creatures[2].id).toBe(90);
    expect(world.nextCreatureId).toBe(91);
  });

  it('does not reproduce with itself when sex is disabled or with dead partners', () => {
    const c = animal(1);
    const params = {
      creatures: [c],
      source: c,
      maxDistanceSq: 100,
      baseEnergy: 1,
      baseWater: 1,
      minEnergyRatio: 0,
      minWaterRatio: 0,
      minAgeTicks: 0,
      sexEnabled: false
    };
    expect(selectMateTarget(params)).toBeNull();
    const dead = animal(2);
    dead.meters.hp = 0;
    expect(selectMateTarget({ ...params, creatures: [c, dead] })).toBeNull();
  });

  it('converts fallback stage ages to ticks for empty custom stages', () => {
    expect(createLifeStageState(200, { ticksPerSecond: 60, creatureLifeStages: [] }).id).toBe(
      'juvenile'
    );
  });

  it('blocks prototype pollution through nested config overrides', () => {
    const result = mergeSimConfig(
      {},
      JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}')
    );
    expect({}.polluted).toBeUndefined();
    expect(result.polluted).toBeUndefined();
  });
});

describe('repository audit: predator rest and initial visibility', () => {
  it('does not let resting predators graze continuously above the hunting threshold', () => {
    const c = { ...animal(1), species: 'triangle', priority: 'hunger' };
    c.meters.energy = 0.6;
    c.predatorState = { isResting: true };
    const world = createWorldGrid({ width: 12, height: 12, defaultGrass: 1 });
    updateCreatureIntent({
      creatures: [c],
      world,
      rng: createRng(1),
      tick: 1,
      config: { creaturePredatorRestThreshold: 0.75, creaturePredatorHuntThreshold: 0.5 }
    });
    expect(c.intent.type).toBe('seek');
    expect(c.intent.foodType).toBeNull();
    c.meters.energy = 0.3;
    updateCreatureIntent({
      creatures: [c],
      world,
      rng: createRng(1),
      tick: 2,
      config: { creaturePredatorRestThreshold: 0.75, creaturePredatorHuntThreshold: 0.5 }
    });
    expect(c.intent).toMatchObject({ type: 'eat', foodType: 'grass' });
  });
  it('populates resources and metrics at tick zero without growing them', () => {
    const sim = createSim({
      worldWidth: 20,
      worldHeight: 20,
      bushInitialHealth: 0.5,
      bushInitialBerries: 2
    });
    expect(sim.state.tick).toBe(0);
    expect(sim.getSummary().bushCount).toBeGreaterThan(0);
    expect(sim.getSummary().grassTotal).toBeGreaterThan(0);
    expect(sim.state.world.bushes[0]).toMatchObject({ health: 0.5, berries: 2 });
    sim.setSeed(sim.getSeed());
    expect(sim.state.world.nextCreatureId).toBe(sim.state.creatures.length);
  });
});

describe('repository audit: behavior transitions', () => {
  it('leaves the alert state after its lock expires even while the threat stays visible', async () => {
    const { updateCreatureBehaviorState } = await import('../src/sim/creatures/behavior-state.js');
    const c = {
      ...animal(1),
      herding: {
        isThreatened: true,
        nearbyThreats: 1,
        nearestThreatDistance: 1,
        threatDirection: { x: 1, y: 0 }
      }
    };
    const config = {
      ticksPerSecond: 1,
      creatureBehaviorAlertMinSeconds: 1,
      creatureBehaviorAlertMaxSeconds: 1
    };
    for (let tick = 1; tick <= 4; tick++)
      updateCreatureBehaviorState({
        creatures: [c],
        config,
        rng: createRng(1),
        world: createWorldGrid(),
        tick
      });
    expect(c.behaviorState.state).toBe('fleeing');
    expect(c.behaviorState.ticksInState).toBeLessThanOrEqual(3);
  });
  it('does not waste sprint stamina while spotting or stalking', async () => {
    const { updateCreatureSprintDecision } = await import('../src/sim/creatures/metabolism.js');
    const c = {
      ...animal(1),
      intent: { type: 'hunt' },
      behaviorState: { state: 'hunting', phase: 'stalking' },
      motion: { isSprinting: true }
    };
    updateCreatureSprintDecision({ creatures: [c], config: {} });
    expect(c.motion.isSprinting).toBe(false);
    c.behaviorState.phase = 'charging';
    updateCreatureSprintDecision({ creatures: [c], config: {} });
    expect(c.motion.isSprinting).toBe(true);
  });
  it('fills simple-herding state when switching from the complex system', () => {
    const c = { ...animal(1), herding: { herdSize: 1, targetOffset: null } },
      mate = animal(2, 'male', 6);
    updateCreatureHerding({
      creatures: [c, mate],
      config: { creatureHerdingSimpleMode: true },
      rng: createRng(1)
    });
    expect(Number.isFinite(c.herding.leadershipScore)).toBe(true);
    expect(Number.isFinite(c.herding.threatDecayTicks)).toBe(true);
  });
});
