import test from 'node:test';
import assert from 'node:assert/strict';
import { readCollection, updateCollection } from '../src/utils/localCollections.js';
import { isLetter, LETTERS_KEY } from '../src/features/letters/letterModel.js';

function letter(id, body = 'Una carta que quiero conservar.') {
  return { id, title: `Carta ${id}`, body, createdAt: '2026-09-21T12:00:00.000Z' };
}

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    writes: [],
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) {
      values.set(key, value);
      this.writes.push({ key, value });
    },
  };
}

test('la primera visita devuelve una colección vacía sin escribir nada', () => {
  const storage = memoryStorage();
  assert.deepEqual(readCollection(storage, LETTERS_KEY, isLetter), []);
  assert.equal(storage.getItem(LETTERS_KEY), null);
  assert.equal(storage.writes.length, 0);
});

test('guardar cartas conserva el texto completo y permite recuperarlo después', () => {
  const storage = memoryStorage({ 'mirukaleta.theme': 'dark' });
  const first = letter('uno', 'Querida Abigail:\n\nGracias por todo. ♡\nCon amor.');
  const second = letter('dos');

  updateCollection(storage, LETTERS_KEY, isLetter, () => [first]);
  const saved = updateCollection(storage, LETTERS_KEY, isLetter, (current) => [second, ...current]);

  assert.deepEqual(saved, [second, first]);
  assert.deepEqual(readCollection(storage, LETTERS_KEY, isLetter), [second, first]);
  assert.equal(storage.getItem('mirukaleta.theme'), 'dark');
});

test('una actualización vuelve a leer los cambios guardados por otra pestaña', () => {
  const first = letter('uno');
  const external = letter('otra-pestana');
  const latest = letter('nuevo');
  const storage = memoryStorage({ [LETTERS_KEY]: JSON.stringify([first]) });
  const oldView = readCollection(storage, LETTERS_KEY, isLetter);

  storage.setItem(LETTERS_KEY, JSON.stringify([external, first]));
  updateCollection(storage, LETTERS_KEY, isLetter, (current) => [latest, ...current]);

  assert.deepEqual(oldView, [first]);
  assert.deepEqual(readCollection(storage, LETTERS_KEY, isLetter), [latest, external, first]);
});

test('un archivo local ilegible nunca se sustituye por una colección nueva', async (t) => {
  const corruptValues = [
    ['JSON incompleto', '[{"id":'],
    ['valor nulo', 'null'],
    ['objeto en lugar de colección', '{"letters":[]}'],
    ['carta inválida entre cartas válidas', JSON.stringify([letter('uno'), { ...letter('dos'), body: '' }])],
  ];

  for (const [description, raw] of corruptValues) {
    await t.test(description, () => {
      const storage = memoryStorage({ [LETTERS_KEY]: raw });
      let updaterCalled = false;

      assert.throws(() => readCollection(storage, LETTERS_KEY, isLetter));
      assert.throws(() => updateCollection(storage, LETTERS_KEY, isLetter, () => {
        updaterCalled = true;
        return [letter('nuevo')];
      }));

      assert.equal(updaterCalled, false);
      assert.equal(storage.getItem(LETTERS_KEY), raw);
      assert.equal(storage.writes.length, 0);
    });
  }
});

test('si se agota la cuota se conservan las cartas anteriores y el borrador puede reintentarse', (t) => {
  const previous = letter('guardado');
  const draft = letter('borrador');
  const storage = memoryStorage({ [LETTERS_KEY]: JSON.stringify([previous]) });
  const quotaError = new DOMException('Almacenamiento lleno', 'QuotaExceededError');
  const failedWrite = t.mock.method(storage, 'setItem', () => { throw quotaError; });

  assert.throws(
    () => updateCollection(storage, LETTERS_KEY, isLetter, (current) => [draft, ...current]),
    (error) => error === quotaError,
  );
  assert.deepEqual(readCollection(storage, LETTERS_KEY, isLetter), [previous]);

  failedWrite.mock.restore();
  updateCollection(storage, LETTERS_KEY, isLetter, (current) => [draft, ...current]);
  assert.deepEqual(readCollection(storage, LETTERS_KEY, isLetter), [draft, previous]);
});

test('una actualización inválida no reemplaza los datos válidos existentes', () => {
  const previous = letter('guardado');
  const raw = JSON.stringify([previous]);
  const storage = memoryStorage({ [LETTERS_KEY]: raw });

  assert.throws(() => updateCollection(storage, LETTERS_KEY, isLetter, (current) => [
    ...current,
    letter('demasiado-larga', 'a'.repeat(4001)),
  ]));

  assert.equal(storage.getItem(LETTERS_KEY), raw);
  assert.equal(storage.writes.length, 0);
});

test('un fallo al leer impide intentar una escritura destructiva', (t) => {
  const storage = memoryStorage();
  const denied = new DOMException('Almacenamiento bloqueado', 'SecurityError');
  t.mock.method(storage, 'getItem', () => { throw denied; });

  assert.throws(
    () => updateCollection(storage, LETTERS_KEY, isLetter, () => [letter('nuevo')]),
    (error) => error === denied,
  );
  assert.equal(storage.writes.length, 0);
});
