let activePerf = null;

export function setActivePerf(nextPerf) {
  activePerf = nextPerf ?? null;
}

export function getActivePerf() {
  return activePerf;
}
