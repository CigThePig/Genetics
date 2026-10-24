// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWorldGrid } from '../src/sim/world-grid.js';
import { createLiveInspector } from '../src/ui/live-inspector.js';

const animal = (id, parents = []) => ({
  id,
  position: { x: 2, y: 2 },
  lineage: { parents },
  lifeStory: {
    distance: 0,
    flights: 0,
    children: 0,
    events: Array.from({ length: 12 }, (_, i) => ({ seconds: i, text: `Event ${i}` }))
  }
});
afterEach(() => document.body.replaceChildren());
describe('persistent life story inspector', () => {
  for (const deceased of [false, true]) {
    it(`keeps pressed family buttons and scrolled events through updates (memorial ${deceased})`, () => {
      const parent = animal(1),
        child = animal(2, [1]);
      const follow = vi.fn();
      const inspector = createLiveInspector({ container: document.body, onFollowToggle: follow });
      const state = {
        creatures: deceased ? [child] : [parent, child],
        world: Object.assign(createWorldGrid({ width: 10, height: 10, defaultTerrain: 'plains' }), {
          memorials: deceased ? [{ ...parent, deathCause: 'age' }] : []
        }),
        tick: 1
      };
      inspector.selectCreature(parent);
      inspector.update(state);
      const button = document.querySelector('.life-story-family button');
      const list = document.querySelector('.life-story-events');
      const item = list.firstChild;
      list.scrollTop = 75;
      button.focus();
      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      for (let tick = 2; tick < 12; tick++) inspector.update({ ...state, tick });
      expect(document.querySelector('.life-story-family button')).toBe(button);
      expect(button.isConnected).toBe(true);
      expect(document.activeElement).toBe(button);
      expect(document.querySelector('.life-story-events')).toBe(list);
      expect(list.firstChild).toBe(item);
      expect(list.scrollTop).toBe(75);
      parent.lifeStory.events.push({ seconds: 12, text: 'New milestone' });
      parent.lifeStory.events.shift();
      inspector.update(state);
      expect(list.scrollTop).toBe(75);
      expect(list.textContent).toContain('New milestone');
      button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      button.click();
      expect(inspector.getTrackedId()).toBe(child.id);
      expect(inspector.isFollowing()).toBe(true);
      expect(follow).toHaveBeenLastCalledWith(child.id, true);
      inspector.update(state);
      expect(document.querySelector('.life-story-card h3').textContent).toContain('#2');
      inspector.clear();
      expect(document.querySelector('.life-story-card')).toBeNull();
    });
  }
  it('updates living relatives without replacing surviving buttons and clears expired records', () => {
    const parent = animal(1),
      first = animal(2, [1]),
      second = animal(3, [1]);
    const inspector = createLiveInspector({ container: document.body });
    inspector.selectCreature(parent);
    inspector.update({ creatures: [parent, first], tick: 1 });
    const button = document.querySelector('.life-story-family button');
    inspector.update({ creatures: [parent, first, second], tick: 2 });
    expect(document.querySelector('.life-story-family button')).toBe(button);
    expect(document.querySelectorAll('.life-story-family button')).toHaveLength(2);
    inspector.update({ creatures: [parent, second], tick: 3 });
    expect(button.isConnected).toBe(false);
    expect(document.querySelectorAll('.life-story-family button')).toHaveLength(1);
    inspector.update({ creatures: [], world: { memorials: [] }, tick: 4 });
    expect(document.querySelector('.life-story-card')).toBeNull();
    expect(document.body.textContent).toContain('no longer in the recent record');
  });
});
