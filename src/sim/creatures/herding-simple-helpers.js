import { canSeeCreature } from './visibility.js';
import { SPECIES } from '../species.js';

const PREDATOR_SPECIES = new Set([SPECIES.TRIANGLE, SPECIES.OCTAGON]);

export const isPredator = (species) => PREDATOR_SPECIES.has(species);

export const resolveSimpleHerdingEnabled = (config) => config?.creatureHerdingSimpleMode !== false;

export const resolveSeparationRadius = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingSeparationRadius)
    ? Math.max(0.5, config.creatureSimpleHerdingSeparationRadius)
    : 2.5;

export const resolveAlignmentRadius = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingAlignmentRadius)
    ? Math.max(1, config.creatureSimpleHerdingAlignmentRadius)
    : 7;

export const resolveCohesionRadius = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingCohesionRadius)
    ? Math.max(1, config.creatureSimpleHerdingCohesionRadius)
    : 11;

export const resolveSeparationStrength = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingSeparationStrength)
    ? Math.max(0, Math.min(2, config.creatureSimpleHerdingSeparationStrength))
    : 1.2;

export const resolveAlignmentStrength = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingAlignmentStrength)
    ? Math.max(0, Math.min(2, config.creatureSimpleHerdingAlignmentStrength))
    : 0.8;

export const resolveCohesionStrength = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingCohesionStrength)
    ? Math.max(0, Math.min(2, config.creatureSimpleHerdingCohesionStrength))
    : 0.5;

export const resolveThreatRange = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingThreatRange)
    ? Math.max(1, config.creatureSimpleHerdingThreatRange)
    : 12;

export const resolveThreatStrength = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingThreatStrength)
    ? Math.max(0, Math.min(2, config.creatureSimpleHerdingThreatStrength))
    : 1.5;

export const resolveThreatPropagationRadius = (config) =>
  Number.isFinite(config?.creatureThreatPropagationRadius)
    ? Math.max(1, config.creatureThreatPropagationRadius)
    : 9;

export const resolveThreatPropagationHops = (config) =>
  Number.isFinite(config?.creatureThreatPropagationHops)
    ? Math.max(0, Math.trunc(config.creatureThreatPropagationHops))
    : 2;

export const resolveThreatDecayTicks = (config) => {
  const tps = Number.isFinite(config?.ticksPerSecond) ? config.ticksPerSecond : 60;
  const seconds = Number.isFinite(config?.creatureThreatDecaySeconds)
    ? Math.max(0, config.creatureThreatDecaySeconds)
    : 2.0;
  return Math.max(1, Math.floor(seconds * tps));
};

export const resolveOffsetSmoothing = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingSmoothing)
    ? Math.max(0, Math.min(1, config.creatureSimpleHerdingSmoothing))
    : 0.3;

export const resolveMovementContagionRadius = (config) =>
  Number.isFinite(config?.creatureHerdMovementContagionRadius)
    ? Math.max(1, config.creatureHerdMovementContagionRadius)
    : 6;

export const resolveMovementContagionDelay = (config) => {
  const tps = Number.isFinite(config?.ticksPerSecond) ? config.ticksPerSecond : 60;
  const seconds = Number.isFinite(config?.creatureHerdMovementContagionDelay)
    ? Math.max(0, config.creatureHerdMovementContagionDelay)
    : 0.3;
  return Math.max(1, Math.floor(seconds * tps));
};

export const resolveMovementContagionChance = (config) =>
  Number.isFinite(config?.creatureHerdMovementContagionChance)
    ? Math.max(0, Math.min(1, config.creatureHerdMovementContagionChance))
    : 0.4;

export const resolveLeadershipDecay = (config) =>
  Number.isFinite(config?.creatureHerdLeadershipDecay)
    ? Math.max(0, Math.min(1, config.creatureHerdLeadershipDecay))
    : 0.02;

export const calculateSeparation = (creature, neighbors, separationRadius) => {
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

export const calculateAlignment = (creature, neighbors, alignmentRadius) => {
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
    const dotProduct =
      (neighbor.dx / neighbor.distance) * myDirX + (neighbor.dy / neighbor.distance) * myDirY;
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

export const calculateCohesion = (creature, neighbors, cohesionRadius) => {
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

export const calculateFlee = (creature, threats, threatRange) => {
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

export const findNeighbors = (creature, creatures, maxRange, spatialIndex) => {
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

export const findThreats = (creature, creatures, threatRange, spatialIndex, world, config) => {
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
      if (
        distanceSq < 0 ||
        !canSeeCreature(creature, other, world, config, threatRange, creature.herding?.isThreatened)
      )
        continue;
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
      if (!isPredator(other.species) || other.meters?.hp <= 0) continue;

      const dx = other.position.x - x;
      const dy = other.position.y - y;
      const distSq = dx * dx + dy * dy;

      if (
        distSq <= rangeSq &&
        canSeeCreature(creature, other, world, config, threatRange, creature.herding?.isThreatened)
      ) {
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

export const ensureHerdingState = (creature) => {
  if (!creature.herding || !Number.isFinite(creature.herding.leadershipScore)) {
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
      leadershipScore: 0,
      ...creature.herding
    };
  }
  return creature.herding;
};
