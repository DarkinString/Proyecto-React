
export const GAME_RECORDS_KEY = 'mirukaleta.game.records.v1';

const difficulties = new Set(['easy', 'medium', 'hard']);
const nonEmptyText = (value, maxLength) => typeof value === 'string'
  && value.trim().length > 0 && value.length <= maxLength;
const nonNegativeInteger = (value) => Number.isSafeInteger(value) && value >= 0;
const isCompletionDate = (value) => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;

export function isGameRecord(record) {
  return Boolean(record && typeof record === 'object' && !Array.isArray(record)
    && nonEmptyText(record.id, 100)
    && nonEmptyText(record.nickname, 24)
    && difficulties.has(record.difficulty)
    && nonEmptyText(record.levelId, 100)
    && nonNegativeInteger(record.points)
    && typeof record.elapsedSeconds === 'number'
    && Number.isFinite(record.elapsedSeconds) && record.elapsedSeconds >= 0
    && record.elapsedSeconds <= Number.MAX_SAFE_INTEGER
    && nonNegativeInteger(record.comboCount)
    && Number.isInteger(record.stars) && record.stars >= 1 && record.stars <= 3
    && isCompletionDate(record.completedAt));
}

export function getLevelCollection(records, levelId) {
  const victories = records.filter((record) => record.levelId === levelId);
  return {
    unlocked: victories.length > 0,
    bestStars: victories.reduce((best, record) => Math.max(best, record.stars), 0),
    bestTime: victories.length ? victories.reduce((best, record) => Math.min(best, record.elapsedSeconds), Infinity) : null,
    wins: victories.length,
  };
}


export function getLeaderboard(records, difficulty, levelId) {
  const ranked = records
    .filter((record) => record.difficulty === difficulty && record.levelId === levelId)
    .sort((first, second) => second.points - first.points
      || first.elapsedSeconds - second.elapsedSeconds
      || Date.parse(first.completedAt) - Date.parse(second.completedAt));
  const seen = new Set();
  return ranked.filter((record) => {
    const nickname = record.nickname.trim().toLocaleLowerCase('es-MX');
    if (seen.has(nickname)) return false;
    seen.add(nickname);
    return true;
  }).slice(0, 5);
}

export function isTimeRecord(records, result) {
  const comparable = records.filter((record) => record.levelId === result.levelId
    && record.difficulty === result.difficulty && record.id !== result.id);
  
  return comparable.every((record) => result.elapsedSeconds < record.elapsedSeconds);
}

export function addGameRecord(records, result) {
  if (!isGameRecord(result)) throw new Error('El resultado del juego no es válido.');
  
  return records.some((record) => record.id === result.id) ? records : [...records, result];
}
