import { recordLifeEvent } from '../src/sim/life-story.js';
import { describe, it, expect } from 'vitest';
import { updateDangerMemories, rememberedRouteRisk } from '../src/sim/creatures/experience.js';
import { updateLocomotionGoals } from '../src/sim/creatures/locomotion.js';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { observeLifeStories, rememberDeath } from '../src/sim/life-story.js';
import { applyCreatureDeaths } from '../src/sim/creatures/death.js';
import { createSim } from '../src/sim/sim.js';
import { validateConfigValue } from '../src/ui/config-validation.js';

const animal = (id = 0) => ({
  id,
  position: { x: 20, y: 20 },
  meters: { hp: 1, energy: 1, water: 1 },
  intent: { type: 'wander' },
  motion: { heading: 0 },
  lineage: { parents: [] }
});
const danger = (c) => {
  c.herding = { isThreatened: true, nearbyThreats: 1, threatPosition: { x: 25, y: 20 } };
};

describe('lived experience', () => {
  it('learns copied personal danger, never social-only warnings, and expires at configured seconds', () => {
    const a = animal(),
      b = animal(1);
    danger(a);
    danger(b);
    b.herding.nearbyThreats = 0;
    const config = { ticksPerSecond: 10, creatureDangerMemorySeconds: 2 };
    updateDangerMemories({ creatures: [a, b], config });
    expect(a.experience.dangerSites).toHaveLength(1);
    expect(b.experience.dangerSites).toHaveLength(0);
    a.herding.threatPosition.x = 99;
    expect(a.experience.dangerSites[0].x).toBe(25);
    a.herding.isThreatened = false;
    for (let i = 0; i < 21; i++) updateDangerMemories({ creatures: [a], config });
    expect(a.experience.dangerSites).toHaveLength(0);
  });
  it('bounds sites, clears disabled memory and validates the editor setting', () => {
    const c = animal();
    danger(c);
    for (let i = 0; i < 12; i++) {
      c.herding.threatPosition.x = i * 10;
      updateDangerMemories({ creatures: [c], config: {} });
    }
    expect(c.experience.dangerSites).toHaveLength(3);
    updateDangerMemories({ creatures: [c], config: { creatureDangerMemorySeconds: 0 } });
    expect(c.experience.dangerSites).toEqual([]);
    expect(validateConfigValue('creatureDangerMemorySeconds', -1).ok).toBe(false);
    expect(validateConfigValue('creatureDangerMemorySeconds', 45).ok).toBe(true);
  });
  it('scores the whole route, fades continuously and permits departure from danger', () => {
    const c = animal();
    c.experience = { dangerSites: [{ x: 25, y: 20, remaining: 45 }] };
    const across = rememberedRouteRisk(c, { x: 40, y: 20 }, {});
    expect(across).toBeGreaterThan(0);
    expect(rememberedRouteRisk(c, { x: 10, y: 20 }, {})).toBeLessThan(across);
    c.experience.dangerSites[0].remaining = 22.5;
    expect(rememberedRouteRisk(c, { x: 40, y: 20 }, {})).toBeCloseTo(across / 2);
    expect(rememberedRouteRisk(c, { x: 40, y: 20 }, { creatureDangerMemorySeconds: 0 })).toBe(0);
  });
  it('never discounts a route that approaches or crosses the remembered site', () => {
    const c = animal();
    c.position = { x: 0, y: 0 };
    c.experience = { dangerSites: [{ x: 1, y: 0, remaining: 45 }] };
    const crossing = rememberedRouteRisk(c, { x: 18, y: 0 }, {});
    const away = rememberedRouteRisk(c, { x: -6, y: 0 }, {});
    expect(crossing).toBe(1);
    expect(away).toBeLessThan(crossing);
    expect(rememberedRouteRisk(c, { x: 1, y: 18 }, {})).toBeGreaterThan(away);
    // Tangential travel does not get closer, and starting exactly on a site
    // must still allow departure in any direction.
    expect(rememberedRouteRisk(c, { x: 0, y: 18 }, {})).toBeLessThan(crossing);
    c.position.x = 1;
    expect(rememberedRouteRisk(c, { x: 18, y: 0 }, {})).toBeLessThan(1);
  });
  it('evicts the least recently observed site after reinforcement', () => {
    const c = animal();
    danger(c);
    const observe = (x) => {
      c.herding.threatPosition = { x, y: 20 };
      updateDangerMemories({ creatures: [c], config: {} });
    };
    [0, 10, 20, 0, 30].forEach(observe);
    expect(c.experience.dangerSites.map((s) => s.x)).toEqual([20, 0, 30]);
    expect(c.experience.dangerSites[1].remaining).toBeGreaterThan(
      c.experience.dangerSites[0].remaining
    );
  });
  it('changes actual roaming choice but leaves needs and social reunion authoritative', () => {
    const world = createWorldGrid({ width: 80, height: 80, defaultTerrain: 'plains' });
    const a = animal(),
      b = animal();
    b.experience = { dangerSites: [{ x: 27, y: 20, remaining: 45 }] };
    const run = (c) => {
      const draws = [0.5, 0.5, 0, 0.5, 0.5];
      let i = 0;
      updateLocomotionGoals({
        creatures: [c],
        world,
        config: {},
        rng: { nextFloat: () => draws[i++] ?? 0.5 }
      });
    };
    run(a);
    run(b);
    expect(a.locomotion.target.y).toBe(20);
    expect(b.locomotion.target.y).not.toBe(20);
    expect(b.locomotion.reason).toBe('skirt remembered danger');
    expect(rememberedRouteRisk(b, b.locomotion.target, {})).toBeLessThan(
      rememberedRouteRisk(b, a.locomotion.target, {})
    );
    b.intent = { type: 'drink', target: { x: 27, y: 20 } };
    run(b);
    expect(b.intent.target).toEqual({ x: 27, y: 20 });
    b.intent.type = 'wander';
    b.locomotion.remaining = 0;
    b.herding = { rejoinTarget: { x: 27, y: 20 } };
    run(b);
    expect(b.locomotion.reason).toBe('rejoin companions');
  });
  it('accepts a reachable route even when every candidate carries remembered risk', () => {
    const c = animal();
    c.experience = { dangerSites: [{ x: 20, y: 20, remaining: 45 }] };
    const world = createWorldGrid({ width: 80, height: 80, defaultTerrain: 'plains' });
    updateLocomotionGoals({ creatures: [c], world, config: {}, rng: { nextFloat: () => 0.5 } });
    expect(c.locomotion.target).not.toBeNull();
    expect(c.intent.target.x).toBeGreaterThan(c.position.x);
    expect(rememberedRouteRisk(c, c.intent.target, {})).toBeGreaterThan(0);
  });
  it('bounds event history and preserves event times across TPS edits', () => {
    const c = animal();
    const state = { creatures: [c], world: {}, elapsedSeconds: 2.5 };
    observeLifeStories(state);
    for (let i = 0; i < 30; i++) recordLifeEvent(c.lifeStory, i + 3, 'Observed milestone');
    expect(c.lifeStory.events).toHaveLength(12);
    expect(c.lifeStory.events[0].seconds).toBe(21);
    const sim = createSim({
      seed: 1,
      worldWidth: 20,
      worldHeight: 20,
      creatureCount: 2,
      ticksPerSecond: 30
    });
    for (let i = 0; i < 30; i++) sim.tick();
    sim.config.ticksPerSecond = 60;
    for (let i = 0; i < 60; i++) sim.tick();
    expect(sim.state.elapsedSeconds).toBeCloseTo(2);
    expect(sim.state.creatures[0].lifeStory.events[0].seconds).toBe(0);
  });
  it('records births, flights, exact deaths and posthumous offspring without retaining actors', () => {
    const parent = animal();
    const state = { creatures: [parent], world: {}, elapsedSeconds: 0 };
    observeLifeStories(state);
    danger(parent);
    state.elapsedSeconds = 1;
    observeLifeStories(state);
    observeLifeStories(state);
    expect(parent.lifeStory.flights).toBe(1);
    parent.meters.hp = 0;
    parent.deathCause = 'predation';
    parent.ageTicks = 100;
    applyCreatureDeaths({
      creatures: state.creatures,
      config: { creatureMaxAge: 1, ticksPerSecond: 60 },
      onDeath: (c, cause) => rememberDeath(state, c, cause)
    });
    expect(state.creatures).toHaveLength(0);
    expect(state.world.memorials[0].deathCause).toBe('predation');
    const child = animal(1);
    child.lineage.parents = [0, null];
    state.creatures.push(child);
    observeLifeStories(state);
    observeLifeStories(state);
    expect(state.world.memorials[0].lifeStory.children).toBe(1);
    expect(parent.lifeStory.children).toBe(0);
    expect(child.experience).toBeUndefined();
    for (let i = 2; i < 150; i++) rememberDeath(state, { ...child, id: i }, 'age');
    expect(state.world.memorials).toHaveLength(128);
  });
  it('replays, isolates worlds, resets stories, and observation consumes no ecological state', () => {
    const config = { seed: 42, worldWidth: 40, worldHeight: 40, creatureCount: 12 };
    const a = createSim(config),
      b = createSim(config);
    for (let i = 0; i < 120; i++) {
      a.tick();
      b.tick();
      // Arbitrary extra observer reads do not change simulation outcomes.
      JSON.stringify(b.state.world.memorials);
      observeLifeStories(b.state);
    }
    expect(a.state.creatures).toEqual(b.state.creatures);
    expect(a.state.lastRoll).toBe(b.state.lastRoll);
    expect(a.state.world.memorials).not.toBe(b.state.world.memorials);
    a.setSeed(42);
    expect(a.state.elapsedSeconds).toBe(0);
    expect(a.state.world.memorials).toEqual([]);
    expect(a.state.creatures.every((c) => c.lifeStory.events.length === 1)).toBe(true);
  });
});
