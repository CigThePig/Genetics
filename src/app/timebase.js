/** Fixed-step wall-clock accumulator, independent of display refresh. */
export function createTickClock({ maxDeltaMs = 250, maxTicks = 240 } = {}) {
  let lastTime = null;
  let accumulatorMs = 0;
  return {
    reset(now) {
      lastTime = now;
      accumulatorMs = 0;
    },
    advance(now, { ticksPerSecond = 60, speed = 1, tick }) {
      if (lastTime === null) {
        lastTime = now;
        return 0;
      }
      const delta = Math.min(maxDeltaMs, Math.max(0, now - lastTime));
      lastTime = now;
      accumulatorMs += delta * speed;
      const interval = 1000 / Math.max(1, ticksPerSecond);
      let count = 0;
      while (accumulatorMs >= interval && count < maxTicks) {
        tick();
        accumulatorMs -= interval;
        count++;
      }
      if (count >= maxTicks) accumulatorMs = Math.min(accumulatorMs, interval);
      return count;
    }
  };
}
