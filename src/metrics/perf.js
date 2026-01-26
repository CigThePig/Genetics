export function createPerfSampler({ windowMs = 1000 } = {}) {
  let enabled = true;
  let windowStart = performance.now();
  const groups = { tick: true, render: true };
  const timers = new Map();
  // Keep the last completed window so UI reads stable values (no flicker at rollover).
  let lastSnapshot = null;

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

  const buildEntries = () =>
    Array.from(timers.entries()).map(([name, data]) => {
      const group = getGroup(name);
      const totalMs = data.totalMs;
      const calls = data.calls;
      const avgMs = calls ? totalMs / calls : 0;
      return {
        name,
        totalMs,
        avgMs,
        maxMs: data.maxMs,
        calls,
        group
      };
    });

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
      const elapsed = now - windowStart;
      if (elapsed >= windowMs) {
        lastSnapshot = {
          windowMs,
          updatedAt: now,
          timers: buildEntries()
        };
        resetWindow(now);
      }

      // Prefer the last completed window for stable reads.
      if (lastSnapshot) return lastSnapshot;

      return {
        windowMs: elapsed,
        updatedAt: now,
        timers: buildEntries()
      };
    },
  };
}
