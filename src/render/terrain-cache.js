import { habitatRgbAt } from '../sim/habitat-colours.js';
import { normalize } from '../sim/noise.js';

// One pixel per simulation cell. All zoom levels share a bounded, opaque raster;
// no world-sized layers at display tile resolution, texture uploads or eviction.
export function createTerrainCache({ ctx, texNoise }) {
  let background = null,
    backgroundWidth = 0,
    backgroundHeight = 0;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const resolveTileSize = (config) =>
    Number.isFinite(config?.tileSize) ? Math.max(1, config.tileSize) : 20;
  const getTexture = (x, y, scale = 1) => normalize(texNoise.simplex2(x * scale, y * scale));
  const getBackgroundGradient = (width, height) => {
    if (background && width === backgroundWidth && height === backgroundHeight) return background;
    backgroundWidth = width;
    backgroundHeight = height;
    background = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.8
    );
    background.addColorStop(0, '#1a2530');
    background.addColorStop(1, '#080c10');
    return background;
  };
  const terrainCache = {
    base: null,
    world: null,
    terrainRevision: -1,
    lastGrassDirtyCounter: -1,
    nextRow: 0,
    updating: false,
    lastGrassUpdateMs: 0,
    pixelBytes: 0
  };
  const drawRow = (cache, world, config, y) => {
    const { data } = cache.image;
    for (let x = 0; x < world.width; x++) {
      const i = y * world.width + x,
        rgb = habitatRgbAt(world, i, config);
      data[i * 4] = Math.round(rgb[0] * 255);
      data[i * 4 + 1] = Math.round(rgb[1] * 255);
      data[i * 4 + 2] = Math.round(rgb[2] * 255);
      data[i * 4 + 3] = 255;
    }
  };
  const ensureTerrainCache = (world, config, tileSize, perf) => {
    if (!world) return;
    terrainCache.pxW = world.width * tileSize;
    terrainCache.pxH = world.height * tileSize;
    if (
      terrainCache.world === world &&
      terrainCache.terrainRevision === world.terrainDirtyCounter &&
      terrainCache.grassCap === config?.grassCap
    )
      return;
    const t = perf?.start('render.terrain.cacheBuild.base');
    if (terrainCache.base) {
      terrainCache.base.canvas.width = 1;
      terrainCache.base.canvas.height = 1;
    }
    const canvas = document.createElement('canvas');
    canvas.width = world.width;
    canvas.height = world.height;
    const layer = canvas.getContext('2d', { alpha: false });
    Object.assign(terrainCache, {
      world,
      terrainRevision: world.terrainDirtyCounter,
      grassCap: config?.grassCap,
      base: { canvas, ctx: layer },
      image: layer.createImageData(world.width, world.height),
      pixelBytes: world.width * world.height * 8
    });
    for (let y = 0; y < world.height; y++) drawRow(terrainCache, world, config, y);
    layer.putImageData(terrainCache.image, 0, 0);
    terrainCache.lastGrassDirtyCounter = world.grassDirtyCounter ?? 0;
    terrainCache.updating = false;
    terrainCache.nextRow = 0;
    terrainCache.lastGrassUpdateMs = 0;
    perf?.end('render.terrain.cacheBuild.base', t);
  };
  const maybeUpdateGrassCache = (cache, world, config, tileSize, perf, nowMs, flush = false) => {
    if (!cache?.base || !world) return;
    const dirty = world.grassDirtyCounter ?? 0;
    // A paused full flush must repaint rows completed before the latest edit.
    if (flush && cache.updating) {
      cache.nextRow = 0;
      cache.targetDirty = dirty;
    }
    if (!cache.updating) {
      if (
        dirty === cache.lastGrassDirtyCounter ||
        (!flush && nowMs - cache.lastGrassUpdateMs < 250)
      )
        return;
      cache.updating = true;
      cache.nextRow = 0;
      cache.targetDirty = dirty;
    }
    const t = perf?.start('render.terrain.cacheUpdate.grass'),
      begin = performance.now(),
      startRow = cache.nextRow;
    do {
      drawRow(cache, world, config, cache.nextRow++);
    } while (cache.nextRow < world.height && (flush || performance.now() - begin < 2));
    cache.base.ctx.putImageData(
      cache.image,
      0,
      0,
      0,
      startRow,
      world.width,
      cache.nextRow - startRow
    );
    if (cache.nextRow >= world.height) {
      cache.updating = false;
      cache.lastGrassDirtyCounter = cache.targetDirty;
      cache.lastGrassUpdateMs = nowMs;
    }
    perf?.end('render.terrain.cacheUpdate.grass', t);
  };
  return {
    resolveTileSize,
    getBackgroundGradient,
    ensureTerrainCache,
    maybeUpdateGrassCache,
    terrainCache,
    clamp,
    getTexture
  };
}
