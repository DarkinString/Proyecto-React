// Controla un <audio> real. Los estados proceden de sus eventos, no de un temporizador.
export function createGameAmbience(audio, { onStatus, onStart, volume = 55 } = {}) {
  let disposed = false;
  let wanted = false;
  let generation = 0;
  let announced = false;
  let status = 'ready';

  function report(next) {
    status = next;
    if (!disposed) onStatus?.(next);
  }

  function playing() {
    if (disposed || !wanted) { audio.pause(); return; }
    report('playing');
    if (!announced) { announced = true; onStart?.(); }
  }

  function canPlay() {
    if (!wanted && status === 'ready') report('ready');
  }

  function paused() {
    // Ignoramos un evento antiguo de pause si una nueva llamada ya está reproduciendo.
    if (!audio.paused || disposed) return;
    wanted = false;
    generation += 1;
    announced = false;
    report('paused');
  }

  function failed() {
    if (disposed) return;
    wanted = false;
    generation += 1;
    announced = false;
    report('error');
  }

  const listeners = {
    playing, canplay: canPlay, pause: paused, error: failed,
    waiting: () => { if (wanted) report('loading'); },
  };
  for (const [event, listener] of Object.entries(listeners)) audio.addEventListener(event, listener);
  audio.loop = true;
  audio.volume = Math.max(0, Math.min(100, volume)) / 100;

  function startFromGesture() {
    if (disposed) return;
    if (wanted && !audio.paused && status === 'playing') return;
    const token = ++generation;
    wanted = true;
    announced = false;
    audio.muted = false;
    report('loading');
    try {
      // Esta línea se ejecuta dentro del clic. play() informa si el navegador lo acepta.
      const promise = audio.play();
      Promise.resolve(promise).then(() => {
        if (disposed || !wanted) { audio.pause(); return; }
        if (token !== generation) return;
        // «playing» es quien confirma sonido en marcha; resolver play no inventa ese estado.
      }).catch((error) => {
        if (disposed || token !== generation || !wanted) return;
        wanted = false;
        report(error?.name === 'NotAllowedError' ? 'blocked' : 'error');
      });
    } catch (error) {
      wanted = false;
      report(error?.name === 'NotAllowedError' ? 'blocked' : 'error');
    }
  }

  function pause() {
    if (disposed) return;
    wanted = false;
    generation += 1;
    announced = false;
    audio.pause();
    report('paused');
  }

  function setVolume(value) {
    audio.volume = Math.max(0, Math.min(100, Number(value) || 0)) / 100;
  }

  function dispose() {
    if (disposed) return;
    wanted = false;
    disposed = true;
    generation += 1;
    for (const [event, listener] of Object.entries(listeners)) audio.removeEventListener(event, listener);
    audio.pause();
  }

  return { startFromGesture, pause, setVolume, dispose };
}
