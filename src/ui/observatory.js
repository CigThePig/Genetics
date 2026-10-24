/** Read-only census and compact, dependency-free interface artwork. */
const paths = {
  fit: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><rect x="7" y="7" width="10" height="10" rx="1"/>',
  center: '<circle cx="12" cy="12" r="6"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5"/>',
  leaf: '<path d="M19 4C8 2 3 7 5 14c2 7 13 5 14-10Z"/><path d="M4 21 15 9M9 16v-5m0 5h5"/>',
  census: '<path d="M4 20V10h4v10m4 0V4h4v16m4 0V8M2 20h20"/>',
  chart: '<path d="M3 3v18h18M6 16l5-6 4 3 6-8"/>',
  settings:
    '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
  inspect: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6m-3-3v6"/>',
  play: '<path d="m8 5 11 7-11 7Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  step: '<path d="m5 5 10 7-10 7ZM19 5v14"/>'
};
export function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.leaf}</svg>`;
}
export function labelButton(button, name, label) {
  button.innerHTML = `${icon(name)}<span>${label}</span>`;
  button.setAttribute('aria-label', label);
}

export function createCensus(container, onExplore) {
  const census = document.createElement('aside');
  census.className = 'world-census';
  census.setAttribute('aria-label', 'Live ecosystem census');
  census.innerHTML = `
    <div class="census-heading"><span class="eyebrow">Field census</span><span class="census-tag">LIVE DATA</span></div>
    <div class="census-total"><strong data-value="creatureCount">—</strong><span>lives in<br>this world</span></div>
    <div class="census-species"></div>
    <div class="census-foot"><span>Births <b data-value="birthsTotal">—</b></span><span>Deaths <b data-value="deathsTotal">—</b></span></div>
    <button class="census-explore" type="button">Explore the ecosystem <span aria-hidden="true">↗</span></button>`;
  const species = [
    ['squaresCount', 'Squares', 'square', 'Herbivore'],
    ['circlesCount', 'Circles', 'circle', 'Herbivore'],
    ['trianglesCount', 'Triangles', 'triangle', 'Predator'],
    ['octagonsCount', 'Octagons', 'octagon', 'Predator']
  ];
  const rows = census.querySelector('.census-species');
  for (const [key, label, shape, diet] of species) {
    const row = document.createElement('div');
    row.className = `census-species-row species-${shape}`;
    row.innerHTML = `<span class="species-glyph" aria-hidden="true"></span><span class="species-label">${label}<small>${diet}</small></span><strong data-value="${key}">—</strong>`;
    rows.append(row);
  }
  census.querySelector('button').addEventListener('click', onExplore);
  container.append(census);
  const nodes = [...census.querySelectorAll('[data-value]')];
  return {
    update(summary) {
      for (const node of nodes) {
        const value = summary[node.dataset.value];
        const text = Number.isFinite(value) ? Math.round(value).toLocaleString('en') : '—';
        if (node.textContent !== text) node.textContent = text;
      }
    }
  };
}
