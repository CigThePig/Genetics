import {
  behaviorMeterRatio,
  BEHAVIOR_STATES,
  RELAXED_PHASES,
  HUNTING_PHASES,
  canTransitionPhase,
  transitionPhase,
  transitionTo,
  secondsToTicks
} from './behavior-helpers.js';

export const updateHuntingState = (creature, config, rng, tick, durations) => {
  const bs = creature.behaviorState;

  bs.ticksInPhase++;

  const chase = creature.chase;
  const hasTarget = chase?.targetId != null;
  const targetDistance = chase?.distance ?? Infinity;

  // Slow stalking is useful only while prey has not visibly begun escape.
  // Charging responds to observed velocity, never a hidden prey decision.
  if (hasTarget && chase.preyEscaping && bs.phase === HUNTING_PHASES.STALKING) {
    transitionPhase(creature, HUNTING_PHASES.CHARGING, tick, secondsToTicks(0.1, durations.tps));
    return;
  }
  if (!canTransitionPhase(creature, tick)) {
    return;
  }

  const currentPhase = bs.phase;

  switch (currentPhase) {
    case HUNTING_PHASES.SPOTTING: {
      if (!hasTarget) {
        // Lost target during spotting - cooldown
        transitionPhase(
          creature,
          HUNTING_PHASES.COOLDOWN,
          tick,
          secondsToTicks(durations.huntCooldownSeconds, durations.tps)
        );
      } else {
        // Transition to stalking
        transitionPhase(
          creature,
          HUNTING_PHASES.STALKING,
          tick,
          secondsToTicks(durations.huntStalkingMinSeconds, durations.tps)
        );
      }
      break;
    }

    case HUNTING_PHASES.STALKING: {
      if (!hasTarget) {
        // Lost target - cooldown
        transitionPhase(
          creature,
          HUNTING_PHASES.COOLDOWN,
          tick,
          secondsToTicks(durations.huntCooldownSeconds, durations.tps)
        );
      } else if (targetDistance <= durations.huntPounceRange) {
        // Close enough to pounce - charge!
        transitionPhase(
          creature,
          HUNTING_PHASES.CHARGING,
          tick,
          secondsToTicks(0.1, durations.tps)
        ); // Minimal lock for charging
      } else if (
        bs.ticksInPhase >= secondsToTicks(durations.huntStalkingMaxSeconds, durations.tps)
      ) {
        // Been stalking too long - charge anyway
        transitionPhase(
          creature,
          HUNTING_PHASES.CHARGING,
          tick,
          secondsToTicks(0.1, durations.tps)
        );
      }
      break;
    }

    case HUNTING_PHASES.CHARGING: {
      // Charging continues until chase resolves
      const chaseStatus = chase?.status;
      if (!hasTarget || chaseStatus === 'resting' || chaseStatus === 'idle') {
        // Chase ended
        transitionPhase(
          creature,
          HUNTING_PHASES.COOLDOWN,
          tick,
          secondsToTicks(durations.huntCooldownSeconds, durations.tps)
        );
      }
      break;
    }

    case HUNTING_PHASES.COOLDOWN: {
      // Return to relaxed/resting after cooldown
      const energyRatio = behaviorMeterRatio(creature, config, 'energy');
      if (energyRatio >= durations.satiationThreshold) {
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
      break;
    }
  }
};
