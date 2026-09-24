import test from 'node:test';
import assert from 'node:assert/strict';
import { isLetter } from '../src/features/letters/letterModel.js';

const validLetter = {
  id: 'carta-uno',
  title: 'Un recuerdo nuestro ♡',
  body: 'Primera línea.\n\nOtra línea con cariño.',
  createdAt: '2026-09-21T12:00:00.000Z',
};

test('acepta cartas con saltos de línea y los límites completos del formulario', () => {
  assert.equal(isLetter(validLetter), true);
  assert.equal(isLetter({ ...validLetter, title: 'a'.repeat(80), body: 'b'.repeat(4000) }), true);
});

test('rechaza cartas vacías, incluidos espacios o saltos de línea solamente', () => {
  for (const empty of ['', '   ', '\n\t\r\n']) {
    assert.equal(isLetter({ ...validLetter, title: empty }), false);
    assert.equal(isLetter({ ...validLetter, body: empty }), false);
  }
  assert.equal(isLetter(null), false);
  assert.equal(isLetter({}), false);
});

test('rechaza texto que supera los límites de almacenamiento', () => {
  assert.equal(isLetter({ ...validLetter, title: 'a'.repeat(81) }), false);
  assert.equal(isLetter({ ...validLetter, body: 'b'.repeat(4001) }), false);
});

test('rechaza fechas ilegibles para evitar fallos al mostrar las cartas guardadas', () => {
  for (const createdAt of ['', 'fecha desconocida', null, 123]) {
    assert.equal(isLetter({ ...validLetter, createdAt }), false);
  }
});
