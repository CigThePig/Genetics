import { hueDistance, clamp01 } from '../colour.js';

export function matePreferenceMismatch(source, candidate) {
  const t = source?.traits,
    c = candidate?.traits;
  if (!Number.isFinite(t?.matePreferenceHue) || !Number.isFinite(c?.bodyHue)) return 0;
  // Hue is uninformative at black/white, weak on greys, and observer-dependent.
  const signal =
    Math.min(1, (c.bodySaturation ?? 0.5) * 2) *
    (2 * Math.min(clamp01(c.bodyLightness ?? 0.5), 1 - clamp01(c.bodyLightness ?? 0.5))) *
    (0.25 + clamp01(t.colourDiscrimination ?? 0.5) * 0.75);
  return hueDistance(t.matePreferenceHue, c.bodyHue) * 2 * clamp01(t.mateChoosiness ?? 0) * signal;
}
export function mateSelectionCost(source, candidate, distance, config = {}) {
  if (config.colourMatePreferenceEnabled === false) return distance;
  const mismatch =
    (matePreferenceMismatch(source, candidate) + matePreferenceMismatch(candidate, source)) * 0.5;
  return distance + Math.max(1, distance) * 6 * mismatch;
}
