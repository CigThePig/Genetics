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
      item.className = 'metrics-item';

      const labelSpan = document.createElement('span');
      labelSpan.className = 'metrics-item-label';
      labelSpan.textContent = metric.label;

      const valueSpan = document.createElement('span');
      valueSpan.className = 'metrics-item-value';
      valueSpan.textContent = '--';

      item.append(labelSpan, valueSpan);
      list.append(item);
      
      // Store reference using plain object
      metricNodes[metric.key] = valueSpan;
    }

    section.append(titleEl, list);
    return section;
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
  // FPS FAB
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

    setMetrics(summary) {
      if (!summary) return;
      
      for (const key in metricNodes) {
        const node = metricNodes[key];
        const value = summary[key];
        node.textContent = formatMetricValue(key, value);
      }
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
