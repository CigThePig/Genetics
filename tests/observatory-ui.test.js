// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createUI } from '../src/ui/index.js';
import { createPanelController } from '../src/ui/panel-controller.js';
import { createLiveInspector } from '../src/ui/live-inspector.js';
import { createCamera } from '../src/render/camera.js';
import { createSim } from '../src/sim/sim.js';

let app;
let controllers;
beforeEach(() => {
  controllers = [];
  document.body.innerHTML = '<div id="app"></div>';
  app = document.querySelector('#app');
});
afterEach(() => {
  for (const controller of controllers) controller.destroy();
});
const setup = (options = {}) => {
  const panelController = createPanelController(app);
  controllers.push(panelController);
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

  it('dismisses an active panel with Escape when focus is outside the app', async () => {
    setup();
    const outside = document.createElement('button');
    outside.textContent = 'Outside the app';
    document.body.append(outside);

    for (const selector of ['.fab-config', '[aria-label="Inspector"]']) {
      const trigger = app.querySelector(selector);
      trigger.click();
      await Promise.resolve();
      outside.focus();
      expect(document.activeElement).toBe(outside);
      const escape = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true
      });
      outside.dispatchEvent(escape);
      expect(escape.defaultPrevented).toBe(true);
      expect(app.querySelectorAll('.overlay-panel.visible')).toHaveLength(0);
      expect(document.activeElement).toBe(trigger);
      expect(app.dataset.panelOpen).toBeUndefined();
    }

    outside.focus();
    const unusedEscape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true
    });
    outside.dispatchEvent(unusedEscape);
    expect(unusedEscape.defaultPrevented).toBe(false);
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

  it('keeps focused inspector section buttons mounted while live values update', () => {
    const { inspector } = setup();
    const sim = createSim({ seed: 42 });
    inspector.selectCreature(sim.state.creatures[0]);
    const render = () =>
      inspector.update({
        creatures: sim.state.creatures,
        tick: sim.state.tick,
        world: sim.state.world,
        config: sim.config
      });
    render();
    const header = app.querySelector('.inspector-section-header');
    header.focus();
    expect(document.activeElement).toBe(header);
    for (let tick = 1; tick <= 5; tick++) {
      sim.state.tick = tick;
      render();
      expect(document.activeElement).toBe(header);
      expect(app.querySelector('.inspector-section-header')).toBe(header);
      expect(app.querySelectorAll('.inspector-section-header')).toHaveLength(6);
    }
    header.click();
    expect(header.getAttribute('aria-expanded')).toBe('false');
    render();
    expect(header.getAttribute('aria-expanded')).toBe('false');
    expect(app.querySelector('.inspector-section-header')).toBe(header);
    header.focus();
    header.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(app.querySelector('.inspector-panel').classList.contains('visible')).toBe(false);
  });

  it('retains keyboard focus on Hunting when a predator finishes chasing', () => {
    const { inspector } = setup();
    const sim = createSim({ seed: 42 });
    const predator = sim.state.creatures.find((creature) => creature.species === 'triangle');
    expect(predator).toBeDefined();
    predator.chase = { status: 'pursuing', targetId: 7, distance: 2.5 };
    inspector.selectCreature(predator);
    const render = () =>
      inspector.update({
        creatures: sim.state.creatures,
        tick: sim.state.tick,
        world: sim.state.world,
        config: sim.config
      });
    render();

    const hunting = app.querySelector('[data-inspector-section="hunting"]');
    expect(hunting).not.toBeNull();
    const header = hunting.querySelector('.inspector-section-header');
    header.click();
    header.focus();
    expect(header.getAttribute('aria-expanded')).toBe('true');

    predator.chase.status = 'idle';
    sim.state.tick += 1;
    render();
    expect(hunting.isConnected).toBe(true);
    expect(hunting.querySelector('.inspector-section-header')).toBe(header);
    expect(document.activeElement).toBe(header);
    expect(header.getAttribute('aria-expanded')).toBe('true');
    expect(hunting.textContent).toContain('Not currently hunting');

    predator.chase.status = 'pursuing';
    render();
    expect(document.activeElement).toBe(header);
    expect(hunting.textContent).toContain('Pursuing');
    header.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(app.querySelector('.inspector-panel').classList.contains('visible')).toBe(false);
  });

  it('allows the landscape Fit world scale beneath the ordinary zoom floor', () => {
    const camera = createCamera({ minZoom: 0.01, maxZoom: 5 });
    camera.setBoundsFromWorld({ width: 120, height: 160 }, 20);
    camera.setViewport(852, 393);
    const requested = Math.min((852 - 48) / (120 * 20), (393 - 240) / (160 * 20));
    camera.zoomTo(requested);
    expect(camera.getState().zoom).toBeCloseTo(requested);
    expect(camera.getState().zoom * 160 * 20).toBeLessThanOrEqual(153);
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
