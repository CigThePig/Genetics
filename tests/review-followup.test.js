import { describe, expect, it } from 'vitest';
import { simConfig } from '../src/sim/config.js';
import { createRng } from '../src/sim/rng.js';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { updateCreatureChase, startCreatureChase } from '../src/sim/creatures/chase.js';
import { applyCreatureCombat } from '../src/sim/creatures/combat.js';
import { updateBehaviorIntegration } from '../src/sim/creatures/behavior-integration.js';
import {
  startHunting,
  startFeeding,
  updateCreatureBehaviorState
} from '../src/sim/creatures/behavior-state.js';
import { ensureBehaviorState } from '../src/sim/creatures/behavior-helpers.js';
import { selectPredatorTarget } from '../src/sim/creatures/targeting.js';
import { updateCreatureHerding } from '../src/sim/creatures/herding.js';

const animal = (id, species = 'circle', x = 20) => ({
  id,
  species,
  position: { x, y: 20 },
  ageTicks: 0,
  meters: { energy: 1, water: 1, stamina: 1, hp: 1 },
  intent: { type: species === 'triangle' ? 'hunt' : 'wander' },
  traits: {},
  herding: { herdSize: 1, isThreatened: false }
});
const context = (creatures, config = {}) => ({
  creatures,
  config,
  world: createWorldGrid({ width: 100, height: 100 }),
  rng: createRng(10)
});

describe('PR #135: catch phase gate', () => {
  it.each([undefined, 'spotting', 'stalking', 'cooldown'])('cannot catch during %s', (phase) => {
    const hunter = animal(1, 'triangle'),
      prey = animal(2, 'circle', 20.1);
    if (phase) hunter.behaviorState = { state: 'hunting', phase };
    const options = { ...context([hunter, prey]), metrics: {}, tick: 1 };
    startCreatureChase({ creature: hunter, target: prey, ...options });
    updateCreatureChase(options);
    applyCreatureCombat(options);
    expect(prey.meters.hp).toBe(1);
    expect(hunter.chase.targetId).toBe(prey.id);
    expect(options.metrics.chaseSuccesses ?? 0).toBe(0);
    // Combat also independently rejects an out-of-phase caught record.
    hunter.chase = { lastOutcome: 'caught', lastOutcomeTick: 1, lastTargetId: prey.id };
    applyCreatureCombat(options);
    expect(prey.meters.hp).toBe(1);
  });

  it('preserves spotting/stalking locks for prey already inside catch distance', () => {
    const hunter = animal(1, 'triangle'),
      prey = animal(2, 'circle', 20.1);
    const config = {
      ticksPerSecond: 1,
      creatureChaseLoseDistance: 5,
      creatureBehaviorHuntSpottingSeconds: 2,
      creatureBehaviorHuntStalkingMinSeconds: 2,
      creatureBehaviorHuntPounceRange: 2,
      creatureBehaviorEnvironmentPauseEnabled: false
    };
    const options = { ...context([hunter, prey], config), metrics: {} };
    startCreatureChase({ creature: hunter, target: prey, ...options, tick: 0 });
    startHunting(hunter, 0, config);
    for (let tick = 1; tick <= 4; tick++) {
      updateCreatureChase({ ...options, tick });
      applyCreatureCombat({ ...options, tick });
      updateBehaviorIntegration({ ...options, tick });
      expect(prey.meters.hp).toBe(1);
    }
    expect(hunter.behaviorState.phase).toBe('charging');
    updateCreatureChase({ ...options, tick: 5 });
    applyCreatureCombat({ ...options, tick: 5 });
    expect(prey.meters.hp).toBe(0);
    expect(options.metrics.chaseSuccesses).toBe(1);
    expect(options.metrics.killsTotal).toBe(1);
  });

  it('retains direct catches with behavior states explicitly disabled', () => {
    const hunter = animal(1, 'triangle'),
      prey = animal(2, 'circle', 20.1);
    const options = {
      ...context([hunter, prey], { creatureBehaviorStateEnabled: false }),
      metrics: {},
      tick: 1
    };
    startCreatureChase({ creature: hunter, target: prey, ...options });
    updateCreatureChase(options);
    applyCreatureCombat(options);
    expect(prey.meters.hp).toBe(0);
  });
});

describe('PR #135: meter ratios', () => {
  it.each([0.1, 1, 5])('uses equivalent fullness at meter base %s', (base) => {
    const config = {
      ticksPerSecond: 10,
      creatureBaseEnergy: base,
      creatureBaseWater: base,
      creatureBehaviorEnvironmentPauseEnabled: false,
      creatureBehaviorSatiationThreshold: 0.8,
      creatureBehaviorFeedingMinSeconds: 3,
      creatureBehaviorFeedingMaxSeconds: 8
    };
    const hungry = animal(1, 'triangle');
    hungry.meters.energy = base * 0.2;
    startFeeding(hungry, 0, config);
    expect(hungry.behaviorState.lockedUntilTick).toBe(70);
    const satisfied = animal(2, 'triangle');
    satisfied.meters.energy = base * 0.9;
    ensureBehaviorState(satisfied).state = 'feeding';
    updateCreatureBehaviorState({ ...context([satisfied], config), tick: 100 });
    expect(satisfied.behaviorState.state).toBe('resting');
    const resting = animal(3);
    resting.meters.energy = base;
    resting.meters.water = base;
    ensureBehaviorState(resting).state = 'resting';
    updateCreatureBehaviorState({ ...context([resting], config), tick: 100 });
    expect(resting.behaviorState.state).toBe('relaxed');
    resting.meters.energy = base * 0.2;
    resting.behaviorState.state = 'resting';
    resting.behaviorState.lockedUntilTick = 0;
    updateCreatureBehaviorState({ ...context([resting], config), tick: 101 });
    expect(resting.behaviorState.state).toBe('foraging');
    const cooldown = animal(4, 'triangle');
    cooldown.meters.energy = base * 0.2;
    ensureBehaviorState(cooldown).state = 'hunting';
    cooldown.behaviorState.phase = 'cooldown';
    updateCreatureBehaviorState({ ...context([cooldown], config), tick: 100 });
    expect(cooldown.behaviorState.state).toBe('relaxed');
  });
});

describe('PR #135: fallback food web', () => {
  it.each(['triangle', 'octagon'])('matches explicit default preferences for %s', (species) => {
    const predator = animal(1, species);
    for (const [i, preySpecies] of ['square', 'circle', 'triangle', 'octagon'].entries()) {
      const prey = animal(i + 2, preySpecies, 21);
      const partial = { creatureTargetingRange: 5 };
      const implicit = selectPredatorTarget({
        predator,
        creatures: [predator, prey],
        config: partial
      });
      const explicit = selectPredatorTarget({
        predator,
        creatures: [predator, prey],
        config: {
          ...partial,
          creatureTargetingPreferences: simConfig.creatureTargetingPreferences
        }
      });
      expect(implicit).toEqual(explicit);
    }
  });
});

describe('PR #135: alert distance and PR #136: stale regroup', () => {
  it.each([true, false])(
    'records nearest direct threat and honors threshold in herd mode %s',
    (simple) => {
      const member = animal(0),
        predator = animal(1, 'triangle', 29);
      const config = {
        ...simConfig,
        ticksPerSecond: 1,
        creatureHerdingSimpleMode: simple,
        creatureHerdingThreatRange: 12,
        creatureSimpleHerdingThreatRange: 12,
        creatureBehaviorAlertToFleeThreshold: 8,
        creatureBehaviorAlertMinSeconds: 1,
        creatureBehaviorAlertMaxSeconds: 1,
        creatureBehaviorEnvironmentPauseEnabled: false
      };
      const options = context([member, predator], config);
      updateCreatureHerding({ ...options, tick: 1 });
      expect(member.herding.nearestThreatDistance).toBe(9);
      updateCreatureBehaviorState({ ...options, tick: 1 });
      updateCreatureBehaviorState({ ...options, tick: 3 });
      expect(member.behaviorState.state).toBe('relaxed');
      predator.position.x = 27;
      updateCreatureHerding({ ...options, tick: 4 });
      expect(member.herding.nearestThreatDistance).toBe(7);
      updateCreatureBehaviorState({ ...options, tick: 4 });
      updateCreatureBehaviorState({ ...options, tick: 6 });
      expect(member.behaviorState.state).toBe('fleeing');
      updateCreatureHerding({
        ...options,
        config: { ...config, creatureHerdingEnabled: false },
        tick: 5
      });
      expect(member.herding.nearestThreatDistance).toBeNull();
    }
  );

  it('changing the distance setting changes the alert decision', () => {
    const member = animal(1);
    member.herding = { isThreatened: true, nearbyThreats: 1, nearestThreatDistance: 9 };
    ensureBehaviorState(member).state = 'alert';
    updateCreatureBehaviorState({
      ...context([member], { creatureBehaviorAlertToFleeThreshold: 10 }),
      tick: 1
    });
    expect(member.behaviorState.state).toBe('fleeing');
  });

  it.each([true, false])(
    'cannot reuse pre-threat regroup after its target disappears (simple %s)',
    (simple) => {
      const member = animal(0),
        kin = animal(2, 'circle', 50),
        predator = animal(3, 'triangle', 19);
      const config = {
        ...simConfig,
        creatureHerdingSimpleMode: simple,
        creatureHerdingAnchorEnabled: false
      };
      const options = context([member, kin], config);
      updateCreatureHerding({ ...options, tick: 1 });
      expect(member.herding.lastRegroupVector?.x).toBeGreaterThan(0);
      member.ageTicks = 1;
      updateCreatureHerding({ ...options, creatures: [member, kin, predator], tick: 2 });
      expect(member.herding.lastRegroupVector).toBeNull();
      member.ageTicks = 2;
      updateCreatureHerding({ ...options, creatures: [member], tick: 3 });
      expect(member.herding.lastRegroupVector).toBeNull();
    }
  );
});
