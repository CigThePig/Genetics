import { describe, it, expect } from 'vitest';
import { generateTerrain } from '../src/sim/regional-terrain.js';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { createRng } from '../src/sim/rng.js';
import { analyzeHabitats } from '../src/sim/habitat-analysis.js';
const make = (seed, width = 120, height = 160, config = {}) => {
  const world = createWorldGrid({ width, height });
  generateTerrain({ world, rng: createRng(seed), config: { seed, ...config } });
  return world;
};
describe('regional geography', () => {
  it('retains large diverse connected habitats and reachable water across 32 seeds', () => {
    const maps = new Set();
    for (let seed = 1; seed <= 32; seed++) {
      const w = make(seed),
        a = analyzeHabitats(w);
      const land = w.cells.length - a.counts.water;
      for (const biome of ['forest', 'plains', 'sand', 'rock']) {
        expect(a.counts[biome] / land, `seed ${seed} ${biome}`).toBeGreaterThan(0.03);
        expect(Math.max(...a.sizes[biome])).toBeGreaterThan(300);
      }
      expect(a.substantialFraction).toBeGreaterThan(0.9);
      expect(a.landConnectivity).toBeGreaterThan(0.95);
      expect(a.boundaryDensity).toBeLessThan(0.15);
      expect(a.tinyLand).toBeLessThan(10);
      expect(a.waterCoverage).toBeGreaterThan(0.02);
      expect(a.sizes.water.every((size) => size >= 20)).toBe(true);
      expect(a.waterCoverage).toBeLessThan(0.2);
      expect(a.waterReachableFraction).toBeGreaterThan(0.99);
      expect(a.waterDistanceP95).toBeLessThan(40);
      maps.add(JSON.stringify(a.counts));
    }
    expect(maps.size).toBe(32);
  });
  it('replays both terrain and regional metadata exactly', () => {
    expect(make(42)).toMatchObject({
      cells: make(42).cells,
      regionIds: make(42).regionIds,
      heightMap: make(42).heightMap
    });
  });
  it.each([
    [1, 1],
    [2, 3],
    [8, 8],
    [160, 120],
    [30, 200]
  ])('handles dimensions %i × %i', (w, h) => {
    const world = make(9, w, h);
    expect(world.cells).toHaveLength(w * h);
    expect(
      world.cells.every((c) => ['forest', 'plains', 'sand', 'rock', 'shore', 'water'].includes(c))
    ).toBe(true);
    expect([...world.heightMap].every(Number.isFinite)).toBe(true);
  });
  it('scale and prevalence change geography without breaking determinism', () => {
    expect(make(4, 120, 160, { terrainRegionScale: 0.2 }).regions.length).toBeGreaterThan(
      make(4).regions.length
    );
    const c = { terrainBiomeWeights: { forest: 10, plains: 0, sand: 0, rock: 0 } };
    expect(analyzeHabitats(make(4, 120, 160, c)).counts.forest).toBeGreaterThan(
      analyzeHabitats(make(4)).counts.forest
    );
  });
});
