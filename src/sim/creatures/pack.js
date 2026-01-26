/**
 * Pack Module
 *
 * Implements pack behavior for predator creatures.
 * - Predators form packs based on species
 * - Packs have a leader (stable: lowest id alive)
 * - Leaders select patrol waypoints
 * - Pack members follow in formation around the leader
 *
 * This module only handles patrol behavior. Hunt flanking/interception
 * can be added in a future track.
 */

import { SPECIES } from '../species.js';
import { resolveWaterTerrain, isWaterTile } from '../utils/resolvers.js';

/**
 * Predator species that form packs.
 */
const PACK_SPECIES = new Set([SPECIES.TRIANGLE, SPECIES.OCTAGON]);

/**
 * Checks if a species forms packs.
 */
const isPackSpecies = (species) => PACK_SPECIES.has(species);

/**
 * Checks if pack behavior is enabled.
 */
const isPackEnabled = (config) => config?.creaturePackEnabled !== false;

/**
 * Resolves pack spacing (distance between members).
 */
const resolvePackSpacing = (config) =>
  Number.isFinite(config?.creaturePackSpacing) ? Math.max(1, config.creaturePackSpacing) : 3.5;

/**
 * Resolves patrol radius from config.
 */
const resolvePatrolRadius = (config) =>
  Number.isFinite(config?.creaturePredatorPatrolRadius)
    ? Math.max(5, config.creaturePredatorPatrolRadius)
    : 25;

/**
 * Resolves patrol retarget time range from config (in seconds).
 */
const resolvePatrolRetargetTime = (config) => {
  const min = Number.isFinite(config?.creaturePredatorPatrolRetargetTimeMin)
    ? Math.max(1, config.creaturePredatorPatrolRetargetTimeMin)
    : 3;
  const max = Number.isFinite(config?.creaturePredatorPatrolRetargetTimeMax)
    ? Math.max(min, config.creaturePredatorPatrolRetargetTimeMax)
    : 8;
  return { min, max };
};

/**
 * Resolves ticks per second from config.
 */
const resolveTicksPerSecond = (config) =>
  Number.isFinite(config?.ticksPerSecond) ? Math.max(1, config.ticksPerSecond) : 60;

/**
 * Ensures pack state exists on creature.
 */
const ensurePackState = (creature) => {
  if (!creature.pack) {
    creature.pack = {
      id: null,
      role: 'member',
      leaderId: null,
      waypoint: null,
      waypointTicksRemaining: 0,
      home: null
    };
  }
  return creature.pack;
};

/**
 * Sets the creature's home position (spawn location, lazily set).
 */
const ensureHome = (creature) => {
  const pack = creature.pack;
  if (!pack.home && creature.position) {
    pack.home = { x: creature.position.x, y: creature.position.y };
  }
  return pack.home;
};

/**
 * Groups predators by species into packs.
 * Returns a map: species -> array of creatures (sorted by id for stable leader).
 */
const groupIntoPacks = (creatures) => {
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

/**
 * Picks a random patrol waypoint within radius of home.
 * Avoids water tiles.
 */
const pickPatrolWaypoint = (home, radius, world, rng, config) => {
  const waterTerrain = resolveWaterTerrain(config);
  const maxAttempts = 10;

  for (let i = 0; i < maxAttempts; i++) {
    // Random angle and distance
    const angle = rng.nextFloat() * Math.PI * 2;
    const dist = rng.nextFloat() * radius;
    const x = home.x + Math.cos(angle) * dist;
    const y = home.y + Math.sin(angle) * dist;

    // Clamp to world bounds
    const clampedX = Math.max(0, Math.min(world.width - 1, x));
    const clampedY = Math.max(0, Math.min(world.height - 1, y));

    // Check if it's water
    if (!isWaterTile(world, Math.floor(clampedX), Math.floor(clampedY), waterTerrain)) {
      return { x: clampedX, y: clampedY };
    }
  }

  // Fallback to home if all attempts hit water
  return { x: home.x, y: home.y };
};

/**
 * Picks a random retarget time in ticks.
 */
const pickRetargetTicks = (rng, minSeconds, maxSeconds, ticksPerSecond) => {
  const seconds = minSeconds + rng.nextFloat() * (maxSeconds - minSeconds);
  return Math.max(1, Math.trunc(seconds * ticksPerSecond));
};

/**
 * Calculates formation position for a pack member.
 * Members position themselves around the leader in a V or line formation.
 */
const calculateFormationPosition = (leader, memberIndex, totalMembers, spacing) => {
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

/**
 * Checks if creature should use pack patrol behavior.
 * Only applies when creature is wandering (not hunting, eating, etc).
 */
const shouldUsePackBehavior = (creature) => {
  const intent = creature.intent?.type;
  // Pack behavior only overrides wander
  // Never override urgent needs
  return intent === 'wander';
};

/**
 * Updates pack behavior for predator creatures.
 * - Assigns pack membership and roles
 * - Leaders select patrol waypoints
 * - Members follow formation around leader
 */
export function updateCreaturePack({ creatures, config, rng, world }) {
  if (!Array.isArray(creatures) || !rng || !world) {
    return;
  }

  if (!isPackEnabled(config)) {
    return;
  }

  const ticksPerSecond = resolveTicksPerSecond(config);
  const patrolRadius = resolvePatrolRadius(config);
  const patrolRetarget = resolvePatrolRetargetTime(config);
  const packSpacing = resolvePackSpacing(config);

  // Group predators into packs by species
  const packs = groupIntoPacks(creatures);

  // Process each pack
  for (const [species, members] of packs) {
    if (members.length === 0) continue;

    // Leader is first in sorted list (lowest id)
    const leader = members[0];
    const leaderPack = ensurePackState(leader);
    const leaderHome = ensureHome(leader);

    leaderPack.id = species;
    leaderPack.role = 'leader';
    leaderPack.leaderId = leader.id;

    // Leader waypoint logic (only if wandering)
    if (shouldUsePackBehavior(leader)) {
      // Decrement timer
      if (leaderPack.waypointTicksRemaining > 0) {
        leaderPack.waypointTicksRemaining -= 1;
      }

      // Check if we've reached the waypoint or timer expired
      let needNewWaypoint = leaderPack.waypointTicksRemaining <= 0;
      if (leaderPack.waypoint && leader.position) {
        const dx = leaderPack.waypoint.x - leader.position.x;
        const dy = leaderPack.waypoint.y - leader.position.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 4) {
          // Within 2 tiles of waypoint
          needNewWaypoint = true;
        }
      }

      if (needNewWaypoint || !leaderPack.waypoint) {
        leaderPack.waypoint = pickPatrolWaypoint(leaderHome, patrolRadius, world, rng, config);
        leaderPack.waypointTicksRemaining = pickRetargetTicks(
          rng,
          patrolRetarget.min,
          patrolRetarget.max,
          ticksPerSecond
        );
      }

      // Set leader's intent target to waypoint
      if (leaderPack.waypoint && leader.intent) {
        leader.intent.target = { x: leaderPack.waypoint.x, y: leaderPack.waypoint.y };
      }
    }

    // Process followers
    for (let i = 1; i < members.length; i++) {
      const member = members[i];
      const memberPack = ensurePackState(member);
      ensureHome(member);

      memberPack.id = species;
      memberPack.role = 'member';
      memberPack.leaderId = leader.id;
      memberPack.waypoint = leaderPack.waypoint; // Share leader's waypoint for reference

      // Formation following (only if wandering)
      if (shouldUsePackBehavior(member)) {
        const formationPos = calculateFormationPosition(leader, i, members.length, packSpacing);

        // Set member's intent target to their formation position
        if (member.intent) {
          member.intent.target = { x: formationPos.x, y: formationPos.y };
        }
      }
    }
  }
}

/**
 * Gets the pack info for a creature.
 */
export function getPackInfo(creature) {
  return creature?.pack ?? null;
}

/**
 * Checks if a creature is a pack leader.
 */
export function isPackLeader(creature) {
  return creature?.pack?.role === 'leader';
}
