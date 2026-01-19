export function createUI({ statusNode, metrics }) {
  const container = statusNode?.parentElement ?? document.body;
  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.flexWrap = 'wrap';
  controls.style.gap = '8px';
  controls.style.marginTop = '12px';

  const fpsToggle = document.createElement('button');
  fpsToggle.type = 'button';
  fpsToggle.style.padding = '10px 14px';
  fpsToggle.style.minHeight = '44px';
  fpsToggle.style.borderRadius = '10px';
  fpsToggle.style.border = '1px solid #333';
  fpsToggle.style.background = '#fff';
  fpsToggle.style.fontSize = '14px';
  fpsToggle.style.cursor = 'pointer';

  let fpsVisible = true;
  const setFpsVisible = (visible) => {
    fpsVisible = visible;
    fpsToggle.textContent = `FPS: ${visible ? 'On' : 'Off'}`;
    fpsToggle.setAttribute('aria-pressed', String(visible));
    if (metrics?.setVisible) {
      metrics.setVisible(visible);
    }
  };

  fpsToggle.addEventListener('click', () => {
    setFpsVisible(!fpsVisible);
  });

  if (!metrics?.setVisible) {
    fpsToggle.disabled = true;
    fpsToggle.textContent = 'FPS: N/A';
    fpsToggle.setAttribute('aria-pressed', 'false');
  } else {
    setFpsVisible(true);
  }

  controls.append(fpsToggle);
  container.append(controls);

  return {
    setStatus(message) {
      statusNode.textContent = message;
    }
  };
}
