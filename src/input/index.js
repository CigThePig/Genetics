export function createInput({
  canvas,
  camera,
  onTap,
  onCameraChange,
  worldToTile
}) {
  let attached = false;
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  const pointers = new Map();
  const tapState = {
    pointerId: null,
    x: 0,
    y: 0,
    moved: false
  };
  const tapMoveThreshold = 8;

  const getViewport = () => {
    const rect = canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  };

  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const notifyCameraChange = () => {
    if (onCameraChange) {
      onCameraChange();
    }
  };

  const pointerDown = (event) => {
    if (!canvas.contains(event.target)) {
      return;
    }
    if (event.pointerType === 'touch') {
      event.preventDefault();
    }

    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 1) {
      tapState.pointerId = event.pointerId;
      tapState.x = event.clientX;
      tapState.y = event.clientY;
      tapState.moved = false;
    } else {
      tapState.pointerId = null;
      tapState.moved = true;
    }

    if (pointers.size === 2) {
      const [first, second] = Array.from(pointers.values());
      pinchStartDistance = distance(first, second);
      pinchStartZoom = camera.getState().zoom;
    }
  };

  const pointerMove = (event) => {
    if (!pointers.has(event.pointerId)) {
      return;
    }
    if (event.pointerType === 'touch') {
      event.preventDefault();
    }

    const nextPoint = { x: event.clientX, y: event.clientY };
    const prevPoint = pointers.get(event.pointerId);
    pointers.set(event.pointerId, nextPoint);

    if (pointers.size === 1) {
      const dx = nextPoint.x - prevPoint.x;
      const dy = nextPoint.y - prevPoint.y;
      if (tapState.pointerId === event.pointerId) {
        const movedDistance = distance(nextPoint, {
          x: tapState.x,
          y: tapState.y
        });
        if (movedDistance > tapMoveThreshold) {
          tapState.moved = true;
        }
      }
      camera.panBy(dx, dy);
      notifyCameraChange();
      return;
    }

    if (pointers.size === 2) {
      const [first, second] = Array.from(pointers.values());
      const rect = canvas.getBoundingClientRect();
      const midpoint = {
        x: (first.x + second.x) / 2 - rect.left,
        y: (first.y + second.y) / 2 - rect.top
      };
      const currentDistance = distance(first, second);
      if (pinchStartDistance > 0) {
        const nextZoom = pinchStartZoom * (currentDistance / pinchStartDistance);
        camera.zoomAt(nextZoom, midpoint, { width: rect.width, height: rect.height });
        notifyCameraChange();
      }
    }
  };

  const pointerUp = (event) => {
    if (!pointers.has(event.pointerId)) {
      return;
    }
    if (event.pointerType === 'touch') {
      event.preventDefault();
    }

    pointers.delete(event.pointerId);
    if (pointers.size < 2) {
      pinchStartDistance = 0;
      pinchStartZoom = camera.getState().zoom;
    }

    if (
      onTap &&
      tapState.pointerId === event.pointerId &&
      !tapState.moved &&
      pointers.size === 0
    ) {
      const rect = canvas.getBoundingClientRect();
      const screenPoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      const viewport = { width: rect.width, height: rect.height };
      const state = camera.getState();
      const originX = viewport.width / 2;
      const originY = viewport.height / 2;
      const worldPoint = {
        x: (screenPoint.x - originX - state.x) / state.zoom,
        y: (screenPoint.y - originY - state.y) / state.zoom
      };
      const tilePoint = worldToTile
        ? worldToTile(worldPoint, viewport)
        : worldPoint;
      onTap({
        screen: screenPoint,
        world: worldPoint,
        tile: tilePoint,
        viewport
      });
    }

    if (tapState.pointerId === event.pointerId) {
      tapState.pointerId = null;
    }
  };

  const wheelZoom = (event) => {
    event.preventDefault();
    const scale = event.deltaY < 0 ? 1.1 : 0.9;
    const nextZoom = camera.getState().zoom * scale;
    const rect = canvas.getBoundingClientRect();
    const anchor = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    camera.zoomAt(nextZoom, anchor, { width: rect.width, height: rect.height });
    notifyCameraChange();
  };

  return {
    attach() {
      if (attached) {
        return;
      }
      attached = true;
      canvas.addEventListener('pointerdown', pointerDown);
      canvas.addEventListener('pointermove', pointerMove);
      canvas.addEventListener('pointerup', pointerUp);
      canvas.addEventListener('pointercancel', pointerUp);
      canvas.addEventListener('wheel', wheelZoom, { passive: false });
    },
    detach() {
      if (!attached) {
        return;
      }
      attached = false;
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerUp);
      canvas.removeEventListener('wheel', wheelZoom);
      pointers.clear();
      tapState.pointerId = null;
      tapState.moved = false;
    }
  };
}
