import { getTerrainEffectsAt } from '../terrain-effects.js';
import { consumeGrassAt } from '../plants/grass.js';
import { consumeBerriesAt } from '../plants/bushes.js';
import { pickSpawnSpecies } from '../species.js';
import { createCreatureTraits } from './traits.js';
import {
  FOOD_TYPES,
  getDietPreferences,
  getDigestiveEfficiency,
  getFoodAvailabilityAtCell,
  getFoodProperties,
  selectFoodChoice
} from './food.js';

const fallbackLifeStages = [
  {
    id: 'juvenile',
    label: 'Juvenile',
    minAge: 0,
    movementScale: 0.85,
    metabolismScale: 0.9
  },
  {
    id: 'adult',
    label: 'Adult',
    minAge: 120,
    movementScale: 1,
    metabolismScale: 1
  },
  {
    id: 'elder',
    label: 'Elder',
    minAge: 300,
    movementScale: 0.75,
    metabolismScale: 1.1
  }
];

const getLifeStageDefinitions = (config) => {
  const stages = Array.isArray(config?.creatureLifeStages)
    ? config.creatureLifeStages
    : fallbackLifeStages;
  const normalized = stages
    .filter((stage) => stage && Number.isFinite(stage.minAge))
    .map((stage) => ({
      id: stage.id ?? stage.label ?? 'stage',
      label: stage.label ?? stage.id ?? 'Stage',
      minAge: Math.max(0, Math.trunc(stage.minAge)),
      movementScale: Number.isFinite(stage.movementScale)
        ? stage.movementScale
        : 1,
      metabolismScale: Number.isFinite(stage.metabolismScale)
        ? stage.metabolismScale
        : 1
    }));

  if (!normalized.length) {
    return fallbackLifeStages;
  }

  return normalized.sort((a, b) => a.minAge - b.minAge);
};

const resolveLifeStage = (ageTicks, config) => {
  const stages = getLifeStageDefinitions(config);
  let current = stages[0];
  for (const stage of stages) {
    if (ageTicks >= stage.minAge) {
      current = stage;
    } else {
      break;
    }
  }
  return current;
};

const createLifeStageState = (ageTicks, config) => {
  const stage = resolveLifeStage(ageTicks, config);
  return {
    id: stage.id,
    label: stage.label,
    movementScale: stage.movementScale,
    metabolismScale: stage.metabolismScale
  };
};

export function updateCreatureLifeStages({ creatures, config }) {
  if (!Array.isArray(creatures)) {
    return;
  }
  for (const creature of creatures) {
    const ageTicks = Number.isFinite(creature.ageTicks)
      ? creature.ageTicks + 1
      : 1;
    creature.ageTicks = ageTicks;
    creature.lifeStage = createLifeStageState(ageTicks, config);
  }
}

export function applyCreatureDeaths({ creatures, config, metrics }) {
  if (!Array.isArray(creatures)) {
    return;
  }
  const maxAgeTicks = resolveMaxAgeTicks(
    config?.creatureMaxAgeTicks,
    Infinity
  );
  const counts = metrics?.deathsByCause;
  let totalDeaths = 0;
  let writeIndex = 0;

  for (let i = 0; i < creatures.length; i += 1) {
    const creature = creatures[i];
    const cause = selectDeathCause({ creature, maxAgeTicks });
    if (!cause) {
      creatures[writeIndex] = creature;
      writeIndex += 1;
      continue;
    }
    creature.deathCause = cause;
    totalDeaths += 1;
    if (counts && counts[cause] !== undefined) {
      counts[cause] += 1;
    } else if (counts) {
      counts.other += 1;
    }
  }

  creatures.length = writeIndex;
  if (metrics) {
    metrics.deathsTotal = (metrics.deathsTotal ?? 0) + totalDeaths;
  }
}

const clampMeter = (value) => Math.max(0, Number.isFinite(value) ? value : 0);

const resolveBasalDrain = (value) =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

const resolveTraitDrain = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

const resolveNeedSwitchMargin = (config) =>
  Number.isFinite(config?.creatureNeedSwitchMargin)
    ? Math.max(0, config.creatureNeedSwitchMargin)
    : 0.05;

const resolveNeedMeterBase = (value) =>
  Number.isFinite(value) && value > 0 ? value : 1;

const resolveActionThreshold = (value, fallback) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, value));
};

const resolveActionAmount = (value, fallback) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

const resolveSprintMultiplier = (value, fallback) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

const resolveStaminaRegen = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

const resolveMaxAgeTicks = (value, fallback) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.trunc(value));
};

const isMeterEmpty = (value) => Number.isFinite(value) && value <= 0;

const selectDeathCause = ({ creature, maxAgeTicks }) => {
  if (Number.isFinite(maxAgeTicks) && maxAgeTicks > 0) {
    if (Number.isFinite(creature.ageTicks) && creature.ageTicks >= maxAgeTicks) {
      return 'age';
    }
  }
  const meters = creature?.meters;
  if (!meters) {
    return null;
  }
  if (isMeterEmpty(meters.hp)) {
    return 'injury';
  }
  if (isMeterEmpty(meters.water)) {
    return 'thirst';
  }
  if (isMeterEmpty(meters.energy)) {
    return 'starvation';
  }
  return null;
};

const normalizeNeedRatio = (value, base) => {
  const ratio = value / base;
  if (!Number.isFinite(ratio)) {
    return 0;
  }
  return Math.min(1, Math.max(0, ratio));
};

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

export function updateCreatureBasalMetabolism({ creatures, config }) {
  if (!Array.isArray(creatures)) {
    return;
  }
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
    const energyDrain = resolveTraitDrain(
      creature?.traits?.basalEnergyDrain,
      fallbackEnergyDrain
    );
    const waterDrain = resolveTraitDrain(
      creature?.traits?.basalWaterDrain,
      fallbackWaterDrain
    );
    const staminaDrain = resolveTraitDrain(
      creature?.traits?.basalStaminaDrain,
      fallbackStaminaDrain
    );
    const scale = Number.isFinite(creature.lifeStage?.metabolismScale)
      ? creature.lifeStage.metabolismScale
      : 1;
    meters.energy = clampMeter(meters.energy - energyDrain * scale);
    meters.water = clampMeter(meters.water - waterDrain * scale);
    meters.stamina = clampMeter(meters.stamina - staminaDrain * scale);
  }
}

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

export function applyCreatureSprintCosts({ creatures, config }) {
  if (!Array.isArray(creatures)) {
    return;
  }
  const fallbackDrain = resolveBasalDrain(
    config?.creatureSprintStaminaDrain
  );

  for (const creature of creatures) {
    const meters = creature?.meters;
    if (!meters || !creature.motion?.isSprinting) {
      continue;
    }
    const sprintDrain = resolveTraitDrain(
      creature?.traits?.sprintStaminaDrain,
      fallbackDrain
    );
    const scale = Number.isFinite(creature.lifeStage?.metabolismScale)
      ? creature.lifeStage.metabolismScale
      : 1;
    meters.stamina = clampMeter(meters.stamina - sprintDrain * scale);
  }
}

export function regenerateCreatureStamina({ creatures, config }) {
  if (!Array.isArray(creatures)) {
    return;
  }
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
    const regen = resolveStaminaRegen(
      creature?.traits?.staminaRegen,
      fallbackRegen
    );
    const scale = Number.isFinite(creature.lifeStage?.metabolismScale)
      ? creature.lifeStage.metabolismScale
      : 1;
    meters.stamina = clampMeter(
      Math.min(baseStamina, meters.stamina + regen * scale)
    );
  }
}

const resolveMovementSpeed = (config) =>
  Number.isFinite(config?.creatureBaseSpeed)
    ? Math.max(0, config.creatureBaseSpeed)
    : 0;

const resolveCreatureSpeed = (creature, config) =>
  Number.isFinite(creature?.traits?.speed)
    ? Math.max(0, creature.traits.speed)
    : resolveMovementSpeed(config);

const clampPosition = (value, min, max) => Math.min(max, Math.max(min, value));

const resolveWaterTerrain = (config) => config?.waterTerrain ?? 'water';

const isWaterTile = (world, x, y, waterTerrain) =>
  typeof world?.getTerrainAt === 'function' &&
  world.getTerrainAt(x, y) === waterTerrain;

const resolveHeading = (creature, rng) => {
  if (!creature.motion) {
    creature.motion = {};
  }
  if (!Number.isFinite(creature.motion.heading)) {
    creature.motion.heading = rng.nextFloat() * Math.PI * 2;
  }
  return creature.motion.heading;
};

const applyHeadingNoise = (heading, rng, maxDelta) =>
  heading + (rng.nextFloat() * 2 - 1) * maxDelta;

export function updateCreatureMovement({ creatures, config, rng, world }) {
  if (!Array.isArray(creatures) || !rng || !world) {
    return;
  }

  const maxX = Number.isFinite(world.width) ? Math.max(0, world.width - 0.001) : 0;
  const maxY = Number.isFinite(world.height) ? Math.max(0, world.height - 0.001) : 0;
  const waterTerrain = resolveWaterTerrain(config);
  const headingNoise = 0.25;
  const alternateOffsets = [
    Math.PI / 4,
    -Math.PI / 4,
    Math.PI / 2,
    -Math.PI / 2,
    (3 * Math.PI) / 4,
    (-3 * Math.PI) / 4
  ];

  for (const creature of creatures) {
    if (!creature?.position) {
      continue;
    }
    const intentType = creature.intent?.type;
    if (intentType === 'drink' || intentType === 'eat') {
      continue;
    }
    const baseSpeed = resolveCreatureSpeed(creature, config);
    if (baseSpeed === 0) {
      continue;
    }
    const scale = Number.isFinite(creature.lifeStage?.movementScale)
      ? creature.lifeStage.movementScale
      : 1;
    const sprintMultiplier = creature.motion?.isSprinting
      ? resolveSprintMultiplier(
          creature?.traits?.sprintSpeedMultiplier,
          resolveSprintMultiplier(config?.creatureSprintSpeedMultiplier, 1)
        )
      : 1;
    const x = creature.position.x;
    const y = creature.position.y;
    const heading = resolveHeading(creature, rng);
    const updatedHeading = applyHeadingNoise(heading, rng, headingNoise);
    const { friction } = getTerrainEffectsAt(
      world,
      Math.floor(x),
      Math.floor(y)
    );
    const terrainFriction =
      Number.isFinite(friction) && friction > 0 ? friction : 1;
    const distance = (baseSpeed * scale * sprintMultiplier) / terrainFriction;
    let nextX = clampPosition(
      x + Math.cos(updatedHeading) * distance,
      0,
      maxX
    );
    let nextY = clampPosition(
      y + Math.sin(updatedHeading) * distance,
      0,
      maxY
    );

    let chosenHeading = updatedHeading;
    if (isWaterTile(world, Math.floor(nextX), Math.floor(nextY), waterTerrain)) {
      let found = false;
      for (const offset of alternateOffsets) {
        const candidateHeading = updatedHeading + offset;
        const candidateX = clampPosition(
          x + Math.cos(candidateHeading) * distance,
          0,
          maxX
        );
        const candidateY = clampPosition(
          y + Math.sin(candidateHeading) * distance,
          0,
          maxY
        );
        if (
          !isWaterTile(
            world,
            Math.floor(candidateX),
            Math.floor(candidateY),
            waterTerrain
          )
        ) {
          nextX = candidateX;
          nextY = candidateY;
          chosenHeading = candidateHeading;
          found = true;
          break;
        }
      }
      if (!found) {
        creature.motion.heading = updatedHeading;
        continue;
      }
    }

    creature.motion.heading = chosenHeading;
    creature.position.x = nextX;
    creature.position.y = nextY;
  }
}

const getCreatureCell = (creature) => ({
  x: Math.floor(creature.position.x),
  y: Math.floor(creature.position.y)
});

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

const getGrassAtCell = (world, cell) => {
  if (!world?.getGrassAt) {
    return 0;
  }
  const amount = world.getGrassAt(cell.x, cell.y);
  return Number.isFinite(amount) ? amount : 0;
};

export function updateCreatureIntent({ creatures, config, world }) {
  if (!Array.isArray(creatures) || !world) {
    return;
  }
  const baseEnergy = resolveNeedMeterBase(config?.creatureBaseEnergy);
  const baseWater = resolveNeedMeterBase(config?.creatureBaseWater);
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

  for (const creature of creatures) {
    const meters = creature?.meters;
    if (!meters || !creature.position) {
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
    const foodMinimums = {
      grass: grassEatMin,
      berries: berryEatMin,
      meat: 0
    };

    let intent = 'wander';
    let foodType = null;
    if (creature.priority === 'thirst' && canDrink) {
      intent = 'drink';
    } else if (creature.priority === 'hunger' && canEat) {
      const choice = selectFoodChoice({
        species: creature.species,
        availability: foodAvailability,
        minimums: foodMinimums
      });
      if (choice) {
        intent = 'eat';
        foodType = choice.type;
      }
    }

    creature.intent = { type: intent, foodType };
  }
}

export function applyCreatureActions({ creatures, config, world }) {
  if (!Array.isArray(creatures) || !world) {
    return;
  }
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
      meters.water = clampMeter(Math.min(baseWater, meters.water + drinkAmount));
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
          amount: Math.min(availableGrass, eatAmount)
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
          amount: Math.min(availableBerries, eatAmount)
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

export function createCreatures({ config, rng, world }) {
  const count = Number.isFinite(config?.creatureCount)
    ? Math.max(0, Math.trunc(config.creatureCount))
    : 0;
  const creatures = [];
  const waterTerrain = resolveWaterTerrain(config);
  const spawnRetries = 20;

  for (let i = 0; i < count; i += 1) {
    let position = {
      x: rng.nextFloat() * world.width,
      y: rng.nextFloat() * world.height
    };
    for (let attempt = 0; attempt < spawnRetries; attempt += 1) {
      const cellX = Math.floor(position.x);
      const cellY = Math.floor(position.y);
      if (!isWaterTile(world, cellX, cellY, waterTerrain)) {
        break;
      }
      position = {
        x: rng.nextFloat() * world.width,
        y: rng.nextFloat() * world.height
      };
    }
    const species = pickSpawnSpecies(i);
    creatures.push({
      id: i,
      position,
      species,
      traits: createCreatureTraits({ config, species }),
      ageTicks: 0,
      lifeStage: createLifeStageState(0, config),
      priority: 'thirst',
      intent: { type: 'wander' },
      meters: {
        energy: config.creatureBaseEnergy,
        water: config.creatureBaseWater,
        stamina: config.creatureBaseStamina,
        hp: config.creatureBaseHp
      }
    });
  }

  return creatures;
}

export function findNearestCreature(creatures, point, maxDistance = Infinity) {
  if (!Array.isArray(creatures) || creatures.length === 0 || !point) {
    return null;
  }
  const limit = Number.isFinite(maxDistance) ? maxDistance : Infinity;
  const limitSq = limit * limit;

  let closest = null;
  let closestDistance = Infinity;

  for (const creature of creatures) {
    const dx = creature.position.x - point.x;
    const dy = creature.position.y - point.y;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq <= limitSq && distanceSq < closestDistance) {
      closest = creature;
      closestDistance = distanceSq;
    }
  }

  return closest;
}
