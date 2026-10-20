import { resolveHerdingRegroupMinLocalHerdSize } from './movement-helpers.js';
import { localGroups } from './local-groups.js';
import { clearLandLine } from './navigation.js';
import {
  isPredator,
  findNeighbors,
  findThreats,
  ensureHerdingState,
  resolveCohesionRadius,
  resolveSeparationRadius,
  resolveSeparationStrength,
  resolveThreatRange,
  resolveThreatPropagationRadius,
  resolveThreatPropagationHops,
  resolveThreatDecayTicks,
  resolveMovementContagionRadius,
  resolveMovementContagionDelay,
  resolveMovementContagionChance
} from './herding-simple-helpers.js';

export function escapeDirection(creature, threats, world) {
  const p = creature.position,
    previous = creature.herding?.threatDirection;
  let best = null,
    bestScore = -Infinity;
  // Score *individual* clearance; averaging opposing predators can cancel to zero.
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const dir = { x: Math.cos(a), y: Math.sin(a) };
    const endpoint = { x: p.x + dir.x * 3, y: p.y + dir.y * 3 };
    if (world && !clearLandLine(world, p, endpoint)) continue;
    let nearest = Infinity,
      gain = 0;
    for (const threat of threats) {
      const t = threat.position ?? threat.creature?.position;
      if (!t) continue;
      const before = Math.hypot(t.x - p.x, t.y - p.y),
        after = Math.hypot(t.x - endpoint.x, t.y - endpoint.y);
      nearest = Math.min(nearest, after);
      gain += (after - before) / Math.max(1, before * before);
    }
    if (!Number.isFinite(nearest)) nearest = 0;
    const continuity = previous
      ? dir.x * previous.x + dir.y * previous.y
      : Math.cos(a - (creature.motion?.heading ?? 0));
    const score = nearest + gain * 4 + continuity * 0.8;
    if (score > bestScore) {
      bestScore = score;
      best = dir;
    }
  }
  if (best) return best;
  // Enclosed shore: physical navigation will brake rather than turn instantaneously.
  return (
    previous ?? {
      x: Math.cos(creature.motion?.heading ?? 0),
      y: Math.sin(creature.motion?.heading ?? 0)
    }
  );
}

export function updateCreatureHerdingSimple({ creatures, config, spatialIndex, rng, world }) {
  if (!Array.isArray(creatures)) return;
  const tps = config?.ticksPerSecond ?? 60;
  const live = creatures.filter((c) => c?.position && !(c.meters?.hp <= 0));
  const herb = live.filter((c) => !isPredator(c.species));
  const groups = localGroups(herb, {
    field: 'herding',
    radius: resolveCohesionRadius(config) * 1.5,
    maxMembers: 24
  });
  const warnings = new Map(
    herb.map((c) => [
      c.id,
      {
        remaining: c.herding?.threatDecayTicks ?? 0,
        hops: c.herding?.threatHops ?? 0,
        position: c.herding?.threatPosition ? { ...c.herding.threatPosition } : null
      }
    ])
  );
  for (const c of live) {
    const h = ensureHerdingState(c);
    h.postDrinkRegroupTicks = Math.max(0, (h.postDrinkRegroupTicks ?? 0) - 1);
    h.postDrinkRegroupMaxTicks = Math.ceil((config?.creaturePostDrinkRegroupSeconds ?? 3) * tps);
    h.shouldStartMoving = false;
    h.rejoinTarget = null;
    h.localLeaderId = null;
    h.herdHeading = null;
    h.targetOffset = null;
    if (isPredator(c.species)) {
      h.isThreatened = false;
      h.herdSize = 1;
      h.nearbyThreats = 0;
      continue;
    }
    const neighbors = findNeighbors(c, live, resolveCohesionRadius(config), spatialIndex).filter(
      (n) => !(n.creature.meters?.hp <= 0)
    );
    h.herdSize = neighbors.length + 1;
    const threats = findThreats(
      c,
      live,
      resolveThreatRange(config),
      spatialIndex,
      world,
      config
    ).sort((a, b) => a.distance - b.distance || a.creature.id - b.creature.id);
    h.nearbyThreats = threats.length;
    h.nearestThreatDistance = threats[0]?.distance ?? null;
    h.threatDecayTicks = Math.max(0, (h.threatDecayTicks ?? 0) - 1);
    if (threats.length) {
      h.threatPosition = { ...threats[0].creature.position };
      h.threatHops = 0;
      h.threatDecayTicks = resolveThreatDecayTicks(config);
    } else {
      const alarm = findNeighbors(c, live, resolveThreatPropagationRadius(config), spatialIndex)
        .map((n) => ({ n, w: warnings.get(n.creature.id) }))
        .filter(
          ({ w }) => w?.position && w.remaining > 1 && w.hops < resolveThreatPropagationHops(config)
        )
        .sort(
          (a, b) =>
            a.w.hops - b.w.hops || a.n.distance - b.n.distance || a.n.creature.id - b.n.creature.id
        )[0];
      // Never refresh a warning past its original expiration. One edge per tick.
      if (alarm && alarm.w.remaining - 1 > h.threatDecayTicks) {
        h.threatPosition = { ...alarm.w.position };
        h.threatHops = alarm.w.hops + 1;
        h.threatDecayTicks = alarm.w.remaining - 1;
      }
    }
    const wasThreatened = h.isThreatened;
    h.isThreatened = h.threatDecayTicks > 0;
    if (h.isThreatened && h.threatPosition) {
      h.escapeCommitTicks = Math.max(0, (h.escapeCommitTicks ?? 0) - 1);
      if (
        !wasThreatened ||
        h.escapeCommitTicks === 0 ||
        (threats[0]?.distance ?? Infinity) < 2 ||
        !h.threatDirection ||
        (world &&
          !clearLandLine(world, c.position, {
            x: c.position.x + h.threatDirection.x * 3,
            y: c.position.y + h.threatDirection.y * 3
          }))
      ) {
        const observed = threats.length ? threats : [{ position: h.threatPosition }];
        h.threatDirection = escapeDirection(c, observed, world);
        h.escapeCommitTicks = Math.ceil(0.4 * tps);
      }
      h.targetOffset = { ...h.threatDirection };
      h.smoothedOffset = { ...h.threatDirection };
      continue;
    }
    h.threatDirection = null;
    h.threatPosition = null;
    h.threatHops = 0;
    h.lastRegroupVector = null;
    // Personal-space forces taper to zero and never attract toward a centre.
    let sx = 0,
      sy = 0;
    const comfort = resolveSeparationRadius(config);
    for (const n of neighbors)
      if (n.distance > 0 && n.distance < comfort) {
        const strength = (1 - n.distance / comfort) ** 2;
        sx -= (n.dx / n.distance) * strength;
        sy -= (n.dy / n.distance) * strength;
      }
    const mag = Math.hypot(sx, sy),
      cap = Math.min(0.35, resolveSeparationStrength(config) * mag);
    h.targetOffset = mag > 0.001 ? { x: (sx / mag) * cap, y: (sy / mag) * cap } : null;
    h.smoothedOffset = h.targetOffset ?? { x: 0, y: 0 };
    const speed =
      c.motion?.currentSpeed ?? Math.hypot(c.motion?.velocity?.x ?? 0, c.motion?.velocity?.y ?? 0);
    h.isMoving = speed > 0.4;
    h.movingTicksCounter = h.isMoving ? (h.movingTicksCounter ?? 0) + 1 : 0;
    h.leadershipScore = h.isMoving ? Math.min(1, h.movingTicksCounter / (3 * tps)) : 0;
    h.contagionDelayTicks = Math.max(0, (h.contagionDelayTicks ?? 0) - 1);
    const moving = neighbors
      .filter(
        (n) =>
          n.distance <= resolveMovementContagionRadius(config) &&
          (n.creature.motion?.currentSpeed ?? 0) > 0.4 &&
          n.creature.locomotion?.target &&
          n.creature.locomotion.reason !== 'graze locally'
      )
      .sort((a, b) => a.distance - b.distance || a.creature.id - b.creature.id);
    h.localLeaderId = moving[0]?.creature.id ?? null;
    if (moving.length && h.contagionDelayTicks === 0) {
      h.shouldStartMoving = (rng?.nextFloat() ?? 1) < resolveMovementContagionChance(config);
      h.contagionDelayTicks = resolveMovementContagionDelay(config);
    }
    // Rejoin a local known group only when outside its comfort band. No perpetual
    // pull on every animal and no species-centroid target shared across the map.
    if (
      h.herdSize < resolveHerdingRegroupMinLocalHerdSize(config) &&
      config?.creatureHerdingRegroupEnabled !== false &&
      ['wander', 'graze'].includes(c.intent?.type)
    ) {
      const group = groups.get(h.groupId);
      const kin =
        group
          ?.filter((n) => n !== c)
          .sort(
            (a, b) =>
              Math.hypot(a.position.x - c.position.x, a.position.y - c.position.y) -
              Math.hypot(b.position.x - c.position.x, b.position.y - c.position.y)
          )[0] ??
        findNeighbors(c, live, config?.creatureHerdingRegroupRange ?? 45, spatialIndex).sort(
          (a, b) => a.distance - b.distance || a.creature.id - b.creature.id
        )[0]?.creature;
      if (
        kin &&
        Math.hypot(kin.position.x - c.position.x, kin.position.y - c.position.y) >
          resolveCohesionRadius(config)
      )
        h.rejoinTarget = { ...kin.position };
    }
  }
}
export const getHerdingOffsetSimple = (c) => c?.herding?.targetOffset ?? null;
export const getHerdHeading = (c) => c?.herding?.herdHeading ?? null;
export const isThreatenedSimple = (c) => c?.herding?.isThreatened ?? false;
export const getHerdSizeSimple = (c) => c?.herding?.herdSize ?? 1;
export const getLocalLeaderId = (c) => c?.herding?.localLeaderId ?? null;
export const shouldStartMoving = (c) => c?.herding?.shouldStartMoving ?? false;
export const getLeadershipScore = (c) => c?.herding?.leadershipScore ?? 0;
