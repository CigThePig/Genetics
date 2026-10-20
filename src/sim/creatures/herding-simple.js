import { computeRegroupAssist } from './herding-forces.js';
import {
  resolveRegroupStrength,
  resolvePostDrinkRegroupAnchorBoost,
  resolvePostDrinkRegroupMaxTicks
} from './herding-config.js';
import {
  isPredator,
  resolveSimpleHerdingEnabled,
  resolveSeparationRadius,
  resolveAlignmentRadius,
  resolveCohesionRadius,
  resolveSeparationStrength,
  resolveAlignmentStrength,
  resolveCohesionStrength,
  resolveThreatRange,
  resolveThreatStrength,
  resolveThreatPropagationRadius,
  resolveThreatPropagationHops,
  resolveThreatDecayTicks,
  resolveOffsetSmoothing,
  resolveMovementContagionRadius,
  resolveMovementContagionDelay,
  resolveMovementContagionChance,
  resolveLeadershipDecay,
  calculateSeparation,
  calculateAlignment,
  calculateCohesion,
  calculateFlee,
  findNeighbors,
  findThreats,
  ensureHerdingState
} from './herding-simple-helpers.js';

export function updateCreatureHerdingSimple({ creatures, config, spatialIndex, rng, world }) {
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

  const smoothing = resolveOffsetSmoothing(config);
  const regroupStrength = resolveRegroupStrength(config);
  const postDrinkBoost = resolvePostDrinkRegroupAnchorBoost(config);
  const postDrinkMaxTicks = resolvePostDrinkRegroupMaxTicks(config);

  // First pass: detect direct threats and calculate personal flee directions
  for (const creature of creatures) {
    if (!creature?.position) continue;

    const herding = ensureHerdingState(creature);

    herding.postDrinkRegroupTicks = Math.max(0, (herding.postDrinkRegroupTicks ?? 0) - 1);
    herding.postDrinkRegroupMaxTicks = postDrinkMaxTicks;

    // Predators don't herd
    if (isPredator(creature.species)) {
      herding.herdSize = 1;
      herding.nearbyThreats = 0;
      herding.nearestThreatDistance = null;
      herding.isThreatened = false;
      herding.targetOffset = null;
      herding.threatDirection = null;
      herding.threatHops = 0;
      continue;
    }

    // Find direct threats
    const threats = findThreats(creature, creatures, threatRange, spatialIndex, world, config);
    herding.nearbyThreats = threats.length;
    herding.nearestThreatDistance = threats.length
      ? Math.min(...threats.map((threat) => threat.distance))
      : null;

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
    herding.herdHeading = null;
    if (!herding.isThreatened && (intent === 'drink' || intent === 'eat' || intent === 'hunt')) {
      herding.lastRegroupVector = null;
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

    // Long-range regroup is shared by both herd modes; local cohesion alone
    // cannot bring a creature back once it is outside the neighbor radius.
    const regroup = computeRegroupAssist(creature, creatures, spatialIndex, config);
    if (regroup) {
      const ratio =
        postDrinkMaxTicks > 0 ? Math.min(1, herding.postDrinkRegroupTicks / postDrinkMaxTicks) : 0;
      const strength = regroupStrength + postDrinkBoost * 0.15 * ratio;
      offsetX += regroup.x * strength;
      offsetY += regroup.y * strength;
      hasOffset = true;
    }

    // Apply smoothing
    if (hasOffset) {
      const prevX = herding.smoothedOffset?.x ?? 0;
      const prevY = herding.smoothedOffset?.y ?? 0;
      const alpha = herding.isThreatened ? 1 : smoothing;
      const smoothedX = prevX + (offsetX - prevX) * alpha;
      const smoothedY = prevY + (offsetY - prevY) * alpha;

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
    herding.shouldStartMoving = false;
    herding.localLeaderId = null;

    // Skip if creature is currently moving (no need for contagion)
    if (herding.isMoving) continue;

    // Skip if threatened (different behavior applies)
    if (herding.isThreatened) continue;

    // Find nearby creatures
    const neighbors = findNeighbors(creature, creatures, contagionRadius, spatialIndex);
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
      herding.shouldStartMoving = (rng?.nextFloat() ?? 1) < probability;
      if (herding.shouldStartMoving) {
        herding.contagionDelayTicks = contagionDelay;
      }
    }
  }
}

export function getHerdingOffsetSimple(creature) {
  return creature?.herding?.targetOffset ?? null;
}

export function getHerdHeading(creature) {
  return creature?.herding?.herdHeading ?? null;
}

export function isThreatenedSimple(creature) {
  return creature?.herding?.isThreatened ?? false;
}

export function getHerdSizeSimple(creature) {
  return creature?.herding?.herdSize ?? 1;
}

export function getLocalLeaderId(creature) {
  return creature?.herding?.localLeaderId ?? null;
}

export function shouldStartMoving(creature) {
  const should = creature?.herding?.shouldStartMoving ?? false;
  // Clear the flag after reading
  if (creature?.herding) {
    creature.herding.shouldStartMoving = false;
  }
  return should;
}

export function getLeadershipScore(creature) {
  return creature?.herding?.leadershipScore ?? 0;
}
