const resolveMultiplier = (value) => (Number.isFinite(value) ? value : 1);

const applyMultiplier = (value, multiplier) => {
  if (!Number.isFinite(value)) {
    return value;
  }
  return value * resolveMultiplier(multiplier);
};

const resolveFoodEfficiency = (baseEfficiency, multipliers = {}) => ({
  grass: applyMultiplier(baseEfficiency?.grass, multipliers.grass),
  berries: applyMultiplier(baseEfficiency?.berries, multipliers.berries),
  meat: applyMultiplier(baseEfficiency?.meat, multipliers.meat)
});

export const createCreatureTraits = ({ config, species } = {}) => {
  const multipliers = config?.creatureTraitMultipliers?.[species] ?? {};

  return {
    speed: applyMultiplier(config?.creatureBaseSpeed, multipliers.speed),
    perceptionRange: applyMultiplier(
      config?.creaturePerceptionRange,
      multipliers.perceptionRange
    ),
    alertness: applyMultiplier(
      config?.creatureAlertnessBase,
      multipliers.alertness
    ),
    reactionDelayTicks: applyMultiplier(
      config?.creatureReactionDelayTicks,
      multipliers.reactionDelayTicks
    ),
    basalEnergyDrain: applyMultiplier(
      config?.creatureBasalEnergyDrain,
      multipliers.basalEnergyDrain
    ),
    basalWaterDrain: applyMultiplier(
      config?.creatureBasalWaterDrain,
      multipliers.basalWaterDrain
    ),
    basalStaminaDrain: applyMultiplier(
      config?.creatureBasalStaminaDrain,
      multipliers.basalStaminaDrain
    ),
    sprintStartThreshold: applyMultiplier(
      config?.creatureSprintStartThreshold,
      multipliers.sprintStartThreshold
    ),
    sprintStopThreshold: applyMultiplier(
      config?.creatureSprintStopThreshold,
      multipliers.sprintStopThreshold
    ),
    sprintSpeedMultiplier: applyMultiplier(
      config?.creatureSprintSpeedMultiplier,
      multipliers.sprintSpeedMultiplier
    ),
    sprintStaminaDrain: applyMultiplier(
      config?.creatureSprintStaminaDrain,
      multipliers.sprintStaminaDrain
    ),
    staminaRegen: applyMultiplier(
      config?.creatureStaminaRegen,
      multipliers.staminaRegen
    ),
    drinkThreshold: applyMultiplier(
      config?.creatureDrinkThreshold,
      multipliers.drinkThreshold
    ),
    drinkAmount: applyMultiplier(
      config?.creatureDrinkAmount,
      multipliers.drinkAmount
    ),
    eatThreshold: applyMultiplier(
      config?.creatureEatThreshold,
      multipliers.eatThreshold
    ),
    eatAmount: applyMultiplier(
      config?.creatureEatAmount,
      multipliers.eatAmount
    ),
    grassEatMin: applyMultiplier(
      config?.creatureGrassEatMin,
      multipliers.grassEatMin
    ),
    berryEatMin: applyMultiplier(
      config?.creatureBerryEatMin,
      multipliers.berryEatMin
    ),
    foodEfficiency: resolveFoodEfficiency(
      config?.creatureFoodEfficiency,
      multipliers.foodEfficiency
    )
  };
};
