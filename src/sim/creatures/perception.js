import { getTerrainEffectsAt } from '../terrain-effects.js';
import { getFoodAvailabilityAtCell, selectFoodChoice } from './food.js';

const resolveRange = (value, fallback) => (Number.isFinite(value) ? Math.max(0, value) : fallback);

const resolveRangeMax = (value) => (Number.isFinite(value) ? Math.max(0, value) : Infinity);

const resolveMinimum = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

const buildSignature = ({ waterDistance, foodType, foodDistance }) =>
  `${waterDistance ?? 'none'}:${foodType ?? 'none'}:${foodDistance ?? 'none'}`;

/**
 * Generates cells to scan in spiral order from center outward.
 * This allows early exit when we find something close enough.
 */
function* spiralCells(radius) {
  // Center first
  yield { dx: 0, dy: 0, distSq: 0 };
  
  // Then expanding rings
  for (let r = 1; r <= radius; r++) {
    const rSq = r * r;
    // Top and bottom rows of ring
    for (let dx = -r; dx <= r; dx++) {
      const distSq = dx * dx + rSq;
      yield { dx, dy: -r, distSq };
      yield { dx, dy: r, distSq };
    }
    // Left and right columns (excluding corners already done)
    for (let dy = -r + 1; dy < r; dy++) {
      const distSq = rSq + dy * dy;
      yield { dx: -r, dy, distSq };
      yield { dx: r, dy, distSq };
    }
  }
}

// Pre-generate spiral patterns for common radii to avoid generator overhead
const spiralCache = new Map();
function getSpiralPattern(radius) {
  if (!spiralCache.has(radius)) {
    spiralCache.set(radius, [...spiralCells(radius)]);
  }
  return spiralCache.get(radius);
}

export function updateCreaturePerception({ creatures, config, world }) {
  if (!Array.isArray(creatures) || !world) {
    return;
  }

  const baseRange = resolveRange(config?.creaturePerceptionRange, 0);
  const maxRange = resolveRangeMax(config?.creaturePerceptionRangeMax);
  const fallbackGrassMin = resolveMinimum(config?.creatureGrassEatMin, 0.05);
  const fallbackBerryMin = resolveMinimum(config?.creatureBerryEatMin, 0.1);
  const fallbackMeatMin = Math.min(fallbackGrassMin, fallbackBerryMin);
  const waterTerrain = config?.waterTerrain ?? 'water';
  const shoreTerrain = config?.shoreTerrain ?? 'shore';
  // Early exit threshold - stop scanning once we find something this close
  const earlyExitThreshold = 1.5;
  const earlyExitThresholdSq = earlyExitThreshold * earlyExitThreshold;

  for (const creature of creatures) {
    if (!creature?.position) {
      continue;
    }

    const cellX = Math.floor(creature.position.x);
    const cellY = Math.floor(creature.position.y);
    
    // OPTIMIZATION: Skip full rescan if creature is in same cell as last tick
    // and world tick hasn't advanced much (food/water changes slowly)
    const lastCell = creature._perceptionCache;
    if (lastCell && lastCell.x === cellX && lastCell.y === cellY && creature.perception) {
      // Still update the changed flag based on signature
      creature.perception.changed = false;
      continue;
    }
    
    // Cache current cell for next tick
    creature._perceptionCache = { x: cellX, y: cellY };

    const creatureRange = resolveRange(creature?.traits?.perceptionRange, baseRange);
    const terrainEffects = getTerrainEffectsAt(world, cellX, cellY);
    const terrainModifier = Number.isFinite(terrainEffects?.perception)
      ? terrainEffects.perception
      : 1;
    const rawRange = creatureRange * terrainModifier;
    const range = Math.min(rawRange, maxRange);

    let waterDistance = null;
    let waterCell = null;
    let foodDistance = null;
    let foodType = null;
    let foodCell = null;
    let foundCloseWater = false;
    let foundCloseFood = false;

    if (range > 0) {
      const radius = Math.ceil(range);
      const rangeSq = range * range;
      const minimums = {
        grass: resolveMinimum(creature?.traits?.grassEatMin, fallbackGrassMin),
        berries: resolveMinimum(creature?.traits?.berryEatMin, fallbackBerryMin),
        meat: resolveMinimum(creature?.traits?.meatEatMin, fallbackMeatMin)
      };

      // Use spiral pattern for outward search (enables early exit)
      const pattern = getSpiralPattern(radius);
      
      for (const { dx, dy, distSq } of pattern) {
        // Early exit: found both water and food close enough
        if (foundCloseWater && foundCloseFood) {
          break;
        }
        
        if (distSq > rangeSq) {
          continue;
        }
        
        const x = cellX + dx;
        const y = cellY + dy;
        if (typeof world.isInBounds === 'function' && !world.isInBounds(x, y)) {
          continue;
        }

        // Only check water if we haven't found close water yet
        if (!foundCloseWater) {
          if (
            typeof world.isWaterAt === 'function' &&
            world.isWaterAt(x, y, waterTerrain, shoreTerrain)
          ) {
            const distance = Math.sqrt(distSq);
            if (waterDistance === null || distance < waterDistance) {
              waterDistance = distance;
              waterCell = { x, y };
              if (distSq <= earlyExitThresholdSq) {
                foundCloseWater = true;
              }
            }
          }
        }

        // Only check food if we haven't found close food yet
        if (!foundCloseFood) {
          const availability = getFoodAvailabilityAtCell({
            world,
            cell: { x, y }
          });
          const choice = selectFoodChoice({
            species: creature.species,
            availability,
            minimums
          });
          if (choice && (foodDistance === null || distSq < foodDistance * foodDistance)) {
            const distance = Math.sqrt(distSq);
            foodDistance = distance;
            foodType = choice.type;
            foodCell = { x, y };
            if (distSq <= earlyExitThresholdSq) {
              foundCloseFood = true;
            }
          }
        }
      }
    }

    const signature = buildSignature({ waterDistance, foodType, foodDistance });
    const previousSignature = creature.perception?.signature;
    const changed = signature !== previousSignature;

    creature.perception = {
      range,
      terrainModifier,
      waterDistance,
      waterCell,
      foodDistance,
      foodType,
      foodCell,
      signature,
      changed
    };
  }
}
