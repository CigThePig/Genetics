// Targeted JS adaptation of Procedural Pixel Creatures' CreatureRenderer.cs:
// posed ellipsoids, exact round-cone ray intersections and depth/normal shading.
// Copyright (c) 2026 idlerunner00. MIT; see tools/creature-baker/vendor/LICENSE.
// Genetics changes: baked morph targets, 62-degree camera, constrained body palette,
// bounded logical raster, inherited continuous coat pattern; no ecological state.
import { getAnatomy } from './appearance.js';

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
const unit = (a) => {
  const n = Math.hypot(...a) || 1;
  return a.map((v) => v / n);
};
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

// PixelCamera.WorldToView * YawRotation, with screen Y inverted only on writing.
export function projection(yaw, elevation = (62 * Math.PI) / 180) {
  const c = Math.cos(yaw),
    s = Math.sin(yaw),
    ce = Math.cos(elevation),
    se = Math.sin(elevation);
  return (p) => {
    const x = c * p[0] + s * p[2],
      z = -s * p[0] + c * p[2];
    return [x, ce * p[1] - se * z, se * p[1] + ce * z];
  };
}

function inverseColumns(axes) {
  const [a, b, c] = axes;
  const det = dot(a, cross(b, c));
  if (Math.abs(det) < 1e-10) return null;
  const rows = [cross(b, c), cross(c, a), cross(a, b)].map((r) => r.map((v) => v / det));
  return [0, 1, 2].map((i) => rows.map((r) => r[i]));
}

function ellipsoid(center, axes) {
  const inv = inverseColumns(axes);
  if (!inv) return null;
  const [a, b, c] = inv;
  const q = [dot(a, a), dot(a, b), dot(a, c), dot(b, b), dot(b, c), dot(c, c)];
  const ex = Math.hypot(...axes.map((a) => a[0])),
    ey = Math.hypot(...axes.map((a) => a[1]));
  return {
    bounds: [center[0] - ex, center[1] - ey, center[0] + ex, center[1] + ey],
    sample(x, y) {
      const dx = x - center[0],
        dy = y - center[1],
        bq = q[2] * dx + q[4] * dy;
      const cq = q[0] * dx * dx + 2 * q[1] * dx * dy + q[3] * dy * dy - 1;
      const disc = bq * bq - q[5] * cq;
      if (disc < 0) return null;
      const z = (-bq + Math.sqrt(disc)) / q[5];
      return [
        center[2] + z,
        unit([
          q[0] * dx + q[1] * dy + q[2] * z,
          q[1] * dx + q[3] * dy + q[4] * z,
          q[2] * dx + q[4] * dy + q[5] * z
        ])
      ];
    }
  };
}

function roundCone(a, b, ra, rb) {
  const ba = sub(b, a),
    m0 = dot(ba, ba),
    rr = ra - rb,
    d2 = m0 - rr * rr,
    ztop = Math.max(a[2] + ra, b[2] + rb) + 1;
  return {
    bounds: [
      Math.min(a[0] - ra, b[0] - rb),
      Math.min(a[1] - ra, b[1] - rb),
      Math.max(a[0] + ra, b[0] + rb),
      Math.max(a[1] + ra, b[1] + rb)
    ],
    sample(x, y) {
      const oa = [x - a[0], y - a[1], ztop - a[2]],
        ob = [x - b[0], y - b[1], ztop - b[2]];
      const m1 = dot(ba, oa),
        m2 = -ba[2],
        m3 = -oa[2],
        m5 = dot(oa, oa),
        m6 = -ob[2];
      const k2 = d2 - m2 * m2,
        k1 = d2 * m3 - m1 * m2 + m2 * rr * ra,
        k0 = d2 * m5 - m1 * m1 + m1 * rr * ra * 2 - m0 * ra * ra,
        h = k1 * k1 - k0 * k2;
      if (d2 > 1e-9 && h >= 0 && Math.abs(k2) > 1e-9) {
        const t = (-Math.sqrt(h) - k1) / k2,
          yy = m1 - ra * rr + t * m2;
        if (yy > 0 && yy < d2 && t >= 0)
          return [ztop - t, unit(oa.map((v, i) => d2 * (v - (i === 2 ? t : 0)) - ba[i] * yy))];
      }
      let best = Infinity,
        normal;
      for (const [o, m, r] of [
        [oa, m3, ra],
        [ob, m6, rb]
      ]) {
        const h = m * m - dot(o, o) + r * r;
        if (h > 0) {
          const t = -m - Math.sqrt(h);
          if (t < best && t >= 0) {
            best = t;
            normal = unit([o[0], o[1], o[2] - t]);
          }
        }
      }
      return best === Infinity ? null : [ztop - best, normal];
    }
  };
}

function plate(a, b, c) {
  const ba = sub(b, a),
    ca = sub(c, a),
    normal = unit(cross(ba, ca));
  if (normal[2] < 0) normal.forEach((v, i) => (normal[i] = -v));
  const area = ba[0] * ca[1] - ba[1] * ca[0];
  if (Math.abs(area) < 1e-5) return null;
  return {
    bounds: [
      Math.min(a[0], b[0], c[0]),
      Math.min(a[1], b[1], c[1]),
      Math.max(a[0], b[0], c[0]),
      Math.max(a[1], b[1], c[1])
    ],
    sample(x, y) {
      const u = ((x - a[0]) * ca[1] - (y - a[1]) * ca[0]) / area,
        v = (ba[0] * (y - a[1]) - ba[1] * (x - a[0])) / area;
      return u >= 0 && v >= 0 && u + v <= 1 ? [a[2] + u * ba[2] + v * ca[2], normal] : null;
    }
  };
}

export function rasterizeCreature(appearance, animation, size = 64, { silhouette = false } = {}) {
  const [low, high] = getAnatomy(appearance.species);
  const state = low.clips[animation.state] ? animation.state : 'idle';
  const frame = animation.frame % low.clips[state].frames.length;
  let l = low.clips[state].frames[frame],
    h = high.clips[state].frames[frame];
  if (animation.previous && animation.blend < 1) {
    const previous = animation.previous;
    const fromLow = low.clips[previous.state]?.frames[previous.frame];
    const fromHigh = high.clips[previous.state]?.frames[previous.frame];
    if (fromLow && fromHigh) {
      l = l.map((v, i) => fromLow[i] + (v - fromLow[i]) * animation.blend);
      h = h.map((v, i) => fromHigh[i] + (v - fromHigh[i]) * animation.blend);
    }
  }
  const project = projection((animation.direction * Math.PI) / 8);
  // One fixed world-space origin and fit across every pose, morph and direction.
  const extent = Math.max(low.radius, high.radius) * 1.05;
  const pixelScale = (size - 4) / (extent * 2),
    originX = size / 2,
    originY = size * 0.5;
  const pixels = new Uint8ClampedArray(size * size * 4),
    depth = new Float32Array(size * size);
  depth.fill(-Infinity);
  const normals = new Float32Array(size * size),
    materials = new Int16Array(size * size);
  materials.fill(-1);
  const groups = new Int16Array(size * size);
  groups.fill(-1);
  const domains = new Uint8Array(size * size),
    localX = new Float32Array(size * size),
    localZ = new Float32Array(size * size);
  const light = project([-0.47, 0.87, 0.06]);
  const prims = [];
  for (let i = 0; i < low.parts.length; i++) {
    const [kind, group, material, domain, flags] = low.parts[i];
    const d = Array.from(
      { length: 12 },
      (_, j) => l[i * 12 + j] + (h[i * 12 + j] - l[i * 12 + j]) * appearance.speed
    );
    const pv = (offset) => project([d[offset], d[offset + 1], d[offset + 2] * appearance.breadth]);
    let shape;
    if (kind === 0) shape = ellipsoid(pv(0), [pv(3), pv(6), pv(9)]);
    else if (kind === 1) shape = roundCone(pv(0), pv(3), d[6], d[7]);
    else if (kind === 2) shape = plate(pv(0), pv(3), pv(6));
    else {
      const n = project(d.slice(3, 6));
      if (n[2] < -0.1) continue;
      const r = Math.max(0.45, d[6] * (0.26 + appearance.perception * 0.16));
      const c = project([d[0] + d[3] * 0.3, d[1] + 0.65, d[2] * appearance.breadth + d[5] * 0.3]);
      c[2] += 0.65;
      shape = ellipsoid(c, [
        [r, 0, 0],
        [0, Math.max(0.16, r * d[7]), 0],
        [0, 0, r * 0.45]
      ]);
    }
    if (shape) prims.push({ shape, group, material: kind === 3 ? 6 : material, domain, flags, d });
  }
  for (const { shape, group, material, domain } of prims) {
    const [x0, y0, x1, y1] = shape.bounds;
    const ix0 = clamp(Math.floor(originX + x0 * pixelScale), 0, size - 1),
      ix1 = clamp(Math.ceil(originX + x1 * pixelScale), 0, size - 1);
    const iy0 = clamp(Math.floor(originY - y1 * pixelScale), 0, size - 1),
      iy1 = clamp(Math.ceil(originY - y0 * pixelScale), 0, size - 1);
    for (let y = iy0; y <= iy1; y++)
      for (let x = ix0; x <= ix1; x++) {
        const hit = shape.sample(
          (x + 0.5 - originX) / pixelScale,
          (originY - y - 0.5) / pixelScale
        );
        if (!hit) continue;
        const index = y * size + x;
        if (hit[0] < depth[index]) continue;
        const lighting = dot(hit[1], light);
        // Smooth close same-group overlaps instead of outlining every anatomical mass.
        normals[index] =
          groups[index] === group && hit[0] - depth[index] < 1.8
            ? (normals[index] + lighting) * 0.5
            : lighting;
        depth[index] = hit[0];
        groups[index] = group;
        materials[index] = material;
        domains[index] = domain;
        const vx = (x + 0.5 - originX) / pixelScale,
          vy = (originY - y - 0.5) / pixelScale;
        const yaw = (animation.direction * Math.PI) / 8,
          e = (62 * Math.PI) / 180;
        const gz = -Math.sin(e) * vy + Math.cos(e) * hit[0];
        localX[index] = Math.cos(yaw) * vx - Math.sin(yaw) * gz;
        localZ[index] = Math.sin(yaw) * vx + Math.cos(yaw) * gz;
      }
  }
  for (let y = 1; y < size - 1; y++)
    for (let x = 1; x < size - 1; x++) {
      const i = y * size + x;
      if (materials[i] < 0) continue;
      const edge = [i - 1, i + 1, i - size, i + size].some((j) => materials[j] < 0);
      const n = normals[i];
      // Restrained tint ramps around authoritative body RGB. No hue rerolls or white patches.
      let delta = n > 0.78 ? 0.075 : n > 0.4 ? 0.025 : n > 0.0 ? -0.025 : -0.075;
      if (domains[i] === 1 || domains[i] === 2 || domains[i] === 4) {
        const wave =
          Math.sin(localX[i] * 0.85 + appearance.marking * 4) + Math.cos(localZ[i] * 1.2);
        if (wave > 1.05) delta -= 0.045;
      }
      if (edge) delta = -0.12;
      for (let c = 0; c < 3; c++)
        pixels[i * 4 + c] = silhouette
          ? 35
          : Math.round(clamp(appearance.rgb[c] + delta, 0, 1) * 255);
      if (materials[i] === 6 && !silhouette) {
        pixels[i * 4] = 25;
        pixels[i * 4 + 1] = 29;
        pixels[i * 4 + 2] = 24;
      }
      pixels[i * 4 + 3] = 255;
    }
  return { pixels, width: size, height: size, originX, originY, pixelScale, extent };
}
