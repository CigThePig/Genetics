export function createUI({
  statusNode,
  metrics,
  onPlay,
  onPause,
  onStep,
  onSpeedChange,
  onSeedChange,
  onFpsToggle,
  initialFpsVisible = true
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
    const nextVisible = !fpsVisible;
    setFpsVisible(nextVisible);
    if (onFpsToggle) {
      onFpsToggle(nextVisible);
    }
  });

  if (!metrics?.setVisible) {
    fpsToggle.disabled = true;
    fpsToggle.textContent = 'FPS: N/A';
    fpsToggle.setAttribute('aria-pressed', 'false');
  } else {
    setFpsVisible(Boolean(initialFpsVisible));
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

  const metricsSection = document.createElement('section');
  metricsSection.style.border = '1px solid #333';
  metricsSection.style.borderRadius = '12px';
  metricsSection.style.padding = '12px';
  metricsSection.style.marginBottom = '12px';
  metricsSection.style.background = '#fff';

  const metricsTitle = document.createElement('h2');
  metricsTitle.textContent = 'Metrics';
  metricsTitle.style.fontSize = '16px';
  metricsTitle.style.margin = '0 0 8px';

  const metricsBody = document.createElement('div');
  metricsBody.style.display = 'grid';
  metricsBody.style.gap = '12px';

  const metricDefinitions = [
    { key: 'creatureCount', label: 'Creatures', section: 'population' },
    { key: 'squaresCount', label: 'Squares', section: 'population' },
    { key: 'trianglesCount', label: 'Triangles', section: 'population' },
    { key: 'circlesCount', label: 'Circles', section: 'population' },
    { key: 'octagonsCount', label: 'Octagons', section: 'population' },
    { key: 'deathsTotal', label: 'Deaths total', section: 'deaths' },
    { key: 'deathsAge', label: 'Deaths (age)', section: 'deaths' },
    { key: 'deathsStarvation', label: 'Deaths (starvation)', section: 'deaths' },
    { key: 'deathsThirst', label: 'Deaths (thirst)', section: 'deaths' },
    { key: 'deathsInjury', label: 'Deaths (injury)', section: 'deaths' },
    { key: 'deathsOther', label: 'Deaths (other)', section: 'deaths' },
    { key: 'grassAverage', label: 'Grass avg', section: 'plants' },
    { key: 'grassTotal', label: 'Grass total', section: 'plants' },
    { key: 'grassCoverage', label: 'Grass coverage', section: 'plants' },
    { key: 'grassHotspotCells', label: 'Hotspot cells', section: 'plants' },
    { key: 'stressedCells', label: 'Stressed cells', section: 'plants' },
    { key: 'bushCount', label: 'Bush count', section: 'plants' },
    { key: 'berryTotal', label: 'Berry total', section: 'plants' },
    { key: 'berryAverage', label: 'Berries per bush', section: 'plants' },
    { key: 'bushAverageHealth', label: 'Bush avg health', section: 'plants' },
    { key: 'chaseAttempts', label: 'Chase attempts', section: 'chase' },
    { key: 'chaseSuccesses', label: 'Chase successes', section: 'chase' },
    { key: 'chaseLosses', label: 'Chase losses', section: 'chase' }
  ];

  const metricRows = new Map();
  const createMetricSection = (title, definitions) => {
    const section = document.createElement('div');
    section.style.display = 'grid';
    section.style.gap = '6px';

    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = title;
    sectionTitle.style.fontSize = '14px';
    sectionTitle.style.margin = '0';

    const sectionList = document.createElement('ul');
    sectionList.style.listStyle = 'none';
    sectionList.style.padding = '0';
    sectionList.style.margin = '0';
    sectionList.style.display = 'grid';
    sectionList.style.gap = '4px';

    for (const metric of definitions) {
      const item = document.createElement('li');
      item.textContent = `${metric.label}: --`;
      item.style.fontSize = '13px';
      item.style.color = '#444';
      sectionList.append(item);
      metricRows.set(metric.key, { label: metric.label, node: item });
    }

    section.append(sectionTitle, sectionList);
    return section;
  };

  const populationMetrics = metricDefinitions.filter(
    (metric) => metric.section === 'population'
  );
  if (populationMetrics.length) {
    metricsBody.append(createMetricSection('Population', populationMetrics));
  }

  const deathMetrics = metricDefinitions.filter(
    (metric) => metric.section === 'deaths'
  );
  if (deathMetrics.length) {
    metricsBody.append(createMetricSection('Deaths', deathMetrics));
  }

  const plantMetrics = metricDefinitions.filter(
    (metric) => metric.section === 'plants'
  );
  if (plantMetrics.length) {
    metricsBody.append(createMetricSection('Plants', plantMetrics));
  }

  const chaseMetrics = metricDefinitions.filter(
    (metric) => metric.section === 'chase'
  );
  if (chaseMetrics.length) {
    metricsBody.append(createMetricSection('Chase', chaseMetrics));
  }

  const metricsSections = metrics?.getSkeletonSections
    ? metrics.getSkeletonSections()
    : [{ title: 'Coming soon', rows: ['Metrics will appear here.'] }];

  for (const section of metricsSections) {
    const sectionWrap = document.createElement('div');
    sectionWrap.style.display = 'grid';
    sectionWrap.style.gap = '6px';

    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = section.title;
    sectionTitle.style.fontSize = '14px';
    sectionTitle.style.margin = '0';

    const sectionList = document.createElement('ul');
    sectionList.style.listStyle = 'none';
    sectionList.style.padding = '0';
    sectionList.style.margin = '0';
    sectionList.style.display = 'grid';
    sectionList.style.gap = '4px';

    for (const row of section.rows) {
      const item = document.createElement('li');
      item.textContent = row;
      item.style.fontSize = '13px';
      item.style.color = '#444';
      sectionList.append(item);
    }

    sectionWrap.append(sectionTitle, sectionList);
    metricsBody.append(sectionWrap);
  }

  metricsSection.append(metricsTitle, metricsBody);
  container.append(metricsSection);

  const formatMetricValue = (key, value) => {
    if (!Number.isFinite(value)) {
      return '--';
    }
    switch (key) {
      case 'grassAverage':
        return value.toFixed(3);
      case 'grassTotal':
        return value.toFixed(1);
      case 'grassCoverage':
        return `${(value * 100).toFixed(1)}%`;
      case 'berryAverage':
        return value.toFixed(2);
      case 'bushAverageHealth':
        return value.toFixed(2);
      default:
        return String(Math.round(value));
    }
  };

  const setMetrics = (summary = {}) => {
    metricRows.forEach(({ label, node }, key) => {
      const value = formatMetricValue(key, summary[key]);
      node.textContent = `${label}: ${value}`;
    });
  };

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
    setFpsVisible,
    setMetrics,
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
