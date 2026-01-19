import { createSim } from './sim/sim.js';
import { createRenderer } from './render/renderer.js';
import { createMetrics } from './metrics/index.js';
import { createUI } from './ui/index.js';

const app = document.querySelector('#app');

const title = document.createElement('h1');
title.textContent = 'Genetics Scaffold';

const status = document.createElement('p');
status.textContent = 'Bootstrapped Vite app with sim/render/ui stubs.';

app.append(title, status);

const sim = createSim();
const renderer = createRenderer(app);
const metrics = createMetrics({ container: app });
const ui = createUI({ statusNode: status, metrics });

renderer.render(sim);
ui.setStatus('Ready for Track 1.');
