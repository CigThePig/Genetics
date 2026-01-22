/**
 * Intent Module
 *
 * Handles creature priority selection and intent decision-making.
 */

import { resolveTicksPerSecond } from './life-stages.js';
import { resolveRatio, resolveDistance, resolveMinAgeTicks } from '../utils/resolvers.js';
import {
  resolveNeedMeterBase,
  resolveActionThreshold,
  normalizeNeedRatio
} from './metabolism.js';
import {
  FOOD_TYPES,
  getDietPreferences,
  getFoodAvailabilityAtCell,
  selectFoodChoice
} from './food.js';
import {
  applyMemoryPenalty,
  selectMemoryTarget,
  MEMORY_TYPES
} from './memory.js';
import { selectPredatorTarget } from './targeting.js';
import {
  getChaseTarget,
  startCreatureChase
} from './chase.js';
import {
  isReadyToReproduce,
  selectMateTarget
} from './reproduction.js';

/**
 * Resolves the need switch margin (hysteresis) for priority switching.
 */
const resolveNeedSwitchMargin = (config) =>
  Number.isFinite(config?.creatureNeedSwitchMargin)
    ? Math.max(0, config.creatureNeedSwitchMargin)
    : 0.05;

/**
 * Resolves an action amount value (positive with fallback).
 */
const resolveActionAmount = (value, fallback) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

/**
 * Resolves commit time in ticks from seconds value.
 */
const resolveCommitTicks = (seconds, fallbackSeconds, ticksPerSecond) => {
  const tps = Number.isFinite(ticksPerSecond) ? ticksPerSecond : 60;
  const value = Number.isFinite(seconds) ? seconds : fallbackSeconds;
  return Math.max(0, Math.trunc(value * tps));
};

/**
 * Gets the grid cell for a creature's position.
 */
const getCreatureCell = (creature) => ({
  x: Math.floor(creature.position.x),
  y: Math.floor(creature.position.y)
});

/**
 * Checks if there's water within one tile of the cell.
 */
const hasNearbyWater = (world, cell, config) => {
  if (!world?.isWaterAt) {
    return false;
  }
  const waterTerrain = config?.waterTerrain ?? 'water';
  const shoreTerrain = config?.shoreTerrain ?? 'shore';
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (world.isWaterAt(cell.x + dx, cell.y + dy, waterTerrain, shoreTerrain)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Gets the grass amount at a cell.
 */
const getGrassAtCell = (world, cell) => {
  if (!world?.getGrassAt) {
    return 0;
  }
  const amount = world.getGrassAt(cell.x, cell.y);
  return Number.isFinite(amount) ? amount : 0;
};

/**
 * Updates creature priority (thirst vs hunger) based on meter levels.
 */
export function updateCreaturePriority({ creatures, config }) {
  if (!Array.isArray(creatures)) {
    return;
  }
  const baseEnergy = resolveNeedMeterBase(config?.creatureBaseEnergy);
  const baseWater = resolveNeedMeterBase(config?.creatureBaseWater);
  const margin = resolveNeedSwitchMargin(config);

  for (const creature of creatures) {
    const meters = creature?.meters;
    if (!meters) {
      continue;
    }
    const energyRatio = normalizeNeedRatio(meters.energy, baseEnergy);
    const waterRatio = normalizeNeedRatio(meters.water, baseWater);
    const hungerScore = 1 - energyRatio;
    const thirstScore = 1 - waterRatio;
    const current = creature.priority;
    const scoreGap = Math.abs(thirstScore - hungerScore);

    if (current && scoreGap < margin) {
      continue;
    }

    if (thirstScore >= hungerScore) {
      creature.priority = 'thirst';
    } else {
      creature.priority = 'hunger';
    }
  }
}

/**
 * Updates creature intent based on priority, perception, memory, and targets.
 * This is the main decision-making function for creature behavior.
 */
export function updateCreatureIntent({ creatures, config, world, metrics, tick }) {
  if (!Array.isArray(creatures) || !world) {
    return;
  }
  const ticksPerSecond = resolveTicksPerSecond(config);
  const baseEnergy = resolveNeedMeterBase(config?.creatureBaseEnergy);
  const baseWater = resolveNeedMeterBase(config?.creatureBaseWater);
  const minEnergyRatio = resolveRatio(
    config?.creatureReproductionMinEnergyRatio,
    0.9
  );
  const minWaterRatio = resolveRatio(
    config?.creatureReproductionMinWaterRatio,
    0.9
  );
  const minAgeTicks = resolveMinAgeTicks(
    config?.creatureReproductionMinAge,
    90,
    ticksPerSecond
  );
  const sexEnabled = config?.creatureSexEnabled !== false;
  const pregnancyEnabled = config?.creaturePregnancyEnabled !== false;
  const mateSeekingEnabled = config?.creatureMateSeekingEnabled !== false;
  const mateSeekRange = resolveDistance(config?.creatureMateSeekRange, 25);
  const mateSeekRangeSq = mateSeekRange * mateSeekRange;
  const mateSeekCommitTicks = resolveCommitTicks(
    config?.creatureMateSeekCommitTime,
    1, // 1 second default
    ticksPerSecond
  );
  const mateSeekOverridesNeeds =
    config?.creatureMateSeekPriorityOverridesNeeds === true;
  const fallbackDrinkThreshold = resolveActionThreshold(
    config?.creatureDrinkThreshold,
    0.8
  );
  const fallbackEatThreshold = resolveActionThreshold(
    config?.creatureEatThreshold,
    0.8
  );
  const fallbackGrassEatMin = resolveActionAmount(
    config?.creatureGrassEatMin,
    0.05
  );
  const fallbackBerryEatMin = resolveActionAmount(
    config?.creatureBerryEatMin,
    0.1
  );
  const creaturesById = mateSeekingEnabled ? new Map() : null;
  if (creaturesById) {
    for (const creature of creatures) {
      if (Number.isFinite(creature?.id)) {
        creaturesById.set(creature.id, creature);
      }
    }
  }

  for (const creature of creatures) {
    const meters = creature?.meters;
    if (!meters || !creature.position) {
      continue;
    }
    if (creature.alertness && !creature.alertness.canReact) {
      continue;
    }
    const drinkThreshold = resolveActionThreshold(
      creature?.traits?.drinkThreshold,
      fallbackDrinkThreshold
    );
    const eatThreshold = resolveActionThreshold(
      creature?.traits?.eatThreshold,
      fallbackEatThreshold
    );
    const grassEatMin = resolveActionAmount(
      creature?.traits?.grassEatMin,
      fallbackGrassEatMin
    );
    const berryEatMin = resolveActionAmount(
      creature?.traits?.berryEatMin,
      fallbackBerryEatMin
    );
    const cell = getCreatureCell(creature);
    const waterRatio = normalizeNeedRatio(meters.water, baseWater);
    const energyRatio = normalizeNeedRatio(meters.energy, baseEnergy);
    const canDrink = waterRatio < drinkThreshold && hasNearbyWater(world, cell, config);
    const canEat = energyRatio < eatThreshold;
    const foodAvailability = getFoodAvailabilityAtCell({ world, cell });
    const dietPreferences = getDietPreferences(creature.species);
    const canEatMeat = dietPreferences.includes(FOOD_TYPES.MEAT);
    const perceivedFoodCell = creature.perception?.foodCell;
    const perceivedFoodType = creature.perception?.foodType;
    const perceivedWaterCell = creature.perception?.waterCell;
    const canSeekPerceivedFood =
      perceivedFoodCell &&
      perceivedFoodType &&
      dietPreferences.includes(perceivedFoodType);
    const foodMinimums = {
      grass: grassEatMin,
      berries: berryEatMin,
      meat: Math.min(grassEatMin, berryEatMin)
    };
    const reproductionState = creature.reproduction ?? { cooldownTicks: 0 };
    if (!creature.reproduction) {
      creature.reproduction = reproductionState;
    }
    if (mateSeekingEnabled && sexEnabled && !reproductionState.mate) {
      reproductionState.mate = { targetId: null, commitTicksRemaining: 0 };
    }
    const canSeekMate =
      mateSeekingEnabled &&
      sexEnabled &&
      reproductionState.cooldownTicks <= 0 &&
      isReadyToReproduce({
        creature,
        baseEnergy,
        baseWater,
        minEnergyRatio,
        minWaterRatio,
        minAgeTicks,
        sexEnabled,
        pregnancyEnabled
      });
    const canConsiderMate =
      canSeekMate && (mateSeekOverridesNeeds || (!canDrink && !canEat));

    let intent = 'wander';
    let foodType = null;
    let target = null;
    let memoryEntry = null;
    let targeting = null;
    let mateTarget = null;

    if (canConsiderMate && reproductionState.mate && creaturesById) {
      const mateState = reproductionState.mate;
      let candidate = null;
      if (Number.isFinite(mateState.targetId)) {
        const existing = creaturesById.get(mateState.targetId);
        const existingReady = existing
          ? isReadyToReproduce({
              creature: existing,
              baseEnergy,
              baseWater,
              minEnergyRatio,
              minWaterRatio,
              minAgeTicks,
              sexEnabled,
              pregnancyEnabled
            })
          : false;
        const existingCooldown = existing?.reproduction?.cooldownTicks ?? 0;
        const existingPregnant =
          pregnancyEnabled &&
          existing?.sex === 'female' &&
          existing.reproduction?.pregnancy?.isPregnant;
        if (
          existing &&
          existing.species === creature.species &&
          (!sexEnabled ||
            (existing.sex && creature.sex && existing.sex !== creature.sex)) &&
          existingCooldown <= 0 &&
          !existingPregnant &&
          existingReady
        ) {
          candidate = existing;
        }
      }

      if (candidate) {
        mateState.commitTicksRemaining = Math.max(
          0,
          mateState.commitTicksRemaining - 1
        );
        if (mateState.commitTicksRemaining > 0) {
          mateTarget = candidate;
        }
      }

      if (!mateTarget) {
        const found = selectMateTarget({
          creatures,
          source: creature,
          maxDistanceSq: mateSeekRangeSq,
          baseEnergy,
          baseWater,
          minEnergyRatio,
          minWaterRatio,
          minAgeTicks,
          sexEnabled,
          pregnancyEnabled
        });
        if (found) {
          mateState.targetId = found.id ?? null;
          mateState.commitTicksRemaining = mateSeekCommitTicks;
          mateTarget = found;
        } else {
          mateState.targetId = null;
          mateState.commitTicksRemaining = 0;
        }
      }
    } else if (mateSeekingEnabled && reproductionState.mate && !canSeekMate) {
      reproductionState.mate.targetId = null;
      reproductionState.mate.commitTicksRemaining = 0;
    }

    if (mateTarget) {
      intent = 'mate';
      target = { x: mateTarget.position.x, y: mateTarget.position.y };
    } else if (creature.priority === 'thirst' && canDrink) {
      intent = 'drink';
    } else if (creature.priority === 'hunger' && canEat) {
      const chaseTarget = canEatMeat ? getChaseTarget(creature, creatures) : null;
      if (chaseTarget && creature.chase?.lastKnownPosition) {
        intent = 'hunt';
        target = { ...creature.chase.lastKnownPosition };
        targeting = {
          targetId: chaseTarget.id ?? null,
          preySpecies: chaseTarget.species ?? null,
          score: creature.targeting?.score ?? null,
          distance: creature.chase.distance ?? null
        };
      } else {
        const choice = selectFoodChoice({
          species: creature.species,
          availability: foodAvailability,
          minimums: foodMinimums
        });
        if (choice) {
          intent = 'eat';
          foodType = choice.type;
        } else if (canSeekPerceivedFood) {
          intent = 'seek';
          target = { ...perceivedFoodCell };
          foodType = perceivedFoodType;
        } else if (canEatMeat) {
          const predatorTarget = selectPredatorTarget({
            predator: creature,
            creatures,
            config
          });
          if (predatorTarget) {
            const started = startCreatureChase({
              creature,
              target: predatorTarget.target,
              metrics,
              config,
              tick
            });
            if (started) {
              intent = 'hunt';
              target = { ...predatorTarget.target.position };
              targeting = {
                targetId: predatorTarget.target?.id ?? null,
                preySpecies: predatorTarget.preySpecies,
                score: predatorTarget.score,
                distance: predatorTarget.distance
              };
            }
          } else {
            memoryEntry = selectMemoryTarget({
              creature,
              type: MEMORY_TYPES.FOOD,
              foodTypes: dietPreferences
            });
          }
        } else {
          memoryEntry = selectMemoryTarget({
            creature,
            type: MEMORY_TYPES.FOOD,
            foodTypes: dietPreferences
          });
        }
      }
    } else if (creature.priority === 'thirst' && waterRatio < drinkThreshold) {
      if (perceivedWaterCell && !hasNearbyWater(world, cell, config)) {
        intent = 'seek';
        target = { ...perceivedWaterCell };
      } else {
        memoryEntry = selectMemoryTarget({
          creature,
          type: MEMORY_TYPES.WATER
        });
      }
    }

    if (memoryEntry) {
      intent = 'seek';
      target = { x: memoryEntry.x, y: memoryEntry.y };
      foodType = memoryEntry.foodType ?? null;
    }

    const targetDistanceSq =
      target && creature.position
        ? (creature.position.x - target.x) ** 2 +
          (creature.position.y - target.y) ** 2
        : null;
    if (memoryEntry && targetDistanceSq !== null && targetDistanceSq <= 1) {
      const missingWater =
        memoryEntry.type === MEMORY_TYPES.WATER &&
        !hasNearbyWater(world, cell, config);
      const missingFood =
        memoryEntry.type === MEMORY_TYPES.FOOD &&
        !selectFoodChoice({
          species: creature.species,
          availability: foodAvailability,
          minimums: foodMinimums
        });
      if (missingWater || missingFood) {
        applyMemoryPenalty(memoryEntry, config);
        intent = 'wander';
        target = null;
      }
    }

    creature.intent = { type: intent, foodType, target };
    creature.targeting = targeting;
  }
}

// Re-export helpers needed by actions module
export {
  getCreatureCell,
  hasNearbyWater,
  getGrassAtCell,
  resolveActionAmount
};
