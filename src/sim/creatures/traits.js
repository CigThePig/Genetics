import { mapGenomeToTraitMultipliers } from './genetics.js';

const resolveMultiplier = (value) => (Number.isFinite(value) ? value : 1);

const clampGestationMultiplier = (value) => {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.min(1.5, Math.max(0.5, value));
};

const applyMultipliers = (value, ...multipliers) => {
  if (!Number.isFinite(value)) {
    return value;
  }
  return multipliers.reduce((result, multiplier) => result * resolveMultiplier(multiplier), value);
};

const resolveFoodEfficiency = (baseEfficiency, multipliers = {}) => ({
  grass: applyMultipliers(baseEfficiency?.grass, multipliers.grass),
  berries: applyMultipliers(baseEfficiency?.berries, multipliers.berries),
  meat: applyMultipliers(baseEfficiency?.meat, multipliers.meat)
});

/**
 * Computes a coupling multiplier based on gene value.
 * geneDelta = (geneValue - 0.5) * 2 gives range [-1, +1]
 * couplingMult = 1 + geneDelta * scale
 * Clamped to [0.2, 5] for safety.
 */
const computeCouplingMultiplier = (geneValue, scale) => {
  const gene = Number.isFinite(geneValue) ? geneValue : 0.5;
  const geneDelta = (gene - 0.5) * 2; // range -1 to +1
  const mult = 1 + geneDelta * scale;
  return Math.min(5, Math.max(0.2, mult));
};

/**
 * Applies state-based tradeoffs after computing base traits.
 * Positive traits imply deterministic costs:
 * - High speed gene → higher energy/water drain
 * - High sprint gene → higher sprint stamina drain
 * - High perception gene → higher reaction delay
 */
const applyTradeoffs = (traits, genome, config) => {
  // Resolve tradeoff scales from config (defaults match design doc)
  const speedToEnergyScale = Number.isFinite(config?.creatureTradeoffSpeedToEnergyDrainScale)
    ? config.creatureTradeoffSpeedToEnergyDrainScale
    : 0.6;
  const speedToWaterScale = Number.isFinite(config?.creatureTradeoffSpeedToWaterDrainScale)
    ? config.creatureTradeoffSpeedToWaterDrainScale
    : 0.4;
  const sprintToStaminaScale = Number.isFinite(config?.creatureTradeoffSprintToStaminaDrainScale)
    ? config.creatureTradeoffSprintToStaminaDrainScale
    : 0.7;
  const perceptionToReactionScale = Number.isFinite(config?.creatureTradeoffPerceptionToReactionDelayScale)
    ? config.creatureTradeoffPerceptionToReactionDelayScale
    : 0.5;

  // 1) Speed always costs metabolism (energy and water drain)
  const speedGene = genome?.speed;
  if (Number.isFinite(traits.basalEnergyDrain) && speedToEnergyScale > 0) {
    traits.basalEnergyDrain *= computeCouplingMultiplier(speedGene, speedToEnergyScale);
  }
  if (Number.isFinite(traits.basalWaterDrain) && speedToWaterScale > 0) {
    traits.basalWaterDrain *= computeCouplingMultiplier(speedGene, speedToWaterScale);
  }

  // 2) Sprint speed always costs sprint stamina drain
  const sprintGene = genome?.sprintSpeedMultiplier;
  if (Number.isFinite(traits.sprintStaminaDrain) && sprintToStaminaScale > 0) {
    traits.sprintStaminaDrain *= computeCouplingMultiplier(sprintGene, sprintToStaminaScale);
  }

  // 3) Perception always has a reaction delay cost (wide vision = slower processing)
  const perceptionGene = genome?.perceptionRange;
  if (Number.isFinite(traits.reactionDelay) && perceptionToReactionScale > 0) {
    traits.reactionDelay *= computeCouplingMultiplier(perceptionGene, perceptionToReactionScale);
  }

  return traits;
};

export const createCreatureTraits = ({ config, species, genome } = {}) => {
  const multipliers = config?.creatureTraitMultipliers?.[species] ?? {};
  const genomeMultipliers = mapGenomeToTraitMultipliers(genome, config);
  const gestationBase = Number.isFinite(config?.creatureGestationMultiplier)
    ? config.creatureGestationMultiplier
    : 1;

  const baseTraits = {
    speed: applyMultipliers(config?.creatureBaseSpeed, multipliers.speed, genomeMultipliers.speed),
    perceptionRange: applyMultipliers(
      config?.creaturePerceptionRange,
      multipliers.perceptionRange,
      genomeMultipliers.perceptionRange
    ),
    alertness: applyMultipliers(
      config?.creatureAlertnessBase,
      multipliers.alertness,
      genomeMultipliers.alertness
    ),
    reactionDelay: applyMultipliers(
      config?.creatureReactionDelay,
      multipliers.reactionDelay,
      genomeMultipliers.reactionDelay
    ),
    basalEnergyDrain: applyMultipliers(
      config?.creatureBasalEnergyDrain,
      multipliers.basalEnergyDrain,
      genomeMultipliers.basalEnergyDrain
    ),
    basalWaterDrain: applyMultipliers(
      config?.creatureBasalWaterDrain,
      multipliers.basalWaterDrain,
      genomeMultipliers.basalWaterDrain
    ),
    basalStaminaDrain: applyMultipliers(
      config?.creatureBasalStaminaDrain,
      multipliers.basalStaminaDrain,
      genomeMultipliers.basalStaminaDrain
    ),
    sprintStartThreshold: applyMultipliers(
      config?.creatureSprintStartThreshold,
      multipliers.sprintStartThreshold,
      genomeMultipliers.sprintStartThreshold
    ),
    sprintStopThreshold: applyMultipliers(
      config?.creatureSprintStopThreshold,
      multipliers.sprintStopThreshold,
      genomeMultipliers.sprintStopThreshold
    ),
    sprintSpeedMultiplier: applyMultipliers(
      config?.creatureSprintSpeedMultiplier,
      multipliers.sprintSpeedMultiplier,
      genomeMultipliers.sprintSpeedMultiplier
    ),
    sprintStaminaDrain: applyMultipliers(
      config?.creatureSprintStaminaDrain,
      multipliers.sprintStaminaDrain,
      genomeMultipliers.sprintStaminaDrain
    ),
    staminaRegen: applyMultipliers(
      config?.creatureStaminaRegen,
      multipliers.staminaRegen,
      genomeMultipliers.staminaRegen
    ),
    drinkThreshold: applyMultipliers(
      config?.creatureDrinkThreshold,
      multipliers.drinkThreshold,
      genomeMultipliers.drinkThreshold
    ),
    drinkAmount: applyMultipliers(
      config?.creatureDrinkAmount,
      multipliers.drinkAmount,
      genomeMultipliers.drinkAmount
    ),
    eatThreshold: applyMultipliers(
      config?.creatureEatThreshold,
      multipliers.eatThreshold,
      genomeMultipliers.eatThreshold
    ),
    eatAmount: applyMultipliers(
      config?.creatureEatAmount,
      multipliers.eatAmount,
      genomeMultipliers.eatAmount
    ),
    grassEatMin: applyMultipliers(
      config?.creatureGrassEatMin,
      multipliers.grassEatMin,
      genomeMultipliers.grassEatMin
    ),
    berryEatMin: applyMultipliers(
      config?.creatureBerryEatMin,
      multipliers.berryEatMin,
      genomeMultipliers.berryEatMin
    ),
    gestationMultiplier: clampGestationMultiplier(
      applyMultipliers(gestationBase, multipliers.gestationMultiplier, genomeMultipliers.gestationMultiplier)
    ),
    foodEfficiency: resolveFoodEfficiency(
      config?.creatureFoodEfficiency,
      multipliers.foodEfficiency
    )
  };

  // Apply state-based tradeoffs: positive traits have deterministic costs
  return applyTradeoffs(baseTraits, genome, config);
};
