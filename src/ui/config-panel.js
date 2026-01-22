/**
 * Config Panel Module
 *
 * Provides a collapsible UI panel for viewing and editing simulation config values.
 * Groups config by category and provides appropriate input controls for each type.
 */

import { configMeta } from '../sim/config.js';

/**
 * Creates a config panel UI component.
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.container - Parent element to append panel to
 * @param {Object} options.config - Current simulation config object
 * @param {Function} options.onConfigChange - Callback when a config value changes
 * @returns {Object} Panel API with update methods
 */
export function createConfigPanel({ container, config, onConfigChange }) {
  // Create main panel container
  const panel = document.createElement('section');
  panel.style.border = '1px solid #333';
  panel.style.borderRadius = '12px';
  panel.style.marginBottom = '12px';
  panel.style.background = '#fff';
  panel.style.overflow = 'hidden';

  // Create header with toggle
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.padding = '12px';
  header.style.cursor = 'pointer';
  header.style.userSelect = 'none';
  header.style.borderBottom = '1px solid #eee';

  const title = document.createElement('h2');
  title.textContent = '⚙️ Config';
  title.style.fontSize = '16px';
  title.style.margin = '0';

  const toggleIcon = document.createElement('span');
  toggleIcon.textContent = '▼';
  toggleIcon.style.transition = 'transform 0.2s';

  header.append(title, toggleIcon);

  // Create content area (collapsible)
  const content = document.createElement('div');
  content.style.padding = '12px';
  content.style.display = 'none';
  content.style.maxHeight = '400px';
  content.style.overflowY = 'auto';

  let isExpanded = false;
  header.addEventListener('click', () => {
    isExpanded = !isExpanded;
    content.style.display = isExpanded ? 'block' : 'none';
    toggleIcon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
    header.style.borderBottom = isExpanded ? '1px solid #eee' : 'none';
  });

  // Group config meta by category
  const categories = {};
  for (const [key, meta] of Object.entries(configMeta)) {
    const category = meta.category || 'other';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push({ key, ...meta });
  }

  // Category display names
  const categoryLabels = {
    simulation: 'Simulation',
    creatures: 'Creatures',
    metabolism: 'Metabolism',
    reproduction: 'Reproduction',
    lifespan: 'Lifespan',
    chase: 'Chase',
    plants: 'Plants',
    genetics: 'Genetics',
    other: 'Other'
  };

  // Store input elements for updating
  const inputs = new Map();

  // Create category sections
  const categoryOrder = ['simulation', 'creatures', 'metabolism', 'reproduction', 'lifespan', 'chase', 'plants', 'genetics', 'other'];
  for (const category of categoryOrder) {
    const items = categories[category];
    if (!items || items.length === 0) continue;

    const section = document.createElement('div');
    section.style.marginBottom = '16px';

    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = categoryLabels[category] || category;
    sectionTitle.style.fontSize = '14px';
    sectionTitle.style.fontWeight = 'bold';
    sectionTitle.style.margin = '0 0 8px 0';
    sectionTitle.style.color = '#555';
    sectionTitle.style.borderBottom = '1px solid #eee';
    sectionTitle.style.paddingBottom = '4px';

    section.append(sectionTitle);

    for (const item of items) {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '8px';
      row.style.marginBottom = '6px';

      const label = document.createElement('label');
      label.textContent = item.label;
      label.style.flex = '1';
      label.style.fontSize = '13px';
      label.style.color = '#333';

      const input = document.createElement('input');
      input.type = 'number';
      input.id = `config-${item.key}`;
      label.setAttribute('for', input.id);
      input.style.width = '80px';
      input.style.padding = '4px 8px';
      input.style.border = '1px solid #ccc';
      input.style.borderRadius = '4px';
      input.style.fontSize = '13px';

      if (item.min !== undefined) input.min = item.min;
      if (item.max !== undefined) input.max = item.max;
      if (item.step !== undefined) input.step = item.step;

      const currentValue = config?.[item.key];
      input.value = Number.isFinite(currentValue) ? currentValue : '';

      input.addEventListener('change', () => {
        const value = parseFloat(input.value);
        if (Number.isFinite(value)) {
          if (onConfigChange) {
            onConfigChange(item.key, value);
          }
        }
      });

      inputs.set(item.key, input);
      row.append(label, input);
      section.append(row);
    }

    content.append(section);
  }

  // Add reset button
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset to Defaults';
  resetButton.style.padding = '8px 16px';
  resetButton.style.border = '1px solid #333';
  resetButton.style.borderRadius = '6px';
  resetButton.style.background = '#f5f5f5';
  resetButton.style.cursor = 'pointer';
  resetButton.style.fontSize = '13px';
  resetButton.style.marginTop = '8px';

  resetButton.addEventListener('click', () => {
    if (onConfigChange) {
      onConfigChange('__reset__', null);
    }
  });

  content.append(resetButton);

  panel.append(header, content);
  container.append(panel);

  return {
    /**
     * Updates displayed values from current config.
     * @param {Object} newConfig - Updated config object
     */
    update(newConfig) {
      for (const [key, input] of inputs) {
        const value = newConfig?.[key];
        if (Number.isFinite(value)) {
          input.value = value;
        }
      }
    },

    /**
     * Expands or collapses the panel.
     * @param {boolean} expanded - Whether to expand
     */
    setExpanded(expanded) {
      isExpanded = expanded;
      content.style.display = isExpanded ? 'block' : 'none';
      toggleIcon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
      header.style.borderBottom = isExpanded ? '1px solid #eee' : 'none';
    }
  };
}
