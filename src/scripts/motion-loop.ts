const POINTER_SMOOTHING = 0.12;
const MAX_TILT_DEGREES = 4;
const SETTLE_EPSILON = 0.001;

function initMotionLoop(root: HTMLElement): void {
  const interior = root.querySelector<HTMLElement>('.loop-interior');
  if (!interior) {
    return;
  }

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionQuery.matches) {
    return;
  }

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let frameId = 0;
  let tracking = false;

  const applyTransform = () => {
    root.style.setProperty('--pointer-x', String(currentX));
    root.style.setProperty('--pointer-y', String(currentY));
    interior.style.setProperty('--tilt-x', `${currentX * MAX_TILT_DEGREES}deg`);
    interior.style.setProperty('--tilt-y', `${-currentY * MAX_TILT_DEGREES}deg`);
  };

  const tick = () => {
    currentX += (targetX - currentX) * POINTER_SMOOTHING;
    currentY += (targetY - currentY) * POINTER_SMOOTHING;
    applyTransform();

    const settled =
      Math.abs(currentX - targetX) < SETTLE_EPSILON &&
      Math.abs(currentY - targetY) < SETTLE_EPSILON;

    if (tracking || !settled) {
      frameId = window.requestAnimationFrame(tick);
      return;
    }

    frameId = 0;
  };

  const ensureFrame = () => {
    if (!frameId) {
      frameId = window.requestAnimationFrame(tick);
    }
  };

  const setTargetFromPointer = (event: PointerEvent) => {
    const rect = root.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    targetX = Math.max(-0.5, Math.min(0.5, x));
    targetY = Math.max(-0.5, Math.min(0.5, y));
    ensureFrame();
  };

  const resetTarget = () => {
    tracking = false;
    targetX = 0;
    targetY = 0;
    ensureFrame();
  };

  const onPointerEnter = (event: PointerEvent) => {
    tracking = true;
    setTargetFromPointer(event);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!tracking) {
      return;
    }
    setTargetFromPointer(event);
  };

  const disableInteraction = () => {
    tracking = false;
    targetX = 0;
    targetY = 0;
    currentX = 0;
    currentY = 0;
    root.removeEventListener('pointerenter', onPointerEnter);
    root.removeEventListener('pointermove', onPointerMove);
    root.removeEventListener('pointerleave', resetTarget);
    root.removeEventListener('pointercancel', resetTarget);
    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
    applyTransform();
  };

  root.addEventListener('pointerenter', onPointerEnter);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerleave', resetTarget);
  root.addEventListener('pointercancel', resetTarget);
  motionQuery.addEventListener('change', (event) => {
    if (event.matches) {
      disableInteraction();
    }
  });
}

document.querySelectorAll<HTMLElement>('[data-motion-loop]').forEach(initMotionLoop);
