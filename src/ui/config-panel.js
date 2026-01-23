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
  panel.className = 'panel';

  // Create header with toggle
  const header = document.createElement('div');
  header.className = 'panel-header';

  const title = document.createElement('h2');
  title.className = 'panel-title';
  title.innerHTML = '⚙️ Configuration';

  const toggleIcon = document.createElement('span');
  toggleIcon.className = 'panel-toggle';
  toggleIcon.textContent = '▼';

  header.append(title, toggleIcon);

  // Create content area (collapsible)
  const content = document.createElement('div');
  content.className = 'panel-content';
  content.style.display = 'none';

  let isExpanded = false;
  header.addEventListener('click', () => {
    isExpanded = !isExpanded;
    content.style.display = isExpanded ? 'block' : 'none';
    toggleIcon.classList.toggle('expanded', isExpanded);
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
    predator: 'Predator Behavior',
    herding: 'Herding Behavior',
    reproduction: 'Reproduction',
    lifespan: 'Lifespan',
    chase: 'Chase',
    plants: 'Plants & Carcasses',
    genetics: 'Genetics',
    other: 'Other'
  };

  // Store input elements for updating
  const inputs = new Map();

  // Create category sections
  const categoryOrder = [
    'simulation',
    'creatures',
    'metabolism',
    'predator',
    'herding',
    'reproduction',
    'lifespan',
    'chase',
    'plants',
    'genetics',
    'other'
  ];
  for (const category of categoryOrder) {
    const items = categories[category];
    if (!items || items.length === 0) continue;

    const section = document.createElement('div');
    section.className = 'config-section';

    const sectionTitle = document.createElement('h3');
    sectionTitle.className = 'config-section-title';
    sectionTitle.textContent = categoryLabels[category] || category;

    section.append(sectionTitle);

    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'config-row';

      const label = document.createElement('label');
      label.className = 'config-label';
      label.textContent = item.label;

      const input = document.createElement('input');
      input.type = 'number';
      input.id = `config-${item.key}`;
      input.className = 'config-input';
      label.setAttribute('for', input.id);

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
  resetButton.className = 'btn';
  resetButton.style.marginTop = 'var(--space-md)';

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
      toggleIcon.classList.toggle('expanded', isExpanded);
    }
  };
}
