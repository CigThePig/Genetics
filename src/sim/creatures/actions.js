/**
 * Actions Module
 *
 * Handles creature actions: drinking water and eating food.
 */

import { consumeGrassAt } from '../plants/grass.js';
import { consumeBerriesAt } from '../plants/bushes.js';
import { clampMeter } from '../utils/resolvers.js';
import { resolveTickScale, resolveNeedMeterBase } from './metabolism.js';
import {
  getCreatureCell,
  hasNearbyWater,
  getGrassAtCell,
  resolveActionAmount
} from './intent.js';
import {
  FOOD_TYPES,
  getDietPreferences,
  getDigestiveEfficiency,
  getFoodAvailabilityAtCell,
  getFoodProperties
} from './food.js';

/**
 * Applies creature actions (drinking and eating) based on intent.
 * Modifies creature meters and consumes world resources.
 */
export function applyCreatureActions({ creatures, config, world }) {
  if (!Array.isArray(creatures) || !world) {
    return;
  }
  const tickScale = resolveTickScale(config);
  const baseEnergy = resolveNeedMeterBase(config?.creatureBaseEnergy);
  const baseWater = resolveNeedMeterBase(config?.creatureBaseWater);
  const fallbackDrinkAmount = resolveActionAmount(
    config?.creatureDrinkAmount,
    0.08
  );
  const fallbackEatAmount = resolveActionAmount(
    config?.creatureEatAmount,
    0.08
  );
  const fallbackGrassEatMin = resolveActionAmount(
    config?.creatureGrassEatMin,
    0.05
  );
  const fallbackBerryEatMin = resolveActionAmount(
    config?.creatureBerryEatMin,
    0.1
  );

  for (const creature of creatures) {
    const meters = creature?.meters;
    if (!meters || !creature.position) {
      continue;
    }
    const drinkAmount = resolveActionAmount(
      creature?.traits?.drinkAmount,
      fallbackDrinkAmount
    );
    const eatAmount = resolveActionAmount(
      creature?.traits?.eatAmount,
      fallbackEatAmount
    );
    const drinkAmountPerTick = drinkAmount * tickScale;
    const eatAmountPerTick = eatAmount * tickScale;
    const grassEatMin = resolveActionAmount(
      creature?.traits?.grassEatMin,
      fallbackGrassEatMin
    );
    const berryEatMin = resolveActionAmount(
      creature?.traits?.berryEatMin,
      fallbackBerryEatMin
    );
    const cell = getCreatureCell(creature);
    const intentType = creature.intent?.type;
    const intentFoodType = creature.intent?.foodType;

    if (intentType === 'drink' && hasNearbyWater(world, cell, config)) {
      meters.water = clampMeter(
        Math.min(baseWater, meters.water + drinkAmountPerTick)
      );
      continue;
    }

    if (intentType !== 'eat' || !intentFoodType) {
      continue;
    }

    if (intentFoodType === FOOD_TYPES.GRASS) {
      const availableGrass = getGrassAtCell(world, cell);
      if (availableGrass >= grassEatMin) {
        const consumed = consumeGrassAt({
          world,
          x: cell.x,
          y: cell.y,
          amount: Math.min(availableGrass, eatAmountPerTick)
        });
        if (consumed > 0) {
          const props = getFoodProperties(config, FOOD_TYPES.GRASS);
          const efficiency = getDigestiveEfficiency(
            creature,
            FOOD_TYPES.GRASS,
            config
          );
          const energyGain = consumed * props.nutrition * efficiency;
          meters.energy = clampMeter(
            Math.min(baseEnergy, meters.energy + energyGain)
          );
        }
      }
      continue;
    }

    if (intentFoodType === FOOD_TYPES.BERRIES) {
      const availability = getFoodAvailabilityAtCell({ world, cell });
      const availableBerries = availability.berries;
      if (availableBerries >= berryEatMin) {
        const consumed = consumeBerriesAt({
          world,
          x: cell.x,
          y: cell.y,
          amount: Math.min(availableBerries, eatAmountPerTick)
        });
        if (consumed > 0) {
          const props = getFoodProperties(config, FOOD_TYPES.BERRIES);
          const efficiency = getDigestiveEfficiency(
            creature,
            FOOD_TYPES.BERRIES,
            config
          );
          const energyGain = consumed * props.nutrition * efficiency;
          meters.energy = clampMeter(
            Math.min(baseEnergy, meters.energy + energyGain)
          );
        }
      }
      continue;
    }

    if (intentFoodType === FOOD_TYPES.MEAT) {
      const dietPreferences = getDietPreferences(creature.species);
      if (dietPreferences.includes(FOOD_TYPES.MEAT)) {
        creature.intent = { type: 'wander', foodType: null };
      }
    }
  }
}
