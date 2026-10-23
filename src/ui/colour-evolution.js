import { SPECIES_LIST, getSpeciesLabel } from '../sim/species.js';
import { EVOLUTION_GENES } from '../sim/evolution-metrics.js';

export function createColourEvolution(container) {
  const panel = document.createElement('section');
  panel.className = 'colour-evolution';
  const heading = document.createElement('h3');
  heading.textContent = 'Evolution history';
  const speciesSelect = document.createElement('select');
  speciesSelect.setAttribute('aria-label', 'Colour graph species');
  for (const species of SPECIES_LIST) {
    const option = document.createElement('option');
    option.value = species;
    option.textContent = getSpeciesLabel(species);
    speciesSelect.append(option);
  }
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.value = '0';
  slider.step = '1';
  slider.setAttribute('aria-label', 'Earlier colour snapshot');
  const label = document.createElement('p'),
    charts = document.createElement('div');
  const traitSelect = document.createElement('select');
  traitSelect.setAttribute('aria-label', 'Inherited trait distribution');
  for (const [key, name] of Object.entries(EVOLUTION_GENES)) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = name;
    traitSelect.append(option);
  }
  const hint = document.createElement('small');
  hint.textContent =
    'Hue bins run red → green → blue → red. Outline: earlier population; solid: latest sample. Heights show fractions, counts show sample size. Slide to compare history (10-second samples; latest 20 minutes plus founding population).';
  const traitHint = document.createElement('small');
  traitHint.textContent =
    'Inherited values run 0–1. Speed carries energy/water costs; growth shortens life. Changes can reflect selection, drift, migration or age composition; these graphs alone do not demonstrate adaptation.';
  panel.append(heading, speciesSelect, label, slider, traitSelect, charts, hint, traitHint);
  container.append(panel);
  let data = [],
    latest = null,
    lastKey = '';
  const render = () => {
    if (!data.length) return;
    const earlier = data[Math.min(data.length - 1, Number(slider.value))],
      now = latest;
    const key = speciesSelect.value,
      a = earlier.species[key],
      b = now.species[key];
    label.textContent = `Tick ${earlier.tick} (n=${a.count}) → ${now.tick} (n=${b.count}), generation ≤ ${b.maxGeneration}`;
    charts.replaceChildren();
    const gene = traitSelect.value;
    const oldGene = a.genes?.[gene],
      currentGene = b.genes?.[gene];
    if (oldGene && currentGene) {
      const title = document.createElement('p');
      const describe = (s) =>
        s.count
          ? `${s.mean.toFixed(3)} ± ${Math.sqrt(s.variance).toFixed(3)} (n=${s.count})`
          : 'no sample';
      title.textContent = `${EVOLUTION_GENES[gene]}: mean ± SD ${describe(oldGene)} → ${describe(currentGene)}`;
      const bars = document.createElement('div');
      bars.className = 'colour-histogram';
      bars.style.gridTemplateColumns = 'repeat(10, 1fr)';
      bars.setAttribute('role', 'img');
      bars.setAttribute(
        'aria-label',
        `${EVOLUTION_GENES[gene]}: earlier bin counts ${oldGene.histogram.join(', ')}; latest ${currentGene.histogram.join(', ')}`
      );
      const max = Math.max(
        0.01,
        ...[oldGene, currentGene].flatMap((s) => s.histogram.map((n) => n / Math.max(1, s.count)))
      );
      for (let i = 0; i < 10; i++) {
        const slot = document.createElement('div');
        slot.className = 'colour-bin';
        const earlierBar = document.createElement('i'),
          nowBar = document.createElement('b');
        earlierBar.style.cssText = `height:${(oldGene.histogram[i] / Math.max(1, oldGene.count) / max) * 100}%;border-color:#a8cce9`;
        nowBar.style.cssText = `height:${(currentGene.histogram[i] / Math.max(1, currentGene.count) / max) * 100}%;background:#70b6d9`;
        slot.title = `${(i / 10).toFixed(1)}–${((i + 1) / 10).toFixed(1)}: ${oldGene.histogram[i]} → ${currentGene.histogram[i]}`;
        slot.append(earlierBar, nowBar);
        bars.append(slot);
      }
      charts.append(title, bars);
    }
    for (const [field, name] of [
      ['body', 'Body hue'],
      ['preference', 'Preferred mate hue']
    ]) {
      const title = document.createElement('div');
      title.textContent = name;
      const bars = document.createElement('div');
      bars.className = 'colour-histogram';
      bars.setAttribute('role', 'img');
      const max = Math.max(
        0.01,
        ...a[field].histogram.map((v) => v / Math.max(1, a.count)),
        ...b[field].histogram.map((v) => v / Math.max(1, b.count))
      );
      bars.setAttribute(
        'aria-label',
        `${name}: earlier bin counts ${a[field].histogram.join(', ')}; latest ${b[field].histogram.join(', ')}`
      );
      for (let i = 0; i < 12; i++) {
        const slot = document.createElement('div');
        slot.className = 'colour-bin';
        const old = document.createElement('i'),
          current = document.createElement('b');
        const hue = (i + 0.5) * 30;
        old.style.cssText = `height:${(a[field].histogram[i] / Math.max(1, a.count) / max) * 100}%;border-color:hsl(${hue},70%,65%)`;
        current.style.cssText = `height:${(b[field].histogram[i] / Math.max(1, b.count) / max) * 100}%;background:hsl(${hue},65%,55%)`;
        slot.title = `${i * 30}–${(i + 1) * 30}°: ${a[field].histogram[i]} → ${b[field].histogram[i]}`;
        slot.append(old, current);
        bars.append(slot);
      }
      charts.append(title, bars);
    }
  };
  speciesSelect.addEventListener('change', render);
  traitSelect.addEventListener('change', render);
  slider.addEventListener('input', render);
  return {
    update(summary, force = false) {
      const history = summary?.colourHistory;
      if (!history?.length) return;
      latest = history.at(-1);
      const nextKey = `${summary.seed}:${latest.tick}:${history.length}`;
      if (!force && nextKey === lastKey) return;
      lastKey = nextKey;
      data =
        summary.colourBaseline && summary.colourBaseline.tick !== history[0].tick
          ? [summary.colourBaseline, ...history]
          : history;
      slider.max = String(data.length - 1);
      render();
    },
    reset() {
      data = [];
      latest = null;
      lastKey = '';
      slider.value = '0';
      charts.replaceChildren();
      label.textContent = '';
    }
  };
}
