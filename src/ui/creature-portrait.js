import { createCreatureView } from '../render/creatures/view.js';
import { CREATURE_FAMILIES } from '../render/creatures/appearance.js';

export function createCreaturePortrait() {
  const element = document.createElement('figure');
  element.className = 'creature-portrait';
  const canvas = document.createElement('canvas');
  canvas.width = 180;
  canvas.height = 120;
  canvas.setAttribute('role', 'img');
  const caption = document.createElement('figcaption');
  element.append(canvas, caption);
  // Headless DOM-only consumers still receive the textual species description.
  const ctx = typeof CanvasRenderingContext2D === 'undefined' ? null : canvas.getContext('2d');
  const view = ctx ? createCreatureView({ maxBytes: 512 * 1024 }) : null;
  return {
    element,
    clear() {
      view?.clear();
    },
    update(creature, world, seconds) {
      const family = CREATURE_FAMILIES[creature?.species];
      caption.textContent = family ? `${family.name} · inherited anatomy & colour` : '';
      canvas.setAttribute(
        'aria-label',
        family ? `${family.name}, individual #${creature.id}` : 'Creature portrait'
      );
      element.hidden = !creature?.genome;
      if (!ctx || element.hidden) return;
      view.begin(world);
      ctx.clearRect(0, 0, 180, 120);
      view.draw(ctx, creature, { x: 90, y: 80, tileSize: 72, zoom: 1, seconds, force: true });
    }
  };
}
