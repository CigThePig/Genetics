import { creatureName } from '../sim/life-story.js';

export function createLifeStoryCard({ creature, creatures, onSelect, deceased = false }) {
  const card = document.createElement('section');
  card.className = 'life-story-card';
  const heading = document.createElement('h3');
  heading.textContent = creatureName(creature);
  const subtitle = document.createElement('p');
  subtitle.className = 'life-story-subtitle';
  subtitle.textContent = deceased
    ? `Life ended · ${creature.deathCause}`
    : `Generation ${creature.generation ?? 0} · ${creature.herding?.isThreatened ? 'Escaping danger' : creature.locomotion?.reason && ['wander', 'graze'].includes(creature.intent?.type) ? creature.locomotion.reason : (creature.intent?.type ?? 'Beginning life')}`;
  card.append(heading, subtitle);
  const story = creature.lifeStory;
  if (story) {
    const stats = document.createElement('p');
    stats.textContent = `${Math.round(story.distance)} tiles travelled · ${story.flights} flights · ${story.children} offspring born`;
    card.append(stats);
  }
  const sites = creature.experience?.dangerSites ?? [];
  if (sites.length && !deceased) {
    const memory = document.createElement('p');
    memory.textContent = `Remembers ${sites.length} dangerous place${sites.length === 1 ? '' : 's'}. Strongest memory fades in ${Math.ceil(Math.max(...sites.map((s) => s.remaining)))}s without another sighting.`;
    card.append(memory);
  }
  const family = document.createElement('div');
  family.className = 'life-story-family';
  const parents = creature.lineage?.parents ?? [];
  if (parents.length) {
    const ancestry = document.createElement('p');
    ancestry.textContent = `Parents: ${parents.map((id) => (id == null ? 'unknown' : `#${id}`)).join(' & ')}`;
    card.append(ancestry);
  }
  const kin = creatures.filter(
    (c) => parents.includes(c.id) || c.lineage?.parents?.includes(creature.id)
  );
  for (const relative of kin.slice(0, 8)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${parents.includes(relative.id) ? 'Parent' : 'Child'}: ${creatureName(relative)}`;
    button.addEventListener('click', () => onSelect(relative));
    family.append(button);
  }
  card.append(family);
  if (kin.length > 8) {
    const more = document.createElement('small');
    more.textContent = `${kin.length - 8} more living relatives; showing first eight.`;
    card.append(more);
  }
  const list = document.createElement('ol');
  list.className = 'life-story-events';
  for (const event of [...(story?.events ?? [])].reverse()) {
    const item = document.createElement('li');
    const seconds = Math.floor(event.seconds);
    item.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} · ${event.text}`;
    list.append(item);
  }
  card.append(list);
  const note = document.createElement('small');
  note.textContent =
    'Field name assigned by the observer. Latest 12 milestones; times are world time. Experience is learned, not inherited.';
  card.append(note);
  return card;
}
