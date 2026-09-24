import test from 'node:test';
import assert from 'node:assert/strict';
import { createHoldGesture } from '../src/utils/holdGesture.js';

function setup(t) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const events = [];
  const gesture = createHoldGesture({ start: { x: 20, y: 30 },
    onHold: () => events.push('held'),
    onMove: (point) => events.push(point),
    onFinish: (result) => events.push(result),
  });
  return { events, gesture };
}

test('la pulsación solo activa el arrastre al cumplir dos segundos', (t) => {
  const { events, gesture } = setup(t);
  t.mock.timers.tick(1999);
  assert.deepEqual(events, []);
  t.mock.timers.tick(1);
  assert.deepEqual(events, ['held', { x: 20, y: 30 }]);
  gesture.move({ x: 70, y: 90 });
  assert.deepEqual(events.at(-1), { x: 70, y: 90 });
  gesture.finish();
  assert.deepEqual(events.at(-1), { suppressClick: true });
});

test('mover el cursor antes del plazo no cancela la pulsación sostenida', (t) => {
  const { events, gesture } = setup(t);
  t.mock.timers.tick(500);
  assert.equal(gesture.move({ x: 120, y: 150 }), false);
  assert.deepEqual(events, []);
  t.mock.timers.tick(1500);
  assert.deepEqual(events, ['held', { x: 120, y: 150 }]);
  gesture.finish();
});

test('un clic breve permite alimentar al poro y nunca activa un arrastre tardío', (t) => {
  const { events, gesture } = setup(t);
  t.mock.timers.tick(100);
  gesture.finish();
  t.mock.timers.tick(3000);
  assert.deepEqual(events, [{ suppressClick: false }]);
});

test('soltar, cancelar o perder foco termina el gesto una sola vez', (t) => {
  const { events, gesture } = setup(t);
  gesture.move({ x: 60, y: 80 });
  gesture.finish();
  gesture.finish();
  gesture.move({ x: 500, y: 600 });
  t.mock.timers.tick(3000);
  assert.deepEqual(events, [{ suppressClick: true }]);
});
