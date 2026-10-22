import { NEUTRAL_LOCI } from './creatures/lineage.js';

export const geographicRegion = (p, size = 30) =>
  `${Math.floor(p.x / size)},${Math.floor(p.y / size)}`;

// Descriptive Nei-style heterozygosity partition, not an unbiased F_ST estimator.
// Fixed spatial bins are observation units, never inputs to animal decisions.
export function neutralStructure(creatures, { regionSize = 30, minSample = 5 } = {}) {
  const groups = new Map();
  for (const c of creatures) {
    if (!c.lineage?.markers) continue;
    const key = geographicRegion(c.position, regionSize);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  const retained = [...groups.values()].filter((g) => g.length >= minSample);
  const n = retained.reduce((s, g) => s + g.length, 0);
  let ht = 0;
  let hs = 0;
  for (let l = 0; l < NEUTRAL_LOCI; l++) {
    let total = 0;
    for (const group of retained) {
      const copies = group.reduce(
        (s, c) => s + c.lineage.markers[2 * l] + c.lineage.markers[2 * l + 1],
        0
      );
      const p = copies / (2 * group.length);
      total += copies;
      hs += (group.length / n) * 2 * p * (1 - p);
    }
    const p = n ? total / (2 * n) : 0;
    ht += 2 * p * (1 - p);
  }
  return {
    regions: retained.length,
    included: n,
    excluded: creatures.length - n,
    regionCounts: [...groups.entries()].map(([region, group]) => ({ region, n: group.length })),
    totalHeterozygosity: n ? ht / NEUTRAL_LOCI : null,
    withinHeterozygosity: n ? hs / NEUTRAL_LOCI : null,
    gst: retained.length >= 2 && ht > 0 ? (ht - hs) / ht : null
  };
}
