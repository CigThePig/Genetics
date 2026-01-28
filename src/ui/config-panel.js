/**
 * Config Panel Module - Floating Overlay Version
 *
 * Populates the config panel container with simulation configuration options.
 * Designed to work within the floating overlay panel system.
 */

import { configMeta, simConfig } from '../sim/config.js';

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
  onApplyPreset
}) {
  const FAVORITES_KEY = 'configPanelFavorites';
  const FAVORITES_ONLY_KEY = 'configPanelFavoritesOnly';
  const SHOW_ADVANCED_KEY = 'configPanelShowAdvanced';

  const loadStoredSet = (key) => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      return new Set();
    }
  };

  const loadStoredBool = (key, fallback = false) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return raw === 'true';
    } catch (error) {
      return fallback;
    }
  };

  const saveStoredSet = (key, values) => {
    localStorage.setItem(key, JSON.stringify(Array.from(values)));
  };

  const saveStoredBool = (key, value) => {
    localStorage.setItem(key, value ? 'true' : 'false');
  };

  const favorites = loadStoredSet(FAVORITES_KEY);
  let favoritesOnly = loadStoredBool(FAVORITES_ONLY_KEY, false);
  let showAdvanced = loadStoredBool(SHOW_ADVANCED_KEY, true);
  let worldDirty = false;

  const rebuildKeys = new Set(['hotspotSeed']);
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

  const formatValue = (value, item) => {
    if (value === undefined || value === null || Number.isNaN(value)) return '—';
    if (item.type === 'boolean') return value ? 'On' : 'Off';
    if (item.type === 'select') {
      const option = (item.options || []).find((entry) => entry.value === value);
      return option ? option.label ?? String(option.value) : String(value);
    }
    if (Number.isFinite(value)) {
      return item.unit ? `${value} ${item.unit}` : String(value);
    }
    return item.unit ? `${value} ${item.unit}` : String(value);
  };

  const getDefaultValue = (item) => simConfig?.[item.key];

  const resolveBooleanValue = (key, rawValue) => {
    if (typeof rawValue === 'boolean') return rawValue;
    const defaultValue = simConfig?.[key];
    if (typeof defaultValue === 'boolean') return defaultValue;
    if (defaultOnKeys.has(key)) return true;
    return false;
  };

  const getBooleanDefault = (key, fallback) => {
    if (typeof fallback === 'boolean') return fallback;
    if (defaultOnKeys.has(key)) return true;
    return false;
  };

  const shouldMarkWorldDirty = (key) => {
    if (key === 'seed') return false;
    if (rebuildKeys.has(key)) return true;
    return configMeta?.[key]?.category === 'world';
  };

  const setWorldDirty = (nextDirty) => {
    worldDirty = nextDirty;
    rebuildBanner.classList.toggle('config-rebuild--hidden', !worldDirty);
  };

  const isValueDifferent = (key, nextValue) => {
    const currentValue = config?.[key];
    if (typeof nextValue === 'object') {
      return JSON.stringify(currentValue) !== JSON.stringify(nextValue);
    }
    return currentValue !== nextValue;
  };

  const validateStructuredValue = (value, defaultValue) => {
    if (defaultValue === undefined) return { ok: false, message: 'No default value found.' };
    const defaultIsArray = Array.isArray(defaultValue);
    const valueIsArray = Array.isArray(value);
    if (defaultIsArray !== valueIsArray) {
      return { ok: false, message: 'Value type does not match default.' };
    }
    if (!defaultIsArray && (typeof value !== 'object' || value === null)) {
      return { ok: false, message: 'Value must be an object.' };
    }
    if (defaultIsArray && !Array.isArray(value)) {
      return { ok: false, message: 'Value must be an array.' };
    }
    if (!defaultIsArray) {
      const defaultKeys = Object.keys(defaultValue);
      const extraKeys = Object.keys(value).filter((key) => !defaultKeys.includes(key));
      if (extraKeys.length > 0) {
        return { ok: false, message: `Unknown keys: ${extraKeys.join(', ')}` };
      }
    }
    return { ok: true };
  };

  const buildPresetPayload = (configState) => {
    const payload = {};
    for (const key of Object.keys(simConfig)) {
      if (configState && Object.prototype.hasOwnProperty.call(configState, key)) {
        payload[key] = configState[key];
      } else {
        payload[key] = simConfig[key];
      }
    }
    return payload;
  };

  const applyPresetPayload = (payload, updateEntry) => {
    const validKeys = new Set(Object.keys(simConfig));
    const rejected = [];
    const ignored = [];
    const changedKeys = [];
    let seedValue;
    let seedChanged = false;
    for (const [key, value] of Object.entries(payload)) {
      if (key === 'ticksPerSecond') {
        ignored.push(key);
        continue;
      }
      if (!validKeys.has(key)) {
        rejected.push(key);
        continue;
      }
      const defaultValue = simConfig[key];
      if (Array.isArray(defaultValue)) {
        if (!Array.isArray(value)) {
          rejected.push(key);
          continue;
        }
      } else if (typeof defaultValue === 'object' && defaultValue !== null) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          rejected.push(key);
          continue;
        }
      } else if (typeof value !== typeof defaultValue) {
        rejected.push(key);
        continue;
      }
      const hasChanged = isValueDifferent(key, value);
      if (key === 'seed') {
        seedValue = value;
        seedChanged = hasChanged;
      } else {
        updateEntry(key, value);
      }
      if (hasChanged) changedKeys.push(key);
    }
    return { rejected, ignored, changedKeys, seedValue, seedChanged };
  };

  const applyConfigChange = (key, value, { markDirty = true } = {}) => {
    onConfigChange?.(key, value);
    if (markDirty && shouldMarkWorldDirty(key)) {
      setWorldDirty(true);
    }
  };

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

  for (const category of [...categoryOrder, ...extraCategories]) {
    const items = categories[category];
    if (!items || items.length === 0) continue;

    const section = document.createElement('details');
    section.className = 'config-section';
    section.open = true;

    const info = categoryInfo[category] || { label: category, icon: '📦' };
    
    const sectionTitle = document.createElement('summary');
    sectionTitle.className = 'config-section-title';

    const sectionTitleText = document.createElement('span');
    sectionTitleText.textContent = `${info.icon} ${info.label}`;

    const sectionReset = document.createElement('button');
    sectionReset.type = 'button';
    sectionReset.className = 'config-section-reset';
    sectionReset.textContent = 'Reset';
    sectionReset.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      for (const item of items) {
        const defaultValue = getDefaultValue(item);
        if (defaultValue === undefined) continue;
        const entry = inputs.get(item.key);
        if (entry) {
          entry.update(defaultValue);
          applyConfigChange(item.key, defaultValue);
        }
      }
    });

    sectionTitle.append(sectionTitleText, sectionReset);

    section.append(sectionTitle);

    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'config-row';

      const labelWrap = document.createElement('div');
      labelWrap.className = 'config-label-wrap';

      const label = document.createElement('label');
      label.className = 'config-label';
      label.textContent = item.label;

      if (item.advanced) {
        const badge = document.createElement('span');
        badge.className = 'config-badge';
        badge.textContent = 'Advanced';
        label.append(badge);
      }

      labelWrap.append(label);

      const favoriteButton = document.createElement('button');
      favoriteButton.type = 'button';
      favoriteButton.className = 'config-favorite';
      favoriteButton.textContent = favorites.has(item.key) ? '★' : '☆';
      favoriteButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (favorites.has(item.key)) {
          favorites.delete(item.key);
        } else {
          favorites.add(item.key);
        }
        favoriteButton.textContent = favorites.has(item.key) ? '★' : '☆';
        row.classList.toggle('config-row--favorite', favorites.has(item.key));
        saveStoredSet(FAVORITES_KEY, favorites);
        applyFilter();
      });

      labelWrap.append(favoriteButton);

      if (item.description) {
        const description = document.createElement('div');
        description.className = 'config-description';
        description.textContent = item.description;
        labelWrap.append(description);
      }

      const defaultValue = getDefaultValue(item);
      if (defaultValue !== undefined) {
        const meta = document.createElement('div');
        meta.className = 'config-meta';
        meta.textContent = `Default: ${formatValue(defaultValue, item)}`;
        labelWrap.append(meta);
      }

      const controlWrap = document.createElement('div');
      controlWrap.className = 'config-control';

      let input;
      let sliderInput;
      let jsonError;
      let jsonActions;
      let sliderFrame = null;
      const inputType = item.type || 'number';
      const control = item.control || (inputType === 'number' ? 'number' : inputType);

      if (inputType === 'boolean') {
        input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'config-input config-toggle';
      } else if (inputType === 'select') {
        input = document.createElement('select');
        input.className = 'config-input config-select';
        const options = item.options || [];
        for (const option of options) {
          const optionEl = document.createElement('option');
          optionEl.value = String(option.value);
          optionEl.textContent = option.label ?? String(option.value);
          input.append(optionEl);
        }
      } else if (inputType === 'json') {
        input = document.createElement('textarea');
        input.className = 'config-input config-json';
        input.rows = item.rows || 6;
        jsonActions = document.createElement('div');
        jsonActions.className = 'config-json-actions';

        const validateButton = document.createElement('button');
        validateButton.type = 'button';
        validateButton.className = 'btn btn-secondary';
        validateButton.textContent = 'Validate';

        const applyButton = document.createElement('button');
        applyButton.type = 'button';
        applyButton.className = 'btn';
        applyButton.textContent = 'Apply';

        jsonError = document.createElement('div');
        jsonError.className = 'config-json-error';

        const validateJson = () => {
          try {
            const parsed = JSON.parse(input.value);
            const result = validateStructuredValue(parsed, defaultValue);
            if (!result.ok) {
              jsonError.textContent = result.message;
              return { ok: false };
            }
            jsonError.textContent = '';
            return { ok: true, value: parsed };
          } catch (error) {
            jsonError.textContent = 'Invalid JSON.';
            return { ok: false };
          }
        };

        validateButton.addEventListener('click', () => {
          validateJson();
        });

        applyButton.addEventListener('click', () => {
          const result = validateJson();
          if (!result.ok) return;
          applyConfigChange(item.key, result.value);
          setRowChanged(result.value);
        });

        jsonActions.append(validateButton, applyButton);
      } else {
        if (control === 'slider') {
          sliderInput = document.createElement('input');
          sliderInput.type = 'range';
          sliderInput.className = 'config-input config-slider';
          if (item.min !== undefined) sliderInput.min = item.min;
          if (item.max !== undefined) sliderInput.max = item.max;
          if (item.step !== undefined) sliderInput.step = item.step;

          input = document.createElement('input');
          input.type = 'number';
          input.className = 'config-input';
        } else {
          input = document.createElement('input');
          input.type = 'number';
          input.className = 'config-input';
        }

        if (item.min !== undefined) input.min = item.min;
        if (item.max !== undefined) input.max = item.max;
        if (item.step !== undefined) input.step = item.step;
      }

      input.id = `config-${item.key}`;
      label.setAttribute('for', input.id);

      const currentValue = config?.[item.key];
      if (inputType === 'boolean') {
        input.checked = resolveBooleanValue(item.key, currentValue);
      } else if (inputType === 'select') {
        input.value = currentValue ?? '';
      } else if (inputType === 'json') {
        input.value = JSON.stringify(currentValue ?? defaultValue ?? {}, null, 2);
      } else {
        input.value = Number.isFinite(currentValue) ? currentValue : '';
      }

      if (sliderInput) {
        sliderInput.value = Number.isFinite(currentValue) ? currentValue : '';
      }

      const setRowChanged = (value) => {
        if (defaultValue === undefined) {
          row.classList.remove('config-row--changed');
          return;
        }
        const nextValue = inputType === 'select' ? value : Number(value);
        const hasChanged =
          inputType === 'boolean'
            ? resolveBooleanValue(item.key, value) !==
              getBooleanDefault(item.key, defaultValue)
            : inputType === 'select'
              ? value !== defaultValue
              : inputType === 'json'
                ? JSON.stringify(value) !== JSON.stringify(defaultValue)
              : Number.isFinite(nextValue) && Number(nextValue) !== Number(defaultValue);
        row.classList.toggle('config-row--changed', hasChanged);
      };

      setRowChanged(currentValue);

      if (sliderInput) {
        const commitSliderValue = () => {
          if (sliderFrame !== null) return;
          sliderFrame = requestAnimationFrame(() => {
            sliderFrame = null;
            const value = parseFloat(sliderInput.value);
            if (Number.isFinite(value)) {
              input.value = sliderInput.value;
              applyConfigChange(item.key, value);
              setRowChanged(value);
            }
          });
        };

        sliderInput.addEventListener('input', () => {
          input.value = sliderInput.value;
          commitSliderValue();
        });
      }

      input.addEventListener('change', () => {
        if (inputType === 'boolean') {
          const nextValue = input.checked;
          applyConfigChange(item.key, nextValue);
          setRowChanged(nextValue);
          return;
        }

        if (inputType === 'select') {
          const rawValue = input.value;
          const nextValue = item.optionType === 'number' ? Number(rawValue) : rawValue;
          applyConfigChange(item.key, nextValue);
          setRowChanged(nextValue);
          return;
        }

        if (inputType === 'json') {
          return;
        }

        const value = parseFloat(input.value);
        if (Number.isFinite(value)) {
          applyConfigChange(item.key, value);
          if (sliderInput) sliderInput.value = input.value;
          setRowChanged(value);
        }
      });

      if (sliderInput) {
        sliderInput.addEventListener('change', () => {
          const value = parseFloat(sliderInput.value);
          if (Number.isFinite(value)) {
            input.value = sliderInput.value;
            setRowChanged(value);
          }
        });
      }

      // Make inputs easier to use on mobile
      input.addEventListener('focus', () => {
        input.select();
      });

      const updateEntry = (nextValue) => {
        if (inputType === 'boolean') {
          input.checked = resolveBooleanValue(item.key, nextValue);
          setRowChanged(nextValue);
        } else if (inputType === 'select') {
          input.value = nextValue ?? '';
          setRowChanged(nextValue);
        } else if (inputType === 'json') {
          input.value = JSON.stringify(nextValue ?? defaultValue ?? {}, null, 2);
          setRowChanged(nextValue);
          if (jsonError) jsonError.textContent = '';
        } else if (Number.isFinite(nextValue)) {
          input.value = nextValue;
          if (sliderInput) sliderInput.value = nextValue;
          setRowChanged(nextValue);
        }
      };

      inputs.set(item.key, {
        input,
        sliderInput,
        type: inputType,
        row,
        defaultValue,
        update: updateEntry
      });
      rowEntries.push({
        key: item.key,
        row,
        section,
        label: item.label,
        description: item.description,
        category,
        advanced: Boolean(item.advanced)
      });
      row.classList.toggle('config-row--favorite', favorites.has(item.key));
      controlWrap.append(input);
      if (sliderInput) {
        controlWrap.prepend(sliderInput);
      }
      if (jsonActions) {
        controlWrap.append(jsonActions);
      }
      if (jsonError) {
        controlWrap.append(jsonError);
      }
      row.append(labelWrap, controlWrap);
      section.append(row);
    }

    categories[category].section = section;
    content.append(section);
  }

  // Add reset button
  const resetSection = document.createElement('div');
  resetSection.style.marginTop = 'var(--space-lg)';
  resetSection.style.paddingTop = 'var(--space-lg)';
  resetSection.style.borderTop = '1px solid var(--border-subtle)';

  const resetButton = document.createElement('button');
  resetButton.textContent = '🔄 Reset to Defaults';
  resetButton.className = 'btn';
  resetButton.style.width = '100%';

  resetButton.addEventListener('click', () => {
    onConfigChange?.('__reset__', null);
    setWorldDirty(true);
  });

  resetSection.append(resetButton);
  content.append(resetSection);

  const applyFilter = () => {
    const query = searchInput.value.trim().toLowerCase();
    for (const entry of rowEntries) {
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
        warnings.push(`Unknown keys skipped: ${result.rejected.join(', ')}`);
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
    container.classList.remove('visible');
    // Find the config FAB and remove active class
    const configFab = document.querySelector('.fab-container-right .fab:nth-child(2)');
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
