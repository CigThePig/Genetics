/**
 * Herding Module
 *
 * Implements flocking/herding behavior for creatures of the same species.
 * Same-species creatures are attracted to each other to form groups.
 */

/**
 * Resolves herding range from config.
 */
const resolveHerdingRange = (config) =>
  Number.isFinite(config?.creatureHerdingRange)
    ? Math.max(0, config.creatureHerdingRange)
    : 8;

/**
 * Resolves herding strength from config.
 * This determines how strongly creatures are pulled toward their herd.
 */
const resolveHerdingStrength = (config) =>
  Number.isFinite(config?.creatureHerdingStrength)
    ? Math.max(0, Math.min(1, config.creatureHerdingStrength))
    : 0.15;

/**
 * Resolves minimum herd size for herding behavior to activate.
 */
const resolveHerdingMinGroupSize = (config) =>
  Number.isFinite(config?.creatureHerdingMinGroupSize)
    ? Math.max(1, Math.trunc(config.creatureHerdingMinGroupSize))
    : 2;

/**
 * Resolves preferred separation distance (creatures won't get closer than this).
 */
const resolveHerdingSeparation = (config) =>
  Number.isFinite(config?.creatureHerdingSeparation)
    ? Math.max(0, config.creatureHerdingSeparation)
    : 1.5;

/**
 * Checks if herding is enabled.
 */
const isHerdingEnabled = (config) => config?.creatureHerdingEnabled !== false;

/**
 * Finds nearby creatures of the same species.
 */
const findNearbyHerdMembers = (creature, creatures, rangeSq) => {
  const members = [];
  const species = creature.species;
  const x = creature.position.x;
  const y = creature.position.y;

  for (const other of creatures) {
    if (other === creature || !other?.position) {
      continue;
    }
    if (other.species !== species) {
      continue;
    }
    const dx = other.position.x - x;
    const dy = other.position.y - y;
    const distSq = dx * dx + dy * dy;
    if (distSq <= rangeSq && distSq > 0) {
      members.push({
        creature: other,
        dx,
        dy,
        distSq,
        distance: Math.sqrt(distSq)
      });
    }
  }

  return members;
};

/**
 * Calculates the center of mass for a group of nearby creatures.
 */
const calculateHerdCenter = (creature, members) => {
  if (members.length === 0) {
    return null;
  }

  let sumX = creature.position.x;
  let sumY = creature.position.y;
  let count = 1;

  for (const member of members) {
    sumX += member.creature.position.x;
    sumY += member.creature.position.y;
    count += 1;
  }

  return {
    x: sumX / count,
    y: sumY / count
  };
};

/**
 * Calculates separation vector to avoid crowding.
 */
const calculateSeparation = (creature, members, separationDist) => {
  let sepX = 0;
  let sepY = 0;
  const sepDistSq = separationDist * separationDist;

  for (const member of members) {
    if (member.distSq < sepDistSq && member.distSq > 0) {
      // Push away from nearby creatures
      const strength = 1 - (member.distance / separationDist);
      sepX -= (member.dx / member.distance) * strength;
      sepY -= (member.dy / member.distance) * strength;
    }
  }

  return { x: sepX, y: sepY };
};

/**
 * Ensures herding state exists on creature.
 */
const ensureHerdingState = (creature) => {
  if (!creature.herding) {
    creature.herding = {
      herdSize: 0,
      targetOffset: null
    };
  }
  return creature.herding;
};

/**
 * Updates herding behavior for all creatures.
 * Calculates herd attraction and applies it as a target offset for movement.
 */
export function updateCreatureHerding({ creatures, config }) {
  if (!Array.isArray(creatures)) {
    return;
  }

  if (!isHerdingEnabled(config)) {
    return;
  }

  const range = resolveHerdingRange(config);
  const rangeSq = range * range;
  const strength = resolveHerdingStrength(config);
  const minGroupSize = resolveHerdingMinGroupSize(config);
  const separation = resolveHerdingSeparation(config);

  for (const creature of creatures) {
    if (!creature?.position) {
      continue;
    }

    const herding = ensureHerdingState(creature);
    const members = findNearbyHerdMembers(creature, creatures, rangeSq);
    herding.herdSize = members.length + 1; // Include self

    // Not enough nearby creatures to form a herd
    if (members.length < minGroupSize - 1) {
      herding.targetOffset = null;
      continue;
    }

    // Skip herding if creature is actively hunting or fleeing
    const intentType = creature.intent?.type;
    if (intentType === 'hunt' || intentType === 'flee') {
      herding.targetOffset = null;
      continue;
    }

    // Calculate herd center attraction
    const herdCenter = calculateHerdCenter(creature, members);
    if (!herdCenter) {
      herding.targetOffset = null;
      continue;
    }

    // Direction toward herd center
    const towardCenterX = herdCenter.x - creature.position.x;
    const towardCenterY = herdCenter.y - creature.position.y;
    const centerDist = Math.sqrt(towardCenterX * towardCenterX + towardCenterY * towardCenterY);

    // Calculate separation to avoid crowding
    const sep = calculateSeparation(creature, members, separation);

    // Combine attraction and separation
    let offsetX = 0;
    let offsetY = 0;

    if (centerDist > 0.01) {
      // Normalize and apply strength for cohesion
      offsetX += (towardCenterX / centerDist) * strength * centerDist;
      offsetY += (towardCenterY / centerDist) * strength * centerDist;
    }

    // Add separation (stronger at close range)
    offsetX += sep.x * strength * 2;
    offsetY += sep.y * strength * 2;

    // Store the herding influence
    if (Math.abs(offsetX) > 0.001 || Math.abs(offsetY) > 0.001) {
      herding.targetOffset = { x: offsetX, y: offsetY };
    } else {
      herding.targetOffset = null;
    }
  }
}

/**
 * Gets the herding target offset for a creature.
 * Used by movement system to incorporate herding behavior.
 */
export function getHerdingOffset(creature) {
  return creature?.herding?.targetOffset ?? null;
}

/**
 * Gets the current herd size for a creature.
 */
export function getHerdSize(creature) {
  return creature?.herding?.herdSize ?? 1;
}
