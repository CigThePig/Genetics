import anatomy from './anatomy.js';
import { clamp01, hslToRgb } from '../../sim/colour.js';

export const APPEARANCE_VERSION = 1;
export const CREATURE_FAMILIES = Object.freeze({
  square: {
    name: 'Brambleback',
    description: 'Compact berry forager; round ears and a blunt muzzle.'
  },
  circle: {
    name: 'Meadowhorn',
    description: 'Long-eared grazer; raised shoulders and short horns.'
  },
  triangle: {
    name: 'Needlefox',
    description: 'Lean pursuit hunter; pointed ears and a long muzzle.'
  },
  octagon: {
    name: 'Reedstalker',
    description: 'Low, sprawling hunter; broad head and a tapering tail.'
  }
});

const gene = (c, key) => clamp01(c?.genome?.[key] ?? 0.5);

// A presentation mapping of existing inherited loci, not another genome or fitness model.
// No IDs or birth-time randomness: equal inherited input means equal anatomy/markings.
export function describeAppearance(creature) {
  const species = anatomy.models[creature?.species] ? creature.species : 'square';
  const speed = gene(creature, 'speed');
  const perception = gene(creature, 'perceptionRange');
  const marking = gene(creature, 'longevity');
  const breadth = 0.92 + gene(creature, 'basalEnergyDrain') * 0.16;
  const rgb =
    creature?.traits?.bodyRgb?.map(clamp01) ??
    hslToRgb(
      creature?.genome?.bodyHue ?? 0.25,
      creature?.genome?.bodySaturation ?? 0.45,
      creature?.genome?.bodyLightness ?? 0.45
    );
  return {
    version: APPEARANCE_VERSION,
    species,
    speed,
    perception,
    marking,
    breadth,
    rgb,
    key: JSON.stringify([APPEARANCE_VERSION, species, speed, perception, marking, breadth, rgb])
  };
}

export function visualScale(creature) {
  // Effective age already accounts for the inherited growth rate in authoritative life stages.
  const stage = creature?.lifeStage?.id;
  return stage === 'juvenile' ? 0.72 : stage === 'elder' ? 0.96 : 1;
}

export function sampleAnimation(creature, seconds = 0) {
  const speed = Math.hypot(creature?.motion?.velocity?.x ?? 0, creature?.motion?.velocity?.y ?? 0);
  const heading = Number.isFinite(creature?.motion?.heading) ? creature.motion.heading : 0;
  const type = creature?.intent?.type;
  const moving = speed > 0.04;
  const running =
    moving &&
    (creature?.sprinting ||
      creature?.herding?.isThreatened ||
      creature?.chase?.status === 'pursuing');
  const state = moving
    ? running
      ? 'run'
      : 'walk'
    : type === 'rest'
      ? 'rest'
      : ['eat', 'drink'].includes(type)
        ? 'action'
        : 'idle';
  // The life-story odometer accumulates actual displacement, including collisions/braking.
  // Standalone actors without observation data use deterministic simulation-time travel.
  const distance = creature?.lifeStory?.distance;
  const [low, high] = getAnatomy(creature?.species);
  const t = gene(creature, 'speed');
  const clipLow = low.clips[state],
    clipHigh = high.clips[state];
  const stride =
    clipLow.rootSpeed * clipLow.duration * (1 - t) + clipHigh.rootSpeed * clipHigh.duration * t;
  const extent = Math.max(low.radius, high.radius) * 1.05;
  const strideTiles = Math.max(0.1, (stride * 3 * visualScale(creature)) / (extent * 2));
  const phase = moving
    ? (Number.isFinite(distance) ? distance : seconds * speed) / strideTiles
    : seconds / 2;
  const count = state === 'idle' || state === 'rest' ? 12 : 8;
  return {
    state,
    frame: ((Math.floor(phase * count) % count) + count) % count,
    direction: ((Math.round(-heading / (Math.PI / 8)) % 16) + 16) % 16,
    speed
  };
}

export function getAnatomy(species) {
  return anatomy.models[species] ?? anatomy.models.square;
}
