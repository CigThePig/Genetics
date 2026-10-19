import { resolveWaterTerrain, isWaterTile } from '../utils/resolvers.js';
import { SPECIES } from '../species.js';
import { resolveNeedMeterBase, normalizeNeedRatio } from './metabolism.js';

const resolveNeedSwitchMargin = (config) =>
  Number.isFinite(config?.creatureNeedSwitchMargin)
    ? Math.max(0, config.creatureNeedSwitchMargin)
    : 0.05;

export const resolveActionAmount = (value, fallback) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

export const resolveCommitTicks = (seconds, fallbackSeconds, ticksPerSecond) => {
  const tps = Number.isFinite(ticksPerSecond) ? ticksPerSecond : 60;
  const value = Number.isFinite(seconds) ? seconds : fallbackSeconds;
  return Math.max(0, Math.trunc(value * tps));
};

export const resolveGrazeEnabled = (config) => config?.creatureGrazeEnabled !== false;

export const resolveGrazeMinRatio = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;

export const resolveGrazeMinLocalHerdSize = (config) =>
  Number.isFinite(config?.creatureGrazeMinLocalHerdSize)
    ? Math.max(1, Math.trunc(config.creatureGrazeMinLocalHerdSize))
    : 3;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const clamp01 = (value) => clamp(value, 0, 1);

export const HERBIVORE_SPECIES = [SPECIES.SQUARE, SPECIES.CIRCLE];

export const isHerbivoreSpecies = (species) =>
  species === SPECIES.SQUARE || species === SPECIES.CIRCLE;

export const getSpeciesKey = (species) => (isHerbivoreSpecies(species) ? species : null);

export const resolveHerdingMinGroupSize = (config) =>
  Number.isFinite(config?.creatureHerdingMinGroupSize)
    ? Math.max(1, Math.trunc(config.creatureHerdingMinGroupSize))
    : 2;

export const resolveDrinkConcernMargin = (config) =>
  Number.isFinite(config?.creatureDrinkConcernMargin)
    ? Math.max(0, Math.min(0.35, config.creatureDrinkConcernMargin))
    : 0.18;

export const resolveWaterRendezvousEnabled = (config) =>
  config?.creatureWaterRendezvousEnabled !== false;

export const resolveWaterRendezvousEvalSeconds = (config) =>
  Number.isFinite(config?.creatureWaterRendezvousEvalSeconds)
    ? Math.max(0.25, config.creatureWaterRendezvousEvalSeconds)
    : 1.0;

export const resolveWaterRendezvousCooldownSeconds = (config) =>
  Number.isFinite(config?.creatureWaterRendezvousCooldownSeconds)
    ? Math.max(0, config.creatureWaterRendezvousCooldownSeconds)
    : 5.0;

export const resolveWaterRendezvousSearchRadius = (config) =>
  Number.isFinite(config?.creatureWaterRendezvousSearchRadius)
    ? Math.max(5, config.creatureWaterRendezvousSearchRadius)
    : 26;

export const resolveWaterRendezvousCandidateCount = (config) =>
  Number.isFinite(config?.creatureWaterRendezvousCandidateCount)
    ? Math.max(4, Math.trunc(config.creatureWaterRendezvousCandidateCount))
    : 18;

export const resolveWaterRendezvousThirstPressureThreshold = (config) =>
  Number.isFinite(config?.creatureWaterRendezvousThirstPressureThreshold)
    ? clamp01(config.creatureWaterRendezvousThirstPressureThreshold)
    : 0.12;

export const resolveWaterRendezvousMaxDistance = (config) =>
  Number.isFinite(config?.creatureWaterRendezvousMaxDistance)
    ? Math.max(5, config.creatureWaterRendezvousMaxDistance)
    : 70;

export const resolveWaterRendezvousPreferHerdAnchor = (config) =>
  config?.creatureWaterRendezvousPreferHerdAnchor !== false;

export const resolveWaterRendezvousCommitSeconds = (config) =>
  Number.isFinite(config?.creatureWaterRendezvousCommitSeconds)
    ? Math.max(0.25, config.creatureWaterRendezvousCommitSeconds)
    : 2.5;

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

export const ensureSearchState = (creature) => {
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

export const clearSearchState = (creature) => {
  if (!creature?.search) {
    return;
  }
  creature.search.goal = null;
  creature.search.target = null;
  creature.search.radius = 0;
  creature.search.attempts = 0;
  creature.search.commitTicksRemaining = 0;
};

export const pickSearchTarget = ({ creature, goal, config, world, rng }) => {
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

export const getCreatureCell = (creature) => ({
  x: Math.floor(creature.position.x),
  y: Math.floor(creature.position.y)
});

export const hasNearbyWater = (world, cell, config) => {
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

export const isDrinkableCell = (world, x, y, config) => hasNearbyWater(world, { x, y }, config);

export const getGrassAtCell = (world, cell) => {
  if (!world?.getGrassAt) {
    return 0;
  }
  const amount = world.getGrassAt(cell.x, cell.y);
  return Number.isFinite(amount) ? amount : 0;
};

export const resolveWorldBounds = (world) => ({
  maxX: Number.isFinite(world?.width) ? Math.max(0, world.width - 1) : 0,
  maxY: Number.isFinite(world?.height) ? Math.max(0, world.height - 1) : 0
});

export const clampToWorld = (point, world) => {
  const { maxX, maxY } = resolveWorldBounds(world);
  return {
    x: Math.max(0, Math.min(maxX, point.x)),
    y: Math.max(0, Math.min(maxY, point.y))
  };
};

export const applyRallyJitter = ({ point, rng, world, waterTerrain }) => {
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
