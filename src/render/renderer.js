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

  const drawTerrain = (state, world) => {
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
    for (let y = startRow; y < endRow; y += 1) {
      const rowOffset = y * world.width;
      const tileY = originY + y * tileSize;
      for (let x = startCol; x < endCol; x += 1) {
        const terrain = cells[rowOffset + x];
        ctx.fillStyle = getTerrainColor(terrain);
        ctx.fillRect(originX + x * tileSize, tileY, tileSize, tileSize);
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
      drawTerrain(state, sim.state?.world);

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
