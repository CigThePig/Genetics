import { canSeeCreature } from './visibility.js';
import { SPECIES } from '../species.js';

const PREDATOR_SPECIES = new Set([SPECIES.TRIANGLE, SPECIES.OCTAGON]);

export const isPredator = (species) => PREDATOR_SPECIES.has(species);

export const resolveSeparationRadius = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingSeparationRadius)
    ? Math.max(0.5, config.creatureSimpleHerdingSeparationRadius)
    : 2.5;

export const resolveCohesionRadius = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingCohesionRadius)
    ? Math.max(1, config.creatureSimpleHerdingCohesionRadius)
    : 11;

export const resolveSeparationStrength = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingSeparationStrength)
    ? Math.max(0, Math.min(2, config.creatureSimpleHerdingSeparationStrength))
    : 1.2;

export const resolveThreatRange = (config) =>
  Number.isFinite(config?.creatureSimpleHerdingThreatRange)
    ? Math.max(1, config.creatureSimpleHerdingThreatRange)
    : 12;

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
