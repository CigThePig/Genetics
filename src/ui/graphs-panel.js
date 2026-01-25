/**
 * Graphs Panel - Mobile-Optimized Time-Series Visualization
 * 
 * Features:
 * - Touch-friendly bottom sheet pattern
 * - Swipeable metric categories
 * - Species comparison overlays
 * - Births vs Deaths toggle
 * - Efficient canvas rendering with ring buffer
 */

import { SPECIES } from '../sim/species.js';

// Ring buffer size - how many ticks of history to keep
const HISTORY_SIZE = 600;
const SAMPLE_INTERVAL = 1; // Record every N ticks

// Species colors matching your existing theme
const SPECIES_COLORS = {
  [SPECIES.SQUARE]: '#4ade80',    // Green
  [SPECIES.TRIANGLE]: '#f87171',  // Red
  [SPECIES.CIRCLE]: '#60a5fa',    // Blue
  [SPECIES.OCTAGON]: '#fb923c'    // Orange
};

const ALL_COLOR = '#e7e9ea'; // White for totals

// Metric definitions grouped by category
const METRIC_CATEGORIES = {
  population: {
    label: 'Population',
    icon: '👥',
    metrics: {
      total: { key: 'creatureCount', label: 'Total', color: ALL_COLOR },
      [SPECIES.SQUARE]: { key: 'squaresCount', label: 'Squares', color: SPECIES_COLORS[SPECIES.SQUARE] },
      [SPECIES.TRIANGLE]: { key: 'trianglesCount', label: 'Triangles', color: SPECIES_COLORS[SPECIES.TRIANGLE] },
      [SPECIES.CIRCLE]: { key: 'circlesCount', label: 'Circles', color: SPECIES_COLORS[SPECIES.CIRCLE] },
      [SPECIES.OCTAGON]: { key: 'octagonsCount', label: 'Octagons', color: SPECIES_COLORS[SPECIES.OCTAGON] }
    }
  },
  births: {
    label: 'Births',
    icon: '🐣',
    metrics: {
      total: { key: 'birthsTotal', label: 'Total', color: ALL_COLOR },
      [SPECIES.SQUARE]: { key: 'birthsSquaresTotal', label: 'Squares', color: SPECIES_COLORS[SPECIES.SQUARE] },
      [SPECIES.TRIANGLE]: { key: 'birthsTrianglesTotal', label: 'Triangles', color: SPECIES_COLORS[SPECIES.TRIANGLE] },
      [SPECIES.CIRCLE]: { key: 'birthsCirclesTotal', label: 'Circles', color: SPECIES_COLORS[SPECIES.CIRCLE] },
      [SPECIES.OCTAGON]: { key: 'birthsOctagonsTotal', label: 'Octagons', color: SPECIES_COLORS[SPECIES.OCTAGON] }
    }
  },
  deaths: {
    label: 'Deaths',
    icon: '💀',
    metrics: {
      total: { key: 'deathsTotal', label: 'Total', color: ALL_COLOR },
      [SPECIES.SQUARE]: { key: 'deathsSquaresTotal', label: 'Squares', color: SPECIES_COLORS[SPECIES.SQUARE] },
      [SPECIES.TRIANGLE]: { key: 'deathsTrianglesTotal', label: 'Triangles', color: SPECIES_COLORS[SPECIES.TRIANGLE] },
      [SPECIES.CIRCLE]: { key: 'deathsCirclesTotal', label: 'Circles', color: SPECIES_COLORS[SPECIES.CIRCLE] },
      [SPECIES.OCTAGON]: { key: 'deathsOctagonsTotal', label: 'Octagons', color: SPECIES_COLORS[SPECIES.OCTAGON] }
    }
  },
  resources: {
    label: 'Resources',
    icon: '🌿',
    metrics: {
      grass: { key: 'grassTotal', label: 'Grass', color: '#4ade80' },
      bushes: { key: 'bushCount', label: 'Bushes', color: '#22c55e' },
      berries: { key: 'berryTotal', label: 'Berries', color: '#a78bfa' },
      carcasses: { key: 'carcassCount', label: 'Carcasses', color: '#f87171' }
    }
  },
  hunting: {
    label: 'Hunting',
    icon: '🎯',
    metrics: {
      attempts: { key: 'chaseAttempts', label: 'Attempts', color: '#60a5fa' },
      successes: { key: 'chaseSuccesses', label: 'Catches', color: '#4ade80' },
      losses: { key: 'chaseLosses', label: 'Escapes', color: '#f87171' },
      kills: { key: 'killsTotal', label: 'Kills', color: '#fb923c' }
    }
  }
};

// Time window presets
const TIME_WINDOWS = [
  { label: '100', ticks: 100 },
  { label: '300', ticks: 300 },
  { label: 'All', ticks: HISTORY_SIZE }
];

/**
 * Creates the graphs panel system
 */
export function createGraphsPanel({ container }) {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  let visible = false;
  let currentCategory = 'population';
  let enabledSeries = new Set(['total', SPECIES.SQUARE, SPECIES.TRIANGLE, SPECIES.CIRCLE, SPECIES.OCTAGON]);
  let timeWindow = HISTORY_SIZE;
  let lastRecordedTick = -1;
  
  // Ring buffer for time-series data
  const history = {
    ticks: new Array(HISTORY_SIZE).fill(0),
    data: {},
    head: 0,
    count: 0
  };
  
  // Initialize data arrays for all metrics
  for (const cat of Object.values(METRIC_CATEGORIES)) {
    for (const metric of Object.values(cat.metrics)) {
      history.data[metric.key] = new Array(HISTORY_SIZE).fill(0);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DOM CREATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Main panel (bottom sheet style)
  const panel = document.createElement('div');
  panel.className = 'graphs-panel';
  
  // Header with drag handle
  const header = document.createElement('div');
  header.className = 'graphs-header';
  
  const dragHandle = document.createElement('div');
  dragHandle.className = 'graphs-drag-handle';
  
  const headerTitle = document.createElement('h2');
  headerTitle.className = 'graphs-title';
  headerTitle.textContent = '📈 Graphs';
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'graphs-close';
  closeBtn.innerHTML = '×';
  closeBtn.addEventListener('click', () => toggle(false));
  
  header.append(dragHandle, headerTitle, closeBtn);
  
  // Category tabs (horizontal scroll on mobile)
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'graphs-tabs-container';
  
  const tabs = document.createElement('div');
  tabs.className = 'graphs-tabs';
  
  const categoryButtons = {};
  for (const [catKey, cat] of Object.entries(METRIC_CATEGORIES)) {
    const tab = document.createElement('button');
    tab.className = 'graphs-tab';
    tab.dataset.category = catKey;
    tab.innerHTML = `<span class="tab-icon">${cat.icon}</span><span class="tab-label">${cat.label}</span>`;
    tab.addEventListener('click', () => setCategory(catKey));
    tabs.append(tab);
    categoryButtons[catKey] = tab;
  }
  
  tabsContainer.append(tabs);
  
  // Graph area
  const graphArea = document.createElement('div');
  graphArea.className = 'graphs-area';
  
  // Canvas for the graph
  const canvas = document.createElement('canvas');
  canvas.className = 'graphs-canvas';
  const ctx = canvas.getContext('2d');
  
  graphArea.append(canvas);
  
  // Controls row (series toggles + time window)
  const controls = document.createElement('div');
  controls.className = 'graphs-controls';
  
  // Series toggles
  const seriesGroup = document.createElement('div');
  seriesGroup.className = 'graphs-series-group';
  
  const seriesLabel = document.createElement('span');
  seriesLabel.className = 'graphs-control-label';
  seriesLabel.textContent = 'Show:';
  seriesGroup.append(seriesLabel);
  
  const seriesToggles = document.createElement('div');
  seriesToggles.className = 'graphs-series-toggles';
  seriesGroup.append(seriesToggles);
  
  // Time window selector
  const timeGroup = document.createElement('div');
  timeGroup.className = 'graphs-time-group';
  
  const timeLabel = document.createElement('span');
  timeLabel.className = 'graphs-control-label';
  timeLabel.textContent = 'Ticks:';
  timeGroup.append(timeLabel);
  
  const timeButtons = document.createElement('div');
  timeButtons.className = 'graphs-time-buttons';
  
  for (const tw of TIME_WINDOWS) {
    const btn = document.createElement('button');
    btn.className = 'graphs-time-btn';
    btn.textContent = tw.label;
    btn.dataset.ticks = tw.ticks;
    btn.addEventListener('click', () => setTimeWindow(tw.ticks));
    timeButtons.append(btn);
  }
  
  timeGroup.append(timeButtons);
  controls.append(seriesGroup, timeGroup);
  
  // Stats row (current values)
  const statsRow = document.createElement('div');
  statsRow.className = 'graphs-stats';
  
  // Assemble panel
  panel.append(header, tabsContainer, graphArea, controls, statsRow);
  container.append(panel);
  
  // FAB button
  const fab = document.createElement('button');
  fab.className = 'fab graphs-fab';
  fab.innerHTML = '📈';
  fab.title = 'Graphs';
  fab.addEventListener('click', () => toggle());
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDERING
  // ═══════════════════════════════════════════════════════════════════════════
  
  const resizeCanvas = () => {
    const rect = graphArea.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);
  };
  
  const renderGraph = () => {
    if (!visible) return;
    
    const rect = graphArea.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    if (width === 0 || height === 0) return;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    const cat = METRIC_CATEGORIES[currentCategory];
    if (!cat) return;
    
    // Gather data points for enabled series
    const seriesData = [];
    let globalMin = Infinity;
    let globalMax = -Infinity;
    
    for (const [seriesKey, metric] of Object.entries(cat.metrics)) {
      if (!enabledSeries.has(seriesKey)) continue;
      
      const points = [];
      const dataArr = history.data[metric.key];
      const tickArr = history.ticks;
      
      // Calculate how many points to show based on time window
      const pointCount = Math.min(history.count, timeWindow);
      const startIdx = (history.head - pointCount + HISTORY_SIZE) % HISTORY_SIZE;
      
      for (let i = 0; i < pointCount; i++) {
        const idx = (startIdx + i) % HISTORY_SIZE;
        const value = dataArr[idx];
        points.push({ tick: tickArr[idx], value });
        if (value < globalMin) globalMin = value;
        if (value > globalMax) globalMax = value;
      }
      
      seriesData.push({
        key: seriesKey,
        label: metric.label,
        color: metric.color,
        points
      });
    }
    
    if (seriesData.length === 0 || seriesData[0].points.length === 0) {
      // No data yet
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet - run simulation', width / 2, height / 2);
      return;
    }
    
    // Add padding to range
    const range = globalMax - globalMin;
    const padding = range * 0.1 || 1;
    globalMin = Math.max(0, globalMin - padding);
    globalMax = globalMax + padding;
    
    // Draw grid
    const gridColor = 'rgba(255,255,255,0.08)';
    const labelColor = 'rgba(255,255,255,0.4)';
    const marginLeft = 45;
    const marginRight = 10;
    const marginTop = 10;
    const marginBottom = 25;
    const graphWidth = width - marginLeft - marginRight;
    const graphHeight = height - marginTop - marginBottom;
    
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    // Horizontal grid lines (4 lines)
    const ySteps = 4;
    ctx.font = '10px system-ui';
    ctx.fillStyle = labelColor;
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= ySteps; i++) {
      const y = marginTop + (graphHeight * i) / ySteps;
      const value = globalMax - ((globalMax - globalMin) * i) / ySteps;
      
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(width - marginRight, y);
      ctx.stroke();
      
      ctx.fillText(formatValue(value), marginLeft - 5, y + 3);
    }
    
    // X-axis labels (tick numbers)
    const pointCount = seriesData[0].points.length;
    if (pointCount > 1) {
      const firstTick = seriesData[0].points[0].tick;
      const lastTick = seriesData[0].points[pointCount - 1].tick;
      
      ctx.textAlign = 'center';
      ctx.fillText(String(firstTick), marginLeft, height - 5);
      ctx.fillText(String(lastTick), width - marginRight, height - 5);
    }
    
    // Draw each series
    for (const series of seriesData) {
      if (series.points.length < 2) continue;
      
      ctx.beginPath();
      ctx.strokeStyle = series.color;
      ctx.lineWidth = 2;
      
      for (let i = 0; i < series.points.length; i++) {
        const x = marginLeft + (i / (series.points.length - 1)) * graphWidth;
        const y = marginTop + (1 - (series.points[i].value - globalMin) / (globalMax - globalMin)) * graphHeight;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
    }
    
    // Update stats row with current values
    updateStats(seriesData);
  };
  
  const formatValue = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    if (value >= 100) return Math.round(value).toString();
    if (value >= 10) return value.toFixed(1);
    return value.toFixed(2);
  };
  
  const updateStats = (seriesData) => {
    statsRow.innerHTML = '';
    
    for (const series of seriesData) {
      const lastValue = series.points.length > 0 
        ? series.points[series.points.length - 1].value 
        : 0;
      
      const stat = document.createElement('div');
      stat.className = 'graphs-stat';
      stat.innerHTML = `
        <span class="stat-dot" style="background:${series.color}"></span>
        <span class="stat-label">${series.label}</span>
        <span class="stat-value">${formatValue(lastValue)}</span>
      `;
      statsRow.append(stat);
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONTROLS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const setCategory = (catKey) => {
    currentCategory = catKey;
    
    // Update tab active state
    for (const [key, btn] of Object.entries(categoryButtons)) {
      btn.classList.toggle('active', key === catKey);
    }
    
    // Rebuild series toggles for this category
    rebuildSeriesToggle();
    renderGraph();
  };
  
  const rebuildSeriesToggle = () => {
    seriesToggles.innerHTML = '';
    const cat = METRIC_CATEGORIES[currentCategory];
    if (!cat) return;
    
    for (const [seriesKey, metric] of Object.entries(cat.metrics)) {
      const toggle = document.createElement('button');
      toggle.className = 'graphs-series-toggle';
      toggle.classList.toggle('active', enabledSeries.has(seriesKey));
      toggle.style.setProperty('--series-color', metric.color);
      toggle.innerHTML = `<span class="toggle-dot"></span><span class="toggle-label">${metric.label}</span>`;
      toggle.addEventListener('click', () => {
        if (enabledSeries.has(seriesKey)) {
          enabledSeries.delete(seriesKey);
        } else {
          enabledSeries.add(seriesKey);
        }
        toggle.classList.toggle('active', enabledSeries.has(seriesKey));
        renderGraph();
      });
      seriesToggles.append(toggle);
    }
  };
  
  const setTimeWindow = (ticks) => {
    timeWindow = ticks;
    
    // Update button active state
    for (const btn of timeButtons.children) {
      btn.classList.toggle('active', Number(btn.dataset.ticks) === ticks);
    }
    
    renderGraph();
  };
  
  const toggle = (forceState) => {
    visible = forceState !== undefined ? forceState : !visible;
    panel.classList.toggle('visible', visible);
    fab.classList.toggle('active', visible);
    
    if (visible) {
      // Resize and render when becoming visible
      setTimeout(() => {
        resizeCanvas();
        renderGraph();
      }, 50);
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DATA RECORDING
  // ═══════════════════════════════════════════════════════════════════════════
  
  const recordMetrics = (summary) => {
    if (!summary) return;
    
    const tick = summary.tick ?? 0;
    
    // Skip if we already recorded this tick or not enough interval passed
    if (tick <= lastRecordedTick) return;
    if ((tick - lastRecordedTick) < SAMPLE_INTERVAL && lastRecordedTick > 0) return;
    
    lastRecordedTick = tick;
    
    // Store tick number
    history.ticks[history.head] = tick;
    
    // Store all metric values
    for (const cat of Object.values(METRIC_CATEGORIES)) {
      for (const metric of Object.values(cat.metrics)) {
        const value = summary[metric.key];
        history.data[metric.key][history.head] = Number.isFinite(value) ? value : 0;
      }
    }
    
    // Advance ring buffer
    history.head = (history.head + 1) % HISTORY_SIZE;
    if (history.count < HISTORY_SIZE) history.count++;
    
    // Re-render if visible
    if (visible) {
      renderGraph();
    }
  };
  
  const reset = () => {
    history.head = 0;
    history.count = 0;
    lastRecordedTick = -1;
    history.ticks.fill(0);
    for (const key in history.data) {
      history.data[key].fill(0);
    }
    if (visible) {
      renderGraph();
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Set initial states
  setCategory('population');
  setTimeWindow(HISTORY_SIZE);
  
  // Handle resize
  const resizeObserver = new ResizeObserver(() => {
    if (visible) {
      resizeCanvas();
      renderGraph();
    }
  });
  resizeObserver.observe(graphArea);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════
  
  return {
    fab,
    toggle,
    recordMetrics,
    reset,
    isVisible: () => visible
  };
}
