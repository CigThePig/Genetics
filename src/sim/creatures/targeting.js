import { SPECIES } from '../species.js';
import { getSpatialIndex } from '../spatial-index.js';

const DEFAULT_TARGET_WEIGHTS = Object.freeze({
  [SPECIES.TRIANGLE]: {
    [SPECIES.CIRCLE]: 1,
    [SPECIES.SQUARE]: 0.8
  },
  [SPECIES.OCTAGON]: {
    [SPECIES.SQUARE]: 1,
    [SPECIES.CIRCLE]: 0.8
  }
});

const resolveTargetingWeights = (species, config) =>
  config?.creatureTargetingPreferences?.[species] ?? DEFAULT_TARGET_WEIGHTS[species] ?? null;

const resolveTargetingRange = (config) => {
  if (Number.isFinite(config?.creatureTargetingRange)) {
    return Math.max(0, config.creatureTargetingRange);
  }
  if (Number.isFinite(config?.creaturePerceptionRange)) {
    return Math.max(0, config.creaturePerceptionRange);
  }
  return 0;
};

const resolveDistanceWeight = (config) =>
  Number.isFinite(config?.creatureTargetingDistanceWeight)
    ? Math.max(0, config.creatureTargetingDistanceWeight)
    : 0.12;

export const selectPredatorTarget = ({ predator, creatures, config, spatialIndex }) => {
  if (!predator?.position || !Array.isArray(creatures)) {
    return null;
  }
  const weights = resolveTargetingWeights(predator.species, config);
  if (!weights) {
    return null;
  }
  const range = resolveTargetingRange(config);
  if (range <= 0) {
    return null;
  }
  const distanceWeight = resolveDistanceWeight(config);
  const rangeSq = range * range;

  // Try spatial index first if available
  const index = spatialIndex || getSpatialIndex();
  const useSpatialIndex = index && index.creatureCount > 0;

  let best = null;

  if (useSpatialIndex) {
    // Use spatial index for efficient neighbor query
    const nearby = index.queryNearby(
      predator.position.x,
      predator.position.y,
      range,
      {
        exclude: predator,
        filter: (candidate) => {
          const weight = weights[candidate.species];
          return Number.isFinite(weight) && weight > 0;
        }
      }
    );

    for (const { creature: candidate, distanceSq } of nearby) {
      const weight = weights[candidate.species];
      const distance = Math.sqrt(distanceSq);
      const score = weight - distance * distanceWeight;

      if (!best) {
        best = { target: candidate, score, distance };
        continue;
      }
      if (score > best.score) {
        best = { target: candidate, score, distance };
        continue;
      }
      if (score === best.score) {
        if (distance < best.distance) {
          best = { target: candidate, score, distance };
          continue;
        }
        if (distance === best.distance) {
          const bestId = Number.isFinite(best.target?.id) ? best.target.id : Infinity;
          const nextId = Number.isFinite(candidate.id) ? candidate.id : Infinity;
          if (nextId < bestId) {
            best = { target: candidate, score, distance };
          }
        }
      }
    }
  } else {
    // Fall back to linear scan
    for (const candidate of creatures) {
      if (!candidate || candidate === predator || !candidate.position) {
        continue;
      }
      const weight = weights[candidate.species];
      if (!Number.isFinite(weight) || weight <= 0) {
        continue;
      }
      const dx = candidate.position.x - predator.position.x;
      const dy = candidate.position.y - predator.position.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq > rangeSq) {
        continue;
      }
      const distance = Math.sqrt(distanceSq);
      const score = weight - distance * distanceWeight;

      if (!best) {
        best = { target: candidate, score, distance };
        continue;
      }
      if (score > best.score) {
        best = { target: candidate, score, distance };
        continue;
      }
      if (score === best.score) {
        if (distance < best.distance) {
          best = { target: candidate, score, distance };
          continue;
        }
        if (distance === best.distance) {
          const bestId = Number.isFinite(best.target?.id) ? best.target.id : Infinity;
          const nextId = Number.isFinite(candidate.id) ? candidate.id : Infinity;
          if (nextId < bestId) {
            best = { target: candidate, score, distance };
          }
        }
      }
    }
  }

  if (!best) {
    return null;
  }

  return {
    target: best.target,
    preySpecies: best.target?.species ?? null,
    score: best.score,
    distance: best.distance
  };
};
