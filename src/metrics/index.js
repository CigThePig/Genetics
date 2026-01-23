export function createMetrics({ container } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'fps-overlay';
  overlay.textContent = 'FPS: -- | TPS: --';

  if (container) {
    container.append(overlay);
  }

  let visible = true;
  let fps = 0;
  let tps = 0;
  let frameCount = 0;
  let tickCount = 0;
  let lastTime = performance.now();
  let lastTickTime = performance.now();
  let rafId = null;

  const updateOverlayText = () => {
    overlay.textContent = `FPS: ${fps} | TPS: ${tps}`;
  };

  const updateOverlay = (time) => {
    frameCount += 1;
    const elapsed = time - lastTime;
    if (elapsed >= 1000) {
      fps = Math.round((frameCount * 1000) / elapsed);
      frameCount = 0;
      lastTime = time;
      updateOverlayText();
    }
    if (visible) {
      rafId = requestAnimationFrame(updateOverlay);
    } else {
      rafId = null;
    }
  };

  const startRaf = () => {
    if (rafId) {
      return;
    }
    frameCount = 0;
    lastTime = performance.now();
    rafId = requestAnimationFrame(updateOverlay);
  };

  const stopRaf = () => {
    if (!rafId) {
      return;
    }
    cancelAnimationFrame(rafId);
    rafId = null;
  };

  startRaf();

  const getSkeletonSections = () => [
    {
      title: 'Performance',
      rows: ['FPS', 'Frame time', 'Render budget']
    },
    {
      title: 'Simulation',
      rows: ['Tick', 'Seed', 'Population']
    },
    {
      title: 'Environment',
      rows: ['Terrain', 'Plants', 'Weather']
    }
  ];

  return {
    update({ ticks = 0, time } = {}) {
      const now = Number.isFinite(time) ? time : performance.now();
      tickCount += ticks;
      const elapsed = now - lastTickTime;
      if (elapsed >= 1000) {
        tps = Math.round((tickCount * 1000) / elapsed);
        tickCount = 0;
        lastTickTime = now;
        updateOverlayText();
      }
    },
    snapshot() {
      return { fps, visible };
    },
    getSkeletonSections,
    setVisible(nextVisible) {
      visible = Boolean(nextVisible);
      overlay.style.display = visible ? 'block' : 'none';
      if (visible) {
        startRaf();
      } else {
        stopRaf();
      }
    },
    destroy() {
      stopRaf();
      overlay.remove();
    }
  };
}
