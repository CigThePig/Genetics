/**
 * Mobile-First UI System
 * 
 * Features:
 * - Full-screen immersive canvas
 * - Floating action buttons (FABs)
 * - Tap-to-open overlay panels
 * - Playback controls bar
 * - Top status bar
 */

export function createUI({
  statusNode,
  metrics,
  onPlay,
  onPause,
  onStep,
  onSpeedChange,
  onSeedChange,
  onFpsToggle,
  onRecenter,
  onZoomIn,
  onZoomOut,
  initialFpsVisible = true
}) {
  const container = document.querySelector('#app') || document.body;
  
  // Remove the old status node and title if they exist
  if (statusNode?.parentElement) {
    statusNode.remove();
  }
  const oldTitle = container.querySelector('h1');
  if (oldTitle) oldTitle.remove();

  // ═══════════════════════════════════════════════════════════════════════════
  // TOP STATUS BAR
  // ═══════════════════════════════════════════════════════════════════════════

  const topBar = document.createElement('div');
  topBar.className = 'top-bar';

  const title = document.createElement('h1');
  title.className = 'top-bar-title';
  title.innerHTML = '🧬 Genetics';

  const status = document.createElement('span');
  status.className = 'top-bar-status';
  status.textContent = 'Ready';

  topBar.append(title, status);
  container.append(topBar);

  // ═══════════════════════════════════════════════════════════════════════════
  // TRACKING INDICATOR
  // ═══════════════════════════════════════════════════════════════════════════

  const trackingIndicator = document.createElement('div');
  trackingIndicator.className = 'tracking-indicator';
  trackingIndicator.innerHTML = '<span class="pulse"></span><span class="tracking-text">Following #--</span>';
  container.append(trackingIndicator);

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAYBACK CONTROLS (Bottom Center)
  // ═══════════════════════════════════════════════════════════════════════════

  const playbackBar = document.createElement('div');
  playbackBar.className = 'playback-bar';

  const stepBtn = document.createElement('button');
  stepBtn.className = 'playback-btn';
  stepBtn.innerHTML = '⏭';
  stepBtn.title = 'Step';
  stepBtn.addEventListener('click', () => onStep?.());

  const playBtn = document.createElement('button');
  playBtn.className = 'playback-btn primary';
  playBtn.innerHTML = '▶';
  playBtn.title = 'Play';
  playBtn.addEventListener('click', () => onPlay?.());

  const pauseBtn = document.createElement('button');
  pauseBtn.className = 'playback-btn';
  pauseBtn.innerHTML = '⏸';
  pauseBtn.title = 'Pause';
  pauseBtn.addEventListener('click', () => onPause?.());

  const speedSelect = document.createElement('select');
  speedSelect.className = 'speed-select';
  [
    { label: '1×', value: '1' },
    { label: '2×', value: '2' },
    { label: '4×', value: '4' }
  ].forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    speedSelect.append(option);
  });
  speedSelect.addEventListener('change', () => {
    onSpeedChange?.(Number(speedSelect.value));
  });

  playbackBar.append(stepBtn, playBtn, pauseBtn, speedSelect);
  container.append(playbackBar);

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK ACTIONS (Right side - Zoom controls)
  // ═══════════════════════════════════════════════════════════════════════════

  const quickActions = document.createElement('div');
  quickActions.className = 'quick-actions';

  const zoomInBtn = document.createElement('button');
  zoomInBtn.className = 'quick-action-btn';
  zoomInBtn.innerHTML = '+';
  zoomInBtn.title = 'Zoom In';
  zoomInBtn.addEventListener('click', () => onZoomIn?.());

  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.className = 'quick-action-btn';
  zoomOutBtn.innerHTML = '−';
  zoomOutBtn.title = 'Zoom Out';
  zoomOutBtn.addEventListener('click', () => onZoomOut?.());

  const recenterBtn = document.createElement('button');
  recenterBtn.className = 'quick-action-btn';
  recenterBtn.innerHTML = '◎';
  recenterBtn.title = 'Recenter';
  recenterBtn.addEventListener('click', () => onRecenter?.());

  quickActions.append(zoomInBtn, zoomOutBtn, recenterBtn);
  container.append(quickActions);

  // ═══════════════════════════════════════════════════════════════════════════
  // FPS OVERLAY
  // ═══════════════════════════════════════════════════════════════════════════

  const fpsOverlay = document.createElement('div');
  fpsOverlay.className = 'fps-overlay';
  fpsOverlay.textContent = 'FPS: --';
  fpsOverlay.style.display = initialFpsVisible ? 'block' : 'none';
  container.append(fpsOverlay);

  // ═══════════════════════════════════════════════════════════════════════════
  // FAB CONTAINERS
  // ═══════════════════════════════════════════════════════════════════════════

  const fabContainerRight = document.createElement('div');
  fabContainerRight.className = 'fab-container fab-container-right';

  // ═══════════════════════════════════════════════════════════════════════════
  // METRICS PANEL & FAB
  // ═══════════════════════════════════════════════════════════════════════════

  const metricsPanel = document.createElement('div');
  metricsPanel.className = 'overlay-panel metrics-panel bottom-right';

  const metricsPanelHeader = document.createElement('div');
  metricsPanelHeader.className = 'panel-header';

  const metricsPanelTitle = document.createElement('h2');
  metricsPanelTitle.className = 'panel-title';
  metricsPanelTitle.innerHTML = '📊 Metrics';

  const metricsPanelClose = document.createElement('button');
  metricsPanelClose.className = 'panel-close';
  metricsPanelClose.innerHTML = '×';

  metricsPanelHeader.append(metricsPanelTitle, metricsPanelClose);

  const metricsPanelContent = document.createElement('div');
  metricsPanelContent.className = 'panel-content';

  const metricsBody = document.createElement('div');
  metricsBody.className = 'metrics-grid';

  // Metric definitions
  const metricDefinitions = [
    { key: 'creatureCount', label: 'Creatures', section: 'population' },
    { key: 'squaresCount', label: 'Squares', section: 'population' },
    { key: 'trianglesCount', label: 'Triangles', section: 'population' },
    { key: 'circlesCount', label: 'Circles', section: 'population' },
    { key: 'octagonsCount', label: 'Octagons', section: 'population' },
    { key: 'birthsTotal', label: 'Births', section: 'population' },
    { key: 'deathsTotal', label: 'Deaths', section: 'deaths' },
    { key: 'deathsAge', label: 'Age', section: 'deaths' },
    { key: 'deathsStarvation', label: 'Starved', section: 'deaths' },
    { key: 'deathsThirst', label: 'Thirst', section: 'deaths' },
    { key: 'deathsInjury', label: 'Injury', section: 'deaths' },
    { key: 'grassAverage', label: 'Grass avg', section: 'plants' },
    { key: 'bushCount', label: 'Bushes', section: 'plants' },
    { key: 'berryTotal', label: 'Berries', section: 'plants' },
    { key: 'carcassCount', label: 'Carcasses', section: 'hunting' },
    { key: 'killsTotal', label: 'Kills', section: 'hunting' },
    { key: 'chaseSuccesses', label: 'Catches', section: 'hunting' },
    { key: 'mutationTotal', label: 'Mutations', section: 'genetics' }
  ];

  const metricRows = new Map();

  const createMetricSection = (title, defs) => {
    const section = document.createElement('div');
    section.className = 'metrics-section';

    const sectionTitle = document.createElement('h3');
    sectionTitle.className = 'metrics-section-title';
    sectionTitle.textContent = title;

    const list = document.createElement('ul');
    list.className = 'metrics-list';

    for (const metric of defs) {
      const item = document.createElement('li');
      item.className = 'metrics-item';

      const label = document.createElement('span');
      label.className = 'metrics-item-label';
      label.textContent = metric.label;

      const value = document.createElement('span');
      value.className = 'metrics-item-value';
      value.textContent = '--';

      item.append(label, value);
      list.append(item);
      metricRows.set(metric.key, value);
    }

    section.append(sectionTitle, list);
    return section;
  };

  const sections = [
    { key: 'population', title: 'Population' },
    { key: 'deaths', title: 'Deaths' },
    { key: 'plants', title: 'Plants' },
    { key: 'hunting', title: 'Hunting' },
    { key: 'genetics', title: 'Genetics' }
  ];

  for (const { key, title } of sections) {
    const defs = metricDefinitions.filter(m => m.section === key);
    if (defs.length) {
      metricsBody.append(createMetricSection(title, defs));
    }
  }

  // Seed input row
  const seedRow = document.createElement('div');
  seedRow.className = 'seed-row';

  const seedInput = document.createElement('input');
  seedInput.type = 'number';
  seedInput.className = 'seed-input';
  seedInput.placeholder = 'Seed';

  const seedApplyBtn = document.createElement('button');
  seedApplyBtn.className = 'btn btn-sm';
  seedApplyBtn.textContent = 'Apply';
  seedApplyBtn.addEventListener('click', () => {
    const value = Number(seedInput.value);
    if (Number.isFinite(value)) {
      onSeedChange?.(Math.trunc(value));
    }
  });

  seedRow.append(seedInput, seedApplyBtn);
  metricsBody.append(seedRow);

  metricsPanelContent.append(metricsBody);
  metricsPanel.append(metricsPanelHeader, metricsPanelContent);
  container.append(metricsPanel);

  // Metrics FAB
  const metricsFab = document.createElement('button');
  metricsFab.className = 'fab';
  metricsFab.innerHTML = '📊';
  metricsFab.title = 'Metrics';

  let metricsVisible = false;
  const toggleMetrics = () => {
    metricsVisible = !metricsVisible;
    metricsPanel.classList.toggle('visible', metricsVisible);
    metricsFab.classList.toggle('active', metricsVisible);
    // Close other panels
    if (metricsVisible && configVisible) toggleConfig();
  };

  metricsFab.addEventListener('click', toggleMetrics);
  metricsPanelClose.addEventListener('click', toggleMetrics);

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIG PANEL & FAB
  // ═══════════════════════════════════════════════════════════════════════════

  const configPanel = document.createElement('div');
  configPanel.className = 'overlay-panel config-panel bottom-right';
  // Will be populated by config-panel.js
  container.append(configPanel);

  const configFab = document.createElement('button');
  configFab.className = 'fab';
  configFab.innerHTML = '⚙️';
  configFab.title = 'Config';

  let configVisible = false;
  const toggleConfig = () => {
    configVisible = !configVisible;
    configPanel.classList.toggle('visible', configVisible);
    configFab.classList.toggle('active', configVisible);
    // Close other panels
    if (configVisible && metricsVisible) toggleMetrics();
  };

  configFab.addEventListener('click', toggleConfig);

  // ═══════════════════════════════════════════════════════════════════════════
  // FPS TOGGLE FAB
  // ═══════════════════════════════════════════════════════════════════════════

  const fpsFab = document.createElement('button');
  fpsFab.className = 'fab fab-sm';
  fpsFab.innerHTML = '📈';
  fpsFab.title = 'Toggle FPS';

  let fpsVisible = initialFpsVisible;
  fpsFab.classList.toggle('active', fpsVisible);

  fpsFab.addEventListener('click', () => {
    fpsVisible = !fpsVisible;
    fpsFab.classList.toggle('active', fpsVisible);
    fpsOverlay.style.display = fpsVisible ? 'block' : 'none';
    if (metrics?.setVisible) {
      metrics.setVisible(fpsVisible);
    }
    onFpsToggle?.(fpsVisible);
  });

  // Assemble right FABs
  fabContainerRight.append(metricsFab, configFab, fpsFab);
  container.append(fabContainerRight);

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMAT HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const formatMetricValue = (key, value) => {
    if (!Number.isFinite(value)) return '--';
    switch (key) {
      case 'grassAverage':
        return value.toFixed(2);
      case 'grassCoverage':
        return `${(value * 100).toFixed(0)}%`;
      case 'berryAverage':
      case 'bushAverageHealth':
        return value.toFixed(1);
      default:
        return String(Math.round(value));
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    setStatus(message) {
      status.textContent = message;
    },

    setRunning(isRunning) {
      playBtn.disabled = isRunning;
      pauseBtn.disabled = !isRunning;
      stepBtn.disabled = isRunning;
      
      // Update play button icon
      playBtn.innerHTML = isRunning ? '▶' : '▶';
    },

    setSpeed(speed) {
      speedSelect.value = String(speed);
    },

    setSeed(seed) {
      seedInput.value = String(seed);
    },

    setFpsVisible(visible) {
      fpsVisible = visible;
      fpsFab.classList.toggle('active', visible);
      fpsOverlay.style.display = visible ? 'block' : 'none';
    },

    setMetrics(summary = {}) {
      metricRows.forEach((node, key) => {
        node.textContent = formatMetricValue(key, summary[key]);
      });
    },

    updateFps(fps) {
      fpsOverlay.textContent = `FPS: ${fps} | TPS: ${fps}`;
    },

    setTracking(creatureId, isFollowing = false) {
      const textEl = trackingIndicator.querySelector('.tracking-text');
      if (creatureId !== null) {
        textEl.textContent = isFollowing ? `Following #${creatureId}` : `Tracking #${creatureId}`;
        trackingIndicator.classList.add('visible');
      } else {
        trackingIndicator.classList.remove('visible');
      }
    },

    // Get the config panel container for config-panel.js to populate
    getConfigPanelContainer() {
      return configPanel;
    },

    // Close a specific panel
    closePanel(panelName) {
      if (panelName === 'metrics' && metricsVisible) toggleMetrics();
      if (panelName === 'config' && configVisible) toggleConfig();
    },

    // Toggle a panel
    togglePanel(panelName) {
      if (panelName === 'metrics') toggleMetrics();
      if (panelName === 'config') toggleConfig();
    }
  };
}
