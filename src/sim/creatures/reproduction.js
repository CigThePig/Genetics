import { createLineage } from './lineage.js';
import { createCreatureTraits } from './traits.js';
import { inheritCreatureGenome, mutateCreatureGenome } from './genetics.js';
import { resolveTicksPerSecond, createLifeStageState } from './life-stages.js';
import { resolveCreatureMaturityScale, resolveCreatureMaxAgeTicks } from './aging.js';
import { SPECIES_LIST } from '../species.js';
import {
  clampMeter,
  resolveRatio,
  resolveDistance,
  resolveBasalDrain,
  resolveTraitDrain,
  resolveMinAgeTicks
} from '../utils/resolvers.js';
import {
  resolveBaseMeter,
  resolveChance,
  resolvePerTickChanceFromPerSecond,
  resolveGestationTicks,
  resolvePregnancyMultiplier,
  resolveCooldownTicks,
  resolveCost,
  isReadyToReproduce,
  findMate,
  createOffspringPosition,
  resolveGestationMultiplier,
  createPregnancyState,
  resolveNewbornMeterMultiplier
} from './reproduction-helpers.js';

export function updateCreatureReproduction({
  creatures,
  config,
  rng,
  world,
  metrics,
  spatialIndex
}) {
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

  let nextId = world.nextCreatureId ?? 0;
  const creaturesById = new Map();
  for (const creature of creatures) {
    if (Number.isFinite(creature?.id) && creature.id >= nextId) {
      nextId = creature.id + 1;
    }
    if (Number.isFinite(creature?.id)) {
      creaturesById.set(creature.id, creature);
    }
  }

  // Initialize everyone before pairing: a male can select a female later in the array.
  for (const creature of creatures) {
    creature.reproduction ??= { cooldownTicks: 0 };
    if (pregnancyEnabled && sexEnabled) {
      creature.reproduction.pregnancy ??= createPregnancyState();
    }
  }

  const pregnantAtStart = new Set(creatures.filter((c) => c.reproduction?.pregnancy?.isPregnant));
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
    if (
      !creature ||
      creature.meters?.hp <= 0 ||
      creature.meters?.energy <= 0 ||
      creature.meters?.water <= 0
    ) {
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
      if (!pregnantAtStart.has(creature)) continue;
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
        pregnancy.fatherGenome = null;
        pregnancy.fatherLineage = null;
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
        const mate = pregnancy.fatherGenome
          ? {
              id: pregnancy.fatherId,
              genome: pregnancy.fatherGenome,
              lineage: pregnancy.fatherLineage,
              species: creature.species
            }
          : (father ?? creature);
        const position = createOffspringPosition({
          rng,
          world,
          source: creature,
          mate: creature, // Live birth happens beside the mother.
          config
        });
        const genome = mutateCreatureGenome({
          genome: inheritCreatureGenome({
            parentA: creature,
            parentB: mate,
            config,
            rng
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
        const maturityScale = resolveCreatureMaturityScale({ genome, config });
        const maxAgeTicks = resolveCreatureMaxAgeTicks({ genome, config });
        const sex = sexEnabled ? (rng.nextFloat() < 0.5 ? 'male' : 'female') : null;
        const newbornMeterMultiplier = resolveNewbornMeterMultiplier(config, gestationMultiplier);

        newborns.push({
          id: nextId,
          lineage: createLineage({
            id: nextId,
            position,
            config,
            parentA: creature,
            parentB: mate
          }),
          generation: 1 + Math.max(creature.generation ?? 0, pregnancy.fatherGeneration ?? 0),
          position,
          species: creature.species,
          sex,
          genome,
          traits,
          maturityScale,
          maxAgeTicks,
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
          // Recovery belongs to an animal that attempted mating, not its offspring.
          reproduction: { cooldownTicks: 0 }
        });

        nextId += 1;
        pairedIds.add(creature.id); // A mother cannot reconceive on her birth tick.
        pregnancy.isPregnant = false;
        pregnancy.fatherId = null;
        pregnancy.fatherGenome = null;
        pregnancy.fatherLineage = null;
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
      spatialIndex: index,
      config,
      world
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

    if (metrics) {
      metrics.matingAttemptsTotal = (metrics.matingAttemptsTotal ?? 0) + 1;
      if (metrics.matingAttemptsBySpecies) {
        metrics.matingAttemptsBySpecies[creature.species] =
          (metrics.matingAttemptsBySpecies[creature.species] ?? 0) + 1;
      }
      if (!didConceive) {
        metrics.matingFailuresTotal = (metrics.matingFailuresTotal ?? 0) + 1;
        if (metrics.matingFailuresBySpecies) {
          metrics.matingFailuresBySpecies[creature.species] =
            (metrics.matingFailuresBySpecies[creature.species] ?? 0) + 1;
        }
      }
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
          female.reproduction.pregnancy.fatherGenome = { ...male.genome };
          female.reproduction.pregnancy.fatherGeneration = male.generation ?? 0;
          female.reproduction.pregnancy.fatherLineage = male.lineage
            ? structuredClone(male.lineage)
            : null;
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
          female.reproduction.pregnancy.fatherGenome = null;
          female.reproduction.pregnancy.fatherLineage = null;
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
        config,
        rng
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
    const maturityScale = resolveCreatureMaturityScale({ genome, config });
    const maxAgeTicks = resolveCreatureMaxAgeTicks({ genome, config });
    const sex = sexEnabled ? (rng.nextFloat() < 0.5 ? 'male' : 'female') : null;

    newborns.push({
      id: nextId,
      lineage: createLineage({ id: nextId, position, config, parentA: creature, parentB: mate }),
      generation: 1 + Math.max(creature.generation ?? 0, mate.generation ?? 0),
      position,
      species: creature.species,
      sex,
      genome,
      traits,
      maturityScale,
      maxAgeTicks,
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
      // Recovery belongs to an animal that attempted mating, not its offspring.
          reproduction: { cooldownTicks: 0 }
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

  world.nextCreatureId = nextId;
  if (newborns.length) {
    creatures.push(...newborns);
  }
}

export { isReadyToReproduce } from './reproduction-helpers.js';
export { selectMateTarget } from './reproduction-helpers.js';
