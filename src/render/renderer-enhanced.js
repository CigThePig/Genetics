import { createTerrainCache } from './terrain-cache.js';
import { createTerrainView } from './terrain-view.js';
import { createCreatureView } from './creatures/view.js';
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

  const creatureView = createCreatureView({
    maxResolution: () => (Math.min(viewportWidth, viewportHeight) < 600 ? 48 : 80)
  });

  const drawCreatures = (state, world, creatures, config, seconds) => {
    if (!world || !Array.isArray(creatures) || creatures.length === 0) {
      creatureView.begin(world, 0);
      return;
    }

    const tileSize = resolveTileSize(config);
    const width = viewportWidth;
    const height = viewportHeight;

    ctx.save();
    ctx.translate(width / 2 + state.x, height / 2 + state.y);
    ctx.scale(state.zoom, state.zoom);

    const originX = -(world.width * tileSize) / 2;
    const originY = -(world.height * tileSize) / 2;

    const baseRadius = tileSize * 2.5;
    const minRadius = 24 / state.zoom;
    const markerRadius = Math.max(baseRadius, minRadius);

    const minWorldX = -(width / 2 + state.x) / state.zoom - markerRadius;
    const maxWorldX = (width / 2 - state.x) / state.zoom + markerRadius;
    const minWorldY = -(height / 2 + state.y) / state.zoom - markerRadius;
    const maxWorldY = (height / 2 - state.y) / state.zoom + markerRadius;

    const minTileX = (minWorldX - originX) / tileSize;
    const maxTileX = (maxWorldX - originX) / tileSize;
    const minTileY = (minWorldY - originY) / tileSize;
    const maxTileY = (maxWorldY - originY) / tileSize;

    let visibleCount = 0;
    for (const creature of creatures) {
      const p = creature?.position;
      if (
        Number.isFinite(p?.x) &&
        Number.isFinite(p?.y) &&
        p.x >= minTileX &&
        p.x <= maxTileX &&
        p.y >= minTileY &&
        p.y <= maxTileY
      )
        visibleCount++;
    }
    creatureView.begin(world, visibleCount);

    for (const creature of creatures) {
      const position = creature?.position;
      const x = Number.isFinite(position?.x) ? position.x : null;
      const y = Number.isFinite(position?.y) ? position.y : null;
      if (x === null || y === null) continue;
      if (x < minTileX || x > maxTileX || y < minTileY || y > maxTileY) continue;

      const centerX = originX + x * tileSize;
      const centerY = originY + y * tileSize;
      creatureView.draw(ctx, creature, {
        x: centerX,
        y: centerY,
        tileSize,
        zoom: state.zoom,
        seconds
      });
    }

    ctx.restore();
  };

  return {
    canvas,
    creatureStats: creatureView.stats,
    destroy() {
      creatureView.clear();
      window.removeEventListener('resize', resizeToContainer);
      canvas.width = 1;
      canvas.height = 1;
      wrapper.remove();
    },
    render(sim, { immediate = false } = {}) {
      const perf = getActivePerf();
      const tTotal = perf?.start('render.total');
      try {
        const state = camera?.getState?.() ?? { x: 0, y: 0, zoom: 1 };

        const tTerrain = perf?.start('render.terrain');
        drawTerrain(state, sim.state?.world, sim.config, immediate);
        perf?.end('render.terrain', tTerrain);

        const tCreatures = perf?.start('render.creatures');
        drawCreatures(
          state,
          sim.state?.world,
          sim.state?.creatures,
          sim.config,
          sim.state?.elapsedSeconds ?? 0
        );
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
