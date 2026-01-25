/**
 * Herding Module
 *
 * Implements flocking/herding behavior for herbivore creatures.
 * - Herbivores form loose groups and respond to predator threats
 * - Predators do NOT herd - they patrol and hunt independently
 * - Survival needs (food/water) always take priority over herding
 *
 * Key improvements:
 * - Alignment term: neighbors agree on direction, not just position
 * - Comfort band: inside the band, minimal steering (relaxed herd)
 * - Forward-cone weighting: reduces over-correction to rear neighbors
 */

import { SPECIES } from '../species.js';

/**
 * Predator species - these hunt, they don't herd.
 */
const PREDATOR_SPECIES = new Set([SPECIES.TRIANGLE, SPECIES.OCTAGON]);

/**
 * Checks if a species is a predator.
 */
const isPredator = (species) => PREDATOR_SPECIES.has(species);

/**
 * Resolves herding range from config.
 */
const resolveHerdingRange = (config) =>
  Number.isFinite(config?.creatureHerdingRange) ? Math.max(0, config.creatureHerdingRange) : 10;

/**
 * Resolves threat detection range from config.
 */
const resolveThreatRange = (config) =>
  Number.isFinite(config?.creatureHerdingThreatRange)
    ? Math.max(0, config.creatureHerdingThreatRange)
    : 12;

/**
 * Resolves base herding strength (very weak for loose grouping).
 */
const resolveHerdingStrength = (config) =>
  Number.isFinite(config?.creatureHerdingStrength)
    ? Math.max(0, Math.min(1, config.creatureHerdingStrength))
    : 0.03;

/**
 * Resolves alignment strength relative to base herding strength.
 */
const resolveAlignmentStrength = (config) =>
  Number.isFinite(config?.creatureHerdingAlignmentStrength)
    ? Math.max(0, Math.min(1, config.creatureHerdingAlignmentStrength))
    : 0.4;

/**
 * Resolves threat response strength (how fast to flee).
 */
const resolveThreatStrength = (config) =>
  Number.isFinite(config?.creatureHerdingThreatStrength)
    ? Math.max(0, Math.min(1, config.creatureHerdingThreatStrength))
    : 0.4;

/**
 * Resolves minimum herd size for herding behavior to activate.
 */
const resolveHerdingMinGroupSize = (config) =>
  Number.isFinite(config?.creatureHerdingMinGroupSize)
    ? Math.max(1, Math.trunc(config.creatureHerdingMinGroupSize))
    : 2;

/**
 * Resolves preferred separation distance (personal space).
 */
const resolveHerdingSeparation = (config) =>
  Number.isFinite(config?.creatureHerdingSeparation)
    ? Math.max(0, config.creatureHerdingSeparation)
    : 2.5;

/**
 * Resolves comfort band min (same as separation, inside = no steering).
 */
const resolveComfortMin = (config) =>
  Number.isFinite(config?.creatureHerdingComfortMin)
    ? Math.max(0, config.creatureHerdingComfortMin)
    : 2.0;

/**
 * Resolves comfort band max (outside this, cohesion kicks in).
 */
const resolveComfortMax = (config) =>
  Number.isFinite(config?.creatureHerdingComfortMax)
    ? Math.max(0, config.creatureHerdingComfortMax)
    : 4.5;

/**
 * Resolves ideal herd distance (how far apart to stay normally).
 */
const resolveIdealDistance = (config) =>
  Number.isFinite(config?.creatureHerdingIdealDistance)
    ? Math.max(0, config.creatureHerdingIdealDistance)
    : 4;

/**
 * Checks if herding is enabled.
 */
const isHerdingEnabled = (config) => config?.creatureHerdingEnabled !== false;

/**
 * Wraps an angle to the range [-PI, PI].
 */
const wrapPi = (angle) => {
  let a = angle % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
};

/**
 * Finds nearby creatures of the same species (potential herd members).
 * Includes forward-cone weighting to reduce over-correction to rear neighbors.
 */
const findNearbyHerdMembers = (creature, creatures, rangeSq) => {
  const members = [];
  const species = creature.species;
  const x = creature.position.x;
  const y = creature.position.y;
  const myHeading = creature.motion?.heading ?? 0;
  const forwardX = Math.cos(myHeading);
  const forwardY = Math.sin(myHeading);

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
      const distance = Math.sqrt(distSq);
      // Forward-cone weight: neighbors in front have more influence
      const dotProduct = (dx / distance) * forwardX + (dy / distance) * forwardY;
      // dotProduct is -1 (behind) to +1 (ahead)
      // Weight: 0.5 for behind, 1.0 for ahead
      const forwardWeight = 0.5 + 0.5 * Math.max(0, dotProduct);

      members.push({
        creature: other,
        dx,
        dy,
        distSq,
        distance,
        forwardWeight
      });
    }
  }

  return members;
};

/**
 * Finds nearby predators (threats).
 */
const findNearbyThreats = (creature, creatures, rangeSq) => {
  const threats = [];
  const x = creature.position.x;
  const y = creature.position.y;

  for (const other of creatures) {
    if (other === creature || !other?.position) {
      continue;
    }
    if (!isPredator(other.species)) {
      continue;
    }
    const dx = other.position.x - x;
    const dy = other.position.y - y;
    const distSq = dx * dx + dy * dy;
    if (distSq <= rangeSq && distSq > 0) {
      threats.push({
        creature: other,
        dx,
        dy,
        distSq,
        distance: Math.sqrt(distSq)
      });
    }
  }

  return threats;
};

/**
 * Calculates flee vector away from threats.
 * Closer threats have stronger influence.
 */
const calculateFleeVector = (threats, threatRange) => {
  if (threats.length === 0) {
    return null;
  }

  let fleeX = 0;
  let fleeY = 0;

  for (const threat of threats) {
    // Strength inversely proportional to distance (closer = stronger)
    const strength = 1 - threat.distance / threatRange;
    const strengthSq = strength * strength; // Quadratic falloff

    // Direction away from threat
    fleeX -= (threat.dx / threat.distance) * strengthSq;
    fleeY -= (threat.dy / threat.distance) * strengthSq;
  }

  const magnitude = Math.sqrt(fleeX * fleeX + fleeY * fleeY);
  if (magnitude < 0.001) {
    return null;
  }

  // Normalize
  return {
    x: fleeX / magnitude,
    y: fleeY / magnitude,
    magnitude
  };
};

/**
 * Calculates alignment vector (average heading of neighbors).
 * Only considers neighbors moving in a roughly similar direction (within 90°).
 */
const calculateAlignment = (creature, members) => {
  const myHeading = creature.motion?.heading ?? 0;
  let ax = 0;
  let ay = 0;
  let totalWeight = 0;

  for (const m of members) {
    const h = m.creature?.motion?.heading;
    if (!Number.isFinite(h)) continue;

    // Only align with neighbors moving "roughly same direction" (within 90°)
    const angleDiff = Math.abs(wrapPi(h - myHeading));
    if (angleDiff > Math.PI / 2) continue;

    // Weight by forward-cone (neighbors ahead matter more)
    const weight = m.forwardWeight;
    ax += Math.cos(h) * weight;
    ay += Math.sin(h) * weight;
    totalWeight += weight;
  }

  if (totalWeight < 0.5) return null; // Need meaningful aligned neighbors

  const mag = Math.hypot(ax, ay);
  if (mag < 1e-6) return null;

  return {
    x: ax / mag,
    y: ay / mag
  };
};

/**
 * Calculates gentle cohesion toward herd center.
 * Only pulls if creature is outside the comfort band.
 */
const calculateCohesion = (creature, members, comfortMax, idealDistance) => {
  if (members.length === 0) {
    return null;
  }

  // Calculate weighted center of nearby herd members
  let sumX = 0;
  let sumY = 0;
  let totalWeight = 0;
  for (const member of members) {
    const weight = member.forwardWeight;
    sumX += member.creature.position.x * weight;
    sumY += member.creature.position.y * weight;
    totalWeight += weight;
  }
  if (totalWeight < 0.1) return null;

  const centerX = sumX / totalWeight;
  const centerY = sumY / totalWeight;

  // Direction and distance to center
  const towardX = centerX - creature.position.x;
  const towardY = centerY - creature.position.y;
  const distance = Math.sqrt(towardX * towardX + towardY * towardY);

  if (distance < 0.01) {
    return null;
  }

  // Only apply cohesion if we're outside comfort band
  if (distance <= comfortMax) {
    return null; // Inside comfort band, no cohesion needed
  }

  // Strength increases as we get farther from comfort band
  const excessDistance = distance - comfortMax;
  const strength = Math.min(1, excessDistance / idealDistance);

  return {
    x: (towardX / distance) * strength,
    y: (towardY / distance) * strength
  };
};

/**
 * Calculates separation to maintain personal space.
 */
const calculateSeparation = (members, separationDist) => {
  let sepX = 0;
  let sepY = 0;
  let count = 0;

  for (const member of members) {
    if (member.distance < separationDist && member.distance > 0.01) {
      // Push away from nearby creatures
      const strength = 1 - member.distance / separationDist;
      // Weight by forward-cone (but inverted - rear neighbors push harder)
      const weight = 2 - member.forwardWeight;
      sepX -= (member.dx / member.distance) * strength * weight;
      sepY -= (member.dy / member.distance) * strength * weight;
      count += 1;
    }
  }

  if (count === 0) {
    return null;
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
      nearbyThreats: 0,
      isThreatened: false,
      targetOffset: null
    };
  }
  return creature.herding;
};

/**
 * Checks if creature has an urgent survival need.
 * Herding should NEVER override these.
 */
const hasUrgentNeed = (creature) => {
  const intent = creature.intent?.type;
  // These intents mean the creature needs something urgently
  return (
    intent === 'drink' ||
    intent === 'eat' ||
    intent === 'seek' ||
    intent === 'hunt' ||
    intent === 'mate'
  );
};

/**
 * Updates herding behavior for all creatures.
 * - Only herbivores herd
 * - Predators patrol independently
 * - Survival needs always take priority
 */
export function updateCreatureHerding({ creatures, config }) {
  if (!Array.isArray(creatures)) {
    return;
  }

  if (!isHerdingEnabled(config)) {
    return;
  }

  const herdRange = resolveHerdingRange(config);
  const herdRangeSq = herdRange * herdRange;
  const threatRange = resolveThreatRange(config);
  const threatRangeSq = threatRange * threatRange;
  const baseStrength = resolveHerdingStrength(config);
  const alignmentStrength = resolveAlignmentStrength(config);
  const threatStrength = resolveThreatStrength(config);
  const minGroupSize = resolveHerdingMinGroupSize(config);
  const separation = resolveHerdingSeparation(config);
  const _comfortMin = resolveComfortMin(config); // Reserved for future comfort band logic
  const comfortMax = resolveComfortMax(config);
  const idealDistance = resolveIdealDistance(config);

  for (const creature of creatures) {
    if (!creature?.position) {
      continue;
    }

    const herding = ensureHerdingState(creature);

    // Predators don't herd - they hunt
    if (isPredator(creature.species)) {
      herding.herdSize = 1;
      herding.nearbyThreats = 0;
      herding.isThreatened = false;
      herding.targetOffset = null;
      continue;
    }

    // Find nearby herd members and threats
    const members = findNearbyHerdMembers(creature, creatures, herdRangeSq);
    const threats = findNearbyThreats(creature, creatures, threatRangeSq);

    herding.herdSize = members.length + 1;
    herding.nearbyThreats = threats.length;
    herding.isThreatened = threats.length > 0;

    // If creature has urgent survival needs, don't apply herding
    // Let them go get food/water
    if (hasUrgentNeed(creature)) {
      herding.targetOffset = null;
      continue;
    }

    let offsetX = 0;
    let offsetY = 0;
    let hasOffset = false;

    // THREAT RESPONSE: Flee from predators (highest priority for wandering herbivores)
    if (threats.length > 0) {
      const fleeVector = calculateFleeVector(threats, threatRange);
      if (fleeVector) {
        offsetX += fleeVector.x * threatStrength * fleeVector.magnitude;
        offsetY += fleeVector.y * threatStrength * fleeVector.magnitude;
        hasOffset = true;
      }
    }

    // SEPARATION: Maintain personal space (always applies)
    const sep = calculateSeparation(members, separation);
    if (sep) {
      // Separation is stronger than cohesion
      offsetX += sep.x * baseStrength * 3;
      offsetY += sep.y * baseStrength * 3;
      hasOffset = true;
    }

    // ALIGNMENT: Match neighbors' heading (only if enough members)
    if (members.length >= minGroupSize - 1) {
      const align = calculateAlignment(creature, members);
      if (align) {
        // Alignment strength increases when threatened (tighten and align)
        const alignMult = threats.length > 0 ? alignmentStrength * 1.5 : alignmentStrength;
        offsetX += align.x * baseStrength * alignMult;
        offsetY += align.y * baseStrength * alignMult;
        hasOffset = true;
      }
    }

    // COHESION: Gentle pull toward herd (only if enough members and outside comfort band)
    if (members.length >= minGroupSize - 1) {
      // When threatened, tighten up (reduce comfort band)
      const adjustedComfortMax = threats.length > 0 ? comfortMax * 0.7 : comfortMax;
      const cohesion = calculateCohesion(creature, members, adjustedComfortMax, idealDistance);
      if (cohesion) {
        offsetX += cohesion.x * baseStrength;
        offsetY += cohesion.y * baseStrength;
        hasOffset = true;
      }
    }

    // Store result
    if (hasOffset && (Math.abs(offsetX) > 0.001 || Math.abs(offsetY) > 0.001)) {
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

/**
 * Checks if creature is currently threatened by predators.
 */
export function isThreatened(creature) {
  return creature?.herding?.isThreatened ?? false;
}
