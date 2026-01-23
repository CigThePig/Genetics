/**
 * Config Resolvers Module
 *
 * Shared utility functions for resolving config values with validation
 * and fallbacks. Extracted to avoid duplication across creature modules.
 */

// Re-export from life-stages for convenience
export { resolveTicksPerSecond } from '../creatures/life-stages.js';

/**
 * Clamps a meter value to be non-negative.
 * Returns 0 if value is not a finite number.
 */
export const clampMeter = (value) => Math.max(0, Number.isFinite(value) ? value : 0);

/**
 * Resolves a ratio value (0-1 range) with fallback.
 */
export const resolveRatio = (value, fallback) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, value));
};

/**
 * Resolves a distance value (non-negative) with fallback.
 */
export const resolveDistance = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

/**
 * Resolves a basal drain value (non-negative, defaults to 0).
 */
export const resolveBasalDrain = (value) => (Number.isFinite(value) ? Math.max(0, value) : 0);

/**
 * Resolves a trait drain value (non-negative) with fallback.
 */
export const resolveTraitDrain = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

/**
 * Resolves minimum age in ticks from seconds value.
 * @param {number} value - Age in seconds from config
 * @param {number} fallback - Fallback age in seconds
 * @param {number} ticksPerSecond - Ticks per second for conversion
 */
export const resolveMinAgeTicks = (value, fallback, ticksPerSecond) => {
  if (!Number.isFinite(value)) {
    return Math.max(0, Math.trunc(fallback * ticksPerSecond));
  }
  return Math.max(0, Math.trunc(value * ticksPerSecond));
};

/**
 * Resolves the water terrain type from config.
 */
export const resolveWaterTerrain = (config) => config?.waterTerrain ?? 'water';

/**
 * Checks if a tile at (x, y) is water terrain.
 */
export const isWaterTile = (world, x, y, waterTerrain) =>
  typeof world?.getTerrainAt === 'function' && world.getTerrainAt(x, y) === waterTerrain;
