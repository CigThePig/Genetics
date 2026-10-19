import { simConfig, configMeta } from '../sim/config.js';
import { validateConfigValue } from './config-validation.js';
import { cloneConfigValue } from '../sim/utils/config.js';
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
      if (!validateConfigValue(key, value).ok) {
        rejected.push(key);
        continue;
      }
      const hasChanged = isValueDifferent(key, value);
      if (key === 'seed') {
        seedValue = value;
        seedChanged = hasChanged;
      } else {
        updateEntry(key, cloneConfigValue(value));
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
    validateStructuredValue: validateConfigValue,
    buildPresetPayload,
    applyPresetPayload
  };
}
