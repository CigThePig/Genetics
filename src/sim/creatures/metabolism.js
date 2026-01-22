/**
 * Metabolism Module
 *
 * Handles basal metabolism drains, sprint decisions/costs, and stamina regeneration.
 */

import { resolveTicksPerSecond } from './life-stages.js';
import {
  clampMeter,
  resolveBasalDrain,
  resolveTraitDrain
} from '../utils/resolvers.js';

/**
 * Calculates tick scale (fraction of second per tick).
 */
const resolveTickScale = (config) => 1 / resolveTicksPerSecond(config);

/**
 * Resolves a need meter base value (positive, defaults to 1).
 */
const resolveNeedMeterBase = (value) =>
  Number.isFinite(value) && value > 0 ? value : 1;

/**
 * Resolves an action threshold (0-1 range).
 */
const resolveActionThreshold = (value, fallback) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, value));
};

/**
 * Resolves sprint speed multiplier.
 */
const resolveSprintMultiplier = (value, fallback) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

/**
 * Resolves stamina regeneration rate.
 */
const resolveStaminaRegen = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

/**
 * Normalizes a need value to a 0-1 ratio.
 */
const normalizeNeedRatio = (value, base) => {
  const ratio = value / base;
  if (!Number.isFinite(ratio)) {
    return 0;
  }
  return Math.min(1, Math.max(0, ratio));
};

/**
 * Applies basal metabolism drains to all creatures.
 * Drains energy, water, and stamina based on traits and life stage.
 */
export function updateCreatureBasalMetabolism({ creatures, config }) {
  if (!Array.isArray(creatures)) {
    return;
  }
  const tickScale = resolveTickScale(config);
  const fallbackEnergyDrain = resolveBasalDrain(config?.creatureBasalEnergyDrain);
  const fallbackWaterDrain = resolveBasalDrain(config?.creatureBasalWaterDrain);
  const fallbackStaminaDrain = resolveBasalDrain(
    config?.creatureBasalStaminaDrain
  );

  for (const creature of creatures) {
    const meters = creature.meters;
    if (!meters) {
      continue;
    }
    const energyDrain =
      resolveTraitDrain(creature?.traits?.basalEnergyDrain, fallbackEnergyDrain) *
      tickScale;
    const waterDrain =
      resolveTraitDrain(creature?.traits?.basalWaterDrain, fallbackWaterDrain) *
      tickScale;
    const staminaDrain =
      resolveTraitDrain(creature?.traits?.basalStaminaDrain, fallbackStaminaDrain) *
      tickScale;
    const scale = Number.isFinite(creature.lifeStage?.metabolismScale)
      ? creature.lifeStage.metabolismScale
      : 1;
    meters.energy = clampMeter(meters.energy - energyDrain * scale);
    meters.water = clampMeter(meters.water - waterDrain * scale);
    meters.stamina = clampMeter(meters.stamina - staminaDrain * scale);
  }
}

/**
 * Decides whether each creature should be sprinting based on stamina levels.
 */
export function updateCreatureSprintDecision({ creatures, config }) {
  if (!Array.isArray(creatures)) {
    return;
  }
  const baseStamina = resolveNeedMeterBase(config?.creatureBaseStamina);
  const fallbackStart = resolveActionThreshold(
    config?.creatureSprintStartThreshold,
    0.7
  );
  const fallbackStop = resolveActionThreshold(
    config?.creatureSprintStopThreshold,
    0.4
  );

  for (const creature of creatures) {
    const meters = creature?.meters;
    if (!meters) {
      continue;
    }
    if (!creature.motion) {
      creature.motion = {};
    }
    const intentType = creature.intent?.type;
    if (intentType === 'drink' || intentType === 'eat') {
      creature.motion.isSprinting = false;
      continue;
    }
    const startThreshold = resolveActionThreshold(
      creature?.traits?.sprintStartThreshold,
      fallbackStart
    );
    const stopThreshold = resolveActionThreshold(
      creature?.traits?.sprintStopThreshold,
      fallbackStop
    );
    const effectiveStop = Math.min(startThreshold, stopThreshold);
    const staminaRatio = normalizeNeedRatio(meters.stamina, baseStamina);
    if (creature.motion.isSprinting) {
      creature.motion.isSprinting = staminaRatio > effectiveStop;
    } else {
      creature.motion.isSprinting = staminaRatio >= startThreshold;
    }
  }
}

/**
 * Applies stamina cost for sprinting creatures.
 */
export function applyCreatureSprintCosts({ creatures, config }) {
  if (!Array.isArray(creatures)) {
    return;
  }
  const tickScale = resolveTickScale(config);
  const fallbackDrain = resolveBasalDrain(
    config?.creatureSprintStaminaDrain
  );

  for (const creature of creatures) {
    const meters = creature?.meters;
    if (!meters || !creature.motion?.isSprinting) {
      continue;
    }
    const sprintDrain =
      resolveTraitDrain(creature?.traits?.sprintStaminaDrain, fallbackDrain) *
      tickScale;
    const scale = Number.isFinite(creature.lifeStage?.metabolismScale)
      ? creature.lifeStage.metabolismScale
      : 1;
    meters.stamina = clampMeter(meters.stamina - sprintDrain * scale);
  }
}

/**
 * Regenerates stamina for non-sprinting creatures.
 */
export function regenerateCreatureStamina({ creatures, config }) {
  if (!Array.isArray(creatures)) {
    return;
  }
  const tickScale = resolveTickScale(config);
  const baseStamina = resolveNeedMeterBase(config?.creatureBaseStamina);
  const fallbackRegen = resolveStaminaRegen(
    config?.creatureStaminaRegen,
    0
  );

  for (const creature of creatures) {
    const meters = creature?.meters;
    if (!meters || creature.motion?.isSprinting) {
      continue;
    }
    const regen =
      resolveStaminaRegen(creature?.traits?.staminaRegen, fallbackRegen) *
      tickScale;
    const scale = Number.isFinite(creature.lifeStage?.metabolismScale)
      ? creature.lifeStage.metabolismScale
      : 1;
    meters.stamina = clampMeter(
      Math.min(baseStamina, meters.stamina + regen * scale)
    );
  }
}

// Re-export helpers needed by other modules
export {
  resolveTickScale,
  resolveNeedMeterBase,
  resolveActionThreshold,
  resolveSprintMultiplier,
  normalizeNeedRatio
};
