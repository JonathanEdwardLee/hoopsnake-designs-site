const MAX_FLING_DEG_PER_MS = 0.55;
const FLING_FRICTION = 0.0045;
const FLING_STOP_DEG_PER_MS = 0.012;
const ENGAGE_PX = 10;
const TOUCH_SCROLL_BIAS = 1.15;

function wrapDelta(delta: number): number {
  let value = delta;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}

function angleFromEvent(root: HTMLElement, event: PointerEvent): number {
  const rect = root.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return Math.atan2(event.clientY - cy, event.clientX - cx);
}

function initMotionLoop(root: HTMLElement): void {
  const userLayer = root.querySelector<HTMLElement>('.hero-mark-user');
  if (!userLayer) {
    return;
  }

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userRotation = 0;
  let velocity = 0;
  let dragging = false;
  let engaged = false;
  let lastAngle = 0;
  let lastTime = 0;
  let startX = 0;
  let startY = 0;
  let frameId = 0;
  let pointerId: number | null = null;

  const applyUserRotation = () => {
    userLayer.style.setProperty('--user-rot', `${userRotation}deg`);
  };

  const stopFrame = () => {
    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
  };

  const tickFling = (time: number) => {
    const dt = lastTime ? Math.min(32, time - lastTime) : 16;
    lastTime = time;
    const decay = Math.exp(-FLING_FRICTION * dt);
    velocity *= decay;
    userRotation += velocity * dt;
    applyUserRotation();

    if (Math.abs(velocity) < FLING_STOP_DEG_PER_MS) {
      velocity = 0;
      frameId = 0;
      return;
    }

    frameId = window.requestAnimationFrame(tickFling);
  };

  const startFling = () => {
    if (motionQuery.matches || Math.abs(velocity) < FLING_STOP_DEG_PER_MS) {
      velocity = 0;
      return;
    }
    lastTime = 0;
    stopFrame();
    frameId = window.requestAnimationFrame(tickFling);
  };

  const endDrag = () => {
    if (!dragging) {
      return;
    }
    dragging = false;
    userLayer.classList.remove('is-grabbing');
    if (pointerId !== null && root.hasPointerCapture(pointerId)) {
      root.releasePointerCapture(pointerId);
    }
    pointerId = null;
    if (engaged && !motionQuery.matches) {
      startFling();
    }
    engaged = false;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (motionQuery.matches) {
      return;
    }
    dragging = true;
    engaged = false;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    lastAngle = angleFromEvent(root, event);
    lastTime = event.timeStamp;
    velocity = 0;
    stopFrame();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!dragging || pointerId !== event.pointerId) {
      return;
    }

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const distance = Math.hypot(dx, dy);

    if (!engaged) {
      if (distance < ENGAGE_PX) {
        return;
      }
      if (event.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx) * TOUCH_SCROLL_BIAS) {
        dragging = false;
        pointerId = null;
        return;
      }
      engaged = true;
      userLayer.classList.add('is-grabbing');
      root.setPointerCapture(event.pointerId);
    }

    const nextAngle = angleFromEvent(root, event);
    const deltaRad = wrapDelta(nextAngle - lastAngle);
    const dt = Math.max(1, event.timeStamp - lastTime);
    const deltaDeg = deltaRad * (180 / Math.PI);
    userRotation += deltaDeg;
    velocity = Math.max(-MAX_FLING_DEG_PER_MS, Math.min(MAX_FLING_DEG_PER_MS, deltaDeg / dt));
    lastAngle = nextAngle;
    lastTime = event.timeStamp;
    applyUserRotation();
  };

  const disableInteraction = () => {
    dragging = false;
    engaged = false;
    velocity = 0;
    stopFrame();
    userLayer.classList.remove('is-grabbing');
    root.removeEventListener('pointerdown', onPointerDown);
    root.removeEventListener('pointermove', onPointerMove);
    root.removeEventListener('pointerup', endDrag);
    root.removeEventListener('pointercancel', endDrag);
  };

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', endDrag);
  motionQuery.addEventListener('change', (event) => {
    if (event.matches) {
      disableInteraction();
    }
  });

  applyUserRotation();
}

document.querySelectorAll<HTMLElement>('[data-motion-loop]').forEach(initMotionLoop);
