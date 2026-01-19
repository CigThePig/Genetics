export function createSimWorkerStub({ enabled = false } = {}) {
  return {
    isEnabled: enabled,
    connect({ createSim, seed }) {
      if (!enabled) {
        return createSim({ seed });
      }

      console.warn(
        'Worker stub active: using local sim until worker implementation is added.'
      );
      const sim = createSim({ seed });
      return {
        ...sim,
        isWorker: true,
        dispose() {}
      };
    },
    notes: [
      'Replace connect() with a Worker-backed proxy that implements tick(), setSeed(), getSeed(), and getSummary().',
      'Enable worker mode by setting useWorker = true in src/main.js once worker support exists.'
    ]
  };
}
