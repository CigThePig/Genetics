/**
 * Intent Module
 *
 * Handles creature priority selection and intent decision-making.
 */

import { resolveTicksPerSecond } from './life-stages.js';
import {
  resolveRatio,
  resolveDistance,
  resolveMinAgeTicks,
  resolveWaterTerrain,
  isWaterTile
} from '../utils/resolvers.js';
import { SPECIES } from '../species.js';
import { resolveNeedMeterBase, resolveActionThreshold, normalizeNeedRatio } from './metabolism.js';
import {
  FOOD_TYPES,
  getDietPreferences,
  getFoodAvailabilityAtCell,
  selectFoodChoice
} from './food.js';
import { applyMemoryPenalty, selectMemoryTarget, MEMORY_TYPES } from './memory.js';
import { selectPredatorTarget } from './targeting.js';
import { getChaseTarget, startCreatureChase } from './chase.js';
import { isReadyToReproduce, selectMateTarget } from './reproduction.js';

/**
 * Resolves the need switch margin (hysteresis) for priority switching.
 */
const resolveNeedSwitchMargin = (config) =>
  Number.isFinite(config?.creatureNeedSwitchMargin)
    ? Math.max(0, config.creatureNeedSwitchMargin)
    : 0.05;

/**
 * Resolves an action amount value (positive with fallback).
 */
const resolveActionAmount = (value, fallback) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

/**
 * Resolves commit time in ticks from seconds value.
 */
const resolveCommitTicks = (seconds, fallbackSeconds, ticksPerSecond) => {
  const tps = Number.isFinite(ticksPerSecond) ? ticksPerSecond : 60;
  const value = Number.isFinite(seconds) ? seconds : fallbackSeconds;
  return Math.max(0, Math.trunc(value * tps));
};

const resolveGrazeEnabled = (config) => config?.creatureGrazeEnabled !== false;

const resolveGrazeMinRatio = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;

const resolveGrazeMinLocalHerdSize = (config) =>
  Number.isFinite(config?.creatureGrazeMinLocalHerdSize)
    ? Math.max(1, Math.trunc(config.creatureGrazeMinLocalHerdSize))
    : 3;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const clamp01 = (value) => clamp(value, 0, 1);

const HERBIVORE_SPECIES = [SPECIES.SQUARE, SPECIES.CIRCLE];

const isHerbivoreSpecies = (species) => species === SPECIES.SQUARE || species === SPECIES.CIRCLE;

const getSpeciesKey = (species) => (isHerbivoreSpecies(species) ? species : null);

const resolveHerdingMinGroupSize = (config) =>
  Number.isFinite(config?.creatureHerdingMinGroupSize)
    ? Math.max(1, Math.trunc(config.creatureHerdingMinGroupSize))
    : 2;

const resolveDrinkConcernMargin = (config) =>
  Number.isFinite(config?.creatureDrinkConcernMargin)
    ? Math.max(0, Math.min(0.35, config.creatureDrinkConcernMargin))
    : 0.18;

const resolveWaterRendezvousEnabled = (config) => config?.creatureWaterRendezvousEnabled !== false;

const resolveWaterRendezvousEvalSeconds = (config) =>
  Number.isFinite(config?.creatureWaterRendezvousEvalSeconds)
    ? Math.max(0.25, config.creatureWaterRendezvousEvalSeconds)
    : 1.0;

const resolveWaterRendezvousCooldownSeconds = (config) =>
  Number.isFinite(config?.creatureWaterRendezvousCooldownSeconds)
    ? Math.max(0, config.creatureWaterRendezvousCooldownSeconds)
    : 5.0;

const resolveWaterRendezvousSearchRadius = (config) =>
  Number.isFinite(config?.creatureWaterRendezvousSearchRadius)
    ? Math.max(5, config.creatureWaterRendezvousSearchRadius)
    : 26;

const resolveWaterRendezvousCandidateCount = (config) =>
  Number.isFinite(config?.creatureWaterRendezvousCandidateCount)
    ? Math.max(4, Math.trunc(config.creatureWaterRendezvousCandidateCount))
    : 18;

const resolveWaterRendezvousThirstPressureThreshold = (config) =>
  Number.isFinite(config?.creatureWaterRendezvousThirstPressureThreshold)
    ? clamp01(config.creatureWaterRendezvousThirstPressureThreshold)
    : 0.12;

const resolveWaterRendezvousMaxDistance = (config) =>
  Number.isFinite(config?.creatureWaterRendezvousMaxDistance)
    ? Math.max(5, config.creatureWaterRendezvousMaxDistance)
    : 70;

const resolveWaterRendezvousPreferHerdAnchor = (config) =>
  config?.creatureWaterRendezvousPreferHerdAnchor !== false;

const resolveWaterRendezvousCommitSeconds = (config) =>
  Number.isFinite(config?.creatureWaterRendezvousCommitSeconds)
    ? Math.max(0.25, config.creatureWaterRendezvousCommitSeconds)
    : 2.5;

/**
 * Per-species water rendezvous state cache.
 */
const herdWaterState = new Map();


/**
 * Search / exploration helpers.
 *
 * If a creature has an urgent need (water/food/mates) but has neither a perceived target
 * nor a memory target (or mate target), it can "mill" in place (especially under herding/pack forces).
 * We give it a long-range search target so it actually explores outward.
 */
const resolveSearchRadius = (value, fallback) =>
  Number.isFinite(value) ? Math.max(1, value) : fallback;

const resolveSearchGrowth = (value, fallback) =>
  Number.isFinite(value) ? Math.max(1.01, value) : fallback;

const resolveSearchArriveDistance = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0.25, value) : fallback;

const resolveSearchConfig = (config, world) => {
  const minRadius = resolveSearchRadius(config?.creatureSearchRadiusMin, 12);
  const maxDimension =
    world && Number.isFinite(world.width) && Number.isFinite(world.height)
      ? Math.max(world.width, world.height)
      : 100;
  const maxRadius = resolveSearchRadius(config?.creatureSearchRadiusMax, maxDimension);
  return {
    minRadius,
    maxRadius: Math.max(minRadius, maxRadius),
    growth: resolveSearchGrowth(config?.creatureSearchRadiusGrowth, 1.35),
    arriveDistance: resolveSearchArriveDistance(config?.creatureSearchArriveDistance, 1.25)
  };
};

const ensureSearchState = (creature) => {
  if (!creature.search) {
    creature.search = {
      goal: null,
      radius: 0,
      heading: 0,
      attempts: 0,
      target: null,
      commitTicksRemaining: 0
    };
  }
  return creature.search;
};

const clearSearchState = (creature) => {
  if (!creature?.search) {
    return;
  }
  creature.search.goal = null;
  creature.search.target = null;
  creature.search.radius = 0;
  creature.search.attempts = 0;
  creature.search.commitTicksRemaining = 0;
};

const pickSearchTarget = ({ creature, goal, config, world, rng }) => {
  if (!creature?.position || !world || !rng) {
    return null;
  }
  const { minRadius, maxRadius, growth, arriveDistance } = resolveSearchConfig(config, world);
  const search = ensureSearchState(creature);

  if (search.goal !== goal) {
    search.goal = goal;
    search.radius = minRadius;
    search.attempts = 0;
    search.heading = rng.nextFloat() * Math.PI * 2;
    search.target = null;
  }

  // Keep current target until we "arrive" (prevents thrashing).
  if (search.target) {
    const dx = creature.position.x - search.target.x;
    const dy = creature.position.y - search.target.y;
    if (dx * dx + dy * dy > arriveDistance * arriveDistance) {
      return search.target;
    }
  }

  // Retarget: expand radius and rotate heading for broad coverage.
  const goldenAngle = 2.399963229728653; // ~137.5 degrees
  search.heading = (search.heading ?? 0) + goldenAngle + (rng.nextFloat() * 2 - 1) * 0.35;
  search.radius = Math.min(maxRadius, Math.max(minRadius, (search.radius || minRadius) * growth));
  search.attempts = (search.attempts ?? 0) + 1;

  const cx = Math.floor(creature.position.x);
  const cy = Math.floor(creature.position.y);
  const maxX = Number.isFinite(world.width) ? Math.max(0, world.width - 1) : 0;
  const maxY = Number.isFinite(world.height) ? Math.max(0, world.height - 1) : 0;

  const rawX = Math.floor(cx + Math.cos(search.heading) * search.radius);
  const rawY = Math.floor(cy + Math.sin(search.heading) * search.radius);
  let targetX = Math.max(0, Math.min(maxX, rawX));
  let targetY = Math.max(0, Math.min(maxY, rawY));

  // Avoid targeting deep water (shore is fine since it's walkable).
  const waterTerrain = resolveWaterTerrain(config);
  if (isWaterTile(world, targetX, targetY, waterTerrain)) {
    let found = false;
    for (let r = 1; r <= 6 && !found; r += 1) {
      for (let oy = -r; oy <= r && !found; oy += 1) {
        for (let ox = -r; ox <= r && !found; ox += 1) {
          const nx = Math.max(0, Math.min(maxX, targetX + ox));
          const ny = Math.max(0, Math.min(maxY, targetY + oy));
          if (!isWaterTile(world, nx, ny, waterTerrain)) {
            targetX = nx;
            targetY = ny;
            found = true;
          }
        }
      }
    }
  }

  // Aim at cell center to reduce edge jitter.
  search.target = { x: targetX + 0.5, y: targetY + 0.5 };
  return search.target;
};

/**
 * Gets the grid cell for a creature's position.
 */
const getCreatureCell = (creature) => ({
  x: Math.floor(creature.position.x),
  y: Math.floor(creature.position.y)
});

/**
 * Checks if there's water within one tile of the cell.
 */
const hasNearbyWater = (world, cell, config) => {
  if (!world?.isWaterAt) {
    return false;
  }
  const waterTerrain = config?.waterTerrain ?? 'water';
  const shoreTerrain = config?.shoreTerrain ?? 'shore';
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (world.isWaterAt(cell.x + dx, cell.y + dy, waterTerrain, shoreTerrain)) {
        return true;
      }
    }
  }
  return false;
};

const isDrinkableCell = (world, x, y, config) =>
  hasNearbyWater(world, { x, y }, config);

/**
 * Gets the grass amount at a cell.
 */
const getGrassAtCell = (world, cell) => {
  if (!world?.getGrassAt) {
    return 0;
  }
  const amount = world.getGrassAt(cell.x, cell.y);
  return Number.isFinite(amount) ? amount : 0;
};

const resolveWorldBounds = (world) => ({
  maxX: Number.isFinite(world?.width) ? Math.max(0, world.width - 1) : 0,
  maxY: Number.isFinite(world?.height) ? Math.max(0, world.height - 1) : 0
});

const clampToWorld = (point, world) => {
  const { maxX, maxY } = resolveWorldBounds(world);
  return {
    x: Math.max(0, Math.min(maxX, point.x)),
    y: Math.max(0, Math.min(maxY, point.y))
  };
};

const applyRallyJitter = ({ point, rng, world, waterTerrain }) => {
  if (!point || !rng || !world) {
    return point;
  }
  const radius = 2 + rng.nextFloat() * 2;
  const angle = rng.nextFloat() * Math.PI * 2;
  const jittered = clampToWorld(
    {
      x: point.x + Math.cos(angle) * radius,
      y: point.y + Math.sin(angle) * radius
    },
    world
  );
  const ix = Math.round(jittered.x);
  const iy = Math.round(jittered.y);
  if (isWaterTile(world, ix, iy, waterTerrain)) {
    return point;
  }
  return jittered;
};

const scoreWaterRendezvousCandidate = ({
  candidate,
  center,
  world,
  config,
  spatialIndex
}) => {
  const dx = candidate.x - center.x;
  const dy = candidate.y - center.y;
  const dist = Math.hypot(dx, dy);
  const searchRadius = resolveWaterRendezvousSearchRadius(config);
  const distanceScore = 1 - clamp01(dist / Math.max(1, searchRadius));

  let boundaryPenalty = 0;
  if (world) {
    const { maxX, maxY } = resolveWorldBounds(world);
    const edgeDistance = Math.min(candidate.x, candidate.y, maxX - candidate.x, maxY - candidate.y);
    const edgeThreshold = Math.max(3, searchRadius * 0.2);
    boundaryPenalty =
      edgeDistance < edgeThreshold ? clamp01((edgeThreshold - edgeDistance) / edgeThreshold) : 0;
  }

  let predatorPenalty = 0;
  if (spatialIndex?.countNearby) {
    const threatCount = spatialIndex.countNearby(candidate.x, candidate.y, 10, {
      filter: (creature) =>
        creature?.species === SPECIES.TRIANGLE || creature?.species === SPECIES.OCTAGON
    });
    predatorPenalty = clamp01(threatCount / 4);
  }

  return distanceScore - boundaryPenalty * 0.6 - predatorPenalty * 0.8;
};

const updateHerdWaterTargetsOncePerTick = ({
  creatures,
  config,
  world,
  spatialIndex,
  tick,
  rng,
  baseWater,
  fallbackDrinkThreshold
}) => {
  if (!resolveWaterRendezvousEnabled(config) || !world || !Array.isArray(creatures)) {
    if (world) {
      world.herdWaterTargets = {};
    }
    return;
  }

  const resolvedTick = Number.isFinite(tick) ? tick : 0;
  if (resolvedTick <= 1) {
    herdWaterState.clear();
  }
  const ticksPerSecond = resolveTicksPerSecond(config);
  const evalTicks = Math.max(1, Math.floor(resolveWaterRendezvousEvalSeconds(config) * ticksPerSecond));
  const cooldownTicksBase = Math.max(
    0,
    Math.floor(resolveWaterRendezvousCooldownSeconds(config) * ticksPerSecond)
  );
  const searchRadius = resolveWaterRendezvousSearchRadius(config);
  const candidateCount = resolveWaterRendezvousCandidateCount(config);
  const pressureThreshold = resolveWaterRendezvousThirstPressureThreshold(config);
  const preferAnchor = resolveWaterRendezvousPreferHerdAnchor(config);
  const concernMargin = resolveDrinkConcernMargin(config);
  const waterTerrain = resolveWaterTerrain(config);

  const membersBySpecies = new Map();
  for (const species of HERBIVORE_SPECIES) {
    membersBySpecies.set(species, []);
  }

  for (const creature of creatures) {
    if (!creature?.position || !isHerbivoreSpecies(creature.species)) {
      continue;
    }
    membersBySpecies.get(creature.species)?.push(creature);
  }

  const targetsSnapshot = {};

  for (const species of HERBIVORE_SPECIES) {
    const members = membersBySpecies.get(species) ?? [];
    if (members.length === 0) {
      herdWaterState.delete(species);
      continue;
    }

    let concernedCount = 0;
    for (const member of members) {
      const drinkThreshold = resolveActionThreshold(
        member?.traits?.drinkThreshold,
        fallbackDrinkThreshold
      );
      const concernThreshold = Math.min(0.98, drinkThreshold + concernMargin);
      const waterRatio = normalizeNeedRatio(member?.meters?.water ?? baseWater, baseWater);
      if (waterRatio < concernThreshold) {
        concernedCount += 1;
      }
    }

    const thirstPressure = clamp01(concernedCount / members.length);
    const state =
      herdWaterState.get(species) ?? {
        target: null,
        lastScore: -Infinity,
        nextEvalTick: 0,
        cooldownTicks: 0
      };

    if (state.cooldownTicks > 0) {
      state.cooldownTicks -= 1;
    }

    const hasTarget =
      state.target && Number.isFinite(state.target.x) && Number.isFinite(state.target.y);

    if (thirstPressure < pressureThreshold && hasTarget) {
      state.nextEvalTick = resolvedTick + evalTicks;
      herdWaterState.set(species, state);
      targetsSnapshot[species] = {
        x: state.target.x,
        y: state.target.y,
        score: state.lastScore,
        softRadius: Math.max(4, searchRadius * 0.35),
        thirstPressure
      };
      continue;
    }

    const shouldEval =
      resolvedTick >= state.nextEvalTick &&
      state.cooldownTicks <= 0 &&
      (thirstPressure >= pressureThreshold || !hasTarget);

    if (shouldEval) {
      let center = null;
      const anchor = preferAnchor ? world.herdAnchors?.[species] : null;
      if (anchor?.target || anchor?.pos) {
        center = anchor.target ?? anchor.pos;
      }

      if (!center) {
        let sumX = 0;
        let sumY = 0;
        for (const member of members) {
          sumX += member.position.x;
          sumY += member.position.y;
        }
        center = {
          x: sumX / members.length,
          y: sumY / members.length
        };
      }

      const candidates = [];
      for (let i = 0; i < candidateCount; i += 1) {
        const angle = rng ? rng.nextFloat() * Math.PI * 2 : (i / candidateCount) * Math.PI * 2;
        const radius =
          searchRadius * (rng ? Math.sqrt(rng.nextFloat()) : 0.35 + (i % 4) * 0.15);
        const point = clampToWorld(
          {
            x: center.x + Math.cos(angle) * radius,
            y: center.y + Math.sin(angle) * radius
          },
          world
        );
        const cx = Math.round(point.x);
        const cy = Math.round(point.y);
        if (!world.isInBounds?.(cx, cy)) {
          continue;
        }
        if (isWaterTile(world, cx, cy, waterTerrain)) {
          continue;
        }
        if (!isDrinkableCell(world, cx, cy, config)) {
          continue;
        }
        candidates.push({ x: cx, y: cy });
      }

      let best = null;
      let bestScore = -Infinity;

      for (const candidate of candidates) {
        let score = scoreWaterRendezvousCandidate({
          candidate,
          center,
          world,
          config,
          spatialIndex
        });
        if (rng) {
          score += 0.02 + rng.nextFloat() * 0.06;
        }
        if (score > bestScore) {
          bestScore = score;
          best = candidate;
        }
      }

      const currentScore = Number.isFinite(state.lastScore) ? state.lastScore : -Infinity;
      const shouldSwitch =
        best &&
        (bestScore > currentScore * (1 + 0.15) || bestScore - currentScore > 0.15);

      if (shouldSwitch) {
        state.target = { x: best.x, y: best.y };
        state.lastScore = bestScore;
        state.cooldownTicks = cooldownTicksBase;
      } else if (Number.isFinite(bestScore)) {
        state.lastScore = bestScore;
      }
    }

    if (shouldEval) {
      state.nextEvalTick = resolvedTick + evalTicks;
    } else if (!Number.isFinite(state.nextEvalTick) || state.nextEvalTick <= resolvedTick) {
      state.nextEvalTick = resolvedTick + evalTicks;
    }
    herdWaterState.set(species, state);

    if (state.target) {
      targetsSnapshot[species] = {
        x: state.target.x,
        y: state.target.y,
        score: state.lastScore,
        softRadius: Math.max(4, searchRadius * 0.35),
        thirstPressure
      };
    }
  }

  world.herdWaterTargets = targetsSnapshot;
};

/**
 * Updates creature priority (thirst vs hunger) based on meter levels.
 */
export function updateCreaturePriority({ creatures, config }) {
  if (!Array.isArray(creatures)) {
    return;
  }
  const baseEnergy = resolveNeedMeterBase(config?.creatureBaseEnergy);
  const baseWater = resolveNeedMeterBase(config?.creatureBaseWater);
  const margin = resolveNeedSwitchMargin(config);

  for (const creature of creatures) {
    const meters = creature?.meters;
    if (!meters) {
      continue;
    }
    const energyRatio = normalizeNeedRatio(meters.energy, baseEnergy);
    const waterRatio = normalizeNeedRatio(meters.water, baseWater);
    const hungerScore = 1 - energyRatio;
    const thirstScore = 1 - waterRatio;
    const current = creature.priority;
    const scoreGap = Math.abs(thirstScore - hungerScore);

    if (current && scoreGap < margin) {
      continue;
    }

    if (thirstScore >= hungerScore) {
      creature.priority = 'thirst';
    } else {
      creature.priority = 'hunger';
    }
  }
}

/**
 * Updates creature intent based on priority, perception, memory, and targets.
 * This is the main decision-making function for creature behavior.
 */
export function updateCreatureIntent({ creatures, config, world, metrics, tick, spatialIndex, rng }) {
  if (!Array.isArray(creatures) || !world) {
    return;
  }
  const ticksPerSecond = resolveTicksPerSecond(config);
  const baseEnergy = resolveNeedMeterBase(config?.creatureBaseEnergy);
  const baseWater = resolveNeedMeterBase(config?.creatureBaseWater);
  const minEnergyRatio = resolveRatio(config?.creatureReproductionMinEnergyRatio, 0.9);
  const minWaterRatio = resolveRatio(config?.creatureReproductionMinWaterRatio, 0.9);
  const minAgeTicks = resolveMinAgeTicks(config?.creatureReproductionMinAge, 90, ticksPerSecond);
  const sexEnabled = config?.creatureSexEnabled !== false;
  const pregnancyEnabled = config?.creaturePregnancyEnabled !== false;
  const mateSeekingEnabled = config?.creatureMateSeekingEnabled !== false;
  const mateSeekRange = resolveDistance(config?.creatureMateSeekRange, 25);
  const mateSeekRangeSq = mateSeekRange * mateSeekRange;
  const mateSeekCommitTicks = resolveCommitTicks(
    config?.creatureMateSeekCommitTime,
    1, // 1 second default
    ticksPerSecond
  );
  const mateSeekOverridesNeeds = config?.creatureMateSeekPriorityOverridesNeeds === true;
  const grazeEnabled = resolveGrazeEnabled(config);
  const grazeMinEnergyRatio = resolveGrazeMinRatio(config?.creatureGrazeMinEnergyRatio, 0.75);
  const grazeMinWaterRatio = resolveGrazeMinRatio(config?.creatureGrazeMinWaterRatio, 0.75);
  const grazeMinLocalHerdSize = resolveGrazeMinLocalHerdSize(config);
  const fallbackDrinkThreshold = resolveActionThreshold(config?.creatureDrinkThreshold, 0.8);
  const fallbackEatThreshold = resolveActionThreshold(config?.creatureEatThreshold, 0.8);
  const fallbackGrassEatMin = resolveActionAmount(config?.creatureGrassEatMin, 0.05);
  const fallbackBerryEatMin = resolveActionAmount(config?.creatureBerryEatMin, 0.1);

  updateHerdWaterTargetsOncePerTick({
    creatures,
    config,
    world,
    spatialIndex,
    tick,
    rng,
    baseWater,
    fallbackDrinkThreshold
  });

  // Predator rest behavior settings
  const predatorRestEnabled = config?.creaturePredatorRestEnabled !== false;
  const predatorRestThreshold = resolveRatio(config?.creaturePredatorRestThreshold, 0.9);
  const predatorHuntThreshold = resolveRatio(config?.creaturePredatorHuntThreshold, 0.5);

  // Use spatial index for ID lookups if available
  const creaturesById = mateSeekingEnabled
    ? spatialIndex
      ? null // spatial index has getById
      : new Map()
    : null;
  if (creaturesById) {
    for (const creature of creatures) {
      if (Number.isFinite(creature?.id)) {
        creaturesById.set(creature.id, creature);
      }
    }
  }

  for (const creature of creatures) {
    const meters = creature?.meters;
    if (!meters || !creature.position) {
      continue;
    }
    if (creature.alertness && !creature.alertness.canReact) {
      continue;
    }
    const drinkThreshold = resolveActionThreshold(
      creature?.traits?.drinkThreshold,
      fallbackDrinkThreshold
    );
    const eatThreshold = resolveActionThreshold(
      creature?.traits?.eatThreshold,
      fallbackEatThreshold
    );
    const grassEatMin = resolveActionAmount(creature?.traits?.grassEatMin, fallbackGrassEatMin);
    const berryEatMin = resolveActionAmount(creature?.traits?.berryEatMin, fallbackBerryEatMin);
    const cell = getCreatureCell(creature);
    const waterRatio = normalizeNeedRatio(meters.water, baseWater);
    const energyRatio = normalizeNeedRatio(meters.energy, baseEnergy);
    const concernThreshold = Math.min(0.98, drinkThreshold + resolveDrinkConcernMargin(config));
    const urgentThirst = waterRatio < drinkThreshold;
    const concernedThirst = waterRatio < concernThreshold;
    const localHerdSize = creature.herding?.herdSize ?? 1;
    const minLocalHerdSize = resolveHerdingMinGroupSize(config);
    const isInHerd = localHerdSize >= minLocalHerdSize;
    const speciesKey = getSpeciesKey(creature.species);
    const waterTarget = speciesKey ? world?.herdWaterTargets?.[speciesKey] : null;
    if (creature.search?.goal === 'water-rendezvous' && waterRatio >= concernThreshold) {
      clearSearchState(creature);
    }
    if (creature.search?.goal === 'water' && waterRatio >= drinkThreshold) {
      clearSearchState(creature);
    }
    if (creature.search?.goal === 'food' && energyRatio >= eatThreshold) {
      clearSearchState(creature);
    }
    const nearbyWater = hasNearbyWater(world, cell, config);
    const canDrink = waterRatio < drinkThreshold && nearbyWater;
    const canEat = energyRatio < eatThreshold;
    const foodAvailability = getFoodAvailabilityAtCell({ world, cell });
    const dietPreferences = getDietPreferences(creature.species);
    const canEatMeat = dietPreferences.includes(FOOD_TYPES.MEAT);

    // Predator rest behavior: well-fed predators don't hunt
    // They only start hunting again when energy drops below hunt threshold
    const isPredator = canEatMeat && dietPreferences[0] === FOOD_TYPES.MEAT;
    let predatorIsResting = false;
    if (isPredator && predatorRestEnabled) {
      // Track rest state with hysteresis to prevent flip-flopping
      if (!creature.predatorState) {
        creature.predatorState = { isResting: energyRatio >= predatorRestThreshold };
      }
      if (creature.predatorState.isResting) {
        // Currently resting - only start hunting if very hungry
        if (energyRatio < predatorHuntThreshold) {
          creature.predatorState.isResting = false;
        }
      } else {
        // Currently hunting - only rest if very full
        if (energyRatio >= predatorRestThreshold) {
          creature.predatorState.isResting = true;
        }
      }
      predatorIsResting = creature.predatorState.isResting;
    }

    const perceivedFoodCell = creature.perception?.foodCell;
    const perceivedFoodType = creature.perception?.foodType;
    const perceivedWaterCell = creature.perception?.waterCell;
    const canSeekPerceivedFood =
      perceivedFoodCell && perceivedFoodType && dietPreferences.includes(perceivedFoodType);
    const foodMinimums = {
      grass: grassEatMin,
      berries: berryEatMin,
      meat: Math.min(grassEatMin, berryEatMin)
    };
    const reproductionState = creature.reproduction ?? { cooldownTicks: 0 };
    if (!creature.reproduction) {
      creature.reproduction = reproductionState;
    }
    if (mateSeekingEnabled && sexEnabled && !reproductionState.mate) {
      reproductionState.mate = { targetId: null, commitTicksRemaining: 0 };
    }
    const canSeekMate =
      mateSeekingEnabled &&
      sexEnabled &&
      reproductionState.cooldownTicks <= 0 &&
      isReadyToReproduce({
        creature,
        baseEnergy,
        baseWater,
        minEnergyRatio,
        minWaterRatio,
        minAgeTicks,
        sexEnabled,
        pregnancyEnabled
      });
    const herbivoreConcernedNoWater =
      isHerbivoreSpecies(creature.species) && concernedThirst && !nearbyWater;
    const canConsiderMate =
      canSeekMate &&
      (mateSeekOverridesNeeds || (!canDrink && !canEat)) &&
      !herbivoreConcernedNoWater;
    if (herbivoreConcernedNoWater && reproductionState.mate) {
      reproductionState.mate.targetId = null;
      reproductionState.mate.commitTicksRemaining = 0;
    }
    if (creature.search?.goal === 'mate' && !canConsiderMate) {
      clearSearchState(creature);
    }

    let intent = 'wander';
    let foodType = null;
    let target = null;
    let memoryEntry = null;
    let targeting = null;
    let mateTarget = null;

    if (canConsiderMate && reproductionState.mate && (creaturesById || spatialIndex)) {
      const mateState = reproductionState.mate;
      let candidate = null;
      if (Number.isFinite(mateState.targetId)) {
        const existing = spatialIndex
          ? spatialIndex.getById(mateState.targetId)
          : creaturesById.get(mateState.targetId);
        const existingReady = existing
          ? isReadyToReproduce({
              creature: existing,
              baseEnergy,
              baseWater,
              minEnergyRatio,
              minWaterRatio,
              minAgeTicks,
              sexEnabled,
              pregnancyEnabled
            })
          : false;
        const existingCooldown = existing?.reproduction?.cooldownTicks ?? 0;
        const existingPregnant =
          pregnancyEnabled &&
          existing?.sex === 'female' &&
          existing.reproduction?.pregnancy?.isPregnant;
        if (
          existing &&
          existing.species === creature.species &&
          (!sexEnabled || (existing.sex && creature.sex && existing.sex !== creature.sex)) &&
          existingCooldown <= 0 &&
          !existingPregnant &&
          existingReady
        ) {
          candidate = existing;
        }
      }

      if (candidate) {
        mateState.commitTicksRemaining = Math.max(0, mateState.commitTicksRemaining - 1);
        if (mateState.commitTicksRemaining > 0) {
          mateTarget = candidate;
        }
      }

      if (!mateTarget) {
        const found = selectMateTarget({
          creatures,
          source: creature,
          maxDistanceSq: mateSeekRangeSq,
          baseEnergy,
          baseWater,
          minEnergyRatio,
          minWaterRatio,
          minAgeTicks,
          sexEnabled,
          pregnancyEnabled,
          spatialIndex
        });
        if (found) {
          mateState.targetId = found.id ?? null;
          mateState.commitTicksRemaining = mateSeekCommitTicks;
          mateTarget = found;
        } else {
          mateState.targetId = null;
          mateState.commitTicksRemaining = 0;
        }
      }
    } else if (mateSeekingEnabled && reproductionState.mate && !canSeekMate) {
      reproductionState.mate.targetId = null;
      reproductionState.mate.commitTicksRemaining = 0;
    }

    const rendezvousCommitTicks = resolveCommitTicks(
      resolveWaterRendezvousCommitSeconds(config),
      2.5,
      ticksPerSecond
    );
    const maxRendezvousDistance = resolveWaterRendezvousMaxDistance(config);
    let handled = false;

    if (
      herbivoreConcernedNoWater &&
      waterTarget &&
      isInHerd &&
      !creature.herding?.isThreatened
    ) {
      const search = ensureSearchState(creature);
      if (
        search.goal === 'water-rendezvous' &&
        search.target &&
        search.commitTicksRemaining > 0
      ) {
        search.commitTicksRemaining = Math.max(0, search.commitTicksRemaining - 1);
        intent = 'seek';
        target = { ...search.target };
      } else {
        search.goal = 'water-rendezvous';
        search.target = { x: waterTarget.x + 0.5, y: waterTarget.y + 0.5 };
        search.commitTicksRemaining = rendezvousCommitTicks;
        intent = 'seek';
        target = { ...search.target };
      }
      handled = true;
    }

    if (!handled && mateTarget) {
      clearSearchState(creature);
      intent = 'mate';
      target = { x: mateTarget.position.x, y: mateTarget.position.y };
    } else if (!handled && canConsiderMate) {
      if (isHerbivoreSpecies(creature.species) && !creature.herding?.isThreatened) {
        if (isInHerd) {
          clearSearchState(creature);
          intent = 'wander';
          target = null;
        } else if (localHerdSize <= 2) {
          const anchor = speciesKey ? world?.herdAnchors?.[speciesKey] : null;
          const rallyPoint =
            concernedThirst && waterTarget
              ? { x: waterTarget.x + 0.5, y: waterTarget.y + 0.5 }
              : anchor?.pos ?? anchor?.target ?? null;
          if (rallyPoint) {
            const jittered = applyRallyJitter({
              point: rallyPoint,
              rng,
              world,
              waterTerrain: resolveWaterTerrain(config)
            });
            intent = 'seek';
            target = { x: jittered.x, y: jittered.y };
          } else {
            const searchTarget = pickSearchTarget({
              creature,
              goal: 'mate',
              config,
              world,
              rng
            });
            if (searchTarget) {
              intent = 'seek';
              target = { ...searchTarget };
            }
          }
        }
      } else {
        const searchTarget = pickSearchTarget({
          creature,
          goal: 'mate',
          config,
          world,
          rng
        });
        if (searchTarget) {
          intent = 'seek';
          target = { ...searchTarget };
        }
      }
    } else if (!handled && (creature.priority === 'thirst' || herbivoreConcernedNoWater) && canDrink) {
      clearSearchState(creature);
      intent = 'drink';
    } else if (!handled && creature.priority === 'hunger' && canEat) {
      // Resting predators don't chase - they wait until hungry
      const shouldHunt = canEatMeat && !predatorIsResting;
      const chaseTarget = shouldHunt ? getChaseTarget(creature, creatures, spatialIndex) : null;
      if (chaseTarget && creature.chase?.lastKnownPosition) {
        intent = 'hunt';
        target = { ...creature.chase.lastKnownPosition };
        targeting = {
          targetId: chaseTarget.id ?? null,
          preySpecies: chaseTarget.species ?? null,
          score: creature.targeting?.score ?? null,
          distance: creature.chase.distance ?? null
        };
      } else {
        // Only start new hunts if not resting
        if (shouldHunt && dietPreferences[0] === FOOD_TYPES.MEAT) {
          const predatorTarget = selectPredatorTarget({
            predator: creature,
            creatures,
            config,
            spatialIndex
          });
          if (predatorTarget) {
            const started = startCreatureChase({
              creature,
              target: predatorTarget.target,
              metrics,
              config,
              tick
            });
            if (started) {
              intent = 'hunt';
              target = { ...predatorTarget.target.position };
              targeting = {
                targetId: predatorTarget.target?.id ?? null,
                preySpecies: predatorTarget.preySpecies,
                score: predatorTarget.score,
                distance: predatorTarget.distance
              };
            }
          }
        }

        if (intent !== 'hunt') {
          const choice = selectFoodChoice({
            species: creature.species,
            availability: foodAvailability,
            minimums: foodMinimums
          });
          if (choice) {
            intent = 'eat';
            foodType = choice.type;
          } else if (canSeekPerceivedFood) {
            intent = 'seek';
            target = { ...perceivedFoodCell };
            foodType = perceivedFoodType;
          } else if (shouldHunt) {
            // Only hunt as fallback if not resting
            const predatorTarget = selectPredatorTarget({
              predator: creature,
              creatures,
              config,
              spatialIndex
            });
            if (predatorTarget) {
              const started = startCreatureChase({
                creature,
                target: predatorTarget.target,
                metrics,
                config,
                tick
              });
              if (started) {
                intent = 'hunt';
                target = { ...predatorTarget.target.position };
                targeting = {
                  targetId: predatorTarget.target?.id ?? null,
                  preySpecies: predatorTarget.preySpecies,
                  score: predatorTarget.score,
                  distance: predatorTarget.distance
                };
              }
            } else {
              memoryEntry = selectMemoryTarget({
                creature,
                type: MEMORY_TYPES.FOOD,
                foodTypes: dietPreferences
              });
            }
          } else {
            memoryEntry = selectMemoryTarget({
              creature,
              type: MEMORY_TYPES.FOOD,
              foodTypes: dietPreferences
            });
          }
        }
      }
      if (memoryEntry && memoryEntry.type === MEMORY_TYPES.FOOD) {
        clearSearchState(creature);
      } else if (intent === 'wander') {
        // Hungry with no perceived/memory food target: explore outward instead of milling.
        const searchTarget = pickSearchTarget({
          creature,
          goal: 'food',
          config,
          world,
          rng
        });
        if (searchTarget) {
          intent = 'seek';
          target = { ...searchTarget };
        }
      }
    } else if (
      !handled &&
      (creature.priority === 'thirst' || herbivoreConcernedNoWater) &&
      concernedThirst
    ) {
      if (urgentThirst && waterTarget && !nearbyWater) {
        const dx = waterTarget.x + 0.5 - creature.position.x;
        const dy = waterTarget.y + 0.5 - creature.position.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= maxRendezvousDistance) {
          const search = ensureSearchState(creature);
          search.goal = 'water-rendezvous';
          search.target = { x: waterTarget.x + 0.5, y: waterTarget.y + 0.5 };
          search.commitTicksRemaining = Math.max(
            search.commitTicksRemaining ?? 0,
            rendezvousCommitTicks
          );
          intent = 'seek';
          target = { ...search.target };
        }
      }

      if (intent === 'wander') {
        if (perceivedWaterCell && !nearbyWater) {
          clearSearchState(creature);
          intent = 'seek';
          target = { ...perceivedWaterCell };
        } else {
          memoryEntry = selectMemoryTarget({
            creature,
            type: MEMORY_TYPES.WATER
          });
          if (memoryEntry) {
            clearSearchState(creature);
          } else if (!nearbyWater) {
            const searchTarget = pickSearchTarget({
              creature,
              goal: 'water',
              config,
              world,
              rng
            });
            if (searchTarget) {
              intent = 'seek';
              target = { ...searchTarget };
            }
          }
        }
      }
    }

    // Resting predators: previously they would camp at water.
    // Now they simply wander when full, letting the pack module
    // (if enabled) or natural wander behavior take over.
    // Thirst logic still handles water seeking when needed.

    if (intent === 'wander' && !memoryEntry && grazeEnabled && !isPredator) {
      const hasGrazeMeters =
        energyRatio >= grazeMinEnergyRatio && waterRatio >= grazeMinWaterRatio;
      const localHerdSize = creature.herding?.herdSize ?? 1;
      const isThreatened = creature.herding?.isThreatened === true;
      if (hasGrazeMeters && localHerdSize >= grazeMinLocalHerdSize && !isThreatened) {
        intent = 'graze';
        target = null;
      }
    }

    if (memoryEntry) {
      intent = 'seek';
      target = { x: memoryEntry.x, y: memoryEntry.y };
      foodType = memoryEntry.foodType ?? null;
    }

    const targetDistanceSq =
      target && creature.position
        ? (creature.position.x - target.x) ** 2 + (creature.position.y - target.y) ** 2
        : null;
    if (memoryEntry && targetDistanceSq !== null && targetDistanceSq <= 1) {
      const missingWater =
        memoryEntry.type === MEMORY_TYPES.WATER && !hasNearbyWater(world, cell, config);
      const missingFood =
        memoryEntry.type === MEMORY_TYPES.FOOD &&
        !selectFoodChoice({
          species: creature.species,
          availability: foodAvailability,
          minimums: foodMinimums
        });
      if (missingWater || missingFood) {
        applyMemoryPenalty(memoryEntry, config);
        intent = 'wander';
        target = null;
      }
    }

    creature.intent = { type: intent, foodType, target };
    creature.targeting = targeting;
  }
}

// Re-export helpers needed by actions module
export { getCreatureCell, hasNearbyWater, getGrassAtCell, resolveActionAmount };
