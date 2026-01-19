const DEFAULT_SETTINGS = {
  seed: 1,
  speed: 1,
  fpsVisible: true
};

const SETTINGS_STORAGE_KEY = 'genetics-settings-v1';

const normalizeNumber = (value, fallback, { min = null } = {}) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  const next = Math.trunc(value);
  if (min !== null) {
    return Math.max(min, next);
  }
  return next;
};

const normalizeSettings = (input, defaults) => ({
  seed: normalizeNumber(input?.seed, defaults.seed),
  speed: normalizeNumber(input?.speed, defaults.speed, { min: 1 }),
  fpsVisible:
    typeof input?.fpsVisible === 'boolean' ? input.fpsVisible : defaults.fpsVisible
});

const canUseStorage = (storage) => {
  if (!storage) {
    return false;
  }
  try {
    const testKey = '__genetics_settings__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

export function createSettings({
  storageKey = SETTINGS_STORAGE_KEY,
  defaults = DEFAULT_SETTINGS,
  storage = typeof window !== 'undefined' ? window.localStorage : null
} = {}) {
  const storageEnabled = canUseStorage(storage);
  let current = normalizeSettings({}, defaults);

  const load = () => {
    if (!storageEnabled) {
      current = normalizeSettings({}, defaults);
      return { ...current };
    }
    try {
      const raw = storage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      current = normalizeSettings(parsed, defaults);
    } catch (error) {
      current = normalizeSettings({}, defaults);
    }
    return { ...current };
  };

  const save = (nextSettings = {}) => {
    current = normalizeSettings({ ...current, ...nextSettings }, defaults);
    if (storageEnabled) {
      try {
        storage.setItem(storageKey, JSON.stringify(current));
      } catch (error) {
        // Ignore storage errors (quota, permissions).
      }
    }
    return { ...current };
  };

  const get = () => ({ ...current });

  return {
    load,
    save,
    get
  };
}
