/** Coordinates non-modal research panels without owning their content. */
export function createPanelController(container) {
  let active = null;
  const ownerDocument = container.ownerDocument;
  const onKeyDown = (event) => {
    if (event.key !== 'Escape' || !active || event.defaultPrevented) return;
    event.preventDefault();
    const previous = active;
    previous.close();
    previous.trigger?.focus();
  };
  return {
    sync(panel, visible, close, trigger) {
      panel.inert = !visible;
      panel.setAttribute('aria-hidden', String(!visible));
      trigger?.setAttribute('aria-expanded', String(visible));
      if (visible) {
        if (active && active.panel !== panel) active.close();
        active = { panel, close, trigger };
        // Panels are non-modal, so focus may move outside #app (e.g. to the map).
        // Listen only while a panel is active to avoid stale document handlers.
        ownerDocument.addEventListener('keydown', onKeyDown);
        container.dataset.panelOpen = 'true';
        panel.tabIndex = -1;
        // Visibility classes are applied by the caller after this state update.
        queueMicrotask(() => {
          if (active?.panel === panel) panel.focus({ preventScroll: true });
        });
      } else if (active?.panel === panel) {
        if (panel.contains(document.activeElement)) trigger?.focus();
        active = null;
        ownerDocument.removeEventListener('keydown', onKeyDown);
        delete container.dataset.panelOpen;
      }
    },
    destroy() {
      ownerDocument.removeEventListener('keydown', onKeyDown);
      active = null;
      delete container.dataset.panelOpen;
    }
  };
}
