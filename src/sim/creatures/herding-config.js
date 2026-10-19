import { SPECIES } from '../species.js';
import { resolveTicksPerSecond } from '../utils/resolvers.js';

const PREDATOR_SPECIES = new Set([SPECIES.TRIANGLE, SPECIES.OCTAGON]);

export const HERBIVORE_SPECIES = [SPECIES.SQUARE, SPECIES.CIRCLE];

export const isPredator = (species) => PREDATOR_SPECIES.has(species);

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const clamp01 = (value) => clamp(value, 0, 1);

export const smoothstep = (t) => {
  const clamped = clamp01(t);
  return clamped * clamped * (3 - 2 * clamped);
};

export const resolveHerdingRange = (config) =>
  Number.isFinite(config?.creatureHerdingRange) ? Math.max(0, config.creatureHerdingRange) : 10;

export const resolveThreatRange = (config) =>
  Number.isFinite(config?.creatureHerdingThreatRange)
    ? Math.max(0, config.creatureHerdingThreatRange)
    : 12;

export const resolveHerdingStrength = (config) =>
  Number.isFinite(config?.creatureHerdingStrength)
    ? Math.max(0, Math.min(1, config.creatureHerdingStrength))
    : 0.03;

export const resolveAlignmentStrength = (config) =>
  Number.isFinite(config?.creatureHerdingAlignmentStrength)
    ? Math.max(0, Math.min(1, config.creatureHerdingAlignmentStrength))
    : 0.4;

export const resolveThreatStrength = (config) =>
  Number.isFinite(config?.creatureHerdingThreatStrength)
    ? Math.max(0, Math.min(1, config.creatureHerdingThreatStrength))
    : 0.4;

export const resolveHerdingMinGroupSize = (config) =>
  Number.isFinite(config?.creatureHerdingMinGroupSize)
    ? Math.max(1, Math.trunc(config.creatureHerdingMinGroupSize))
    : 2;

export const resolveHerdingSeparation = (config) =>
  Number.isFinite(config?.creatureHerdingSeparation)
    ? Math.max(0, config.creatureHerdingSeparation)
    : 2.5;

export const resolveSeparationMultiplier = (config) =>
  Number.isFinite(config?.creatureHerdingSeparationMultiplier)
    ? Math.max(0, config.creatureHerdingSeparationMultiplier)
    : 1.5;

export const resolveComfortMin = (config) =>
  Number.isFinite(config?.creatureHerdingComfortMin)
    ? Math.max(0, config.creatureHerdingComfortMin)
    : 2.0;

export const resolveComfortMax = (config) =>
  Number.isFinite(config?.creatureHerdingComfortMax)
    ? Math.max(0, config.creatureHerdingComfortMax)
    : 4.5;

export const resolveIdealDistance = (config) =>
  Number.isFinite(config?.creatureHerdingIdealDistance)
    ? Math.max(0, config.creatureHerdingIdealDistance)
    : 4;

export const resolveOffsetDeadzone = (config) =>
  Number.isFinite(config?.creatureHerdingOffsetDeadzone)
    ? Math.max(0, config.creatureHerdingOffsetDeadzone)
    : 0.04;

export const resolveOffsetSmoothing = (config) =>
  Number.isFinite(config?.creatureHerdingOffsetSmoothing)
    ? Math.max(0, Math.min(1, config.creatureHerdingOffsetSmoothing))
    : 0.25;

export const resolveHerdingAnchorEnabled = (config) =>
  config?.creatureHerdingAnchorEnabled !== false;

export const resolveHerdingAnchorEvalSeconds = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorEvalSeconds)
    ? Math.max(0.25, config.creatureHerdingAnchorEvalSeconds)
    : 1.5;

export const resolveHerdingAnchorCooldownSeconds = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorCooldownSeconds)
    ? Math.max(0, config.creatureHerdingAnchorCooldownSeconds)
    : 4.0;

export const resolveHerdingAnchorSearchRadius = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorSearchRadius)
    ? Math.max(5, config.creatureHerdingAnchorSearchRadius)
    : 28;

export const resolveHerdingAnchorCandidateCount = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorCandidateCount)
    ? Math.max(4, Math.trunc(config.creatureHerdingAnchorCandidateCount))
    : 12;

export const resolveHerdingAnchorDriftSpeed = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorDriftSpeed)
    ? Math.max(0, config.creatureHerdingAnchorDriftSpeed)
    : 2.2;

export const resolveHerdingAnchorPullStrength = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorPullStrength)
    ? Math.max(0, Math.min(2, config.creatureHerdingAnchorPullStrength))
    : 0.55;

export const resolveHerdingAnchorSoftRadiusBase = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorSoftRadiusBase)
    ? Math.max(1, config.creatureHerdingAnchorSoftRadiusBase)
    : 6;

export const resolveHerdingAnchorSoftRadiusScale = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorSoftRadiusScale)
    ? Math.max(0, config.creatureHerdingAnchorSoftRadiusScale)
    : 1.25;

export const resolveHerdingAnchorMaxInfluenceDistance = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorMaxInfluenceDistance)
    ? Math.max(5, config.creatureHerdingAnchorMaxInfluenceDistance)
    : 60;

export const resolveHerdingAnchorFoodSampleRadius = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorFoodSampleRadius)
    ? Math.max(1, config.creatureHerdingAnchorFoodSampleRadius)
    : 3;

export const resolveHerdingAnchorWaterSearchMax = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorWaterSearchMax)
    ? Math.max(2, config.creatureHerdingAnchorWaterSearchMax)
    : 16;

export const resolveHerdingAnchorThreatHalfLifeSeconds = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorThreatHalfLifeSeconds)
    ? Math.max(1, config.creatureHerdingAnchorThreatHalfLifeSeconds)
    : 8.0;

export const resolveHerdingAnchorSwitchMargin = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorSwitchMargin)
    ? Math.max(0, config.creatureHerdingAnchorSwitchMargin)
    : 0.15;

export const resolveHerdingAnchorRandomness = (config) =>
  Number.isFinite(config?.creatureHerdingAnchorRandomness)
    ? Math.max(0, Math.min(0.25, config.creatureHerdingAnchorRandomness))
    : 0.08;

const resolvePostDrinkRegroupSeconds = (config) =>
  Number.isFinite(config?.creaturePostDrinkRegroupSeconds)
    ? Math.max(0, config.creaturePostDrinkRegroupSeconds)
    : 4.0;

export const resolvePostDrinkRegroupAnchorBoost = (config) =>
  Number.isFinite(config?.creaturePostDrinkRegroupAnchorBoost)
    ? Math.max(0, Math.min(1, config.creaturePostDrinkRegroupAnchorBoost))
    : 0.35;

export const resolvePostDrinkRegroupDeadzoneMultiplier = (config) =>
  Number.isFinite(config?.creaturePostDrinkRegroupDeadzoneMultiplier)
    ? Math.max(0, Math.min(1, config.creaturePostDrinkRegroupDeadzoneMultiplier))
    : 0.6;

export const resolveRegroupEnabled = (config) => config?.creatureHerdingRegroupEnabled !== false;

export const resolveRegroupMinLocalHerdSize = (config) =>
  Number.isFinite(config?.creatureHerdingRegroupMinLocalHerdSize)
    ? Math.max(1, Math.trunc(config.creatureHerdingRegroupMinLocalHerdSize))
    : 3;

export const resolveRegroupRange = (config) =>
  Number.isFinite(config?.creatureHerdingRegroupRange)
    ? Math.max(0, config.creatureHerdingRegroupRange)
    : 45;

export const resolveRegroupStrength = (config) =>
  Number.isFinite(config?.creatureHerdingRegroupStrength)
    ? Math.max(0, Math.min(1, config.creatureHerdingRegroupStrength))
    : 0.35;

export const resolveRegroupIntervalTicks = (config) => {
  const ticksPerSecond = resolveTicksPerSecond(config);
  const seconds = Number.isFinite(config?.creatureHerdingRegroupIntervalSeconds)
    ? Math.max(0.05, config.creatureHerdingRegroupIntervalSeconds)
    : 0.6;
  return Math.max(1, Math.floor(seconds * ticksPerSecond));
};

export const resolvePostDrinkRegroupMaxTicks = (config) => {
  const ticksPerSecond = resolveTicksPerSecond(config);
  const seconds = resolvePostDrinkRegroupSeconds(config);
  return Math.max(0, Math.floor(seconds * ticksPerSecond));
};

export const isHerdingEnabled = (config) => config?.creatureHerdingEnabled !== false;

export const wrapPi = (angle) => {
  let a = angle % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
};

export const resolveWorldBounds = (world) => ({
  maxX: Number.isFinite(world?.width) ? Math.max(0, world.width - 0.001) : 0,
  maxY: Number.isFinite(world?.height) ? Math.max(0, world.height - 0.001) : 0
});
