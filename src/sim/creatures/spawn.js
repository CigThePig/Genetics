/**
 * Spawn Module
 *
 * Handles initial creature creation and positioning.
 */

import { SPECIES, SPECIES_LIST } from '../species.js';
import { createCreatureTraits } from './traits.js';
import { createCreatureGenome } from './genetics.js';
import { createLifeStageState } from './life-stages.js';
import { resolveWaterTerrain, isWaterTile } from '../utils/resolvers.js';

/**
 * Predator species (can hunt other creatures).
 */
const PREDATOR_SPECIES = [SPECIES.TRIANGLE, SPECIES.OCTAGON];

/**
 * Herbivore species (cannot hunt other creatures).
 */
const HERBIVORE_SPECIES = [SPECIES.SQUARE, SPECIES.CIRCLE];

/**
 * Checks if a species is a predator.
 */
const isPredatorSpecies = (species) => PREDATOR_SPECIES.includes(species);

/**
 * Checks if sex assignment is enabled.
 */
const resolveSexEnabled = (config) => config?.creatureSexEnabled !== false;

/**
 * Gets the sex split mode (exact or alternating).
 */
const resolveSexInitialSplitMode = (config) =>
  config?.creatureSexInitialSplitMode ?? 'exact';

/**
 * Resolves the predator count from config.
 */
const resolvePredatorCount = (config, totalCount) => {
  if (Number.isFinite(config?.creaturePredatorCount)) {
    return Math.max(0, Math.min(totalCount, Math.trunc(config.creaturePredatorCount)));
  }
  // Default: ~10% predators
  return Math.trunc(totalCount * 0.1);
};

/**
 * Creates a spawn queue that places predators and herbivores appropriately.
 * Returns an array of species in spawn order.
 */
const createSpawnQueue = (totalCount, predatorCount) => {
  const herbivoreCount = totalCount - predatorCount;
  const queue = [];

  // Distribute predators evenly between triangle and octagon
  const triangleCount = Math.ceil(predatorCount / 2);
  const octagonCount = predatorCount - triangleCount;

  // Distribute herbivores evenly between square and circle
  const squareCount = Math.ceil(herbivoreCount / 2);
  const circleCount = herbivoreCount - squareCount;

  // Add all species to their respective pools
  for (let i = 0; i < triangleCount; i += 1) {
    queue.push(SPECIES.TRIANGLE);
  }
  for (let i = 0; i < octagonCount; i += 1) {
    queue.push(SPECIES.OCTAGON);
  }
  for (let i = 0; i < squareCount; i += 1) {
    queue.push(SPECIES.SQUARE);
  }
  for (let i = 0; i < circleCount; i += 1) {
    queue.push(SPECIES.CIRCLE);
  }

  return queue;
};

/**
 * Builds queues for exact 50/50 sex split per species.
 */
const buildExactSexQueues = (spawnQueue) => {
  const counts = {};
  for (const species of SPECIES_LIST) {
    counts[species] = 0;
  }
  for (const species of spawnQueue) {
    counts[species] += 1;
  }

  const queues = {};
  for (const species of SPECIES_LIST) {
    const total = counts[species];
    const queue = [];
    let maleRemaining = Math.floor(total / 2);
    let femaleRemaining = total - maleRemaining;
    let useMale = true;
    for (let i = 0; i < total; i += 1) {
      if ((useMale && maleRemaining > 0) || femaleRemaining === 0) {
        queue.push('male');
        maleRemaining -= 1;
      } else {
        queue.push('female');
        femaleRemaining -= 1;
      }
      useMale = !useMale;
    }
    queues[species] = queue;
  }
  return queues;
};

/**
 * Creates all initial creatures for the simulation.
 * Handles positioning, genome creation, sex assignment, and initial state.
 */
export function createCreatures({ config, rng, world }) {
  const count = Number.isFinite(config?.creatureCount)
    ? Math.max(0, Math.trunc(config.creatureCount))
    : 0;
  const predatorCount = resolvePredatorCount(config, count);
  const spawnQueue = createSpawnQueue(count, predatorCount);
  const creatures = [];
  const waterTerrain = resolveWaterTerrain(config);
  const spawnRetries = 20;
  const anchorRetries = 30;
  const clusterSpread = Number.isFinite(config?.creatureSpawnClusterSpread)
    ? Math.max(0, config.creatureSpawnClusterSpread)
    : 12;
  const clusterJitter = Number.isFinite(config?.creatureSpawnClusterJitter)
    ? Math.max(0, config.creatureSpawnClusterJitter)
    : 4;
  const width = Number.isFinite(world?.width) ? world.width : 0;
  const height = Number.isFinite(world?.height) ? world.height : 0;
  const sexEnabled = resolveSexEnabled(config);
  const sexSplitMode = resolveSexInitialSplitMode(config);
  const sexQueues =
    sexEnabled && sexSplitMode === 'exact'
      ? buildExactSexQueues(spawnQueue)
      : null;
  const sexIndices = {};
  if (sexEnabled) {
    for (const species of SPECIES_LIST) {
      sexIndices[species] = 0;
    }
  }

  const randomPosition = () => ({
    x: rng.nextFloat() * width,
    y: rng.nextFloat() * height
  });

  const resolveLandPosition = (position) => {
    const cellX = Math.floor(position.x);
    const cellY = Math.floor(position.y);
    return !isWaterTile(world, cellX, cellY, waterTerrain);
  };

  const findFallbackLandPosition = () => {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (!isWaterTile(world, x, y, waterTerrain)) {
          return { x: x + 0.5, y: y + 0.5 };
        }
      }
    }
    return randomPosition();
  };

  const findRandomLandPosition = (attempts = spawnRetries) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const position = randomPosition();
      if (resolveLandPosition(position)) {
        return position;
      }
    }
    return findFallbackLandPosition();
  };

  const clampToWorld = (value, max) =>
    Math.max(0, Math.min(max - 0.001, value));

  const findNearbyLandPosition = (origin, radius, attempts) => {
    if (!origin || radius <= 0 || !Number.isFinite(width) || !Number.isFinite(height)) {
      return findRandomLandPosition();
    }
    const baseOrigin = resolveLandPosition(origin)
      ? origin
      : findRandomLandPosition(anchorRetries);
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const offsetX = (rng.nextFloat() * 2 - 1) * radius;
      const offsetY = (rng.nextFloat() * 2 - 1) * radius;
      const candidate = {
        x: clampToWorld(baseOrigin.x + offsetX, width),
        y: clampToWorld(baseOrigin.y + offsetY, height)
      };
      if (resolveLandPosition(candidate)) {
        return candidate;
      }
    }
    return findRandomLandPosition();
  };

  const createAnchors = () => {
    const baseAnchor = findRandomLandPosition(anchorRetries);
    const anchors = {};
    for (const species of SPECIES_LIST) {
      anchors[species] = findNearbyLandPosition(baseAnchor, clusterSpread, anchorRetries);
    }
    return anchors;
  };

  const anchors = createAnchors();

  for (let i = 0; i < count; i += 1) {
    const species = spawnQueue[i] ?? SPECIES_LIST[i % SPECIES_LIST.length];
    const anchor = anchors[species] ?? findRandomLandPosition();
    let position = anchor;
    for (let attempt = 0; attempt < spawnRetries; attempt += 1) {
      const angle = rng.nextFloat() * Math.PI * 2;
      const distance = rng.nextFloat() * clusterJitter;
      const candidate = {
        x: clampToWorld(anchor.x + Math.cos(angle) * distance, width),
        y: clampToWorld(anchor.y + Math.sin(angle) * distance, height)
      };
      if (resolveLandPosition(candidate)) {
        position = candidate;
        break;
      }
    }
    const genome = createCreatureGenome({ config, species, rng });
    const sexIndex = sexEnabled ? sexIndices[species] ?? 0 : 0;
    if (sexEnabled) {
      sexIndices[species] = sexIndex + 1;
    }
    const sex = sexEnabled
      ? sexQueues
        ? sexQueues[species][sexIndex]
        : sexIndex % 2 === 0
          ? 'male'
          : 'female'
      : null;
    creatures.push({
      id: i,
      position,
      species,
      sex,
      genome,
      traits: createCreatureTraits({ config, species, genome }),
      ageTicks: 0,
      lifeStage: createLifeStageState(0, config),
      priority: 'thirst',
      intent: { type: 'wander' },
      meters: {
        energy: config.creatureBaseEnergy,
        water: config.creatureBaseWater,
        stamina: config.creatureBaseStamina,
        hp: config.creatureBaseHp
      },
      memory: { entries: [] },
      reproduction: { cooldownTicks: 0 }
    });
  }

  return creatures;
}

/**
 * Finds the nearest creature to a point within a maximum distance.
 */
export function findNearestCreature(creatures, point, maxDistance = Infinity) {
  if (!Array.isArray(creatures) || creatures.length === 0 || !point) {
    return null;
  }
  const limit = Number.isFinite(maxDistance) ? maxDistance : Infinity;
  const limitSq = limit * limit;

  let closest = null;
  let closestDistance = Infinity;

  for (const creature of creatures) {
    const dx = creature.position.x - point.x;
    const dy = creature.position.y - point.y;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq <= limitSq && distanceSq < closestDistance) {
      closest = creature;
      closestDistance = distanceSq;
    }
  }

  return closest;
}
