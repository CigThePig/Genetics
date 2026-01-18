export function createRenderer(container) {
  return {
    render(sim) {
      const footer = document.createElement('p');
      footer.textContent = `Seed: ${sim.config.seed}`;
      container.append(footer);
    }
  };
}
