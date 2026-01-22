const clamp01 = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
};

const resolveTicksPerSecond = (config) =>
  Number.isFinite(config?.ticksPerSecond) ? Math.max(1, config.ticksPerSecond) : 60;

/**
 * Converts a delay in seconds to ticks.
 */
const resolveDelayTicks = (seconds, fallbackSeconds, ticksPerSecond) => {
  const value = Number.isFinite(seconds) ? seconds : fallbackSeconds;
  return Math.max(0, Math.round(value * ticksPerSecond));
};

export function updateCreatureAlertness({ creatures, config }) {
  if (!Array.isArray(creatures)) {
    return;
  }
  const tps = resolveTicksPerSecond(config);
  const baseAlertness = clamp01(config?.creatureAlertnessBase ?? 0.5);
  const fallbackDelayTicks = resolveDelayTicks(config?.creatureReactionDelay, 0.033, tps);

  for (const creature of creatures) {
    const alertnessLevel = clamp01(
      creature?.traits?.alertness ?? baseAlertness
    );
    const delayBase = creature?.traits?.reactionDelay !== undefined
      ? resolveDelayTicks(creature.traits.reactionDelay, 0.033, tps)
      : fallbackDelayTicks;
    const reactionDelay = Math.max(0, Math.round(delayBase * (1 - alertnessLevel)));
    const previousCooldown = Number.isFinite(creature?.alertness?.reactionCooldown)
      ? creature.alertness.reactionCooldown
      : 0;

    let reactionCooldown = previousCooldown;
    if (creature?.perception?.changed) {
      reactionCooldown = reactionDelay;
    }

    const canReact = reactionCooldown <= 0;
    if (reactionCooldown > 0) {
      reactionCooldown -= 1;
    }

    creature.alertness = {
      level: alertnessLevel,
      reactionDelay,
      reactionCooldown,
      canReact
    };
  }
}
