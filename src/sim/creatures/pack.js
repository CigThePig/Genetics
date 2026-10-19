import {
  isPackSpecies,
  isPackEnabled,
  resolvePackSpacing,
  resolvePatrolRadius,
  resolvePatrolRetargetTime,
  resolvePackRelocation,
  resolveTicksPerSecond,
  ensurePackState,
  ensureHome,
  groupIntoPacks,
  resolvePatrolMemory,
  recordPreySighting,
  decayPatrolMemory,
  pickPatrolWaypoint,
  pickRetargetTicks,
  distanceSq,
  calculateFormationPosition,
  shouldUsePackBehavior,
  isLeaderEngaged,
  pickRelocationHome
} from './pack-helpers.js';

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
  const relocation = resolvePackRelocation(config);

  // Decay prey sighting memory for all predators
  for (const creature of creatures) {
    if (isPackSpecies(creature.species)) {
      decayPatrolMemory(creature, config);

      // Record prey sighting if currently chasing/seeing prey
      if (creature.chase?.lastKnownPosition) {
        recordPreySighting(creature, creature.chase.lastKnownPosition, config);
      }
    }
  }

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
    if (!Number.isFinite(leaderPack.staleTicks)) {
      leaderPack.staleTicks = 0;
    }

    // Leader waypoint logic (only if wandering)
    if (shouldUsePackBehavior(leader)) {
      // Decrement timer
      if (leaderPack.waypointTicksRemaining > 0) {
        leaderPack.waypointTicksRemaining -= 1;
      }

      // Finish a scanning pause before selecting the next waypoint.
      const reached = leaderPack.waypoint && distanceSq(leader.position, leaderPack.waypoint) < 4;
      if (reached && !leaderPack.pausedAtWaypoint) {
        leaderPack.pausedAtWaypoint = true;
        leaderPack.patrolPauseTicks = Math.floor(
          resolvePatrolMemory(config).pauseDuration * ticksPerSecond
        );
      }
      const pausing = leaderPack.patrolPauseTicks > 0;
      const needNewWaypoint = !pausing && (leaderPack.waypointTicksRemaining <= 0 || reached);

      if (needNewWaypoint || !leaderPack.waypoint) {
        leaderPack.lastWaypoint = leaderPack.waypoint;
        leaderPack.waypoint = pickPatrolWaypoint(
          leaderHome,
          patrolRadius,
          world,
          rng,
          config,
          leader
        );
        leaderPack.waypointTicksRemaining = pickRetargetTicks(
          rng,
          patrolRetarget.min,
          patrolRetarget.max,
          ticksPerSecond
        );
        // Reset patrol pause flag for new waypoint
        leaderPack.pausedAtWaypoint = false;
      }

      if (relocation.enabled && leaderHome) {
        const engaged = isLeaderEngaged(leader);
        const staleRadius = Math.max(6, patrolRadius * 0.35);
        const staleRadiusSq = staleRadius * staleRadius;
        const waypointLocal = leaderPack.waypoint
          ? distanceSq(leaderPack.waypoint, leaderHome) <= staleRadiusSq
          : true;
        const waypointRepeated =
          leaderPack.waypoint &&
          leaderPack.lastWaypoint &&
          distanceSq(leaderPack.waypoint, leaderPack.lastWaypoint) <= staleRadiusSq;
        if (!engaged && (waypointLocal || waypointRepeated || !leaderPack.waypoint)) {
          leaderPack.staleTicks += 1;
        } else {
          leaderPack.staleTicks = Math.max(0, leaderPack.staleTicks - 2);
        }
        const staleThreshold = Math.trunc(relocation.afterSeconds * ticksPerSecond);
        if (leaderPack.staleTicks >= staleThreshold) {
          const newHome = pickRelocationHome(leader, leaderHome, world, rng, config, relocation);
          if (newHome) {
            leaderPack.home = newHome;
            leaderPack.lastWaypoint = null;
            leaderPack.waypoint = pickPatrolWaypoint(
              newHome,
              patrolRadius,
              world,
              rng,
              config,
              leader
            );
            leaderPack.waypointTicksRemaining = pickRetargetTicks(
              rng,
              patrolRetarget.min,
              patrolRetarget.max,
              ticksPerSecond
            );
            leaderPack.pausedAtWaypoint = false;
          }
          leaderPack.staleTicks = 0;
        }
      } else {
        leaderPack.staleTicks = 0;
      }

      // Handle patrol pause countdown
      if (leaderPack.patrolPauseTicks > 0) {
        leaderPack.patrolPauseTicks--;
        leader.intent.target = null;
      } else if (leaderPack.waypoint && leader.intent) {
        leader.intent.target = { x: leaderPack.waypoint.x, y: leaderPack.waypoint.y };
      }
    } else {
      leaderPack.staleTicks = 0;
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
      memberPack.home = leaderPack.home;

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

export function getPackInfo(creature) {
  return creature?.pack ?? null;
}

export function isPackLeader(creature) {
  return creature?.pack?.role === 'leader';
}

export function recordPredatorPreySighting(creature, position, config) {
  if (!creature || !position) return;
  if (!isPackSpecies(creature.species)) return;
  recordPreySighting(creature, position, config);
}

export function isPatrolPaused(creature) {
  return (creature?.pack?.patrolPauseTicks ?? 0) > 0;
}
