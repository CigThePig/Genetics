import { canSeeCreature } from './visibility.js';
import { resolveTicksPerSecond } from './life-stages.js';
import {
  resolveRatio,
  resolveDistance,
  resolveMinAgeTicks,
  resolveWaterTerrain
} from '../utils/resolvers.js';
import { resolveNeedMeterBase, resolveActionThreshold, normalizeNeedRatio } from './metabolism.js';
import {
  FOOD_TYPES,
  getFeedingPreferences,
  getFoodAvailabilityAtCell,
  selectFoodChoice
} from './food.js';
import { applyMemoryPenalty, selectMemoryTarget, MEMORY_TYPES } from './memory.js';
import { selectPredatorTarget } from './targeting.js';
import { getChaseTarget, startCreatureChase } from './chase.js';
import { isReadyToReproduce, selectMateTarget } from './reproduction.js';
import {
  resolveActionAmount,
  resolveCommitTicks,
  resolveGrazeEnabled,
  resolveGrazeMinRatio,
  resolveGrazeMinLocalHerdSize,
  isHerbivoreSpecies,
  getSpeciesKey,
  resolveHerdingMinGroupSize,
  resolveDrinkConcernMargin,
  resolveWaterRendezvousMaxDistance,
  resolveWaterRendezvousCommitSeconds,
  ensureSearchState,
  clearSearchState,
  pickSearchTarget,
  getCreatureCell,
  hasNearbyWater,
  applyRallyJitter
} from './intent-helpers.js';
import { updateHerdWaterTargetsOncePerTick } from './water-rendezvous.js';

export function updateCreatureIntent({
  creatures,
  config,
  world,
  metrics,
  tick,
  spatialIndex,
  rng
}) {
  if (!Array.isArray(creatures) || !world) {
    return;
  }
  const ticksPerSecond = resolveTicksPerSecond(config);
  const baseEnergy = resolveNeedMeterBase(config?.creatureBaseEnergy);
  const baseWater = resolveNeedMeterBase(config?.creatureBaseWater);
  const minEnergyRatio = resolveRatio(config?.creatureReproductionMinEnergyRatio, 0.9);
  const minWaterRatio = resolveRatio(config?.creatureReproductionMinWaterRatio, 0.9);
  const minAgeTicks = resolveMinAgeTicks(config?.creatureReproductionMinAge, 90, ticksPerSecond);
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
  const mateSeekOverridesNeeds = config?.creatureMateSeekPriorityOverridesNeeds === true;
  const grazeEnabled = resolveGrazeEnabled(config);
  const grazeMinEnergyRatio = resolveGrazeMinRatio(config?.creatureGrazeMinEnergyRatio, 0.75);
  const grazeMinWaterRatio = resolveGrazeMinRatio(config?.creatureGrazeMinWaterRatio, 0.75);
  const grazeMinLocalHerdSize = resolveGrazeMinLocalHerdSize(config);
  const fallbackDrinkThreshold = resolveActionThreshold(config?.creatureDrinkThreshold, 0.8);
  const fallbackEatThreshold = resolveActionThreshold(config?.creatureEatThreshold, 0.8);
  const fallbackGrassEatMin = resolveActionAmount(config?.creatureGrassEatMin, 0.05);
  const fallbackBerryEatMin = resolveActionAmount(config?.creatureBerryEatMin, 0.1);

  updateHerdWaterTargetsOncePerTick({
    creatures,
    config,
    world,
    spatialIndex,
    tick,
    rng,
    baseWater,
    fallbackDrinkThreshold
  });

  const predatorRestEnabled = config?.creaturePredatorRestEnabled !== false;
  const predatorRestThreshold = resolveRatio(config?.creaturePredatorRestThreshold, 0.9);
  const predatorHuntThreshold = resolveRatio(config?.creaturePredatorHuntThreshold, 0.5);

  const creaturesById = mateSeekingEnabled
    ? spatialIndex
      ? null // spatial index has getById
      : new Map()
    : null;
  if (creaturesById) {
    for (const creature of creatures) {
      if (Number.isFinite(creature?.id)) {
        creaturesById.set(creature.id, creature);
      }
    }
  }

  for (const creature of creatures) {
    const meters = creature?.meters;
    if (!meters || !creature.position || meters.hp <= 0) {
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
    const grassEatMin = resolveActionAmount(creature?.traits?.grassEatMin, fallbackGrassEatMin);
    const berryEatMin = resolveActionAmount(creature?.traits?.berryEatMin, fallbackBerryEatMin);
    const cell = getCreatureCell(creature);
    const waterRatio = normalizeNeedRatio(meters.water, baseWater);
    const energyRatio = normalizeNeedRatio(meters.energy, baseEnergy);
    const concernThreshold = Math.min(0.98, drinkThreshold + resolveDrinkConcernMargin(config));
    const urgentThirst = waterRatio < drinkThreshold;
    const concernedThirst = waterRatio < concernThreshold;
    const localHerdSize = creature.herding?.herdSize ?? 1;
    const minLocalHerdSize = resolveHerdingMinGroupSize(config);
    const isInHerd = localHerdSize >= minLocalHerdSize;
    const speciesKey = getSpeciesKey(creature.species);
    const waterTarget = speciesKey
      ? world?.herdWaterTargets?.[creature.herding?.groupId ?? speciesKey]
      : null;
    if (creature.search?.goal === 'water-rendezvous' && waterRatio >= concernThreshold) {
      clearSearchState(creature);
    }
    if (creature.search?.goal === 'water' && waterRatio >= drinkThreshold) {
      clearSearchState(creature);
    }
    if (creature.search?.goal === 'food' && energyRatio >= eatThreshold) {
      clearSearchState(creature);
    }
    const nearbyWater = hasNearbyWater(world, cell, config);
    const canDrink = waterRatio < drinkThreshold && nearbyWater;
    const canEat = energyRatio < eatThreshold;
    const foodAvailability = getFoodAvailabilityAtCell({ world, cell });
    const dietPreferences = getFeedingPreferences(creature, config);
    const canEatMeat = dietPreferences.includes(FOOD_TYPES.MEAT);

    const isPredator = canEatMeat && dietPreferences[0] === FOOD_TYPES.MEAT;
    let predatorIsResting = false;
    if (isPredator && predatorRestEnabled) {
      if (!creature.predatorState) {
        creature.predatorState = {
          isResting: energyRatio >= Math.max(predatorRestThreshold, eatThreshold + 0.08)
        };
      }
      if (creature.predatorState.isResting) {
        if (energyRatio < Math.max(predatorHuntThreshold, eatThreshold)) {
          creature.predatorState.isResting = false;
        }
      } else {
        if (energyRatio >= Math.max(predatorRestThreshold, eatThreshold + 0.08)) {
          creature.predatorState.isResting = true;
        }
      }
      predatorIsResting = creature.predatorState.isResting;
    }

    const perceivedFoodCell = creature.perception?.foodCell;
    const perceivedFoodType = creature.perception?.foodType;
    const perceivedWaterCell = creature.perception?.waterCell;
    const canSeekPerceivedFood =
      perceivedFoodCell && perceivedFoodType && dietPreferences.includes(perceivedFoodType);
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
    const herbivoreConcernedNoWater =
      isHerbivoreSpecies(creature.species) && concernedThirst && !nearbyWater;
    const canConsiderMate =
      canSeekMate &&
      (mateSeekOverridesNeeds || (!canDrink && !canEat)) &&
      !herbivoreConcernedNoWater;
    if (herbivoreConcernedNoWater && reproductionState.mate) {
      reproductionState.mate.targetId = null;
      reproductionState.mate.commitTicksRemaining = 0;
    }
    if (creature.search?.goal === 'mate' && !canConsiderMate) {
      clearSearchState(creature);
    }

    let intent = 'wander';
    let foodType = null;
    let target = null;
    let memoryEntry = null;
    let targeting = null;
    let mateTarget = null;

    if (canConsiderMate && reproductionState.mate && (creaturesById || spatialIndex)) {
      const mateState = reproductionState.mate;
      let waitingOnCommittedMate = false;
      if (Number.isFinite(mateState.targetId)) {
        const existing = spatialIndex
          ? spatialIndex.getById(mateState.targetId)
          : creaturesById.get(mateState.targetId);
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
          (!sexEnabled || (existing.sex && creature.sex && existing.sex !== creature.sex)) &&
          existingCooldown <= 0 &&
          !existingPregnant &&
          existingReady
        ) {
          // Commitment time continues even when camouflage interrupts visual tracking.
          mateState.commitTicksRemaining = Math.max(0, (mateState.commitTicksRemaining ?? 0) - 1);
          if (mateState.commitTicksRemaining > 0) {
            if (canSeeCreature(creature, existing, world, config, mateSeekRange, true)) {
              mateTarget = existing;
              mateState.lastSeenPosition = { ...existing.position };
            } else {
              // Do not replace an eligible committed partner merely because it is concealed.
              waitingOnCommittedMate = true;
            }
          }
        }
      }

      if (!mateTarget && !waitingOnCommittedMate) {
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
          pregnancyEnabled,
          spatialIndex,
          config,
          world
        });
        if (found) {
          mateState.targetId = found.id ?? null;
          mateState.commitTicksRemaining = mateSeekCommitTicks;
          mateState.lastSeenPosition = { ...found.position };
          mateTarget = found;
        } else {
          mateState.targetId = null;
          mateState.commitTicksRemaining = 0;
          mateState.lastSeenPosition = null;
        }
      }

      if (waitingOnCommittedMate) {
        // Keep the mating intent so conception respects this commitment. Travel only
        // towards the last *observed* position, never the hidden creature's live position.
        mateTarget = { position: mateState.lastSeenPosition ?? null };
      }
    } else if (mateSeekingEnabled && reproductionState.mate && !canSeekMate) {
      reproductionState.mate.targetId = null;
      reproductionState.mate.commitTicksRemaining = 0;
    }

    const rendezvousCommitTicks = resolveCommitTicks(
      resolveWaterRendezvousCommitSeconds(config),
      2.5,
      ticksPerSecond
    );
    const maxRendezvousDistance = resolveWaterRendezvousMaxDistance(config);
    let handled = false;

    if (herbivoreConcernedNoWater && waterTarget && isInHerd && !creature.herding?.isThreatened) {
      const search = ensureSearchState(creature);
      if (search.goal === 'water-rendezvous' && search.target && search.commitTicksRemaining > 0) {
        search.commitTicksRemaining = Math.max(0, search.commitTicksRemaining - 1);
        intent = 'seek';
        target = { ...search.target };
      } else {
        search.goal = 'water-rendezvous';
        search.target = { x: waterTarget.x + 0.5, y: waterTarget.y + 0.5 };
        search.commitTicksRemaining = rendezvousCommitTicks;
        intent = 'seek';
        target = { ...search.target };
      }
      handled = true;
    }

    if (!handled && mateTarget) {
      clearSearchState(creature);
      intent = 'mate';
      target = mateTarget.position ? { ...mateTarget.position } : null;
    } else if (!handled && canConsiderMate) {
      if (isHerbivoreSpecies(creature.species) && !creature.herding?.isThreatened) {
        if (isInHerd) {
          clearSearchState(creature);
          intent = 'wander';
          target = null;
        } else if (localHerdSize <= 2) {
          const anchor = speciesKey ? world?.herdAnchors?.[speciesKey] : null;
          const rallyPoint =
            concernedThirst && waterTarget
              ? { x: waterTarget.x + 0.5, y: waterTarget.y + 0.5 }
              : (anchor?.pos ?? anchor?.target ?? null);
          if (rallyPoint) {
            const jittered = applyRallyJitter({
              point: rallyPoint,
              rng,
              world,
              waterTerrain: resolveWaterTerrain(config)
            });
            intent = 'seek';
            target = { x: jittered.x, y: jittered.y };
          } else {
            const searchTarget = pickSearchTarget({
              creature,
              goal: 'mate',
              config,
              world,
              rng
            });
            if (searchTarget) {
              intent = 'seek';
              target = { ...searchTarget };
            }
          }
        }
      } else {
        const searchTarget = pickSearchTarget({
          creature,
          goal: 'mate',
          config,
          world,
          rng
        });
        if (searchTarget) {
          intent = 'seek';
          target = { ...searchTarget };
        }
      }
    } else if (
      !handled &&
      (creature.priority === 'thirst' || herbivoreConcernedNoWater) &&
      canDrink
    ) {
      clearSearchState(creature);
      intent = 'drink';
    } else if (
      !handled &&
      creature.priority === 'hunger' &&
      canEat &&
      (!predatorIsResting || foodAvailability.meat > 0 || perceivedFoodType === FOOD_TYPES.MEAT)
    ) {
      const availableMeal = selectFoodChoice({
        species: creature.species,
        creature,
        config,
        availability: foodAvailability,
        minimums: foodMinimums
      });
      const hasMeat = canEatMeat && availableMeal?.type === FOOD_TYPES.MEAT;
      const shouldHunt =
        canEatMeat &&
        !predatorIsResting &&
        !hasMeat &&
        !(canSeekPerceivedFood && perceivedFoodType === FOOD_TYPES.MEAT);
      const chaseTarget = shouldHunt ? getChaseTarget(creature, creatures, spatialIndex) : null;
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
        if (shouldHunt && dietPreferences[0] === FOOD_TYPES.MEAT) {
          const predatorTarget = selectPredatorTarget({
            predator: creature,
            creatures,
            config,
            spatialIndex,
            world
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
          }
        }

        if (intent !== 'hunt') {
          const choice = selectFoodChoice({
            species: creature.species,
            creature,
            config,
            availability: foodAvailability,
            minimums: foodMinimums
          });
          if (choice) {
            intent = 'eat';
            foodType = choice.type;
          } else if (canSeekPerceivedFood) {
            intent = 'seek';
            target = { x: perceivedFoodCell.x + 0.5, y: perceivedFoodCell.y + 0.5 };
            foodType = perceivedFoodType;
          } else if (shouldHunt) {
            const predatorTarget = selectPredatorTarget({
              predator: creature,
              creatures,
              config,
              spatialIndex,
              world
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
      }
      if (memoryEntry && memoryEntry.type === MEMORY_TYPES.FOOD) {
        clearSearchState(creature);
      } else if (intent === 'wander') {
        const searchTarget = pickSearchTarget({
          creature,
          goal: 'food',
          config,
          world,
          rng
        });
        if (searchTarget) {
          intent = 'seek';
          target = { ...searchTarget };
        }
      }
    } else if (
      !handled &&
      (creature.priority === 'thirst' || herbivoreConcernedNoWater) &&
      concernedThirst
    ) {
      if (urgentThirst && waterTarget && !nearbyWater) {
        const dx = waterTarget.x + 0.5 - creature.position.x;
        const dy = waterTarget.y + 0.5 - creature.position.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= maxRendezvousDistance) {
          const search = ensureSearchState(creature);
          search.goal = 'water-rendezvous';
          search.target = { x: waterTarget.x + 0.5, y: waterTarget.y + 0.5 };
          search.commitTicksRemaining = Math.max(
            search.commitTicksRemaining ?? 0,
            rendezvousCommitTicks
          );
          intent = 'seek';
          target = { ...search.target };
        }
      }

      if (intent === 'wander') {
        if (perceivedWaterCell && !nearbyWater) {
          clearSearchState(creature);
          intent = 'seek';
          target = { ...perceivedWaterCell };
        } else {
          memoryEntry = selectMemoryTarget({
            creature,
            type: MEMORY_TYPES.WATER
          });
          if (memoryEntry) {
            clearSearchState(creature);
          } else if (!nearbyWater) {
            const searchTarget = pickSearchTarget({
              creature,
              goal: 'water',
              config,
              world,
              rng
            });
            if (searchTarget) {
              intent = 'seek';
              target = { ...searchTarget };
            }
          }
        }
      }
    }

    if (intent === 'wander' && !memoryEntry && grazeEnabled && !isPredator) {
      const hasGrazeMeters = energyRatio >= grazeMinEnergyRatio && waterRatio >= grazeMinWaterRatio;
      const localHerdSize = creature.herding?.herdSize ?? 1;
      const isThreatened = creature.herding?.isThreatened === true;
      if (hasGrazeMeters && localHerdSize >= grazeMinLocalHerdSize && !isThreatened) {
        intent = 'graze';
        target = null;
      }
    }

    if (memoryEntry) {
      intent = 'seek';
      target = { x: memoryEntry.x + 0.5, y: memoryEntry.y + 0.5 };
      foodType = memoryEntry.foodType ?? null;
    }

    const targetDistanceSq =
      target && creature.position
        ? (creature.position.x - target.x) ** 2 + (creature.position.y - target.y) ** 2
        : null;
    if (memoryEntry && targetDistanceSq !== null && targetDistanceSq <= 1) {
      const missingWater =
        memoryEntry.type === MEMORY_TYPES.WATER && !hasNearbyWater(world, cell, config);
      const missingFood =
        // A nearby cell may still be outside perception (especially diagonally).
        // Only invalidate food after entering its remembered cell.
        memoryEntry.type === MEMORY_TYPES.FOOD &&
        cell.x === memoryEntry.x &&
        cell.y === memoryEntry.y &&
        !selectFoodChoice({
          species: creature.species,
          creature,
          config,
          availability: foodAvailability,
          minimums: foodMinimums
        });
      if (missingWater || missingFood) {
        applyMemoryPenalty(memoryEntry, config);
        intent = 'wander';
        target = null;
      }
    }

    if (
      isPredator &&
      !urgentThirst &&
      ['pursuing', 'losing'].includes(creature.chase?.status) &&
      creature.chase?.lastKnownPosition
    ) {
      intent = 'hunt';
      target = { ...creature.chase.lastKnownPosition };
      foodType = null;
      targeting = {
        targetId: creature.chase.targetId,
        preySpecies: creature.chase.preySpecies,
        distance: creature.chase.distance
      };
    }
    if (isPredator && predatorIsResting && intent === 'wander' && energyRatio >= eatThreshold) {
      intent = 'rest';
      target = null;
    }
    creature.intent = { type: intent, foodType, target };
    creature.targeting = targeting;
  }
}

export { updateCreaturePriority } from './intent-helpers.js';
export { getCreatureCell } from './intent-helpers.js';
export { hasNearbyWater } from './intent-helpers.js';
export { getGrassAtCell } from './intent-helpers.js';
export { resolveActionAmount } from './intent-helpers.js';
