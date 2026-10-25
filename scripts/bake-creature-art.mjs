// Normal hosts: dotnet run --project tools/creature-baker -- src/render/creatures/anatomy.js
// Optional direct compiler path for executors without usable process metadata.
import { spawnSync } from 'node:child_process';
import { readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
const dotnet = process.env.DOTNET_ROOT ? join(process.env.DOTNET_ROOT, 'dotnet') : 'dotnet';
const run = (args) => {
  const r = spawnSync(dotnet, args, { stdio: 'inherit' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw Error(`dotnet failed (${r.status})`);
};
if (!process.argv.includes('--direct'))
  run(['run', '--project', 'tools/creature-baker', '--', 'src/render/creatures/anatomy.js']);
else {
  const root = process.env.DOTNET_ROOT;
  if (!root) throw Error('--direct needs DOTNET_ROOT');
  const files = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]
    );
  const latest = (dir) =>
    readdirSync(dir)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .at(-1);
  const sdk = join(root, 'sdk', latest(join(root, 'sdk'))),
    refVersion = latest(join(root, 'packs/Microsoft.NETCore.App.Ref'));
  const temp = mkdtempSync(join(tmpdir(), 'genetics-art-'));
  try {
    const output = join(temp, 'Baker.dll');
    const args = [
      '-nologo',
      '-target:exe',
      `-out:${output}`,
      '-nullable:enable',
      '-langversion:12',
      ...files(join(root, 'packs/Microsoft.NETCore.App.Ref', refVersion, 'ref/net8.0'))
        .filter((p) => p.endsWith('.dll'))
        .map((p) => `-r:${p}`),
      ...files('tools/creature-baker')
        .filter((p) => p.endsWith('.cs') && !p.includes('/obj/') && !p.includes('/bin/'))
        .map((p) => resolve(p))
    ];
    writeFileSync(join(temp, 'compile.rsp'), args.map((a) => `"${a}"`).join('\n'));
    run(['exec', join(sdk, 'Roslyn/bincore/csc.dll'), `@${join(temp, 'compile.rsp')}`]);
    writeFileSync(
      join(temp, 'Baker.runtimeconfig.json'),
      JSON.stringify({
        runtimeOptions: {
          tfm: 'net8.0',
          framework: { name: 'Microsoft.NETCore.App', version: refVersion },
          configProperties: { 'System.Globalization.Invariant': true }
        }
      })
    );
    run([output, 'src/render/creatures/anatomy.js']);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}
