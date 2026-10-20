import { localGroups } from './local-groups.js';
import { navigationTarget } from './navigation.js';
import {
  isPackSpecies,
  ensurePackState,
  resolvePackSpacing,
  resolvePatrolRadius,
  resolveTicksPerSecond,
  resolvePackRelocation,
  resolvePatrolMemory,
  recordPreySighting,
  decayPatrolMemory,
  distanceSq
} from './pack-helpers.js';

function chooseSearchDestination(leader, world, rng, config) {
  const p = leader.position,
    state = leader.pack;
  const radius = resolvePatrolRadius(config);
  const recent = state.visited ?? [];
  // Revisit actual observations preferentially, but never read unseen prey.
  const sighting = state.preySightings
    ?.filter((s) => s.strength > 0.2 && distanceSq(p, s) > 16)
    .sort((a, b) => b.strength - a.strength)[0];
  if (sighting && rng.nextFloat() < resolvePatrolMemory(config).preySightingWeight)
    return { x: sighting.x, y: sighting.y };
  let best = null,
    bestScore = -Infinity;
  const relocate = resolvePackRelocation(config);
  const reach =
    relocate.enabled && (state.unsuccessfulSeconds ?? 0) > relocate.afterSeconds
      ? Math.max(radius, relocate.searchRadius * 0.6)
      : radius;
  for (let i = 0; i < 16; i++) {
    const a = rng.nextFloat() * Math.PI * 2,
      d = reach * (0.45 + rng.nextFloat() * 0.55);
    const target = { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d };
    if (
      target.x < 0.5 ||
      target.y < 0.5 ||
      target.x > world.width - 0.5 ||
      target.y > world.height - 0.5
    )
      continue;
    if (world.getTerrainAt(Math.floor(target.x), Math.floor(target.y)) === 'water') continue;
    const novelty = recent.length
      ? Math.min(...recent.map((v) => Math.sqrt(distanceSq(v, target))))
      : reach;
    const score = novelty + Math.sqrt(distanceSq(p, target)) * 0.35;
    if (score > bestScore && navigationTarget(world, p, target)) {
      best = target;
      bestScore = score;
    }
  }
  return best;
}
const searching = (c) =>
  c.intent?.type === 'wander' ||
  (c.intent?.type === 'seek' && c.search?.goal === 'food' && !c.intent?.foodType);
export function updateCreaturePack({ creatures, config, rng, world }) {
  if (!Array.isArray(creatures) || !rng || !world) return;
  if (config?.creaturePackEnabled === false) {
    for (const c of creatures)
      if (c.pack) {
        c.pack.id = null;
        c.pack.waypoint = null;
        c.pack.patrolPauseTicks = 0;
      }
    return;
  }
  const predators = creatures.filter(
    (c) => isPackSpecies(c.species) && c.position && !(c.meters?.hp <= 0)
  );
  const groups = localGroups(predators, {
    field: 'pack',
    radius: resolvePackSpacing(config) * 4,
    maxMembers: 8
  });
  const tps = resolveTicksPerSecond(config);
  for (const c of predators) {
    ensurePackState(c);
    decayPatrolMemory(c, config);
    if (c.chase?.status === 'pursuing' && c.chase.lastSeenTick !== c.pack.recordedSightingTick) {
      recordPreySighting(c, c.chase.lastKnownPosition, config);
      c.pack.recordedSightingTick = c.chase.lastSeenTick;
    }
  }
  for (const [id, members] of groups) {
    const leader = members[0],
      state = leader.pack;
    state.id = id;
    state.role = 'leader';
    state.leaderId = leader.id;
    state.home ??= { ...leader.position };
    for (const m of members.slice(1)) {
      if (distanceSq(m.position, leader.position) < (resolvePackSpacing(config) * 4) ** 2) {
        const observation = m.pack.preySightings?.[m.pack.preySightings.length - 1];
        if (
          observation &&
          observation.strength > 0.5 &&
          state.sharedSightingTick !== m.chase?.lastSeenTick
        ) {
          recordPreySighting(leader, observation, config);
          state.sharedSightingTick = m.chase?.lastSeenTick;
        }
      }
    }
    if (searching(leader)) {
      state.unsuccessfulSeconds = (state.unsuccessfulSeconds ?? 0) + 1 / tps;
      const reached = state.waypoint && distanceSq(leader.position, state.waypoint) < 2.25;
      state.waypointTicksRemaining = Math.max(0, (state.waypointTicksRemaining ?? 0) - 1);
      if (reached && !state.pausedAtWaypoint) {
        state.pausedAtWaypoint = true;
        state.patrolPauseTicks = Math.ceil(resolvePatrolMemory(config).pauseDuration * tps);
        state.goalsCompleted = (state.goalsCompleted ?? 0) + 1;
      }
      if (state.patrolPauseTicks > 0) {
        state.patrolPauseTicks--;
        leader.intent.target = null;
      } else {
        if (
          !state.waypoint ||
          reached ||
          state.waypointTicksRemaining === 0 ||
          state.staleTicks > resolvePackRelocation(config).afterSeconds * tps
        ) {
          state.visited ??= [];
          state.visited.push(state.waypoint ?? { ...leader.position });
          if (state.visited.length > 16) state.visited.shift();
          if (state.waypoint && !reached) state.goalsAbandoned = (state.goalsAbandoned ?? 0) + 1;
          state.waypoint = chooseSearchDestination(leader, world, rng, config);
          state.home = { ...leader.position };
          state.pausedAtWaypoint = false;
          state.staleTicks = 0;
          const speed = Math.max(
            0.5,
            (leader.traits?.speed ?? config?.creatureBaseSpeed ?? 10) * 0.4
          );
          state.waypointTicksRemaining = state.waypoint
            ? Math.ceil(
                (8 + (Math.sqrt(distanceSq(leader.position, state.waypoint)) / speed) * 3) * tps
              )
            : tps;
        }
        leader.intent.target = state.waypoint ? { ...state.waypoint } : null;
      }
      const last = state.progressPosition ?? leader.position;
      state.staleTicks =
        distanceSq(last, leader.position) < 0.000001 ? (state.staleTicks ?? 0) + 1 : 0;
      state.progressPosition = { ...leader.position };
    } else if (leader.chase?.status === 'pursuing') state.unsuccessfulSeconds = 0;
    for (const m of members.slice(1)) {
      const s = m.pack;
      s.id = id;
      s.role = 'member';
      s.leaderId = leader.id;
      s.home = { ...state.home };
      s.waypoint = state.waypoint ? { ...state.waypoint } : null;
      // A survivor can take over search without losing all territory knowledge.
      s.visited = (state.visited ?? []).map((v) => ({ ...v }));
      s.patrolPauseTicks = 0;
      const waypointKey = s.waypoint ? `${s.waypoint.x},${s.waypoint.y}` : null;
      if (waypointKey !== s.sharedWaypointKey) {
        s.sharedWaypointKey = waypointKey;
        s.scoutTarget = null;
        if (s.waypoint) {
          for (let attempt = 0; attempt < 4; attempt++) {
            const angle = rng.nextFloat() * Math.PI * 2,
              spread = resolvePackSpacing(config) * (1 + rng.nextFloat());
            const candidate = {
              x: s.waypoint.x + Math.cos(angle) * spread,
              y: s.waypoint.y + Math.sin(angle) * spread
            };
            if (
              candidate.x >= 0.5 &&
              candidate.y >= 0.5 &&
              candidate.x < world.width - 0.5 &&
              candidate.y < world.height - 0.5 &&
              world.getTerrainAt(Math.floor(candidate.x), Math.floor(candidate.y)) !== 'water'
            ) {
              s.scoutTarget = candidate;
              break;
            }
          }
        }
      }
      if (searching(m)) {
        const far = distanceSq(m.position, leader.position) > (resolvePackSpacing(config) * 4) ** 2;
        m.intent.target = far
          ? { ...leader.position }
          : (s.scoutTarget ?? s.waypoint)
            ? { ...(s.scoutTarget ?? s.waypoint) }
            : null;
      }
    }
    // Bounded local spacing; no rotating slots, no force attracting to pack centre.
    for (const m of members) {
      let x = 0,
        y = 0;
      for (const n of members) {
        if (n === m) continue;
        const d = Math.sqrt(distanceSq(m.position, n.position));
        if (d > 0 && d < resolvePackSpacing(config)) {
          const f = (1 - d / resolvePackSpacing(config)) ** 2;
          x += ((m.position.x - n.position.x) / d) * f;
          y += ((m.position.y - n.position.y) / d) * f;
        }
      }
      m.pack.spacing = { x, y };
    }
  }
}
export const getPackInfo = (c) => c?.pack ?? null;
export const isPackLeader = (c) => c?.pack?.role === 'leader';
export function recordPredatorPreySighting(c, p, config) {
  if (c && p && isPackSpecies(c.species)) recordPreySighting(c, p, config);
}
export const isPatrolPaused = (c) => (c?.pack?.patrolPauseTicks ?? 0) > 0;
