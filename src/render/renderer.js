import { SPECIES } from '../sim/species.js';

export function createRenderer(container, { camera }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'renderer-shell';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.width = '100%';
  wrapper.style.height = '60vh';
  wrapper.style.minHeight = '240px';

  const canvas = document.createElement('canvas');
  canvas.className = 'renderer-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Simulation canvas');
  canvas.style.flex = '1 1 auto';
  canvas.style.touchAction = 'none';

  const footer = document.createElement('p');
  footer.className = 'renderer-footer';

  wrapper.append(canvas, footer);
  container.append(wrapper);

  const ctx = canvas.getContext('2d');

  const resizeToContainer = () => {
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    const footerHeight = footer.getBoundingClientRect().height;
    const canvasHeight = Math.max(1, height - footerHeight);
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(width * ratio));
    canvas.height = Math.max(1, Math.floor(canvasHeight * ratio));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const resizeObserver = new ResizeObserver(() => {
    resizeToContainer();
  });
  resizeObserver.observe(wrapper);

  resizeToContainer();

  // Enhanced terrain palette with more natural colors
  const terrainPalette = {
    plains: { base: '#5a7c47', light: '#6b8f54', dark: '#4a6938' },
    forest: { base: '#3d5c3a', light: '#4a6d45', dark: '#2e4a2d' },
    rock: { base: '#5c6168', light: '#6e737a', dark: '#4a4f55' },
    sand: { base: '#c4a574', light: '#d4b88a', dark: '#b08f5e' },
    shore: { base: '#8ba87a', light: '#9cb88c', dark: '#7a9668' },
    water: { base: '#3b6d8c', light: '#4a7d9e', dark: '#2c5570' },
    unknown: { base: '#3b3b3b', light: '#4a4a4a', dark: '#2c2c2c' }
  };

  const defaultTileSize = 20;

  const resolveTileSize = (config) =>
    Number.isFinite(config?.tileSize)
      ? Math.max(1, config.tileSize)
      : defaultTileSize;

  // Simple noise function for texture variation
  const noise = (x, y) => {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  };

  // Get terrain color with subtle variation
  const getTerrainColor = (terrain, x, y, showDetail = true) => {
    const palette = terrainPalette[terrain] ?? terrainPalette.unknown;
    if (!showDetail) return palette.base;
    
    const n = noise(x * 0.5, y * 0.5);
    if (n < 0.33) return palette.dark;
    if (n > 0.66) return palette.light;
    return palette.base;
  };

  // Create water pattern gradient
  const createWaterGradient = (x, y, tileSize) => {
    const gradient = ctx.createLinearGradient(x, y, x + tileSize, y + tileSize);
    gradient.addColorStop(0, '#3b6d8c');
    gradient.addColorStop(0.5, '#4580a0');
    gradient.addColorStop(1, '#2c5570');
    return gradient;
  };

  const drawTerrain = (state, world, config) => {
    const tileSize = resolveTileSize(config);
    const { width, height } = canvas.getBoundingClientRect();
    
    // Dark background with subtle gradient
    const bgGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height));
    bgGradient.addColorStop(0, '#141a20');
    bgGradient.addColorStop(1, '#0a0e12');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2 + state.x, height / 2 + state.y);
    ctx.scale(state.zoom, state.zoom);

    if (!world) {
      ctx.restore();
      return;
    }

    const originX = -(world.width * tileSize) / 2;
    const originY = -(world.height * tileSize) / 2;

    const minWorldX = -(width / 2 + state.x) / state.zoom;
    const maxWorldX = (width / 2 - state.x) / state.zoom;
    const minWorldY = -(height / 2 + state.y) / state.zoom;
    const maxWorldY = (height / 2 - state.y) / state.zoom;

    const startCol = Math.max(0, Math.floor((minWorldX - originX) / tileSize));
    const endCol = Math.min(
      world.width,
      Math.ceil((maxWorldX - originX) / tileSize)
    );
    const startRow = Math.max(0, Math.floor((minWorldY - originY) / tileSize));
    const endRow = Math.min(
      world.height,
      Math.ceil((maxWorldY - originY) / tileSize)
    );

    const { cells } = world;
    const grass = Array.isArray(world.grass) ? world.grass : null;
    const grassStress = Array.isArray(world.grassStress)
      ? world.grassStress
      : null;
    const grassCap = Number.isFinite(config?.grassCap) ? config.grassCap : 1;
    const stressThreshold = Number.isFinite(config?.grassStressVisibleThreshold)
      ? config.grassStressVisibleThreshold
      : 0.25;
    
    // Determine detail level based on zoom
    const showDetail = state.zoom > 0.4;
    const showGrassDetail = state.zoom > 0.6;
    
    for (let y = startRow; y < endRow; y += 1) {
      const rowOffset = y * world.width;
      const tileY = originY + y * tileSize;
      for (let x = startCol; x < endCol; x += 1) {
        const terrain = cells[rowOffset + x];
        const tileX = originX + x * tileSize;
        
        // Draw base terrain with variation
        if (terrain === 'water') {
          // Water with subtle shimmer effect
          const waterBase = getTerrainColor(terrain, x, y, showDetail);
          ctx.fillStyle = waterBase;
          ctx.fillRect(tileX, tileY, tileSize, tileSize);
          
          // Add subtle highlight
          if (showDetail) {
            const shimmer = noise(x * 0.3, y * 0.3);
            if (shimmer > 0.7) {
              ctx.fillStyle = 'rgba(100, 160, 200, 0.15)';
              ctx.fillRect(tileX, tileY, tileSize, tileSize);
            }
          }
        } else {
          ctx.fillStyle = getTerrainColor(terrain, x, y, showDetail);
          ctx.fillRect(tileX, tileY, tileSize, tileSize);
        }

        // Grass overlay with improved blending
        if (grass) {
          const grassValue = Number.isFinite(grass[rowOffset + x])
            ? grass[rowOffset + x]
            : 0;
          const grassRatio =
            grassCap > 0 ? Math.min(1, Math.max(0, grassValue / grassCap)) : 0;
          if (grassRatio > 0) {
            // Multi-layer grass for depth
            const baseAlpha = 0.15 + grassRatio * 0.3;
            
            // Base grass layer
            ctx.fillStyle = `rgba(76, 140, 58, ${baseAlpha})`;
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
            
            // Highlight layer for lush grass
            if (grassRatio > 0.5 && showGrassDetail) {
              const highlightAlpha = (grassRatio - 0.5) * 0.2;
              ctx.fillStyle = `rgba(120, 180, 90, ${highlightAlpha})`;
              ctx.fillRect(tileX, tileY, tileSize, tileSize);
            }
          }
        }

        // Stress overlay with softer red
        if (grassStress) {
          const stressValue = Number.isFinite(grassStress[rowOffset + x])
            ? grassStress[rowOffset + x]
            : 0;
          if (stressValue >= stressThreshold) {
            const stressAlpha = Math.min(0.4, 0.1 + stressValue * 0.3);
            // Use a more muted, brownish-red for stress
            ctx.fillStyle = `rgba(160, 80, 60, ${stressAlpha})`;
            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          }
        }
      }
    }

    // Draw bushes with improved appearance
    if (Array.isArray(world.bushes) && world.bushes.length > 0) {
      const bushRadiusBase = tileSize * 0.3;
      const bushRadiusGrowth = tileSize * 0.2;
      const berryRadiusBase = tileSize * 0.08;
      const berryRadiusGrowth = tileSize * 0.1;
      const maxBerryFallback = Number.isFinite(config?.bushBerryMax)
        ? config.bushBerryMax
        : 1;

      for (const bush of world.bushes) {
        const bushX = Number.isFinite(bush.x) ? bush.x : null;
        const bushY = Number.isFinite(bush.y) ? bush.y : null;
        if (bushX === null || bushY === null) {
          continue;
        }
        if (
          bushX < startCol ||
          bushX >= endCol ||
          bushY < startRow ||
          bushY >= endRow
        ) {
          continue;
        }

        const health = Number.isFinite(bush.health) ? bush.health : 0;
        const berries = Number.isFinite(bush.berries) ? bush.berries : 0;
        const berryMax = Number.isFinite(bush.berryMax)
          ? bush.berryMax
          : maxBerryFallback;
        const berryRatio =
          berryMax > 0 ? Math.min(1, Math.max(0, berries / berryMax)) : 0;

        const centerX = originX + (bushX + 0.5) * tileSize;
        const centerY = originY + (bushY + 0.5) * tileSize;
        const bushRadius = bushRadiusBase + bushRadiusGrowth * health;

        // Bush shadow
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.ellipse(centerX + 1, centerY + 2, bushRadius * 0.9, bushRadius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main bush body with gradient
        const bushGradient = ctx.createRadialGradient(
          centerX - bushRadius * 0.3, centerY - bushRadius * 0.3, 0,
          centerX, centerY, bushRadius
        );
        const lightness = 25 + health * 20;
        bushGradient.addColorStop(0, `hsl(110, 35%, ${lightness + 15}%)`);
        bushGradient.addColorStop(1, `hsl(105, 30%, ${lightness}%)`);
        
        ctx.beginPath();
        ctx.fillStyle = bushGradient;
        ctx.arc(centerX, centerY, bushRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Subtle outline
        ctx.strokeStyle = 'rgba(20, 40, 20, 0.4)';
        ctx.lineWidth = 1 / state.zoom;
        ctx.stroke();

        // Berries with glow effect
        if (berryRatio > 0) {
          const berryRadius = berryRadiusBase + berryRadiusGrowth * berryRatio;
          const berryOffsets = [
            { x: 0.3, y: -0.25 },
            { x: -0.2, y: 0.3 },
            { x: 0.35, y: 0.2 }
          ];
          
          const numBerries = Math.ceil(berryRatio * 3);
          for (let i = 0; i < numBerries; i++) {
            const offset = berryOffsets[i];
            const bx = centerX + bushRadius * offset.x;
            const by = centerY + bushRadius * offset.y;
            
            // Berry glow
            ctx.beginPath();
            ctx.fillStyle = `rgba(200, 80, 140, ${0.2 * berryRatio})`;
            ctx.arc(bx, by, berryRadius * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Berry
            ctx.beginPath();
            ctx.fillStyle = `hsl(330, 60%, ${40 + berryRatio * 20}%)`;
            ctx.arc(bx, by, berryRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Berry highlight
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.arc(bx - berryRadius * 0.3, by - berryRadius * 0.3, berryRadius * 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Map border with subtle glow
    ctx.shadowColor = 'rgba(74, 222, 128, 0.2)';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.3)';
    ctx.lineWidth = 2 / state.zoom;
    ctx.strokeRect(
      originX,
      originY,
      world.width * tileSize,
      world.height * tileSize
    );
    ctx.shadowBlur = 0;

    ctx.restore();
  };

  const drawCreatures = (state, world, creatures, config) => {
    if (!world || !Array.isArray(creatures) || creatures.length === 0) {
      return;
    }
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

    ctx.fillStyle = 'rgba(248, 232, 120, 0.9)';
    ctx.strokeStyle = 'rgba(30, 30, 30, 0.35)';
    ctx.lineWidth = 1 / state.zoom;

    const drawCreatureShape = (species, x, y, radius) => {
      switch (species) {
        case SPECIES.SQUARE: {
          const size = radius * 1.6;
          ctx.rect(x - size / 2, y - size / 2, size, size);
          return;
        }
        case SPECIES.TRIANGLE: {
          const height = radius * 1.7;
          ctx.moveTo(x, y - height / 2);
          ctx.lineTo(x + radius, y + height / 2);
          ctx.lineTo(x - radius, y + height / 2);
          ctx.closePath();
          return;
        }
        case SPECIES.OCTAGON: {
          const sides = 8;
          const angleStep = (Math.PI * 2) / sides;
          const inset = radius * 0.85;
          for (let i = 0; i < sides; i += 1) {
            const angle = Math.PI / 8 + i * angleStep;
            const px = x + Math.cos(angle) * inset;
            const py = y + Math.sin(angle) * inset;
            if (i === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }
          ctx.closePath();
          return;
        }
        case SPECIES.CIRCLE:
        default:
          ctx.arc(x, y, radius, 0, Math.PI * 2);
      }
    };

    for (const creature of creatures) {
      const position = creature?.position;
      const x = Number.isFinite(position?.x) ? position.x : null;
      const y = Number.isFinite(position?.y) ? position.y : null;
      if (x === null || y === null) {
        continue;
      }
      if (x < minTileX || x > maxTileX || y < minTileY || y > maxTileY) {
        continue;
      }

      const centerX = originX + x * tileSize;
      const centerY = originY + y * tileSize;
      ctx.beginPath();
      drawCreatureShape(creature.species, centerX, centerY, markerRadius);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  };

  return {
    canvas,
    render(sim) {
      const state = camera?.getState?.() ?? { x: 0, y: 0, zoom: 1 };
      drawTerrain(state, sim.state?.world, sim.config);
      drawCreatures(state, sim.state?.world, sim.state?.creatures, sim.config);

      const roll = Number.isFinite(sim.state?.lastRoll)
        ? sim.state.lastRoll.toFixed(4)
        : '--';
      const grassAverage = Number.isFinite(sim.state?.metrics?.grassAverage)
        ? sim.state.metrics.grassAverage.toFixed(2)
        : '--';
      footer.textContent = `Seed: ${sim.config.seed} · Last roll: ${roll} · Avg grass: ${grassAverage}`;
    }
  };
}
