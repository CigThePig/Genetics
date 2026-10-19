import { createConfigPanel } from '../ui/config-panel.js';
import { simConfig } from '../sim/config.js';
import { cloneConfigValue } from '../sim/utils/config.js';

/** Connects config controls to world rebuilding, clock and inspector updates. */
export function createAppConfigController({ sim, ui, renderer, loop, getInspector, rebuildWorld }) {
  const configPanel = createConfigPanel({
    container: ui.getConfigPanelContainer(),
    onClose: () => ui.closePanel('config'),
    config: sim.config,
    onConfigChange: (key, value) => {
      if (key === '__reset__') {
        for (const [configKey, defaultValue] of Object.entries(simConfig)) {
          sim.config[configKey] = cloneConfigValue(defaultValue);
        }
        configPanel.update(sim.config);
        ui.setStatus('Config reset');
        configPanel.setWorldDirty(true);
      } else if (key === 'seed') {
        rebuildWorld(value);
        configPanel.update(sim.config);
        configPanel.setWorldDirty(false);
      } else {
        sim.config[key] = value;
        if (key === 'ticksPerSecond') rebuildWorld(sim.getSeed());
        ui.setStatus(`${key} = ${value}`);
      }

      if (key === 'ticksPerSecond' || key === '__reset__') {
        getInspector().setTicksPerSecond?.(sim.config?.ticksPerSecond ?? 60);
        loop.resetTimebase();
      }

      if (!loop.isRunning()) {
        renderer.render(sim, { immediate: !loop.isRunning() });
        ui.setMetrics?.(sim.getSummary());
      }
    },
    onRebuildWorld: () => {
      rebuildWorld(sim.getSeed());
      configPanel.setWorldDirty(false);
      configPanel.update(sim.config);
    },
    onApplyPreset: ({ seed }) => {
      if (Number.isFinite(seed)) {
        rebuildWorld(seed);
        configPanel.setWorldDirty(false);
        configPanel.update(sim.config);
      }
    }
  });

  return configPanel;
}
