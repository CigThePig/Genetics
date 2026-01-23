/**
 * Life Stages Module
 *
 * Shared logic for creature life stages (juvenile, adult, elder).
 * Extracted to avoid duplication between index.js and reproduction.js.
 */

/**
 * Resolves ticks per second from config, with fallback to 60.
 */
export const resolveTicksPerSecond = (config) =>
  Number.isFinite(config?.ticksPerSecond) ? Math.max(1, config.ticksPerSecond) : 60;

/**
 * Default life stages used when config doesn't specify custom stages.
 * Ages are in seconds (converted to ticks by getLifeStageDefinitions).
 */
const fallbackLifeStages = [
  {
    id: 'juvenile',
    label: 'Juvenile',
    minAge: 0,
    movementScale: 0.85,
    metabolismScale: 0.9
  },
  {
    id: 'adult',
    label: 'Adult',
    minAge: 120,
    movementScale: 1,
    metabolismScale: 1
  },
  {
    id: 'elder',
    label: 'Elder',
    minAge: 300,
    movementScale: 0.75,
    metabolismScale: 1.1
  }
];

/**
 * Gets normalized life stage definitions from config.
 * Converts minAge from seconds to ticks.
 */
export const getLifeStageDefinitions = (config) => {
  const ticksPerSecond = resolveTicksPerSecond(config);
  const stages = Array.isArray(config?.creatureLifeStages)
    ? config.creatureLifeStages
    : fallbackLifeStages;
  const normalized = stages
    .filter((stage) => stage && Number.isFinite(stage.minAge))
    .map((stage) => ({
      id: stage.id ?? stage.label ?? 'stage',
      label: stage.label ?? stage.id ?? 'Stage',
      minAge: Math.max(0, Math.trunc(stage.minAge * ticksPerSecond)),
      movementScale: Number.isFinite(stage.movementScale) ? stage.movementScale : 1,
      metabolismScale: Number.isFinite(stage.metabolismScale) ? stage.metabolismScale : 1
    }));

  if (!normalized.length) {
    return fallbackLifeStages;
  }

  return normalized.sort((a, b) => a.minAge - b.minAge);
};

/**
 * Determines which life stage a creature is in based on age in ticks.
 */
export const resolveLifeStage = (ageTicks, config) => {
  const stages = getLifeStageDefinitions(config);
  let current = stages[0];
  for (const stage of stages) {
    if (ageTicks >= stage.minAge) {
      current = stage;
    } else {
      break;
    }
  }
  return current;
};

/**
 * Creates a life stage state object for a creature.
 * This is the format stored on creature.lifeStage.
 */
export const createLifeStageState = (ageTicks, config) => {
  const stage = resolveLifeStage(ageTicks, config);
  return {
    id: stage.id,
    label: stage.label,
    movementScale: stage.movementScale,
    metabolismScale: stage.metabolismScale
  };
};
