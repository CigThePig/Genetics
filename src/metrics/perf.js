export function createPerfSampler({ windowMs = 1000 } = {}) {
  // Low-overhead named timers with a stable "last completed window" snapshot.
  // UI should read snapshot() and get a mostly-stable view that doesn't flicker.
  let enabled = true;
  let windowStart = performance.now();
  const groups = { tick: true, render: true };
  const timers = new Map();

  let lastSnapshot = null; // { windowMs, updatedAt, timers:[...] }

  const resetWindow = (now) => {
    timers.clear();
    windowStart = now;
  };

  const getGroup = (name) => name.split('.')[0];

  const isGroupEnabled = (group) => {
    if (group === 'tick') return groups.tick;
    if (group === 'render') return groups.render;
    return false;
  };

  const buildEntries = (map) => {
    const entries = [];
    for (const [name, data] of map.entries()) {
      const group = getGroup(name);
      const totalMs = data.totalMs;
      const calls = data.calls;
      const avgMs = calls ? totalMs / calls : 0;
      entries.push({
        name,
        totalMs,
        avgMs,
        maxMs: data.maxMs,
        calls,
        group,
      });
    }
    return entries;
  };

  const finalizeWindowIfNeeded = (now) => {
    if (now - windowStart < windowMs) return;
    // Capture a stable snapshot of the completed window, then reset.
    lastSnapshot = {
      windowMs: now - windowStart,
      updatedAt: now,
      timers: buildEntries(timers),
    };
    resetWindow(now);
  };

  return {
    start(name) {
      if (!enabled) return null;
      const group = getGroup(name);
      if (!isGroupEnabled(group)) return null;
      return performance.now();
    },
    end(name, startTime) {
      if (!enabled || startTime == null) return;
      const duration = performance.now() - startTime;
      const entry = timers.get(name);
      if (entry) {
        entry.totalMs += duration;
        entry.calls += 1;
        if (duration > entry.maxMs) entry.maxMs = duration;
        return;
      }
      timers.set(name, { totalMs: duration, maxMs: duration, calls: 1 });
    },
    setEnabled(nextEnabled) {
      enabled = Boolean(nextEnabled);
    },
    isEnabled() {
      return enabled;
    },
    setGroupEnabled(groupName, nextEnabled) {
      if (groupName === 'tick' || groupName === 'render') {
        groups[groupName] = Boolean(nextEnabled);
      }
    },
    getGroups() {
      return { ...groups };
    },
    snapshot(now = performance.now()) {
      finalizeWindowIfNeeded(now);

      // Prefer the last completed window snapshot for stability.
      if (lastSnapshot) return lastSnapshot;

      // Fallback: early in a run, return current window partial data.
      return {
        windowMs: now - windowStart,
        updatedAt: now,
        timers: buildEntries(timers),
      };
    },
  };
}
