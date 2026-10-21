import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Hash every source file, including defaults, noise and ecological dependencies.
// Paths and byte lengths delimit entries; lexical ordering is platform independent.
export function worldProvenance(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(resolve(root, directory), { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) files.push(path);
      else throw new Error(`Unsupported source entry: ${path}`);
    }
  };
  visit('src');
  files.sort();
  const hash = createHash('sha256');
  for (const file of files) {
    const content = readFileSync(resolve(root, file));
    hash.update(JSON.stringify([file, content.length]) + '\n');
    hash.update(content);
  }
  let sourceCommit = null;
  let sourceDirty = null;
  try {
    const git = (args) =>
      execFileSync('git', ['-C', root, ...args], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim();
    sourceCommit = git(['rev-parse', 'HEAD']);
    sourceDirty = git(['status', '--porcelain', '--untracked-files=all', '--', 'src']).length > 0;
  } catch {
    // Source-only checkouts still have an exact content fingerprint.
  }
  return {
    fingerprint: hash.digest('hex'),
    fingerprintAlgorithm: 'sha256-src-v1',
    fingerprintFiles: files,
    sourceCommit,
    sourceDirty
  };
}
