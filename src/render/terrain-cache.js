import { habitatCssAt, habitatPalette } from '../sim/habitat-colours.js';
import { normalize } from '../sim/noise.js';
export function createTerrainCache({ ctx, texNoise }) {
  let backgroundGradient = null;
  let backgroundGradientWidth = 0;
  let backgroundGradientHeight = 0;
  const terrainPalette = { ...habitatPalette, unknown: habitatPalette.plains };
  const defaultTileSize = 20;
  const resolveTileSize = (config) =>
    Number.isFinite(config?.tileSize) ? Math.max(1, config.tileSize) : defaultTileSize;
  const getTexture = (x, y, scale = 1) => {
    return normalize(texNoise.simplex2(x * scale, y * scale));
  };
  const getBackgroundGradient = (width, height) => {
    if (
      backgroundGradient &&
      backgroundGradientWidth === width &&
      backgroundGradientHeight === height
    ) {
      return backgroundGradient;
    }

    backgroundGradientWidth = width;
    backgroundGradientHeight = height;
    backgroundGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.8
    );
    backgroundGradient.addColorStop(0, '#1a2530');
    backgroundGradient.addColorStop(0.7, '#0f1820');
    backgroundGradient.addColorStop(1, '#080c10');
    return backgroundGradient;
  };
  const createLayer = (width, height, { alpha = true } = {}) => {
    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = Math.max(1, Math.floor(width));
    layerCanvas.height = Math.max(1, Math.floor(height));
    const layerCtx = layerCanvas.getContext('2d', { alpha });
    layerCtx.imageSmoothingEnabled = false;
    return { canvas: layerCanvas, ctx: layerCtx };
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const terrainCache = {
    base: null,
    detail: null,
    grass: null,
    lastGrassUpdateMs: 0,
    lastGrassDirtyCounter: -1,
    grassRebuildActive: false,
    grassRebuildTargetDirtyCounter: 0,
    grassRebuildNextRow: 0,
    grassRebuildStartedMs: 0,
    grassRebuildLastSliceMs: 0,
    tileSize: 0,
    pxW: 0,
    pxH: 0,
    world: null
  };
  const EDGE_NEIGHBORS = [
    { dx: 1, dy: 0, edge: 'right' },
    { dx: 0, dy: 1, edge: 'bottom' },
    { dx: -1, dy: 0, edge: 'left' },
    { dx: 0, dy: -1, edge: 'top' }
  ];
  const buildBaseTerrainLayer = (layerCtx, world, tileSize) => {
    layerCtx.clearRect(0, 0, layerCtx.canvas.width, layerCtx.canvas.height);
    for (let y = 0; y < world.height; y++)
      for (let x = 0; x < world.width; x++) {
        layerCtx.fillStyle = habitatCssAt(world, y * world.width + x, {}, false);
        layerCtx.fillRect(x * tileSize, y * tileSize, tileSize + 0.5, tileSize + 0.5);
      }
  };
  const buildDetailTerrainLayer = (layerCtx, world, config, tileSize) => {
    layerCtx.clearRect(0, 0, layerCtx.canvas.width, layerCtx.canvas.height);

    const { cells: _cells } = world;
    const heightMap = world.heightMap;

    // PASS 1 overlays: land texture + water highlights (static)
    for (let y = 0; y < world.height; y++) {
      const rowOffset = y * world.width;
      const tileY = y * tileSize;

      for (let x = 0; x < world.width; x++) {
        const idx = rowOffset + x;
        const terrain = _cells[idx];
        const tileX = x * tileSize;

        if (terrain !== 'water') {
          const texVal = getTexture(x * 0.8, y * 0.8);
          if (texVal > 0.65) {
            layerCtx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            layerCtx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (texVal < 0.35) {
            layerCtx.fillStyle = 'rgba(0, 0, 0, 0.06)';
            layerCtx.fillRect(tileX, tileY, tileSize, tileSize);
          }
          continue;
        }

        const h = heightMap ? heightMap[idx] : 0;
        const wave1 = getTexture(x * 0.2, y * 0.3);
        const wave2 = getTexture(x * 0.4, y * 0.2);

        if (wave1 > 0.6 && wave2 > 0.5) {
          layerCtx.fillStyle = 'rgba(120, 180, 220, 0.12)';
          layerCtx.fillRect(tileX, tileY, tileSize, tileSize);
        }

        if (h > -0.2) {
          const caustic = getTexture(x * 0.6, y * 0.6);
          if (caustic > 0.75) {
            layerCtx.fillStyle = 'rgba(150, 200, 240, 0.1)';
            const size = tileSize * 0.4;
            layerCtx.beginPath();
            layerCtx.arc(
              tileX + tileSize * 0.3 + caustic * tileSize * 0.4,
              tileY + tileSize * 0.3 + wave1 * tileSize * 0.4,
              size,
              0,
              Math.PI * 2
            );
            layerCtx.fill();
          }
        }
      }
    }

    // PASS 2: Terrain edge blending
    layerCtx.globalAlpha = 0.4;

    for (let y = 0; y < world.height; y++) {
      const rowOffset = y * world.width;
      const tileY = y * tileSize;

      for (let x = 0; x < world.width; x++) {
        const terrain = _cells[rowOffset + x];
        if (terrain === 'water') continue;
        const tileX = x * tileSize;

        for (const { dx, dy, edge } of EDGE_NEIGHBORS) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= world.width || ny < 0 || ny >= world.height) continue;

          const neighborTerrain = _cells[ny * world.width + nx];
          if (neighborTerrain === terrain) continue;
          if (neighborTerrain === 'water' || terrain === 'shore') continue;

          const neighborPalette = terrainPalette[neighborTerrain] ?? terrainPalette.unknown;
          const transitionColor = neighborPalette.colors[0];

          const gradient = layerCtx.createLinearGradient(
            edge === 'left' ? tileX : edge === 'right' ? tileX + tileSize : tileX,
            edge === 'top' ? tileY : edge === 'bottom' ? tileY + tileSize : tileY,
            edge === 'left'
              ? tileX + tileSize * 0.3
              : edge === 'right'
                ? tileX + tileSize * 0.7
                : tileX,
            edge === 'top'
              ? tileY + tileSize * 0.3
              : edge === 'bottom'
                ? tileY + tileSize * 0.7
                : tileY
          );

          gradient.addColorStop(0, transitionColor);
          gradient.addColorStop(1, 'transparent');
          layerCtx.fillStyle = gradient;
          layerCtx.fillRect(tileX, tileY, tileSize, tileSize);
        }
      }
    }

    layerCtx.globalAlpha = 1;

    // PASS 3: Water edge foam (static)
    for (let y = 0; y < world.height; y++) {
      const rowOffset = y * world.width;
      const tileY = y * tileSize;

      for (let x = 0; x < world.width; x++) {
        const terrain = _cells[rowOffset + x];
        if (terrain !== 'water') continue;

        const tileX = x * tileSize;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= world.width || ny < 0 || ny >= world.height) continue;

            const neighborTerrain = _cells[ny * world.width + nx];
            if (neighborTerrain === 'water') continue;

            const edgeX = tileX + (dx > 0 ? tileSize : dx < 0 ? 0 : tileSize / 2);
            const edgeY = tileY + (dy > 0 ? tileSize : dy < 0 ? 0 : tileSize / 2);
            const foamPhase = getTexture(x * 0.5, y * 0.5);
            const foamAlpha = 0.15 + foamPhase * 0.15;

            layerCtx.fillStyle = `rgba(200, 230, 255, ${foamAlpha})`;
            layerCtx.beginPath();
            layerCtx.arc(edgeX, edgeY, tileSize * 0.2, 0, Math.PI * 2);
            layerCtx.fill();
          }
        }
      }
    }

    void config;
  };
  const drawGrassRow = (layerCtx, world, config, tileSize, y) => {
    const tileY = y * tileSize;
    layerCtx.clearRect(0, tileY, layerCtx.canvas.width, tileSize);
    for (let x = 0; x < world.width; x++) {
      const i = y * world.width + x;
      if (world.cells[i] === 'water') continue;
      layerCtx.fillStyle = habitatCssAt(world, i, config);
      layerCtx.fillRect(x * tileSize, tileY, tileSize + 0.5, tileSize + 0.5);
    }
  };
  const _buildGrassLayer = (layerCtx, world, config, tileSize) => {
    for (let y = 0; y < world.height; y++) drawGrassRow(layerCtx, world, config, tileSize, y);
  };
  const ensureTerrainCache = (world, config, tileSize, perf) => {
    if (!world) return;
    const pxW = Math.max(1, Math.floor(world.width * tileSize));
    const pxH = Math.max(1, Math.floor(world.height * tileSize));
    const needsRebuild =
      terrainCache.world !== world ||
      terrainCache.tileSize !== tileSize ||
      terrainCache.pxW !== pxW ||
      terrainCache.pxH !== pxH ||
      terrainCache.grassCap !== config?.grassCap ||
      terrainCache.terrainRevision !== world.terrainDirtyCounter;

    if (!needsRebuild) return;

    terrainCache.world = world;
    terrainCache.grassCap = config?.grassCap;
    terrainCache.terrainRevision = world.terrainDirtyCounter;
    terrainCache.tileSize = tileSize;
    terrainCache.pxW = pxW;
    terrainCache.pxH = pxH;

    terrainCache.base = createLayer(pxW, pxH, { alpha: false });
    const tBase = perf?.start('render.terrain.cacheBuild.base');
    buildBaseTerrainLayer(terrainCache.base.ctx, world, tileSize);
    perf?.end('render.terrain.cacheBuild.base', tBase);

    terrainCache.detail = createLayer(pxW, pxH, { alpha: true });
    const tDetail = perf?.start('render.terrain.cacheBuild.detail');
    buildDetailTerrainLayer(terrainCache.detail.ctx, world, config, tileSize);
    perf?.end('render.terrain.cacheBuild.detail', tDetail);

    terrainCache.grass = createLayer(pxW, pxH, { alpha: true });
    terrainCache.lastGrassUpdateMs = 0;
    _buildGrassLayer(terrainCache.grass.ctx, world, config, tileSize);
    terrainCache.lastGrassDirtyCounter = world.grassDirtyCounter ?? 0;
    terrainCache.grassRebuildActive = false;
    terrainCache.grassRebuildTargetDirtyCounter = 0;
    terrainCache.grassRebuildNextRow = 0;
    terrainCache.grassRebuildStartedMs = 0;
    terrainCache.grassRebuildLastSliceMs = 0;
  };
  const maybeUpdateGrassCache = (cache, world, config, tileSize, perf, nowMs, flush = false) => {
    if (!cache?.grass || !world) return;
    const intervalMs = 250;
    const dirtyCounter = Number.isFinite(world?.grassDirtyCounter) ? world.grassDirtyCounter : 0;
    if (!cache.grassRebuildActive) {
      if (dirtyCounter === cache.lastGrassDirtyCounter) return;
      if (!flush && cache.lastGrassUpdateMs && nowMs - cache.lastGrassUpdateMs < intervalMs) return;
      cache.grassRebuildActive = true;
      cache.grassRebuildTargetDirtyCounter = dirtyCounter;
      cache.grassRebuildNextRow = 0;
      cache.grassRebuildStartedMs = nowMs;
      cache.grassRebuildLastSliceMs = 0;
    }

    if (!cache.grassRebuildActive) return;

    const tGrass = perf?.start('render.terrain.cacheUpdate.grass');
    const sliceStart = performance.now();
    const sliceBudgetMs = 2;
    const targetRows = world.height;
    let y = cache.grassRebuildNextRow;

    for (; y < targetRows; y++) {
      drawGrassRow(cache.grass.ctx, world, config, tileSize, y);
      cache.grassRebuildNextRow = y + 1;
      if (!flush && performance.now() - sliceStart >= sliceBudgetMs) break;
    }

    cache.grassRebuildLastSliceMs = performance.now() - sliceStart;
    perf?.end('render.terrain.cacheUpdate.grass', tGrass);

    if (cache.grassRebuildNextRow >= targetRows) {
      cache.grassRebuildActive = false;
      cache.lastGrassDirtyCounter = cache.grassRebuildTargetDirtyCounter;
      cache.lastGrassUpdateMs = nowMs;
      perf?.end('render.terrain.cacheUpdate.grassRebuildTotal', cache.grassRebuildStartedMs);
    }
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
