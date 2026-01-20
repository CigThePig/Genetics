import { getTerrainEffectsAt } from '../terrain-effects.js';
import { consumeGrassAt } from '../plants/grass.js';
import { SPECIES, pickSpawnSpecies } from '../species.js';

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

const clampMeter = (value) => Math.max(0, Number.isFinite(value) ? value : 0);

const resolveBasalDrain = (value) =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

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
  const energyDrain = resolveBasalDrain(config?.creatureBasalEnergyDrain);
  const waterDrain = resolveBasalDrain(config?.creatureBasalWaterDrain);
  const staminaDrain = resolveBasalDrain(config?.creatureBasalStaminaDrain);

  if (energyDrain === 0 && waterDrain === 0 && staminaDrain === 0) {
    return;
  }

  for (const creature of creatures) {
    const meters = creature.meters;
    if (!meters) {
      continue;
    }
    const scale = Number.isFinite(creature.lifeStage?.metabolismScale)
      ? creature.lifeStage.metabolismScale
      : 1;
    meters.energy = clampMeter(meters.energy - energyDrain * scale);
    meters.water = clampMeter(meters.water - waterDrain * scale);
    meters.stamina = clampMeter(meters.stamina - staminaDrain * scale);
  }
}

const resolveMovementSpeed = (config) =>
  Number.isFinite(config?.creatureBaseSpeed)
    ? Math.max(0, config.creatureBaseSpeed)
    : 0;

const clampPosition = (value, min, max) => Math.min(max, Math.max(min, value));

export function updateCreatureMovement({ creatures, config, rng, world }) {
  if (!Array.isArray(creatures) || !rng || !world) {
    return;
  }
  const baseSpeed = resolveMovementSpeed(config);
  if (baseSpeed === 0) {
    return;
  }

  const maxX = Number.isFinite(world.width) ? Math.max(0, world.width - 0.001) : 0;
  const maxY = Number.isFinite(world.height) ? Math.max(0, world.height - 0.001) : 0;

  for (const creature of creatures) {
    if (!creature?.position) {
      continue;
    }
    const intentType = creature.intent?.type;
    if (intentType === 'drink' || intentType === 'eat') {
      continue;
    }
    const scale = Number.isFinite(creature.lifeStage?.movementScale)
      ? creature.lifeStage.movementScale
      : 1;
    const x = creature.position.x;
    const y = creature.position.y;
    const angle = rng.nextFloat() * Math.PI * 2;
    const { friction } = getTerrainEffectsAt(
      world,
      Math.floor(x),
      Math.floor(y)
    );
    const terrainFriction =
      Number.isFinite(friction) && friction > 0 ? friction : 1;
    const distance = (baseSpeed * scale) / terrainFriction;
    const nextX = clampPosition(x + Math.cos(angle) * distance, 0, maxX);
    const nextY = clampPosition(y + Math.sin(angle) * distance, 0, maxY);
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
  const drinkThreshold = resolveActionThreshold(
    config?.creatureDrinkThreshold,
    0.8
  );
  const eatThreshold = resolveActionThreshold(
    config?.creatureEatThreshold,
    0.8
  );
  const grassEatMin = resolveActionAmount(
    config?.creatureGrassEatMin,
    0.05
  );

  for (const creature of creatures) {
    const meters = creature?.meters;
    if (!meters || !creature.position) {
      continue;
    }
    const cell = getCreatureCell(creature);
    const waterRatio = normalizeNeedRatio(meters.water, baseWater);
    const energyRatio = normalizeNeedRatio(meters.energy, baseEnergy);
    const canDrink = waterRatio < drinkThreshold && hasNearbyWater(world, cell, config);
    const canEatGrass =
      creature.species === SPECIES.CIRCLE &&
      energyRatio < eatThreshold &&
      getGrassAtCell(world, cell) >= grassEatMin;

    let intent = 'wander';
    if (creature.priority === 'thirst' && canDrink) {
      intent = 'drink';
    } else if (creature.priority === 'hunger' && canEatGrass) {
      intent = 'eat';
    }

    creature.intent = { type: intent };
  }
}

export function applyCreatureActions({ creatures, config, world }) {
  if (!Array.isArray(creatures) || !world) {
    return;
  }
  const baseEnergy = resolveNeedMeterBase(config?.creatureBaseEnergy);
  const baseWater = resolveNeedMeterBase(config?.creatureBaseWater);
  const drinkAmount = resolveActionAmount(config?.creatureDrinkAmount, 0.08);
  const eatAmount = resolveActionAmount(config?.creatureEatAmount, 0.08);
  const grassEatMin = resolveActionAmount(
    config?.creatureGrassEatMin,
    0.05
  );

  for (const creature of creatures) {
    const meters = creature?.meters;
    if (!meters || !creature.position) {
      continue;
    }
    const cell = getCreatureCell(creature);
    const intentType = creature.intent?.type;

    if (intentType === 'drink' && hasNearbyWater(world, cell, config)) {
      meters.water = clampMeter(Math.min(baseWater, meters.water + drinkAmount));
      continue;
    }

    if (intentType === 'eat' && creature.species === SPECIES.CIRCLE) {
      const availableGrass = getGrassAtCell(world, cell);
      if (availableGrass >= grassEatMin) {
        const consumed = consumeGrassAt({
          world,
          x: cell.x,
          y: cell.y,
          amount: Math.min(availableGrass, eatAmount)
        });
        if (consumed > 0) {
          meters.energy = clampMeter(
            Math.min(baseEnergy, meters.energy + consumed)
          );
        }
      }
    }
  }
}

export function createCreatures({ config, rng, world }) {
  const count = Number.isFinite(config?.creatureCount)
    ? Math.max(0, Math.trunc(config.creatureCount))
    : 0;
  const creatures = [];

  for (let i = 0; i < count; i += 1) {
    const position = {
      x: rng.nextFloat() * world.width,
      y: rng.nextFloat() * world.height
    };
    creatures.push({
      id: i,
      position,
      species: pickSpawnSpecies(i),
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
