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
  container.append(wrapper);

  const ctx = canvas.getContext('2d');

  const resizeToContainer = () => {
    const { width, height } = wrapper.getBoundingClientRect();
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

  const drawGrid = (state) => {
    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2 + state.x, height / 2 + state.y);
    ctx.scale(state.zoom, state.zoom);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(-width, -height, width * 2, height * 2);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1 / state.zoom;
    const gridSize = 40;
    const halfWidth = width / state.zoom;
    const halfHeight = height / state.zoom;

    for (let x = -halfWidth; x <= halfWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, -halfHeight);
      ctx.lineTo(x, halfHeight);
      ctx.stroke();
    }

    for (let y = -halfHeight; y <= halfHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(-halfWidth, y);
      ctx.lineTo(halfWidth, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2 / state.zoom;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 10);
    ctx.stroke();

    ctx.restore();
  };

  return {
    canvas,
    render(sim) {
      const state = camera?.getState?.() ?? { x: 0, y: 0, zoom: 1 };
      drawGrid(state);

      const roll = Number.isFinite(sim.state?.lastRoll)
        ? sim.state.lastRoll.toFixed(4)
        : '--';
      footer.textContent = `Seed: ${sim.config.seed} · Last roll: ${roll}`;
    }
  };
}
