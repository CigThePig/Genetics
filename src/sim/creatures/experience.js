import { resolveTicksPerSecond } from './life-stages.js';

// Personal experience, not an inherited map or a live predator reference.
export function updateDangerMemories({ creatures, config }) {
  const seconds = Math.max(0, config.creatureDangerMemorySeconds ?? 45);
  const dt = 1 / resolveTicksPerSecond(config);
  for (const c of creatures) {
    if (!c.position || c.meters?.hp <= 0) continue;
    const memory = (c.experience ??= { dangerSites: [] });
    memory.dangerSites = memory.dangerSites.filter((site) => {
      site.remaining = Math.min(seconds, site.remaining - dt);
      return site.remaining > 0;
    });
    const h = c.herding;
    // Social alarms can trigger escape, but cannot manufacture personal experience.
    if (!seconds || !h?.isThreatened || !h.nearbyThreats || !h.threatPosition) continue;
    const point = h.threatPosition;
    let site = memory.dangerSites.find((s) => Math.hypot(s.x - point.x, s.y - point.y) < 4);
    if (!site) {
      if (memory.dangerSites.length === 3) memory.dangerSites.shift();
      site = { x: point.x, y: point.y, remaining: seconds };
      memory.dangerSites.push(site);
    }
    site.remaining = seconds;
    // A pre-escape discretionary goal should be reconsidered after danger passes.
    if (
      c.locomotion &&
      ['explore', 'graze locally', 'skirt remembered danger'].includes(c.locomotion.reason)
    )
      c.locomotion.remaining = 0;
  }
}

// Exposure along the proposed segment. Starting inside a remembered area is not
// a trap: outgoing routes are penalized less as their endpoints gain clearance.
export function rememberedRouteRisk(creature, target, config) {
  const seconds = Math.max(0, config.creatureDangerMemorySeconds ?? 45);
  if (!seconds || !target) return 0;
  const a = creature.position;
  const dx = target.x - a.x,
    dy = target.y - a.y;
  const length2 = dx * dx + dy * dy;
  let risk = 0;
  for (const site of creature.experience?.dangerSites ?? []) {
    const t = length2
      ? Math.max(0, Math.min(1, ((site.x - a.x) * dx + (site.y - a.y) * dy) / length2))
      : 0;
    const clearance = Math.hypot(site.x - a.x - t * dx, site.y - a.y - t * dy);
    const start = Math.hypot(site.x - a.x, site.y - a.y);
    const end = Math.hypot(site.x - target.x, site.y - target.y);
    const departure = start < 6 && end > start ? Math.min(1, 6 / Math.max(6, end)) : 1;
    risk +=
      Math.max(0, 1 - clearance / 6) *
      Math.min(1, Math.max(0, site.remaining / seconds)) *
      departure;
  }
  return risk;
}
