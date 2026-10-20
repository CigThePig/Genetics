import { selectMemoryTarget, MEMORY_TYPES } from './memory.js';
import {
  isHerbivoreSpecies,
  resolveWaterRendezvousEnabled,
  resolveWaterRendezvousMaxDistance
} from './intent-helpers.js';
// Share observed water within a geographical group. No species-wide centroid or
// map-wide remote sampling. Unknown water still requires individual exploration.
export function updateHerdWaterTargetsOncePerTick({ creatures, config, world, tick }) {
  if (!world) return;
  if (!resolveWaterRendezvousEnabled(config)) {
    world.herdWaterTargets = {};
    return;
  }
  const groups = new Map();
  for (const c of creatures ?? [])
    if (c.position && isHerbivoreSpecies(c.species) && !(c.meters?.hp <= 0)) {
      const key = c.herding?.groupId ?? c.species;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(c);
    }
  const targets = {};
  const state = (world.herdWaterState ??= new Map());
  for (const key of state.keys()) if (!groups.has(key)) state.delete(key);
  for (const [key, members] of groups) {
    const center = members[0].position;
    const candidates = [];
    for (const c of members) {
      const p =
        c.perception?.waterCell ?? selectMemoryTarget({ creature: c, type: MEMORY_TYPES.WATER });
      if (
        p &&
        Math.hypot(p.x - center.x, p.y - center.y) <= resolveWaterRendezvousMaxDistance(config)
      )
        candidates.push(p);
    }
    candidates.sort(
      (a, b) =>
        Math.hypot(a.x - center.x, a.y - center.y) - Math.hypot(b.x - center.x, b.y - center.y) ||
        a.y - b.y ||
        a.x - b.x
    );
    const observed = candidates[0];
    if (observed) state.set(key, { x: observed.x, y: observed.y, lastObservedTick: tick ?? 0 });
    const known = state.get(key);
    if (known && (tick ?? 0) - (known.lastObservedTick ?? 0) < (config?.ticksPerSecond ?? 60) * 60)
      targets[key] = { ...known };
    else state.delete(key);
  }
  world.herdWaterTargets = targets;
}
