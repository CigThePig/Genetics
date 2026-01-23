import { resolveTicksPerSecond } from '../utils/resolvers.js';

const clamp01 = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
};

const resolvePositive = (value, fallback) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

const resolveNonNegative = (value, fallback) =>
  Number.isFinite(value) && value >= 0 ? value : fallback;

const getDistanceSq = (x1, y1, x2, y2) => {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
};

export const MEMORY_TYPES = Object.freeze({
  FOOD: 'food',
  WATER: 'water',
  DANGER: 'danger',
  MATE: 'mate'
});

const resolveMemoryConfig = (config) => {
  const ticksPerSecond = resolveTicksPerSecond(config);
  const tickScale = 1 / ticksPerSecond;
  return {
    maxEntries: resolvePositive(config?.creatureMemoryMaxEntries, 12),
    decay: resolveNonNegative(config?.creatureMemoryDecay, 0.02) * tickScale,
    minStrength: resolveNonNegative(config?.creatureMemoryMinStrength, 0.05),
    mergeDistance: resolveNonNegative(config?.creatureMemoryMergeDistance, 1.5)
  };
};

const resolveVisitPenalty = (config) => resolveNonNegative(config?.creatureMemoryVisitPenalty, 0.5);

const getMemoryStrength = ({ distance, range }) => {
  const safeRange = resolvePositive(range, 1);
  const base = 1 - distance / safeRange;
  return clamp01(base);
};

const decayEntry = (entry, decay, minStrength) => {
  entry.ageTicks = (Number.isFinite(entry.ageTicks) ? entry.ageTicks : 0) + 1;
  entry.strength = Math.max(0, (entry.strength ?? 0) - decay);
  return entry.strength >= minStrength;
};

const findMergeCandidate = (entries, entry, mergeDistanceSq) =>
  entries.find(
    (candidate) =>
      candidate.type === entry.type &&
      (candidate.foodType ?? null) === (entry.foodType ?? null) &&
      getDistanceSq(candidate.x, candidate.y, entry.x, entry.y) <= mergeDistanceSq
  );

const addOrMergeEntry = ({ entries, entry, mergeDistance }) => {
  const mergeDistanceSq = mergeDistance * mergeDistance;
  const candidate = findMergeCandidate(entries, entry, mergeDistanceSq);
  if (candidate) {
    candidate.x = entry.x;
    candidate.y = entry.y;
    candidate.strength = Math.max(candidate.strength ?? 0, entry.strength ?? 0);
    candidate.ageTicks = 0;
    return candidate;
  }
  entries.push(entry);
  return entry;
};

const trimEntries = (entries, maxEntries) => {
  if (entries.length <= maxEntries) {
    return entries;
  }
  entries.sort((a, b) => {
    const strengthGap = (b.strength ?? 0) - (a.strength ?? 0);
    if (strengthGap !== 0) {
      return strengthGap;
    }
    return (a.ageTicks ?? 0) - (b.ageTicks ?? 0);
  });
  entries.length = maxEntries;
  return entries;
};

const ensureMemoryState = (creature) => {
  if (!creature.memory || !Array.isArray(creature.memory.entries)) {
    creature.memory = { entries: [] };
  }
  return creature.memory;
};

export function updateCreatureMemory({ creatures, config }) {
  if (!Array.isArray(creatures)) {
    return;
  }
  const { maxEntries, decay, minStrength, mergeDistance } = resolveMemoryConfig(config);

  for (const creature of creatures) {
    const memory = ensureMemoryState(creature);
    const entries = memory.entries;
    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const keep = decayEntry(entries[i], decay, minStrength);
      if (!keep) {
        entries.splice(i, 1);
      }
    }

    const perception = creature?.perception;
    const range = Number.isFinite(perception?.range) ? perception.range : 0;

    if (perception?.foodCell && perception?.foodType) {
      const distance = Number.isFinite(perception.foodDistance) ? perception.foodDistance : range;
      const strength = getMemoryStrength({ distance, range });
      addOrMergeEntry({
        entries,
        entry: {
          type: MEMORY_TYPES.FOOD,
          foodType: perception.foodType,
          x: perception.foodCell.x,
          y: perception.foodCell.y,
          strength,
          ageTicks: 0
        },
        mergeDistance
      });
    }

    if (perception?.waterCell) {
      const distance = Number.isFinite(perception.waterDistance) ? perception.waterDistance : range;
      const strength = getMemoryStrength({ distance, range });
      addOrMergeEntry({
        entries,
        entry: {
          type: MEMORY_TYPES.WATER,
          x: perception.waterCell.x,
          y: perception.waterCell.y,
          strength,
          ageTicks: 0
        },
        mergeDistance
      });
    }

    trimEntries(entries, maxEntries);
  }
}

export function selectMemoryTarget({ creature, type, foodTypes } = {}) {
  const entries = creature?.memory?.entries;
  if (!Array.isArray(entries) || entries.length === 0) {
    return null;
  }
  const allowedFoodTypes = Array.isArray(foodTypes) ? new Set(foodTypes) : null;
  let best = null;

  for (const entry of entries) {
    if (entry.type !== type) {
      continue;
    }
    if (allowedFoodTypes && !allowedFoodTypes.has(entry.foodType)) {
      continue;
    }
    if (!best) {
      best = entry;
      continue;
    }
    if ((entry.strength ?? 0) > (best.strength ?? 0)) {
      best = entry;
      continue;
    }
    if (
      (entry.strength ?? 0) === (best.strength ?? 0) &&
      (entry.ageTicks ?? 0) < (best.ageTicks ?? 0)
    ) {
      best = entry;
    }
  }

  return best;
}

export function applyMemoryPenalty(entry, config) {
  if (!entry) {
    return;
  }
  const penalty = resolveVisitPenalty(config);
  entry.strength = clamp01((entry.strength ?? 0) * penalty);
  entry.ageTicks = (entry.ageTicks ?? 0) + 1;
}
