// Geographical groups: bounded leader neighbourhoods, stable IDs, wider retention
// than acquisition. No transitive species-wide chains or live entity references.
export function localGroups(creatures, { field, radius, maxMembers, retain = 1.8 }) {
  const live = creatures
    .filter((c) => c?.position && !(c.meters?.hp <= 0))
    .sort((a, b) => a.id - b.id);
  const byId = new Map(live.map((c) => [c.id, c]));
  const assigned = new Set();
  const groups = new Map();
  const near = (a, b, r) =>
    a.species === b.species &&
    Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y) <= r;
  // Keep established groups before allowing newcomers to recruit their members.
  const previous = new Map();
  for (const c of live) {
    const id = c[field]?.groupId;
    if (id != null) {
      if (!previous.has(id)) previous.set(id, []);
      previous.get(id).push(c);
    }
  }
  const add = (members, preferred) => {
    const leader = members.find((c) => c.id === preferred) ?? members[0];
    const id = `${leader.species}:${leader.id}`;
    const group = [leader];
    assigned.add(leader.id);
    for (const c of members)
      if (!assigned.has(c.id) && group.length < maxMembers && near(leader, c, radius * retain)) {
        group.push(c);
        assigned.add(c.id);
      }
    groups.set(id, group);
  };
  for (const members of previous.values()) {
    const preferred = members[0][field]?.leaderId;
    add(members, byId.has(preferred) ? preferred : null);
  }
  for (const c of live) {
    if (assigned.has(c.id)) continue;
    // Join an established local group, including solitary survivors.
    let group = [...groups.values()].find((g) => g.length < maxMembers && near(g[0], c, radius));
    if (group) {
      group.push(c);
      assigned.add(c.id);
    } else add([c], null);
  }
  // Merge small nearby groups deterministically, retaining the older/lower leader.
  const entries = [...groups];
  for (let i = 0; i < entries.length; i++) {
    const [id, a] = entries[i];
    if (!groups.has(id)) continue;
    for (let j = i + 1; j < entries.length; j++) {
      const [otherId, b] = entries[j];
      if (!groups.has(otherId)) continue;
      if (a.length + b.length <= maxMembers && b.every((c) => near(a[0], c, radius))) {
        a.push(...b);
        groups.delete(otherId);
      }
    }
  }
  for (const [id, members] of groups)
    for (const c of members) {
      c[field] ??= {};
      c[field].groupId = id;
      c[field].leaderId = members[0].id;
    }
  return groups;
}
