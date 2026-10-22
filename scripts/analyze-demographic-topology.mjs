// Pure static component audit. Never touches a running simulation.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { generateTerrain } from '../src/sim/terrain-generator.js';
import { connectedComponents } from '../src/sim/habitat-analysis.js';
for (const input of process.argv.slice(2)) {
  const bytes = readFileSync(input);
  const lines = (input.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString().trim().split('\n');
  for (const line of lines) {
    const r = JSON.parse(line),
      config = r.config;
    const world = createWorldGrid({ width: config.worldWidth, height: config.worldHeight });
    generateTerrain({ world, config });
    const components = connectedComponents(world, true).sort((a, b) => b.size - a.size);
    const labels = new Int32Array(world.cells.length).fill(-1);
    components.forEach((c, id) => c.indices.forEach((i) => (labels[i] = id)));
    const component = (c) =>
      labels[world.getIndex(Math.floor(c.birthplace.x), Math.floor(c.birthplace.y))] ?? -1;
    const byId = new Map(r.records.map((c) => [c.id, c])),
      result = {};
    for (const species of ['square', 'circle', 'triangle', 'octagon']) {
      const rows = r.records.filter((c) => c.species === species),
        founders = new Set(rows.filter((c) => c.generation === 0).map(component));
      const children = rows.filter((c) => c.generation > 0);
      result[species] = {
        foundingLandComponents: [...founders],
        births: children.length,
        birthsOutsideFoundingComponents: children.filter((c) => !founders.has(component(c))).length,
        birthsOnWater: children.filter((c) => component(c) < 0).length,
        birthsAcrossMotherComponent: children.filter((c) => {
          const mother = c.parents.map((id) => byId.get(id)).find((p) => p?.sex === 'female');
          return mother && component(mother) !== component(c);
        }).length
      };
    }
    console.log(
      JSON.stringify({
        input,
        seed: r.seed,
        ticks: r.ticks,
        landComponents: components.length,
        largestLandFraction: components[0].size / components.reduce((sum, c) => sum + c.size, 0),
        species: result
      })
    );
  }
}
