import { getTerrainEffectsAt } from '../terrain-effects.js';
import {
  getFoodAvailabilityAtCell,
  selectFoodChoice
} from './food.js';

const resolveRange = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

const resolveRangeMax = (value) =>
  Number.isFinite(value) ? Math.max(0, value) : Infinity;

const resolveMinimum = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

const buildSignature = ({ waterDistance, foodType, foodDistance }) =>
  `${waterDistance ?? 'none'}:${foodType ?? 'none'}:${foodDistance ?? 'none'}`;

export function updateCreaturePerception({ creatures, config, world }) {
  if (!Array.isArray(creatures) || !world) {
    return;
  }

  const baseRange = resolveRange(config?.creaturePerceptionRange, 0);
  const maxRange = resolveRangeMax(config?.creaturePerceptionRangeMax);
  const fallbackGrassMin = resolveMinimum(config?.creatureGrassEatMin, 0.05);
  const fallbackBerryMin = resolveMinimum(config?.creatureBerryEatMin, 0.1);
  const waterTerrain = config?.waterTerrain ?? 'water';
  const shoreTerrain = config?.shoreTerrain ?? 'shore';

  for (const creature of creatures) {
    if (!creature?.position) {
      continue;
    }

    const creatureRange = resolveRange(
      creature?.traits?.perceptionRange,
      baseRange
    );
    const cell = {
      x: Math.floor(creature.position.x),
      y: Math.floor(creature.position.y)
    };
    const terrainEffects = getTerrainEffectsAt(world, cell.x, cell.y);
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

    if (range > 0) {
      const radius = Math.ceil(range);
      const rangeSq = range * range;
      const minimums = {
        grass: resolveMinimum(creature?.traits?.grassEatMin, fallbackGrassMin),
        berries: resolveMinimum(creature?.traits?.berryEatMin, fallbackBerryMin),
        meat: 0
      };

      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq > rangeSq) {
            continue;
          }
          const x = cell.x + dx;
          const y = cell.y + dy;
          if (typeof world.isInBounds === 'function' && !world.isInBounds(x, y)) {
            continue;
          }
          const distance = Math.sqrt(distanceSq);

          if (
            waterDistance === null &&
            typeof world.isWaterAt === 'function' &&
            world.isWaterAt(x, y, waterTerrain, shoreTerrain)
          ) {
            waterDistance = distance;
            waterCell = { x, y };
          }

          const availability = getFoodAvailabilityAtCell({
            world,
            cell: { x, y }
          });
          const choice = selectFoodChoice({
            species: creature.species,
            availability,
            minimums
          });
          if (choice && (foodDistance === null || distance < foodDistance)) {
            foodDistance = distance;
            foodType = choice.type;
            foodCell = { x, y };
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
