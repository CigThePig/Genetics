import { describe, it, expect, vi } from 'vitest';
import { createSettings } from '../src/app/settings.js';
import { createInput } from '../src/input/index.js';
import { createCamera } from '../src/render/camera.js';
import { createPerfSampler } from '../src/metrics/perf.js';
import { simConfig, configMeta, applyPreset } from '../src/sim/config.js';
import {
  saveStoredSet,
  saveStoredBool,
  saveSectionState,
  loadStoredSet
} from '../src/ui/config-storage.js';

describe('repository audit: app boundaries', () => {
  it('boots settings when the browser denies access to the storage getter', () => {
    vi.stubGlobal(
      'window',
      Object.defineProperty({}, 'localStorage', {
        get() {
          throw Error('denied');
        }
      })
    );
    try {
      expect(createSettings().load()).toMatchObject({ seed: 1, speed: 1 });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('keeps preference changes usable when storage writes fail', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem() {
        throw Error('quota');
      }
    });
    try {
      expect(() => saveStoredSet('a', new Set([1]))).not.toThrow();
      expect(() => saveStoredBool('a', true)).not.toThrow();
      expect(() => saveSectionState('a', {})).not.toThrow();
      expect(loadStoredSet('a')).toEqual(new Set());
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('does not turn a cancelled touch into a selection', () => {
    const listeners = new Map();
    const canvas = {
      contains: () => true,
      setPointerCapture() {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
      addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener() {}
    };
    const onTap = vi.fn(),
      input = createInput({ canvas, camera: createCamera(), onTap });
    input.attach();
    const event = {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 20,
      clientY: 20,
      target: canvas,
      preventDefault() {}
    };
    listeners.get('pointerdown')(event);
    listeners.get('pointercancel')({ ...event, type: 'pointercancel' });
    expect(onTap).not.toHaveBeenCalled();
    listeners.get('pointerdown')(event);
    listeners.get('pointerup')({ ...event, type: 'pointerup' });
    expect(onTap).toHaveBeenCalledTimes(1);
    input.detach();
  });

  it('preserves the world point at the viewport center when button zooming', () => {
    const camera = createCamera({ x: 100, y: 50, zoom: 1 });
    camera.zoomTo(2);
    expect(camera.getState()).toMatchObject({ x: 200, y: 100, zoom: 2 });
    camera.followCreature(99);
    camera.updateFollow([], 20, 120, 160);
    expect(camera.getState().isFollowing).toBe(false);
  });

  it('honors disabled profiler groups even for externally supplied start times', () => {
    const perf = createPerfSampler();
    perf.setGroupEnabled('frame', false);
    perf.end('frame.delta', performance.now() - 10);
    expect(perf.snapshot().timers).toEqual([]);
    perf.setGroupEnabled('frame', true);
    perf.end('frame.delta', performance.now() - 10);
    expect(perf.snapshot().timers).toHaveLength(1);
    perf.setEnabled(false);
    perf.setEnabled(true);
    expect(perf.snapshot().timers).toEqual([]);
  });

  it('has metadata for all defaults and clones nested state when applying a preset', () => {
    expect(Object.keys(configMeta).sort()).toEqual(Object.keys(simConfig).sort());
    const config = { ...simConfig, creatureGenomeDefaults: { default: { speed: 0.5 } } };
    const preset = applyPreset(config, 'natural');
    preset.creatureGenomeDefaults.default.speed = 0;
    expect(config.creatureGenomeDefaults.default.speed).toBe(0.5);
  });
});
