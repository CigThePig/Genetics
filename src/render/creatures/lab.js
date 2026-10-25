import { createCreatureGenome, inheritCreatureGenome } from '../../sim/creatures/genetics.js';
import { createCreatureTraits } from '../../sim/creatures/traits.js';
import { createRng } from '../../sim/rng.js';
import { simConfig } from '../../sim/config.js';
import { describeAppearance, CREATURE_FAMILIES } from './appearance.js';
import { rasterizeCreature } from './raster.js';

const canvas = document.querySelector('#gallery'),
  ctx = canvas.getContext('2d');
const el = (id) => document.getElementById(id);
let seconds = 0,
  paused = false,
  direction = 1,
  animals = [],
  last = 0,
  signature = '',
  cached = [];
function generate() {
  const rng = createRng(Number(el('seed').value) || 0);
  animals = [];
  for (const species of ['square', 'circle', 'triangle', 'octagon']) {
    const row = [];
    for (let i = 0; i < 8; i++) {
      let genome = createCreatureGenome({ config: simConfig, species, rng });
      if (el('view').value === 'extremes')
        genome = {
          ...genome,
          speed: i / 7,
          perceptionRange: i / 7,
          longevity: i / 7,
          basalEnergyDrain: i / 7
        };
      if (el('view').value === 'family' && i >= 2)
        genome = inheritCreatureGenome({
          parentA: row[0],
          parentB: row[1],
          config: simConfig,
          rng
        });
      row.push({
        species,
        genome,
        traits: createCreatureTraits({ config: simConfig, species, genome })
      });
    }
    animals.push(row);
  }
  signature = '';
}
for (const id of ['seed', 'view']) el(id).addEventListener('change', generate);
for (const id of ['state', 'ground', 'style'])
  el(id).addEventListener('change', () => {
    signature = '';
  });
el('pause').onclick = () => {
  paused = !paused;
  el('pause').textContent = paused ? 'Resume animation' : 'Pause animation';
};
el('turn').onclick = () => {
  direction = (direction + 1) % 16;
  signature = '';
};
generate();
window.addEventListener('resize', () => {
  signature = '';
});
window.__creatureLab = {
  seek(time, facing = direction) {
    seconds = Math.max(0, time);
    direction = ((facing % 16) + 16) % 16;
    paused = true;
    signature = '';
    el('pause').textContent = 'Resume animation';
  }
};
function draw(now) {
  if (!paused) seconds += Math.min(0.1, (now - last) / 1000);
  last = now;
  const state = el('state').value,
    frame = Math.floor(seconds * 6) % (state === 'idle' || state === 'rest' ? 12 : 8);
  const key = [
    state,
    frame,
    direction,
    el('style').value,
    el('ground').value,
    el('view').value
  ].join();
  if (key !== signature) {
    signature = key;
    cached = [];
    const width = Math.max(300, Math.min(1200, window.innerWidth - 40));
    const columns = width < 600 ? 2 : width < 1000 ? 4 : 8;
    const cellWidth = width / columns,
      headerHeight = width < 600 ? 100 : 65;
    const speciesHeight = headerHeight + Math.ceil(8 / columns) * 180;
    canvas.width = width;
    canvas.height = speciesHeight * 4;
    ctx.fillStyle = el('ground').value;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < 4; row++) {
      const species = animals[row][0].species;
      ctx.fillStyle = '#182d20';
      ctx.font = '23px Georgia';
      ctx.fillText(
        `${species[0].toUpperCase() + species.slice(1)}s · ${CREATURE_FAMILIES[species].name}`,
        25,
        row * speciesHeight + 30
      );
      ctx.font = '13px system-ui';
      let line = '',
        textY = row * speciesHeight + 53;
      for (const word of CREATURE_FAMILIES[species].description.split(' ')) {
        if (ctx.measureText(line + word).width > width - 50) {
          ctx.fillText(line, 25, textY);
          textY += 16;
          line = '';
        }
        line += word + ' ';
      }
      ctx.fillText(line, 25, textY);
      for (let i = 0; i < 8; i++) {
        const r = rasterizeCreature(
          describeAppearance(animals[row][i]),
          { state, frame, direction },
          112,
          { silhouette: el('style').value === 'silhouette' }
        );
        const image = document.createElement('canvas');
        image.width = 112;
        image.height = 112;
        const ic = image.getContext('2d'),
          data = ic.createImageData(112, 112);
        data.data.set(r.pixels);
        ic.putImageData(data, 0, 0);
        cached.push(image);
        ctx.imageSmoothingEnabled = false;
        const cellX = (i % columns) * cellWidth,
          cellY = row * speciesHeight + headerHeight + Math.floor(i / columns) * 180;
        ctx.drawImage(image, cellX + (cellWidth - 140) / 2, cellY, 140, 140);
        ctx.font = '12px system-ui';
        ctx.fillStyle = '#182d20';
        ctx.fillText(
          el('view').value === 'family'
            ? i === 0
              ? 'Parent A'
              : i === 1
                ? 'Parent B'
                : `Offspring ${i - 1}`
            : `Individual ${i + 1}`,
          cellX + 20,
          cellY + 155
        );
      }
    }
    el('status').textContent = `Seed ${el('seed').value} · ${state} · direction ${direction}/16`;
  }
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
