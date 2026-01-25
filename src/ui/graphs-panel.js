/**
 * Graphs Panel - Integrated with Metrics Panel
 * 
 * Click any metric in the metrics panel to track it on the graph.
 * Multiple metrics can be compared together.
 * 
 * Features:
 * - Bottom sheet pattern (mobile optimized)
 * - Ring buffer for efficient history storage
 * - Canvas rendering for performance
 * - Dynamic metric selection from metrics panel
 */

// Ring buffer size - how many ticks of history to keep
const HISTORY_SIZE = 600;

// Color palette for tracked metrics (cycles through these)
const METRIC_COLORS = [
  '#4ade80',  // Green
  '#60a5fa',  // Blue  
  '#f87171',  // Red
  '#fb923c',  // Orange
  '#a78bfa',  // Purple
  '#22d3ee',  // Cyan
  '#fbbf24',  // Yellow
  '#e879f9',  // Pink
];

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
  let timeWindow = HISTORY_SIZE;
  let lastRecordedTick = -1;
  
  // Tracked metrics: Map of metricKey -> { label, color }
  const trackedMetrics = new Map();
  let colorIndex = 0;
  
  // Ring buffer for time-series data
  const history = {
    ticks: new Array(HISTORY_SIZE).fill(0),
    data: {},  // metricKey -> Float32Array
    head: 0,
    count: 0
  };
  
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
  headerTitle.textContent = '📉 Graphs';
  
  const headerHint = document.createElement('span');
  headerHint.className = 'graphs-hint';
  headerHint.textContent = 'Tap metrics to track';
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'graphs-close';
  closeBtn.innerHTML = '×';
  closeBtn.addEventListener('click', () => toggle(false));
  
  header.append(dragHandle, headerTitle, headerHint, closeBtn);
  
  // Tracked metrics chips (shows what's currently being graphed)
  const trackedChips = document.createElement('div');
  trackedChips.className = 'graphs-tracked-chips';
  
  // Graph area
  const graphArea = document.createElement('div');
  graphArea.className = 'graphs-area';
  
  // Canvas for the graph
  const canvas = document.createElement('canvas');
  canvas.className = 'graphs-canvas';
  const ctx = canvas.getContext('2d');
  
  graphArea.append(canvas);
  
  // Controls row (time window + clear)
  const controls = document.createElement('div');
  controls.className = 'graphs-controls';
  
  // Time window selector
  const timeGroup = document.createElement('div');
  timeGroup.className = 'graphs-time-group';
  
  const timeLabel = document.createElement('span');
  timeLabel.className = 'graphs-control-label';
  timeLabel.textContent = 'Window:';
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
  
  // Clear all button
  const clearBtn = document.createElement('button');
  clearBtn.className = 'graphs-clear-btn';
  clearBtn.textContent = '✕ Clear All';
  clearBtn.addEventListener('click', () => {
    trackedMetrics.clear();
    colorIndex = 0;
    updateTrackedChips();
    renderGraph();
    // Notify UI to update metric highlights
    onMetricsChanged?.();
  });
  
  controls.append(timeGroup, clearBtn);
  
  // Stats row (current values)
  const statsRow = document.createElement('div');
  statsRow.className = 'graphs-stats';
  
  // Assemble panel
  panel.append(header, trackedChips, graphArea, controls, statsRow);
  container.append(panel);
  
  // Callback for when tracked metrics change (UI will update highlights)
  let onMetricsChanged = null;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TRACKED CHIPS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const updateTrackedChips = () => {
    trackedChips.innerHTML = '';
    
    if (trackedMetrics.size === 0) {
      const emptyHint = document.createElement('span');
      emptyHint.className = 'graphs-empty-hint';
      emptyHint.textContent = 'No metrics tracked. Tap 📊 Metrics → select items to graph.';
      trackedChips.append(emptyHint);
      headerHint.style.display = 'block';
      return;
    }
    
    headerHint.style.display = 'none';
    
    for (const [key, info] of trackedMetrics) {
      const chip = document.createElement('button');
      chip.className = 'graphs-chip';
      chip.style.setProperty('--chip-color', info.color);
      chip.innerHTML = `<span class="chip-dot"></span><span class="chip-label">${info.label}</span><span class="chip-remove">×</span>`;
      chip.addEventListener('click', () => {
        removeMetric(key);
      });
      trackedChips.append(chip);
    }
  };
  
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
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
    
    if (trackedMetrics.size === 0) {
      // No data yet
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Tap metrics in 📊 panel to track them here', width / 2, height / 2);
      return;
    }
    
    // Gather data points for tracked metrics
    const seriesData = [];
    let globalMin = Infinity;
    let globalMax = -Infinity;
    
    for (const [key, info] of trackedMetrics) {
      const dataArr = history.data[key];
      if (!dataArr) continue;
      
      const points = [];
      const tickArr = history.ticks;
      
      // Calculate how many points to show based on time window
      const pointCount = Math.min(history.count, timeWindow);
      if (pointCount === 0) continue;
      
      const startIdx = (history.head - pointCount + HISTORY_SIZE) % HISTORY_SIZE;
      
      for (let i = 0; i < pointCount; i++) {
        const idx = (startIdx + i) % HISTORY_SIZE;
        const value = dataArr[idx];
        points.push({ tick: tickArr[idx], value });
        if (value < globalMin) globalMin = value;
        if (value > globalMax) globalMax = value;
      }
      
      seriesData.push({
        key,
        label: info.label,
        color: info.color,
        points
      });
    }
    
    if (seriesData.length === 0 || seriesData[0].points.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Run simulation to see data', width / 2, height / 2);
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
    const marginLeft = 50;
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
    if (!Number.isFinite(value)) return '--';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    if (value >= 100) return Math.round(value).toString();
    if (value >= 10) return value.toFixed(1);
    if (value >= 1) return value.toFixed(2);
    return value.toFixed(3);
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
    
    if (visible) {
      // Resize and render when becoming visible
      setTimeout(() => {
        resizeCanvas();
        renderGraph();
      }, 50);
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // METRIC TRACKING
  // ═══════════════════════════════════════════════════════════════════════════
  
  const addMetric = (key, label) => {
    if (trackedMetrics.has(key)) return false;
    
    // Assign a color
    const color = METRIC_COLORS[colorIndex % METRIC_COLORS.length];
    colorIndex++;
    
    trackedMetrics.set(key, { label, color });
    
    // Ensure we have a data array for this metric
    if (!history.data[key]) {
      history.data[key] = new Float32Array(HISTORY_SIZE);
    }
    
    updateTrackedChips();
    
    // Auto-open the graphs panel when first metric is added
    if (trackedMetrics.size === 1 && !visible) {
      toggle(true);
    }
    
    renderGraph();
    return true;
  };
  
  const removeMetric = (key) => {
    trackedMetrics.delete(key);
    updateTrackedChips();
    renderGraph();
    onMetricsChanged?.();
  };
  
  const isTracked = (key) => trackedMetrics.has(key);
  
  const getTrackedColor = (key) => trackedMetrics.get(key)?.color ?? null;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DATA RECORDING
  // ═══════════════════════════════════════════════════════════════════════════
  
  const recordMetrics = (summary) => {
    if (!summary) return;
    
    const tick = summary.tick ?? 0;
    
    // Skip if we already recorded this tick
    if (tick <= lastRecordedTick) return;
    
    lastRecordedTick = tick;
    
    // Store tick number
    history.ticks[history.head] = tick;
    
    // Store all values from summary (so we have data when metrics are added later)
    for (const [key, value] of Object.entries(summary)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        if (!history.data[key]) {
          history.data[key] = new Float32Array(HISTORY_SIZE);
        }
        history.data[key][history.head] = value;
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
  setTimeWindow(HISTORY_SIZE);
  updateTrackedChips();
  
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
    toggle,
    recordMetrics,
    reset,
    isVisible: () => visible,
    
    // Metric tracking API (called by metrics panel)
    addMetric,
    removeMetric,
    isTracked,
    getTrackedColor,
    
    // Callback setter
    setOnMetricsChanged(callback) {
      onMetricsChanged = callback;
    }
  };
}
