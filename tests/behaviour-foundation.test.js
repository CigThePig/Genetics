import { describe, it, expect } from 'vitest';
import { createSim } from '../src/sim/sim.js';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { createRng } from '../src/sim/rng.js';
import { simConfig } from '../src/sim/config.js';
import { localGroups } from '../src/sim/creatures/local-groups.js';
import { navigationTarget, clearLandLine } from '../src/sim/creatures/navigation.js';
import { updateCreatureMovement } from '../src/sim/creatures/movement.js';
import { updateLocomotionGoals } from '../src/sim/creatures/locomotion.js';
import {
  updateCreatureHerdingSimple,
  escapeDirection
} from '../src/sim/creatures/herding-simple.js';
import { updateCreatureHerding } from '../src/sim/creatures/herding.js';
import { updateCreaturePerception } from '../src/sim/creatures/perception.js';
import { updateCreaturePack } from '../src/sim/creatures/pack.js';
import { getFeedingPreferences } from '../src/sim/creatures/food.js';
import { updateCreatureIntent } from '../src/sim/creatures/intent.js';
import { updateCreatureSprintDecision } from '../src/sim/creatures/metabolism.js';
import { createScenario, scenarioStep } from '../scripts/behaviour-scenarios.mjs';
const actor = (id, x, y = 10, species = 'circle') => ({
  id,
  species,
  position: { x, y },
  meters: { energy: 0.6, water: 1, stamina: 1, hp: 1 },
  traits: { speed: 10, perceptionRange: 5 },
  intent: { type: 'wander' },
  motion: { heading: 0, velocity: { x: 0, y: 0 }, currentSpeed: 0 }
});
const world = () => createWorldGrid({ width: 80, height: 80, defaultGrass: 0.8 });
const config = {
  ...simConfig,
  creatureMateSeekingEnabled: false,
  creatureWaterRendezvousEnabled: false,
  colourCamouflageEnabled: false
};
const options = (creatures, w = world()) => ({ creatures, world: w, config, rng: createRng(42) });
describe('local geographical groups', () => {
  it('does not chain the whole species or distant animals into one pack', () => {
    const cs = [actor(0, 5), actor(1, 8), actor(2, 50), actor(3, 53)].map((c) => ({
      ...c,
      species: 'triangle'
    }));
    const o = options(cs);
    updateCreaturePack(o);
    expect(cs[0].pack.id).toBe(cs[1].pack.id);
    expect(cs[0].pack.id).not.toBe(cs[2].pack.id);
    expect(cs[2].pack.leaderId).toBe(2);
  });
  it('retains groups across acquisition boundary, splits far members and replaces a dead leader', () => {
    const cs = [actor(0, 10), actor(1, 14), actor(2, 17)];
    const run = () => localGroups(cs, { field: 'herding', radius: 8, maxMembers: 4 });
    run();
    const id = cs[1].herding.groupId;
    cs[1].position.x = 19;
    run();
    expect(cs[1].herding.groupId).toBe(id);
    cs[2].position.x = 60;
    run();
    expect(cs[2].herding.groupId).not.toBe(id);
    cs[0].meters.hp = 0;
    run();
    expect(cs[1].herding.leaderId).toBe(1);
  });
  it('bounds membership, handles merging and is independent of input ordering', () => {
    const cs = Array.from({ length: 12 }, (_, i) => actor(i, 10 + i * 0.1));
    const run = (cs) =>
      [...localGroups(cs, { field: 'herding', radius: 10, maxMembers: 4 })].map(([id, m]) => [
        id,
        m.map((c) => c.id)
      ]);
    expect(run(cs)).toEqual(run([...cs].reverse()));
    expect(run(cs).every(([, m]) => m.length <= 4)).toBe(true);
  });
});
describe('persistent goals and movement physics', () => {
  it('preserves individual goals and yields to survival intent without rewriting it', () => {
    const c = actor(0, 30);
    const o = options([c]);
    updateLocomotionGoals(o);
    const goal = { ...c.locomotion.target },
      serial = c.locomotion.serial;
    for (let i = 0; i < 60; i++) {
      c.intent = { type: 'wander' };
      updateLocomotionGoals(o);
      expect(c.intent.target).toEqual(goal);
    }
    expect(c.locomotion.serial).toBe(serial);
    c.intent = { type: 'drink', target: null };
    updateLocomotionGoals(o);
    expect(c.intent).toEqual({ type: 'drink', target: null });
  });
  it('does not generate centre attraction for a comfortably spaced resting group', () => {
    const cs = [actor(0, 20), actor(1, 25), actor(2, 30)];
    updateCreatureHerdingSimple(options(cs));
    expect(cs.every((c) => c.herding.targetOffset === null)).toBe(true);
    expect(cs.every((c) => !c.herding.isMoving)).toBe(true);
  });
  it('routes around a water barrier through its opening and invalidates edited terrain', () => {
    const w = world();
    for (let y = 0; y < 70; y++) w.setTerrainAt(35, y, 'water');
    const p = { x: 30.5, y: 30.5 },
      goal = { x: 40.5, y: 30.5 };
    const route = navigationTarget(w, p, goal);
    expect(route.y).toBeGreaterThan(p.y);
    expect(clearLandLine(w, p, route)).toBe(true);
    const version = w.navigation.version;
    w.setTerrainAt(35, 30, 'plains');
    navigationTarget(w, p, { x: 40.5, y: 31.5 });
    expect(w.navigation.version).not.toBe(version);
  });
  it('turns within physical limits and never enters water or snaps heading at impact', () => {
    const c = actor(0, 34.7, 20.5),
      w = world();
    for (let y = 0; y < 80; y++) w.setTerrainAt(35, y, 'water');
    c.intent = { type: 'seek', target: { x: 40, y: 20 } };
    const o = options([c], w);
    let last = c.motion.heading;
    for (let i = 0; i < 120; i++) {
      updateCreatureMovement(o);
      expect(w.getTerrainAt(Math.floor(c.position.x), Math.floor(c.position.y))).not.toBe('water');
      expect(Math.abs(c.motion.heading - last)).toBeLessThanOrEqual(
        config.creatureMaxTurnRateRadPerSecond / 60 + 0.001
      );
      last = c.motion.heading;
    }
  });
  it('completes a retained land route around a barrier rather than oscillating', () => {
    const c = actor(0, 30.5, 30.5),
      w = world();
    for (let y = 0; y < 40; y++) w.setTerrainAt(35, y, 'water');
    c.intent = { type: 'seek', target: { x: 40.5, y: 30.5 } };
    const o = options([c], w);
    for (let tick = 0; tick < 2400; tick++) updateCreatureMovement(o);
    expect(Math.hypot(c.position.x - 40.5, c.position.y - 30.5)).toBeLessThan(1);
  });

  it('brakes at a destination instead of circling it', () => {
    const c = actor(0, 20, 20);
    c.intent = { type: 'seek', target: { x: 25, y: 20 } };
    const o = options([c]);
    for (let i = 0; i < 600; i++) updateCreatureMovement(o);
    expect(c.position.x).toBeGreaterThan(24);
    expect(c.position.x).toBeLessThan(25.2);
    expect(c.motion.currentSpeed).toBeLessThan(0.1);
  });
  it('conserves sprint stamina while wandering but permits fleeing from feeding', () => {
    const c = actor(0, 20);
    updateCreatureSprintDecision(options([c]));
    expect(c.motion.isSprinting).toBe(false);
    c.intent.type = 'eat';
    c.herding = { isThreatened: true };
    updateCreatureSprintDecision(options([c]));
    expect(c.motion.isSprinting).toBe(true);
  });
});
describe('threat information and escape', () => {
  it('uses previous-tick warnings and cannot sustain an alarm loop after danger leaves', () => {
    const cs = [actor(0, 20), actor(1, 28), actor(2, 36), actor(3, 19, 10, 'triangle')];
    const o = options(cs);
    o.config = {
      ...config,
      creatureSimpleHerdingThreatRange: 3,
      creatureThreatDecaySeconds: 0.2,
      creatureBehaviorAlertToFleeThreshold: 10
    };
    updateCreatureHerdingSimple(o);
    expect(cs[0].herding.isThreatened).toBe(true);
    expect(cs[1].herding.isThreatened).toBe(false);
    updateCreatureHerdingSimple(o);
    expect(cs[1].herding.isThreatened).toBe(true);
    expect(cs[2].herding.isThreatened).toBe(false);
    o.creatures = cs.slice(0, 3);
    for (let i = 0; i < 30; i++) updateCreatureHerdingSimple(o);
    expect(o.creatures.every((c) => !c.herding.isThreatened)).toBe(true);
  });
  it('avoids cancellation between opposing threats and does not align to neighbours', () => {
    const c = actor(0, 30, 30),
      w = world();
    const threats = [{ position: { x: 28, y: 30 } }, { position: { x: 32, y: 30 } }];
    const d = escapeDirection(c, threats, w);
    expect(Math.abs(d.y)).toBeGreaterThan(0.8);
    for (const t of threats)
      expect(
        Math.hypot(c.position.x + d.x * 3 - t.position.x, c.position.y + d.y * 3 - t.position.y)
      ).toBeGreaterThan(2);
  });
  it('chooses traversable escape directions at shorelines', () => {
    const c = actor(0, 30.5, 30.5),
      w = world();
    for (let y = 0; y < 80; y++) w.setTerrainAt(32, y, 'water');
    const d = escapeDirection(c, [{ position: { x: 29, y: 30 } }], w);
    expect(
      clearLandLine(w, c.position, { x: c.position.x + d.x * 3, y: c.position.y + d.y * 3 })
    ).toBe(true);
  });
});
describe('feeding and search integration', () => {
  it('preserves emergency fallback foods without suppressing ordinary hunting', () => {
    const c = actor(0, 20, 20, 'triangle');
    expect(getFeedingPreferences(c, config)).toEqual(['meat']);
    c.meters.energy = 0.2;
    expect(getFeedingPreferences(c, config)).toContain('grass');
    expect(getFeedingPreferences(actor(1, 1), config)).toContain('grass');
  });
  it('selects visible prey before plants and keeps an existing pursuit', () => {
    const hunter = actor(0, 20, 20, 'triangle'),
      prey = actor(1, 23, 20);
    hunter.priority = 'hunger';
    const o = options([hunter, prey]);
    updateCreatureIntent({ ...o, tick: 1 });
    expect(hunter.intent.type).toBe('hunt');
    hunter.meters.energy = 0.9;
    updateCreatureIntent({ ...o, tick: 2 });
    expect(hunter.intent.type).toBe('hunt');
    expect(hunter.chase.targetId).toBe(prey.id);
  });
  it('retains distant search destinations longer than the former short timer', () => {
    const cs = [actor(0, 20, 20, 'triangle'), actor(1, 22, 20, 'triangle')],
      o = options(cs);
    updateCreaturePack(o);
    const target = { ...cs[0].pack.waypoint };
    for (let i = 0; i < 180; i++) {
      cs.forEach((c) => (c.intent = { type: 'wander' }));
      updateCreaturePack(o);
    }
    expect(cs[0].pack.waypoint).toEqual(target);
    expect(
      Math.hypot(cs[1].intent.target.x - target.x, cs[1].intent.target.y - target.y)
    ).toBeLessThanOrEqual(config.creaturePackSpacing * 2);
    expect(cs[1].intent.target).not.toEqual(target);
  });
});
describe('integrated seeded scenarios', () => {
  it.each([1, 42, 1337])('replays pursuit and recovery for seed %s', (seed) => {
    const run = () => {
      const sim = createScenario(createSim, 'pursuit', seed);
      for (let i = 0; i < 900; i++) scenarioStep(sim, 'pursuit');
      return JSON.stringify(sim.state.creatures);
    };
    expect(run()).toBe(run());
  });
  it('returns to normal goals after a threat disappears', () => {
    const sim = createScenario(createSim, 'recovery', 1);
    for (let i = 0; i < 1200; i++) scenarioStep(sim, 'recovery');
    expect(sim.state.creatures.every((c) => !c.herding?.isThreatened)).toBe(true);
    expect(sim.state.creatures.some((c) => c.locomotion?.target)).toBe(true);
  });
});

describe('PR review regressions', () => {
  it('routes and collides against configured water, including retained-route invalidation', () => {
    const w = world();
    w.waterTerrainType = 'rock';
    for (let y = 0; y < 40; y++) w.setTerrainAt(35, y, 'rock');
    const c = actor(0, 30.5, 30.5);
    c.intent = { type: 'seek', target: { x: 40.5, y: 30.5 } };
    const routeState = {};
    const first = navigationTarget(w, c.position, c.intent.target, routeState);
    expect(clearLandLine(w, c.position, c.intent.target)).toBe(false);
    expect(first.y).toBeGreaterThan(c.position.y);
    const o = options([c], w);
    for (let tick = 0; tick < 2400; tick++) {
      updateCreatureMovement(o);
      expect(w.getTerrainAt(Math.floor(c.position.x), Math.floor(c.position.y))).not.toBe('rock');
    }
    expect(Math.hypot(c.position.x - 40.5, c.position.y - 30.5)).toBeLessThan(1);
    // A water-type change must invalidate both caches, even without terrain edits.
    w.waterTerrainType = 'water';
    for (let y = 40; y < 80; y++) w.setTerrainAt(35, y, 'water');
    navigationTarget(w, { x: 30.5, y: 50.5 }, { x: 40.5, y: 50.5 }, routeState);
    const field = w.navigation;
    w.waterTerrainType = 'rock';
    navigationTarget(w, { x: 30.5, y: 30.5 }, { x: 40.5, y: 30.5 }, routeState);
    expect(w.navigation).not.toBe(field);
    expect(routeState.waterTerrainType).toBe('rock');
  });
  it('reaches diagonal remembered food with minimum perception before invalidating memory', () => {
    const w = createWorldGrid({ width: 80, height: 80 });
    w.setGrassAt(25, 25, 1);
    const c = actor(0, 22.5, 22.5);
    c.traits.perceptionRange = 1;
    c.meters.energy = 0.1;
    c.priority = 'hunger';
    const entry = { type: 'food', foodType: 'grass', x: 25, y: 25, strength: 1, ageTicks: 0 };
    c.memory = { entries: [entry] };
    const o = options([c], w);
    updateCreatureIntent(o);
    expect(c.intent.target).toEqual({ x: 25.5, y: 25.5 });
    for (let tick = 0; tick < 1200 && c.intent.type !== 'eat'; tick++) {
      updateCreaturePerception(o);
      updateCreatureIntent(o);
      updateCreatureMovement(o);
      expect(entry.strength).toBe(1);
    }
    expect(c.intent.type).toBe('eat');
    expect(Math.floor(c.position.x)).toBe(25);
    expect(Math.floor(c.position.y)).toBe(25);
    // Empty memories still lose confidence after the animal actually visits.
    w.setGrassAt(25, 25, 0);
    updateCreaturePerception(o);
    updateCreatureIntent(o);
    expect(entry.strength).toBeLessThan(1);
  });
  it('stops renewing social goals after disabling herding live', () => {
    const leader = actor(0, 20),
      follower = actor(1, 21);
    leader.locomotion = { target: { x: 40, y: 10 } };
    follower.herding = {
      shouldStartMoving: true,
      localLeaderId: 0,
      groupId: 'circle:0',
      leaderId: 0,
      rejoinTarget: { x: 20, y: 10 },
      threatPosition: { x: 19, y: 10 },
      threatHops: 1
    };
    const o = options([leader, follower]);
    o.config = { ...config, creatureHerdingEnabled: false };
    updateCreatureHerding(o);
    expect(follower.herding.shouldStartMoving).toBe(false);
    expect(follower.herding.localLeaderId).toBeNull();
    expect(follower.herding.groupId).toBeNull();
    updateLocomotionGoals(o);
    expect(follower.locomotion.reason).toBe('explore');
    expect(follower.intent.target).not.toEqual(leader.locomotion.target);
  });
  it('removes spacing and local search state when packs are disabled live', () => {
    const cs = [actor(0, 20, 20, 'triangle'), actor(1, 21, 20, 'triangle')];
    const o = options(cs);
    updateCreaturePack(o);
    expect(Math.abs(cs[0].pack.spacing.x)).toBeGreaterThan(0);
    o.config = { ...config, creaturePackEnabled: false };
    updateCreaturePack(o);
    expect(cs.every((c) => !c.pack?.spacing && !c.pack?.groupId && !c.pack?.leaderId)).toBe(true);
    // Movement after disabling is identical to an animal with no prior pack.
    for (const c of cs) c.intent = { type: 'seek', target: { x: c.position.x + 10, y: 20 } };
    const independent = structuredClone(cs[0]);
    independent.pack = null;
    updateCreatureMovement(o);
    updateCreatureMovement(options([independent], o.world));
    expect(cs[0].motion).toEqual(independent.motion);
    o.config = config;
    updateCreaturePack(o);
    expect(cs[0].pack.id).toBe(cs[1].pack.id);
  });
  it.each([
    [4, 40, Math.PI, -1, 0],
    [76, 40, 0, 1, 0],
    [40, 4, -Math.PI / 2, 0, -1],
    [40, 76, Math.PI / 2, 0, 1]
  ])('can flee toward available land near an edge (%s, %s)', (x, y, heading, dx, dy) => {
    const c = actor(0, x, y);
    c.motion.heading = heading;
    c.herding = { isThreatened: true, threatDirection: { x: dx, y: dy } };
    const o = options([c]);
    for (let tick = 0; tick < 10; tick++) updateCreatureMovement(o);
    expect((c.position.x - x) * dx + (c.position.y - y) * dy).toBeGreaterThan(0.1);
  });
  it('retains simultaneous distinct sightings and deduplicates each current member', () => {
    const cs = [
      actor(0, 20, 20, 'triangle'),
      actor(1, 21, 20, 'triangle'),
      actor(2, 22, 20, 'triangle')
    ];
    cs[1].chase = { status: 'pursuing', lastSeenTick: 10, lastKnownPosition: { x: 30, y: 20 } };
    cs[2].chase = { status: 'pursuing', lastSeenTick: 10, lastKnownPosition: { x: 20, y: 35 } };
    const o = options(cs);
    updateCreaturePack(o);
    expect(cs[0].pack.preySightings.map(({ x, y }) => ({ x, y }))).toEqual([
      { x: 30, y: 20 },
      { x: 20, y: 35 }
    ]);
    const strengths = cs[0].pack.preySightings.map((s) => s.strength);
    updateCreaturePack(o);
    expect(cs[0].pack.preySightings.every((s, i) => s.strength < strengths[i])).toBe(true);
    o.creatures = cs.slice(0, 2);
    updateCreaturePack(o);
    expect(Object.keys(cs[0].pack.sharedSightingTicks)).toEqual(['1']);
  });
  it.each([1, 2, 3, 10])('honors regroup minimum %s including the animal itself', (minimum) => {
    const cs = [actor(0, 20), actor(1, 40)];
    const o = options(cs);
    o.config = { ...config, creatureHerdingRegroupMinLocalHerdSize: minimum };
    updateCreatureHerdingSimple(o);
    expect(cs[0].herding.herdSize).toBe(1);
    expect(cs[0].herding.rejoinTarget).toEqual(minimum === 1 ? null : cs[1].position);
  });
});
