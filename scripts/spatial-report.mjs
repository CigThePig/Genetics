import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

// Archives factor immutable individual data out of repeated snapshots. This
// reconstructs the same observations without changing genotype or position.
export function readSpatialReport(path) {
  const bytes = readFileSync(path);
  const report = JSON.parse(path.endsWith('.gz') ? gunzipSync(bytes) : bytes);
  if (report.encoding === 'spatial-report-deduplicated-v1') {
    for (const frame of report.history)
      for (const row of Object.values(frame.species))
        if (row.samples)
          row.samples = row.samples.map((sample) => {
            const profile = report.individuals?.[sample.id];
            if (!profile) throw new Error(`Missing archived individual ${sample.id}`);
            return { ...profile, ...sample };
          });
  }
  return report;
}
