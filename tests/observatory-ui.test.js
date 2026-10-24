// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUI } from '../src/ui/index.js';
import { createPanelController } from '../src/ui/panel-controller.js';
import { createLiveInspector } from '../src/ui/live-inspector.js';

let app;
beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  app = document.querySelector('#app');
});
const setup = (options = {}) => {
  const panelController = createPanelController(app);
  const ui = createUI({ panelController, ...options });
  const inspector = createLiveInspector({ container: app, panelController });
  return { ui, inspector };
};

describe('observatory interactions', () => {
  it('switches panels without leaving stale controls and restores focus on Escape', async () => {
    setup();
    app.querySelector('.fab-metrics').click();
    await Promise.resolve();
    expect(app.querySelector('.metrics-panel').inert).toBe(false);
    app.querySelector('.fab-config').click();
    await Promise.resolve();
    expect(app.querySelector('.metrics-panel').inert).toBe(true);
    app.querySelector('[aria-label="Inspector"]').click();
    await Promise.resolve();
    expect(app.querySelector('.config-panel').inert).toBe(true);
    expect(app.querySelectorAll('.overlay-panel.visible')).toHaveLength(1);
    document.activeElement.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
    expect(app.querySelectorAll('.overlay-panel.visible')).toHaveLength(0);
    expect(document.activeElement.getAttribute('aria-label')).toBe('Inspector');
    expect(app.dataset.panelOpen).toBeUndefined();
  });

  it('updates the census from supplied state including zero counts after reset', () => {
    const { ui } = setup();
    ui.setSeed(42);
    ui.setMetrics({
      tick: 125,
      creatureCount: 12,
      squaresCount: 5,
      circlesCount: 4,
      trianglesCount: 2,
      octagonsCount: 1,
      birthsTotal: 9,
      deathsTotal: 3
    });
    expect(app.querySelector('.world-seed').textContent).toBe('SEED 42');
    expect(app.querySelector('[data-value="creatureCount"]').textContent).toBe('12');
    ui.setMetrics({ tick: 0, creatureCount: 0, birthsTotal: 0, deathsTotal: 0 });
    expect(app.querySelector('.world-tick').textContent).toBe('TICK 0');
    expect(app.querySelector('[data-value="creatureCount"]').textContent).toBe('0');
    expect(app.querySelector('[data-value="birthsTotal"]').textContent).toBe('0');
  });

  it('filters across groups, hides empty groups and supports keyboard metric tracking', () => {
    const { ui } = setup();
    const addMetric = vi.fn();
    ui.setGraphsPanel({ isTracked: () => false, addMetric, getTrackedColor: () => null });
    const category = app.querySelector('[aria-label="Metric category"]');
    const search = app.querySelector('[aria-label="Search ecosystem metrics"]');
    category.value = 'all';
    category.dispatchEvent(new Event('change'));
    search.value = 'octagons speed';
    search.dispatchEvent(new Event('input'));
    const visible = [...app.querySelectorAll('[data-metric-key]')].filter((node) => !node.hidden);
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.every((node) => node.dataset.metricKey.includes('Octagons'))).toBe(true);
    visible[0].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(addMetric).toHaveBeenCalledOnce();
    search.value = 'no such metric';
    search.dispatchEvent(new Event('input'));
    expect(app.querySelector('.metrics-empty').hidden).toBe(false);
    expect(
      [...app.querySelectorAll('.metrics-grid .metrics-subheading')].every((node) => node.hidden)
    ).toBe(true);
  });

  it('keeps playback callbacks and excludes collapsed controls from keyboard access', () => {
    const onPlay = vi.fn(),
      onStep = vi.fn(),
      onSeedChange = vi.fn();
    setup({ onPlay, onStep, onSeedChange });
    app.querySelector('[aria-label="Play"]').click();
    app.querySelector('[aria-label="Step"]').click();
    expect(onPlay).toHaveBeenCalledOnce();
    expect(onStep).toHaveBeenCalledOnce();
    app.querySelector('.top-bar-expand').click();
    expect(app.querySelector('.top-bar-controls').inert).toBe(true);
    expect(app.querySelector('.top-bar-expand').getAttribute('aria-expanded')).toBe('false');
    app.querySelector('.seed-input').value = '';
    app.querySelector('.seed-row button').click();
    expect(onSeedChange).not.toHaveBeenCalled();
  });
});
