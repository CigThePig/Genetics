/**
 * Aging Module
 *
 * Handles per-creature aging calculations based on genome (growthRate, longevity).
 * Traits remain fixed for life; aging effects happen via maturityScale.
 */

import { resolveTicksPerSecond } from './life-stages.js';
import { mapGenomeToTraitMultipliers } from './genetics.js';

/**
 * Resolves a creature's maturity scale based on its genome.
 * Higher growthRate = faster maturation through life stages.
 * Returns a dimensionless multiplier clamped to [0.25, 4].
 */
export const resolveCreatureMaturityScale = ({ genome, config }) => {
  const multipliers = mapGenomeToTraitMultipliers(genome, config);
  const growthMult = Number.isFinite(multipliers.growthRate) ? multipliers.growthRate : 1;
  // Clamp to safe range to prevent extreme values
  return Math.min(4, Math.max(0.25, growthMult));
};

/**
 * Resolves a creature's maximum age in ticks based on its genome.
 * Implements "grow fast, die fast" coupling:
 *   - High growthRate tends to reduce lifespan
 *   - High longevity increases lifespan
 *   - creatureGrowthLongevityCoupling controls the strength of the coupling
 *
 * @returns {number} Max age in ticks, or Infinity if no max age configured
 */
export const resolveCreatureMaxAgeTicks = ({ genome, config }) => {
  const ticksPerSecond = resolveTicksPerSecond(config);
  
  // Get base max age from config (in seconds), convert to ticks
  const maxAgeSeconds = config?.creatureMaxAge;
  if (!Number.isFinite(maxAgeSeconds) || maxAgeSeconds <= 0) {
    return Infinity;
  }
  const baseMaxAgeTicks = maxAgeSeconds * ticksPerSecond;

  const multipliers = mapGenomeToTraitMultipliers(genome, config);
  const longevityMult = Number.isFinite(multipliers.longevity) ? multipliers.longevity : 1;
  const growthMult = Number.isFinite(multipliers.growthRate) ? multipliers.growthRate : 1;

  // "Grow fast, die fast" coupling
  // Higher growthRate reduces lifespan; coupling exponent controls strength
  const coupling = Number.isFinite(config?.creatureGrowthLongevityCoupling)
    ? config.creatureGrowthLongevityCoupling
    : 1;
  
  // coupledLongevity = longevityMult * (1/growthMult)^coupling
  // If growthMult > 1 (fast grower), this reduces lifespan
  // If growthMult < 1 (slow grower), this increases lifespan
  const coupledLongevity = longevityMult * Math.pow(1 / growthMult, coupling);
  
  const maxAgeTicks = baseMaxAgeTicks * coupledLongevity;
  
  return Math.max(1, Math.trunc(maxAgeTicks));
};
