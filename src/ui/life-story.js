import { creatureName } from '../sim/life-story.js';

// Own the interactive nodes for one selected life; refresh text without detaching
// pressed family buttons or replacing the scrollable milestone list.
export function createLifeStoryCard({ onSelect }) {
  const card = document.createElement('section');
  card.className = 'life-story-card';
  const heading = document.createElement('h3');
  const subtitle = document.createElement('p');
  subtitle.className = 'life-story-subtitle';
  const stats = document.createElement('p');
  const memory = document.createElement('p');
  const ancestry = document.createElement('p');
  const family = document.createElement('div');
  family.className = 'life-story-family';
  const more = document.createElement('small');
  const list = document.createElement('ol');
  list.className = 'life-story-events';
  const note = document.createElement('small');
  note.textContent =
    'Field name assigned by the observer. Latest 12 milestones; times are world time. Experience is learned, not inherited.';
  card.append(heading, subtitle, stats, memory, ancestry, family, more, list, note);
  const buttons = new Map();
  let eventsKey = null;
  return {
    element: card,
    update({ creature, creatures, deceased = false }) {
      heading.textContent = creatureName(creature);
      subtitle.textContent = deceased
        ? `Life ended · ${creature.deathCause}`
        : `Generation ${creature.generation ?? 0} · ${creature.herding?.isThreatened ? 'Escaping danger' : creature.locomotion?.reason && ['wander', 'graze'].includes(creature.intent?.type) ? creature.locomotion.reason : (creature.intent?.type ?? 'Beginning life')}`;
      const story = creature.lifeStory;
      stats.hidden = !story;
      if (story)
        stats.textContent = `${Math.round(story.distance)} tiles travelled · ${story.flights} flights · ${story.children} offspring born`;
      const sites = creature.experience?.dangerSites ?? [];
      memory.hidden = !sites.length || deceased;
      if (!memory.hidden)
        memory.textContent = `Remembers ${sites.length} dangerous place${sites.length === 1 ? '' : 's'}. Strongest memory fades in ${Math.ceil(Math.max(...sites.map((s) => s.remaining)))}s without another sighting.`;
      const parents = creature.lineage?.parents ?? [];
      ancestry.hidden = !parents.length;
      ancestry.textContent = `Parents: ${parents.map((id) => (id == null ? 'unknown' : `#${id}`)).join(' & ')}`;
      const kin = creatures.filter(
        (c) => parents.includes(c.id) || c.lineage?.parents?.includes(creature.id)
      );
      const shown = kin.slice(0, 8);
      for (const [id, entry] of buttons) {
        if (!shown.some((c) => c.id === id)) {
          entry.button.remove();
          buttons.delete(id);
        }
      }
      shown.forEach((relative, index) => {
        let entry = buttons.get(relative.id);
        if (!entry) {
          const button = document.createElement('button');
          button.type = 'button';
          entry = { button, relative };
          button.addEventListener('click', () => onSelect(entry.relative));
          buttons.set(relative.id, entry);
        }
        entry.relative = relative;
        const label = `${parents.includes(relative.id) ? 'Parent' : 'Child'}: ${creatureName(relative)}`;
        if (entry.button.textContent !== label) entry.button.textContent = label;
        if (family.children[index] !== entry.button)
          family.insertBefore(entry.button, family.children[index] ?? null);
      });
      more.hidden = kin.length <= 8;
      more.textContent =
        kin.length > 8 ? `${kin.length - 8} more living relatives; showing first eight.` : '';
      const events = story?.events ?? [];
      const key = JSON.stringify(events);
      if (key !== eventsKey) {
        const scrollTop = list.scrollTop;
        list.replaceChildren();
        for (const event of [...events].reverse()) {
          const item = document.createElement('li');
          const seconds = Math.floor(event.seconds);
          item.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} · ${event.text}`;
          list.append(item);
        }
        list.scrollTop = scrollTop;
        eventsKey = key;
      }
    }
  };
}
