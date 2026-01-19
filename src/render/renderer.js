export function createRenderer(container) {
  const footer = document.createElement('p');
  container.append(footer);

  return {
    render(sim) {
      footer.textContent = `Seed: ${sim.config.seed}`;
    }
  };
}
