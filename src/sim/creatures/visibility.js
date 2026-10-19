import { habitatRgbAt } from '../habitat-colours.js';
import { colourContrast, hslToRgb, clamp01 } from '../colour.js';
import { getTerrainEffectsAt } from '../terrain-effects.js';

export function camouflageAt(target, world, config = {}, observer = null) {
  const traits = target?.traits ?? {};
  const rgb =
    traits.bodyRgb ??
    hslToRgb(traits.bodyHue ?? 0.25, traits.bodySaturation ?? 0.45, traits.bodyLightness ?? 0.45);
  const x = Math.floor(target?.position?.x ?? -1),
    y = Math.floor(target?.position?.y ?? -1);
  const i = world?.getIndex(x, y) ?? -1;
  const contrast = colourContrast(
    rgb,
    habitatRgbAt(world, i, config),
    observer?.traits?.colourDiscrimination ?? 0.5
  );
  const velocity = target?.motion?.velocity;
  const speed = Math.hypot(velocity?.x ?? 0, velocity?.y ?? 0);
  const movement = clamp01(speed / Math.max(0.1, traits.speed ?? 1));
  return { contrast, movement, exposure: Math.min(1, 0.48 + contrast * 0.8 + movement * 0.16) };
}

export function visibilityRange(observer, target, world, config = {}, range = 0, tracked = false) {
  if (!world) return Math.max(0, range); // Standalone/legacy callers without habitat data.
  const p = observer?.position;
  const terrain = getTerrainEffectsAt(
    world,
    Math.floor(p?.x ?? -1),
    Math.floor(p?.y ?? -1)
  ).perception;
  const base =
    Number.isFinite(config.creaturePerceptionRange) && config.creaturePerceptionRange > 0
      ? config.creaturePerceptionRange
      : 10;
  const senses = Number.isFinite(observer?.traits?.perceptionRange)
    ? observer.traits.perceptionRange / base
    : 1;
  const exposure =
    config.colourCamouflageEnabled === false ||
    (!target?.traits?.bodyRgb && !Number.isFinite(target?.traits?.bodyHue))
      ? 1
      : camouflageAt(target, world, config, observer).exposure;
  // Within 2 tiles, shape/motion and non-colour cues defeat concealment. Tracking adds hysteresis.
  return Math.min(
    range,
    Math.max(
      Math.min(2, range),
      range *
        Math.min(1.25, Math.max(0.25, senses)) *
        terrain *
        Math.min(1, exposure + (tracked ? 0.18 : 0))
    )
  );
}
export function canSeeCreature(observer, target, world, config, range, tracked = false) {
  if (!observer?.position || !target?.position || target.meters?.hp <= 0) return false;
  const distanceSq =
    (target.position.x - observer.position.x) ** 2 + (target.position.y - observer.position.y) ** 2;
  const visibleRange = visibilityRange(observer, target, world, config, range, tracked);
  return distanceSq <= visibleRange * visibleRange;
}
