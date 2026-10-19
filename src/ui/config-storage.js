const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Session-only preferences still work. */
  }
};
export const loadStoredSet = (key) => {
  try {
    const raw = readStorage(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    return new Set();
  }
};

export const loadStoredBool = (key, fallback = false) => {
  try {
    const raw = readStorage(key);
    if (raw === null) return fallback;
    return raw === 'true';
  } catch (error) {
    return fallback;
  }
};

export const saveStoredSet = (key, values) => {
  writeStorage(key, JSON.stringify(Array.from(values)));
};

export const saveStoredBool = (key, value) => {
  writeStorage(key, value ? 'true' : 'false');
};

export const loadSectionState = (key) => {
  try {
    const raw = readStorage(key);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
};

export const saveSectionState = (key, state) => {
  writeStorage(key, JSON.stringify(state));
};
