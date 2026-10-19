import { createTerrainCache } from './terrain-cache.js';
import { createTerrainView } from './terrain-view.js';
import { SPECIES } from '../sim/species.js';
import { createNoise } from '../sim/noise.js';
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

  let viewportWidth = 0;
  let viewportHeight = 0;

  const resizeToContainer = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(width * ratio));
    canvas.height = Math.max(1, Math.floor(height * ratio));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    viewportWidth = width;
    viewportHeight = height;

    // Update camera viewport for bounds clamping
    if (camera?.setViewport) {
      camera.setViewport(width, height);
    }
  };

  // Use window resize event for full-screen canvas
  window.addEventListener('resize', resizeToContainer);
  resizeToContainer();

  /**
   * Get texture noise value at position
   */

  /**
   * Get terrain color with natural variation
   */

  /**
   * Get water color with depth and reflections
   */

  /**
   * Convert hex to RGB object
   */

  /**
   * Adjust color brightness
   */

  /**
   * Blend two colors (reserved for future terrain blending)
   */

  const getViewport = () => ({ width: viewportWidth, height: viewportHeight });
  const {
    resolveTileSize,
    getBackgroundGradient,
    ensureTerrainCache,
    maybeUpdateGrassCache,
    terrainCache,
    clamp,
    getTexture
  } = createTerrainCache({ ctx, texNoise });
  const drawTerrain = createTerrainView({
    resolveTileSize,
    ctx,
    getBackgroundGradient,
    ensureTerrainCache,
    maybeUpdateGrassCache,
    terrainCache,
    clamp,
    getTexture,
    getViewport
  });

  const drawCreatures = (state, world, creatures, config) => {
    if (!world || !Array.isArray(creatures) || creatures.length === 0) return;

    const tileSize = resolveTileSize(config);
    const width = viewportWidth;
    const height = viewportHeight;

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
      [SPECIES.SQUARE]: {
        main: '#f8e878',
        light: '#fff8a8',
        dark: '#d8c858',
        glow: 'rgba(248, 232, 120, 0.3)'
      },
      [SPECIES.CIRCLE]: {
        main: '#80d7ff',
        light: '#a8e8ff',
        dark: '#58b8e0',
        glow: 'rgba(128, 215, 255, 0.3)'
      },
      [SPECIES.TRIANGLE]: {
        main: '#ff8888',
        light: '#ffb0b0',
        dark: '#e06060',
        glow: 'rgba(255, 140, 140, 0.3)'
      },
      [SPECIES.OCTAGON]: {
        main: '#be96ff',
        light: '#d8b8ff',
        dark: '#9878e0',
        glow: 'rgba(190, 150, 255, 0.3)'
      }
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
      const gradient = ctx.createRadialGradient(
        x - radius * 0.3,
        y - radius * 0.3,
        0,
        x,
        y,
        radius
      );
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

  return {
    canvas,
    render(sim, { immediate = false } = {}) {
      const perf = getActivePerf();
      const tTotal = perf?.start('render.total');
      try {
        const state = camera?.getState?.() ?? { x: 0, y: 0, zoom: 1 };

        const tTerrain = perf?.start('render.terrain');
        drawTerrain(state, sim.state?.world, sim.config, immediate);
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
