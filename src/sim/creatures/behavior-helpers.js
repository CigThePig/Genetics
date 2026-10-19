import { SPECIES } from '../species.js';

export const BEHAVIOR_STATES = {
  RELAXED: 'relaxed',
  ALERT: 'alert',
  TRAVELING: 'traveling',
  FORAGING: 'foraging',
  FLEEING: 'fleeing',
  HUNTING: 'hunting',
  RESTING: 'resting',
  FEEDING: 'feeding'
};

export const RELAXED_PHASES = {
  MOVING: 'moving',
  PAUSED: 'paused',
  ADJUSTING: 'adjusting'
};

export const HUNTING_PHASES = {
  SPOTTING: 'spotting',
  STALKING: 'stalking',
  CHARGING: 'charging',
  COOLDOWN: 'cooldown'
};

const PREDATOR_SPECIES = new Set([SPECIES.TRIANGLE, SPECIES.OCTAGON]);

export const isPredator = (species) => PREDATOR_SPECIES.has(species);

const resolveTicksPerSecond = (config) =>
  Number.isFinite(config?.ticksPerSecond) ? config.ticksPerSecond : 60;

export const resolveStateDurations = (config) => {
  const tps = resolveTicksPerSecond(config);
  return {
    // RELAXED state
    relaxedMinSeconds: Number.isFinite(config?.creatureBehaviorRelaxedMinSeconds)
      ? config.creatureBehaviorRelaxedMinSeconds
      : 1.0,
    relaxedPauseMinSeconds: Number.isFinite(config?.creatureBehaviorRelaxedPauseMinSeconds)
      ? config.creatureBehaviorRelaxedPauseMinSeconds
      : 1.0,
    relaxedPauseMaxSeconds: Number.isFinite(config?.creatureBehaviorRelaxedPauseMaxSeconds)
      ? config.creatureBehaviorRelaxedPauseMaxSeconds
      : 4.0,
    relaxedMoveMinSeconds: Number.isFinite(config?.creatureBehaviorRelaxedMoveMinSeconds)
      ? config.creatureBehaviorRelaxedMoveMinSeconds
      : 3.0,
    relaxedMoveMaxSeconds: Number.isFinite(config?.creatureBehaviorRelaxedMoveMaxSeconds)
      ? config.creatureBehaviorRelaxedMoveMaxSeconds
      : 8.0,
    relaxedPauseProbability: Number.isFinite(config?.creatureBehaviorRelaxedPauseProbability)
      ? config.creatureBehaviorRelaxedPauseProbability
      : 0.4,
    relaxedGrazePauseRatio: Number.isFinite(config?.creatureBehaviorRelaxedGrazePauseRatio)
      ? config.creatureBehaviorRelaxedGrazePauseRatio
      : 0.65,

    // ALERT state
    alertMinSeconds: Number.isFinite(config?.creatureBehaviorAlertMinSeconds)
      ? config.creatureBehaviorAlertMinSeconds
      : 0.5,
    alertMaxSeconds: Number.isFinite(config?.creatureBehaviorAlertMaxSeconds)
      ? config.creatureBehaviorAlertMaxSeconds
      : 1.5,
    alertToFleeThreshold: Number.isFinite(config?.creatureBehaviorAlertToFleeThreshold)
      ? config.creatureBehaviorAlertToFleeThreshold
      : 8,

    // TRAVELING state
    travelingMinSeconds: Number.isFinite(config?.creatureBehaviorTravelingMinSeconds)
      ? config.creatureBehaviorTravelingMinSeconds
      : 2.0,

    // FORAGING state
    foragingMinSeconds: Number.isFinite(config?.creatureBehaviorForagingMinSeconds)
      ? config.creatureBehaviorForagingMinSeconds
      : 1.0,

    // FLEEING state
    fleeingMinSeconds: Number.isFinite(config?.creatureBehaviorFleeingMinSeconds)
      ? config.creatureBehaviorFleeingMinSeconds
      : 0.5,

    // HUNTING state (predators only)
    huntSpottingSeconds: Number.isFinite(config?.creatureBehaviorHuntSpottingSeconds)
      ? config.creatureBehaviorHuntSpottingSeconds
      : 0.7,
    huntStalkingMinSeconds: Number.isFinite(config?.creatureBehaviorHuntStalkingMinSeconds)
      ? config.creatureBehaviorHuntStalkingMinSeconds
      : 2.0,
    huntStalkingMaxSeconds: Number.isFinite(config?.creatureBehaviorHuntStalkingMaxSeconds)
      ? config.creatureBehaviorHuntStalkingMaxSeconds
      : 5.0,
    huntCooldownSeconds: Number.isFinite(config?.creatureBehaviorHuntCooldownSeconds)
      ? config.creatureBehaviorHuntCooldownSeconds
      : 1.5,
    huntPounceRange: Number.isFinite(config?.creatureBehaviorHuntPounceRange)
      ? config.creatureBehaviorHuntPounceRange
      : 3.5,
    huntStalkSpeed: Number.isFinite(config?.creatureBehaviorHuntStalkSpeed)
      ? config.creatureBehaviorHuntStalkSpeed
      : 0.35,

    // RESTING state
    restingMinSeconds: Number.isFinite(config?.creatureBehaviorRestingMinSeconds)
      ? config.creatureBehaviorRestingMinSeconds
      : 2.0,

    // FEEDING state (predators only)
    feedingMinSeconds: Number.isFinite(config?.creatureBehaviorFeedingMinSeconds)
      ? config.creatureBehaviorFeedingMinSeconds
      : 3.0,
    feedingMaxSeconds: Number.isFinite(config?.creatureBehaviorFeedingMaxSeconds)
      ? config.creatureBehaviorFeedingMaxSeconds
      : 8.0,
    satiationThreshold: Number.isFinite(config?.creatureBehaviorSatiationThreshold)
      ? config.creatureBehaviorSatiationThreshold
      : 0.8,

    // Environment awareness
    environmentPauseSeconds: Number.isFinite(config?.creatureBehaviorEnvironmentPauseSeconds)
      ? config.creatureBehaviorEnvironmentPauseSeconds
      : 0.5,
    environmentPauseProbability: Number.isFinite(
      config?.creatureBehaviorEnvironmentPauseProbability
    )
      ? config.creatureBehaviorEnvironmentPauseProbability
      : 0.3,

    tps
  };
};

export const secondsToTicks = (seconds, tps) => Math.max(1, Math.floor(seconds * tps));

export const ensureBehaviorState = (creature) => {
  if (!creature.behaviorState) {
    creature.behaviorState = {
      state: BEHAVIOR_STATES.RELAXED,
      phase: RELAXED_PHASES.MOVING,
      ticksInState: 0,
      ticksInPhase: 0,
      lockedUntilTick: 0,
      phaseLockedUntilTick: 0,
      alertDirection: null,
      assessedThreatDistance: null,
      targetPosition: null,
      lastTerrainType: null,
      environmentPauseTicks: 0
    };
  }
  return creature.behaviorState;
};

export const transitionTo = (creature, newState, tick, minDurationTicks, phase = null) => {
  const bs = creature.behaviorState;
  bs.state = newState;
  bs.ticksInState = 0;
  bs.lockedUntilTick = tick + minDurationTicks;

  bs.phase = phase;
  bs.ticksInPhase = 0;
  bs.phaseLockedUntilTick = tick + minDurationTicks;
};

export const transitionPhase = (creature, newPhase, tick, minDurationTicks) => {
  const bs = creature.behaviorState;
  bs.phase = newPhase;
  bs.ticksInPhase = 0;
  bs.phaseLockedUntilTick = tick + minDurationTicks;
};

export const canTransition = (creature, tick) => {
  return tick >= (creature.behaviorState?.lockedUntilTick ?? 0);
};

export const canTransitionPhase = (creature, tick) => {
  return tick >= (creature.behaviorState?.phaseLockedUntilTick ?? 0);
};

export const behaviorMeterRatio = (creature, config, meter) => {
  const baseKey = meter === 'water' ? 'creatureBaseWater' : 'creatureBaseEnergy';
  const configuredBase = config?.[baseKey];
  const base = Number.isFinite(configuredBase) && configuredBase > 0 ? configuredBase : 1;
  const value = creature?.meters?.[meter];
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value / base)) : 1;
};

// Catching is a charging action; missing/uninitialized behavior must not skip the wind-up.
export const canCatchPrey = (creature, config) =>
  config?.creatureBehaviorStateEnabled === false ||
  (creature?.behaviorState?.state === BEHAVIOR_STATES.HUNTING &&
    creature.behaviorState.phase === HUNTING_PHASES.CHARGING);
