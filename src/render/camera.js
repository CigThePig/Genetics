export function createCamera({ minZoom = 0.25, maxZoom = 4, zoom = 1, x = 0, y = 0 } = {}) {
  const state = {
    x,
    y,
    zoom,
    minZoom,
    maxZoom
  };

  const clampZoom = (nextZoom) => Math.min(state.maxZoom, Math.max(state.minZoom, nextZoom));

  return {
    getState() {
      return { x: state.x, y: state.y, zoom: state.zoom };
    },
    panBy(dx, dy) {
      state.x += dx;
      state.y += dy;
    },
    zoomAt(nextZoom, screenPoint, viewport) {
      if (!viewport) {
        state.zoom = clampZoom(nextZoom);
        return;
      }

      const clamped = clampZoom(nextZoom);
      const { width, height } = viewport;
      const originX = width / 2;
      const originY = height / 2;
      const screenX = screenPoint?.x ?? originX;
      const screenY = screenPoint?.y ?? originY;

      const worldX = (screenX - originX - state.x) / state.zoom;
      const worldY = (screenY - originY - state.y) / state.zoom;

      state.zoom = clamped;
      state.x = screenX - originX - worldX * state.zoom;
      state.y = screenY - originY - worldY * state.zoom;
    }
  };
}
