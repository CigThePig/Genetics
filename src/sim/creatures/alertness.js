const clamp01 = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
};

const resolveDelay = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

export function updateCreatureAlertness({ creatures, config }) {
  if (!Array.isArray(creatures)) {
    return;
  }
  const baseAlertness = clamp01(config?.creatureAlertnessBase ?? 0.5);
  const fallbackDelay = resolveDelay(config?.creatureReactionDelayTicks, 0);

  for (const creature of creatures) {
    const alertnessLevel = clamp01(
      creature?.traits?.alertness ?? baseAlertness
    );
    const delayBase = resolveDelay(
      creature?.traits?.reactionDelayTicks,
      fallbackDelay
    );
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
