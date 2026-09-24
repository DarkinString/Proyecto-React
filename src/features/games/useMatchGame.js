import { useEffect, useRef, useState } from 'react';
import { createBoard, findPossibleMove, levelSettings, rateStars, resolveMove } from './match3.js';

const emptyGame = { phase: 'setup', board: [], points: 0, cleared: 0, comboCount: 0, movesLeft: 0, matched: [], busy: false, result: null };
const encouragements = ['Cada pasito nos acerca a otro recuerdo. ♡', 'Respira, mira los colores… yo creo en ti.', '¡Qué bonito construir algo juntos, pieza por pieza!'];


export default function useMatchGame({ onWin, onMessage }) {
  const [game, setGame] = useState(emptyGame);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [notice, setNotice] = useState('');
  const gameRef = useRef(emptyGame);
  const callbacks = useRef({ onWin, onMessage });
  const clock = useRef({ accumulated: 0, startedAt: null });
  const pending = useRef(null);
  const pendingStep = useRef(null);
  const generation = useRef(0);
  const messageIndex = useRef(0);
  callbacks.current = { onWin, onMessage };

  function commit(next) {
    gameRef.current = next;
    setGame(next);
  }

  function elapsed() {
    const { accumulated, startedAt } = clock.current;
    return (accumulated + (startedAt === null ? 0 : performance.now() - startedAt)) / 1000;
  }

  function stopClock() {
    clock.current = { accumulated: elapsed() * 1000, startedAt: null };
    setElapsedSeconds(clock.current.accumulated / 1000);
  }

  function announce(text) {
    setNotice(text);
    callbacks.current.onMessage?.(text);
  }

  useEffect(() => {
    if (game.phase !== 'playing') return;
    const ticker = window.setInterval(() => setElapsedSeconds(elapsed()), 250);
    const encouragement = window.setInterval(() => {
      if (!gameRef.current.busy) {
        callbacks.current.onMessage?.(encouragements[messageIndex.current++ % encouragements.length]);
      }
    }, 20000);
    return () => { window.clearInterval(ticker); window.clearInterval(encouragement); };
  }, [game.phase]);

  useEffect(() => {
    function visibilityChanged() {
      if (document.hidden && gameRef.current.phase === 'playing') {
        stopClock();
        window.clearTimeout(pending.current);
        commit({ ...gameRef.current, phase: 'paused' });
        setNotice('Pausamos tu partida mientras estabas fuera. Retómala cuando quieras.');
      }
    }
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      document.removeEventListener('visibilitychange', visibilityChanged);
      generation.current += 1;
      window.clearTimeout(pending.current);
      pendingStep.current = null;
    };
  }, []);

  function start({ nickname, difficulty, levelId, levelIndex }) {
    const cleanName = nickname.trim();
    if (!cleanName || cleanName.length > 24) return;
    const settings = levelSettings(difficulty, levelIndex);
    generation.current += 1;
    window.clearTimeout(pending.current);
    pendingStep.current = null;
    clock.current = { accumulated: 0, startedAt: performance.now() };
    setElapsedSeconds(0);
    commit({ ...emptyGame, phase: 'playing', nickname: cleanName, difficulty, levelId, levelIndex, settings,
      board: createBoard(settings.types), movesLeft: settings.moves, runId: crypto.randomUUID() });
    announce(`¡Vamos, ${cleanName}! Cada combinación descubre un pedacito de nuestro tesoro. ♡`);
  }

  function finishMove(outcome, before) {
    const seconds = elapsed();
    const cleared = before.cleared + outcome.cleared;
    const points = before.points + outcome.points;
    const comboCount = before.comboCount + outcome.comboCount;
    const won = cleared >= before.settings.target;
    const lost = !won && before.movesLeft === 1;
    const next = { ...gameRef.current, board: outcome.board, points, cleared, comboCount,
      movesLeft: before.movesLeft - 1, busy: false, matched: [] };
    if (won || lost) {
      stopClock();
      next.phase = won ? 'won' : 'lost';
    }
    if (won) {
      next.result = {
        id: before.runId, nickname: before.nickname, difficulty: before.difficulty, levelId: before.levelId,
        points, elapsedSeconds: Math.round(seconds * 100) / 100, comboCount,
        stars: rateStars({ elapsedSeconds: seconds, comboCount, difficulty: before.difficulty, levelIndex: before.levelIndex }),
        completedAt: new Date().toISOString(),
      };
    }
    commit(next);
    if (won) {
      announce(`¡Lo lograste, ${before.nickname}! Este recuerdo ya tiene un lugar en nuestro corazón. ♡`);
      callbacks.current.onWin?.(next.result);
    } else if (lost) {
      announce('Se acabaron los movimientos, pero mis abrazos no. ¡Lo intentamos otra vez! ♡');
    } else {
      const text = outcome.comboCount
        ? `¡${outcome.comboCount} ${outcome.comboCount === 1 ? 'combo' : 'combos'}! Tú haces que todo encaje bonito. +${outcome.points} puntos ♡`
        : encouragements[messageIndex.current++ % encouragements.length];
      announce(`${text}${outcome.reshuffled ? ' Mezclé las figuras para darte nuevas posibilidades.' : ''}`);
    }
  }

  function swap(from, to) {
    const before = gameRef.current;
    if (before.phase !== 'playing' || before.busy) return;
    const outcome = resolveMove(before.board, from, to, before.settings.types);
    if (!outcome.valid) {
      announce('Esas figuras todavía no forman una línea de tres. Prueba otra; no gastaste un movimiento. ♡');
      return;
    }
    const token = generation.current;
    const swapped = [...before.board];
    [swapped[from], swapped[to]] = [swapped[to], swapped[from]];
    commit({ ...before, board: swapped, busy: true, matched: outcome.steps[0]?.matched ?? [] });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.querySelector('[data-motion="off"]');
    function showStep(index) {
      if (token !== generation.current) return;
      const step = outcome.steps[index];
      if (!step) { finishMove(outcome, before); return; }
      pendingStep.current = () => {
        if (token !== generation.current) return;
        if (gameRef.current.phase === 'paused') return;
        pendingStep.current = null;
        commit({ ...gameRef.current, board: step.board, matched: outcome.steps[index + 1]?.matched ?? [] });
        showStep(index + 1);
      };
      pending.current = window.setTimeout(() => pendingStep.current?.(), reduced ? 0 : 190);
    }
    showStep(0);
  }

  function pause() {
    if (gameRef.current.phase !== 'playing' || gameRef.current.busy) return;
    stopClock();
    commit({ ...gameRef.current, phase: 'paused' });
  }

  function resume() {
    if (gameRef.current.phase !== 'paused') return;
    clock.current.startedAt = performance.now();
    commit({ ...gameRef.current, phase: 'playing' });
    if (pendingStep.current) pending.current = window.setTimeout(() => pendingStep.current?.(), 190);
    announce('Aquí sigo, a tu lado. ¡Vamos por ese recuerdo! ♡');
  }

  function hint() {
    if (gameRef.current.phase !== 'playing' || gameRef.current.busy) return null;
    const move = findPossibleMove(gameRef.current.board);
    announce('Te marqué dos figuras que pueden combinarse. Juntos es más bonito. ♡');
    return move;
  }

  function reset() {
    generation.current += 1;
    window.clearTimeout(pending.current);
    pendingStep.current = null;
    stopClock();
    commit(emptyGame);
    setNotice('Elige cómo quieres jugar esta vez. ♡');
  }

  return { game, elapsedSeconds, notice, start, swap, pause, resume, hint, reset };
}
