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
  // FORMAT HELPER (defined early so it's available)
  // ═══════════════════════════════════════════════════════════════════════════

  const formatMetricValue = (key, value) => {
    if (!Number.isFinite(value)) return '--';
    if (key.includes('mutationStrength') || key.includes('pleiotropyStrength')) {
      return value.toFixed(3);
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

  // ═══════════════════════════════════════════════════════════════════════════
  // TOP CONTROL BAR (Collapsible)
  // ═══════════════════════════════════════════════════════════════════════════

  const topBar = document.createElement('div');
  topBar.className = 'top-bar';

  // Header row (always visible)
  const topBarHeader = document.createElement('div');
  topBarHeader.className = 'top-bar-header';

  const title = document.createElement('h1');
  title.className = 'top-bar-title';
  title.innerHTML = '🧬 Genetics';

  // State indicator shows play state when collapsed
  const stateIndicator = document.createElement('div');
  stateIndicator.className = 'top-bar-state';
  stateIndicator.innerHTML = '<span class="state-icon">⏸</span><span class="state-speed">1×</span>';

  // Expand/collapse toggle
  const expandBtn = document.createElement('button');
  expandBtn.className = 'top-bar-expand';
  expandBtn.innerHTML = '▼';
  expandBtn.title = 'Expand controls';

  topBarHeader.append(title, stateIndicator, expandBtn);

  // Controls panel (collapsible)
  const controlsPanel = document.createElement('div');
  controlsPanel.className = 'top-bar-controls';

  // Playback row
  const playbackRow = document.createElement('div');
  playbackRow.className = 'playback-row';

  const stepBtn = document.createElement('button');
  stepBtn.className = 'control-btn';
  stepBtn.innerHTML = '⏭';
  stepBtn.title = 'Step';
  stepBtn.addEventListener('click', () => onStep?.());

  const playBtn = document.createElement('button');
  playBtn.className = 'control-btn play-btn';
  playBtn.innerHTML = '▶';
  playBtn.title = 'Play';
  playBtn.addEventListener('click', () => onPlay?.());

  const pauseBtn = document.createElement('button');
  pauseBtn.className = 'control-btn';
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

  // FPS toggle (small text button)
  const fpsToggleBtn = document.createElement('button');
  fpsToggleBtn.className = 'fps-toggle-btn';
  fpsToggleBtn.textContent = 'FPS';
  fpsToggleBtn.title = 'Performance';

  playbackRow.append(stepBtn, playBtn, pauseBtn, speedSelect, fpsToggleBtn);

  // Status row
  const statusRow = document.createElement('div');
  statusRow.className = 'status-row';

  const status = document.createElement('span');
  status.className = 'top-bar-status';
  status.textContent = 'Ready';

  statusRow.append(status);

  controlsPanel.append(playbackRow, statusRow);
  topBar.append(topBarHeader, controlsPanel);
  container.append(topBar);

  // Control panel expand/collapse
  let controlsExpanded = false;
  const toggleControls = () => {
    controlsExpanded = !controlsExpanded;
    topBar.classList.toggle('expanded', controlsExpanded);
    expandBtn.innerHTML = controlsExpanded ? '▲' : '▼';
    expandBtn.title = controlsExpanded ? 'Collapse controls' : 'Expand controls';
  };

  expandBtn.addEventListener('click', toggleControls);
  // Also toggle when tapping the state indicator
  stateIndicator.addEventListener('click', toggleControls);

  // Update state indicator
  const updateStateIndicator = (isRunning, speed) => {
    const iconEl = stateIndicator.querySelector('.state-icon');
    const speedEl = stateIndicator.querySelector('.state-speed');
    if (iconEl) iconEl.textContent = isRunning ? '▶' : '⏸';
    if (speedEl) speedEl.textContent = `${speed}×`;
    stateIndicator.classList.toggle('running', isRunning);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TRACKING INDICATOR
  // ═══════════════════════════════════════════════════════════════════════════

  const trackingIndicator = document.createElement('div');
  trackingIndicator.className = 'tracking-indicator';
  trackingIndicator.innerHTML = '<span class="pulse"></span><span class="tracking-text">Following #--</span>';
  container.append(trackingIndicator);

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK ACTIONS (Right Side - Middle)
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
  recenterBtn.innerHTML = '⌖';
  recenterBtn.title = 'Recenter';
  recenterBtn.addEventListener('click', () => onRecenter?.());

  quickActions.append(zoomInBtn, zoomOutBtn, recenterBtn);
  container.append(quickActions);

  // ═══════════════════════════════════════════════════════════════════════════
  // FPS VISIBILITY STATE
  // ═══════════════════════════════════════════════════════════════════════════

  let fpsVisible = initialFpsVisible;
  const applyFpsVisible = (nextVisible, { save = true } = {}) => {
    fpsVisible = Boolean(nextVisible);
    fpsToggleBtn.classList.toggle('active', fpsVisible);
    metrics?.setVisible?.(fpsVisible);
    if (save) onFpsToggle?.(fpsVisible);
  };

  applyFpsVisible(fpsVisible, { save: false });

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMANCE PANEL
  // ═══════════════════════════════════════════════════════════════════════════

  const perfPanel = document.createElement('div');
  perfPanel.className = 'overlay-panel performance-panel bottom-right';

  const perfPanelHeader = document.createElement('div');
  perfPanelHeader.className = 'panel-header';

  const perfPanelTitle = document.createElement('h2');
  perfPanelTitle.className = 'panel-title';
  perfPanelTitle.innerHTML = '⚡ Performance';

  const perfPanelClose = document.createElement('button');
  perfPanelClose.className = 'panel-close';
  perfPanelClose.innerHTML = '×';

  perfPanelHeader.append(perfPanelTitle, perfPanelClose);

  const perfPanelBody = document.createElement('div');
  // Use shared panel-content styling (padding + scroll) for consistent mobile UX.
  perfPanelBody.className = 'panel-content';

  const perfSummaryList = document.createElement('div');
  perfSummaryList.className = 'metrics-list';

  const createSummaryItem = (label) => {
    const item = document.createElement('div');
    item.className = 'metrics-item';
    const labelEl = document.createElement('span');
    labelEl.className = 'metrics-item-label';
    labelEl.textContent = label;
    const valueEl = document.createElement('span');
    valueEl.className = 'metrics-item-value';
    valueEl.textContent = '--';
    item.append(labelEl, valueEl);
    return { item, valueEl };
  };

  const summaryNodes = {
    fps: createSummaryItem('FPS'),
    tps: createSummaryItem('TPS'),
    frameMs: createSummaryItem('Frame'),
    tickAvg: createSummaryItem('Tick avg'),
    renderAvg: createSummaryItem('Render avg'),
    windowMs: createSummaryItem('Window')
  };

  Object.values(summaryNodes).forEach(({ item }) => perfSummaryList.append(item));

  const perfControls = document.createElement('div');
  perfControls.className = 'perf-controls';

  const fpsOverlayBtn = document.createElement('button');
  fpsOverlayBtn.className = 'perf-toggle-btn';
  fpsOverlayBtn.addEventListener('click', () => applyFpsVisible(!fpsVisible));

  const profilerBtn = document.createElement('button');
  profilerBtn.className = 'perf-toggle-btn';
  profilerBtn.addEventListener('click', () => {
    const nextEnabled = !metrics?.isPerfEnabled?.();
    metrics?.setPerfEnabled?.(nextEnabled);
    updatePerfPanel();
  });

  const tickTimersBtn = document.createElement('button');
  tickTimersBtn.className = 'perf-toggle-btn';
  tickTimersBtn.addEventListener('click', () => {
    const groups = metrics?.getPerfGroups?.();
    metrics?.setPerfGroupEnabled?.('tick', !groups?.tick);
    updatePerfPanel();
  });

  const renderTimersBtn = document.createElement('button');
  renderTimersBtn.className = 'perf-toggle-btn';
  renderTimersBtn.addEventListener('click', () => {
    const groups = metrics?.getPerfGroups?.();
    metrics?.setPerfGroupEnabled?.('render', !groups?.render);
    updatePerfPanel();
  });

  const copyPerfBtn = document.createElement('button');
  copyPerfBtn.className = 'perf-toggle-btn';
  copyPerfBtn.textContent = 'Copy';
  copyPerfBtn.title = 'Copy performance snapshot to clipboard';

  perfControls.append(fpsOverlayBtn, profilerBtn, tickTimersBtn, renderTimersBtn, copyPerfBtn);

  const perfTimersList = document.createElement('div');
  // Use a single-column list for readability (timer values are long).
  perfTimersList.className = 'metrics-list perf-timers-list';

  perfPanelBody.append(perfSummaryList, perfControls, perfTimersList);
  perfPanel.append(perfPanelHeader, perfPanelBody);
  container.append(perfPanel);

  const formatNumber = (value, digits = 0) => {
    if (!Number.isFinite(value)) return '--';
    return digits > 0 ? value.toFixed(digits) : String(Math.round(value));
  };

  const formatMs = (value) => {
    if (!Number.isFinite(value)) return '--';
    return `${value.toFixed(2)} ms`;
  };

  const findTimer = (timers, name) => timers.find(timer => timer.name === name);

  // Stable ordering prevents “popping” as top timers reorder.
  const TICK_TIMER_ORDER = [
    'tick.total',
    'tick.spatialIndex',
    'tick.priority',
    'tick.perception',
    'tick.alertness',
    'tick.memory',
    'tick.chase',
    'tick.combat',
    'tick.intent',
    'tick.herding',
    'tick.pack',
    'tick.sprintDecision',
    'tick.movement',
    'tick.actions',
    'tick.basalMetabolism',
    'tick.sprintCosts',
    'tick.lifeStages',
    'tick.reproduction',
    'tick.deaths',
    'tick.staminaRegen',
    'tick.plants'
  ];

  const RENDER_TIMER_ORDER = ['render.total', 'render.terrain', 'render.creatures'];

  const timerValueEls = new Map();

  const createTimerRow = (name) => {
    const item = document.createElement('div');
    item.className = 'metrics-item';
    const labelEl = document.createElement('span');
    labelEl.className = 'metrics-item-label';
    labelEl.textContent = name;
    const valueEl = document.createElement('span');
    valueEl.className = 'metrics-item-value';
    valueEl.textContent = '--';
    item.append(labelEl, valueEl);
    timerValueEls.set(name, valueEl);
    return item;
  };

  // Render fixed timer rows once.
  const tickHeading = document.createElement('div');
  tickHeading.className = 'metrics-subheading';
  tickHeading.textContent = 'Tick timers';

  const renderHeading = document.createElement('div');
  renderHeading.className = 'metrics-subheading';
  renderHeading.textContent = 'Render timers';

  perfTimersList.append(tickHeading);
  for (const name of TICK_TIMER_ORDER) perfTimersList.append(createTimerRow(name));
  perfTimersList.append(renderHeading);
  for (const name of RENDER_TIMER_ORDER) perfTimersList.append(createTimerRow(name));

  const formatTimerValue = (timer) => {
    if (!timer) return 'No data';
    return `${timer.totalMs.toFixed(1)} ms • avg ${timer.avgMs.toFixed(2)} • max ${timer.maxMs.toFixed(2)} • ${timer.calls}x`;
  };

  const buildClipboardText = ({ snap, perfSnap, groups, timersByName }) => {
    const nowIso = new Date().toISOString();
    const tickTotal = timersByName.get('tick.total');
    const renderTotal = timersByName.get('render.total');

    const lines = [];
    lines.push('Genetics Performance Snapshot');
    lines.push(`Time: ${nowIso}`);
    lines.push('');
    lines.push(`FPS: ${Number.isFinite(snap?.fps) ? snap.fps : '--'}`);
    lines.push(`TPS: ${Number.isFinite(snap?.tps) ? snap.tps : '--'}`);
    lines.push(`Frame: ${Number.isFinite(snap?.frameMs) ? snap.frameMs.toFixed(2) : '--'} ms`);
    lines.push(
      `Tick avg (tick.total): ${Number.isFinite(tickTotal?.avgMs) ? tickTotal.avgMs.toFixed(2) : '--'} ms`
    );
    lines.push(
      `Render avg (render.total): ${Number.isFinite(renderTotal?.avgMs) ? renderTotal.avgMs.toFixed(2) : '--'} ms`
    );
    lines.push(`Perf window: ${Math.round(perfSnap?.windowMs ?? 0)} ms`);
    lines.push(`Profiler: ${(metrics?.isPerfEnabled?.() ?? false) ? 'ON' : 'OFF'}`);
    lines.push(`Groups: tick=${groups?.tick ? 'ON' : 'OFF'} render=${groups?.render ? 'ON' : 'OFF'}`);
    lines.push('');

    lines.push('TIMERS (name,totalMs,avgMs,maxMs,calls)');
    const allNames = [...TICK_TIMER_ORDER, ...RENDER_TIMER_ORDER];
    for (const name of allNames) {
      const t = timersByName.get(name);
      if (!t) {
        lines.push(`${name},,, ,`);
        continue;
      }
      lines.push(
        `${name},${t.totalMs.toFixed(3)},${t.avgMs.toFixed(3)},${t.maxMs.toFixed(3)},${t.calls}`
      );
    }
    return lines.join('\n');
  };

  const copyToClipboard = async (text) => {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    // Fallback for older/quirkier environments.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    ta.remove();
  };

  const updatePerfPanel = () => {
    const snap = metrics?.snapshot?.();
    const perfSnap = metrics?.getPerfSnapshot?.();
    const timers = Array.isArray(perfSnap?.timers) ? perfSnap.timers : [];
    const timersByName = new Map(timers.map(t => [t.name, t]));

    summaryNodes.fps.valueEl.textContent = formatNumber(snap?.fps);
    summaryNodes.tps.valueEl.textContent = formatNumber(snap?.tps);
    summaryNodes.frameMs.valueEl.textContent = formatMs(snap?.frameMs);
    summaryNodes.tickAvg.valueEl.textContent = formatMs(findTimer(timers, 'tick.total')?.avgMs);
    summaryNodes.renderAvg.valueEl.textContent = formatMs(findTimer(timers, 'render.total')?.avgMs);
    summaryNodes.windowMs.valueEl.textContent = `${Math.round(perfSnap?.windowMs ?? 0)} ms`;

    fpsOverlayBtn.classList.toggle('active', fpsVisible);
    fpsOverlayBtn.textContent = `FPS Overlay: ${fpsVisible ? 'ON' : 'OFF'}`;

    const profilerEnabled = metrics?.isPerfEnabled?.() ?? false;
    profilerBtn.classList.toggle('active', profilerEnabled);
    profilerBtn.textContent = `Profiler: ${profilerEnabled ? 'ON' : 'OFF'}`;

    const groups = metrics?.getPerfGroups?.() ?? { tick: false, render: false };
    tickTimersBtn.classList.toggle('active', groups.tick);
    tickTimersBtn.textContent = `Tick timers: ${groups.tick ? 'ON' : 'OFF'}`;
    renderTimersBtn.classList.toggle('active', groups.render);
    renderTimersBtn.textContent = `Render timers: ${groups.render ? 'ON' : 'OFF'}`;

    // Update fixed rows without reordering/rebuilding to avoid flicker.
    for (const name of TICK_TIMER_ORDER) {
      const valueEl = timerValueEls.get(name);
      if (!valueEl) continue;
      if (!profilerEnabled) {
        valueEl.textContent = 'Disabled';
      } else if (!groups.tick) {
        valueEl.textContent = 'OFF';
      } else {
        valueEl.textContent = formatTimerValue(timersByName.get(name));
      }
    }

    for (const name of RENDER_TIMER_ORDER) {
      const valueEl = timerValueEls.get(name);
      if (!valueEl) continue;
      if (!profilerEnabled) {
        valueEl.textContent = 'Disabled';
      } else if (!groups.render) {
        valueEl.textContent = 'OFF';
      } else {
        valueEl.textContent = formatTimerValue(timersByName.get(name));
      }
    }

    // Copy button uses the same snapshot to avoid mismatched values.
    copyPerfBtn.onclick = async () => {
      try {
        const text = buildClipboardText({ snap, perfSnap, groups, timersByName });
        await copyToClipboard(text);
        const prev = copyPerfBtn.textContent;
        copyPerfBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyPerfBtn.textContent = prev;
        }, 900);
      } catch (err) {
        console.error('Copy failed', err);
        const prev = copyPerfBtn.textContent;
        copyPerfBtn.textContent = 'Copy failed';
        setTimeout(() => {
          copyPerfBtn.textContent = prev;
        }, 1200);
      }
    };
  };

  let perfVisible = false;
  let perfIntervalId = null;

  const setPerfVisible = (nextVisible) => {
    perfVisible = Boolean(nextVisible);
    perfPanel.classList.toggle('visible', perfVisible);
    if (perfIntervalId) {
      clearInterval(perfIntervalId);
      perfIntervalId = null;
    }
    if (perfVisible) {
      if (metricsVisible) toggleMetrics();
      if (configVisible) toggleConfig();
      updatePerfPanel();
      // Update once per second for readability and lower UI churn.
      perfIntervalId = setInterval(updatePerfPanel, 1000);
    }
  };

  fpsToggleBtn.addEventListener('click', () => {
    setPerfVisible(!perfVisible);
  });

  perfPanelClose.addEventListener('click', () => {
    setPerfVisible(false);
  });

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

  // Metric definitions - matches simulation getSummary() output
  const metricDefinitions = [
    { key: 'creatureCount', label: 'Creatures', section: 'population', group: 'All' },
    { key: 'birthsLastTick', label: 'Births (tick)', section: 'population', group: 'All' },
    { key: 'birthsTotal', label: 'Births total', section: 'population', group: 'All' },
    { key: 'pregnanciesLastTick', label: 'Pregnancies (tick)', section: 'population', group: 'All' },
    { key: 'pregnanciesTotal', label: 'Pregnancies total', section: 'population', group: 'All' },
    { key: 'miscarriagesLastTick', label: 'Miscarriages (tick)', section: 'population', group: 'All' },
    { key: 'miscarriagesTotal', label: 'Miscarriages total', section: 'population', group: 'All' },
    { key: 'squaresCount', label: 'Population', section: 'population', group: 'Squares' },
    { key: 'birthsSquaresLastTick', label: 'Births (tick)', section: 'population', group: 'Squares' },
    { key: 'birthsSquaresTotal', label: 'Births total', section: 'population', group: 'Squares' },
    { key: 'pregnanciesSquaresLastTick', label: 'Pregnancies (tick)', section: 'population', group: 'Squares' },
    { key: 'pregnanciesSquaresTotal', label: 'Pregnancies total', section: 'population', group: 'Squares' },
    { key: 'miscarriagesSquaresLastTick', label: 'Miscarriages (tick)', section: 'population', group: 'Squares' },
    { key: 'miscarriagesSquaresTotal', label: 'Miscarriages total', section: 'population', group: 'Squares' },
    { key: 'trianglesCount', label: 'Population', section: 'population', group: 'Triangles' },
    { key: 'birthsTrianglesLastTick', label: 'Births (tick)', section: 'population', group: 'Triangles' },
    { key: 'birthsTrianglesTotal', label: 'Births total', section: 'population', group: 'Triangles' },
    {
      key: 'pregnanciesTrianglesLastTick',
      label: 'Pregnancies (tick)',
      section: 'population',
      group: 'Triangles'
    },
    {
      key: 'pregnanciesTrianglesTotal',
      label: 'Pregnancies total',
      section: 'population',
      group: 'Triangles'
    },
    {
      key: 'miscarriagesTrianglesLastTick',
      label: 'Miscarriages (tick)',
      section: 'population',
      group: 'Triangles'
    },
    {
      key: 'miscarriagesTrianglesTotal',
      label: 'Miscarriages total',
      section: 'population',
      group: 'Triangles'
    },
    { key: 'circlesCount', label: 'Population', section: 'population', group: 'Circles' },
    { key: 'birthsCirclesLastTick', label: 'Births (tick)', section: 'population', group: 'Circles' },
    { key: 'birthsCirclesTotal', label: 'Births total', section: 'population', group: 'Circles' },
    {
      key: 'pregnanciesCirclesLastTick',
      label: 'Pregnancies (tick)',
      section: 'population',
      group: 'Circles'
    },
    {
      key: 'pregnanciesCirclesTotal',
      label: 'Pregnancies total',
      section: 'population',
      group: 'Circles'
    },
    {
      key: 'miscarriagesCirclesLastTick',
      label: 'Miscarriages (tick)',
      section: 'population',
      group: 'Circles'
    },
    {
      key: 'miscarriagesCirclesTotal',
      label: 'Miscarriages total',
      section: 'population',
      group: 'Circles'
    },
    { key: 'octagonsCount', label: 'Population', section: 'population', group: 'Octagons' },
    {
      key: 'birthsOctagonsLastTick',
      label: 'Births (tick)',
      section: 'population',
      group: 'Octagons'
    },
    { key: 'birthsOctagonsTotal', label: 'Births total', section: 'population', group: 'Octagons' },
    {
      key: 'pregnanciesOctagonsLastTick',
      label: 'Pregnancies (tick)',
      section: 'population',
      group: 'Octagons'
    },
    {
      key: 'pregnanciesOctagonsTotal',
      label: 'Pregnancies total',
      section: 'population',
      group: 'Octagons'
    },
    {
      key: 'miscarriagesOctagonsLastTick',
      label: 'Miscarriages (tick)',
      section: 'population',
      group: 'Octagons'
    },
    {
      key: 'miscarriagesOctagonsTotal',
      label: 'Miscarriages total',
      section: 'population',
      group: 'Octagons'
    },
    { key: 'deathsTotal', label: 'Deaths total', section: 'deaths', group: 'All' },
    { key: 'deathsAge', label: 'Deaths (age)', section: 'deaths', group: 'All' },
    { key: 'deathsStarvation', label: 'Deaths (starvation)', section: 'deaths', group: 'All' },
    { key: 'deathsThirst', label: 'Deaths (thirst)', section: 'deaths', group: 'All' },
    { key: 'deathsInjury', label: 'Deaths (injury)', section: 'deaths', group: 'All' },
    { key: 'deathsOther', label: 'Deaths (other)', section: 'deaths', group: 'All' },
    { key: 'deathsSquaresTotal', label: 'Deaths total', section: 'deaths', group: 'Squares' },
    { key: 'deathsSquaresAge', label: 'Deaths (age)', section: 'deaths', group: 'Squares' },
    {
      key: 'deathsSquaresStarvation',
      label: 'Deaths (starvation)',
      section: 'deaths',
      group: 'Squares'
    },
    { key: 'deathsSquaresThirst', label: 'Deaths (thirst)', section: 'deaths', group: 'Squares' },
    { key: 'deathsSquaresInjury', label: 'Deaths (injury)', section: 'deaths', group: 'Squares' },
    { key: 'deathsSquaresOther', label: 'Deaths (other)', section: 'deaths', group: 'Squares' },
    { key: 'deathsTrianglesTotal', label: 'Deaths total', section: 'deaths', group: 'Triangles' },
    { key: 'deathsTrianglesAge', label: 'Deaths (age)', section: 'deaths', group: 'Triangles' },
    {
      key: 'deathsTrianglesStarvation',
      label: 'Deaths (starvation)',
      section: 'deaths',
      group: 'Triangles'
    },
    { key: 'deathsTrianglesThirst', label: 'Deaths (thirst)', section: 'deaths', group: 'Triangles' },
    { key: 'deathsTrianglesInjury', label: 'Deaths (injury)', section: 'deaths', group: 'Triangles' },
    { key: 'deathsTrianglesOther', label: 'Deaths (other)', section: 'deaths', group: 'Triangles' },
    { key: 'deathsCirclesTotal', label: 'Deaths total', section: 'deaths', group: 'Circles' },
    { key: 'deathsCirclesAge', label: 'Deaths (age)', section: 'deaths', group: 'Circles' },
    {
      key: 'deathsCirclesStarvation',
      label: 'Deaths (starvation)',
      section: 'deaths',
      group: 'Circles'
    },
    { key: 'deathsCirclesThirst', label: 'Deaths (thirst)', section: 'deaths', group: 'Circles' },
    { key: 'deathsCirclesInjury', label: 'Deaths (injury)', section: 'deaths', group: 'Circles' },
    { key: 'deathsCirclesOther', label: 'Deaths (other)', section: 'deaths', group: 'Circles' },
    { key: 'deathsOctagonsTotal', label: 'Deaths total', section: 'deaths', group: 'Octagons' },
    { key: 'deathsOctagonsAge', label: 'Deaths (age)', section: 'deaths', group: 'Octagons' },
    {
      key: 'deathsOctagonsStarvation',
      label: 'Deaths (starvation)',
      section: 'deaths',
      group: 'Octagons'
    },
    { key: 'deathsOctagonsThirst', label: 'Deaths (thirst)', section: 'deaths', group: 'Octagons' },
    { key: 'deathsOctagonsInjury', label: 'Deaths (injury)', section: 'deaths', group: 'Octagons' },
    { key: 'deathsOctagonsOther', label: 'Deaths (other)', section: 'deaths', group: 'Octagons' },
    { key: 'grassAverage', label: 'Grass avg', section: 'plants', group: 'All' },
    { key: 'grassTotal', label: 'Grass total', section: 'plants', group: 'All' },
    { key: 'grassCoverage', label: 'Grass coverage', section: 'plants', group: 'All' },
    { key: 'grassHotspotCells', label: 'Hotspot cells', section: 'plants', group: 'All' },
    { key: 'stressedCells', label: 'Stressed cells', section: 'plants', group: 'All' },
    { key: 'bushCount', label: 'Bush count', section: 'plants', group: 'All' },
    { key: 'berryTotal', label: 'Berry total', section: 'plants', group: 'All' },
    { key: 'berryAverage', label: 'Berries/bush', section: 'plants', group: 'All' },
    { key: 'bushAverageHealth', label: 'Bush health', section: 'plants', group: 'All' },
    { key: 'chaseAttempts', label: 'Chase attempts', section: 'chase', group: 'All' },
    { key: 'chaseSuccesses', label: 'Chase wins', section: 'chase', group: 'All' },
    { key: 'chaseLosses', label: 'Chase losses', section: 'chase', group: 'All' },
    { key: 'chaseSquaresAttempts', label: 'Chase attempts', section: 'chase', group: 'Squares' },
    { key: 'chaseSquaresSuccesses', label: 'Chase wins', section: 'chase', group: 'Squares' },
    { key: 'chaseSquaresLosses', label: 'Chase losses', section: 'chase', group: 'Squares' },
    {
      key: 'chaseTrianglesAttempts',
      label: 'Chase attempts',
      section: 'chase',
      group: 'Triangles'
    },
    { key: 'chaseTrianglesSuccesses', label: 'Chase wins', section: 'chase', group: 'Triangles' },
    { key: 'chaseTrianglesLosses', label: 'Chase losses', section: 'chase', group: 'Triangles' },
    { key: 'chaseCirclesAttempts', label: 'Chase attempts', section: 'chase', group: 'Circles' },
    { key: 'chaseCirclesSuccesses', label: 'Chase wins', section: 'chase', group: 'Circles' },
    { key: 'chaseCirclesLosses', label: 'Chase losses', section: 'chase', group: 'Circles' },
    { key: 'chaseOctagonsAttempts', label: 'Chase attempts', section: 'chase', group: 'Octagons' },
    { key: 'chaseOctagonsSuccesses', label: 'Chase wins', section: 'chase', group: 'Octagons' },
    { key: 'chaseOctagonsLosses', label: 'Chase losses', section: 'chase', group: 'Octagons' },
    { key: 'killsTotal', label: 'Kills total', section: 'hunting', group: 'All' },
    { key: 'carcassCount', label: 'Carcasses', section: 'hunting', group: 'All' },
    { key: 'carcassMeatTotal', label: 'Carcass meat', section: 'hunting', group: 'All' },
    { key: 'killsPredatorSquares', label: 'Kills as predator', section: 'hunting', group: 'Squares' },
    { key: 'killsPreySquares', label: 'Killed as prey', section: 'hunting', group: 'Squares' },
    { key: 'killsPredatorTriangles', label: 'Kills as predator', section: 'hunting', group: 'Triangles' },
    { key: 'killsPreyTriangles', label: 'Killed as prey', section: 'hunting', group: 'Triangles' },
    { key: 'killsPredatorCircles', label: 'Kills as predator', section: 'hunting', group: 'Circles' },
    { key: 'killsPreyCircles', label: 'Killed as prey', section: 'hunting', group: 'Circles' },
    { key: 'killsPredatorOctagons', label: 'Kills as predator', section: 'hunting', group: 'Octagons' },
    { key: 'killsPreyOctagons', label: 'Killed as prey', section: 'hunting', group: 'Octagons' },
    { key: 'mutationsLastTick', label: 'Mutations (tick)', section: 'genetics', group: 'All' },
    { key: 'mutationStrengthLastTick', label: 'Mutation drift', section: 'genetics', group: 'All' },
    { key: 'pleiotropyStrengthLastTick', label: 'Pleiotropy drift', section: 'genetics', group: 'All' },
    { key: 'mutationTotal', label: 'Mutations total', section: 'genetics', group: 'All' },
    { key: 'mutationsSquaresLastTick', label: 'Mutations (tick)', section: 'genetics', group: 'Squares' },
    { key: 'mutationsSquaresTotal', label: 'Mutations total', section: 'genetics', group: 'Squares' },
    { key: 'mutationStrengthSquaresLastTick', label: 'Mutation drift', section: 'genetics', group: 'Squares' },
    { key: 'mutationStrengthSquaresTotal', label: 'Mutation drift total', section: 'genetics', group: 'Squares' },
    { key: 'pleiotropyStrengthSquaresLastTick', label: 'Pleiotropy drift', section: 'genetics', group: 'Squares' },
    { key: 'pleiotropyStrengthSquaresTotal', label: 'Pleiotropy drift total', section: 'genetics', group: 'Squares' },
    { key: 'mutationsTrianglesLastTick', label: 'Mutations (tick)', section: 'genetics', group: 'Triangles' },
    { key: 'mutationsTrianglesTotal', label: 'Mutations total', section: 'genetics', group: 'Triangles' },
    {
      key: 'mutationStrengthTrianglesLastTick',
      label: 'Mutation drift',
      section: 'genetics',
      group: 'Triangles'
    },
    {
      key: 'mutationStrengthTrianglesTotal',
      label: 'Mutation drift total',
      section: 'genetics',
      group: 'Triangles'
    },
    {
      key: 'pleiotropyStrengthTrianglesLastTick',
      label: 'Pleiotropy drift',
      section: 'genetics',
      group: 'Triangles'
    },
    {
      key: 'pleiotropyStrengthTrianglesTotal',
      label: 'Pleiotropy drift total',
      section: 'genetics',
      group: 'Triangles'
    },
    { key: 'mutationsCirclesLastTick', label: 'Mutations (tick)', section: 'genetics', group: 'Circles' },
    { key: 'mutationsCirclesTotal', label: 'Mutations total', section: 'genetics', group: 'Circles' },
    {
      key: 'mutationStrengthCirclesLastTick',
      label: 'Mutation drift',
      section: 'genetics',
      group: 'Circles'
    },
    {
      key: 'mutationStrengthCirclesTotal',
      label: 'Mutation drift total',
      section: 'genetics',
      group: 'Circles'
    },
    {
      key: 'pleiotropyStrengthCirclesLastTick',
      label: 'Pleiotropy drift',
      section: 'genetics',
      group: 'Circles'
    },
    {
      key: 'pleiotropyStrengthCirclesTotal',
      label: 'Pleiotropy drift total',
      section: 'genetics',
      group: 'Circles'
    },
    { key: 'mutationsOctagonsLastTick', label: 'Mutations (tick)', section: 'genetics', group: 'Octagons' },
    { key: 'mutationsOctagonsTotal', label: 'Mutations total', section: 'genetics', group: 'Octagons' },
    {
      key: 'mutationStrengthOctagonsLastTick',
      label: 'Mutation drift',
      section: 'genetics',
      group: 'Octagons'
    },
    {
      key: 'mutationStrengthOctagonsTotal',
      label: 'Mutation drift total',
      section: 'genetics',
      group: 'Octagons'
    },
    {
      key: 'pleiotropyStrengthOctagonsLastTick',
      label: 'Pleiotropy drift',
      section: 'genetics',
      group: 'Octagons'
    },
    {
      key: 'pleiotropyStrengthOctagonsTotal',
      label: 'Pleiotropy drift total',
      section: 'genetics',
      group: 'Octagons'
    }
  ];

  // Store references to value elements for updating (plain object)
  const metricNodes = {};
  
  // Store references to metric items for tracking indicators
  const metricItems = {};
  
  // Reference to graphs panel (set later via setGraphsPanel)
  let graphsPanel = null;

  const createMetricSection = (sectionTitle, defs) => {
    const section = document.createElement('div');
    section.className = 'metrics-section';

    const titleEl = document.createElement('h3');
    titleEl.className = 'metrics-section-title';
    titleEl.textContent = sectionTitle;

    const list = document.createElement('ul');
    list.className = 'metrics-list';

    let currentGroup = null;
    for (const metric of defs) {
      if (metric.group && metric.group !== currentGroup) {
        currentGroup = metric.group;
        const groupItem = document.createElement('li');
        groupItem.className = 'metrics-subheading';
        groupItem.textContent = metric.group;
        list.appendChild(groupItem);
      }
      const item = document.createElement('li');
      item.className = 'metrics-item metrics-item-clickable';
      item.dataset.metricKey = metric.key;
      
      // Tracking indicator dot (hidden by default)
      const trackingDot = document.createElement('span');
      trackingDot.className = 'metrics-tracking-dot';
      
      const labelSpan = document.createElement('span');
      labelSpan.className = 'metrics-item-label';
      labelSpan.textContent = metric.label;

      const valueSpan = document.createElement('span');
      valueSpan.className = 'metrics-item-value';
      valueSpan.textContent = '--';
      
      // Build display label for graphs (include group context)
      const displayLabel = metric.group && metric.group !== 'All' 
        ? `${metric.group} ${metric.label}` 
        : metric.label;

      // Click handler to toggle graph tracking
      item.addEventListener('click', () => {
        if (!graphsPanel) return;
        
        if (graphsPanel.isTracked(metric.key)) {
          graphsPanel.removeMetric(metric.key);
        } else {
          graphsPanel.addMetric(metric.key, displayLabel);
        }
        updateMetricHighlights();
      });

      item.append(trackingDot, labelSpan, valueSpan);
      list.append(item);
      
      // Store references
      metricNodes[metric.key] = valueSpan;
      metricItems[metric.key] = { item, trackingDot };
    }

    section.append(titleEl, list);
    return section;
  };
  
  // Update tracking indicators on all metrics
  const updateMetricHighlights = () => {
    if (!graphsPanel) return;
    
    for (const [key, refs] of Object.entries(metricItems)) {
      const isTracked = graphsPanel.isTracked(key);
      const color = graphsPanel.getTrackedColor(key);
      
      refs.item.classList.toggle('tracking', isTracked);
      refs.trackingDot.classList.toggle('visible', isTracked);
      if (color) {
        refs.trackingDot.style.backgroundColor = color;
      }
    }
  };

  const sections = [
    { key: 'population', title: 'Population' },
    { key: 'deaths', title: 'Deaths' },
    { key: 'plants', title: 'Plants' },
    { key: 'chase', title: 'Chase' },
    { key: 'hunting', title: 'Hunting' },
    { key: 'genetics', title: 'Genetics' }
  ];

  for (const { key, title: sectionTitle } of sections) {
    const defs = metricDefinitions.filter(m => m.section === key);
    if (defs.length) {
      metricsBody.append(createMetricSection(sectionTitle, defs));
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
    if (metricsVisible && perfVisible) setPerfVisible(false);
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
    if (configVisible && perfVisible) setPerfVisible(false);
  };

  configFab.addEventListener('click', toggleConfig);

  // Assemble right FABs (FPS moved to top bar)
  fabContainerRight.append(metricsFab, configFab);
  container.append(fabContainerRight);

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Track current speed for state indicator
  let currentSpeed = 1;

  return {
    setStatus(message) {
      status.textContent = message;
    },

    setRunning(isRunning) {
      playBtn.disabled = isRunning;
      pauseBtn.disabled = !isRunning;
      stepBtn.disabled = isRunning;
      
      // Update play button style
      playBtn.classList.toggle('active', isRunning);
      pauseBtn.classList.toggle('active', !isRunning);
      
      // Update state indicator in collapsed header
      updateStateIndicator(isRunning, currentSpeed);
    },

    setSpeed(speed) {
      currentSpeed = speed;
      speedSelect.value = String(speed);
      // Update state indicator
      const stateIcon = stateIndicator.querySelector('.state-icon');
      const isRunning = stateIcon?.textContent === '▶';
      updateStateIndicator(isRunning, speed);
    },

    setSeed(seed) {
      seedInput.value = String(seed);
    },

    setFpsVisible(visible) {
      applyFpsVisible(visible, { save: false });
    },

    setMetrics(summary) {
      if (!summary) return;
      
      for (const key in metricNodes) {
        const node = metricNodes[key];
        const value = summary[key];
        node.textContent = formatMetricValue(key, value);
      }
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
    },
    
    // Set graphs panel reference for metric click handling
    setGraphsPanel(panel) {
      graphsPanel = panel;
    },
    
    // Update metric tracking highlights (called when graphs panel changes)
    updateMetricHighlights() {
      updateMetricHighlights();
    }
  };
}
