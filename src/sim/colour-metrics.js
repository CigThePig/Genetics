import { SPECIES_LIST } from './species.js';
import { circularSummary } from './colour.js';
export const COLOUR_HISTORY_LIMIT = 120;
export function colourPopulationSnapshot(creatures, tick, world) {
  const species = {};
  for (const name of SPECIES_LIST) {
    const members = creatures.filter((c) => c.species === name && c.meters?.hp > 0);
    const mean = (key) =>
      members.length
        ? members.reduce((sum, c) => sum + (c.traits?.[key] ?? 0), 0) / members.length
        : 0;
    const habitats = {};
    for (const c of members) {
      const type =
        world?.getTerrainAt(Math.floor(c.position.x), Math.floor(c.position.y)) ?? 'unknown';
      (habitats[type] ??= []).push(c);
    }
    species[name] = {
      count: members.length,
      body: circularSummary(members.map((c) => c.traits?.bodyHue)),
      preference: circularSummary(members.map((c) => c.traits?.matePreferenceHue)),
      saturation: mean('bodySaturation'),
      lightness: mean('bodyLightness'),
      choosiness: mean('mateChoosiness'),
      discrimination: mean('colourDiscrimination'),
      maxGeneration: Math.max(0, ...members.map((c) => c.generation ?? 0)),
      habitats: Object.fromEntries(
        Object.entries(habitats).map(([k, v]) => [
          k,
          { count: v.length, body: circularSummary(v.map((c) => c.traits?.bodyHue)) }
        ])
      )
    };
  }
  return { tick, species };
}
export function recordColourHistory(state, config) {
  const interval = Math.max(1, Math.round((config.ticksPerSecond || 60) * 10));
  if (state.tick % interval !== 0 && state.colourBaseline) return;
  const snapshot = colourPopulationSnapshot(state.creatures, state.tick, state.world);
  state.colourBaseline ??= snapshot;
  state.colourHistory ??= [];
  state.colourHistory.push(snapshot);
  if (state.colourHistory.length > COLOUR_HISTORY_LIMIT) state.colourHistory.shift();
}
