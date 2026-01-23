/**
 * Config Utilities
 *
 * Provides safe deep-clone and deep-merge helpers for simulation config.
 *
 * Why:
 * - `createSim()` accepts partial config overrides.
 * - Shallow merges can accidentally share nested object references.
 * - Deep merges let callers override a single nested leaf without
 *   replacing an entire object.
 */

const isPlainObject = (value) => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/**
 * Deep-clones a config value.
 * Falls back to JSON clone for older browsers/environments.
 */
export const cloneConfigValue = (value) => {
  if (!value || typeof value !== 'object') {
    return value;
  }
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
};

/**
 * Deep-merge config objects.
 * - Plain objects are merged recursively.
 * - Arrays are replaced (not concatenated).
 * - Non-plain objects are replaced.
 */
export const mergeSimConfig = (baseConfig, overrideConfig) => {
  const base = cloneConfigValue(baseConfig ?? {});
  const overrides = overrideConfig ?? {};

  const mergeInto = (target, source) => {
    for (const [key, nextValue] of Object.entries(source)) {
      if (isPlainObject(nextValue) && isPlainObject(target[key])) {
        mergeInto(target[key], nextValue);
      } else {
        target[key] = cloneConfigValue(nextValue);
      }
    }
  };

  if (isPlainObject(base) && isPlainObject(overrides)) {
    mergeInto(base, overrides);
    return base;
  }

  // Fallback: non-plain root values are replaced.
  return cloneConfigValue(overrides);
};
