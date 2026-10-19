import { describe, it, expect, vi } from 'vitest';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { createTerrainCache } from '../src/render/terrain-cache.js';

const withCanvas = (check) => {
  const context = new Proxy(
    { createLinearGradient: () => ({ addColorStop() {} }) },
    {
      get(target, key) {
        return key in target ? target[key] : () => {};
      }
    }
  );
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => context }) });
  try {
    check(context);
  } finally {
    vi.unstubAllGlobals();
  }
};

describe('repository audit: terrain caches', () => {
  it('marks direct world-grid edits dirty, without marking no-op edits', () => {
    const world = createWorldGrid({ width: 2, height: 2 });
    world.setGrassAt(0, 0, 0.5);
    world.setTerrainAt(1, 1, 'forest');
    expect(world.grassDirtyCounter).toBe(1);
    expect(world.terrainDirtyCounter).toBe(1);
    world.setGrassAt(0, 0, 0.5);
    world.setTerrainAt(1, 1, 'forest');
    expect(world.grassDirtyCounter).toBe(1);
    expect(world.terrainDirtyCounter).toBe(1);
  });
  it('builds all initial grass and flushes later edits for paused rendering', () =>
    withCanvas((ctx) => {
      const world = createWorldGrid({ width: 4, height: 4, defaultGrass: 0.5 });
      const config = { grassCap: 1 };
      const cache = createTerrainCache({ ctx, texNoise: { simplex2: () => 0 } });
      const before = JSON.stringify(world);
      cache.ensureTerrainCache(world, config, 20);
      expect(JSON.stringify(world)).toBe(before);
      expect(cache.terrainCache.lastGrassDirtyCounter).toBe(world.grassDirtyCounter);
      expect(cache.terrainCache.grassRebuildActive).toBe(false);
      world.setGrassAt(0, 0, 1);
      cache.maybeUpdateGrassCache(
        cache.terrainCache,
        world,
        config,
        20,
        null,
        performance.now(),
        true
      );
      expect(cache.terrainCache.lastGrassDirtyCounter).toBe(world.grassDirtyCounter);
      expect(cache.terrainCache.grassRebuildActive).toBe(false);
    }));
  it('invalidates terrain and grass appearance after relevant changes', () =>
    withCanvas((ctx) => {
      const world = createWorldGrid({ width: 2, height: 2 });
      const config = { grassCap: 1 };
      const cache = createTerrainCache({ ctx, texNoise: { simplex2: () => 0 } });
      cache.ensureTerrainCache(world, config, 20);
      const original = cache.terrainCache.base;
      world.setTerrainAt(0, 0, 'forest');
      cache.ensureTerrainCache(world, config, 20);
      expect(cache.terrainCache.base).not.toBe(original);
      const grass = cache.terrainCache.grass;
      config.grassCap = 2;
      cache.ensureTerrainCache(world, config, 20);
      expect(cache.terrainCache.grass).not.toBe(grass);
    }));
});
