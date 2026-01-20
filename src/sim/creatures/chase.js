const resolveNeedMeterBase = (value) =>
  Number.isFinite(value) && value > 0 ? value : 1;

const resolveThreshold = (value, fallback) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, value));
};

const resolveChaseDistance = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

const resolveChaseTicks = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : fallback;

const resolveTargetingRange = (config) => {
  if (Number.isFinite(config?.creatureTargetingRange)) {
    return Math.max(0, config.creatureTargetingRange);
  }
  if (Number.isFinite(config?.creaturePerceptionRange)) {
    return Math.max(0, config.creaturePerceptionRange);
  }
  return 0;
};

const getStaminaRatio = (creature, baseStamina) => {
  const stamina = creature?.meters?.stamina;
  const ratio = Number.isFinite(stamina) ? stamina / baseStamina : 0;
  return Math.min(1, Math.max(0, ratio));
};

const ensureChaseState = (creature) => {
  if (!creature.chase) {
    creature.chase = {
      status: 'idle',
      targetId: null,
      preySpecies: null,
      lastSeenTick: null,
      lastKnownPosition: null,
      distance: null,
      restTicks: 0,
      lastOutcome: null,
      lastOutcomeTick: null
    };
  }
  return creature.chase;
};

const findTargetById = (creatures, id) => {
  if (!Array.isArray(creatures)) {
    return null;
  }
  for (const creature of creatures) {
    if (creature?.id === id) {
      return creature;
    }
  }
  return null;
};

const concludeChase = ({
  chase,
  config,
  metrics,
  tick,
  outcome
}) => {
  const restTicks = resolveChaseTicks(config?.creatureChaseRestTicks, 6);
  chase.status = 'resting';
  chase.targetId = null;
  chase.preySpecies = null;
  chase.lastKnownPosition = null;
  chase.distance = null;
  chase.restTicks = restTicks;
  chase.lastOutcome = outcome;
  chase.lastOutcomeTick = tick;
  if (metrics) {
    if (outcome === 'caught') {
      metrics.chaseSuccesses = (metrics.chaseSuccesses ?? 0) + 1;
    } else {
      metrics.chaseLosses = (metrics.chaseLosses ?? 0) + 1;
    }
  }
};

export function updateCreatureChase({ creatures, config, metrics, tick }) {
  if (!Array.isArray(creatures)) {
    return;
  }
  const baseStamina = resolveNeedMeterBase(config?.creatureBaseStamina);
  const stopThreshold = resolveThreshold(
    config?.creatureChaseStopThreshold,
    0.25
  );
  const loseDistance = resolveChaseDistance(
    config?.creatureChaseLoseDistance,
    resolveTargetingRange(config) * 1.25
  );
  const catchDistance = resolveChaseDistance(
    config?.creatureChaseCatchDistance,
    0.6
  );
  const loseTicks = resolveChaseTicks(config?.creatureChaseLoseTicks, 6);

  for (const creature of creatures) {
    if (!creature?.position) {
      continue;
    }
    const chase = ensureChaseState(creature);
    if (chase.restTicks > 0) {
      chase.restTicks -= 1;
      chase.status = 'resting';
      if (chase.restTicks <= 0) {
        chase.status = 'idle';
      }
    }

    if (!Number.isFinite(chase.targetId)) {
      continue;
    }

    const staminaRatio = getStaminaRatio(creature, baseStamina);
    if (staminaRatio < stopThreshold) {
      concludeChase({ chase, config, metrics, tick, outcome: 'exhausted' });
      continue;
    }

    const target = findTargetById(creatures, chase.targetId);
    if (!target?.position) {
      concludeChase({ chase, config, metrics, tick, outcome: 'lost' });
      continue;
    }

    const dx = target.position.x - creature.position.x;
    const dy = target.position.y - creature.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    chase.distance = distance;

    if (distance <= catchDistance) {
      concludeChase({ chase, config, metrics, tick, outcome: 'caught' });
      continue;
    }

    if (distance <= loseDistance) {
      chase.status = 'pursuing';
      chase.lastSeenTick = tick;
      chase.lastKnownPosition = {
        x: target.position.x,
        y: target.position.y
      };
      continue;
    }

    const lastSeenTick = Number.isFinite(chase.lastSeenTick)
      ? chase.lastSeenTick
      : tick;
    const missingTicks = Math.max(0, tick - lastSeenTick);
    if (missingTicks >= loseTicks) {
      concludeChase({ chase, config, metrics, tick, outcome: 'lost' });
      continue;
    }

    chase.status = 'losing';
  }
}

export function getChaseTarget(creature, creatures) {
  if (!creature?.chase || !Number.isFinite(creature.chase.targetId)) {
    return null;
  }
  return findTargetById(creatures, creature.chase.targetId);
}

export function startCreatureChase({ creature, target, metrics, config, tick }) {
  if (!creature || !target) {
    return false;
  }
  const chase = ensureChaseState(creature);
  if (chase.restTicks > 0) {
    return false;
  }
  const baseStamina = resolveNeedMeterBase(config?.creatureBaseStamina);
  const startThreshold = resolveThreshold(
    config?.creatureChaseStartThreshold,
    0.6
  );
  const staminaRatio = getStaminaRatio(creature, baseStamina);
  if (staminaRatio < startThreshold) {
    return false;
  }
  chase.status = 'pursuing';
  chase.targetId = target.id;
  chase.preySpecies = target.species ?? null;
  chase.lastSeenTick = tick;
  chase.lastKnownPosition = {
    x: target.position.x,
    y: target.position.y
  };
  chase.distance = null;
  chase.lastOutcome = null;
  chase.lastOutcomeTick = null;
  if (metrics) {
    metrics.chaseAttempts = (metrics.chaseAttempts ?? 0) + 1;
  }
  return true;
}
