import test from 'node:test';
import assert from 'node:assert/strict';
import { clampFloatingPosition } from '../src/utils/floatingPosition.js';

test('arrastrar a los bordes conserva toda la ventana dentro de la pantalla', () => {
  assert.deepEqual(clampFloatingPosition({ x: -500, y: 900 }, { width: 300, height: 240 }, { width: 390, height: 844 }), { x: 8, y: 596 });
});
test('al reducir la pantalla se mantiene accesible la esquina de una ventana demasiado grande', () => {
  assert.deepEqual(clampFloatingPosition({ x: 900, y: -5 }, { width: 500, height: 900 }, { width: 390, height: 844 }), { x: 8, y: 8 });
});
