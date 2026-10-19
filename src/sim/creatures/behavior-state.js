import { updateHuntingState } from './behavior-hunting.js';
import {
  behaviorMeterRatio,
  BEHAVIOR_STATES,
  RELAXED_PHASES,
  HUNTING_PHASES,
  isPredator,
  resolveStateDurations,
  secondsToTicks,
  ensureBehaviorState,
  transitionTo,
  transitionPhase,
  canTransition,
  canTransitionPhase
} from './behavior-helpers.js';

const updateRelaxedState = (creature, config, rng, tick, durations) => {
  const bs = creature.behaviorState;
  const isGrazing = creature.intent?.type === 'graze';
  const pauseRatio = isGrazing
    ? durations.relaxedGrazePauseRatio
    : durations.relaxedPauseProbability;

  if (!canTransitionPhase(creature, tick)) {
    bs.ticksInPhase++;
    return;
  }

  const currentPhase = bs.phase;

  switch (currentPhase) {
    case RELAXED_PHASES.MOVING: {
      // After moving, possibly pause
      if (rng.nextFloat() < pauseRatio) {
        const pauseDuration =
          durations.relaxedPauseMinSeconds +
          rng.nextFloat() * (durations.relaxedPauseMaxSeconds - durations.relaxedPauseMinSeconds);
        transitionPhase(
          creature,
          RELAXED_PHASES.PAUSED,
          tick,
          secondsToTicks(pauseDuration, durations.tps)
        );
      } else {
        // Continue moving with new duration
        const moveDuration =
          durations.relaxedMoveMinSeconds +
          rng.nextFloat() * (durations.relaxedMoveMaxSeconds - durations.relaxedMoveMinSeconds);
        transitionPhase(
          creature,
          RELAXED_PHASES.MOVING,
          tick,
          secondsToTicks(moveDuration, durations.tps)
        );
      }
      break;
    }

    case RELAXED_PHASES.PAUSED: {
      // Occasionally do micro-adjustments during pause
      if (rng.nextFloat() < 0.15) {
        transitionPhase(
          creature,
          RELAXED_PHASES.ADJUSTING,
          tick,
          secondsToTicks(0.2 + rng.nextFloat() * 0.3, durations.tps)
        );
      } else {
        // Resume moving
        const moveDuration =
          durations.relaxedMoveMinSeconds +
          rng.nextFloat() * (durations.relaxedMoveMaxSeconds - durations.relaxedMoveMinSeconds);
        transitionPhase(
          creature,
          RELAXED_PHASES.MOVING,
          tick,
          secondsToTicks(moveDuration, durations.tps)
        );
      }
      break;
    }

    case RELAXED_PHASES.ADJUSTING: {
      // Return to paused or start moving
      if (rng.nextFloat() < 0.5) {
        const pauseDuration = 0.3 + rng.nextFloat() * 1.0;
        transitionPhase(
          creature,
          RELAXED_PHASES.PAUSED,
          tick,
          secondsToTicks(pauseDuration, durations.tps)
        );
      } else {
        const moveDuration =
          durations.relaxedMoveMinSeconds +
          rng.nextFloat() * (durations.relaxedMoveMaxSeconds - durations.relaxedMoveMinSeconds);
        transitionPhase(
          creature,
          RELAXED_PHASES.MOVING,
          tick,
          secondsToTicks(moveDuration, durations.tps)
        );
      }
      break;
    }
  }
};

const updateAlertState = (creature, config, rng, tick, durations) => {
  if (!canTransition(creature, tick)) {
    return;
  }

  // Check if threat is still nearby
  const threats = creature.herding?.nearbyThreats ?? 0;
  const isThreatened = creature.herding?.isThreatened ?? false;

  const distance = creature.herding?.nearestThreatDistance;
  if (
    isThreatened &&
    threats > 0 &&
    Number.isFinite(distance) &&
    distance <= durations.alertToFleeThreshold
  ) {
    // Threat is close - transition to FLEEING
    transitionTo(
      creature,
      BEHAVIOR_STATES.FLEEING,
      tick,
      secondsToTicks(durations.fleeingMinSeconds, durations.tps)
    );
  } else {
    // No close threat: finish the assessment rather than remaining paused indefinitely.
    transitionTo(
      creature,
      BEHAVIOR_STATES.RELAXED,
      tick,
      secondsToTicks(durations.relaxedMinSeconds, durations.tps),
      RELAXED_PHASES.MOVING
    );
  }
};

const checkEnvironmentTransition = (creature, world, config, rng, tick, durations) => {
  const bs = creature.behaviorState;

  // Skip if in urgent state
  if (
    bs.state === BEHAVIOR_STATES.FLEEING ||
    (bs.state === BEHAVIOR_STATES.HUNTING && bs.phase === HUNTING_PHASES.CHARGING)
  ) {
    return;
  }

  // Handle environment pause countdown
  if (bs.environmentPauseTicks > 0) {
    bs.environmentPauseTicks--;
    return;
  }

  // Check terrain change
  const tileX = Math.floor(creature.position?.x ?? 0);
  const tileY = Math.floor(creature.position?.y ?? 0);
  if (config?.creatureBehaviorEnvironmentPauseEnabled === false) return;
  const currentTerrain = world?.getTerrainAt?.(tileX, tileY) ?? 'plains';

  if (bs.lastTerrainType !== null && bs.lastTerrainType !== currentTerrain) {
    // Terrain changed - maybe pause
    if (rng.nextFloat() < durations.environmentPauseProbability) {
      bs.environmentPauseTicks = secondsToTicks(durations.environmentPauseSeconds, durations.tps);
    }
  }

  bs.lastTerrainType = currentTerrain;
};

export function updateCreatureBehaviorState({ creatures, config, rng, world, tick }) {
  if (!Array.isArray(creatures) || !rng) return;

  if (config?.creatureBehaviorStateEnabled === false) return;
  const durations = resolveStateDurations(config);

  for (const creature of creatures) {
    if (!creature?.position) continue;

    const bs = ensureBehaviorState(creature);
    bs.ticksInState++;

    // Check for urgent state overrides (can bypass locks)
    const isThreatened = creature.herding?.isThreatened ?? false;
    const threats = creature.herding?.nearbyThreats ?? 0;
    const threatDirection = creature.herding?.threatDirection;

    // Critical: Always flee if directly threatened and close
    if (isThreatened && threats > 0 && bs.state !== BEHAVIOR_STATES.FLEEING) {
      if (bs.state !== BEHAVIOR_STATES.ALERT) {
        // Trigger alert first unless already fleeing
        const alertDuration =
          durations.alertMinSeconds +
          rng.nextFloat() * (durations.alertMaxSeconds - durations.alertMinSeconds);
        // Use alertness trait to modify duration
        const alertness = creature.traits?.alertness ?? 0.5;
        const adjustedDuration = alertDuration * (1 - alertness * 0.3);

        transitionTo(
          creature,
          BEHAVIOR_STATES.ALERT,
          tick,
          secondsToTicks(adjustedDuration, durations.tps)
        );
        bs.alertDirection = threatDirection;
      }
      if (bs.state !== BEHAVIOR_STATES.ALERT || !canTransition(creature, tick)) continue;
    }

    // Environment awareness
    checkEnvironmentTransition(creature, world, config, rng, tick, durations);

    // State-specific updates
    switch (bs.state) {
      case BEHAVIOR_STATES.RELAXED:
        updateRelaxedState(creature, config, rng, tick, durations);
        break;

      case BEHAVIOR_STATES.ALERT:
        updateAlertState(creature, config, rng, tick, durations);
        break;

      case BEHAVIOR_STATES.HUNTING:
        if (isPredator(creature.species)) {
          updateHuntingState(creature, config, rng, tick, durations);
        }
        break;

      case BEHAVIOR_STATES.FLEEING:
        if (canTransition(creature, tick) && !isThreatened) {
          // Threat passed - return to relaxed
          transitionTo(
            creature,
            BEHAVIOR_STATES.RELAXED,
            tick,
            secondsToTicks(durations.relaxedMinSeconds, durations.tps),
            RELAXED_PHASES.MOVING
          );
        }
        break;

      case BEHAVIOR_STATES.RESTING:
        if (canTransition(creature, tick)) {
          // Check if needs require action
          const energy = behaviorMeterRatio(creature, config, 'energy');
          const water = behaviorMeterRatio(creature, config, 'water');
          if (energy < 0.5 || water < 0.5) {
            transitionTo(
              creature,
              BEHAVIOR_STATES.FORAGING,
              tick,
              secondsToTicks(durations.foragingMinSeconds, durations.tps)
            );
          } else {
            transitionTo(
              creature,
              BEHAVIOR_STATES.RELAXED,
              tick,
              secondsToTicks(durations.relaxedMinSeconds, durations.tps),
              RELAXED_PHASES.MOVING
            );
          }
        }
        break;

      case BEHAVIOR_STATES.FORAGING:
      case BEHAVIOR_STATES.TRAVELING:
        // These states are typically managed by intent - just update tick counter
        break;

      case BEHAVIOR_STATES.FEEDING:
        if (canTransition(creature, tick)) {
          const energy = behaviorMeterRatio(creature, config, 'energy');
          if (energy >= durations.satiationThreshold) {
            transitionTo(
              creature,
              BEHAVIOR_STATES.RESTING,
              tick,
              secondsToTicks(durations.restingMinSeconds, durations.tps)
            );
          } else {
            transitionTo(
              creature,
              BEHAVIOR_STATES.RELAXED,
              tick,
              secondsToTicks(durations.relaxedMinSeconds, durations.tps),
              RELAXED_PHASES.MOVING
            );
          }
        }
        break;
    }
  }
}

export function getBehaviorState(creature) {
  return creature?.behaviorState?.state ?? BEHAVIOR_STATES.RELAXED;
}

export function getBehaviorPhase(creature) {
  return creature?.behaviorState?.phase ?? null;
}

export function isPaused(creature) {
  const bs = creature?.behaviorState;
  if (!bs) return false;

  // ALERT state always pauses
  if (bs.state === BEHAVIOR_STATES.ALERT) return true;

  // RELAXED paused phase
  if (
    bs.state === BEHAVIOR_STATES.RELAXED &&
    (bs.phase === RELAXED_PHASES.PAUSED || bs.phase === RELAXED_PHASES.ADJUSTING)
  ) {
    return true;
  }

  // Environment pause
  if (bs.environmentPauseTicks > 0) return true;

  // FEEDING
  if (bs.state === BEHAVIOR_STATES.FEEDING) return true;

  return false;
}

export function isOnAlert(creature) {
  return creature?.behaviorState?.state === BEHAVIOR_STATES.ALERT;
}

export function getAlertDirection(creature) {
  return creature?.behaviorState?.alertDirection ?? null;
}

export function getHuntPhase(creature) {
  if (creature?.behaviorState?.state !== BEHAVIOR_STATES.HUNTING) return null;
  return creature.behaviorState.phase ?? null;
}

export function startHunting(creature, tick, config) {
  if (!isPredator(creature?.species)) return;

  const durations = resolveStateDurations(config);
  ensureBehaviorState(creature);

  transitionTo(
    creature,
    BEHAVIOR_STATES.HUNTING,
    tick,
    secondsToTicks(durations.huntSpottingSeconds, durations.tps),
    HUNTING_PHASES.SPOTTING
  );
}

export function startFeeding(creature, tick, config) {
  if (!isPredator(creature?.species)) return;

  const durations = resolveStateDurations(config);
  ensureBehaviorState(creature);

  const hungerRatio = 1 - behaviorMeterRatio(creature, config, 'energy');
  const feedDuration =
    durations.feedingMinSeconds +
    hungerRatio * (durations.feedingMaxSeconds - durations.feedingMinSeconds);

  transitionTo(
    creature,
    BEHAVIOR_STATES.FEEDING,
    tick,
    secondsToTicks(feedDuration, durations.tps)
  );
}

export function startFleeing(creature, tick, config) {
  const durations = resolveStateDurations(config);
  ensureBehaviorState(creature);

  transitionTo(
    creature,
    BEHAVIOR_STATES.FLEEING,
    tick,
    secondsToTicks(durations.fleeingMinSeconds, durations.tps)
  );
}

export { BEHAVIOR_STATES } from './behavior-helpers.js';
export { RELAXED_PHASES } from './behavior-helpers.js';
export { HUNTING_PHASES } from './behavior-helpers.js';
export { ensureBehaviorState } from './behavior-helpers.js';
