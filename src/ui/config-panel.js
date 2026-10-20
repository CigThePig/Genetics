import { buildConfigSections } from './config-sections.js';
import { createConfigValues } from './config-values.js';
import {
  loadStoredSet,
  loadStoredBool,
  saveStoredSet,
  saveStoredBool,
  loadSectionState,
  saveSectionState
} from './config-storage.js';
/**
 * Config Panel Module - Floating Overlay Version
 *
 * Populates the config panel container with simulation configuration options.
 * Designed to work within the floating overlay panel system.
 */

import { configMeta } from '../sim/config.js';

/**
 * Creates config panel content within an existing panel container.
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.container - The overlay panel container (from UI)
 * @param {Object} options.config - Current simulation config object
 * @param {Function} options.onConfigChange - Callback when a config value changes
 * @param {Function} options.onRebuildWorld - Callback to rebuild the world
 * @param {Function} options.onApplyPreset - Callback after preset import
 * @returns {Object} Panel API with update methods
 */
export function createConfigPanel({
  container,
  config,
  onConfigChange,
  onRebuildWorld,
  onApplyPreset,
  onClose
}) {
  const FAVORITES_KEY = 'configPanelFavorites';
  const FAVORITES_ONLY_KEY = 'configPanelFavoritesOnly';
  const SHOW_ADVANCED_KEY = 'configPanelShowAdvanced';
  const SECTION_STATE_KEY = 'configPanelSectionState';

  const favorites = loadStoredSet(FAVORITES_KEY);
  let favoritesOnly = loadStoredBool(FAVORITES_ONLY_KEY, false);
  let showAdvanced = loadStoredBool(SHOW_ADVANCED_KEY, true);
  let worldDirty = false;
  const sectionState = loadSectionState(SECTION_STATE_KEY);

  const rebuildKeys = new Set([
    'hotspotSeed',
    'colourInitialVariation',
    'creatureGenomeDefaults',
    'creatureCount',
    'creaturePredatorCount',
    ...Object.keys(configMeta).filter((key) => key.startsWith('creatureSpawn'))
  ]);
  const defaultOnKeys = new Set([
    'creatureGrazeEnabled',
    'creatureHerdingEnabled',
    'creatureHerdingRegroupEnabled',
    'creatureHerdingTargetBlendEnabled',
    'creaturePackEnabled',
    'creaturePackRelocationEnabled',
    'creaturePackRelocateAvoidWater',
    'creaturePredatorRestEnabled',
    'creatureWaterRendezvousEnabled'
  ]);
  // Create header
  const header = document.createElement('div');
  header.className = 'panel-header';

  const title = document.createElement('h2');
  title.className = 'panel-title';
  title.innerHTML = '⚙️ Configuration';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'panel-close';
  closeBtn.innerHTML = '×';

  header.append(title, closeBtn);

  // Create content area
  const content = document.createElement('div');
  content.className = 'panel-content';

  const controls = document.createElement('div');
  controls.className = 'config-controls';

  const searchWrap = document.createElement('label');
  searchWrap.className = 'config-search';
  searchWrap.textContent = 'Search';

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Filter by label, key, or description…';
  searchInput.className = 'config-search-input';
  searchWrap.append(searchInput);

  const toggleRow = document.createElement('div');
  toggleRow.className = 'config-toggle-row';

  const advancedToggle = document.createElement('label');
  advancedToggle.className = 'config-toggle-chip';
  const advancedInput = document.createElement('input');
  advancedInput.type = 'checkbox';
  advancedInput.checked = showAdvanced;
  const advancedText = document.createElement('span');
  advancedText.textContent = 'Show advanced';
  advancedToggle.append(advancedInput, advancedText);

  const favoritesToggle = document.createElement('label');
  favoritesToggle.className = 'config-toggle-chip';
  const favoritesInput = document.createElement('input');
  favoritesInput.type = 'checkbox';
  favoritesInput.checked = favoritesOnly;
  const favoritesText = document.createElement('span');
  favoritesText.textContent = 'Favorites only';
  favoritesToggle.append(favoritesInput, favoritesText);

  toggleRow.append(advancedToggle, favoritesToggle);

  const presetPanel = document.createElement('details');
  presetPanel.className = 'config-tools';
  const presetSummary = document.createElement('summary');
  presetSummary.textContent = 'Presets';
  presetPanel.append(presetSummary);

  const presetActions = document.createElement('div');
  presetActions.className = 'config-tool-actions';

  const exportButton = document.createElement('button');
  exportButton.type = 'button';
  exportButton.className = 'btn';
  exportButton.textContent = 'Export JSON';

  const importButton = document.createElement('button');
  importButton.type = 'button';
  importButton.className = 'btn';
  importButton.textContent = 'Import JSON';

  presetActions.append(exportButton, importButton);

  const presetArea = document.createElement('textarea');
  presetArea.className = 'config-json';
  presetArea.rows = 6;
  presetArea.placeholder = 'Paste a config JSON payload here…';

  const presetStatus = document.createElement('div');
  presetStatus.className = 'config-tool-status';

  presetPanel.append(presetActions, presetArea, presetStatus);

  const rebuildBanner = document.createElement('div');
  rebuildBanner.className = 'config-rebuild config-rebuild--hidden';

  const rebuildHeader = document.createElement('div');
  rebuildHeader.className = 'config-rebuild-header';
  rebuildHeader.textContent = 'World changes pending';

  const rebuildSubtext = document.createElement('div');
  rebuildSubtext.className = 'config-rebuild-subtext';
  rebuildSubtext.textContent =
    'Applies world/seed changes by rebuilding terrain and respawning creatures.';

  const rebuildButton = document.createElement('button');
  rebuildButton.type = 'button';
  rebuildButton.className = 'btn';
  rebuildButton.textContent = 'Rebuild World';

  rebuildButton.addEventListener('click', () => {
    if (!worldDirty) return;
    worldDirty = false;
    rebuildBanner.classList.add('config-rebuild--hidden');
    onRebuildWorld?.();
  });

  rebuildBanner.append(rebuildHeader, rebuildSubtext, rebuildButton);

  controls.append(searchWrap, toggleRow, presetPanel);
  content.append(rebuildBanner, controls);

  // Group config meta by category
  const categories = {};
  for (const [key, meta] of Object.entries(configMeta)) {
    const category = meta.category || 'other';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push({ key, ...meta });
  }

  // Category display names and icons
  const categoryInfo = {
    simulation: { label: 'Simulation', icon: '🎮' },
    world: { label: 'World', icon: '🌍' },
    rendering: { label: 'Rendering', icon: '🎨' },
    input: { label: 'Input', icon: '🖱️' },
    creatures: { label: 'Creatures', icon: '🦎' },
    perception: { label: 'Perception', icon: '👁️' },
    metabolism: { label: 'Metabolism', icon: '🔥' },
    memory: { label: 'Memory', icon: '🧠' },
    predator: { label: 'Predator', icon: '🦁' },
    movement: { label: 'Movement', icon: '🧭' },
    herding: { label: 'Herding', icon: '🐑' },
    reproduction: { label: 'Reproduction', icon: '🥚' },
    lifespan: { label: 'Lifespan', icon: '⏳' },
    chase: { label: 'Chase', icon: '🏃' },
    plants: { label: 'Plants', icon: '🌿' },
    genetics: { label: 'Genetics', icon: '🧬' },
    other: { label: 'Other', icon: '📦' }
  };

  const setWorldDirty = (nextDirty) => {
    worldDirty = nextDirty;
    rebuildBanner.classList.toggle('config-rebuild--hidden', !worldDirty);
  };

  const applyConfigChange = (key, value, { markDirty = true } = {}) => {
    onConfigChange?.(key, value);
    if (markDirty && shouldMarkWorldDirty(key)) {
      setWorldDirty(true);
    }
  };

  const {
    formatValue,
    getDefaultValue,
    resolveBooleanValue,
    getBooleanDefault,
    shouldMarkWorldDirty,
    validateStructuredValue,
    buildPresetPayload,
    applyPresetPayload
  } = createConfigValues({ config, defaultOnKeys, rebuildKeys });
  // Store input elements for updating
  const inputs = new Map();
  const rowEntries = [];

  // Create category sections
  const categoryOrder = [
    'simulation',
    'world',
    'rendering',
    'input',
    'creatures',
    'perception',
    'metabolism',
    'memory',
    'predator',
    'movement',
    'herding',
    'reproduction',
    'lifespan',
    'chase',
    'plants',
    'genetics',
    'other'
  ];

  const extraCategories = Object.keys(categories)
    .filter((category) => !categoryOrder.includes(category))
    .sort();

  const { resetButton, resetSection } = buildConfigSections({
    categoryOrder,
    extraCategories,
    categories,
    sectionState,
    categoryInfo,
    getDefaultValue,
    inputs,
    applyConfigChange,
    saveSectionState,
    SECTION_STATE_KEY,
    favorites,
    saveStoredSet,
    FAVORITES_KEY,
    applyFilter: (...args) => applyFilter(...args),
    formatValue,
    validateStructuredValue,
    config,
    resolveBooleanValue,
    getBooleanDefault,
    rowEntries,
    content
  });

  resetButton.addEventListener('click', () => {
    onConfigChange?.('__reset__', null);
    setWorldDirty(true);
  });

  resetSection.append(resetButton);
  content.append(resetSection);

  const favoritesSection = document.createElement('section');
  favoritesSection.className = 'config-favorites';
  const favoritesTitle = document.createElement('h3');
  favoritesTitle.textContent = '⭐ Favorites';
  favoritesSection.append(favoritesTitle);
  controls.after(favoritesSection);

  const applyFilter = () => {
    const query = searchInput.value.trim().toLowerCase();
    for (const entry of rowEntries) {
      if (favorites.has(entry.key)) {
        favoritesSection.append(entry.row);
      } else if (entry.row.parentElement !== entry.section) {
        entry.section.append(entry.row);
      }
      const matchesQuery =
        !query ||
        entry.label.toLowerCase().includes(query) ||
        entry.key.toLowerCase().includes(query) ||
        (entry.description || '').toLowerCase().includes(query);
      const matchesAdvanced = showAdvanced || !entry.advanced;
      const matchesFavorite = !favoritesOnly || favorites.has(entry.key);
      const isVisible = matchesQuery && matchesAdvanced && matchesFavorite;
      entry.row.classList.toggle('config-row--hidden', !isVisible);
    }

    favoritesSection.hidden = !rowEntries.some(
      (entry) => favorites.has(entry.key) && !entry.row.classList.contains('config-row--hidden')
    );
    for (const category of [...categoryOrder, ...extraCategories]) {
      const section = categories[category]?.section;
      if (!section) continue;
      const hasVisible = Array.from(section.querySelectorAll('.config-row')).some(
        (row) => !row.classList.contains('config-row--hidden')
      );
      section.classList.toggle('config-section--hidden', !hasVisible);
    }
  };

  searchInput.addEventListener('input', applyFilter);
  advancedInput.addEventListener('change', () => {
    showAdvanced = advancedInput.checked;
    saveStoredBool(SHOW_ADVANCED_KEY, showAdvanced);
    applyFilter();
  });

  favoritesInput.addEventListener('change', () => {
    favoritesOnly = favoritesInput.checked;
    saveStoredBool(FAVORITES_ONLY_KEY, favoritesOnly);
    applyFilter();
  });

  exportButton.addEventListener('click', () => {
    const payload = buildPresetPayload(config);
    presetArea.value = JSON.stringify(payload, null, 2);
    presetStatus.textContent = 'Exported current config.';
  });

  importButton.addEventListener('click', () => {
    try {
      const payload = JSON.parse(presetArea.value);
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        presetStatus.textContent = 'Preset must be a JSON object.';
        return;
      }
      const result = applyPresetPayload(payload, (key, value) => {
        const entry = inputs.get(key);
        if (entry) {
          entry.update(value);
        }
        applyConfigChange(key, value, { markDirty: false });
      });
      if (result.seedValue !== undefined) {
        const entry = inputs.get('seed');
        if (entry) {
          entry.update(result.seedValue);
        }
      }

      const needsRebuild = result.changedKeys.some((key) => shouldMarkWorldDirty(key));

      if (result.seedValue !== undefined && result.seedChanged) {
        setWorldDirty(false);
        onApplyPreset?.({ seed: result.seedValue, needsRebuild });
      } else if (needsRebuild) {
        setWorldDirty(true);
      }

      const warnings = [];
      if (result.rejected.length > 0) {
        warnings.push(`Invalid or unknown keys skipped: ${result.rejected.join(', ')}`);
      }
      if (result.ignored.length > 0) {
        warnings.push(`Ignored keys: ${result.ignored.join(', ')}`);
      }

      presetStatus.textContent =
        warnings.length > 0 ? `Preset applied. ${warnings.join(' ')}` : 'Preset applied.';
    } catch (error) {
      presetStatus.textContent = 'Invalid JSON payload.';
    }
  });

  applyFilter();

  // Assemble panel
  container.innerHTML = '';
  container.append(header, content);

  // Close button handler - dispatch custom event for UI to handle
  closeBtn.addEventListener('click', () => {
    if (onClose) {
      onClose();
      return;
    }
    container.classList.remove('visible');
    // Find the config FAB and remove active class
    const configFab = document.querySelector('.fab-config');
    if (configFab) configFab.classList.remove('active');
  });

  return {
    /**
     * Updates displayed values from current config.
     * @param {Object} newConfig - Updated config object
     */
    update(newConfig) {
      for (const [key, { input, sliderInput, type, row, defaultValue }] of inputs) {
        const value = newConfig?.[key];
        if (type === 'boolean') {
          input.checked = resolveBooleanValue(key, value);
          if (defaultValue !== undefined) {
            row.classList.toggle(
              'config-row--changed',
              resolveBooleanValue(key, value) !== getBooleanDefault(key, defaultValue)
            );
          }
        } else if (type === 'select') {
          input.value = value ?? '';
          if (defaultValue !== undefined) {
            row.classList.toggle('config-row--changed', value !== defaultValue);
          }
        } else if (type === 'json') {
          input.value = JSON.stringify(value ?? defaultValue ?? {}, null, 2);
          if (defaultValue !== undefined) {
            row.classList.toggle(
              'config-row--changed',
              JSON.stringify(value) !== JSON.stringify(defaultValue)
            );
          }
        } else if (Number.isFinite(value)) {
          input.value = value;
          if (sliderInput) sliderInput.value = value;
          if (defaultValue !== undefined) {
            row.classList.toggle(
              'config-row--changed',
              Number.isFinite(defaultValue) && Number(value) !== Number(defaultValue)
            );
          }
        }
      }
    },
    /**
     * Manually set the rebuild banner state.
     * @param {boolean} nextDirty
     */
    setWorldDirty(nextDirty) {
      setWorldDirty(Boolean(nextDirty));
    }
  };
}
