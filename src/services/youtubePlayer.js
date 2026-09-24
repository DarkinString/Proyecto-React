import { isSavedTrack } from './youtube.js';

let apiPromise;

export function youtubeEmbedUrl(track, siteOrigin) {
  if (!isSavedTrack({ ...track, label: '' })) throw new Error('Selecciona un video o una playlist válidos.');
  let origin;
  try { origin = new URL(siteOrigin); } catch { throw new Error('Abre la landing desde Vite usando http://localhost:5173 o la dirección que indique la terminal.'); }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password || origin.origin !== siteOrigin) {
    throw new Error('Abre la landing desde un servidor HTTP como Vite, no abriendo index.html como archivo.');
  }
  const url = new URL(`https://www.youtube-nocookie.com/embed/${track.kind === 'video' ? track.id : 'videoseries'}`);
  url.search = new URLSearchParams({ enablejsapi: '1', controls: '1', playsinline: '1', autoplay: '0', origin: origin.origin,
    ...(track.kind === 'playlist' ? { listType: 'playlist', list: track.id } : {}) });
  return url.href;
}

// Una sola descarga compartida; StrictMode puede montar/desmontar componentes dos veces.
export function loadYouTubePlayer() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  const pending = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    let timer;
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      script.onerror = null;
      if (window.onYouTubeIframeAPIReady === ready) window.onYouTubeIframeAPIReady = previousReady;
    };
    const fail = () => {
      if (settled) return;
      settled = true;
      cleanup();
      script.remove();
      reject(new Error('No se pudo cargar el reproductor de YouTube. Revisa tu conexión y vuelve a intentar.'));
    };
    const ready = () => {
      if (settled) return;
      if (!window.YT?.Player) { fail(); return; }
      settled = true;
      cleanup();
      resolve(window.YT);
      // Un callback ajeno no debe convertir nuestra descarga correcta en un rechazo.
      if (typeof previousReady === 'function') previousReady();
    };
    window.onYouTubeIframeAPIReady = ready;
    script.onerror = fail;
    timer = window.setTimeout(fail, 20000);
    document.head.appendChild(script);
  });
  apiPromise = pending;
  pending.catch(() => { if (apiPromise === pending) apiPromise = undefined; });
  return pending;
}

export function playerErrorMessage(code) {
  if (code === 100) return 'Este video fue eliminado o es privado. Elige otro video.';
  if (code === 101 || code === 150) return 'El propietario permite ver este video únicamente en YouTube. Puedes abrirlo allí o elegir otro.';
  if (code === 153) return 'YouTube no pudo identificar el sitio (código 153). Si usas la vista integrada de VS Code, abre la dirección HTTP de Vite en Chrome o Edge. El reproductor necesita que el navegador envíe la referencia de esta página; una clave de búsqueda no resuelve este error.';
  if (code === 2) return 'YouTube no reconoció este video o esta playlist. Revisa el enlace.';
  return 'YouTube no pudo reproducir este contenido. Inténtalo de nuevo o elige otro video.';
}
