import { useState } from 'react';
import Section from '../../components/ui/Section.jsx';
import { GAME_LEVELS } from '../../data/gameLevels.js';
import { DIFFICULTIES, levelSettings } from './match3.js';
import { getLeaderboard } from './gameProgress.js';
import MatchBoard from './MatchBoard.jsx';
import useMatchGame from './useMatchGame.js';
import GameAmbience from './GameAmbience.jsx';
import useGameAmbience from './useGameAmbience.js';
import './games.css';

function formatTime(seconds) {
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export default function GamesSection({ records, saveResult, storageError, onPoroMessage, poroDockRef }) {
  const [nickname, setNickname] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [levelIndex, setLevelIndex] = useState(0);
  const [hints, setHints] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [setupError, setSetupError] = useState('');
  const match = useMatchGame({ onWin: saveWin, onMessage: onPoroMessage });
  const { game, elapsedSeconds } = match;
  const ambience = useGameAmbience(game.phase);
  const activeLevelIndex = game.phase === 'setup' ? levelIndex : game.levelIndex;
  const activeDifficulty = game.phase === 'setup' ? difficulty : game.difficulty;
  const level = GAME_LEVELS[activeLevelIndex];
  const settings = levelSettings(activeDifficulty, activeLevelIndex);
  const revealed = Math.min(36, Math.floor((game.cleared / settings.target) * 36));
  const leaderboard = getLeaderboard(records, activeDifficulty, level.id);

  function saveWin(result) {
    const status = saveResult(result);
    setSaveStatus(status);
    if (status.saved && status.isRecord) {
      onPoroMessage(`¡Nuevo récord de tiempo, ${result.nickname}! Qué suerte compartir este momento contigo. ♡`);
    }
  }

  function begin(index = levelIndex) {
    const name = nickname.trim();
    if (!name || name.length > 24) { setSetupError('Elige un sobrenombre de 1 a 24 caracteres.'); return; }
    setSetupError('');
    setHints(null);
    setSaveStatus(null);
    setLevelIndex(index);
    ambience.startFromGesture();
    match.start({ nickname: name, difficulty, levelIndex: index, levelId: GAME_LEVELS[index].id });
  }

  function resume() {
    ambience.startFromGesture();
    match.resume();
  }

  function swap(from, to) { setHints(null); match.swap(from, to); }

  return (
    <Section id="juegos" number="04" title="Piezas de nosotros">
      <p>Une figuras, descubre un recuerdo y guárdalo en nuestra colección.</p>
      <GameAmbience ambience={ambience} phase={game.phase} />
      {game.phase === 'setup' ? (
        <form className="surface-panel game-setup" onSubmit={(event) => { event.preventDefault(); begin(); }}>
          <div ref={poroDockRef} />
          <p className="game-eyebrow">UN RATITO PARA JUGAR JUNTOS</p>
          <label className="block text-base font-semibold text-ink" htmlFor="player-nickname">¿Cómo te llamamos mientras juegas?</label>
          <input id="player-nickname" className="field mt-2" value={nickname} onChange={(event) => setNickname(event.target.value)}
            autoComplete="nickname" maxLength={24} required placeholder="Tu sobrenombre favorito" />
          <fieldset className="mt-6">
            <legend className="mb-3 text-base font-semibold text-ink">Elige la dificultad</legend>
            <div className="difficulty-options">
              {Object.entries(DIFFICULTIES).map(([id, option]) => (
                <label key={id} className="difficulty-choice" data-selected={difficulty === id}>
                  <input type="radio" name="difficulty" value={id} checked={difficulty === id} onChange={() => setDifficulty(id)} />
                  <span>{option.label}<small>{option.types} figuras</small></span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="mt-6 block text-base font-semibold text-ink" htmlFor="game-level">Recuerdo a descubrir</label>
          <select id="game-level" className="field mt-2" value={levelIndex} onChange={(event) => setLevelIndex(Number(event.target.value))}>
            {GAME_LEVELS.map((item, index) => {
              const available = index === 0 || records.some((record) => record.levelId === GAME_LEVELS[index - 1].id);
              return <option key={item.id} value={index} disabled={!available}>{index + 1}. {item.title}{available ? '' : ' · completa el anterior'}</option>;
            })}
          </select>
          <p className="mt-4 text-sm text-muted">Descubre la imagen reuniendo {settings.target} figuras en {settings.moves} movimientos válidos.</p>
          <button type="submit" className="button-primary mt-5">Comenzar nuestro juego ♡</button>
          {setupError && <p role="alert" className="mt-3 text-sm text-danger">{setupError}</p>}
        </form>
      ) : (
        <div className="game-play surface-panel">
          <div className="game-heading">
            <div><p className="game-eyebrow">NIVEL {activeLevelIndex + 1} · {DIFFICULTIES[activeDifficulty].label}</p>
              <h3 className="font-serif text-2xl text-ink">{game.nickname}, este recuerdo es para ti.</h3></div>
            {game.phase === 'playing' && <button type="button" className="button-secondary" onClick={match.pause} disabled={game.busy}>Pausar</button>}
          </div>
          <div className="game-stats" aria-label="Marcador de la partida">
            <div><span>Puntos</span><strong>{game.points.toLocaleString('es-MX')}</strong></div>
            <div><span>Tiempo</span><strong>{formatTime(elapsedSeconds)}</strong></div>
            <div><span>Combos</span><strong>{game.comboCount}</strong></div>
            <div><span>Movimientos</span><strong>{game.movesLeft}</strong></div>
          </div>
          <figure key={game.runId} className="memory-preview">
            <div className="memory-mosaic">
              <img src={level.image} alt={game.phase === 'won' ? level.alt : 'Un recuerdo se descubre poco a poco'} draggable="false" />
              <div className="mosaic-cover" aria-hidden="true">
                {Array.from({ length: 36 }, (_, index) => <span key={index} data-revealed={index < revealed}>{index < revealed ? '' : '♡'}</span>)}
              </div>
            </div>
            <figcaption><strong>{level.title}</strong>{level.isPlaceholder && <span>Ilustración provisional · aquí irá su foto</span>}</figcaption>
          </figure>
          <label className="game-progress-label" htmlFor="memory-progress">Recuerdo descubierto <strong>{Math.min(game.cleared, settings.target)}/{settings.target} figuras</strong></label>
          <progress id="memory-progress" max={settings.target} value={Math.min(game.cleared, settings.target)} className="memory-progress" />
          <div ref={poroDockRef} />

          {(game.phase === 'playing' || game.phase === 'paused') && (
            <>
              <p id="game-instructions" className="mb-4 mt-5 text-sm text-muted">Toca dos figuras vecinas o desliza una. Une 3 o más iguales en línea. Con teclado: flechas para moverte y Enter para elegir.</p>
              <div className="board-container">
                {game.phase === 'paused' ? (
                  <div className="game-pause"><span aria-hidden="true">☾</span><h4>Un pequeño respiro.</h4><p>El tiempo está detenido. Tu tablero te espera.</p><button className="button-primary" type="button" onClick={resume}>Seguir jugando</button></div>
                ) : <MatchBoard key={game.runId} board={game.board} matched={game.matched} disabled={game.busy} hints={hints} onSwap={swap} />}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className="button-secondary" disabled={game.phase !== 'playing' || game.busy} onClick={() => setHints(match.hint())}>Una pista del poro</button>
                <button type="button" className="button-secondary" disabled={game.busy} onClick={match.reset}>Volver a elegir</button>
              </div>
            </>
          )}

          {game.phase === 'won' && (
            <div className="game-result" role="status">
              <p className="game-eyebrow">UN RECUERDO MÁS PARA LOS DOS</p>
              <div className="game-stars" aria-label={`${game.result.stars} de 3 estrellas`}>
                {[1, 2, 3].map((star) => <span key={star} data-earned={star <= game.result.stars} aria-hidden="true">★</span>)}
              </div>
              <h4>¡Lo completaste, {game.nickname}!</h4>
              <p>{saveStatus?.saved ? 'Tu imagen ya está en Coleccionables.' : 'Tu recuerdo está listo; falta guardar el resultado.'}</p>
              {saveStatus?.saved && saveStatus.isRecord && <p className="record-message">¡Nuevo récord de tiempo en este nivel y dificultad! ♡</p>}
              <p className="mt-3 text-sm">Una estrella por completar, otra en {settings.starTime} segundos o menos y otra con {settings.starCombos} combos o más.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {!saveStatus?.saved && <button type="button" className="button-primary" onClick={() => saveWin(game.result)}>Reintentar guardar premio</button>}
                {activeLevelIndex < GAME_LEVELS.length - 1 && <button type="button" className="button-primary" disabled={!saveStatus?.saved} onClick={() => begin(activeLevelIndex + 1)}>Siguiente recuerdo →</button>}
                <a className="button-secondary" href="#coleccionables">Ver mis coleccionables</a>
                <button type="button" className="button-secondary" disabled={!saveStatus?.saved} onClick={() => begin(activeLevelIndex)}>Mejorar mis estrellas</button>
                <button type="button" className="button-secondary" onClick={match.reset}>Volver al inicio del juego</button>
              </div>
            </div>
          )}
          {game.phase === 'lost' && (
            <div className="game-result" role="status"><h4>Nos queda otra oportunidad. ♡</h4><p>Esta vez faltaron movimientos. Tu colección sigue esperándote.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3"><button type="button" className="button-primary" onClick={() => begin(activeLevelIndex)}>Volver a intentarlo</button><button type="button" className="button-secondary" onClick={match.reset}>Cambiar dificultad</button></div>
            </div>
          )}
          <p className="game-notice" role="status">{match.notice}</p>
        </div>
      )}
      {storageError && <p role="alert" className="mt-4 text-sm text-danger">{storageError}</p>}
      <details className="game-rules">
        <summary>Cómo ganar estrellas y cuidar tu récord</summary>
        <p>Una combinación válida gasta un movimiento. Las figuras caen y pueden formar nuevas combinaciones: esas son las cascadas. Cada oleada de 4 o más figuras, o una cascada, suma un combo.</p>
        <p>Cada figura vale 100 puntos, multiplicados por la posición de su cascada. Para este nivel: ★ completar; ★ tiempo ≤ {settings.starTime} s; ★ al menos {settings.starCombos} combos.</p>
        <p>La pausa detiene el reloj y oculta el tablero. Cambiar de pestaña pausa automáticamente. Las partidas en curso se reinician al recargar; las victorias y premios quedan guardados en este navegador.</p>
      </details>
      <div className="game-leaderboard">
        <p className="game-eyebrow">NUESTROS PEQUEÑOS RÉCORDS</p>
        <h3 className="font-serif text-2xl text-ink">Marcador · {level.title}</h3>
        <p className="mt-1 text-sm text-muted">{DIFFICULTIES[activeDifficulty].label} · mejor resultado de cada sobrenombre en este navegador.</p>
        {leaderboard.length ? <ol className="mt-4 space-y-3">{leaderboard.map((record, index) => (
          <li key={record.id} className="leaderboard-row"><span className="leaderboard-place">{index + 1}</span><div><strong>{record.nickname}</strong><small>{formatTime(record.elapsedSeconds)} · {record.comboCount} combos · {'★'.repeat(record.stars)}</small></div><b>{record.points.toLocaleString('es-MX')} pts</b></li>
        ))}</ol> : <p className="mt-4 text-base text-muted">La primera victoria está por llegar. ♡</p>}
      </div>
    </Section>
  );
}
