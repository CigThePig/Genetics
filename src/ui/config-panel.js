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
 * @returns {Object} Panel API with update methods
 */
export function createConfigPanel({ container, config, onConfigChange }) {
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
    creatures: { label: 'Creatures', icon: '🦎' },
    metabolism: { label: 'Metabolism', icon: '🔥' },
    predator: { label: 'Predator', icon: '🦁' },
    herding: { label: 'Herding', icon: '🐑' },
    reproduction: { label: 'Reproduction', icon: '🥚' },
    lifespan: { label: 'Lifespan', icon: '⏳' },
    chase: { label: 'Chase', icon: '🏃' },
    plants: { label: 'Plants', icon: '🌿' },
    genetics: { label: 'Genetics', icon: '🧬' },
    other: { label: 'Other', icon: '📦' }
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

    const info = categoryInfo[category] || { label: category, icon: '📦' };
    
    const sectionTitle = document.createElement('h3');
    sectionTitle.className = 'config-section-title';
    sectionTitle.textContent = `${info.icon} ${info.label}`;

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
          onConfigChange?.(item.key, value);
        }
      });

      // Make inputs easier to use on mobile
      input.addEventListener('focus', () => {
        input.select();
      });

      inputs.set(item.key, input);
      row.append(label, input);
      section.append(row);
    }

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
  });

  resetSection.append(resetButton);
  content.append(resetSection);

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
      for (const [key, input] of inputs) {
        const value = newConfig?.[key];
        if (Number.isFinite(value)) {
          input.value = value;
        }
      }
    }
  };
}
