# Ownership and integration

`creatures/experience.js` updates creature-owned place memory after herding, before locomotion. Locomotion ranks reachable candidates by remembered route exposure; social regrouping and survival decisions retain priority. Duration is configured in seconds. No new RNG stream or inherited trait; existing vigilance determines which dangers are experienced.

`life-story.js` observes milestones after reproduction, before removal. A death callback records the authoritative cause. Each animal owns a bounded event list; world owns 128 recent copied memorials. Birth parent IDs update living/recently deceased parents. No full ancestral graph, references to actors or effect on decisions. Inspector reads stories, memories and memorials; family buttons switch selection/follow through existing callback.

Risks: caution can reduce food/mating opportunity or isolate animals; no claim of improved equilibrium. Death archive is intentionally finite. Event times store simulated seconds at occurrence, so changing TPS does not relabel the past. Inspecting must never consume RNG or update history.
