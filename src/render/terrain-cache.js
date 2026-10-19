import { normalize } from '../sim/noise.js';
export function createTerrainCache({ ctx, texNoise }) {
  let backgroundGradient = null;
  let backgroundGradientWidth = 0;
  let backgroundGradientHeight = 0;
  const terrainPalette = {
    plains: {
      colors: ['#6b8e4e', '#7a9f5a', '#5d7d42', '#8ab06a'],
      accent: '#4a6b35',
      shadow: '#3d5a2d'
    },
    forest: {
      colors: ['#3d5a3a', '#4a6845', '#2e4a2d', '#526b4f'],
      accent: '#2a4528',
      shadow: '#1e3520'
    },
    rock: {
      colors: ['#6b7075', '#7a8085', '#5c6065', '#858a8f'],
      accent: '#4a4f54',
      shadow: '#3a3f44'
    },
    sand: {
      colors: ['#d4b896', '#e0c8a8', '#c4a882', '#e8d4b8'],
      accent: '#b09870',
      shadow: '#9a8560'
    },
    shore: {
      colors: ['#a8c4a0', '#98b890', '#b8d4b0', '#88a880'],
      accent: '#78987a',
      shadow: '#68886a'
    },
    water: {
      colors: ['#3b6d8c', '#4580a0', '#2d5570', '#5090b0'],
      deep: '#1e3a4c',
      shallow: '#5898b8',
      highlight: '#78c0e8'
    },
    unknown: {
      colors: ['#4a4a4a', '#555555', '#3f3f3f'],
      accent: '#333333',
      shadow: '#2a2a2a'
    }
  };
  const defaultTileSize = 20;
  const resolveTileSize = (config) =>
    Number.isFinite(config?.tileSize) ? Math.max(1, config.tileSize) : defaultTileSize;
  const getTexture = (x, y, scale = 1) => {
    return normalize(texNoise.simplex2(x * scale, y * scale));
  };
  const getTerrainColor = (terrain, x, y, heightValue = 0, _moistureValue = 0.5) => {
    const palette = terrainPalette[terrain] ?? terrainPalette.unknown;

    if (terrain === 'water') {
      return getWaterColor(x, y, heightValue);
    }

    const colors = palette.colors;

    // Multi-octave noise for natural variation
    const n1 = getTexture(x * 0.15, y * 0.15);
    const n2 = getTexture(x * 0.4, y * 0.4) * 0.3;
    const combined = n1 + n2;

    // Select base color
    const colorIndex = Math.floor(combined * colors.length) % colors.length;
    const baseColor = colors[colorIndex];

    // Apply height-based shading
    const heightShade = heightValue * 0.15;

    return adjustBrightness(baseColor, heightShade);
  };
  const getWaterColor = (x, y, depth) => {
    const palette = terrainPalette.water;

    // Normalize depth (negative = deeper)
    const normalizedDepth = Math.max(0, Math.min(1, (depth + 0.5) * 2));

    // Base color from depth
    const deepColor = hexToRgb(palette.deep);
    const shallowColor = hexToRgb(palette.colors[0]);

    // Interpolate based on depth
    const r = Math.round(deepColor.r + (shallowColor.r - deepColor.r) * normalizedDepth);
    const g = Math.round(deepColor.g + (shallowColor.g - deepColor.g) * normalizedDepth);
    const b = Math.round(deepColor.b + (shallowColor.b - deepColor.b) * normalizedDepth);

    return `rgb(${r}, ${g}, ${b})`;
  };
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 };
  };
  const adjustBrightness = (hex, amount) => {
    const rgb = hexToRgb(hex);
    const factor = 1 + amount;
    const r = Math.max(0, Math.min(255, Math.round(rgb.r * factor)));
    const g = Math.max(0, Math.min(255, Math.round(rgb.g * factor)));
    const b = Math.max(0, Math.min(255, Math.round(rgb.b * factor)));
    return `rgb(${r}, ${g}, ${b})`;
  };
  const _blendColors = (color1, color2, factor) => {
    const rgb1 =
      typeof color1 === 'string' && color1.startsWith('#') ? hexToRgb(color1) : _parseRgb(color1);
    const rgb2 =
      typeof color2 === 'string' && color2.startsWith('#') ? hexToRgb(color2) : _parseRgb(color2);

    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);

    return `rgb(${r}, ${g}, ${b})`;
  };
  const _parseRgb = (str) => {
    const match = str.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    }
    return { r: 100, g: 100, b: 100 };
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
    const { cells: _cells } = world;
    const heightMap = world.heightMap;
    const moistureMap = world.moistureMap;

    for (let y = 0; y < world.height; y++) {
      const rowOffset = y * world.width;
      const tileY = y * tileSize;

      for (let x = 0; x < world.width; x++) {
        const idx = rowOffset + x;
        const terrain = _cells[idx];
        const tileX = x * tileSize;
        const h = heightMap ? heightMap[idx] : 0;
        const m = moistureMap ? moistureMap[idx] : 0.5;
        const baseColor = getTerrainColor(terrain, x, y, h, m);
        layerCtx.fillStyle = baseColor;
        layerCtx.fillRect(tileX, tileY, tileSize + 0.5, tileSize + 0.5);
      }
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
  const _buildGrassLayer = (layerCtx, world, config, tileSize) => {
    layerCtx.clearRect(0, 0, layerCtx.canvas.width, layerCtx.canvas.height);

    const grass = Array.isArray(world.grass) ? world.grass : null;
    if (!grass) return;
    const { cells: _cells } = world;
    const grassCap = Number.isFinite(config?.grassCap) ? config.grassCap : 1;

    for (let y = 0; y < world.height; y++) {
      const rowOffset = y * world.width;
      const tileY = y * tileSize;

      for (let x = 0; x < world.width; x++) {
        const idx = rowOffset + x;
        const terrain = _cells[idx];
        if (terrain === 'water') continue;

        const grassValue = Number.isFinite(grass[idx]) ? grass[idx] : 0;
        const grassRatio = grassCap > 0 ? Math.min(1, Math.max(0, grassValue / grassCap)) : 0;
        if (grassRatio <= 0) continue;

        const tileX = x * tileSize;
        const grassHue = 95 + getTexture(x * 0.3, y * 0.3) * 20;
        const grassSat = 45 + grassRatio * 25;
        const grassLight = 35 + grassRatio * 15;
        const grassAlpha = 0.25 + grassRatio * 0.35;

        layerCtx.fillStyle = `hsla(${grassHue}, ${grassSat}%, ${grassLight}%, ${grassAlpha})`;
        layerCtx.fillRect(tileX, tileY, tileSize, tileSize);

        if (grassRatio > 0.6) {
          const highlightAlpha = (grassRatio - 0.6) * 0.2;
          layerCtx.fillStyle = `rgba(140, 200, 100, ${highlightAlpha})`;
          layerCtx.fillRect(tileX, tileY, tileSize, tileSize);
        }
      }
    }
  };
  const drawGrassRow = (layerCtx, world, config, tileSize, y) => {
    const { cells: _cells } = world;
    const grass = Array.isArray(world.grass) ? world.grass : null;
    const grassCap = Number.isFinite(config?.grassCap) ? config.grassCap : 1;
    const rowOffset = y * world.width;
    const tileY = y * tileSize;

    layerCtx.clearRect(0, tileY, layerCtx.canvas.width, tileSize);

    if (!grass) return;

    for (let x = 0; x < world.width; x++) {
      const idx = rowOffset + x;
      const terrain = _cells[idx];
      if (terrain === 'water') continue;

      const grassValue = Number.isFinite(grass[idx]) ? grass[idx] : 0;
      const grassRatio = grassCap > 0 ? Math.min(1, Math.max(0, grassValue / grassCap)) : 0;
      if (grassRatio <= 0) continue;

      const tileX = x * tileSize;
      const grassHue = 95 + getTexture(x * 0.3, y * 0.3) * 20;
      const grassSat = 45 + grassRatio * 25;
      const grassLight = 35 + grassRatio * 15;
      const grassAlpha = 0.25 + grassRatio * 0.35;

      layerCtx.fillStyle = `hsla(${grassHue}, ${grassSat}%, ${grassLight}%, ${grassAlpha})`;
      layerCtx.fillRect(tileX, tileY, tileSize, tileSize);

      if (grassRatio > 0.6) {
        const highlightAlpha = (grassRatio - 0.6) * 0.2;
        layerCtx.fillStyle = `rgba(140, 200, 100, ${highlightAlpha})`;
        layerCtx.fillRect(tileX, tileY, tileSize, tileSize);
      }
    }
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
