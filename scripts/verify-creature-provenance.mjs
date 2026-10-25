import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = 'tools/creature-baker/';
const manifest = JSON.parse(readFileSync(`${root}upstream.json`, 'utf8'));
const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(`${dir}/${e.name}`) : [`${dir}/${e.name}`]
  );
const found = files(`${root}vendor`)
  .map((p) => p.slice(`${root}vendor/`.length))
  .sort();
assert.deepEqual(found, Object.keys(manifest.files).sort());
for (const [path, expected] of Object.entries(manifest.files))
  assert.equal(
    createHash('sha256')
      .update(readFileSync(`${root}vendor/${path}`))
      .digest('hex'),
    expected,
    path
  );
assert.equal(
  readFileSync(`${root}vendor/LICENSE`, 'utf8'),
  readFileSync('public/licenses/procedural-pixel-creatures.txt', 'utf8')
);
console.log(
  `Verified ${found.length} unchanged upstream files at ${manifest.revision}, including the distributed MIT license.`
);
