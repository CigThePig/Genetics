import { SPECIES } from '../sim/species.js';
import { createNoise, normalize } from '../sim/noise.js';
import { getActivePerf } from '../metrics/perf-registry.js';

/**
 * Enhanced Renderer with Polished Terrain Visuals
 */

export function createRenderer(container, { camera }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'renderer-shell';

  const canvas = document.createElement('canvas');
  canvas.className = 'renderer-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Simulation canvas');

  const footer = document.createElement('p');
  footer.className = 'renderer-footer';

  wrapper.append(canvas, footer);
  // Insert at the beginning so it's behind all UI elements
  container.insertBefore(wrapper, container.firstChild);

  const ctx = canvas.getContext('2d', { alpha: false });

  // Noise generator for texture effects
  const texNoise = createNoise(42);

  const resizeToContainer = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(width * ratio));
    canvas.height = Math.max(1, Math.floor(height * ratio));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    
    // Update camera viewport for bounds clamping
    if (camera?.setViewport) {
      camera.setViewport(width, height);
    }
  };

  // Use window resize event for full-screen canvas
  window.addEventListener('resize', resizeToContainer);
  resizeToContainer();

  // ═══════════════════════════════════════════════════════════════════════════
  // ENHANCED COLOR PALETTE - Rich, natural colors with depth
  // ═══════════════════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════════════════
  // TEXTURE & PATTERN GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get texture noise value at position
   */
  const getTexture = (x, y, scale = 1) => {
    return normalize(texNoise.simplex2(x * scale, y * scale));
  };

  /**
   * Get terrain color with natural variation
   */
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

  /**
   * Get water color with depth and reflections
   */
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

  /**
   * Convert hex to RGB object
   */
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

  /**
   * Adjust color brightness
   */
  const adjustBrightness = (hex, amount) => {
    const rgb = hexToRgb(hex);
    const factor = 1 + amount;
    const r = Math.max(0, Math.min(255, Math.round(rgb.r * factor)));
    const g = Math.max(0, Math.min(255, Math.round(rgb.g * factor)));
    const b = Math.max(0, Math.min(255, Math.round(rgb.b * factor)));
    return `rgb(${r}, ${g}, ${b})`;
  };

  /**
   * Blend two colors (reserved for future terrain blending)
   */
  const _blendColors = (color1, color2, factor) => {
    const rgb1 = typeof color1 === 'string' && color1.startsWith('#') ? hexToRgb(color1) : _parseRgb(color1);
    const rgb2 = typeof color2 === 'string' && color2.startsWith('#') ? hexToRgb(color2) : _parseRgb(color2);

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

  // ═══════════════════════════════════════════════════════════════════════════
  // TERRAIN RENDERING
  // ═══════════════════════════════════════════════════════════════════════════

  const drawTerrain = (state, world, config) => {
    const tileSize = resolveTileSize(config);
    const { width, height } = canvas.getBoundingClientRect();
    const perf = getActivePerf();
    const tBg = perf?.start('render.terrain.bg');

    // Draw background with subtle vignette
    const bgGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.8
    );
    bgGradient.addColorStop(0, '#1a2530');
    bgGradient.addColorStop(0.7, '#0f1820');
    bgGradient.addColorStop(1, '#080c10');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2 + state.x, height / 2 + state.y);
    ctx.scale(state.zoom, state.zoom);

    if (!world) {
      ctx.restore();
      perf?.end('render.terrain.bg', tBg);
      return;
    }
    perf?.end('render.terrain.bg', tBg);

    const originX = -(world.width * tileSize) / 2;
    const originY = -(world.height * tileSize) / 2;

    // Calculate visible bounds with padding
    const padding = 2;
    const minWorldX = -(width / 2 + state.x) / state.zoom;
    const maxWorldX = (width / 2 - state.x) / state.zoom;
    const minWorldY = -(height / 2 + state.y) / state.zoom;
    const maxWorldY = (height / 2 - state.y) / state.zoom;

    const startCol = Math.max(0, Math.floor((minWorldX - originX) / tileSize) - padding);
    const endCol = Math.min(world.width, Math.ceil((maxWorldX - originX) / tileSize) + padding);
    const startRow = Math.max(0, Math.floor((minWorldY - originY) / tileSize) - padding);
    const endRow = Math.min(world.height, Math.ceil((maxWorldY - originY) / tileSize) + padding);

    const { cells } = world;
    const heightMap = world.heightMap;
    const moistureMap = world.moistureMap;
    const grass = Array.isArray(world.grass) ? world.grass : null;
    const grassStress = Array.isArray(world.grassStress) ? world.grassStress : null;
    const grassCap = Number.isFinite(config?.grassCap) ? config.grassCap : 1;
    const stressThreshold = Number.isFinite(config?.grassStressVisibleThreshold)
      ? config.grassStressVisibleThreshold
      : 0.25;

    // Detail level based on zoom
    const showDetail = state.zoom > 0.3;
    const showFineDetail = state.zoom > 0.6;
    // Reserved for future ultra-detailed rendering: const showUltraDetail = state.zoom > 1.0;

    // ─────────────────────────────────────────────────────────────────────────
    // PASS 1: Base terrain tiles
    // ─────────────────────────────────────────────────────────────────────────

    const tP1 = perf?.start('render.terrain.pass1');
    for (let y = startRow; y < endRow; y++) {
      const rowOffset = y * world.width;
      const tileY = originY + y * tileSize;

      for (let x = startCol; x < endCol; x++) {
        const idx = rowOffset + x;
        const terrain = cells[idx];
        const tileX = originX + x * tileSize;

        // Get height/moisture for shading
        const h = heightMap ? heightMap[idx] : 0;
        const m = moistureMap ? moistureMap[idx] : 0.5;

        // Get base terrain color
        const baseColor = getTerrainColor(terrain, x, y, h, m);
        ctx.fillStyle = baseColor;
        ctx.fillRect(tileX, tileY, tileSize + 0.5, tileSize + 0.5);

        // Add texture detail for land tiles
        if (showDetail && terrain !== 'water') {
          // Subtle texture overlay
          const texVal = getTexture(x * 0.8, y * 0.8);
          if (texVal > 0.65) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          } else if (texVal < 0.35) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          }
        }

        // Water effects
        if (terrain === 'water' && showDetail) {
          // Subtle wave pattern
          const wave1 = getTexture(x * 0.2 + Date.now() * 0.0001, y * 0.3);
          const wave2 = getTexture(x * 0.4, y * 0.2 + Date.now() * 0.00015);

          if (wave1 > 0.6 && wave2 > 0.5) {
            ctx.fillStyle = 'rgba(120, 180, 220, 0.12)';
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          }

          // Caustic-like highlights for shallow water
          if (h > -0.2 && showFineDetail) {
            const caustic = getTexture(x * 0.6 + Date.now() * 0.00005, y * 0.6);
            if (caustic > 0.75) {
              ctx.fillStyle = 'rgba(150, 200, 240, 0.1)';
              const size = tileSize * 0.4;
              ctx.beginPath();
              ctx.arc(
                tileX + tileSize * 0.3 + caustic * tileSize * 0.4,
                tileY + tileSize * 0.3 + wave1 * tileSize * 0.4,
                size,
                0,
                Math.PI * 2
              );
              ctx.fill();
            }
          }
        }
      }
    }
    perf?.end('render.terrain.pass1', tP1);

    // ─────────────────────────────────────────────────────────────────────────
    // PASS 2: Terrain edge blending
    // ─────────────────────────────────────────────────────────────────────────

    if (showDetail) {
      const tP2 = perf?.start('render.terrain.pass2');
      ctx.globalAlpha = 0.4;

      for (let y = startRow; y < endRow; y++) {
        const rowOffset = y * world.width;
        const tileY = originY + y * tileSize;

        for (let x = startCol; x < endCol; x++) {
          const terrain = cells[rowOffset + x];
          const tileX = originX + x * tileSize;

          // Skip water (handled separately)
          if (terrain === 'water') continue;

          // Check adjacent tiles for transitions
          const neighbors = [
            { dx: 1, dy: 0, edge: 'right' },
            { dx: 0, dy: 1, edge: 'bottom' },
            { dx: -1, dy: 0, edge: 'left' },
            { dx: 0, dy: -1, edge: 'top' }
          ];

          for (const { dx, dy, edge } of neighbors) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= world.width || ny < 0 || ny >= world.height) continue;

            const neighborTerrain = cells[ny * world.width + nx];
            if (neighborTerrain === terrain) continue;
            if (neighborTerrain === 'water' || terrain === 'shore') continue;

            // Draw soft edge transition
            const neighborPalette = terrainPalette[neighborTerrain] ?? terrainPalette.unknown;
            const transitionColor = neighborPalette.colors[0];

            const gradient = ctx.createLinearGradient(
              edge === 'left' ? tileX : edge === 'right' ? tileX + tileSize : tileX,
              edge === 'top' ? tileY : edge === 'bottom' ? tileY + tileSize : tileY,
              edge === 'left' ? tileX + tileSize * 0.3 : edge === 'right' ? tileX + tileSize * 0.7 : tileX,
              edge === 'top' ? tileY + tileSize * 0.3 : edge === 'bottom' ? tileY + tileSize * 0.7 : tileY
            );

            gradient.addColorStop(0, transitionColor);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          }
        }
      }

      ctx.globalAlpha = 1;
      perf?.end('render.terrain.pass2', tP2);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASS 3: Water edge effects
    // ─────────────────────────────────────────────────────────────────────────

    if (showDetail) {
      const tP3 = perf?.start('render.terrain.pass3');
      for (let y = startRow; y < endRow; y++) {
        const rowOffset = y * world.width;
        const tileY = originY + y * tileSize;

        for (let x = startCol; x < endCol; x++) {
          const terrain = cells[rowOffset + x];
          if (terrain !== 'water') continue;

          const tileX = originX + x * tileSize;

          // Check for shore adjacency
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || nx >= world.width || ny < 0 || ny >= world.height) continue;

              const neighborTerrain = cells[ny * world.width + nx];
              if (neighborTerrain === 'water') continue;

              // Draw foam/wave edge
              const edgeX = tileX + (dx > 0 ? tileSize : dx < 0 ? 0 : tileSize / 2);
              const edgeY = tileY + (dy > 0 ? tileSize : dy < 0 ? 0 : tileSize / 2);

              // Animated foam
              const foamPhase = getTexture(x * 0.5 + Date.now() * 0.0002, y * 0.5);
              const foamAlpha = 0.15 + foamPhase * 0.15;

              ctx.fillStyle = `rgba(200, 230, 255, ${foamAlpha})`;
              ctx.beginPath();
              ctx.arc(edgeX, edgeY, tileSize * 0.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
      perf?.end('render.terrain.pass3', tP3);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASS 4: Grass overlay
    // ─────────────────────────────────────────────────────────────────────────

    if (grass) {
      const tP4 = perf?.start('render.terrain.pass4');
      for (let y = startRow; y < endRow; y++) {
        const rowOffset = y * world.width;
        const tileY = originY + y * tileSize;

        for (let x = startCol; x < endCol; x++) {
          const idx = rowOffset + x;
          const terrain = cells[idx];
          if (terrain === 'water') continue;

          const grassValue = Number.isFinite(grass[idx]) ? grass[idx] : 0;
          const grassRatio = grassCap > 0 ? Math.min(1, Math.max(0, grassValue / grassCap)) : 0;

          if (grassRatio > 0) {
            const tileX = originX + x * tileSize;

            // Rich grass color with variation
            const grassHue = 95 + getTexture(x * 0.3, y * 0.3) * 20;
            const grassSat = 45 + grassRatio * 25;
            const grassLight = 35 + grassRatio * 15;
            const grassAlpha = 0.25 + grassRatio * 0.35;

            ctx.fillStyle = `hsla(${grassHue}, ${grassSat}%, ${grassLight}%, ${grassAlpha})`;
            ctx.fillRect(tileX, tileY, tileSize, tileSize);

            // Lush grass highlights
            if (grassRatio > 0.6 && showFineDetail) {
              const highlightAlpha = (grassRatio - 0.6) * 0.3;
              ctx.fillStyle = `rgba(140, 200, 100, ${highlightAlpha})`;
              ctx.fillRect(tileX, tileY, tileSize, tileSize);
            }
          }
        }
      }
      perf?.end('render.terrain.pass4', tP4);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASS 5: Stress overlay
    // ─────────────────────────────────────────────────────────────────────────

    if (grassStress) {
      const tP5 = perf?.start('render.terrain.pass5');
      for (let y = startRow; y < endRow; y++) {
        const rowOffset = y * world.width;
        const tileY = originY + y * tileSize;

        for (let x = startCol; x < endCol; x++) {
          const idx = rowOffset + x;
          const stressValue = Number.isFinite(grassStress[idx]) ? grassStress[idx] : 0;

          if (stressValue >= stressThreshold) {
            const tileX = originX + x * tileSize;

            // Muted brown-orange for stressed areas
            const stressAlpha = Math.min(0.35, 0.08 + stressValue * 0.25);
            ctx.fillStyle = `rgba(140, 90, 50, ${stressAlpha})`;
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          }
        }
      }
      perf?.end('render.terrain.pass5', tP5);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASS 6: Bushes
    // ─────────────────────────────────────────────────────────────────────────

    if (Array.isArray(world.bushes) && world.bushes.length > 0) {
      const tP6 = perf?.start('render.terrain.pass6');
      const bushRadiusBase = tileSize * 0.35;
      const bushRadiusGrowth = tileSize * 0.2;
      const berryRadiusBase = tileSize * 0.1;
      const berryRadiusGrowth = tileSize * 0.08;
      const maxBerryFallback = Number.isFinite(config?.bushBerryMax) ? config.bushBerryMax : 1;

      for (const bush of world.bushes) {
        const bushX = Number.isFinite(bush.x) ? bush.x : null;
        const bushY = Number.isFinite(bush.y) ? bush.y : null;
        if (bushX === null || bushY === null) continue;
        if (bushX < startCol - 1 || bushX >= endCol + 1 || bushY < startRow - 1 || bushY >= endRow + 1) continue;

        const health = Number.isFinite(bush.health) ? bush.health : 0;
        const berries = Number.isFinite(bush.berries) ? bush.berries : 0;
        const berryMax = Number.isFinite(bush.berryMax) ? bush.berryMax : maxBerryFallback;
        const berryRatio = berryMax > 0 ? Math.min(1, Math.max(0, berries / berryMax)) : 0;

        const centerX = originX + (bushX + 0.5) * tileSize;
        const centerY = originY + (bushY + 0.5) * tileSize;
        const bushRadius = bushRadiusBase + bushRadiusGrowth * health;

        // Shadow
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.ellipse(centerX + 2, centerY + 3, bushRadius * 0.85, bushRadius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main bush with gradient
        const bushGradient = ctx.createRadialGradient(
          centerX - bushRadius * 0.3,
          centerY - bushRadius * 0.3,
          0,
          centerX,
          centerY,
          bushRadius
        );

        const lightness = 28 + health * 18;
        const saturation = 35 + health * 15;
        bushGradient.addColorStop(0, `hsl(115, ${saturation}%, ${lightness + 12}%)`);
        bushGradient.addColorStop(0.5, `hsl(110, ${saturation - 5}%, ${lightness}%)`);
        bushGradient.addColorStop(1, `hsl(105, ${saturation - 10}%, ${lightness - 8}%)`);

        ctx.beginPath();
        ctx.fillStyle = bushGradient;
        ctx.arc(centerX, centerY, bushRadius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle leaf texture
        if (showFineDetail) {
          for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + getTexture(bushX + i, bushY) * 0.5;
            const dist = bushRadius * (0.4 + getTexture(bushX, bushY + i) * 0.3);
            const lx = centerX + Math.cos(angle) * dist;
            const ly = centerY + Math.sin(angle) * dist;

            ctx.beginPath();
            ctx.fillStyle = `rgba(80, 140, 60, ${0.2 + health * 0.2})`;
            ctx.arc(lx, ly, bushRadius * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      perf?.end('render.terrain.pass6', tP6);
    }

        // Soft outline
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(30, 50, 30, 0.35)';
        ctx.lineWidth = 1.5 / state.zoom;
        ctx.arc(centerX, centerY, bushRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Berries
        if (berryRatio > 0) {
          const berryRadius = berryRadiusBase + berryRadiusGrowth * berryRatio;
          const berryOffsets = [
            { x: 0.35, y: -0.2 },
            { x: -0.25, y: 0.3 },
            { x: 0.3, y: 0.25 },
            { x: -0.35, y: -0.15 },
            { x: 0.05, y: -0.35 }
          ];

          const numBerries = Math.ceil(berryRatio * berryOffsets.length);
          for (let i = 0; i < numBerries; i++) {
            const offset = berryOffsets[i];
            const bx = centerX + bushRadius * offset.x;
            const by = centerY + bushRadius * offset.y;

            // Berry glow
            ctx.beginPath();
            ctx.fillStyle = `rgba(220, 80, 120, ${0.15 * berryRatio})`;
            ctx.arc(bx, by, berryRadius * 2, 0, Math.PI * 2);
            ctx.fill();

            // Berry body
            const berryGradient = ctx.createRadialGradient(
              bx - berryRadius * 0.3,
              by - berryRadius * 0.3,
              0,
              bx,
              by,
              berryRadius
            );
            berryGradient.addColorStop(0, `hsl(340, 65%, ${55 + berryRatio * 15}%)`);
            berryGradient.addColorStop(1, `hsl(335, 55%, ${40 + berryRatio * 10}%)`);

            ctx.beginPath();
            ctx.fillStyle = berryGradient;
            ctx.arc(bx, by, berryRadius, 0, Math.PI * 2);
            ctx.fill();

            // Highlight
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.arc(bx - berryRadius * 0.3, by - berryRadius * 0.3, berryRadius * 0.25, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }


    // ─────────────────────────────────────────────────────────────────────────
    // PASS 6B: Carcasses (meat remains)
    // ─────────────────────────────────────────────────────────────────────────

    if (Array.isArray(world.carcasses) && world.carcasses.length > 0) {
      const tP6b = perf?.start('render.terrain.pass6b');
      const maxMeatPerCell = Number.isFinite(config?.carcassMaxMeatPerCell) ? config.carcassMaxMeatPerCell : 2;
      const baseRadius = tileSize * 0.18;
      const extraRadius = tileSize * 0.14;

      const hashId = (value) => {
        const str = String(value ?? '');
        let h = 0;
        for (let i = 0; i < str.length; i += 1) {
          h = (h * 31 + str.charCodeAt(i)) | 0;
        }
        return Math.abs(h);
      };

      for (const carcass of world.carcasses) {
        const x = Number.isFinite(carcass?.x) ? carcass.x : null;
        const y = Number.isFinite(carcass?.y) ? carcass.y : null;
        if (x === null || y === null) continue;
        if (x < startCol - 1 || x >= endCol + 1 || y < startRow - 1 || y >= endRow + 1) continue;

        const meat = Number.isFinite(carcass?.meat) ? Math.max(0, carcass.meat) : 0;
        const ratio = maxMeatPerCell > 0 ? Math.min(1, meat / maxMeatPerCell) : 0;

        const centerX = originX + (x + 0.5) * tileSize;
        const centerY = originY + (y + 0.5) * tileSize;

        const radius = baseRadius + extraRadius * ratio;
        const seed = hashId(carcass.id) + (x * 131 + y * 137);

        // Dark, irregular "splatter" that reads as non-living at a glance
        ctx.save();
        ctx.translate(centerX, centerY);

        const points = 7;
        const angleOffset = ((seed % 360) * Math.PI) / 180;

        ctx.beginPath();
        for (let i = 0; i <= points; i += 1) {
          const t = (i / points) * Math.PI * 2 + angleOffset;
          const wobbleBits = (seed >> (i * 3)) & 7;
          const wobble = 0.75 + (wobbleBits / 7) * 0.45;
          const px = Math.cos(t) * radius * wobble;
          const py = Math.sin(t) * radius * wobble;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        const bodyAlpha = 0.35 + ratio * 0.45;
        ctx.fillStyle = `rgba(70, 35, 25, ${bodyAlpha})`;
        ctx.fill();

        ctx.lineWidth = Math.max(0.8, 1.2 / state.zoom);
        ctx.strokeStyle = `rgba(20, 10, 8, ${0.35 + ratio * 0.35})`;
        ctx.stroke();

        // Bone-ish mark (tiny "X") so it doesn't read as a creature
        const boneAlpha = 0.25 + ratio * 0.55;
        ctx.strokeStyle = `rgba(225, 225, 210, ${boneAlpha})`;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-radius * 0.55, -radius * 0.25);
        ctx.lineTo(radius * 0.55, radius * 0.25);
        ctx.moveTo(-radius * 0.45, radius * 0.35);
        ctx.lineTo(radius * 0.45, -radius * 0.35);
        ctx.stroke();

        ctx.restore();
      }
      perf?.end('render.terrain.pass6b', tP6b);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASS 7: Map border with glow
    // ─────────────────────────────────────────────────────────────────────────

    const tP7 = perf?.start('render.terrain.pass7');
    // Outer glow
    ctx.shadowColor = 'rgba(100, 180, 140, 0.4)';
    ctx.shadowBlur = 15 / state.zoom;
    ctx.strokeStyle = 'rgba(100, 180, 140, 0.5)';
    ctx.lineWidth = 3 / state.zoom;
    ctx.strokeRect(originX, originY, world.width * tileSize, world.height * tileSize);

    // Inner border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(60, 120, 90, 0.8)';
    ctx.lineWidth = 1.5 / state.zoom;
    ctx.strokeRect(originX, originY, world.width * tileSize, world.height * tileSize);
    perf?.end('render.terrain.pass7', tP7);

    const tRestore = perf?.start('render.terrain.restore');
    ctx.restore();
    perf?.end('render.terrain.restore', tRestore);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATURE RENDERING
  // ═══════════════════════════════════════════════════════════════════════════

  const drawCreatures = (state, world, creatures, config) => {
    if (!world || !Array.isArray(creatures) || creatures.length === 0) return;

    const tileSize = resolveTileSize(config);
    const { width, height } = canvas.getBoundingClientRect();

    ctx.save();
    ctx.translate(width / 2 + state.x, height / 2 + state.y);
    ctx.scale(state.zoom, state.zoom);

    const originX = -(world.width * tileSize) / 2;
    const originY = -(world.height * tileSize) / 2;

    const baseRadius = tileSize * 0.45;
    const minRadius = 4 / state.zoom;
    const markerRadius = Math.max(baseRadius, minRadius);

    const minWorldX = -(width / 2 + state.x) / state.zoom - markerRadius;
    const maxWorldX = (width / 2 - state.x) / state.zoom + markerRadius;
    const minWorldY = -(height / 2 + state.y) / state.zoom - markerRadius;
    const maxWorldY = (height / 2 - state.y) / state.zoom + markerRadius;

    const minTileX = (minWorldX - originX) / tileSize;
    const maxTileX = (maxWorldX - originX) / tileSize;
    const minTileY = (minWorldY - originY) / tileSize;
    const maxTileY = (maxWorldY - originY) / tileSize;

    // Enhanced creature colors with gradients
    const speciesColors = {
      [SPECIES.SQUARE]: { main: '#f8e878', light: '#fff8a8', dark: '#d8c858', glow: 'rgba(248, 232, 120, 0.3)' },
      [SPECIES.CIRCLE]: { main: '#80d7ff', light: '#a8e8ff', dark: '#58b8e0', glow: 'rgba(128, 215, 255, 0.3)' },
      [SPECIES.TRIANGLE]: { main: '#ff8888', light: '#ffb0b0', dark: '#e06060', glow: 'rgba(255, 140, 140, 0.3)' },
      [SPECIES.OCTAGON]: { main: '#be96ff', light: '#d8b8ff', dark: '#9878e0', glow: 'rgba(190, 150, 255, 0.3)' }
    };

    const defaultColors = speciesColors[SPECIES.SQUARE];

    const drawCreatureShape = (species, x, y, radius, colors) => {
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();

      switch (species) {
        case SPECIES.SQUARE: {
          const size = radius * 1.5;
          ctx.ellipse(x + 1, y + 2, size * 0.45, size * 0.25, 0, 0, Math.PI * 2);
          break;
        }
        case SPECIES.TRIANGLE: {
          ctx.ellipse(x + 1, y + 3, radius * 0.7, radius * 0.3, 0, 0, Math.PI * 2);
          break;
        }
        default:
          ctx.ellipse(x + 1, y + 2, radius * 0.7, radius * 0.35, 0, 0, Math.PI * 2);
      }
      ctx.fill();

      // Glow
      ctx.fillStyle = colors.glow;
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Main shape with gradient
      const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
      gradient.addColorStop(0, colors.light);
      gradient.addColorStop(0.6, colors.main);
      gradient.addColorStop(1, colors.dark);

      ctx.fillStyle = gradient;
      ctx.beginPath();

      switch (species) {
        case SPECIES.SQUARE: {
          const size = radius * 1.5;
          const half = size / 2;
          const corner = size * 0.15;
          ctx.moveTo(x - half + corner, y - half);
          ctx.lineTo(x + half - corner, y - half);
          ctx.quadraticCurveTo(x + half, y - half, x + half, y - half + corner);
          ctx.lineTo(x + half, y + half - corner);
          ctx.quadraticCurveTo(x + half, y + half, x + half - corner, y + half);
          ctx.lineTo(x - half + corner, y + half);
          ctx.quadraticCurveTo(x - half, y + half, x - half, y + half - corner);
          ctx.lineTo(x - half, y - half + corner);
          ctx.quadraticCurveTo(x - half, y - half, x - half + corner, y - half);
          break;
        }
        case SPECIES.TRIANGLE: {
          const h = radius * 1.6;
          ctx.moveTo(x, y - h * 0.55);
          ctx.lineTo(x + radius * 0.9, y + h * 0.45);
          ctx.lineTo(x - radius * 0.9, y + h * 0.45);
          ctx.closePath();
          break;
        }
        case SPECIES.OCTAGON: {
          const sides = 8;
          const inset = radius * 0.85;
          for (let i = 0; i < sides; i++) {
            const angle = Math.PI / 8 + (i * Math.PI * 2) / sides;
            const px = x + Math.cos(angle) * inset;
            const py = y + Math.sin(angle) * inset;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          break;
        }
        default:
          ctx.arc(x, y, radius, 0, Math.PI * 2);
      }

      ctx.fill();

      // Outline
      ctx.strokeStyle = 'rgba(40, 40, 40, 0.4)';
      ctx.lineWidth = 1 / state.zoom;
      ctx.stroke();

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
    };

    for (const creature of creatures) {
      const position = creature?.position;
      const x = Number.isFinite(position?.x) ? position.x : null;
      const y = Number.isFinite(position?.y) ? position.y : null;
      if (x === null || y === null) continue;
      if (x < minTileX || x > maxTileX || y < minTileY || y > maxTileY) continue;

      const centerX = originX + x * tileSize;
      const centerY = originY + y * tileSize;
      const colors = speciesColors[creature.species] ?? defaultColors;

      drawCreatureShape(creature.species, centerX, centerY, markerRadius, colors);
    }

    ctx.restore();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER FUNCTION
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    canvas,
    render(sim) {
      const perf = getActivePerf();
      const tTotal = perf?.start('render.total');
      try {
        const state = camera?.getState?.() ?? { x: 0, y: 0, zoom: 1 };

        const tTerrain = perf?.start('render.terrain');
        drawTerrain(state, sim.state?.world, sim.config);
        perf?.end('render.terrain', tTerrain);

        const tCreatures = perf?.start('render.creatures');
        drawCreatures(state, sim.state?.world, sim.state?.creatures, sim.config);
        perf?.end('render.creatures', tCreatures);

        const roll = Number.isFinite(sim.state?.lastRoll) ? sim.state.lastRoll.toFixed(4) : '--';
        const grassAverage = Number.isFinite(sim.state?.metrics?.grassAverage)
          ? sim.state.metrics.grassAverage.toFixed(2)
          : '--';
        footer.textContent = `Seed: ${sim.config.seed} · Last roll: ${roll} · Avg grass: ${grassAverage}`;
      } finally {
        perf?.end('render.total', tTotal);
      }
    }
  };
}
