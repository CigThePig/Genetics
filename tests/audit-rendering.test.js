import { describe, it, expect, vi } from 'vitest';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { habitatRgbAt } from '../src/sim/habitat-colours.js';
import { createTerrainCache } from '../src/render/terrain-cache.js';

const withCanvas = (check) => {
  const context = new Proxy(
    {
      createLinearGradient: () => ({ addColorStop() {} }),
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) })
    },
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
  it('uses eight bytes per tile including the CPU buffer and shares exact habitat colours', () =>
    withCanvas((ctx) => {
      const world = createWorldGrid({ width: 240, height: 320, defaultGrass: 0.5 });
      const cache = createTerrainCache({ ctx, texNoise: { simplex2: () => 0 } });
      cache.ensureTerrainCache(world, { grassCap: 1 }, 20);
      expect(cache.terrainCache.base.canvas.width).toBe(240);
      expect(cache.terrainCache.base.canvas.height).toBe(320);
      expect(cache.terrainCache.pixelBytes).toBe(240 * 320 * 8);
      const expected = habitatRgbAt(world, 0, { grassCap: 1 }).map((v) => Math.round(v * 255));
      expect([...cache.terrainCache.image.data.slice(0, 3)]).toEqual(expected);
      const original = cache.terrainCache.base;
      cache.ensureTerrainCache(world, { grassCap: 1 }, 40);
      expect(cache.terrainCache.base).toBe(original);
      expect(cache.terrainCache.pxW).toBe(240 * 40);
    }));
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
  it('invalidates shared vegetation colour when only stress changes', () => {
    const world = createWorldGrid({ width: 1, height: 1, defaultGrass: 1 });
    const before = world.grassDirtyCounter;
    world.setGrassStressAt(0, 0, 0.5);
    expect(world.grassDirtyCounter).toBe(before + 1);
    world.setGrassStressAt(0, 0, 0.5);
    expect(world.grassDirtyCounter).toBe(before + 1);
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
      expect(cache.terrainCache.updating).toBe(false);
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
      expect(cache.terrainCache.updating).toBe(false);
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
      const grass = cache.terrainCache.base;
      config.grassCap = 2;
      cache.ensureTerrainCache(world, config, 20);
      expect(cache.terrainCache.base).not.toBe(grass);
    }));
  it('slices dirty grass work, throttles rebuilds, and retains edits made during a rebuild', () =>
    withCanvas(() => {
      const world = createWorldGrid({ width: 4, height: 6, defaultGrass: 0.5 });
      const config = { grassCap: 1 };
      const cache = createTerrainCache({ ctx: {}, texNoise: { simplex2: () => 0 } });
      cache.ensureTerrainCache(world, config, 20);
      world.setGrassAt(0, 0, 0.8);
      let now = 0;
      const spy = vi.spyOn(performance, 'now').mockImplementation(() => (now += 3));
      try {
        cache.maybeUpdateGrassCache(cache.terrainCache, world, config, 20, null, 1000);
        expect(cache.terrainCache.updating).toBe(true);
        expect(cache.terrainCache.nextRow).toBe(1);
        const target = cache.terrainCache.targetDirty;
        world.setGrassAt(1, 0, 0.9);
        for (let i = 0; i < 5; i++) {
          cache.maybeUpdateGrassCache(cache.terrainCache, world, config, 20, null, 1010 + i);
        }
        expect(cache.terrainCache.updating).toBe(false);
        expect(cache.terrainCache.lastGrassDirtyCounter).toBe(target);
        cache.maybeUpdateGrassCache(cache.terrainCache, world, config, 20, null, 1100);
        expect(cache.terrainCache.updating).toBe(false);
        cache.maybeUpdateGrassCache(cache.terrainCache, world, config, 20, null, 1300, true);
        expect(cache.terrainCache.lastGrassDirtyCounter).toBe(world.grassDirtyCounter);
      } finally {
        spy.mockRestore();
      }
    }));
});
