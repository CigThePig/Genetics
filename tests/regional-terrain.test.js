import { simConfig } from '../src/sim/config.js';
import { describe, it, expect } from 'vitest';
import { generateTerrain } from '../src/sim/regional-terrain.js';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { createCreatures } from '../src/sim/creatures/spawn.js';
import { createSim } from '../src/sim/sim.js';
import { createCamera } from '../src/render/camera.js';
import { createRng, deriveSeed } from '../src/sim/rng.js';
import { analyzeHabitats } from '../src/sim/habitat-analysis.js';
const make = (seed, width = 120, height = 160, config = {}) => {
  const world = createWorldGrid({ width, height });
  generateTerrain({ world, rng: createRng(seed), config: { ...simConfig, seed, ...config } });
  return world;
};
describe('environmental geography', () => {
  it('retains large diverse connected habitats and reachable water across 32 seeds', () => {
    const maps = new Set();
    for (let seed = 1; seed <= 32; seed++) {
      const w = make(seed),
        a = analyzeHabitats(w);
      const land = w.cells.length - a.counts.water;
      for (const biome of ['forest', 'plains', 'sand', 'rock']) {
        expect(a.counts[biome] / land, `seed ${seed} ${biome}`).toBeGreaterThan(0.03);
        // Ridges and riparian habitats can be elongated rather than one large blob.
        expect(
          a.sizes[biome].filter((n) => n >= 50).reduce((n, m) => n + m, 0) / a.counts[biome],
          `seed ${seed} ${biome} substantial habitat`
        ).toBeGreaterThan(0.7);
      }
      expect(a.substantialFraction).toBeGreaterThan(0.9);
      expect(a.landConnectivity).toBeGreaterThan(0.95);
      expect(a.boundaryDensity).toBeLessThan(0.15);
      expect(a.tinyLand).toBeLessThan(10);
      expect(a.waterCoverage).toBeGreaterThan(0.02);
      expect(
        a.sizes.water.filter((size) => size >= 20).reduce((a, b) => a + b, 0) / a.counts.water
      ).toBeGreaterThan(0.85);
      expect(a.waterCoverage).toBeLessThan(0.2);
      expect(a.waterReachableFraction).toBeGreaterThan(0.99);
      expect(a.waterDistanceP95).toBeLessThan(60);
      maps.add(JSON.stringify(a.counts));
    }
    expect(maps.size).toBe(32);
  });
  it('replays both terrain and environmental fields exactly', () => {
    expect(make(42)).toMatchObject({
      cells: make(42).cells,
      moistureMap: make(42).moistureMap,
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
    expect(make(4, 120, 160, { terrainRegionScale: 0.2 }).heightMap).not.toEqual(make(4).heightMap);
    const c = { terrainBiomeWeights: { forest: 10, plains: 0, sand: 0, rock: 0 } };
    expect(analyzeHabitats(make(4, 120, 160, c)).counts.forest).toBeGreaterThan(
      analyzeHabitats(make(4)).counts.forest
    );
  });
});

describe('geography integration invariants', () => {
  it.each([
    [120, 160],
    [240, 320],
    [180, 240],
    [1, 50],
    [50, 1],
    [2, 2]
  ])('routes runoff downhill without cycles at %i × %i', (width, height) => {
    const world = make(42, width, height);
    const { parent, spillParent, filled, accumulation } = world.drainage;
    let runoff = 0,
      sinkFlow = 0;
    for (let i = 0; i < world.cells.length; i++) {
      expect(filled[i]).toBeGreaterThanOrEqual(world.heightMap[i]);
      runoff += 0.4 + world.rainfallMap[i];
      if (parent[i] < 0) sinkFlow += accumulation[i];
      else {
        const p = parent[i];
        expect(
          Math.abs((p % width) - (i % width)) +
            Math.abs(Math.floor(p / width) - Math.floor(i / width))
        ).toBe(1);
        expect(world.heightMap[p]).toBeLessThan(world.heightMap[i]);
        expect(accumulation[p]).toBeGreaterThanOrEqual(accumulation[i]);
        if (accumulation[i] > world.drainage.channelThreshold) expect(world.cells[p]).toBe('water');
      }
      if (spillParent[i] >= 0) expect(filled[spillParent[i]]).toBeLessThanOrEqual(filled[i]);
    }
    expect(Math.abs(sinkFlow - runoff) / runoff).toBeLessThan(0.00001);
  });
  it('regenerates reused and non-land-default grids exactly like a fresh grid', () => {
    const reused = make(1);
    const config = { ...simConfig, seed: 42, terrainWaterCoverageMultiplier: 0.5 };
    generateTerrain({ world: reused, rng: createRng(42), config });
    const fresh = make(42, 120, 160, { terrainWaterCoverageMultiplier: 0.5 });
    expect(reused.cells).toEqual(fresh.cells);
    expect(reused.heightMap).toEqual(fresh.heightMap);
    expect(reused.habitatAccess.waterDistance).toEqual(fresh.habitatAccess.waterDistance);
    const initialWater = createWorldGrid({ width: 120, height: 160, defaultTerrain: 'water' });
    generateTerrain({ world: initialWater, rng: createRng(42), config });
    expect(initialWater.cells).toEqual(fresh.cells);
  });
  it('derives biomes from climate and relief rather than assigning climate to labels', () => {
    const world = make(42);
    const mean = (field, type) => {
      const ids = world.cells.map((v, i) => (v === type ? i : -1)).filter((i) => i >= 0);
      return ids.reduce((n, i) => n + world[field][i], 0) / ids.length;
    };
    expect(mean('moistureMap', 'forest')).toBeGreaterThan(mean('moistureMap', 'sand'));
    expect(mean('heightMap', 'rock')).toBeGreaterThan(mean('heightMap', 'plains'));
    const other = make(42, 120, 160, {
      terrainBiomeWeights: { forest: 10, plains: 1, sand: 1, rock: 1 }
    });
    expect(other.heightMap).toEqual(world.heightMap);
    expect(other.moistureMap).toEqual(world.moistureMap);
    expect(other.flowParent).toEqual(world.flowParent);
  });
  it('isolates initialization streams and resets to the same tick trajectory', () => {
    const a = createSim({ seed: 42 }),
      b = createSim({ seed: 42, grassPatchCount: 2, bushCount: 3 });
    expect(a.state.creatures).toEqual(b.state.creatures);
    a.tick();
    b.tick();
    expect(a.state.lastRoll).toBe(b.state.lastRoll);
    const expected = JSON.stringify(a.state);
    a.setSeed(42);
    a.tick();
    expect(JSON.stringify(a.state)).toBe(expected);
    const terrain = createRng(deriveSeed(42, 'terrain'));
    const spawn = createRng(deriveSeed(42, 'creatures'));
    for (let i = 0; i < 100; i++) terrain.nextFloat();
    expect(spawn.nextFloat()).toBe(createRng(deriveSeed(42, 'creatures')).nextFloat());
  });
  it.each([
    [120, 160],
    [240, 320],
    [400, 400]
  ])('keeps founding cohorts physically local at %i × %i', (width, height) => {
    for (const seed of [1, 42, 1337]) {
      const world = createWorldGrid({ width, height });
      const creatures = createCreatures({ world, config: simConfig, rng: createRng(seed) });
      const predators = creatures.filter((c) => ['triangle', 'octagon'].includes(c.species));
      const prey = creatures.filter((c) => ['square', 'circle'].includes(c.species));
      for (const p of predators) {
        const nearest = Math.min(
          ...prey.map((c) => Math.hypot(c.position.x - p.position.x, c.position.y - p.position.y))
        );
        // Physical annulus, two species offsets and two individual jitters.
        expect(nearest).toBeLessThanOrEqual(
          simConfig.creatureSpawnPredatorAnchorDistance * 2 +
            2 * Math.SQRT2 * simConfig.creatureSpawnSpeciesAnchorSpread +
            simConfig.creatureSpawnClusterJitter * 2
        );
      }
      expect(creatures).toHaveLength(80);
      expect(predators).toHaveLength(8);
    }
  });
  it('fits enlarged maps on narrow viewports while retaining pan bounds', () => {
    const camera = createCamera({ minZoom: 0.1 });
    camera.setViewport(390, 844);
    camera.setBoundsFromWorld({ width: 240, height: 320 }, 20);
    camera.zoomTo(0.001);
    const state = camera.getState();
    expect(state.zoom * 240 * 20).toBeLessThanOrEqual(390);
    expect(state.zoom * 320 * 20).toBeLessThanOrEqual(844);
    camera.panBy(10000, 10000);
    expect(Math.abs(camera.getState().x)).toBe(0);
    expect(Math.abs(camera.getState().y)).toBe(0);
  });
});
