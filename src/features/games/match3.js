// El motor no conoce React: recibe datos, calcula una jugada y devuelve datos nuevos.
export const SIZE = 6;
const CELL_COUNT = SIZE * SIZE;
const MAX_CASCADES = 40;
const MAX_BOARD_ATTEMPTS = 24;

export const DIFFICULTIES = Object.freeze({
  easy: Object.freeze({ label: 'Fácil', types: 4, moves: 20, target: 92, starTime: 150, starCombos: 3 }),
  medium: Object.freeze({ label: 'Medio', types: 5, moves: 20, target: 83, starTime: 180, starCombos: 4 }),
  hard: Object.freeze({ label: 'Difícil', types: 6, moves: 20, target: 81, starTime: 210, starCombos: 5 }),
});

function validateTypes(types) {
  if (!Number.isInteger(types) || types < 2 || types > 12) {
    throw new RangeError('El tablero necesita entre 2 y 12 tipos de figuras.');
  }
}

function validateBoard(board, types = Infinity) {
  if (!Array.isArray(board) || board.length !== CELL_COUNT ||
      Array.from(board).some((value) => !Number.isInteger(value) || value < 0 || value >= types)) {
    throw new TypeError('El tablero debe contener 36 números de figuras válidos.');
  }
}

function randomIndex(length, rng) {
  const value = rng();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('La función aleatoria debe devolver un número entre 0 (incluido) y 1 (excluido).');
  }
  return Math.floor(value * length);
}

export function areAdjacent(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= CELL_COUNT || b >= CELL_COUNT) {
    return false;
  }
  const rowDistance = Math.abs(Math.floor(a / SIZE) - Math.floor(b / SIZE));
  const columnDistance = Math.abs(a % SIZE - b % SIZE);
  return rowDistance + columnDistance === 1;
}

export function findMatches(board) {
  validateBoard(board);
  const matches = new Set();

  // Una fila y una columna son la misma búsqueda con distinto punto de inicio y salto.
  for (let line = 0; line < SIZE; line += 1) {
    for (const vertical of [false, true]) {
      const start = vertical ? line : line * SIZE;
      const stride = vertical ? SIZE : 1;
      let runStart = 0;
      for (let position = 1; position <= SIZE; position += 1) {
        if (position < SIZE && board[start + position * stride] === board[start + runStart * stride]) continue;
        if (position - runStart >= 3) {
          for (let member = runStart; member < position; member += 1) {
            matches.add(start + member * stride);
          }
        }
        runStart = position;
      }
    }
  }
  return [...matches].sort((a, b) => a - b);
}

function swappedBoard(board, a, b) {
  const copy = [...board];
  [copy[a], copy[b]] = [copy[b], copy[a]];
  return copy;
}

export function findPossibleMove(board) {
  validateBoard(board);
  for (let index = 0; index < CELL_COUNT; index += 1) {
    for (const neighbor of [index + 1, index + SIZE]) {
      if (!areAdjacent(index, neighbor) || board[index] === board[neighbor]) continue;
      const matches = findMatches(swappedBoard(board, index, neighbor));
      if (matches.includes(index) || matches.includes(neighbor)) return [index, neighbor];
    }
  }
  return null;
}

export function createBoard(types, rng = Math.random) {
  validateTypes(types);
  for (let attempt = 0; attempt < MAX_BOARD_ATTEMPTS; attempt += 1) {
    const board = [];
    for (let index = 0; index < CELL_COUNT; index += 1) {
      // Evitamos una coincidencia al colocar cada pieza, sin tener que resolverla después.
      const candidates = Array.from({ length: types }, (_, type) => type).filter((type) => {
        const threeAcross = index % SIZE >= 2 && board[index - 1] === type && board[index - 2] === type;
        const threeDown = index >= SIZE * 2 && board[index - SIZE] === type && board[index - SIZE * 2] === type;
        return !threeAcross && !threeDown;
      });
      // Con dos tipos, alguna combinación de vecinos puede excluir ambos.
      if (!candidates.length) break;
      board.push(candidates[randomIndex(candidates.length, rng)]);
    }
    if (board.length === CELL_COUNT && findPossibleMove(board)) return board;
  }

  // Respaldo determinista: incluso un generador constante produce un tablero jugable.
  const board = Array.from({ length: CELL_COUNT }, (_, index) => (Math.floor(index / SIZE) + index % SIZE) % types);
  board[2] = 0;
  board[SIZE + 1] = 0;
  return board;
}

function refillBoard(board, matched, types, rng) {
  const removed = new Set(matched);
  const next = [...board];
  for (let column = 0; column < SIZE; column += 1) {
    let destinationRow = SIZE - 1;
    for (let row = SIZE - 1; row >= 0; row -= 1) {
      const index = row * SIZE + column;
      if (!removed.has(index)) {
        next[destinationRow * SIZE + column] = board[index];
        destinationRow -= 1;
      }
    }
    while (destinationRow >= 0) {
      next[destinationRow * SIZE + column] = randomIndex(types, rng);
      destinationRow -= 1;
    }
  }
  return next;
}

export function resolveMove(board, from, to, types, rng = Math.random) {
  validateTypes(types);
  validateBoard(board, types);
  const invalid = () => ({ valid: false, board: [...board], steps: [], cleared: 0, points: 0, comboCount: 0, reshuffled: false });
  if (!areAdjacent(from, to) || board[from] === board[to]) return invalid();
  if (findMatches(board).length) throw new RangeError('Resuelve las coincidencias anteriores antes de intercambiar figuras.');

  let next = swappedBoard(board, from, to);
  let matched = findMatches(next);
  if (!matched.length) return invalid();

  const steps = [];
  let cleared = 0;
  let points = 0;
  let comboCount = 0;

  while (matched.length && steps.length < MAX_CASCADES) {
    const waveIndex = steps.length;
    const wavePoints = matched.length * 100 * (waveIndex + 1);
    next = refillBoard(next, matched, types, rng);
    steps.push({ matched: [...matched], board: [...next], points: wavePoints });
    cleared += matched.length;
    points += wavePoints;
    // Una oleada aporta como máximo un combo: cuatro piezas o una cascada posterior.
    if (matched.length >= 4 || waveIndex > 0) comboCount += 1;
    matched = findMatches(next);
  }

  // Si faltan jugadas o se alcanza el límite de cascadas, renovamos el tablero sin cobrar un turno.
  const reshuffled = matched.length > 0 || !findPossibleMove(next);
  if (reshuffled) next = createBoard(types, rng);
  return { valid: true, board: [...next], steps, cleared, points, comboCount, reshuffled };
}

export function levelSettings(difficulty, levelIndex = 0) {
  const config = DIFFICULTIES[difficulty];
  if (!Object.hasOwn(DIFFICULTIES, difficulty)) throw new RangeError('Elige una dificultad válida.');
  if (!Number.isInteger(levelIndex) || levelIndex < 0) throw new RangeError('El índice del nivel comienza en cero.');
  return {
    ...config,
    target: config.target + 6 * levelIndex,
    moves: config.moves + 2 * levelIndex,
    starTime: config.starTime + 30 * levelIndex,
  };
}

// Se llama al ganar: completar el nivel ya concede una estrella.
export function rateStars({ elapsedSeconds, comboCount, difficulty, levelIndex = 0 }) {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0 || !Number.isInteger(comboCount) || comboCount < 0) {
    throw new RangeError('El tiempo y los combos deben ser cantidades positivas o cero.');
  }
  const config = levelSettings(difficulty, levelIndex);
  return 1 + Number(elapsedSeconds <= config.starTime) + Number(comboCount >= config.starCombos);
}
