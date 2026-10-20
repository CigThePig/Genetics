import { mateSelectionCost } from './mate-preference.js';
import { canSeeCreature } from './visibility.js';
import { resolveWaterTerrain, isWaterTile } from '../utils/resolvers.js';

export const resolveBaseMeter = (value) => (Number.isFinite(value) && value > 0 ? value : 1);

export const resolveChance = (value, fallback) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, value));
};

export const resolvePerTickChanceFromPerSecond = (chancePerSecond, ticksPerSecond) => {
  if (!Number.isFinite(chancePerSecond)) {
    return null;
  }
  const tps = Number.isFinite(ticksPerSecond) && ticksPerSecond > 0 ? ticksPerSecond : 60;
  const clamped = Math.min(1, Math.max(0, chancePerSecond));
  if (clamped === 0) return 0;
  if (clamped === 1) return 1;
  return 1 - Math.pow(1 - clamped, 1 / tps);
};

export const resolveGestationTicks = (seconds, fallbackSeconds, ticksPerSecond) => {
  const tps = Number.isFinite(ticksPerSecond) ? ticksPerSecond : 60;
  const value = Number.isFinite(seconds) ? seconds : fallbackSeconds;
  return Math.max(1, Math.trunc(value * tps));
};

export const resolvePregnancyMultiplier = (value, fallback) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, value);
};

export const resolveCooldownTicks = (value, fallback, ticksPerSecond) => {
  if (!Number.isFinite(value)) {
    return Math.max(0, Math.trunc(fallback * ticksPerSecond));
  }
  return Math.max(0, Math.trunc(value * ticksPerSecond));
};

export const resolveCost = (value, fallback) =>
  Number.isFinite(value) ? Math.max(0, value) : fallback;

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
  if (!meters || meters.hp <= 0 || meters.energy <= 0 || meters.water <= 0) {
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
  // Use effective age: fast growers reach maturity sooner
  const maturityScale = Number.isFinite(creature.maturityScale) ? creature.maturityScale : 1;
  const effectiveAgeTicks = (creature.ageTicks ?? 0) * maturityScale;
  if (!Number.isFinite(effectiveAgeTicks) || effectiveAgeTicks < minAgeTicks) {
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
  if (!candidate?.position || candidate === source || candidate.species !== source.species) {
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

export const selectMateTarget = (options) => {
  const {
    creatures,
    source,
    maxDistanceSq,
    spatialIndex,
    config = {},
    world,
    honorCommitment = false
  } = options;
  if (!source?.position || !Array.isArray(creatures)) return null;
  const range = Math.sqrt(maxDistanceSq);
  const candidates =
    spatialIndex && spatialIndex.creatureCount > 0
      ? spatialIndex
          .queryNearby(source.position.x, source.position.y, range, { exclude: source })
          .map((entry) => entry.creature)
      : creatures;
  const findById = (id) =>
    spatialIndex?.getById(id) ?? creatures.find((creature) => creature.id === id);
  const committedId = (creature) => {
    const state = creature.reproduction?.mate;
    // Commitments belong to the reproduction state, not a transient eat/drink intent.
    return Number.isFinite(state?.targetId) &&
      Number.isFinite(state?.commitTicksRemaining) &&
      state.commitTicksRemaining > 0
      ? state.targetId
      : null;
  };
  const available = (candidate) => {
    if (!isMateCandidate({ ...options, candidate })) return false;
    if (!honorCommitment) return true;
    const reservedId = committedId(candidate);
    if (reservedId === null || reservedId === source.id) return true;
    // An expired or ineligible partner must not reserve this candidate indefinitely.
    const reservedMate = findById(reservedId);
    return !isMateCandidate({ ...options, source: candidate, candidate: reservedMate });
  };
  const ownCommitment = honorCommitment ? committedId(source) : null;
  if (ownCommitment !== null) {
    const mate = findById(ownCommitment);
    if (mate && isMateCandidate({ ...options, candidate: mate })) {
      if (!available(mate)) return null; // Wait for this commitment; do not substitute a rival's partner.
      const d =
        (mate.position.x - source.position.x) ** 2 + (mate.position.y - source.position.y) ** 2;
      // A valid distant or concealed commitment cannot be replaced at conception.
      return d <= maxDistanceSq && canSeeCreature(source, mate, world, config, range, true)
        ? mate
        : null;
    }
  }
  let chosen = null,
    best = Infinity;
  for (const candidate of candidates) {
    if (!available(candidate)) continue;
    const d =
      (candidate.position.x - source.position.x) ** 2 +
      (candidate.position.y - source.position.y) ** 2;
    if (d > maxDistanceSq || !canSeeCreature(source, candidate, world, config, range)) continue;
    const cost = mateSelectionCost(source, candidate, Math.sqrt(d), config);
    if (cost < best || (cost === best && candidate.id < (chosen?.id ?? Infinity))) {
      chosen = candidate;
      best = cost;
    }
  }
  return chosen;
};

export const findMate = (options) => selectMateTarget({ ...options, honorCommitment: true });

const spawnOffset = (rng) => (rng.nextFloat() * 2 - 1) * 0.35;

export const createOffspringPosition = ({ rng, world, source, mate, config }) => {
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

export const resolveGestationMultiplier = ({ creature, config }) => {
  if (config?.creatureGestationTraitEnabled === false) {
    return 1;
  }
  return clampGestationMultiplier(creature?.traits?.gestationMultiplier ?? 1);
};

export const createPregnancyState = () => ({
  isPregnant: false,
  fatherId: null,
  gestationTicksTotal: 0,
  gestationTicksRemaining: 0
});

export const resolveNewbornMeterMultiplier = (config, gestationMultiplier) => {
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
