/**
 * Behavior State Machine Module
 *
 * Introduces a state machine where creatures commit to behavioral states
 * for meaningful durations before re-evaluating. This prevents the rapid
 * intent flickering that makes creatures appear indecisive.
 *
 * States:
 * - RELAXED: default state, slow wandering/grazing with natural pauses
 * - ALERT: frozen, looking toward a potential threat, brief reaction window
 * - TRAVELING: committed to reaching a specific destination
 * - FORAGING: actively seeking and consuming food/water
 * - FLEEING: escaping from a threat at high speed
 * - HUNTING: predator-only, multi-phase hunting (spotting, stalking, charging)
 * - RESTING: stationary recovery
 * - FEEDING: predator-only, eating at a kill site
 */

import { SPECIES } from '../species.js';

// ============================================================================
// STATE DEFINITIONS
// ============================================================================

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

// Sub-phases for complex states
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
const isPredator = (species) => PREDATOR_SPECIES.has(species);

// ============================================================================
// CONFIG RESOLVERS
// ============================================================================

const resolveTicksPerSecond = (config) =>
  Number.isFinite(config?.ticksPerSecond) ? config.ticksPerSecond : 60;

const resolveStateDurations = (config) => {
  const tps = resolveTicksPerSecond(config);
  return {
    // RELAXED state
    relaxedMinSeconds: Number.isFinite(config?.creatureBehaviorRelaxedMinSeconds)
      ? config.creatureBehaviorRelaxedMinSeconds : 1.0,
    relaxedPauseMinSeconds: Number.isFinite(config?.creatureBehaviorRelaxedPauseMinSeconds)
      ? config.creatureBehaviorRelaxedPauseMinSeconds : 1.0,
    relaxedPauseMaxSeconds: Number.isFinite(config?.creatureBehaviorRelaxedPauseMaxSeconds)
      ? config.creatureBehaviorRelaxedPauseMaxSeconds : 4.0,
    relaxedMoveMinSeconds: Number.isFinite(config?.creatureBehaviorRelaxedMoveMinSeconds)
      ? config.creatureBehaviorRelaxedMoveMinSeconds : 3.0,
    relaxedMoveMaxSeconds: Number.isFinite(config?.creatureBehaviorRelaxedMoveMaxSeconds)
      ? config.creatureBehaviorRelaxedMoveMaxSeconds : 8.0,
    relaxedPauseProbability: Number.isFinite(config?.creatureBehaviorRelaxedPauseProbability)
      ? config.creatureBehaviorRelaxedPauseProbability : 0.4,
    relaxedGrazePauseRatio: Number.isFinite(config?.creatureBehaviorRelaxedGrazePauseRatio)
      ? config.creatureBehaviorRelaxedGrazePauseRatio : 0.65,

    // ALERT state
    alertMinSeconds: Number.isFinite(config?.creatureBehaviorAlertMinSeconds)
      ? config.creatureBehaviorAlertMinSeconds : 0.5,
    alertMaxSeconds: Number.isFinite(config?.creatureBehaviorAlertMaxSeconds)
      ? config.creatureBehaviorAlertMaxSeconds : 1.5,
    alertToFleeThreshold: Number.isFinite(config?.creatureBehaviorAlertToFleeThreshold)
      ? config.creatureBehaviorAlertToFleeThreshold : 8,

    // TRAVELING state
    travelingMinSeconds: Number.isFinite(config?.creatureBehaviorTravelingMinSeconds)
      ? config.creatureBehaviorTravelingMinSeconds : 2.0,

    // FORAGING state
    foragingMinSeconds: Number.isFinite(config?.creatureBehaviorForagingMinSeconds)
      ? config.creatureBehaviorForagingMinSeconds : 1.0,

    // FLEEING state
    fleeingMinSeconds: Number.isFinite(config?.creatureBehaviorFleeingMinSeconds)
      ? config.creatureBehaviorFleeingMinSeconds : 0.5,

    // HUNTING state (predators only)
    huntSpottingSeconds: Number.isFinite(config?.creatureBehaviorHuntSpottingSeconds)
      ? config.creatureBehaviorHuntSpottingSeconds : 0.7,
    huntStalkingMinSeconds: Number.isFinite(config?.creatureBehaviorHuntStalkingMinSeconds)
      ? config.creatureBehaviorHuntStalkingMinSeconds : 2.0,
    huntStalkingMaxSeconds: Number.isFinite(config?.creatureBehaviorHuntStalkingMaxSeconds)
      ? config.creatureBehaviorHuntStalkingMaxSeconds : 5.0,
    huntCooldownSeconds: Number.isFinite(config?.creatureBehaviorHuntCooldownSeconds)
      ? config.creatureBehaviorHuntCooldownSeconds : 1.5,
    huntPounceRange: Number.isFinite(config?.creatureBehaviorHuntPounceRange)
      ? config.creatureBehaviorHuntPounceRange : 3.5,
    huntStalkSpeed: Number.isFinite(config?.creatureBehaviorHuntStalkSpeed)
      ? config.creatureBehaviorHuntStalkSpeed : 0.35,

    // RESTING state
    restingMinSeconds: Number.isFinite(config?.creatureBehaviorRestingMinSeconds)
      ? config.creatureBehaviorRestingMinSeconds : 2.0,

    // FEEDING state (predators only)
    feedingMinSeconds: Number.isFinite(config?.creatureBehaviorFeedingMinSeconds)
      ? config.creatureBehaviorFeedingMinSeconds : 3.0,
    feedingMaxSeconds: Number.isFinite(config?.creatureBehaviorFeedingMaxSeconds)
      ? config.creatureBehaviorFeedingMaxSeconds : 8.0,
    satiationThreshold: Number.isFinite(config?.creatureBehaviorSatiationThreshold)
      ? config.creatureBehaviorSatiationThreshold : 0.8,

    // Environment awareness
    environmentPauseSeconds: Number.isFinite(config?.creatureBehaviorEnvironmentPauseSeconds)
      ? config.creatureBehaviorEnvironmentPauseSeconds : 0.5,
    environmentPauseProbability: Number.isFinite(config?.creatureBehaviorEnvironmentPauseProbability)
      ? config.creatureBehaviorEnvironmentPauseProbability : 0.3,

    tps
  };
};

const secondsToTicks = (seconds, tps) => Math.max(1, Math.floor(seconds * tps));

// ============================================================================
// BEHAVIOR STATE MANAGEMENT
// ============================================================================

/**
 * Ensures behavior state exists on creature.
 */
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
      targetPosition: null,
      lastTerrainType: null,
      environmentPauseTicks: 0
    };
  }
  return creature.behaviorState;
};

/**
 * Transitions to a new state with minimum duration lock.
 */
const transitionTo = (creature, newState, tick, minDurationTicks, phase = null) => {
  const bs = creature.behaviorState;
  bs.state = newState;
  bs.ticksInState = 0;
  bs.lockedUntilTick = tick + minDurationTicks;

  if (phase) {
    bs.phase = phase;
    bs.ticksInPhase = 0;
  }
};

/**
 * Transitions to a new phase within the current state.
 */
const transitionPhase = (creature, newPhase, tick, minDurationTicks) => {
  const bs = creature.behaviorState;
  bs.phase = newPhase;
  bs.ticksInPhase = 0;
  bs.phaseLockedUntilTick = tick + minDurationTicks;
};

/**
 * Checks if a state transition is allowed (lock expired).
 */
const canTransition = (creature, tick) => {
  return tick >= (creature.behaviorState?.lockedUntilTick ?? 0);
};

/**
 * Checks if a phase transition is allowed.
 */
const canTransitionPhase = (creature, tick) => {
  return tick >= (creature.behaviorState?.phaseLockedUntilTick ?? 0);
};

// ============================================================================
// STATE UPDATE LOGIC
// ============================================================================

/**
 * Updates RELAXED state with natural pauses.
 */
const updateRelaxedState = (creature, config, rng, tick, durations) => {
  const bs = creature.behaviorState;
  const isGrazing = creature.intent?.type === 'graze';
  const pauseRatio = isGrazing ? durations.relaxedGrazePauseRatio : durations.relaxedPauseProbability;

  if (!canTransitionPhase(creature, tick)) {
    bs.ticksInPhase++;
    return;
  }

  const currentPhase = bs.phase;

  switch (currentPhase) {
    case RELAXED_PHASES.MOVING: {
      // After moving, possibly pause
      if (rng.nextFloat() < pauseRatio) {
        const pauseDuration = durations.relaxedPauseMinSeconds +
          rng.nextFloat() * (durations.relaxedPauseMaxSeconds - durations.relaxedPauseMinSeconds);
        transitionPhase(creature, RELAXED_PHASES.PAUSED, tick,
          secondsToTicks(pauseDuration, durations.tps));
      } else {
        // Continue moving with new duration
        const moveDuration = durations.relaxedMoveMinSeconds +
          rng.nextFloat() * (durations.relaxedMoveMaxSeconds - durations.relaxedMoveMinSeconds);
        transitionPhase(creature, RELAXED_PHASES.MOVING, tick,
          secondsToTicks(moveDuration, durations.tps));
      }
      break;
    }

    case RELAXED_PHASES.PAUSED: {
      // Occasionally do micro-adjustments during pause
      if (rng.nextFloat() < 0.15) {
        transitionPhase(creature, RELAXED_PHASES.ADJUSTING, tick,
          secondsToTicks(0.2 + rng.nextFloat() * 0.3, durations.tps));
      } else {
        // Resume moving
        const moveDuration = durations.relaxedMoveMinSeconds +
          rng.nextFloat() * (durations.relaxedMoveMaxSeconds - durations.relaxedMoveMinSeconds);
        transitionPhase(creature, RELAXED_PHASES.MOVING, tick,
          secondsToTicks(moveDuration, durations.tps));
      }
      break;
    }

    case RELAXED_PHASES.ADJUSTING: {
      // Return to paused or start moving
      if (rng.nextFloat() < 0.5) {
        const pauseDuration = 0.3 + rng.nextFloat() * 1.0;
        transitionPhase(creature, RELAXED_PHASES.PAUSED, tick,
          secondsToTicks(pauseDuration, durations.tps));
      } else {
        const moveDuration = durations.relaxedMoveMinSeconds +
          rng.nextFloat() * (durations.relaxedMoveMaxSeconds - durations.relaxedMoveMinSeconds);
        transitionPhase(creature, RELAXED_PHASES.MOVING, tick,
          secondsToTicks(moveDuration, durations.tps));
      }
      break;
    }
  }
};

/**
 * Updates ALERT state - creature freezes and looks at threat.
 */
const updateAlertState = (creature, config, rng, tick, durations) => {
  const bs = creature.behaviorState;
  bs.ticksInState++;

  if (!canTransition(creature, tick)) {
    return;
  }

  // Check if threat is still nearby
  const threats = creature.herding?.nearbyThreats ?? 0;
  const isThreatened = creature.herding?.isThreatened ?? false;

  if (isThreatened && threats > 0) {
    // Threat is close - transition to FLEEING
    transitionTo(creature, BEHAVIOR_STATES.FLEEING, tick,
      secondsToTicks(durations.fleeingMinSeconds, durations.tps));
  } else {
    // No immediate threat - return to RELAXED
    transitionTo(creature, BEHAVIOR_STATES.RELAXED, tick,
      secondsToTicks(durations.relaxedMinSeconds, durations.tps),
      RELAXED_PHASES.MOVING);
  }
};

/**
 * Updates HUNTING state for predators with multi-phase behavior.
 */
const updateHuntingState = (creature, config, rng, tick, durations) => {
  const bs = creature.behaviorState;
  bs.ticksInState++;
  bs.ticksInPhase++;

  const chase = creature.chase;
  const hasTarget = chase?.targetId != null;
  const targetDistance = chase?.distance ?? Infinity;

  if (!canTransitionPhase(creature, tick)) {
    return;
  }

  const currentPhase = bs.phase;

  switch (currentPhase) {
    case HUNTING_PHASES.SPOTTING: {
      if (!hasTarget) {
        // Lost target during spotting - cooldown
        transitionPhase(creature, HUNTING_PHASES.COOLDOWN, tick,
          secondsToTicks(durations.huntCooldownSeconds, durations.tps));
      } else {
        // Transition to stalking
        transitionPhase(creature, HUNTING_PHASES.STALKING, tick,
          secondsToTicks(durations.huntStalkingMinSeconds, durations.tps));
      }
      break;
    }

    case HUNTING_PHASES.STALKING: {
      if (!hasTarget) {
        // Lost target - cooldown
        transitionPhase(creature, HUNTING_PHASES.COOLDOWN, tick,
          secondsToTicks(durations.huntCooldownSeconds, durations.tps));
      } else if (targetDistance <= durations.huntPounceRange) {
        // Close enough to pounce - charge!
        transitionPhase(creature, HUNTING_PHASES.CHARGING, tick,
          secondsToTicks(0.1, durations.tps)); // Minimal lock for charging
      } else if (bs.ticksInPhase >= secondsToTicks(durations.huntStalkingMaxSeconds, durations.tps)) {
        // Been stalking too long - charge anyway
        transitionPhase(creature, HUNTING_PHASES.CHARGING, tick,
          secondsToTicks(0.1, durations.tps));
      }
      break;
    }

    case HUNTING_PHASES.CHARGING: {
      // Charging continues until chase resolves
      const chaseStatus = chase?.status;
      if (!hasTarget || chaseStatus === 'resting' || chaseStatus === 'idle') {
        // Chase ended
        transitionPhase(creature, HUNTING_PHASES.COOLDOWN, tick,
          secondsToTicks(durations.huntCooldownSeconds, durations.tps));
      }
      break;
    }

    case HUNTING_PHASES.COOLDOWN: {
      // Return to relaxed/resting after cooldown
      const energyRatio = creature.meters?.energy ?? 1;
      if (energyRatio >= durations.satiationThreshold) {
        transitionTo(creature, BEHAVIOR_STATES.RESTING, tick,
          secondsToTicks(durations.restingMinSeconds, durations.tps));
      } else {
        transitionTo(creature, BEHAVIOR_STATES.RELAXED, tick,
          secondsToTicks(durations.relaxedMinSeconds, durations.tps),
          RELAXED_PHASES.MOVING);
      }
      break;
    }
  }
};

/**
 * Checks environmental transitions (terrain changes).
 */
const checkEnvironmentTransition = (creature, world, config, rng, tick, durations) => {
  const bs = creature.behaviorState;

  // Skip if in urgent state
  if (bs.state === BEHAVIOR_STATES.FLEEING ||
      bs.state === BEHAVIOR_STATES.HUNTING && bs.phase === HUNTING_PHASES.CHARGING) {
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
  const currentTerrain = world?.tiles?.[tileY]?.[tileX]?.terrain ?? 'plains';

  if (bs.lastTerrainType !== null && bs.lastTerrainType !== currentTerrain) {
    // Terrain changed - maybe pause
    if (rng.nextFloat() < durations.environmentPauseProbability) {
      bs.environmentPauseTicks = secondsToTicks(durations.environmentPauseSeconds, durations.tps);
    }
  }

  bs.lastTerrainType = currentTerrain;
};

// ============================================================================
// MAIN UPDATE FUNCTION
// ============================================================================

/**
 * Updates creature behavior state.
 * Called once per tick to manage state machine transitions.
 */
export function updateCreatureBehaviorState({ creatures, config, rng, world, tick }) {
  if (!Array.isArray(creatures) || !rng) return;

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
        const alertDuration = durations.alertMinSeconds +
          rng.nextFloat() * (durations.alertMaxSeconds - durations.alertMinSeconds);
        // Use alertness trait to modify duration
        const alertness = creature.traits?.alertness ?? 0.5;
        const adjustedDuration = alertDuration * (1 - alertness * 0.3);

        transitionTo(creature, BEHAVIOR_STATES.ALERT, tick,
          secondsToTicks(adjustedDuration, durations.tps));
        bs.alertDirection = threatDirection;
      }
      continue;
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
        bs.ticksInState++;
        if (canTransition(creature, tick) && !isThreatened) {
          // Threat passed - return to relaxed
          transitionTo(creature, BEHAVIOR_STATES.RELAXED, tick,
            secondsToTicks(durations.relaxedMinSeconds, durations.tps),
            RELAXED_PHASES.MOVING);
        }
        break;

      case BEHAVIOR_STATES.RESTING:
        bs.ticksInState++;
        if (canTransition(creature, tick)) {
          // Check if needs require action
          const energy = creature.meters?.energy ?? 1;
          const water = creature.meters?.water ?? 1;
          if (energy < 0.5 || water < 0.5) {
            transitionTo(creature, BEHAVIOR_STATES.FORAGING, tick,
              secondsToTicks(durations.foragingMinSeconds, durations.tps));
          } else {
            transitionTo(creature, BEHAVIOR_STATES.RELAXED, tick,
              secondsToTicks(durations.relaxedMinSeconds, durations.tps),
              RELAXED_PHASES.MOVING);
          }
        }
        break;

      case BEHAVIOR_STATES.FORAGING:
      case BEHAVIOR_STATES.TRAVELING:
        bs.ticksInState++;
        // These states are typically managed by intent - just update tick counter
        break;

      case BEHAVIOR_STATES.FEEDING:
        bs.ticksInState++;
        if (canTransition(creature, tick)) {
          const energy = creature.meters?.energy ?? 1;
          if (energy >= durations.satiationThreshold) {
            transitionTo(creature, BEHAVIOR_STATES.RESTING, tick,
              secondsToTicks(durations.restingMinSeconds, durations.tps));
          } else {
            transitionTo(creature, BEHAVIOR_STATES.RELAXED, tick,
              secondsToTicks(durations.relaxedMinSeconds, durations.tps),
              RELAXED_PHASES.MOVING);
          }
        }
        break;
    }
  }
}

/**
 * Gets current behavior state for a creature.
 */
export function getBehaviorState(creature) {
  return creature?.behaviorState?.state ?? BEHAVIOR_STATES.RELAXED;
}

/**
 * Gets current behavior phase for a creature.
 */
export function getBehaviorPhase(creature) {
  return creature?.behaviorState?.phase ?? null;
}

/**
 * Checks if creature is in a paused state (should not move).
 */
export function isPaused(creature) {
  const bs = creature?.behaviorState;
  if (!bs) return false;

  // ALERT state always pauses
  if (bs.state === BEHAVIOR_STATES.ALERT) return true;

  // RELAXED paused phase
  if (bs.state === BEHAVIOR_STATES.RELAXED &&
      (bs.phase === RELAXED_PHASES.PAUSED || bs.phase === RELAXED_PHASES.ADJUSTING)) {
    return true;
  }

  // Environment pause
  if (bs.environmentPauseTicks > 0) return true;

  // FEEDING
  if (bs.state === BEHAVIOR_STATES.FEEDING) return true;

  return false;
}

/**
 * Checks if creature is on alert (visual indicator).
 */
export function isOnAlert(creature) {
  return creature?.behaviorState?.state === BEHAVIOR_STATES.ALERT;
}

/**
 * Gets the alert direction for a creature.
 */
export function getAlertDirection(creature) {
  return creature?.behaviorState?.alertDirection ?? null;
}

/**
 * Gets the current hunt phase for a predator.
 */
export function getHuntPhase(creature) {
  if (creature?.behaviorState?.state !== BEHAVIOR_STATES.HUNTING) return null;
  return creature.behaviorState.phase ?? null;
}

/**
 * Starts hunting state for a predator.
 */
export function startHunting(creature, tick, config) {
  if (!isPredator(creature?.species)) return;

  const durations = resolveStateDurations(config);
  ensureBehaviorState(creature);

  transitionTo(creature, BEHAVIOR_STATES.HUNTING, tick,
    secondsToTicks(durations.huntSpottingSeconds, durations.tps),
    HUNTING_PHASES.SPOTTING);
}

/**
 * Starts feeding state for a predator after a kill.
 */
export function startFeeding(creature, tick, config) {
  if (!isPredator(creature?.species)) return;

  const durations = resolveStateDurations(config);
  ensureBehaviorState(creature);

  const hungerRatio = 1 - (creature.meters?.energy ?? 1);
  const feedDuration = durations.feedingMinSeconds +
    hungerRatio * (durations.feedingMaxSeconds - durations.feedingMinSeconds);

  transitionTo(creature, BEHAVIOR_STATES.FEEDING, tick,
    secondsToTicks(feedDuration, durations.tps));
}

/**
 * Forces transition to FLEEING state.
 */
export function startFleeing(creature, tick, config) {
  const durations = resolveStateDurations(config);
  ensureBehaviorState(creature);

  transitionTo(creature, BEHAVIOR_STATES.FLEEING, tick,
    secondsToTicks(durations.fleeingMinSeconds, durations.tps));
}
