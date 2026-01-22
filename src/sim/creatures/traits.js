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
  return multipliers.reduce(
    (result, multiplier) => result * resolveMultiplier(multiplier),
    value
  );
};

const resolveFoodEfficiency = (baseEfficiency, multipliers = {}) => ({
  grass: applyMultipliers(baseEfficiency?.grass, multipliers.grass),
  berries: applyMultipliers(baseEfficiency?.berries, multipliers.berries),
  meat: applyMultipliers(baseEfficiency?.meat, multipliers.meat)
});

export const createCreatureTraits = ({ config, species, genome } = {}) => {
  const multipliers = config?.creatureTraitMultipliers?.[species] ?? {};
  const genomeMultipliers = mapGenomeToTraitMultipliers(genome, config);
  const gestationBase = Number.isFinite(config?.creatureGestationMultiplier)
    ? config.creatureGestationMultiplier
    : 1;

  return {
    speed: applyMultipliers(
      config?.creatureBaseSpeed,
      multipliers.speed,
      genomeMultipliers.speed
    ),
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
      applyMultipliers(gestationBase, multipliers.gestationMultiplier)
    ),
    foodEfficiency: resolveFoodEfficiency(
      config?.creatureFoodEfficiency,
      multipliers.foodEfficiency
    )
  };
};
