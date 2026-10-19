export const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0.5));
export const wrapHue = (value) => (Number.isFinite(value) ? ((value % 1) + 1) % 1 : 0.5);
export const hueDelta = (a, b) => {
  const delta = wrapHue(b) - wrapHue(a);
  // Exact antipodes always take the positive half-turn from the first parent.
  return delta > 0.5 ? delta - 1 : delta <= -0.5 ? delta + 1 : delta;
};
export const hueDistance = (a, b) => Math.abs(hueDelta(a, b));
export const mixHue = (a, b, t = 0.5) => wrapHue(wrapHue(a) + hueDelta(a, b) * clamp01(t));
export function hslToRgb(h, s, l) {
  h = wrapHue(h);
  s = clamp01(s);
  l = clamp01(l);
  const a = s * Math.min(l, 1 - l);
  const channel = (n) => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [channel(0), channel(8), channel(4)];
}
export const rgbCss = (rgb) => `rgb(${rgb.map((v) => Math.round(clamp01(v) * 255)).join(', ')})`;
export const hslCss = (h, s, l) =>
  `hsl(${wrapHue(h) * 360}, ${clamp01(s) * 100}%, ${clamp01(l) * 100}%)`;
// Weighted RGB distance with a separate luminance term: cheap and continuous at hue wrap.
// Display-space approximation, not a physiological or calibrated Lab model.
export function colourContrast(a, b, discrimination = 0.5) {
  const r = a[0] - b[0],
    g = a[1] - b[1],
    bl = a[2] - b[2];
  const luminance = Math.abs(0.2126 * r + 0.7152 * g + 0.0722 * bl);
  const chroma = Math.sqrt(0.25 * r * r + 0.5 * g * g + 0.25 * bl * bl);
  return clamp01(luminance * 0.7 + chroma * (0.3 + clamp01(discrimination) * 1.2));
}
export function circularSummary(values, bins = 12) {
  const histogram = new Array(bins).fill(0);
  let x = 0,
    y = 0,
    count = 0;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    const h = wrapHue(value);
    histogram[Math.min(bins - 1, Math.floor(h * bins))]++;
    x += Math.cos(h * Math.PI * 2);
    y += Math.sin(h * Math.PI * 2);
    count++;
  }
  const concentration = count ? Math.hypot(x, y) / count : 0;
  return {
    count,
    histogram,
    mean: concentration > 1e-8 ? wrapHue(Math.atan2(y, x) / (Math.PI * 2)) : null,
    concentration
  };
}
