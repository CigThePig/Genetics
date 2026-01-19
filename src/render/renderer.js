export function createRenderer(container) {
  const footer = document.createElement('p');
  container.append(footer);

  return {
    render(sim) {
      const roll = Number.isFinite(sim.state?.lastRoll)
        ? sim.state.lastRoll.toFixed(4)
        : '--';
      footer.textContent = `Seed: ${sim.config.seed} · Last roll: ${roll}`;
    }
  };
}
