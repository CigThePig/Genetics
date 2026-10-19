import { simConfig, configMeta } from '../sim/config.js';
export function createConfigValues({ config, defaultOnKeys, rebuildKeys }) {
  const formatValue = (value, item) => {
    if (value === undefined || value === null || Number.isNaN(value)) return '—';
    if (item.type === 'boolean') return value ? 'On' : 'Off';
    if (item.type === 'select') {
      const option = (item.options || []).find((entry) => entry.value === value);
      return option ? (option.label ?? String(option.value)) : String(value);
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
  return {
    formatValue,
    getDefaultValue,
    resolveBooleanValue,
    getBooleanDefault,
    shouldMarkWorldDirty,
    isValueDifferent,
    validateStructuredValue,
    buildPresetPayload,
    applyPresetPayload
  };
}
