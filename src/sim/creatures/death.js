/**
 * Death Module
 *
 * Handles creature death conditions and removal.
 */

import { resolveTicksPerSecond } from './life-stages.js';

/**
 * Resolves maximum age in ticks from config.
 */
const resolveMaxAgeTicks = (value, fallback, ticksPerSecond) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.trunc(value * ticksPerSecond));
};

/**
 * Checks if a meter value is empty (zero or below).
 */
const isMeterEmpty = (value) => Number.isFinite(value) && value <= 0;

/**
 * Determines cause of death for a creature, if any.
 * Returns null if creature should not die.
 */
const selectDeathCause = ({ creature, maxAgeTicks }) => {
  if (Number.isFinite(maxAgeTicks) && maxAgeTicks > 0) {
    if (Number.isFinite(creature.ageTicks) && creature.ageTicks >= maxAgeTicks) {
      return 'age';
    }
  }
  const meters = creature?.meters;
  if (!meters) {
    return null;
  }
  if (isMeterEmpty(meters.hp)) {
    return 'injury';
  }
  if (isMeterEmpty(meters.water)) {
    return 'thirst';
  }
  if (isMeterEmpty(meters.energy)) {
    return 'starvation';
  }
  return null;
};

/**
 * Removes dead creatures from the array and updates metrics.
 * Modifies creatures array in place.
 */
export function applyCreatureDeaths({ creatures, config, metrics }) {
  if (!Array.isArray(creatures)) {
    return;
  }
  const ticksPerSecond = resolveTicksPerSecond(config);
  const maxAgeTicks = resolveMaxAgeTicks(
    config?.creatureMaxAge,
    Infinity,
    ticksPerSecond
  );
  const counts = metrics?.deathsByCause;
  let totalDeaths = 0;
  let writeIndex = 0;

  for (let i = 0; i < creatures.length; i += 1) {
    const creature = creatures[i];
    const cause = selectDeathCause({ creature, maxAgeTicks });
    if (!cause) {
      creatures[writeIndex] = creature;
      writeIndex += 1;
      continue;
    }
    creature.deathCause = cause;
    totalDeaths += 1;
    if (counts && counts[cause] !== undefined) {
      counts[cause] += 1;
    } else if (counts) {
      counts.other += 1;
    }
  }

  creatures.length = writeIndex;
  if (metrics) {
    metrics.deathsTotal = (metrics.deathsTotal ?? 0) + totalDeaths;
  }
}
