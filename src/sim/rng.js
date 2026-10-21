export function createRng(seed = 1) {
  let state = normalizeSeed(seed);

  const nextUint32 = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };

  return {
    getSeed() {
      return state;
    },
    setSeed(nextSeed) {
      state = normalizeSeed(nextSeed);
    },
    nextFloat() {
      return nextUint32() / 4294967296;
    },
    nextInt(min, max) {
      const low = Number.isFinite(min) ? Math.trunc(min) : 0;
      const high = Number.isFinite(max) ? Math.trunc(max) : low;
      if (high <= low) {
        return low;
      }
      return Math.floor(this.nextFloat() * (high - low + 1)) + low;
    }
  };
}

function normalizeSeed(seed) {
  const numericSeed = Number.isFinite(seed) ? Math.trunc(seed) : 0;
  return numericSeed >>> 0;
}

// FNV-1a stream label followed by an avalanche; stable across JS runtimes.
// Stream derivation never advances a sibling or the runtime generator.
export function deriveSeed(seed, label) {
  let h = (normalizeSeed(seed) ^ 2166136261) >>> 0;
  for (let i = 0; i < label.length; i++) h = Math.imul(h ^ label.charCodeAt(i), 16777619) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}
