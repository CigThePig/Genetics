// Observer labels and records never enter ecological decisions or consume RNG.
const FIRST = [
  'Moss',
  'Ember',
  'Fern',
  'Flint',
  'Willow',
  'Reed',
  'Clover',
  'Ash',
  'Briar',
  'Dawn',
  'Hazel',
  'Rain'
];
const LAST = ['brook', 'ridge', 'shade', 'bank', 'glade', 'hollow', 'shore', 'meadow'];
export function creatureName(creature) {
  const id = Math.max(0, creature.id ?? 0);
  return `${FIRST[id % FIRST.length]}${LAST[Math.floor(id / FIRST.length) % LAST.length]} · #${id}`;
}
export function recordLifeEvent(story, seconds, text) {
  story.events.push({ seconds, text });
  if (story.events.length > 12) story.events.shift();
}
export function observeLifeStories(state) {
  const seconds = state.elapsedSeconds ?? 0;
  const byId = new Map(state.creatures.map((c) => [c.id, c]));
  const memorials = (state.world.memorials ??= []);
  for (const c of state.creatures) {
    if (!c.lifeStory) {
      c.lifeStory = {
        enteredAt: seconds,
        children: 0,
        flights: 0,
        distance: 0,
        lastPosition: { ...c.position },
        stage: c.lifeStage?.id,
        fleeing: false,
        events: []
      };
      recordLifeEvent(
        c.lifeStory,
        seconds,
        c.lineage?.parents?.length ? 'Born into this world' : 'A founding life begins'
      );
      for (const id of c.lineage?.parents ?? []) {
        const parent = byId.get(id) ?? memorials.find((m) => m.id === id);
        if (parent?.lifeStory) {
          parent.lifeStory.children++;
          recordLifeEvent(parent.lifeStory, seconds, `Offspring #${c.id} born`);
        }
      }
    }
    const story = c.lifeStory;
    story.distance += Math.hypot(
      c.position.x - story.lastPosition.x,
      c.position.y - story.lastPosition.y
    );
    story.lastPosition = { ...c.position };
    const stage = c.lifeStage?.id;
    if (stage && stage !== story.stage) {
      recordLifeEvent(story, seconds, `Reached ${c.lifeStage.label ?? stage} stage`);
      story.stage = stage;
    }
    const fleeing = Boolean(c.herding?.isThreatened);
    if (fleeing && !story.fleeing) {
      story.flights++;
      recordLifeEvent(
        story,
        seconds,
        c.herding.nearbyThreats ? 'Fled a visible predator' : 'Fled a remembered or shared warning'
      );
    } else if (!fleeing && story.fleeing && c.meters?.hp > 0) {
      recordLifeEvent(story, seconds, 'Left immediate danger');
    }
    story.fleeing = fleeing;
  }
}
export function rememberDeath(state, creature, cause) {
  const record = {
    id: creature.id,
    species: creature.species,
    generation: creature.generation,
    ageTicks: creature.ageTicks,
    deathCause: cause,
    diedAt: state.elapsedSeconds,
    lineage: { parents: [...(creature.lineage?.parents ?? [])] },
    lifeStory: structuredClone(creature.lifeStory)
  };
  if (record.lifeStory)
    recordLifeEvent(record.lifeStory, state.elapsedSeconds, `Died from ${cause}`);
  const memorials = (state.world.memorials ??= []);
  memorials.push(record);
  if (memorials.length > 128) memorials.shift();
}
