import { SPECIES_LIST, getSpeciesLabel } from '../sim/species.js';

export function createColourEvolution(container) {
  const panel = document.createElement('section');
  panel.className = 'colour-evolution';
  const heading = document.createElement('h3');
  heading.textContent = 'Colour evolution';
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
  const hint = document.createElement('small');
  hint.textContent =
    'Hue bins run red → green → blue → red. Outline: earlier population; solid: latest sample. Heights show fractions, counts show sample size. Slide to compare history (10-second samples; latest 20 minutes plus founding population).';
  panel.append(heading, speciesSelect, label, slider, charts, hint);
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
