import { SPECIES } from '../species.js';

const PACK_SPECIES = new Set([SPECIES.TRIANGLE, SPECIES.OCTAGON]);

export const isPackSpecies = (species) => PACK_SPECIES.has(species);

export const isPackEnabled = (config) => config?.creaturePackEnabled !== false;

export const resolvePackSpacing = (config) =>
  Number.isFinite(config?.creaturePackSpacing) ? Math.max(1, config.creaturePackSpacing) : 3.5;

export const resolvePatrolRadius = (config) =>
  Number.isFinite(config?.creaturePredatorPatrolRadius)
    ? Math.max(5, config.creaturePredatorPatrolRadius)
    : 25;

export const resolvePatrolRetargetTime = (config) => {
  const min = Number.isFinite(config?.creaturePredatorPatrolRetargetTimeMin)
    ? Math.max(1, config.creaturePredatorPatrolRetargetTimeMin)
    : 3;
  const max = Number.isFinite(config?.creaturePredatorPatrolRetargetTimeMax)
    ? Math.max(min, config.creaturePredatorPatrolRetargetTimeMax)
    : 8;
  return { min, max };
};

export const resolvePackRelocation = (config) => ({
  enabled: config?.creaturePackRelocationEnabled !== false,
  afterSeconds: Number.isFinite(config?.creaturePackRelocateAfterSeconds)
    ? Math.max(1, config.creaturePackRelocateAfterSeconds)
    : 20,
  minDistance: Number.isFinite(config?.creaturePackRelocateMinDistance)
    ? Math.max(0, config.creaturePackRelocateMinDistance)
    : 25,
  searchRadius: Number.isFinite(config?.creaturePackRelocateSearchRadius)
    ? Math.max(5, config.creaturePackRelocateSearchRadius)
    : 80,
  sampleAttempts: Number.isFinite(config?.creaturePackRelocateSampleAttempts)
    ? Math.max(1, Math.trunc(config.creaturePackRelocateSampleAttempts))
    : 20,
  avoidWater: config?.creaturePackRelocateAvoidWater !== false
});

export const resolveTicksPerSecond = (config) =>
  Number.isFinite(config?.ticksPerSecond) ? Math.max(1, config.ticksPerSecond) : 60;

export const ensurePackState = (creature) => {
  if (!creature.pack) {
    creature.pack = {
      id: null,
      role: 'member',
      leaderId: null,
      waypoint: null,
      waypointTicksRemaining: 0,
      home: null,
      staleTicks: 0,
      lastWaypoint: null
    };
  }
  return creature.pack;
};

export const ensureHome = (creature) => {
  const pack = creature.pack;
  if (!pack.home && creature.position) {
    pack.home = { x: creature.position.x, y: creature.position.y };
  }
  return pack.home;
};

export const resolvePatrolMemory = (config) => ({
  decayRate: Number.isFinite(config?.creaturePredatorPatrolMemoryDecay)
    ? Math.max(0.001, config.creaturePredatorPatrolMemoryDecay)
    : 0.015,
  maxEntries: Number.isFinite(config?.creaturePredatorPatrolMemoryMax)
    ? Math.max(1, Math.trunc(config.creaturePredatorPatrolMemoryMax))
    : 8,
  preySightingWeight: Number.isFinite(config?.creaturePredatorPatrolPreySightingWeight)
    ? Math.max(0, Math.min(1, config.creaturePredatorPatrolPreySightingWeight))
    : 0.6,
  grassAreaWeight: Number.isFinite(config?.creaturePredatorPatrolGrassWeight)
    ? Math.max(0, Math.min(1, config.creaturePredatorPatrolGrassWeight))
    : 0.3,
  pauseDuration: Number.isFinite(config?.creaturePredatorPatrolPauseDuration)
    ? Math.max(0, config.creaturePredatorPatrolPauseDuration)
    : 1.5
});

const ensurePatrolMemory = (creature) => {
  if (!creature.pack) {
    creature.pack = {};
  }
  if (!creature.pack.preySightings) {
    creature.pack.preySightings = [];
  }
  return creature.pack.preySightings;
};

export const recordPreySighting = (creature, position, config) => {
  if (!position) return;

  const sightings = ensurePatrolMemory(creature);
  const memConfig = resolvePatrolMemory(config);

  // Check if we already have a sighting near this location
  const mergeDistance = 5;
  const mergeDistSq = mergeDistance * mergeDistance;

  for (const sighting of sightings) {
    const dx = sighting.x - position.x;
    const dy = sighting.y - position.y;
    if (dx * dx + dy * dy < mergeDistSq) {
      // Merge: refresh strength and update position slightly
      sighting.strength = Math.min(1, sighting.strength + 0.3);
      sighting.x = (sighting.x + position.x) / 2;
      sighting.y = (sighting.y + position.y) / 2;
      return;
    }
  }

  // Add new sighting
  sightings.push({
    x: position.x,
    y: position.y,
    strength: 1
  });

  // Trim to max entries
  while (sightings.length > memConfig.maxEntries) {
    // Remove weakest
    let weakest = 0;
    for (let i = 1; i < sightings.length; i++) {
      if (sightings[i].strength < sightings[weakest].strength) {
        weakest = i;
      }
    }
    sightings.splice(weakest, 1);
  }
};

export const decayPatrolMemory = (creature, config) => {
  const sightings = creature.pack?.preySightings;
  if (!sightings?.length) return;

  const memConfig = resolvePatrolMemory(config);
  const tickScale = 1 / resolveTicksPerSecond(config);
  const decay = memConfig.decayRate * tickScale;

  for (let i = sightings.length - 1; i >= 0; i--) {
    sightings[i].strength -= decay;
    if (sightings[i].strength <= 0) {
      sightings.splice(i, 1);
    }
  }
};

export const distanceSq = (a, b) => {
  if (!a || !b) return Infinity;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};
