import './game-ambience.css';
import ambienceTrack from '../../assets/audio/un-ratito-contigo.wav';

export default function GameAmbience({ ambience, phase }) {
  const { audioRef, enabled, volume, status, yieldedToMusic, previewing, toggle, listen, changeVolume } = ambience;
  const failed = status === 'blocked' || status === 'error';
  let description = 'Comenzará contigo al jugar.';
  if (status === 'playing' && previewing) description = 'Escuchando: piano suave y campanillas. ♡';
  else if (yieldedToMusic) description = 'YouTube está sonando. La melodía volverá al comenzar otra partida.';
  else if (!enabled) description = 'Podemos jugar en silencio. ♡';
  else if (failed) description = status === 'blocked' ? 'Pulsa activar para permitir el sonido.' : 'No pudimos cargar la melodía. Puedes volver a intentarlo.';
  else if (phase === 'playing') description = volume === 0 ? 'Volumen en cero.' : status === 'playing' ? 'Una melodía suave para acompañarte.' : 'Preparando nuestra melodía…';
  else if (phase === 'paused') description = 'Descansa contigo mientras la partida está en pausa.';
  else if (phase === 'won' || phase === 'lost') description = 'La melodía espera nuestra siguiente partida.';

  return (
    <div className="game-ambience" aria-label="Música ambiental del juego" data-audio-status={status}>
      <audio ref={audioRef} src={ambienceTrack} loop preload="metadata" aria-label="Melodía Un ratito contigo" />
      <div className="game-ambience-title">
        <span aria-hidden="true" className="game-ambience-note">♫</span>
        <div><strong>Un ratito contigo</strong><p role="status">{description}</p></div>
      </div>
      <div className="game-ambience-controls">
        {phase === 'setup' && <button type="button" className="button-primary" onClick={listen}>
          {previewing && status === 'playing' ? 'Detener muestra' : 'Escuchar melodía ♫'}
        </button>}
        <button type="button" className="button-secondary" onClick={toggle} aria-pressed={enabled}>
          {enabled && !failed && !yieldedToMusic ? 'Silenciar melodía' : 'Activar melodía'}
        </button>
        <label className="game-ambience-volume" htmlFor="game-ambience-volume">
          <span>Volumen <output>{volume}%</output></span>
          <input id="game-ambience-volume" type="range" min="0" max="100" step="1" value={volume}
            aria-valuetext={`${volume} por ciento`} onChange={(event) => changeVolume(event.target.value)} />
        </label>
      </div>
    </div>
  );
}
