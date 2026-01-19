export function createUI({
  statusNode,
  metrics,
  onPlay,
  onPause,
  onStep,
  onSpeedChange,
  onSeedChange
}) {
  const container = statusNode?.parentElement ?? document.body;
  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.flexWrap = 'wrap';
  controls.style.gap = '8px';
  controls.style.marginTop = '12px';
  controls.style.marginBottom = '16px';

  const createButton = (label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.padding = '10px 14px';
    button.style.minHeight = '44px';
    button.style.borderRadius = '10px';
    button.style.border = '1px solid #333';
    button.style.background = '#fff';
    button.style.fontSize = '14px';
    button.style.cursor = 'pointer';
    return button;
  };

  const playButton = createButton('Play');
  const pauseButton = createButton('Pause');
  const stepButton = createButton('Step');

  const speedSelect = document.createElement('select');
  speedSelect.style.padding = '10px 14px';
  speedSelect.style.minHeight = '44px';
  speedSelect.style.borderRadius = '10px';
  speedSelect.style.border = '1px solid #333';
  speedSelect.style.background = '#fff';
  speedSelect.style.fontSize = '14px';

  const speedOptions = [
    { label: 'Speed: 1x', value: '1' },
    { label: 'Speed: 2x', value: '2' },
    { label: 'Speed: 4x', value: '4' }
  ];

  for (const option of speedOptions) {
    const entry = document.createElement('option');
    entry.value = option.value;
    entry.textContent = option.label;
    speedSelect.append(entry);
  }

  playButton.addEventListener('click', () => {
    if (onPlay) {
      onPlay();
    }
  });

  pauseButton.addEventListener('click', () => {
    if (onPause) {
      onPause();
    }
  });

  stepButton.addEventListener('click', () => {
    if (onStep) {
      onStep();
    }
  });

  speedSelect.addEventListener('change', () => {
    if (onSpeedChange) {
      onSpeedChange(Number(speedSelect.value));
    }
  });

  const seedWrapper = document.createElement('div');
  seedWrapper.style.display = 'flex';
  seedWrapper.style.alignItems = 'center';
  seedWrapper.style.gap = '6px';

  const seedLabel = document.createElement('label');
  seedLabel.textContent = 'Seed';
  seedLabel.style.fontSize = '14px';

  const seedInput = document.createElement('input');
  const seedInputId = 'seed-input';
  seedInput.id = seedInputId;
  seedLabel.setAttribute('for', seedInputId);
  seedInput.type = 'number';
  seedInput.inputMode = 'numeric';
  seedInput.style.padding = '10px 14px';
  seedInput.style.minHeight = '44px';
  seedInput.style.borderRadius = '10px';
  seedInput.style.border = '1px solid #333';
  seedInput.style.fontSize = '14px';
  seedInput.style.width = '120px';

  const seedApply = createButton('Apply');
  seedApply.style.padding = '10px 12px';
  seedApply.style.minWidth = '70px';

  const commitSeedChange = () => {
    if (onSeedChange) {
      const value = Number(seedInput.value);
      onSeedChange(Number.isFinite(value) ? Math.trunc(value) : 0);
    }
  };

  seedApply.addEventListener('click', commitSeedChange);
  seedInput.addEventListener('change', commitSeedChange);

  if (!onSeedChange) {
    seedInput.disabled = true;
    seedApply.disabled = true;
  }

  seedWrapper.append(seedLabel, seedInput, seedApply);

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

  controls.append(
    playButton,
    pauseButton,
    stepButton,
    speedSelect,
    seedWrapper,
    fpsToggle
  );

  const inspectorSection = document.createElement('section');
  inspectorSection.style.border = '1px solid #333';
  inspectorSection.style.borderRadius = '12px';
  inspectorSection.style.padding = '12px';
  inspectorSection.style.marginBottom = '12px';
  inspectorSection.style.background = '#fff';

  const inspectorTitle = document.createElement('h2');
  inspectorTitle.textContent = 'Inspector';
  inspectorTitle.style.fontSize = '16px';
  inspectorTitle.style.margin = '0 0 8px';

  const inspectorBody = document.createElement('div');
  inspectorBody.style.display = 'grid';
  inspectorBody.style.gap = '6px';
  inspectorBody.style.fontSize = '14px';

  const setInspectorRows = (rows) => {
    inspectorBody.innerHTML = '';
    for (const row of rows) {
      const line = document.createElement('p');
      line.textContent = row;
      line.style.margin = '0';
      inspectorBody.append(line);
    }
  };

  setInspectorRows(['Tap the canvas to inspect a location.']);

  inspectorSection.append(inspectorTitle, inspectorBody);

  container.append(controls);
  container.append(inspectorSection);

  return {
    setStatus(message) {
      statusNode.textContent = message;
    },
    setRunning(isRunning) {
      playButton.disabled = isRunning;
      pauseButton.disabled = !isRunning;
      stepButton.disabled = isRunning;
    },
    setSpeed(speed) {
      const value = String(speed);
      if (speedSelect.value !== value) {
        speedSelect.value = value;
      }
    },
    setSeed(seed) {
      const value = String(seed);
      if (seedInput.value !== value) {
        seedInput.value = value;
      }
    },
    setInspector({ title, rows }) {
      if (title) {
        inspectorTitle.textContent = title;
      }
      if (rows && rows.length) {
        setInspectorRows(rows);
      }
    }
  };
}
