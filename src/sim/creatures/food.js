import { SPECIES } from '../species.js';
import { findBushAt } from '../plants/bushes.js';
import { findCarcassAt } from '../plants/carcasses.js';

export const FOOD_TYPES = Object.freeze({
  GRASS: 'grass',
  BERRIES: 'berries',
  MEAT: 'meat'
});

export const FOOD_LABELS = Object.freeze({
  [FOOD_TYPES.GRASS]: 'Grass',
  [FOOD_TYPES.BERRIES]: 'Berries',
  [FOOD_TYPES.MEAT]: 'Meat'
});

const DEFAULT_FOOD_PROPERTIES = Object.freeze({
  [FOOD_TYPES.GRASS]: { nutrition: 1, handling: 1, risk: 0 },
  [FOOD_TYPES.BERRIES]: { nutrition: 1, handling: 1, risk: 0 },
  [FOOD_TYPES.MEAT]: { nutrition: 1, handling: 1, risk: 0 }
});

const DEFAULT_DIET_PREFERENCES = Object.freeze({
  [SPECIES.SQUARE]: [FOOD_TYPES.BERRIES, FOOD_TYPES.GRASS],
  [SPECIES.TRIANGLE]: [FOOD_TYPES.MEAT, FOOD_TYPES.GRASS, FOOD_TYPES.BERRIES],
  [SPECIES.CIRCLE]: [FOOD_TYPES.GRASS, FOOD_TYPES.BERRIES],
  [SPECIES.OCTAGON]: [FOOD_TYPES.MEAT, FOOD_TYPES.GRASS, FOOD_TYPES.BERRIES]
});

const resolveFoodStat = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

const resolveFoodProperties = (config, foodType) => {
  const defaults = DEFAULT_FOOD_PROPERTIES[foodType] ?? {
    nutrition: 1,
    handling: 1,
    risk: 0
  };
  const props = config?.creatureFoodProperties?.[foodType] ?? {};
  return {
    nutrition: resolveFoodStat(props.nutrition, defaults.nutrition),
    handling: resolveFoodStat(props.handling, defaults.handling),
    risk: resolveFoodStat(props.risk, defaults.risk)
  };
};

export const getFoodProperties = (config, foodType) => resolveFoodProperties(config, foodType);

export const getDietPreferences = (species) =>
  DEFAULT_DIET_PREFERENCES[species] ?? [FOOD_TYPES.GRASS];

export const getDigestiveEfficiency = (creature, foodType, config) => {
  const traitValue = creature?.traits?.foodEfficiency?.[foodType];
  if (Number.isFinite(traitValue)) {
    return Math.max(0, traitValue);
  }
  const baseValue = config?.creatureFoodEfficiency?.[foodType];
  if (Number.isFinite(baseValue)) {
    return Math.max(0, baseValue);
  }
  return 1;
};

const getGrassAtCell = (world, cell) => {
  if (!world?.getGrassAt) {
    return 0;
  }
  const amount = world.getGrassAt(cell.x, cell.y);
  return Number.isFinite(amount) ? amount : 0;
};

const getBushAtCell = (world, cell) => {
  if (!world || typeof findBushAt !== 'function') {
    return null;
  }
  return findBushAt(world, cell.x, cell.y);
};

const getCarcassAtCell = (world, cell) => {
  if (!world || typeof findCarcassAt !== 'function') {
    return null;
  }
  return findCarcassAt(world, cell.x, cell.y);
};

export const getFoodAvailabilityAtCell = ({ world, cell }) => {
  const grass = getGrassAtCell(world, cell);
  const bush = getBushAtCell(world, cell);
  const berries = bush && Number.isFinite(bush.berries) ? bush.berries : 0;
  const carcass = getCarcassAtCell(world, cell);
  const meat = carcass && Number.isFinite(carcass.meat) ? carcass.meat : 0;

  return {
    grass,
    berries,
    meat,
    bush,
    carcass
  };
};

export const selectFoodChoice = ({ species, availability, minimums }) => {
  if (!availability) {
    return null;
  }
  const prefs = getDietPreferences(species);
  const mins = minimums ?? {};

  for (const foodType of prefs) {
    if (foodType === FOOD_TYPES.GRASS && availability.grass >= (mins.grass ?? 0)) {
      return { type: FOOD_TYPES.GRASS };
    }
    if (foodType === FOOD_TYPES.BERRIES && availability.berries >= (mins.berries ?? 0)) {
      return { type: FOOD_TYPES.BERRIES };
    }
    if (foodType === FOOD_TYPES.MEAT && availability.meat >= (mins.meat ?? 0)) {
      return { type: FOOD_TYPES.MEAT };
    }
  }

  return null;
};
