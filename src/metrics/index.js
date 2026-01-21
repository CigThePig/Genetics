export function createMetrics({ container } = {}) {
  const overlay = document.createElement('div');
  overlay.textContent = 'FPS: -- | TPS: --';
  overlay.style.position = 'fixed';
  overlay.style.top = '12px';
  overlay.style.right = '12px';
  overlay.style.padding = '6px 10px';
  overlay.style.borderRadius = '8px';
  overlay.style.background = 'rgba(0, 0, 0, 0.7)';
  overlay.style.color = '#fff';
  overlay.style.fontFamily = 'system-ui, sans-serif';
  overlay.style.fontSize = '12px';
  overlay.style.letterSpacing = '0.3px';
  overlay.style.zIndex = '10';

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
    rafId = requestAnimationFrame(updateOverlay);
  };

  rafId = requestAnimationFrame(updateOverlay);

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
    },
    destroy() {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      overlay.remove();
    }
  };
}
