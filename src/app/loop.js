import { createTickClock } from './timebase.js';
import { getActivePerf } from '../metrics/perf-registry.js';

/** Owns timer/RAF lifecycle; bootstrap supplies initialized view dependencies. */
export function createAppLoop({
  sim,
  renderer,
  metrics,
  updateCameraFollow,
  getUI,
  getGraphsPanel,
  getInspector,
  initialSpeed = 1
}) {
  // Simulation loop state
  let running = false;
  let speed = initialSpeed;
  let rafId = null;
  let tickTimerId = null;
  const tickClock = createTickClock();
  let lastFrameStartMs = null;
  let lastFrameTotalMs = 0;

  const tickLoopIntervalMs = 16;

  const tickOnce = () => {
    sim.tick();
    updateCameraFollow();
    renderer.render(sim, { immediate: !running });
    metrics.recordFrame();
    const summary = sim.getSummary();
    getUI().setMetrics?.(summary);
    getGraphsPanel().recordMetrics(summary);
    getInspector().update({ creatures: sim.state?.creatures, tick: sim.state?.tick });
    metrics.update({ ticks: 1 });
  };

  const resetTickTimebase = () => {
    tickClock.reset(performance.now());
  };

  const runFrame = (_time) => {
    const perf = getActivePerf();
    const now = performance.now();

    if (lastFrameStartMs !== null) {
      const deltaMs = now - lastFrameStartMs;
      if (perf) {
        perf.end('frame.delta', now - deltaMs);
      }

      const waitMs = Math.max(0, deltaMs - lastFrameTotalMs);
      if (perf) {
        perf.end('frame.wait', now - waitMs);
      }
    }

    const tTotal = perf?.start('frame.total');
    try {
      const tFollow = perf?.start('frame.cameraFollow');
      updateCameraFollow();
      perf?.end('frame.cameraFollow', tFollow);

      const tRender = perf?.start('frame.render');
      renderer.render(sim, { immediate: !running });
      perf?.end('frame.render', tRender);
      metrics.recordFrame();

      const tSummary = perf?.start('frame.summary');
      const summary = sim.getSummary();
      perf?.end('frame.summary', tSummary);

      const tSetMetrics = perf?.start('frame.ui.setMetrics');
      getUI().setMetrics?.(summary);
      perf?.end('frame.ui.setMetrics', tSetMetrics);

      const tGraphs = perf?.start('frame.ui.graphsRecord');
      getGraphsPanel().recordMetrics(summary);
      perf?.end('frame.ui.graphsRecord', tGraphs);

      const tInspector = perf?.start('frame.ui.inspector');
      getInspector().update({ creatures: sim.state?.creatures, tick: sim.state?.tick });
      perf?.end('frame.ui.inspector', tInspector);

      if (running) {
        const tRaf = perf?.start('frame.rafSchedule');
        rafId = requestAnimationFrame(runFrame);
        perf?.end('frame.rafSchedule', tRaf);
      }
    } finally {
      perf?.end('frame.total', tTotal);
      const endNow = performance.now();
      lastFrameTotalMs = endNow - now;
      lastFrameStartMs = now;
    }
  };

  const runTicks = () => {
    if (!running) return;

    const now = performance.now();
    const ticksThisInterval = tickClock.advance(now, {
      ticksPerSecond: sim.config?.ticksPerSecond ?? 1,
      speed,
      tick: () => sim.tick()
    });

    if (ticksThisInterval > 0) {
      metrics.update({ ticks: ticksThisInterval, time: now });
    }
  };

  const startTickLoop = () => {
    if (tickTimerId) return;
    tickTimerId = window.setInterval(runTicks, tickLoopIntervalMs);
  };

  const stopTickLoop = () => {
    if (tickTimerId) {
      clearInterval(tickTimerId);
      tickTimerId = null;
    }
  };

  const start = () => {
    if (running) return;
    running = true;
    getUI().setRunning(true);
    resetTickTimebase();
    startTickLoop();
    rafId = requestAnimationFrame(runFrame);
  };

  const pause = () => {
    if (!running) return;
    running = false;
    getUI().setRunning(false);
    stopTickLoop();
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    resetTickTimebase();
    renderer.render(sim, { immediate: true });
  };

  return {
    start,
    pause,
    tickOnce,
    resetTimebase: resetTickTimebase,
    isRunning: () => running,
    getSpeed: () => speed,
    setSpeed(nextSpeed) {
      speed = Number.isFinite(nextSpeed) ? Math.max(1, nextSpeed) : 1;
      getUI().setSpeed(speed);
      resetTickTimebase();
    }
  };
}
