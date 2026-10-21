import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { worldProvenance } from '../scripts/world-provenance.mjs';

describe('world diagnostic review regressions', () => {
  it('fingerprints noise, defaults and all other source files, including new files', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'genetics-source-'));
    try {
      mkdirSync(resolve(root, 'src/sim'), { recursive: true });
      const noise = resolve(root, 'src/sim/noise.js');
      const defaults = resolve(root, 'src/sim/config-defaults.js');
      writeFileSync(noise, 'noise v1');
      writeFileSync(defaults, 'defaults v1');
      const first = worldProvenance(root);
      expect(first.fingerprintFiles).toEqual(['src/sim/config-defaults.js', 'src/sim/noise.js']);
      expect(first.sourceCommit).toBe(null);
      expect(worldProvenance(root).fingerprint).toBe(first.fingerprint);
      writeFileSync(noise, 'noise v2');
      const next = worldProvenance(root).fingerprint;
      expect(next).not.toBe(first.fingerprint);
      writeFileSync(defaults, 'defaults v2');
      const changedDefaults = worldProvenance(root).fingerprint;
      expect(changedDefaults).not.toBe(next);
      writeFileSync(resolve(root, 'src/sim/new-dependency.js'), 'new');
      expect(worldProvenance(root).fingerprint).not.toBe(changedDefaults);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('exits after browser launch failure and releases the Vite child', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'genetics-browser-'));
    try {
      const stub = resolve(root, 'playwright.cjs');
      writeFileSync(
        stub,
        "exports.chromium = { launch: async () => { throw Error('controlled launch failure'); } };\n"
      );
      const result = spawnSync(process.execPath, ['scripts/verify-world-app.cjs'], {
        cwd: process.cwd(),
        env: { ...process.env, PLAYWRIGHT_MODULE: stub },
        timeout: 10000,
        encoding: 'utf8'
      });
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('controlled launch failure');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 15000);
});
