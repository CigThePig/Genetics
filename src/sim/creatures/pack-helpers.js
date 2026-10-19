import { SPECIES } from '../species.js';
import { resolveWaterTerrain, isWaterTile } from '../utils/resolvers.js';

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

export const groupIntoPacks = (creatures) => {
  const packs = new Map();

  for (const creature of creatures) {
    if (!creature?.position) continue;
    if (!isPackSpecies(creature.species)) continue;

    const species = creature.species;
    if (!packs.has(species)) {
      packs.set(species, []);
    }
    packs.get(species).push(creature);
  }

  // Sort each pack by id for stable leader selection
  for (const members of packs.values()) {
    members.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  }

  return packs;
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

const findGrassArea = (position, radius, world, rng) => {
  if (!world?.getGrassAt) return null;

  const sampleCount = 12;
  let bestX = null;
  let bestY = null;
  let bestGrass = 0;

  for (let i = 0; i < sampleCount; i++) {
    const angle = rng.nextFloat() * Math.PI * 2;
    const dist = rng.nextFloat() * radius;
    const x = Math.floor(position.x + Math.cos(angle) * dist);
    const y = Math.floor(position.y + Math.sin(angle) * dist);

    if (x < 0 || x >= world.width || y < 0 || y >= world.height) continue;

    if (world.getTerrainAt(x, y) === 'water') continue;
    const grass = world.getGrassAt(x, y) ?? 0;
    if (grass > bestGrass) {
      bestGrass = grass;
      bestX = x + 0.5;
      bestY = y + 0.5;
    }
  }

  if (bestX !== null && bestGrass > 0.3) {
    return { x: bestX, y: bestY };
  }

  return null;
};

export const pickPatrolWaypoint = (home, radius, world, rng, config, creature) => {
  const waterTerrain = resolveWaterTerrain(config);
  const memConfig = resolvePatrolMemory(config);
  const roll = rng.nextFloat();

  let target = null;

  // Try prey sighting (60% chance)
  if (roll < memConfig.preySightingWeight && creature) {
    const sightings = creature.pack?.preySightings;
    if (sightings?.length > 0) {
      // Weight by strength and distance
      let totalWeight = 0;
      for (const s of sightings) {
        const dx = s.x - home.x;
        const dy = s.y - home.y;
        const distSq = dx * dx + dy * dy;
        const distFactor = Math.max(0.1, 1 - Math.sqrt(distSq) / (radius * 2));
        s._weight = s.strength * distFactor;
        totalWeight += s._weight;
      }

      if (totalWeight > 0) {
        let pick = rng.nextFloat() * totalWeight;
        for (const s of sightings) {
          pick -= s._weight;
          if (pick <= 0) {
            target = { x: s.x, y: s.y };
            break;
          }
        }
      }
    }
  }
  // Try grass area (30% chance, or fallback)
  else if (roll < memConfig.preySightingWeight + memConfig.grassAreaWeight) {
    const grassArea = findGrassArea(home, radius, world, rng);
    if (grassArea) {
      target = grassArea;
    }
  }

  // Validate target or fallback to random
  if (target) {
    const tileX = Math.floor(target.x);
    const tileY = Math.floor(target.y);
    if (!isWaterTile(world, tileX, tileY, waterTerrain)) {
      // Add some jitter to avoid exact same spots
      target.x += (rng.nextFloat() - 0.5) * 3;
      target.y += (rng.nextFloat() - 0.5) * 3;
      target.x = Math.max(0, Math.min(world.width - 1, target.x));
      target.y = Math.max(0, Math.min(world.height - 1, target.y));
      return target;
    }
  }

  // Random exploration fallback
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    const angle = rng.nextFloat() * Math.PI * 2;
    const dist = rng.nextFloat() * radius;
    const x = home.x + Math.cos(angle) * dist;
    const y = home.y + Math.sin(angle) * dist;

    const clampedX = Math.max(0, Math.min(world.width - 1, x));
    const clampedY = Math.max(0, Math.min(world.height - 1, y));

    if (!isWaterTile(world, Math.floor(clampedX), Math.floor(clampedY), waterTerrain)) {
      return { x: clampedX, y: clampedY };
    }
  }

  return { x: home.x, y: home.y };
};

export const pickRetargetTicks = (rng, minSeconds, maxSeconds, ticksPerSecond) => {
  const seconds = minSeconds + rng.nextFloat() * (maxSeconds - minSeconds);
  return Math.max(1, Math.trunc(seconds * ticksPerSecond));
};

export const distanceSq = (a, b) => {
  if (!a || !b) return Infinity;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};

export const calculateFormationPosition = (leader, memberIndex, totalMembers, spacing) => {
  const leaderHeading = leader.motion?.heading ?? 0;

  // Formation: spread members behind and to the sides of the leader
  // Index 0 is leader, so memberIndex starts at 1 for followers
  const row = Math.floor((memberIndex + 1) / 2); // How many rows back
  const side = memberIndex % 2 === 0 ? 1 : -1; // Alternate left/right

  // Offset behind leader
  const backOffset = row * spacing * 0.8;
  // Offset to side
  const sideOffset = row * spacing * 0.6 * side;

  // Rotate offset by leader heading
  const cosH = Math.cos(leaderHeading);
  const sinH = Math.sin(leaderHeading);

  // Behind is negative in forward direction
  const localX = -backOffset;
  const localY = sideOffset;

  const worldX = leader.position.x + localX * cosH - localY * sinH;
  const worldY = leader.position.y + localX * sinH + localY * cosH;

  return { x: worldX, y: worldY };
};

export const shouldUsePackBehavior = (creature) => {
  const intent = creature.intent?.type;
  // Pack behavior only overrides wander
  // Never override urgent needs
  return intent === 'wander';
};

export const isLeaderEngaged = (leader) => {
  const status = leader?.chase?.status;
  return status === 'pursuing' || status === 'losing';
};

export const pickRelocationHome = (leader, leaderHome, world, rng, config, relocation) => {
  if (!leader?.position || !leaderHome) return null;
  const waterTerrain = resolveWaterTerrain(config);
  const minDistanceSq = relocation.minDistance * relocation.minDistance;
  const maxDistanceSq = relocation.searchRadius * relocation.searchRadius;
  let bestCandidate = null;
  let bestDistanceSq = -1;

  for (let i = 0; i < relocation.sampleAttempts; i++) {
    const angle = rng.nextFloat() * Math.PI * 2;
    const dist = Math.sqrt(rng.nextFloat() * maxDistanceSq);
    const x = leader.position.x + Math.cos(angle) * dist;
    const y = leader.position.y + Math.sin(angle) * dist;
    const clampedX = Math.max(0, Math.min(world.width - 1, x));
    const clampedY = Math.max(0, Math.min(world.height - 1, y));
    const candidate = { x: clampedX, y: clampedY };
    const candidateDistanceSq = distanceSq(candidate, leaderHome);
    if (candidateDistanceSq < minDistanceSq) continue;
    if (
      relocation.avoidWater &&
      isWaterTile(world, Math.floor(clampedX), Math.floor(clampedY), waterTerrain)
    ) {
      continue;
    }
    if (!bestCandidate || candidateDistanceSq > bestDistanceSq) {
      bestCandidate = candidate;
      bestDistanceSq = candidateDistanceSq;
    }
  }

  return bestCandidate;
};
