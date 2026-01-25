/**
 * Simplex Noise Implementation
 * Based on Stefan Gustavson's implementation (public domain)
 * Optimized for terrain generation
 */

// Gradient vectors for 2D
const grad3 = [
  [1, 1, 0],
  [-1, 1, 0],
  [1, -1, 0],
  [-1, -1, 0],
  [1, 0, 1],
  [-1, 0, 1],
  [1, 0, -1],
  [-1, 0, -1],
  [0, 1, 1],
  [0, -1, 1],
  [0, 1, -1],
  [0, -1, -1]
];

// Create permutation table from seed
function buildPermutation(seed) {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);

  // Initialize with identity
  for (let i = 0; i < 256; i++) {
    p[i] = i;
  }

  // Shuffle using seed
  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }

  // Duplicate for overflow
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
  }

  return perm;
}

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

/**
 * Create a seeded simplex noise generator
 */
export function createNoise(seed = 0) {
  const perm = buildPermutation(seed);

  function dot2(g, x, y) {
    return g[0] * x + g[1] * y;
  }

  /**
   * 2D Simplex noise
   * @param {number} x
   * @param {number} y
   * @returns {number} Value between -1 and 1
   */
  function simplex2(x, y) {
    // Skew input space
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);

    // Unskew back
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;

    // Determine simplex
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    // Hash coordinates
    const ii = i & 255;
    const jj = j & 255;
    const gi0 = perm[ii + perm[jj]] % 12;
    const gi1 = perm[ii + i1 + perm[jj + j1]] % 12;
    const gi2 = perm[ii + 1 + perm[jj + 1]] % 12;

    // Calculate contributions
    let n0 = 0,
      n1 = 0,
      n2 = 0;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * dot2(grad3[gi0], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * dot2(grad3[gi1], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * dot2(grad3[gi2], x2, y2);
    }

    // Scale to [-1, 1]
    return 70 * (n0 + n1 + n2);
  }

  /**
   * Fractal Brownian Motion (layered noise)
   * @param {number} x
   * @param {number} y
   * @param {number} octaves - Number of layers
   * @param {number} persistence - Amplitude decay per octave
   * @param {number} lacunarity - Frequency multiplier per octave
   * @returns {number} Value between -1 and 1
   */
  function fbm(x, y, octaves = 4, persistence = 0.5, lacunarity = 2) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += simplex2(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  /**
   * Ridge noise (absolute value creates ridges)
   */
  function ridge(x, y, octaves = 4, persistence = 0.5, lacunarity = 2) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      const n = 1 - Math.abs(simplex2(x * frequency, y * frequency));
      total += n * n * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  /**
   * Domain-warped noise for more organic shapes
   */
  function warpedNoise(x, y, scale = 1, warpStrength = 0.5) {
    const warpX = fbm(x * scale, y * scale, 3) * warpStrength;
    const warpY = fbm(x * scale + 5.2, y * scale + 1.3, 3) * warpStrength;
    return fbm((x + warpX) * scale, (y + warpY) * scale, 4);
  }

  return {
    simplex2,
    fbm,
    ridge,
    warpedNoise
  };
}

/**
 * Utility: Normalize value from [-1,1] to [0,1]
 */
export function normalize(value) {
  return (value + 1) * 0.5;
}

/**
 * Utility: Smooth interpolation
 */
export function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Utility: Smoother interpolation
 */
export function smootherstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}
