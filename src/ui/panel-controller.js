/** Coordinates non-modal research panels without owning their content. */
export function createPanelController(container) {
  let active = null;
  container.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !active) return;
    event.preventDefault();
    const previous = active;
    previous.close();
    previous.trigger?.focus();
  });
  return {
    sync(panel, visible, close, trigger) {
      panel.inert = !visible;
      panel.setAttribute('aria-hidden', String(!visible));
      trigger?.setAttribute('aria-expanded', String(visible));
      if (visible) {
        if (active && active.panel !== panel) active.close();
        active = { panel, close, trigger };
        container.dataset.panelOpen = 'true';
        panel.tabIndex = -1;
        // Visibility classes are applied by the caller after this state update.
        queueMicrotask(() => {
          if (active?.panel === panel) panel.focus({ preventScroll: true });
        });
      } else if (active?.panel === panel) {
        if (panel.contains(document.activeElement)) trigger?.focus();
        active = null;
        delete container.dataset.panelOpen;
      }
    }
  };
}
