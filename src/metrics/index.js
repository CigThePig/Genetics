export function createMetrics({ container } = {}) {
  const overlay = document.createElement('div');
  overlay.textContent = 'FPS: --';
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
  let frameCount = 0;
  let lastTime = performance.now();
  let rafId = null;

  const updateOverlay = (time) => {
    frameCount += 1;
    const elapsed = time - lastTime;
    if (elapsed >= 1000) {
      fps = Math.round((frameCount * 1000) / elapsed);
      frameCount = 0;
      lastTime = time;
      overlay.textContent = `FPS: ${fps}`;
    }
    rafId = requestAnimationFrame(updateOverlay);
  };

  rafId = requestAnimationFrame(updateOverlay);

  return {
    update() {},
    snapshot() {
      return { fps, visible };
    },
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
