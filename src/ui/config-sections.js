export function buildConfigSections({
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
  applyFilter,
  formatValue,
  validateStructuredValue,
  config,
  resolveBooleanValue,
  getBooleanDefault,
  rowEntries,
  content
}) {
  for (const category of [...categoryOrder, ...extraCategories]) {
    const items = categories[category];
    if (!items || items.length === 0) continue;

    const section = document.createElement('details');
    section.className = 'config-section';
    section.open = typeof sectionState[category] === 'boolean' ? sectionState[category] : true;

    const info = categoryInfo[category] || { label: category, icon: '📦' };

    const sectionTitle = document.createElement('summary');
    sectionTitle.className = 'config-section-title';

    const sectionTitleText = document.createElement('span');
    sectionTitleText.textContent = `${info.icon} ${info.label}`;

    const sectionActions = document.createElement('span');
    sectionActions.className = 'config-section-actions';

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

    const sectionChevron = document.createElement('span');
    sectionChevron.className = 'config-section-chevron';
    sectionChevron.textContent = '▾';

    sectionActions.append(sectionReset, sectionChevron);
    sectionTitle.append(sectionTitleText, sectionActions);

    section.append(sectionTitle);

    section.addEventListener('toggle', () => {
      sectionState[category] = section.open;
      saveSectionState(SECTION_STATE_KEY, sectionState);
    });

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

      // Keep the favorite star aligned on the same line as the label text.
      // (Putting it inside the label lets flex layout place it at the far right.)
      label.append(favoriteButton);

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
        row.classList.add('config-row--toggle');
        controlWrap.classList.add('config-control--toggle');
        input = document.createElement('input');
        input.type = 'checkbox';
        // Use a dedicated switch style. Do not inherit .config-input sizing/padding.
        input.className = 'config-switch';
        input.setAttribute('role', 'switch');
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
            ? resolveBooleanValue(item.key, value) !== getBooleanDefault(item.key, defaultValue)
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
  return { resetButton, resetSection };
}
