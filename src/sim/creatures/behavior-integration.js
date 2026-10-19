import {
  BEHAVIOR_STATES,
  RELAXED_PHASES,
  ensureBehaviorState,
  startHunting,
  startFeeding,
  startFleeing,
  updateCreatureBehaviorState,
  isPaused
} from './behavior-state.js';

// Intent owns survival decisions; the state machine supplies pacing within them.
export function updateBehaviorIntegration({ creatures, config, rng, world, tick }) {
  if (config?.creatureBehaviorStateEnabled === false) return;
  for (const creature of creatures) {
    const state = ensureBehaviorState(creature);
    const intent = creature.intent?.type;
    if (creature.herding?.isThreatened) {
      // Threat propagation also counts, even without a directly visible predator.
      if (
        (creature.herding?.nearbyThreats ?? 0) === 0 &&
        state.state !== BEHAVIOR_STATES.FLEEING &&
        state.state !== BEHAVIOR_STATES.ALERT
      ) {
        startFleeing(creature, tick, config);
      }
    } else if (intent === 'hunt') {
      if (state.state !== BEHAVIOR_STATES.HUNTING) startHunting(creature, tick, config);
    } else if (intent === 'eat' && creature.intent.foodType === 'meat') {
      if (state.state !== BEHAVIOR_STATES.FEEDING) startFeeding(creature, tick, config);
    } else if (['seek', 'mate', 'drink', 'eat'].includes(intent)) {
      state.state = BEHAVIOR_STATES.FORAGING;
      state.phase = null;
    } else if (![BEHAVIOR_STATES.RELAXED, BEHAVIOR_STATES.RESTING].includes(state.state)) {
      state.state = BEHAVIOR_STATES.RELAXED;
      state.phase = RELAXED_PHASES.MOVING;
      state.ticksInPhase = 0;
      state.phaseLockedUntilTick = tick;
    }
  }
  updateCreatureBehaviorState({ creatures, config, rng, world, tick });
}

export function behaviorSpeedMultiplier(creature, config) {
  if (config?.creatureBehaviorStateEnabled === false) return 1;
  const intent = creature.intent?.type;
  if (creature.behaviorState?.state === BEHAVIOR_STATES.ALERT) return 0;
  if (intent === 'hunt') {
    const phase = creature.behaviorState?.phase;
    if (phase === 'spotting' || phase === 'cooldown') return 0;
    if (phase === 'stalking') return Math.max(0, config?.creatureBehaviorHuntStalkSpeed ?? 0.35);
  }
  // Needs and escaping danger must never be blocked by a relaxed pause.
  if (creature.herding?.isThreatened || !['wander', 'graze'].includes(intent)) return 1;
  return isPaused(creature) || creature.behaviorState?.state === BEHAVIOR_STATES.RESTING ? 0 : 1;
}
