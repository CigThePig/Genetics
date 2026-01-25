import { createCreatureTraits } from './traits.js';
import { inheritCreatureGenome, mutateCreatureGenome } from './genetics.js';
import { resolveTicksPerSecond, createLifeStageState } from './life-stages.js';
import { SPECIES_LIST } from '../species.js';
import {
  clampMeter,
  resolveRatio,
  resolveDistance,
  resolveBasalDrain,
  resolveTraitDrain,
  resolveMinAgeTicks,
  resolveWaterTerrain,
  isWaterTile
} from '../utils/resolvers.js';

const resolveBaseMeter = (value) => (Number.isFinite(value) && value > 0 ? value : 1);

const resolveChance = (value, fallback) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, value));
};

// Converts a probability expressed "per second" into a per-tick probability that
// stays stable when ticksPerSecond changes.
const resolvePerTickChanceFromPerSecond = (chancePerSecond, ticksPerSecond) => {
  if (!Number.isFinite(chancePerSecond)) {
    return null;
  }
  const tps = Number.isFinite(ticksPerSecond) && ticksPerSecond > 0 ? ticksPerSecond : 60;
  const clamped = Math.min(1, Math.max(0, chancePerSecond));
  if (clamped === 0) return 0;
  if (clamped === 1) return 1;
  return 1 - Math.pow(1 - clamped, 1 / tps);
};

const resolveGestationTicks = (seconds, fallbackSeconds, ticksPerSecond) => {
  const tps = Number.isFinite(ticksPerSecond) ? ticksPerSecond : 60;
  const value = Number.isFinite(seconds) ? seconds : fallbackSeconds;
  return Math.max(1, Math.trunc(value * tps));
};

const resolvePregnancyMultiplier = (value, fallback) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, value);
};

const resolveCooldownTicks = (value, fallback, ticksPerSecond) => {
  if (!Number.isFinite(value)) {
    return Math.max(0, Math.trunc(fallback * ticksPerSecond));
  }
  return Math.max(0, Math.trunc(value * ticksPerSecond));
};

const resolveCost = (value, fallback) => (Number.isFinite(value) ? Math.max(0, value) : fallback);

const clampPosition = (value, min, max) => Math.min(max, Math.max(min, value));

export const isReadyToReproduce = ({
  creature,
  baseEnergy,
  baseWater,
  minEnergyRatio,
  minWaterRatio,
  minAgeTicks,
  sexEnabled,
  pregnancyEnabled
}) => {
  const meters = creature?.meters;
  if (!meters) {
    return false;
  }
  if (
    sexEnabled &&
    pregnancyEnabled &&
    creature.sex === 'female' &&
    creature.reproduction?.pregnancy?.isPregnant
  ) {
    return false;
  }
  if (!Number.isFinite(creature?.ageTicks) || creature.ageTicks < minAgeTicks) {
    return false;
  }
  const energyRatio = meters.energy / baseEnergy;
  const waterRatio = meters.water / baseWater;
  return energyRatio >= minEnergyRatio && waterRatio >= minWaterRatio;
};

const isMateCandidate = ({
  candidate,
  source,
  baseEnergy,
  baseWater,
  minEnergyRatio,
  minWaterRatio,
  minAgeTicks,
  pairedIds,
  sexEnabled,
  pregnancyEnabled
}) => {
  if (!candidate || candidate.species !== source.species) {
    return false;
  }
  if (sexEnabled) {
    if (!candidate.sex || !source.sex || candidate.sex === source.sex) {
      return false;
    }
    if (
      pregnancyEnabled &&
      candidate.sex === 'female' &&
      candidate.reproduction?.pregnancy?.isPregnant
    ) {
      return false;
    }
  }
  if (pairedIds?.has(candidate.id)) {
    return false;
  }
  const cooldown = candidate.reproduction?.cooldownTicks ?? 0;
  if (cooldown > 0) {
    return false;
  }
  return isReadyToReproduce({
    creature: candidate,
    baseEnergy,
    baseWater,
    minEnergyRatio,
    minWaterRatio,
    minAgeTicks,
    sexEnabled,
    pregnancyEnabled
  });
};

export const selectMateTarget = ({
  creatures,
  startIndex = -1,
  source,
  maxDistanceSq,
  baseEnergy,
  baseWater,
  minEnergyRatio,
  minWaterRatio,
  minAgeTicks,
  pairedIds,
  sexEnabled,
  pregnancyEnabled,
  spatialIndex
}) => {
  // Use spatial index if available for O(k) performance instead of O(n)
  if (spatialIndex && source?.position) {
    const maxDistance = Math.sqrt(maxDistanceSq);
    const nearby = spatialIndex.queryNearby(
      source.position.x,
      source.position.y,
      maxDistance,
      {
        exclude: source,
        filter: (candidate) =>
          isMateCandidate({
            candidate,
            source,
            baseEnergy,
            baseWater,
            minEnergyRatio,
            minWaterRatio,
            minAgeTicks,
            pairedIds,
            sexEnabled,
            pregnancyEnabled
          })
      }
    );

    // Find closest mate
    let chosen = null;
    let closestDistSq = Infinity;
    for (const { creature, distanceSq } of nearby) {
      if (distanceSq < closestDistSq) {
        chosen = creature;
        closestDistSq = distanceSq;
      }
    }
    return chosen;
  }

  // Fallback to linear scan if no spatial index
  let chosen = null;
  let closestDistance = Infinity;

  const rawOffset = Number.isFinite(startIndex) ? Math.trunc(startIndex) : -1;
  const offset = Math.min(creatures.length - 1, Math.max(-1, rawOffset));
  const scanRange = (start, end) => {
    for (let i = start; i < end; i += 1) {
      const candidate = creatures[i];
      if (
        !isMateCandidate({
          candidate,
          source,
          baseEnergy,
          baseWater,
          minEnergyRatio,
          minWaterRatio,
          minAgeTicks,
          pairedIds,
          sexEnabled,
          pregnancyEnabled
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
  };

  scanRange(offset + 1, creatures.length);
  if (offset > 0) {
    scanRange(0, offset);
  }

  return chosen;
};

const findMate = (options) => selectMateTarget(options);

const spawnOffset = (rng) => (rng.nextFloat() * 2 - 1) * 0.35;

const createOffspringPosition = ({ rng, world, source, mate, config }) => {
  const maxX = Number.isFinite(world?.width) ? Math.max(0, world.width - 0.001) : 0;
  const maxY = Number.isFinite(world?.height) ? Math.max(0, world.height - 0.001) : 0;
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

const clampGestationMultiplier = (value) => {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.min(1.5, Math.max(0.5, value));
};

const resolveGestationMultiplier = ({ creature, config }) => {
  if (config?.creatureGestationTraitEnabled === false) {
    return 1;
  }
  return clampGestationMultiplier(creature?.traits?.gestationMultiplier ?? 1);
};

const createPregnancyState = () => ({
  isPregnant: false,
  fatherId: null,
  gestationTicksTotal: 0,
  gestationTicksRemaining: 0
});

const resolveNewbornMeterMultiplier = (config, gestationMultiplier) => {
  const fastThreshold = Number.isFinite(
    config?.creatureBirthChildStartingMetersFastIfMultiplierBelow
  )
    ? config.creatureBirthChildStartingMetersFastIfMultiplierBelow
    : 0.9;
  const slowThreshold = Number.isFinite(
    config?.creatureBirthChildStartingMetersSlowIfMultiplierAbove
  )
    ? config.creatureBirthChildStartingMetersSlowIfMultiplierAbove
    : 1.1;
  const fastMultiplier = resolvePregnancyMultiplier(
    config?.creatureBirthChildStartingMetersFastMultiplier,
    0.85
  );
  const slowMultiplier = resolvePregnancyMultiplier(
    config?.creatureBirthChildStartingMetersSlowMultiplier,
    1.1
  );

  if (!Number.isFinite(gestationMultiplier)) {
    return 1;
  }
  if (gestationMultiplier < fastThreshold) {
    return fastMultiplier;
  }
  if (gestationMultiplier > slowThreshold) {
    return slowMultiplier;
  }
  return 1;
};

export function updateCreatureReproduction({ creatures, config, rng, world, metrics, spatialIndex }) {
  if (!Array.isArray(creatures) || !rng || !world) {
    return;
  }

  // Only use spatial index if explicitly provided and has creatures
  const index = spatialIndex && spatialIndex.creatureCount > 0 ? spatialIndex : null;

  const ticksPerSecond = resolveTicksPerSecond(config);
  const baseEnergy = resolveBaseMeter(config?.creatureBaseEnergy);
  const baseWater = resolveBaseMeter(config?.creatureBaseWater);
  const baseStamina = resolveBaseMeter(config?.creatureBaseStamina);
  const baseHp = resolveBaseMeter(config?.creatureBaseHp);
  const sexEnabled = config?.creatureSexEnabled !== false;
  const pregnancyEnabled = config?.creaturePregnancyEnabled !== false;
  const conceptionChance = resolveChance(config?.creatureConceptionChance, 0.35);
  const gestationBaseTicks = resolveGestationTicks(
    config?.creatureGestationTime,
    60, // 60 seconds default
    ticksPerSecond
  );
  const miscarriageEnabled = config?.creaturePregnancyMiscarriageEnabled !== false;
  const miscarriageEnergyRatio = resolveRatio(
    config?.creaturePregnancyMiscarriageEnergyRatio,
    0.15
  );
  const miscarriageChancePerSecond = resolveChance(
    config?.creaturePregnancyMiscarriageChancePerSecond,
    null
  );
  // Backward-compatible fallback (older configs may still provide a per-tick chance).
  const miscarriageChance = Number.isFinite(miscarriageChancePerSecond)
    ? resolvePerTickChanceFromPerSecond(miscarriageChancePerSecond, ticksPerSecond)
    : resolveChance(config?.creaturePregnancyMiscarriageChancePerTick, 0.01);
  const pregnancyMetabolismMultiplier = resolvePregnancyMultiplier(
    config?.creaturePregnancyMetabolismMultiplier,
    1
  );
  const minEnergyRatio = resolveRatio(config?.creatureReproductionMinEnergyRatio, 0.9);
  const minWaterRatio = resolveRatio(config?.creatureReproductionMinWaterRatio, 0.9);
  const cooldownTicks = resolveCooldownTicks(
    config?.creatureReproductionCooldown,
    180,
    ticksPerSecond
  );
  const failedCooldownTicks = resolveCooldownTicks(
    config?.creatureReproductionFailedCooldown,
    20,
    ticksPerSecond
  );
  const minAgeTicks = resolveMinAgeTicks(config?.creatureReproductionMinAge, 90, ticksPerSecond);
  const range = resolveDistance(config?.creatureReproductionRange, 2.5);
  const rangeWhileSeeking = resolveDistance(config?.creatureReproductionRangeWhileSeeking, range);
  const energyCost = resolveCost(config?.creatureReproductionEnergyCost, 0.2);
  const waterCost = resolveCost(config?.creatureReproductionWaterCost, 0.15);
  const staminaCost = resolveCost(config?.creatureReproductionStaminaCost, 0.05);
  const failedCostMultiplier = resolveRatio(config?.creatureReproductionFailedCostMultiplier, 0.5);
  const offspringEnergy = resolveCost(config?.creatureOffspringEnergy, baseEnergy * 0.6);
  const offspringWater = resolveCost(config?.creatureOffspringWater, baseWater * 0.6);
  const offspringStamina = resolveCost(config?.creatureOffspringStamina, baseStamina * 0.6);
  const offspringHp = resolveCost(config?.creatureOffspringHp, baseHp * 0.8);
  const tickScale = 1 / ticksPerSecond;
  const fallbackEnergyDrain = resolveBasalDrain(config?.creatureBasalEnergyDrain);
  const fallbackWaterDrain = resolveBasalDrain(config?.creatureBasalWaterDrain);

  let nextId = 0;
  const creaturesById = new Map();
  for (const creature of creatures) {
    if (Number.isFinite(creature?.id) && creature.id >= nextId) {
      nextId = creature.id + 1;
    }
    if (Number.isFinite(creature?.id)) {
      creaturesById.set(creature.id, creature);
    }
  }

  const pairedIds = new Set();
  const cooldownUpdatedIds = new Set();
  const newborns = [];
  const originalCount = creatures.length;

  if (metrics) {
    metrics.birthsLastTick = 0;
    metrics.pregnanciesLastTick = 0;
    metrics.miscarriagesLastTick = 0;
    metrics.mutationsLastTick = 0;
    metrics.mutationStrengthLastTick = 0;
    metrics.pleiotropyStrengthLastTick = 0;
    for (const species of SPECIES_LIST) {
      if (metrics.birthsBySpeciesLastTick?.[species] !== undefined) {
        metrics.birthsBySpeciesLastTick[species] = 0;
      }
      if (metrics.pregnanciesBySpeciesLastTick?.[species] !== undefined) {
        metrics.pregnanciesBySpeciesLastTick[species] = 0;
      }
      if (metrics.miscarriagesBySpeciesLastTick?.[species] !== undefined) {
        metrics.miscarriagesBySpeciesLastTick[species] = 0;
      }
      if (metrics.mutationsBySpeciesLastTick?.[species] !== undefined) {
        metrics.mutationsBySpeciesLastTick[species] = 0;
      }
      if (metrics.mutationStrengthBySpeciesLastTick?.[species] !== undefined) {
        metrics.mutationStrengthBySpeciesLastTick[species] = 0;
      }
      if (metrics.pleiotropyStrengthBySpeciesLastTick?.[species] !== undefined) {
        metrics.pleiotropyStrengthBySpeciesLastTick[species] = 0;
      }
    }
  }

  for (let i = 0; i < originalCount; i += 1) {
    const creature = creatures[i];
    if (!creature) {
      continue;
    }
    if (!creature.reproduction) {
      creature.reproduction = { cooldownTicks: 0 };
    }
    if (pregnancyEnabled && sexEnabled && !creature.reproduction.pregnancy) {
      creature.reproduction.pregnancy = createPregnancyState();
    }
    if (creature.reproduction.cooldownTicks > 0 && !cooldownUpdatedIds.has(creature.id)) {
      creature.reproduction.cooldownTicks -= 1;
    }
    if (
      pregnancyEnabled &&
      sexEnabled &&
      creature.sex === 'female' &&
      creature.reproduction.pregnancy?.isPregnant
    ) {
      const meters = creature.meters;
      const pregnancy = creature.reproduction.pregnancy;
      const gestationMultiplier = resolveGestationMultiplier({ creature, config });
      const extraMultiplier = Math.max(0, pregnancyMetabolismMultiplier - 1);
      if (meters && extraMultiplier > 0) {
        const energyDrain =
          resolveTraitDrain(creature?.traits?.basalEnergyDrain, fallbackEnergyDrain) *
          tickScale *
          extraMultiplier;
        const waterDrain =
          resolveTraitDrain(creature?.traits?.basalWaterDrain, fallbackWaterDrain) *
          tickScale *
          extraMultiplier;
        const scale = Number.isFinite(creature.lifeStage?.metabolismScale)
          ? creature.lifeStage.metabolismScale
          : 1;
        meters.energy = clampMeter(meters.energy - energyDrain * scale);
        meters.water = clampMeter(meters.water - waterDrain * scale);
      }

      const energyRatio = meters ? meters.energy / baseEnergy : 1;
      if (
        miscarriageEnabled &&
        energyRatio < miscarriageEnergyRatio &&
        rng.nextFloat() < miscarriageChance
      ) {
        pregnancy.isPregnant = false;
        pregnancy.fatherId = null;
        pregnancy.gestationTicksTotal = 0;
        pregnancy.gestationTicksRemaining = 0;
        if (metrics) {
          metrics.miscarriagesTotal = (metrics.miscarriagesTotal ?? 0) + 1;
          metrics.miscarriagesLastTick = (metrics.miscarriagesLastTick ?? 0) + 1;
          if (
            metrics.miscarriagesBySpeciesTotal &&
            metrics.miscarriagesBySpeciesTotal[creature.species] !== undefined
          ) {
            metrics.miscarriagesBySpeciesTotal[creature.species] += 1;
          }
          if (
            metrics.miscarriagesBySpeciesLastTick &&
            metrics.miscarriagesBySpeciesLastTick[creature.species] !== undefined
          ) {
            metrics.miscarriagesBySpeciesLastTick[creature.species] += 1;
          }
        }
        continue;
      }

      pregnancy.gestationTicksRemaining = Math.max(0, pregnancy.gestationTicksRemaining - 1);
      if (pregnancy.gestationTicksRemaining <= 0) {
        const father = pregnancy.fatherId !== null ? creaturesById.get(pregnancy.fatherId) : null;
        const mate = father ?? creature;
        const position = createOffspringPosition({
          rng,
          world,
          source: creature,
          mate,
          config
        });
        const genome = mutateCreatureGenome({
          genome: inheritCreatureGenome({
            parentA: creature,
            parentB: mate,
            config
          }),
          rng,
          config,
          metrics,
          species: creature.species
        });
        const traits = createCreatureTraits({
          config,
          species: creature.species,
          genome
        });
        const sex = sexEnabled ? (rng.nextFloat() < 0.5 ? 'male' : 'female') : null;
        const newbornMeterMultiplier = resolveNewbornMeterMultiplier(config, gestationMultiplier);

        newborns.push({
          id: nextId,
          position,
          species: creature.species,
          sex,
          genome,
          traits,
          ageTicks: 0,
          lifeStage: createLifeStageState(0, config),
          priority: 'thirst',
          intent: { type: 'wander' },
          meters: {
            energy: clampMeter(Math.min(baseEnergy, offspringEnergy * newbornMeterMultiplier)),
            water: clampMeter(Math.min(baseWater, offspringWater * newbornMeterMultiplier)),
            stamina: clampMeter(Math.min(baseStamina, offspringStamina * newbornMeterMultiplier)),
            hp: clampMeter(Math.min(baseHp, offspringHp * newbornMeterMultiplier))
          },
          memory: { entries: [] },
          reproduction: { cooldownTicks }
        });

        nextId += 1;
        pregnancy.isPregnant = false;
        pregnancy.fatherId = null;
        pregnancy.gestationTicksTotal = 0;
        pregnancy.gestationTicksRemaining = 0;

        if (metrics) {
          metrics.birthsTotal = (metrics.birthsTotal ?? 0) + 1;
          metrics.birthsLastTick = (metrics.birthsLastTick ?? 0) + 1;
          const newbornSpecies = creature.species;
          if (
            metrics.birthsBySpeciesTotal &&
            metrics.birthsBySpeciesTotal[newbornSpecies] !== undefined
          ) {
            metrics.birthsBySpeciesTotal[newbornSpecies] += 1;
          }
          if (
            metrics.birthsBySpeciesLastTick &&
            metrics.birthsBySpeciesLastTick[newbornSpecies] !== undefined
          ) {
            metrics.birthsBySpeciesLastTick[newbornSpecies] += 1;
          }
        }
      }
      continue;
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
        minAgeTicks,
        sexEnabled,
        pregnancyEnabled
      })
    ) {
      continue;
    }

    const activeRange = creature.intent?.type === 'mate' ? rangeWhileSeeking : range;
    const mate = findMate({
      creatures,
      startIndex: i,
      source: creature,
      maxDistanceSq: activeRange * activeRange,
      baseEnergy,
      baseWater,
      minEnergyRatio,
      minWaterRatio,
      minAgeTicks,
      pairedIds,
      sexEnabled,
      pregnancyEnabled,
      spatialIndex: index
    });

    if (!mate) {
      continue;
    }

    pairedIds.add(creature.id);
    pairedIds.add(mate.id);

    let didConceive = true;
    let gestationMultiplier = 1;

    if (pregnancyEnabled && sexEnabled) {
      const female = creature.sex === 'female' ? creature : mate;
      gestationMultiplier = resolveGestationMultiplier({
        creature: female,
        config
      });
      didConceive = rng.nextFloat() < conceptionChance;
    }

    const cooldownValue = didConceive ? cooldownTicks : failedCooldownTicks;
    creature.reproduction.cooldownTicks = cooldownValue;
    mate.reproduction.cooldownTicks = cooldownValue;
    cooldownUpdatedIds.add(creature.id);
    cooldownUpdatedIds.add(mate.id);

    const costMultiplier = didConceive ? 1 : failedCostMultiplier;

    if (creature.meters) {
      creature.meters.energy = clampMeter(creature.meters.energy - energyCost * costMultiplier);
      creature.meters.water = clampMeter(creature.meters.water - waterCost * costMultiplier);
      creature.meters.stamina = clampMeter(creature.meters.stamina - staminaCost * costMultiplier);
    }

    if (mate.meters) {
      mate.meters.energy = clampMeter(mate.meters.energy - energyCost * costMultiplier);
      mate.meters.water = clampMeter(mate.meters.water - waterCost * costMultiplier);
      mate.meters.stamina = clampMeter(mate.meters.stamina - staminaCost * costMultiplier);
    }

    if (pregnancyEnabled && sexEnabled) {
      const female = creature.sex === 'female' ? creature : mate;
      const male = female === creature ? mate : creature;
      if (female?.reproduction?.pregnancy) {
        female.reproduction.pregnancy.isPregnant = didConceive;
        if (didConceive) {
          const gestationTicks = Math.max(1, Math.trunc(gestationBaseTicks * gestationMultiplier));
          female.reproduction.pregnancy.fatherId = male?.id ?? null;
          female.reproduction.pregnancy.gestationTicksTotal = gestationTicks;
          female.reproduction.pregnancy.gestationTicksRemaining = gestationTicks;
          if (metrics) {
            metrics.pregnanciesTotal = (metrics.pregnanciesTotal ?? 0) + 1;
            metrics.pregnanciesLastTick = (metrics.pregnanciesLastTick ?? 0) + 1;
            if (
              metrics.pregnanciesBySpeciesTotal &&
              metrics.pregnanciesBySpeciesTotal[female.species] !== undefined
            ) {
              metrics.pregnanciesBySpeciesTotal[female.species] += 1;
            }
            if (
              metrics.pregnanciesBySpeciesLastTick &&
              metrics.pregnanciesBySpeciesLastTick[female.species] !== undefined
            ) {
              metrics.pregnanciesBySpeciesLastTick[female.species] += 1;
            }
          }
        } else {
          female.reproduction.pregnancy.fatherId = null;
          female.reproduction.pregnancy.gestationTicksTotal = 0;
          female.reproduction.pregnancy.gestationTicksRemaining = 0;
        }
      }
      continue;
    }

    const position = createOffspringPosition({
      rng,
      world,
      source: creature,
      mate,
      config
    });

    const genome = mutateCreatureGenome({
      genome: inheritCreatureGenome({
        parentA: creature,
        parentB: mate,
        config
      }),
      rng,
      config,
      metrics,
      species: creature.species
    });

    const traits = createCreatureTraits({
      config,
      species: creature.species,
      genome
    });
    const sex = sexEnabled ? (rng.nextFloat() < 0.5 ? 'male' : 'female') : null;

    newborns.push({
      id: nextId,
      position,
      species: creature.species,
      sex,
      genome,
      traits,
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
      const newbornSpecies = creature.species;
      if (
        metrics.birthsBySpeciesTotal &&
        metrics.birthsBySpeciesTotal[newbornSpecies] !== undefined
      ) {
        metrics.birthsBySpeciesTotal[newbornSpecies] += 1;
      }
      if (
        metrics.birthsBySpeciesLastTick &&
        metrics.birthsBySpeciesLastTick[newbornSpecies] !== undefined
      ) {
        metrics.birthsBySpeciesLastTick[newbornSpecies] += 1;
      }
    }
  }

  if (newborns.length) {
    creatures.push(...newborns);
  }
}
