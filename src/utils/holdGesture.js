// Un gesto pequeño, independiente de React: esperar, arrastrar y soltar.
// Los temporizadores se pueden sustituir en las pruebas sin esperar dos segundos reales.
export function createHoldGesture({ start, delay = 2000, onHold, onMove, onFinish,
  schedule = setTimeout, cancel = clearTimeout }) {
  let latest = start;
  let held = false;
  let finished = false;
  let moved = false;
  const timer = schedule(() => {
    if (finished) return;
    held = true;
    onHold();
    onMove(latest);
  }, delay);

  return {
    move(point) {
      if (finished) return false;
      latest = point;
      if (Math.hypot(point.x - start.x, point.y - start.y) > 12) moved = true;
      // Mover el mouse durante la espera no cancela la pulsación.
      if (held) onMove(point);
      return held;
    },
    finish() {
      if (finished) return;
      finished = true;
      cancel(timer);
      // Un arrastre no debe convertirse después en un clic para dar una galleta.
      onFinish({ suppressClick: held || moved });
    },
  };
}
