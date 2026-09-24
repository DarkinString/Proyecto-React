import { useCallback, useEffect, useRef, useState } from 'react';
import { clampFloatingPosition } from '../utils/floatingPosition.js';
import { createHoldGesture } from '../utils/holdGesture.js';

// Un mismo gesto para ventanas y mascotas; los clics breves siguen siendo clics.
export default function useFloatingDrag({ enabled = true, holdDelay = 2000, initialPosition = null, onDragStart, onReset } = {}) {
  const ref = useRef(null);
  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);
  const [holding, setHolding] = useState(false);
  const positionRef = useRef(initialPosition);
  const options = useRef({ enabled, holdDelay, onDragStart, onReset });
  const cleanupGesture = useRef(null);
  const ignoreClickUntil = useRef(0);
  const sizeObserver = useRef(null);
  options.current = { enabled, holdDelay, onDragStart, onReset };

  function place(next) {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;
    const safe = clampFloatingPosition(next, bounds, {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    });
    if (safe.x !== positionRef.current?.x || safe.y !== positionRef.current?.y) {
      positionRef.current = safe;
      setPosition(safe);
    }
  }

  // Una callback ref también detecta cuando el portal del poro cambia de nodo.
  const attachRef = useCallback((element) => {
    sizeObserver.current?.disconnect();
    ref.current = element;
    if (!element) return;
    sizeObserver.current = new ResizeObserver(() => { if (positionRef.current) place(positionRef.current); });
    sizeObserver.current.observe(element);
  }, []);

  useEffect(() => {
    const fit = () => { if (positionRef.current) place(positionRef.current); };
    window.addEventListener('resize', fit);
    return () => { window.removeEventListener('resize', fit); cleanupGesture.current?.(); };
  }, []);

  useEffect(() => { if (!enabled) cleanupGesture.current?.(); }, [enabled]);

  function reset() {
    cleanupGesture.current?.();
    positionRef.current = null;
    setPosition(null);
    options.current.onReset?.();
  }

  // El marco puede arrastrarse sin apropiarse de sus botones, enlaces o campos.
  function isNestedControl(event) {
    const control = event.target.closest?.('button, a, input, textarea, select, iframe, [contenteditable="true"]');
    return control && control !== event.currentTarget;
  }

  function onPointerDown(event) {
    if (!options.current.enabled || event.button !== 0 || event.isPrimary === false || !ref.current || isNestedControl(event)) return;
    cleanupGesture.current?.();
    const bounds = ref.current.getBoundingClientRect();
    const start = { x: event.clientX, y: event.clientY };
    const origin = { x: bounds.left, y: bounds.top };
    const pointerId = event.pointerId;
    const surface = event.currentTarget;
    // Conserva el gesto aunque el cursor salga de la imagen o atraviese el video.
    try { surface.setPointerCapture(pointerId); } catch { /* El navegador puede haber cancelado el puntero. */ }
    setHolding(true);
    const gesture = createHoldGesture({
      start, delay: options.current.holdDelay,
      onHold() {
        ignoreClickUntil.current = Infinity;
        options.current.onDragStart?.();
        setHolding(false);
        setDragging(true);
        document.body.dataset.floatingDrag = 'true';
      },
      onMove(point) { place({ x: origin.x + point.x - start.x, y: origin.y + point.y - start.y }); },
      onFinish({ suppressClick }) {
        if (suppressClick) ignoreClickUntil.current = performance.now() + 500;
        setHolding(false);
        setDragging(false);
        delete document.body.dataset.floatingDrag;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        window.removeEventListener('blur', finish);
        surface.removeEventListener('lostpointercapture', finish);
        try { surface.releasePointerCapture(pointerId); } catch { /* Ya liberado. */ }
        cleanupGesture.current = null;
      },
    });
    function finish() { gesture.finish(); }
    function move(next) {
      if (next.pointerId !== pointerId) return;
      if (next.buttons === 0 && next.pointerType === 'mouse') { finish(); return; }
      if (gesture.move({ x: next.clientX, y: next.clientY })) next.preventDefault();
    }
    function up(next) { if (next.pointerId === pointerId) finish(); }
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('blur', finish);
    surface.addEventListener('lostpointercapture', finish);
    cleanupGesture.current = finish;
  }

  function onKeyDown(event) {
    if (!options.current.enabled || !ref.current || isNestedControl(event)) return;
    if (event.key === 'Escape') { reset(); return; }
    const step = event.shiftKey ? 30 : 10;
    const offsets = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (!offsets[event.key]) return;
    event.preventDefault();
    const bounds = ref.current.getBoundingClientRect();
    options.current.onDragStart?.();
    const [x, y] = offsets[event.key];
    place({ x: bounds.left + x, y: bounds.top + y });
  }

  return {
    ref: attachRef, dragging, holding, hasPosition: position !== null,
    style: position ? { position: 'fixed', left: position.x, top: position.y, right: 'auto', bottom: 'auto' } : undefined,
    handleProps: { onPointerDown, onKeyDown,
      onDragStart: (event) => { if (!isNestedControl(event)) event.preventDefault(); },
      onContextMenu: (event) => { if (!isNestedControl(event)) event.preventDefault(); },
    }, reset,
    suppressClick: () => performance.now() < ignoreClickUntil.current,
  };
}
