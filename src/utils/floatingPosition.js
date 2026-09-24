// Mantiene la ventana completa al alcance, incluso después de girar el teléfono.
export function clampFloatingPosition(position, size, viewport, padding = 8) {
  const maxX = Math.max(padding, viewport.width - size.width - padding);
  const maxY = Math.max(padding, viewport.height - size.height - padding);
  return {
    x: Math.min(maxX, Math.max(padding, position.x)),
    y: Math.min(maxY, Math.max(padding, position.y)),
  };
}
