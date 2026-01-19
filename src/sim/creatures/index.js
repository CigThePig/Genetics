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
      ageTicks: 0,
      lifeStage: createLifeStageState(0, config),
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
