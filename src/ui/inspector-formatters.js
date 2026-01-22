/**
 * Inspector Formatters Module
 *
 * Formatting functions for the creature inspection panel.
 * Extracted from main.js to reduce file size.
 */

import { getSpeciesLabel } from '../sim/species.js';
import { FOOD_LABELS } from '../sim/creatures/food.js';

/**
 * Formats food efficiency values for display.
 */
export const formatEfficiency = (efficiency) => {
  if (!efficiency) {
    return 'Unknown';
  }
  const grass = Number.isFinite(efficiency.grass)
    ? efficiency.grass.toFixed(2)
    : '--';
  const berries = Number.isFinite(efficiency.berries)
    ? efficiency.berries.toFixed(2)
    : '--';
  const meat = Number.isFinite(efficiency.meat)
    ? efficiency.meat.toFixed(2)
    : '--';
  return `Grass ${grass}, Berries ${berries}, Meat ${meat}`;
};

/**
 * Formats a genome value for display.
 */
export const formatGenomeValue = (value) =>
  Number.isFinite(value) ? value.toFixed(2) : '--';

/**
 * Formats a genome summary line.
 */
export const formatGenomeSummary = (genome) => {
  if (!genome) {
    return 'Genome: --';
  }
  return `Genome: spd ${formatGenomeValue(genome.speed)}, perc ${formatGenomeValue(
    genome.perceptionRange
  )}, alert ${formatGenomeValue(genome.alertness)}, drain ${formatGenomeValue(
    genome.basalEnergyDrain
  )}`;
};

/**
 * Formats a memory entry for display.
 */
export const formatMemoryEntry = (entry) => {
  const type = entry?.type ?? 'unknown';
  const typeLabel =
    type === 'food'
      ? `Food (${FOOD_LABELS[entry?.foodType] ?? entry?.foodType ?? 'Unknown'})`
      : type === 'water'
        ? 'Water'
        : type === 'danger'
          ? 'Danger'
          : type === 'mate'
            ? 'Mate'
            : 'Unknown';
  const x = Number.isFinite(entry?.x) ? entry.x.toFixed(1) : '--';
  const y = Number.isFinite(entry?.y) ? entry.y.toFixed(1) : '--';
  const strength = Number.isFinite(entry?.strength)
    ? entry.strength.toFixed(2)
    : '--';
  const age = Number.isFinite(entry?.ageTicks) ? entry.ageTicks : '--';
  return `${typeLabel} @ ${x}, ${y} (strength ${strength}, age ${age})`;
};

/**
 * Formats targeting information rows.
 */
export const formatTargetingRows = (targeting) => {
  if (!targeting) {
    return ['Target: none'];
  }
  const targetId = Number.isFinite(targeting.targetId)
    ? targeting.targetId
    : '--';
  const species = targeting.preySpecies
    ? getSpeciesLabel(targeting.preySpecies)
    : 'Unknown';
  const score = Number.isFinite(targeting.score)
    ? targeting.score.toFixed(2)
    : '--';
  const distance = Number.isFinite(targeting.distance)
    ? targeting.distance.toFixed(2)
    : '--';
  return [
    `Target: ${targetId}`,
    `Target species: ${species}`,
    `Target score: ${score}`,
    `Target distance: ${distance}`
  ];
};

/**
 * Formats chase information rows.
 */
export const formatChaseRows = (chase) => {
  if (!chase) {
    return ['Chase: none'];
  }
  const status = chase.status ?? 'idle';
  const targetId = Number.isFinite(chase.targetId) ? chase.targetId : '--';
  const prey = chase.preySpecies
    ? getSpeciesLabel(chase.preySpecies)
    : 'Unknown';
  const distance = Number.isFinite(chase.distance)
    ? chase.distance.toFixed(2)
    : '--';
  const restTicks = Number.isFinite(chase.restTicks) ? chase.restTicks : '--';
  const outcome = chase.lastOutcome ?? 'none';
  return [
    `Chase status: ${status}`,
    `Chase target: ${targetId}`,
    `Chase prey: ${prey}`,
    `Chase distance: ${distance}`,
    `Chase rest ticks: ${restTicks}`,
    `Chase last outcome: ${outcome}`
  ];
};

/**
 * Formats memory entries rows for a creature.
 */
export const formatMemoryRows = (creature) => {
  const entries = creature?.memory?.entries;
  if (!Array.isArray(entries) || entries.length === 0) {
    return ['Memory: none'];
  }
  const sorted = [...entries].sort((a, b) => {
    const strengthGap = (b?.strength ?? 0) - (a?.strength ?? 0);
    if (strengthGap !== 0) {
      return strengthGap;
    }
    return (a?.ageTicks ?? 0) - (b?.ageTicks ?? 0);
  });
  const top = sorted.slice(0, 3);
  return ['Memory entries:', ...top.map(formatMemoryEntry)];
};

/**
 * Formats all creature meter/status rows for the inspector panel.
 */
export const formatCreatureRows = (creature) => {
  if (!creature) {
    return ['No creature nearby'];
  }
  return [
    `Creature ${creature.id}`,
    `Species: ${getSpeciesLabel(creature.species)}`,
    `Life stage: ${creature.lifeStage?.label ?? 'Unknown'}`,
    `Age ticks: ${Number.isFinite(creature.ageTicks) ? creature.ageTicks : '--'}`,
    `Stage move scale: ${creature.lifeStage?.movementScale?.toFixed(2) ?? '--'}`,
    `Stage metabolism scale: ${creature.lifeStage?.metabolismScale?.toFixed(2) ?? '--'}`,
    `Priority: ${creature.priority ?? 'Unknown'}`,
    `Intent: ${creature.intent?.type ?? 'Unknown'}`,
    `Food target: ${FOOD_LABELS[creature.intent?.foodType] ?? 'None'}`,
    `Perception range: ${Number.isFinite(creature.perception?.range) ? creature.perception.range.toFixed(1) : '--'}`,
    `Perception food: ${FOOD_LABELS[creature.perception?.foodType] ?? 'None'}`,
    `Perception food distance: ${Number.isFinite(creature.perception?.foodDistance) ? creature.perception.foodDistance.toFixed(1) : '--'}`,
    `Perception water distance: ${Number.isFinite(creature.perception?.waterDistance) ? creature.perception.waterDistance.toFixed(1) : '--'}`,
    `Alertness: ${Number.isFinite(creature.alertness?.level) ? creature.alertness.level.toFixed(2) : '--'}`,
    `Reaction delay: ${Number.isFinite(creature.alertness?.reactionDelay) ? creature.alertness.reactionDelay : '--'}`,
    `Reaction cooldown: ${Number.isFinite(creature.alertness?.reactionCooldown) ? creature.alertness.reactionCooldown : '--'}`,
    formatGenomeSummary(creature.genome),
    `Trait speed: ${Number.isFinite(creature.traits?.speed) ? creature.traits.speed.toFixed(2) : '--'}`,
    `Trait alertness: ${Number.isFinite(creature.traits?.alertness) ? creature.traits.alertness.toFixed(2) : '--'}`,
    `Trait basal drain: E ${Number.isFinite(creature.traits?.basalEnergyDrain) ? creature.traits.basalEnergyDrain.toFixed(3) : '--'}, W ${Number.isFinite(creature.traits?.basalWaterDrain) ? creature.traits.basalWaterDrain.toFixed(3) : '--'}`,
    ...formatTargetingRows(creature.targeting),
    ...formatChaseRows(creature.chase),
    `Food efficiency: ${formatEfficiency(creature.traits?.foodEfficiency)}`,
    ...formatMemoryRows(creature),
    `Energy: ${creature.meters.energy.toFixed(2)}`,
    `Water: ${creature.meters.water.toFixed(2)}`,
    `Stamina: ${creature.meters.stamina.toFixed(2)}`,
    `HP: ${creature.meters.hp.toFixed(2)}`
  ];
};
