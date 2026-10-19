import { canSeeCreature } from './visibility.js';
import {
  isPredator,
  resolveRegroupEnabled,
  resolveRegroupMinLocalHerdSize,
  resolveRegroupRange,
  resolveRegroupIntervalTicks,
  wrapPi
} from './herding-config.js';

export const findNearbyHerdMembers = (creature, creatures, spatialIndex, range) => {
  const members = [];
  const species = creature.species;
  const x = creature.position.x;
  const y = creature.position.y;
  const myHeading = creature.motion?.heading ?? 0;
  const forwardX = Math.cos(myHeading);
  const forwardY = Math.sin(myHeading);
  const rangeSq = range * range;

  // Use spatial index if available
  if (spatialIndex) {
    const nearby = spatialIndex.queryNearby(x, y, range, {
      exclude: creature,
      filter: (other) => other.species === species && other.position
    });

    for (const { creature: other, distanceSq, dx, dy } of nearby) {
      if (distanceSq <= 0) continue;
      const distance = Math.sqrt(distanceSq);
      const dotProduct = (dx / distance) * forwardX + (dy / distance) * forwardY;
      const forwardWeight = 0.5 + 0.5 * Math.max(0, dotProduct);

      members.push({
        creature: other,
        dx,
        dy,
        distSq: distanceSq,
        distance,
        forwardWeight
      });
    }
  } else {
    // Fall back to linear scan
    for (const other of creatures) {
      if (other === creature || !other?.position) continue;
      if (other.species !== species) continue;

      const dx = other.position.x - x;
      const dy = other.position.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq <= rangeSq && distSq > 0) {
        const distance = Math.sqrt(distSq);
        const dotProduct = (dx / distance) * forwardX + (dy / distance) * forwardY;
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
  }

  return members;
};

export const findNearbyThreats = (creature, creatures, spatialIndex, range, world, config) => {
  const threats = [];
  const x = creature.position.x;
  const y = creature.position.y;
  const rangeSq = range * range;

  // Use spatial index if available
  if (spatialIndex) {
    const nearby = spatialIndex.queryNearby(x, y, range, {
      exclude: creature,
      filter: (other) => isPredator(other.species) && other.position
    });

    for (const { creature: other, distanceSq, dx, dy } of nearby) {
      if (
        distanceSq < 0 ||
        !canSeeCreature(creature, other, world, config, range, creature.herding?.isThreatened)
      )
        continue;
      threats.push({
        creature: other,
        dx,
        dy,
        distSq: distanceSq,
        distance: Math.sqrt(distanceSq)
      });
    }
  } else {
    // Fall back to linear scan
    for (const other of creatures) {
      if (other === creature || !other?.position) continue;
      if (!isPredator(other.species) || other.meters?.hp <= 0) continue;

      const dx = other.position.x - x;
      const dy = other.position.y - y;
      const distSq = dx * dx + dy * dy;
      if (
        distSq <= rangeSq &&
        canSeeCreature(creature, other, world, config, range, creature.herding?.isThreatened)
      ) {
        threats.push({
          creature: other,
          dx,
          dy,
          distSq,
          distance: Math.sqrt(distSq)
        });
      }
    }
  }

  return threats;
};

export const calculateFleeVector = (threats, threatRange) => {
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

export const calculateAlignment = (creature, members) => {
  const myHeading = creature?.motion?.heading ?? 0;
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

export const calculateCohesion = (creature, members, comfortMax, idealDistance) => {
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

  // Graduated cohesion strength based on distance:
  // - Very weak when close (inside idealDistance)
  // - Stronger when far (outside idealDistance, approaching comfortMax)
  // - Maximum strength when beyond comfortMax
  //
  // This creates continuous attraction that:
  // - Doesn't fight separation when very close
  // - Gently maintains herd cohesion at medium distances (the old "dead zone")
  // - Strongly pulls back scattered members

  let strength;
  if (distance <= idealDistance) {
    // Close: very gentle pull (0 to 0.15)
    // This won't overpower separation but provides gentle drift toward center
    strength = (distance / idealDistance) * 0.15;
  } else if (distance <= comfortMax) {
    // Medium (old dead zone): moderate pull (0.15 to 0.5)
    // This is the key fix - now there's attraction in this range
    const ratio = (distance - idealDistance) / (comfortMax - idealDistance);
    strength = 0.15 + ratio * 0.35;
  } else {
    // Far: strong pull (0.5 to 1.0)
    const excessDistance = distance - comfortMax;
    strength = 0.5 + Math.min(0.5, excessDistance / idealDistance);
  }

  return {
    x: (towardX / distance) * strength,
    y: (towardY / distance) * strength
  };
};

export const calculateSeparation = (members, separationDist) => {
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

export const computeRegroupAssist = (creature, creatures, spatialIndex, config) => {
  if (!creature?.position) {
    return null;
  }
  if (!resolveRegroupEnabled(config)) {
    return null;
  }
  if (isPredator(creature.species)) {
    return null;
  }

  const herding = creature.herding;

  // Clear cached regroup if urgent need or threatened (creature has other priorities)
  if (hasUrgentNeed(creature)) {
    if (herding) herding.lastRegroupVector = null;
    return null;
  }
  if (herding?.isThreatened) {
    if (herding) herding.lastRegroupVector = null;
    return null;
  }

  const minLocalHerdSize = resolveRegroupMinLocalHerdSize(config);
  const herdSize = herding?.herdSize ?? 1;

  // Clear cached regroup if creature now has enough herdmates
  if (herdSize >= minLocalHerdSize) {
    if (herding) herding.lastRegroupVector = null;
    return null;
  }

  const intervalTicks = resolveRegroupIntervalTicks(config);
  const ageTicks = Number.isFinite(creature.ageTicks) ? creature.ageTicks : 0;
  const idOffset = Number.isFinite(creature.id) ? creature.id : 0;

  // On non-compute ticks, return the cached regroup vector (if any)
  // This maintains continuous regroup pull instead of pulsing
  if ((ageTicks + idOffset) % intervalTicks !== 0) {
    return herding?.lastRegroupVector ?? null;
  }

  const range = resolveRegroupRange(config);
  if (range <= 0) {
    if (herding) herding.lastRegroupVector = null;
    return null;
  }

  let nearest = null;
  let nearestDistSq = range * range;

  if (spatialIndex) {
    const nearby = spatialIndex.queryNearby(creature.position.x, creature.position.y, range, {
      exclude: creature,
      filter: (other) => other.species === creature.species && other.position
    });

    for (const { distanceSq, dx, dy } of nearby) {
      if (distanceSq <= 0 || distanceSq > nearestDistSq) continue;
      nearest = { dx, dy, distanceSq };
      nearestDistSq = distanceSq;
    }
  } else if (Array.isArray(creatures)) {
    for (const other of creatures) {
      if (other === creature || !other?.position) continue;
      if (other.species !== creature.species) continue;
      const dx = other.position.x - creature.position.x;
      const dy = other.position.y - creature.position.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq <= 0 || distanceSq > nearestDistSq) continue;
      nearest = { dx, dy, distanceSq };
      nearestDistSq = distanceSq;
    }
  }

  if (!nearest) {
    if (herding) herding.lastRegroupVector = null;
    return null;
  }

  const distance = Math.sqrt(nearest.distanceSq);
  if (distance <= 0.001) {
    if (herding) herding.lastRegroupVector = null;
    return null;
  }
  const strength = Math.min(1, Math.max(0.15, distance / range));
  const result = {
    x: (nearest.dx / distance) * strength,
    y: (nearest.dy / distance) * strength
  };

  // Cache the computed vector for persistence
  if (herding) herding.lastRegroupVector = result;

  return result;
};

export const ensureHerdingState = (creature) => {
  if (!creature.herding) {
    creature.herding = {
      herdSize: 0,
      nearbyThreats: 0,
      isThreatened: false,
      targetOffset: null,
      smoothedOffset: { x: 0, y: 0 },
      lastRegroupVector: null, // Cached regroup vector for persistence between compute intervals
      postDrinkRegroupTicks: 0,
      postDrinkRegroupMaxTicks: 0
    };
  }
  return creature.herding;
};

export const clearSmoothedOffset = (herding) => {
  if (!herding) {
    return;
  }
  if (!herding.smoothedOffset) {
    herding.smoothedOffset = { x: 0, y: 0 };
  } else {
    herding.smoothedOffset.x = 0;
    herding.smoothedOffset.y = 0;
  }
};

export const applySmoothedOffset = (herding, rawX, rawY, deadzone, smoothing) => {
  const magnitude = Math.hypot(rawX, rawY);
  const useX = magnitude < deadzone ? 0 : rawX;
  const useY = magnitude < deadzone ? 0 : rawY;
  const alpha = smoothing;
  if (!herding.smoothedOffset) {
    herding.smoothedOffset = { x: 0, y: 0 };
  }
  herding.smoothedOffset.x = herding.smoothedOffset.x * (1 - alpha) + useX * alpha;
  herding.smoothedOffset.y = herding.smoothedOffset.y * (1 - alpha) + useY * alpha;

  const smoothMag = Math.hypot(herding.smoothedOffset.x, herding.smoothedOffset.y);
  if (smoothMag > 0.001) {
    herding.targetOffset = {
      x: herding.smoothedOffset.x,
      y: herding.smoothedOffset.y
    };
  } else {
    herding.targetOffset = null;
    clearSmoothedOffset(herding);
  }
};

export const hasUrgentNeed = (creature) => {
  const intent = creature.intent?.type;
  // These intents mean the creature needs something urgently
  return intent === 'drink' || intent === 'eat' || intent === 'hunt';
};
