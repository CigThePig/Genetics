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
  
  // Wrap header elements
  const header = document.createElement('header');
  header.className = 'app-header';
  
  const titleNode = container.querySelector('h1');
  if (titleNode) {
    titleNode.textContent = 'Genetics';
    header.appendChild(titleNode);
  }
  
  statusNode.className = 'status';
  header.appendChild(statusNode);
  
  // Insert header at the beginning
  container.insertBefore(header, container.firstChild);
  
  // Controls bar
  const controls = document.createElement('div');
  controls.className = 'controls-bar';

  const createButton = (label, className = '') => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.className = `btn ${className}`.trim();
    return button;
  };

  // Playback controls group
  const playbackGroup = document.createElement('div');
  playbackGroup.className = 'control-group';
  
  const playButton = createButton('▶ Play', 'btn-primary');
  const pauseButton = createButton('⏸ Pause');
  const stepButton = createButton('⏭ Step');
  
  playbackGroup.append(playButton, pauseButton, stepButton);

  // Speed control group
  const speedGroup = document.createElement('div');
  speedGroup.className = 'control-group';
  
  const speedSelect = document.createElement('select');
  speedSelect.className = 'select';

  const speedOptions = [
    { label: '1× Speed', value: '1' },
    { label: '2× Speed', value: '2' },
    { label: '4× Speed', value: '4' }
  ];

  for (const option of speedOptions) {
    const entry = document.createElement('option');
    entry.value = option.value;
    entry.textContent = option.label;
    speedSelect.append(entry);
  }
  
  speedGroup.append(speedSelect);

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

  // Seed control group
  const seedGroup = document.createElement('div');
  seedGroup.className = 'control-group seed-group';

  const seedLabel = document.createElement('label');
  seedLabel.textContent = 'Seed';
  seedLabel.className = 'input-label';

  const seedInput = document.createElement('input');
  const seedInputId = 'seed-input';
  seedInput.id = seedInputId;
  seedLabel.setAttribute('for', seedInputId);
  seedInput.type = 'number';
  seedInput.inputMode = 'numeric';
  seedInput.className = 'input';

  const seedApply = createButton('Apply');

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

  seedGroup.append(seedLabel, seedInput, seedApply);

  // FPS toggle
  const fpsGroup = document.createElement('div');
  fpsGroup.className = 'control-group';
  
  const fpsToggle = createButton('FPS: On');
  fpsToggle.setAttribute('aria-pressed', 'true');

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
  
  fpsGroup.append(fpsToggle);

  controls.append(playbackGroup, speedGroup, seedGroup, fpsGroup);
  container.append(controls);

  // Metrics Panel
  const metricsSection = document.createElement('section');
  metricsSection.className = 'panel';

  const metricsHeader = document.createElement('div');
  metricsHeader.className = 'panel-header';
  
  const metricsTitle = document.createElement('h2');
  metricsTitle.className = 'panel-title';
  metricsTitle.innerHTML = '📊 Simulation Metrics';
  
  const metricsToggle = document.createElement('span');
  metricsToggle.className = 'panel-toggle expanded';
  metricsToggle.textContent = '▼';
  
  metricsHeader.append(metricsTitle, metricsToggle);

  const metricsContent = document.createElement('div');
  metricsContent.className = 'panel-content';
  
  const metricsBody = document.createElement('div');
  metricsBody.className = 'metrics-grid';

  let metricsExpanded = true;
  metricsHeader.addEventListener('click', () => {
    metricsExpanded = !metricsExpanded;
    metricsContent.style.display = metricsExpanded ? 'block' : 'none';
    metricsToggle.classList.toggle('expanded', metricsExpanded);
  });

  const metricDefinitions = [
    { key: 'creatureCount', label: 'Creatures', section: 'population' },
    { key: 'squaresCount', label: 'Squares', section: 'population' },
    { key: 'trianglesCount', label: 'Triangles', section: 'population' },
    { key: 'circlesCount', label: 'Circles', section: 'population' },
    { key: 'octagonsCount', label: 'Octagons', section: 'population' },
    { key: 'birthsLastTick', label: 'Births (tick)', section: 'population' },
    { key: 'birthsTotal', label: 'Births total', section: 'population' },
    { key: 'pregnanciesLastTick', label: 'Pregnancies (tick)', section: 'population' },
    { key: 'pregnanciesTotal', label: 'Pregnancies total', section: 'population' },
    { key: 'miscarriagesLastTick', label: 'Miscarriages (tick)', section: 'population' },
    { key: 'miscarriagesTotal', label: 'Miscarriages total', section: 'population' },
    { key: 'mutationsLastTick', label: 'Mutations (tick)', section: 'genetics' },
    { key: 'mutationStrengthLastTick', label: 'Mutation drift', section: 'genetics' },
    { key: 'pleiotropyStrengthLastTick', label: 'Pleiotropy drift', section: 'genetics' },
    { key: 'mutationTotal', label: 'Mutations total', section: 'genetics' },
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
    { key: 'chaseLosses', label: 'Chase losses', section: 'chase' },
    { key: 'killsTotal', label: 'Kills total', section: 'hunting' },
    { key: 'carcassCount', label: 'Carcasses', section: 'hunting' },
    { key: 'carcassMeatTotal', label: 'Carcass meat', section: 'hunting' }
  ];

  const metricRows = new Map();
  
  const createMetricSection = (title, definitions) => {
    const section = document.createElement('div');
    section.className = 'metrics-section';

    const sectionTitle = document.createElement('h3');
    sectionTitle.className = 'metrics-section-title';
    sectionTitle.textContent = title;

    const sectionList = document.createElement('ul');
    sectionList.className = 'metrics-list';

    for (const metric of definitions) {
      const item = document.createElement('li');
      item.className = 'metrics-item';
      
      const labelSpan = document.createElement('span');
      labelSpan.className = 'metrics-item-label';
      labelSpan.textContent = metric.label;
      
      const valueSpan = document.createElement('span');
      valueSpan.className = 'metrics-item-value';
      valueSpan.textContent = '--';
      
      item.append(labelSpan, valueSpan);
      sectionList.append(item);
      metricRows.set(metric.key, { label: metric.label, node: valueSpan });
    }

    section.append(sectionTitle, sectionList);
    return section;
  };

  const sectionOrder = [
    { key: 'population', title: 'Population' },
    { key: 'deaths', title: 'Deaths' },
    { key: 'plants', title: 'Plants' },
    { key: 'chase', title: 'Chase' },
    { key: 'hunting', title: 'Hunting' },
    { key: 'genetics', title: 'Genetics' }
  ];

  for (const { key, title } of sectionOrder) {
    const sectionMetrics = metricDefinitions.filter(m => m.section === key);
    if (sectionMetrics.length) {
      metricsBody.append(createMetricSection(title, sectionMetrics));
    }
  }

  metricsContent.append(metricsBody);
  metricsSection.append(metricsHeader, metricsContent);
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
      case 'mutationStrengthLastTick':
      case 'pleiotropyStrengthLastTick':
        return value.toFixed(3);
      default:
        return String(Math.round(value));
    }
  };

  const setMetrics = (summary = {}) => {
    metricRows.forEach(({ label, node }, key) => {
      const value = formatMetricValue(key, summary[key]);
      node.textContent = value;
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
    setMetrics
  };
}
