/**
 * Simple Herding Module
 *
 * A clean, minimal herding system using only the three classic boid rules:
 * 1. Separation - Push away from neighbors within separation radius
 * 2. Alignment - Match average heading of neighbors within alignment radius
 * 3. Cohesion - Steer toward center of neighbors within cohesion radius
 *
 * Plus threat propagation: when any herd member spots a predator,
 * nearby members also become alert and flee.
 *
 * This system is designed to be simple, predictable, and under 200 lines.
 * It replaces the complex herding.js when creatureHerdingSimpleMode is enabled.
 */

import { SPECIES } from '../species.js';

const PREDATOR_SPECIES = new Set([SPECIES.TRIANGLE, SPECIES.OCTAGON]);
const HERBIVORE_SPECIES = new Set([SPECIES.SQUARE, SPECIES.CIRCLE]);

const isPredator = (species) => PREDATOR_SPECIES.has(species);
const isHerbivore = (species) => HERBIVORE_SPECIES.has(species);

const clamp01 = (v) => Math.min(1, Math.max(0, v));

/**
 * Wraps an angle to [-PI, PI].
 */
const wrapPi = (angle) => {
  let a = angle % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
};

// ============================================================================
// CONFIG RESOLVERS
// ============================================================================

const resolveSimpleHerdingEnabled = (config) =>
  config?.creatureHerdingSimpleMode !== false;

const resolveSeparationRadius = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingSeparationRadius)
    ? Math.max(0.5, config.creatureSimpleHerdingSeparationRadius)
    : 2.5;

const resolveAlignmentRadius = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingAlignmentRadius)
    ? Math.max(1, config.creatureSimpleHerdingAlignmentRadius)
    : 7;

const resolveCohesionRadius = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingCohesionRadius)
    ? Math.max(1, config.creatureSimpleHerdingCohesionRadius)
    : 11;

const resolveSeparationStrength = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingSeparationStrength)
    ? Math.max(0, Math.min(2, config.creatureSimpleHerdingSeparationStrength))
    : 1.2;

const resolveAlignmentStrength = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingAlignmentStrength)
    ? Math.max(0, Math.min(2, config.creatureSimpleHerdingAlignmentStrength))
    : 0.8;

const resolveCohesionStrength = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingCohesionStrength)
    ? Math.max(0, Math.min(2, config.creatureSimpleHerdingCohesionStrength))
    : 0.5;

const resolveThreatRange = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingThreatRange)
    ? Math.max(1, config.creatureSimpleHerdingThreatRange)
    : 12;

const resolveThreatStrength = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingThreatStrength)
    ? Math.max(0, Math.min(2, config.creatureSimpleHerdingThreatStrength))
    : 1.5;

const resolveThreatPropagationRadius = (config) =>
  Number.isFinite(config?.creatureThreatPropagationRadius)
    ? Math.max(1, config.creatureThreatPropagationRadius)
    : 9;

const resolveThreatPropagationHops = (config) =>
  Number.isFinite(config?.creatureThreatPropagationHops)
    ? Math.max(0, Math.trunc(config.creatureThreatPropagationHops))
    : 2;

const resolveThreatDecayTicks = (config) => {
  const tps = Number.isFinite(config?.ticksPerSecond) ? config.ticksPerSecond : 60;
  const seconds = Number.isFinite(config?.creatureThreatDecaySeconds)
    ? Math.max(0, config.creatureThreatDecaySeconds)
    : 2.0;
  return Math.max(1, Math.floor(seconds * tps));
};

const resolveHerdingBlend = (config) =>
  Number.isFinite(config?.creatureHerdingHeadingBlend)
    ? Math.max(0, Math.min(1, config.creatureHerdingHeadingBlend))
    : 0.5;

const resolveOffsetSmoothing = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingSmoothing)
    ? Math.max(0, Math.min(1, config.creatureSimpleHerdingSmoothing))
    : 0.3;

// ============================================================================
// HERD MOVEMENT WAVES CONFIG RESOLVERS
// ============================================================================

const resolveMovementContagionRadius = (config) =>
  Number.isFinite(config?.creatureHerdMovementContagionRadius)
    ? Math.max(1, config.creatureHerdMovementContagionRadius)
    : 6;

const resolveMovementContagionDelay = (config) => {
  const tps = Number.isFinite(config?.ticksPerSecond) ? config.ticksPerSecond : 60;
  const seconds = Number.isFinite(config?.creatureHerdMovementContagionDelay)
    ? Math.max(0, config.creatureHerdMovementContagionDelay)
    : 0.3;
  return Math.max(1, Math.floor(seconds * tps));
};

const resolveMovementContagionChance = (config) =>
  Number.isFinite(config?.creatureHerdMovementContagionChance)
    ? Math.max(0, Math.min(1, config.creatureHerdMovementContagionChance))
    : 0.4;

const resolveLeadershipDecay = (config) =>
  Number.isFinite(config?.creatureHerdLeadershipDecay)
    ? Math.max(0, Math.min(1, config.creatureHerdLeadershipDecay))
    : 0.02;

// ============================================================================
// CORE BOID FORCES
// ============================================================================

/**
 * Calculates separation force - push away from too-close neighbors.
 */
const calculateSeparation = (creature, neighbors, separationRadius) => {
  let fx = 0;
  let fy = 0;
  let count = 0;

  for (const neighbor of neighbors) {
    if (neighbor.distance < separationRadius && neighbor.distance > 0.01) {
      // Push away, strength inversely proportional to distance
      const strength = 1 - neighbor.distance / separationRadius;
      fx -= (neighbor.dx / neighbor.distance) * strength;
      fy -= (neighbor.dy / neighbor.distance) * strength;
      count++;
    }
  }

  if (count === 0) return null;

  const mag = Math.hypot(fx, fy);
  if (mag < 0.001) return null;

  return { x: fx / mag, y: fy / mag };
};

/**
 * Calculates alignment force - match average heading of nearby neighbors.
 * Weights neighbors ahead more heavily than those behind.
 */
const calculateAlignment = (creature, neighbors, alignmentRadius) => {
  const myHeading = creature.motion?.heading ?? 0;
  const myDirX = Math.cos(myHeading);
  const myDirY = Math.sin(myHeading);

  let sumX = 0;
  let sumY = 0;
  let totalWeight = 0;

  for (const neighbor of neighbors) {
    if (neighbor.distance > alignmentRadius || neighbor.distance < 0.01) continue;

    const nHeading = neighbor.creature.motion?.heading;
    if (!Number.isFinite(nHeading)) continue;

    // Forward cone weighting: neighbors ahead matter more
    const dotProduct = (neighbor.dx / neighbor.distance) * myDirX +
                       (neighbor.dy / neighbor.distance) * myDirY;
    const forwardWeight = 0.5 + 0.5 * Math.max(0, dotProduct);

    // Distance falloff
    const distWeight = 1 - neighbor.distance / alignmentRadius;
    const weight = forwardWeight * distWeight;

    sumX += Math.cos(nHeading) * weight;
    sumY += Math.sin(nHeading) * weight;
    totalWeight += weight;
  }

  if (totalWeight < 0.3) return null;

  const mag = Math.hypot(sumX, sumY);
  if (mag < 0.001) return null;

  return { x: sumX / mag, y: sumY / mag };
};

/**
 * Calculates cohesion force - steer toward center of neighbors.
 */
const calculateCohesion = (creature, neighbors, cohesionRadius) => {
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (const neighbor of neighbors) {
    if (neighbor.distance > cohesionRadius || neighbor.distance < 0.01) continue;
    sumX += neighbor.creature.position.x;
    sumY += neighbor.creature.position.y;
    count++;
  }

  if (count === 0) return null;

  const centerX = sumX / count;
  const centerY = sumY / count;
  const dx = centerX - creature.position.x;
  const dy = centerY - creature.position.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 0.5) return null; // Already at center

  return { x: dx / dist, y: dy / dist };
};

/**
 * Calculates flee vector from threats.
 */
const calculateFlee = (creature, threats, threatRange) => {
  let fx = 0;
  let fy = 0;

  for (const threat of threats) {
    if (threat.distance < 0.01) continue;
    // Quadratic falloff - closer threats are much stronger
    const strength = Math.pow(1 - threat.distance / threatRange, 2);
    fx -= (threat.dx / threat.distance) * strength;
    fy -= (threat.dy / threat.distance) * strength;
  }

  const mag = Math.hypot(fx, fy);
  if (mag < 0.001) return null;

  return { x: fx / mag, y: fy / mag, magnitude: Math.min(1, mag) };
};

// ============================================================================
// NEIGHBOR FINDING
// ============================================================================

/**
 * Finds nearby creatures of the same species.
 */
const findNeighbors = (creature, creatures, maxRange, spatialIndex) => {
  const neighbors = [];
  const x = creature.position.x;
  const y = creature.position.y;
  const species = creature.species;
  const rangeSq = maxRange * maxRange;

  if (spatialIndex && spatialIndex.creatureCount > 0) {
    const nearby = spatialIndex.queryNearby(x, y, maxRange, {
      exclude: creature,
      filter: (other) => other.species === species && other.position
    });

    for (const { creature: other, distanceSq, dx, dy } of nearby) {
      if (distanceSq <= 0) continue;
      neighbors.push({
        creature: other,
        dx,
        dy,
        distance: Math.sqrt(distanceSq)
      });
    }
  } else {
    for (const other of creatures) {
      if (other === creature || !other?.position) continue;
      if (other.species !== species) continue;

      const dx = other.position.x - x;
      const dy = other.position.y - y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= rangeSq && distSq > 0) {
        neighbors.push({
          creature: other,
          dx,
          dy,
          distance: Math.sqrt(distSq)
        });
      }
    }
  }

  return neighbors;
};

/**
 * Finds nearby predators (threats).
 */
const findThreats = (creature, creatures, threatRange, spatialIndex) => {
  const threats = [];
  const x = creature.position.x;
  const y = creature.position.y;
  const rangeSq = threatRange * threatRange;

  if (spatialIndex && spatialIndex.creatureCount > 0) {
    const nearby = spatialIndex.queryNearby(x, y, threatRange, {
      exclude: creature,
      filter: (other) => isPredator(other.species) && other.position
    });

    for (const { creature: other, distanceSq, dx, dy } of nearby) {
      if (distanceSq <= 0) continue;
      threats.push({
        creature: other,
        dx,
        dy,
        distance: Math.sqrt(distanceSq)
      });
    }
  } else {
    for (const other of creatures) {
      if (other === creature || !other?.position) continue;
      if (!isPredator(other.species)) continue;

      const dx = other.position.x - x;
      const dy = other.position.y - y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= rangeSq && distSq > 0) {
        threats.push({
          creature: other,
          dx,
          dy,
          distance: Math.sqrt(distSq)
        });
      }
    }
  }

  return threats;
};

// ============================================================================
// HERDING STATE
// ============================================================================

const ensureHerdingState = (creature) => {
  if (!creature.herding) {
    creature.herding = {
      herdSize: 1,
      nearbyThreats: 0,
      isThreatened: false,
      targetOffset: null,
      smoothedOffset: { x: 0, y: 0 },
      herdHeading: null,
      threatDirection: null,
      threatHops: 0,
      threatDecayTicks: 0,
      // Movement wave tracking
      isMoving: false,
      movingTicksCounter: 0,
      contagionDelayTicks: 0,
      localLeaderId: null,
      leadershipScore: 0
    };
  }
  return creature.herding;
};

// ============================================================================
// MAIN UPDATE FUNCTION
// ============================================================================

/**
 * Updates simple herding behavior for all creatures.
 * Uses only separation, alignment, and cohesion forces.
 */
export function updateCreatureHerdingSimple({ creatures, config, spatialIndex }) {
  if (!Array.isArray(creatures)) return;
  if (!resolveSimpleHerdingEnabled(config)) return;

  // Resolve config
  const separationRadius = resolveSeparationRadius(config);
  const alignmentRadius = resolveAlignmentRadius(config);
  const cohesionRadius = resolveCohesionRadius(config);
  const maxRange = Math.max(separationRadius, alignmentRadius, cohesionRadius);

  const separationStrength = resolveSeparationStrength(config);
  const alignmentStrength = resolveAlignmentStrength(config);
  const cohesionStrength = resolveCohesionStrength(config);

  const threatRange = resolveThreatRange(config);
  const threatStrength = resolveThreatStrength(config);
  const threatPropRadius = resolveThreatPropagationRadius(config);
  const threatPropHops = resolveThreatPropagationHops(config);
  const threatDecayTicks = resolveThreatDecayTicks(config);

  const herdingBlend = resolveHerdingBlend(config);
  const smoothing = resolveOffsetSmoothing(config);

  // First pass: detect direct threats and calculate personal flee directions
  for (const creature of creatures) {
    if (!creature?.position) continue;

    const herding = ensureHerdingState(creature);

    // Predators don't herd
    if (isPredator(creature.species)) {
      herding.herdSize = 1;
      herding.nearbyThreats = 0;
      herding.isThreatened = false;
      herding.targetOffset = null;
      herding.threatDirection = null;
      herding.threatHops = 0;
      continue;
    }

    // Find direct threats
    const threats = findThreats(creature, creatures, threatRange, spatialIndex);
    herding.nearbyThreats = threats.length;

    // Decay threat state
    if (herding.threatDecayTicks > 0) {
      herding.threatDecayTicks--;
    }

    if (threats.length > 0) {
      // Direct threat detected
      const flee = calculateFlee(creature, threats, threatRange);
      herding.isThreatened = true;
      herding.threatDirection = flee;
      herding.threatHops = 0;
      herding.threatDecayTicks = threatDecayTicks;
    } else if (herding.threatDecayTicks <= 0) {
      // No threat and decay expired
      herding.isThreatened = false;
      herding.threatDirection = null;
      herding.threatHops = 0;
    }
  }

  // Second pass: propagate threat awareness through herd
  if (threatPropHops > 0) {
    for (let hop = 0; hop < threatPropHops; hop++) {
      for (const creature of creatures) {
        if (!creature?.position || isPredator(creature.species)) continue;

        const herding = creature.herding;
        if (!herding || herding.isThreatened) continue;

        // Check if any nearby herdmate is threatened
        const neighbors = findNeighbors(creature, creatures, threatPropRadius, spatialIndex);

        for (const neighbor of neighbors) {
          const nHerding = neighbor.creature.herding;
          if (!nHerding?.isThreatened) continue;
          if (nHerding.threatHops >= threatPropHops) continue;

          // Propagate threat
          herding.isThreatened = true;
          herding.threatHops = (nHerding.threatHops ?? 0) + 1;
          herding.threatDecayTicks = threatDecayTicks;

          // Inherit threat direction from most-threatened neighbor
          if (nHerding.threatDirection) {
            herding.threatDirection = { ...nHerding.threatDirection };
          }
          break;
        }
      }
    }
  }

  // Third pass: calculate herding forces
  for (const creature of creatures) {
    if (!creature?.position || isPredator(creature.species)) continue;

    const herding = ensureHerdingState(creature);

    // Skip if creature has urgent needs
    const intent = creature.intent?.type;
    if (intent === 'drink' || intent === 'eat' || intent === 'hunt') {
      herding.targetOffset = null;
      continue;
    }

    // Find neighbors
    const neighbors = findNeighbors(creature, creatures, maxRange, spatialIndex);
    herding.herdSize = neighbors.length + 1;

    let offsetX = 0;
    let offsetY = 0;
    let hasOffset = false;

    // If threatened, flee takes priority
    if (herding.isThreatened && herding.threatDirection) {
      offsetX = herding.threatDirection.x * threatStrength;
      offsetY = herding.threatDirection.y * threatStrength;
      hasOffset = true;

      // Also align with fleeing neighbors (stampede effect)
      const alignment = calculateAlignment(creature, neighbors, alignmentRadius);
      if (alignment) {
        offsetX += alignment.x * alignmentStrength * 0.5;
        offsetY += alignment.y * alignmentStrength * 0.5;
      }
    } else {
      // Normal herding: separation + alignment + cohesion
      const separation = calculateSeparation(creature, neighbors, separationRadius);
      if (separation) {
        offsetX += separation.x * separationStrength;
        offsetY += separation.y * separationStrength;
        hasOffset = true;
      }

      const alignment = calculateAlignment(creature, neighbors, alignmentRadius);
      if (alignment) {
        offsetX += alignment.x * alignmentStrength;
        offsetY += alignment.y * alignmentStrength;
        hasOffset = true;

        // Store herd heading for movement blending
        herding.herdHeading = Math.atan2(alignment.y, alignment.x);
      }

      const cohesion = calculateCohesion(creature, neighbors, cohesionRadius);
      if (cohesion) {
        offsetX += cohesion.x * cohesionStrength;
        offsetY += cohesion.y * cohesionStrength;
        hasOffset = true;
      }
    }

    // Apply smoothing
    if (hasOffset) {
      const prevX = herding.smoothedOffset?.x ?? 0;
      const prevY = herding.smoothedOffset?.y ?? 0;
      const smoothedX = prevX + (offsetX - prevX) * smoothing;
      const smoothedY = prevY + (offsetY - prevY) * smoothing;

      herding.smoothedOffset = { x: smoothedX, y: smoothedY };

      const mag = Math.hypot(smoothedX, smoothedY);
      if (mag > 0.01) {
        herding.targetOffset = { x: smoothedX, y: smoothedY };
      } else {
        herding.targetOffset = null;
      }
    } else {
      // Decay smoothed offset
      if (herding.smoothedOffset) {
        herding.smoothedOffset.x *= 0.9;
        herding.smoothedOffset.y *= 0.9;
        const mag = Math.hypot(herding.smoothedOffset.x, herding.smoothedOffset.y);
        if (mag < 0.01) {
          herding.targetOffset = null;
        } else {
          herding.targetOffset = { ...herding.smoothedOffset };
        }
      }
    }
  }

  // Fourth pass: Movement waves and soft leadership
  const contagionRadius = resolveMovementContagionRadius(config);
  const contagionDelay = resolveMovementContagionDelay(config);
  const contagionChance = resolveMovementContagionChance(config);
  const leadershipDecay = resolveLeadershipDecay(config);

  for (const creature of creatures) {
    if (!creature?.position || isPredator(creature.species)) continue;

    const herding = creature.herding;
    if (!herding) continue;

    // Track movement state
    const behaviorPhase = creature.behaviorState?.phase;
    const isCurrentlyMoving = behaviorPhase !== 'paused' && behaviorPhase !== 'adjusting';

    if (isCurrentlyMoving && !herding.isMoving) {
      // Just started moving
      herding.isMoving = true;
      herding.movingTicksCounter = 0;
    } else if (!isCurrentlyMoving && herding.isMoving) {
      // Just stopped moving
      herding.isMoving = false;
      herding.movingTicksCounter = 0;
    } else if (herding.isMoving) {
      herding.movingTicksCounter++;
    }

    // Update leadership score (longer moving = higher score)
    if (herding.isMoving) {
      herding.leadershipScore = Math.min(1, herding.leadershipScore + 0.01);
    } else {
      herding.leadershipScore = Math.max(0, herding.leadershipScore - leadershipDecay);
    }

    // Decay contagion delay
    if (herding.contagionDelayTicks > 0) {
      herding.contagionDelayTicks--;
    }
  }

  // Fifth pass: Propagate movement contagion and identify local leaders
  for (const creature of creatures) {
    if (!creature?.position || isPredator(creature.species)) continue;

    const herding = creature.herding;
    if (!herding) continue;

    // Skip if creature is currently moving (no need for contagion)
    if (herding.isMoving) continue;

    // Skip if threatened (different behavior applies)
    if (herding.isThreatened) continue;

    // Find nearby creatures
    const neighbors = findNeighbors(creature, creatures, contagionRadius, null);
    if (neighbors.length === 0) continue;

    // Find local leader (highest leadership score)
    let leader = null;
    let leaderScore = 0;
    let movingNeighborCount = 0;

    for (const neighbor of neighbors) {
      const nHerding = neighbor.creature.herding;
      if (!nHerding) continue;

      if (nHerding.isMoving) {
        movingNeighborCount++;
      }

      if (nHerding.leadershipScore > leaderScore) {
        leaderScore = nHerding.leadershipScore;
        leader = neighbor.creature;
      }
    }

    herding.localLeaderId = leader?.id ?? null;

    // Movement contagion: if nearby creatures are moving, maybe start moving too
    if (movingNeighborCount > 0 && herding.contagionDelayTicks <= 0) {
      // Probability increases with more moving neighbors
      const probability = contagionChance * Math.min(1, movingNeighborCount / 3);
      // This flag can be read by behavior-state.js to trigger movement
      herding.shouldStartMoving = Math.random() < probability;
      if (herding.shouldStartMoving) {
        herding.contagionDelayTicks = contagionDelay;
      }
    }
  }
}

/**
 * Gets the herding target offset for a creature.
 */
export function getHerdingOffsetSimple(creature) {
  return creature?.herding?.targetOffset ?? null;
}

/**
 * Gets the herd heading for blending with creature's own heading.
 */
export function getHerdHeading(creature) {
  return creature?.herding?.herdHeading ?? null;
}

/**
 * Checks if creature is threatened (directly or by propagation).
 */
export function isThreatenedSimple(creature) {
  return creature?.herding?.isThreatened ?? false;
}

/**
 * Gets the current herd size for a creature.
 */
export function getHerdSizeSimple(creature) {
  return creature?.herding?.herdSize ?? 1;
}

/**
 * Gets the local leader for a creature's herd cluster.
 */
export function getLocalLeaderId(creature) {
  return creature?.herding?.localLeaderId ?? null;
}

/**
 * Checks if creature should start moving due to movement contagion.
 */
export function shouldStartMoving(creature) {
  const should = creature?.herding?.shouldStartMoving ?? false;
  // Clear the flag after reading
  if (creature?.herding) {
    creature.herding.shouldStartMoving = false;
  }
  return should;
}

/**
 * Gets the leadership score for a creature.
 */
export function getLeadershipScore(creature) {
  return creature?.herding?.leadershipScore ?? 0;
}
