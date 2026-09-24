import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addGameRecord, GAME_RECORDS_KEY, getLeaderboard, getLevelCollection,
  isGameRecord, isTimeRecord,
} from '../src/features/games/gameProgress.js';
import { readCollection, updateCollection } from '../src/utils/localCollections.js';

function record(overrides = {}) {
  return {
    id: 'victoria-1', nickname: 'Lunita', difficulty: 'easy', levelId: 'recuerdo-1',
    points: 1200, elapsedSeconds: 90, comboCount: 4, stars: 2,
    completedAt: '2026-09-22T12:00:00.000Z', ...overrides,
  };
}

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
}

test('el progreso acepta las tres dificultades y los resultados completos', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    assert.equal(isGameRecord(record({ difficulty })), true);
  }
  assert.equal(isGameRecord(record({ elapsedSeconds: 48.75 })), true);
});

test('el progreso rechaza campos inválidos antes de guardarlos', () => {
  const invalidOverrides = [
    { id: '' }, { id: 'x'.repeat(101) }, { nickname: '   ' }, { nickname: 'x'.repeat(25) },
    { difficulty: 'impossible' }, { levelId: null }, { levelId: ' ' },
    { points: -1 }, { points: 2.5 }, { points: Number.MAX_SAFE_INTEGER + 1 },
    { comboCount: -1 }, { comboCount: '3' }, { stars: 0 }, { stars: 4 }, { stars: 1.5 },
    { elapsedSeconds: NaN }, { elapsedSeconds: Infinity }, { elapsedSeconds: -1 },
    { elapsedSeconds: '12' }, { completedAt: 'ayer' },
    { completedAt: '2026-02-31T12:00:00.000Z' },
  ];
  for (const fields of invalidOverrides) {
    assert.equal(isGameRecord(record(fields)), false, `Se aceptó ${JSON.stringify(fields)}`);
  }
  for (const value of [null, [], undefined, 'victoria']) assert.equal(isGameRecord(value), false);
});

test('los tesoros empiezan bloqueados y solo se desbloquea el nivel completado', () => {
  assert.deepEqual(getLevelCollection([], 'recuerdo-1'), {
    unlocked: false, bestStars: 0, bestTime: null, wins: 0,
  });
  const records = [
    record(),
    record({ id: 'victoria-2', difficulty: 'hard', elapsedSeconds: 60, stars: 3 }),
    record({ id: 'victoria-3', levelId: 'recuerdo-2', elapsedSeconds: 30, stars: 1 }),
  ];
  assert.deepEqual(getLevelCollection(records, 'recuerdo-1'), {
    unlocked: true, bestStars: 3, bestTime: 60, wins: 2,
  });
  assert.equal(getLevelCollection(records, 'recuerdo-3').unlocked, false);
});

test('el marcador compara el mismo nivel/dificultad y conserva el mejor intento por sobrenombre', () => {
  const records = [
    record({ id: 'lenta', points: 1800, elapsedSeconds: 80 }),
    record({ id: 'rapida', nickname: 'LUNITA', points: 1800, elapsedSeconds: 70 }),
    record({ id: 'sol', nickname: 'Sol', points: 2200, elapsedSeconds: 120 }),
    record({ id: 'estrella', nickname: 'Estrella', points: 1800, elapsedSeconds: 60 }),
    record({ id: 'otro-nivel', levelId: 'recuerdo-2', points: 5000 }),
    record({ id: 'otra-dificultad', difficulty: 'hard', points: 5000 }),
  ];
  const before = records.map((item) => item.id);
  assert.deepEqual(getLeaderboard(records, 'easy', 'recuerdo-1').map((item) => item.id), ['sol', 'estrella', 'rapida']);
  assert.deepEqual(records.map((item) => item.id), before, 'ordenar no debe modificar el historial');
});

test('el marcador muestra cinco sobrenombres como máximo', () => {
  const records = Array.from({ length: 8 }, (_, index) => record({ id: `id-${index}`, nickname: `Jugadora ${index}`, points: index * 100 }));
  assert.deepEqual(getLeaderboard(records, 'easy', 'recuerdo-1').map((item) => item.points), [700, 600, 500, 400, 300]);
});

test('un récord requiere menos tiempo para el mismo nivel/dificultad, sea cual sea el sobrenombre', () => {
  const first = record();
  assert.equal(isTimeRecord([], first), true, 'la primera victoria establece un récord');
  assert.equal(isTimeRecord([first], record({ id: 'empate', elapsedSeconds: 90 })), false);
  assert.equal(isTimeRecord([first], record({ id: 'mejor', nickname: 'Otra jugadora', elapsedSeconds: 89 })), true);
  assert.equal(isTimeRecord([first], record({ id: 'lenta', elapsedSeconds: 91 })), false);
  assert.equal(isTimeRecord([first], record({ id: 'nuevo-nivel', levelId: 'recuerdo-2', elapsedSeconds: 300 })), true);
  assert.equal(isTimeRecord([first], record({ id: 'dificil', difficulty: 'hard', elapsedSeconds: 300 })), true);
  assert.equal(isTimeRecord([first], first), true, 'reintentar un guardado no compara el intento consigo mismo');
});

test('guardar, recargar y reintentar una victoria conserva un único premio', () => {
  const storage = memoryStorage();
  const first = record();
  assert.deepEqual(readCollection(storage, GAME_RECORDS_KEY, isGameRecord), []);
  updateCollection(storage, GAME_RECORDS_KEY, isGameRecord, (current) => addGameRecord(current, first));
  updateCollection(storage, GAME_RECORDS_KEY, isGameRecord, (current) => addGameRecord(current, first));
  const reloaded = readCollection(storage, GAME_RECORDS_KEY, isGameRecord);
  assert.deepEqual(reloaded, [first]);
  assert.equal(getLevelCollection(reloaded, first.levelId).wins, 1);
});

test('una victoria nueva conserva el progreso de otra pestaña y rechaza resultados corruptos', () => {
  const storage = memoryStorage();
  const external = record({ id: 'otra-pestana', elapsedSeconds: 30 });
  storage.setItem(GAME_RECORDS_KEY, JSON.stringify([external]));
  const next = record({ id: 'actual', elapsedSeconds: 45 });
  let isRecord = true;
  updateCollection(storage, GAME_RECORDS_KEY, isGameRecord, (current) => {
    isRecord = isTimeRecord(current, next);
    return addGameRecord(current, next);
  });
  assert.equal(isRecord, false);
  const raw = storage.getItem(GAME_RECORDS_KEY);
  assert.deepEqual(readCollection(storage, GAME_RECORDS_KEY, isGameRecord), [external, next]);
  assert.throws(() => updateCollection(storage, GAME_RECORDS_KEY, isGameRecord, (current) => addGameRecord(current, record({ stars: 4 }))));
  assert.equal(storage.getItem(GAME_RECORDS_KEY), raw);
});
