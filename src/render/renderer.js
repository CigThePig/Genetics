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

  const footer = document.createElement('p');
  footer.className = 'renderer-footer';
  footer.style.margin = '0';
  footer.style.padding = '6px 0';

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

  const terrainPalette = {
    plains: '#5b8f4e',
    forest: '#2d6a4f',
    rock: '#6c757d',
    sand: '#d9b68b',
    shore: '#b5c98c',
    water: '#3b6ea5',
    unknown: '#3b3b3b'
  };

  const tileSize = 20;

  const getTerrainColor = (terrain) =>
    terrainPalette[terrain] ?? terrainPalette.unknown;

  const drawTerrain = (state, world, config) => {
    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2 + state.x, height / 2 + state.y);
    ctx.scale(state.zoom, state.zoom);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(-width, -height, width * 2, height * 2);

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
    for (let y = startRow; y < endRow; y += 1) {
      const rowOffset = y * world.width;
      const tileY = originY + y * tileSize;
      for (let x = startCol; x < endCol; x += 1) {
        const terrain = cells[rowOffset + x];
        ctx.fillStyle = getTerrainColor(terrain);
        ctx.fillRect(originX + x * tileSize, tileY, tileSize, tileSize);

        if (grass) {
          const grassValue = Number.isFinite(grass[rowOffset + x])
            ? grass[rowOffset + x]
            : 0;
          const grassRatio =
            grassCap > 0 ? Math.min(1, Math.max(0, grassValue / grassCap)) : 0;
          if (grassRatio > 0) {
            const alpha = 0.1 + grassRatio * 0.35;
            ctx.fillStyle = `rgba(88, 180, 72, ${alpha})`;
            ctx.fillRect(originX + x * tileSize, tileY, tileSize, tileSize);
          }
        }

        if (grassStress) {
          const stressValue = Number.isFinite(grassStress[rowOffset + x])
            ? grassStress[rowOffset + x]
            : 0;
          if (stressValue >= stressThreshold) {
            const stressAlpha = Math.min(0.5, 0.15 + stressValue * 0.35);
            ctx.fillStyle = `rgba(196, 72, 60, ${stressAlpha})`;
            ctx.fillRect(originX + x * tileSize, tileY, tileSize, tileSize);
          }
        }
      }
    }

    if (Array.isArray(world.bushes) && world.bushes.length > 0) {
      const bushRadiusBase = tileSize * 0.28;
      const bushRadiusGrowth = tileSize * 0.18;
      const berryRadiusBase = tileSize * 0.1;
      const berryRadiusGrowth = tileSize * 0.12;
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

        ctx.beginPath();
        ctx.fillStyle = `hsl(105, 28%, ${22 + health * 28}%)`;
        ctx.arc(centerX, centerY, bushRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(10, 30, 12, 0.5)';
        ctx.lineWidth = 1 / state.zoom;
        ctx.stroke();

        if (berryRatio > 0) {
          const berryRadius = berryRadiusBase + berryRadiusGrowth * berryRatio;
          ctx.beginPath();
          ctx.fillStyle = `rgba(196, 64, 160, ${0.4 + berryRatio * 0.5})`;
          ctx.arc(
            centerX + bushRadius * 0.25,
            centerY - bushRadius * 0.2,
            berryRadius,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1 / state.zoom;
    ctx.strokeRect(
      originX,
      originY,
      world.width * tileSize,
      world.height * tileSize
    );

    ctx.restore();
  };

  return {
    canvas,
    render(sim) {
      const state = camera?.getState?.() ?? { x: 0, y: 0, zoom: 1 };
      drawTerrain(state, sim.state?.world, sim.config);

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
