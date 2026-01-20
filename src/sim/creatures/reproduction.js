import { createCreatureTraits } from './traits.js';
import { inheritCreatureGenome } from './genetics.js';

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

const clampMeter = (value) => Math.max(0, Number.isFinite(value) ? value : 0);

const resolveBaseMeter = (value) =>
  Number.isFinite(value) && value > 0 ? value : 1;

const resolveRatio = (value, fallback) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, value));
};

const resolveCooldownTicks = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : fallback;

const resolveMinAgeTicks = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : fallback;

const resolveDistance = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

const resolveCost = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

const clampPosition = (value, min, max) => Math.min(max, Math.max(min, value));

const resolveWaterTerrain = (config) => config?.waterTerrain ?? 'water';

const isWaterTile = (world, x, y, waterTerrain) =>
  typeof world?.getTerrainAt === 'function' &&
  world.getTerrainAt(x, y) === waterTerrain;

const isReadyToReproduce = ({
  creature,
  baseEnergy,
  baseWater,
  minEnergyRatio,
  minWaterRatio,
  minAgeTicks
}) => {
  const meters = creature?.meters;
  if (!meters) {
    return false;
  }
  if (!Number.isFinite(creature?.ageTicks) || creature.ageTicks < minAgeTicks) {
    return false;
  }
  const energyRatio = meters.energy / baseEnergy;
  const waterRatio = meters.water / baseWater;
  return energyRatio >= minEnergyRatio && waterRatio >= minWaterRatio;
};

const findMate = ({
  creatures,
  startIndex,
  source,
  maxDistanceSq,
  baseEnergy,
  baseWater,
  minEnergyRatio,
  minWaterRatio,
  minAgeTicks,
  pairedIds
}) => {
  let chosen = null;
  let closestDistance = Infinity;

  for (let i = startIndex + 1; i < creatures.length; i += 1) {
    const candidate = creatures[i];
    if (!candidate || candidate.species !== source.species) {
      continue;
    }
    if (pairedIds.has(candidate.id)) {
      continue;
    }
    const cooldown = candidate.reproduction?.cooldownTicks ?? 0;
    if (cooldown > 0) {
      continue;
    }
    if (
      !isReadyToReproduce({
        creature: candidate,
        baseEnergy,
        baseWater,
        minEnergyRatio,
        minWaterRatio,
        minAgeTicks
      })
    ) {
      continue;
    }
    const dx = candidate.position.x - source.position.x;
    const dy = candidate.position.y - source.position.y;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq > maxDistanceSq) {
      continue;
    }
    if (distanceSq < closestDistance) {
      chosen = candidate;
      closestDistance = distanceSq;
    }
  }

  return chosen;
};

const spawnOffset = (rng) => (rng.nextFloat() * 2 - 1) * 0.35;

const createOffspringPosition = ({ rng, world, source, mate, config }) => {
  const maxX = Number.isFinite(world?.width) ? Math.max(0, world.width - 0.001) : 0;
  const maxY = Number.isFinite(world?.height)
    ? Math.max(0, world.height - 0.001)
    : 0;
  const x = (source.position.x + mate.position.x) * 0.5 + spawnOffset(rng);
  const y = (source.position.y + mate.position.y) * 0.5 + spawnOffset(rng);
  const clampedX = clampPosition(x, 0, maxX);
  const clampedY = clampPosition(y, 0, maxY);
  const waterTerrain = resolveWaterTerrain(config);
  if (!isWaterTile(world, Math.floor(clampedX), Math.floor(clampedY), waterTerrain)) {
    return { x: clampedX, y: clampedY };
  }
  return { x: source.position.x, y: source.position.y };
};

export function updateCreatureReproduction({
  creatures,
  config,
  rng,
  world,
  metrics
}) {
  if (!Array.isArray(creatures) || !rng || !world) {
    return;
  }

  const baseEnergy = resolveBaseMeter(config?.creatureBaseEnergy);
  const baseWater = resolveBaseMeter(config?.creatureBaseWater);
  const baseStamina = resolveBaseMeter(config?.creatureBaseStamina);
  const baseHp = resolveBaseMeter(config?.creatureBaseHp);
  const minEnergyRatio = resolveRatio(
    config?.creatureReproductionMinEnergyRatio,
    0.9
  );
  const minWaterRatio = resolveRatio(
    config?.creatureReproductionMinWaterRatio,
    0.9
  );
  const cooldownTicks = resolveCooldownTicks(
    config?.creatureReproductionCooldownTicks,
    240
  );
  const minAgeTicks = resolveMinAgeTicks(
    config?.creatureReproductionMinAgeTicks,
    120
  );
  const range = resolveDistance(config?.creatureReproductionRange, 2.5);
  const energyCost = resolveCost(
    config?.creatureReproductionEnergyCost,
    0.2
  );
  const waterCost = resolveCost(
    config?.creatureReproductionWaterCost,
    0.15
  );
  const staminaCost = resolveCost(
    config?.creatureReproductionStaminaCost,
    0.05
  );
  const offspringEnergy = resolveCost(
    config?.creatureOffspringEnergy,
    baseEnergy * 0.6
  );
  const offspringWater = resolveCost(
    config?.creatureOffspringWater,
    baseWater * 0.6
  );
  const offspringStamina = resolveCost(
    config?.creatureOffspringStamina,
    baseStamina * 0.6
  );
  const offspringHp = resolveCost(
    config?.creatureOffspringHp,
    baseHp * 0.8
  );
  const maxDistanceSq = range * range;

  let nextId = 0;
  for (const creature of creatures) {
    if (Number.isFinite(creature?.id) && creature.id >= nextId) {
      nextId = creature.id + 1;
    }
  }

  const pairedIds = new Set();
  const newborns = [];
  const originalCount = creatures.length;

  if (metrics) {
    metrics.birthsLastTick = 0;
  }

  for (let i = 0; i < originalCount; i += 1) {
    const creature = creatures[i];
    if (!creature) {
      continue;
    }
    if (!creature.reproduction) {
      creature.reproduction = { cooldownTicks: 0 };
    }
    if (creature.reproduction.cooldownTicks > 0) {
      creature.reproduction.cooldownTicks -= 1;
    }
    if (pairedIds.has(creature.id)) {
      continue;
    }
    if (creature.reproduction.cooldownTicks > 0) {
      continue;
    }
    if (
      !isReadyToReproduce({
        creature,
        baseEnergy,
        baseWater,
        minEnergyRatio,
        minWaterRatio,
        minAgeTicks
      })
    ) {
      continue;
    }

    const mate = findMate({
      creatures,
      startIndex: i,
      source: creature,
      maxDistanceSq,
      baseEnergy,
      baseWater,
      minEnergyRatio,
      minWaterRatio,
      minAgeTicks,
      pairedIds
    });

    if (!mate) {
      continue;
    }

    pairedIds.add(creature.id);
    pairedIds.add(mate.id);

    creature.reproduction.cooldownTicks = cooldownTicks;
    mate.reproduction.cooldownTicks = cooldownTicks;

    if (creature.meters) {
      creature.meters.energy = clampMeter(creature.meters.energy - energyCost);
      creature.meters.water = clampMeter(creature.meters.water - waterCost);
      creature.meters.stamina = clampMeter(
        creature.meters.stamina - staminaCost
      );
    }

    if (mate.meters) {
      mate.meters.energy = clampMeter(mate.meters.energy - energyCost);
      mate.meters.water = clampMeter(mate.meters.water - waterCost);
      mate.meters.stamina = clampMeter(mate.meters.stamina - staminaCost);
    }

    const position = createOffspringPosition({
      rng,
      world,
      source: creature,
      mate,
      config
    });

    const genome = inheritCreatureGenome({
      parentA: creature,
      parentB: mate,
      config
    });

    newborns.push({
      id: nextId,
      position,
      species: creature.species,
      genome,
      traits: createCreatureTraits({
        config,
        species: creature.species,
        genome
      }),
      ageTicks: 0,
      lifeStage: createLifeStageState(0, config),
      priority: 'thirst',
      intent: { type: 'wander' },
      meters: {
        energy: clampMeter(Math.min(baseEnergy, offspringEnergy)),
        water: clampMeter(Math.min(baseWater, offspringWater)),
        stamina: clampMeter(Math.min(baseStamina, offspringStamina)),
        hp: clampMeter(Math.min(baseHp, offspringHp))
      },
      memory: { entries: [] },
      reproduction: { cooldownTicks }
    });

    nextId += 1;

    if (metrics) {
      metrics.birthsTotal = (metrics.birthsTotal ?? 0) + 1;
      metrics.birthsLastTick = (metrics.birthsLastTick ?? 0) + 1;
    }
  }

  if (newborns.length) {
    creatures.push(...newborns);
  }
}
