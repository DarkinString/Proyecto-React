import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SIZE, DIFFICULTIES, createBoard, findMatches, areAdjacent,
  findPossibleMove, resolveMove, levelSettings, rateStars,
} from '../src/features/games/match3.js';

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

function sequenceRandom(types, values) {
  let index = 0;
  return () => (values[index++] ?? 1) / types;
}

function diagonalBoard(types = 4) {
  return Array.from({ length: SIZE * SIZE }, (_, index) => (Math.floor(index / SIZE) + index % SIZE) % types);
}

function playableFixture() {
  const board = diagonalBoard();
  board[2] = 0;
  board[7] = 0;
  return board;
}

test('cada dificultad genera tableros completos, sin coincidencias iniciales y con una jugada posible', () => {
  for (const config of Object.values(DIFFICULTIES)) {
    for (let seed = 1; seed <= 30; seed += 1) {
      const board = createBoard(config.types, seededRandom(seed));
      assert.equal(board.length, 36);
      assert.ok(board.every((piece) => Number.isInteger(piece) && piece >= 0 && piece < config.types));
      assert.deepEqual(findMatches(board), []);
      assert.ok(findPossibleMove(board));
    }
  }
});

test('un generador constante también produce un tablero jugable y termina', () => {
  for (const types of [2, 4, 5, 6]) {
    const board = createBoard(types, () => 0);
    assert.deepEqual(findMatches(board), []);
    assert.ok(findPossibleMove(board));
  }
});

test('las coincidencias cruzadas incluyen cada pieza una sola vez', () => {
  const board = diagonalBoard(6);
  for (const index of [8, 13, 14, 15, 20]) board[index] = 9;
  assert.deepEqual(findMatches(board), [8, 13, 14, 15, 20]);
});

test('las filas no se conectan por los bordes y no se permiten diagonales', () => {
  const board = diagonalBoard(6);
  for (const index of [4, 5, 6]) board[index] = 9;
  assert.deepEqual(findMatches(board), []);
  assert.equal(areAdjacent(5, 6), false);
  assert.equal(areAdjacent(0, 7), false);
  assert.equal(areAdjacent(0, 6), true);
  assert.equal(areAdjacent(6, 7), true);
  assert.equal(areAdjacent(-1, 0), false);
  assert.equal(areAdjacent(35, 36), false);
});

test('un intercambio que no combina figuras conserva el tablero y no concede puntos ni pasos', () => {
  const board = Object.freeze(playableFixture());
  for (const move of [[0, 1], [0, 7], [5, 6], [-1, 0]]) {
    const result = resolveMove(board, ...move, 4);
    assert.deepEqual(result, {
      valid: false, board: [...board], steps: [], cleared: 0, points: 0, comboCount: 0, reshuffled: false,
    });
    assert.notEqual(result.board, board);
  }
});

test('la gravedad conserva el orden de las figuras de una columna y rellena arriba', () => {
  const board = Object.freeze(playableFixture().reverse());
  const result = resolveMove(board, 34, 28, 4, sequenceRandom(4, [1, 2, 3]));
  assert.equal(result.valid, true);
  assert.equal(result.steps.length, 1);
  assert.deepEqual(result.steps[0].matched, [33, 34, 35]);
  assert.deepEqual(result.board, [
    2, 1, 0, 1, 2, 3,
    1, 0, 3, 3, 2, 1,
    0, 3, 2, 2, 1, 0,
    3, 2, 1, 1, 0, 3,
    2, 1, 0, 0, 3, 2,
    1, 0, 3, 3, 1, 1,
  ]);
  assert.equal(result.cleared, 3);
  assert.equal(result.points, 300);
  assert.equal(result.comboCount, 0);
});

test('las cascadas se resuelven y multiplican los puntos sin gastar otro movimiento', () => {
  const board = Object.freeze(playableFixture());
  const result = resolveMove(board, 1, 7, 4, sequenceRandom(4, [2, 2, 2, 1, 2, 3]));
  assert.equal(result.steps.length, 2);
  assert.deepEqual(result.steps.map((step) => step.matched), [[0, 1, 2], [0, 1, 2]]);
  assert.deepEqual(result.steps.map((step) => step.points), [300, 600]);
  assert.equal(result.cleared, 6);
  assert.equal(result.points, 900);
  assert.equal(result.comboCount, 1);
  assert.equal(result.reshuffled, false);
  assert.deepEqual(findMatches(result.board), []);
  assert.notEqual(result.board, result.steps[1].board);
  assert.notEqual(result.steps[0].board, result.steps[1].board);
});

test('una combinación de cuatro figuras concede un combo en la primera oleada', () => {
  const board = diagonalBoard(6);
  [board[0], board[1], board[2], board[3], board[8]] = [0, 0, 1, 0, 0];
  const result = resolveMove(board, 2, 8, 6, sequenceRandom(6, [1, 2, 3, 4]));
  assert.deepEqual(result.steps[0].matched, [0, 1, 2, 3]);
  assert.equal(result.steps.length, 1);
  assert.equal(result.comboCount, 1);
  assert.equal(result.points, 400);
});

test('detecta un tablero sin jugadas posibles', () => {
  const board = diagonalBoard();
  assert.deepEqual(findMatches(board), []);
  assert.equal(findPossibleMove(board), null);
});

test('si una jugada deja el tablero bloqueado lo renueva sin sumar piezas ni puntos ficticios', () => {
  const board = [
    0, 0, 2, 1, 0, 0,
    0, 0, 2, 4, 0, 2,
    3, 2, 0, 1, 5, 4,
    3, 0, 5, 4, 2, 3,
    2, 1, 3, 3, 2, 5,
    1, 4, 3, 5, 4, 3,
  ];
  const result = resolveMove(board, 8, 14, 6, sequenceRandom(6, [2, 5, 5]));
  assert.equal(findPossibleMove(result.steps[0].board), null);
  assert.equal(result.reshuffled, true);
  assert.equal(result.cleared, 3);
  assert.equal(result.points, 300);
  assert.ok(findPossibleMove(result.board));
  assert.deepEqual(findMatches(result.board), []);
});

test('un relleno patológico tiene límite de cascadas y deja un tablero estable y jugable', () => {
  const result = resolveMove(playableFixture(), 1, 7, 4, () => 0);
  assert.equal(result.steps.length, 40);
  assert.equal(result.reshuffled, true);
  assert.deepEqual(findMatches(result.board), []);
  assert.ok(findPossibleMove(result.board));
});

test('cada nivel aumenta objetivo, movimientos y tiempo sin modificar la dificultad base', () => {
  assert.deepEqual(levelSettings('medium', 2), {
    label: 'Medio', types: 5, moves: 24, target: 95, starTime: 240, starCombos: 4,
  });
  assert.equal(DIFFICULTIES.medium.target, 83);
  assert.notEqual(levelSettings('easy'), DIFFICULTIES.easy);
});

test('cada dificultad exige combinaciones adicionales para que los movimientos puedan agotarse antes del objetivo', () => {
  for (const difficulty of Object.keys(DIFFICULTIES)) {
    for (const levelIndex of [0, 1, 2]) {
      const settings = levelSettings(difficulty, levelIndex);
      assert.ok(settings.target > settings.moves * 3);
    }
  }
});

test('las estrellas premian por separado completar, tiempo y combos, incluidos los límites exactos', () => {
  const performance = { elapsedSeconds: 150, comboCount: 3, difficulty: 'easy', levelIndex: 0 };
  assert.equal(rateStars(performance), 3);
  assert.equal(rateStars({ ...performance, elapsedSeconds: 151 }), 2);
  assert.equal(rateStars({ ...performance, comboCount: 2 }), 2);
  assert.equal(rateStars({ ...performance, elapsedSeconds: 151, comboCount: 2 }), 1);
  assert.equal(rateStars({ ...performance, elapsedSeconds: 180, levelIndex: 1 }), 3);
});

test('los datos mal formados se rechazan antes de producir resultados incoherentes', () => {
  assert.throws(() => createBoard(1), RangeError);
  assert.throws(() => createBoard(4, () => 1), RangeError);
  assert.throws(() => findMatches(new Array(36)), TypeError);
  assert.throws(() => resolveMove(Array(36).fill(4), 0, 1, 4), TypeError);
  assert.throws(() => levelSettings('imposible'), RangeError);
  assert.throws(() => levelSettings('easy', -1), RangeError);
  assert.throws(() => rateStars({ elapsedSeconds: -1, comboCount: 0, difficulty: 'easy' }), RangeError);
});
