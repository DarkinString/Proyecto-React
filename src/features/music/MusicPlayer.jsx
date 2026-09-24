import { useEffect, useRef, useState } from 'react';
import { loadYouTubePlayer, playerErrorMessage, youtubeEmbedUrl } from '../../services/youtubePlayer.js';
import { youtubeUrl } from '../../services/youtube.js';
import useFloatingDrag from '../../hooks/useFloatingDrag.js';

export default function MusicPlayer({ track, playRequest, onNext, onPrevious, hasNext, hasPrevious }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const playerReadyRef = useRef(false);
  const trackRef = useRef(track);
  const nextRef = useRef(onNext);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [floating, setFloating] = useState(false);
  const [retry, setRetry] = useState(0);
  const drag = useFloatingDrag({ enabled: Boolean(track), holdDelay: 2000,
    onDragStart: () => setFloating(true), onReset: () => setFloating(false) });
  trackRef.current = track;
  nextRef.current = onNext;
  const hasTrack = Boolean(track);
  const embeddedView = window.self !== window.top;

  useEffect(() => {
    if (!hasTrack) return;
    let cancelled = false;
    let player;
    let readyTimer;
    let contentError = false;
    let mount;
    playerReadyRef.current = false;
    setReady(false);
    setError('');
    setNotice('Preparando el reproductor de YouTube…');
    loadYouTubePlayer().then((YT) => {
      if (cancelled || !hostRef.current) return;
      const initialTrack = trackRef.current;
      const embedUrl = new URL(youtubeEmbedUrl(initialTrack, window.location.origin));
      mount = document.createElement('div');
      hostRef.current.replaceChildren(mount);
      readyTimer = window.setTimeout(() => {
        if (cancelled) return;
        setError('El reproductor de YouTube no respondió a tiempo. Reintenta o abre la landing desde Vite en tu navegador habitual. También puedes abrir este contenido en YouTube.');
        setNotice('');
      }, 20000);
      player = new YT.Player(mount, {
        host: embedUrl.origin,
        width: '100%', height: '100%',
        ...(initialTrack.kind === 'video' ? { videoId: initialTrack.id } : {}),
        playerVars: Object.fromEntries(embedUrl.searchParams),
        events: {
          onReady: ({ target }) => {
            if (cancelled) return;
            clearTimeout(readyTimer);
            playerRef.current = target;
            playerReadyRef.current = true;
            setReady(true);
            target.getIframe().setAttribute('title', 'Reproductor oficial de YouTube');
            
            if (!contentError) {
              setError('');
              setNotice('Pulsa ▶ dentro del video si tu navegador solicita un toque para escuchar.');
              target.playVideo();
            }
          },
          onStateChange: ({ data }) => {
            if (cancelled) return;
            if (data === 1) {
              contentError = false;
              setError('');
              setNotice('');
              window.dispatchEvent(new CustomEvent('mirukaleta:audio-start', { detail: { source: 'youtube' } }));
            }
            if (data === 0 && initialTrack.kind === 'video') nextRef.current?.();
          },
          onError: ({ data }) => {
            if (cancelled) return;
            contentError = true;
            clearTimeout(readyTimer);
            setError(`${playerErrorMessage(data)}${data !== 153 ? ` (Código ${data})` : ''}`);
            setNotice('');
          },
          onAutoplayBlocked: () => {
            if (!cancelled && !contentError) setNotice('Tu navegador requiere un toque: pulsa ▶ dentro del video para escuchar.');
          },
        },
      });
      playerRef.current = player;
    }).catch((failure) => {
      if (!cancelled) { clearTimeout(readyTimer); setError(failure.message); setNotice(''); }
    });
    return () => {
      cancelled = true;
      clearTimeout(readyTimer);
      playerReadyRef.current = false;
      playerRef.current = null;
      try { player?.destroy(); } catch {  }
      mount?.remove();
    };
  
  }, [hasTrack, retry, track?.kind, track?.id]);

  useEffect(() => {
    if (playerReadyRef.current) playerRef.current?.playVideo();
  }, [playRequest]);

  useEffect(() => {
    const pauseForGame = (event) => {
      if (event.detail?.source === 'game' && playerReadyRef.current) {
        playerRef.current?.pauseVideo();
        setNotice('YouTube está en pausa mientras escuchas la música del juego.');
      }
    };
    window.addEventListener('mirukaleta:audio-start', pauseForGame);
    return () => window.removeEventListener('mirukaleta:audio-start', pauseForGame);
  }, []);

  function previous() {
    if (track?.kind === 'playlist') playerRef.current?.previousVideo();
    else onPrevious();
  }

  function next() {
    if (track?.kind === 'playlist') playerRef.current?.nextVideo();
    else onNext();
  }

  return (
    <div id="youtube-player" className={`youtube-player-space ${floating && track ? 'youtube-player-space--floating' : ''}`}>
      <div ref={drag.ref} style={floating ? drag.style : undefined} data-dragging={drag.dragging ? 'true' : undefined}
        data-holding={drag.holding ? 'true' : undefined} {...drag.handleProps}
        tabIndex={track ? 0 : undefined} aria-label="Nuestro reproductor de YouTube" aria-describedby={track ? 'youtube-drag-help' : undefined}
        className={`surface-panel youtube-player rounded-3xl p-4 sm:p-5 ${floating && track ? 'youtube-player--floating' : ''}`}>
        <div className="youtube-player-title flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs tracking-widest text-accent">NUESTRO REPRODUCTOR · YOUTUBE</p>
          {track && floating && <button type="button" className="youtube-float-toggle" onClick={(event) => {
            event.currentTarget.closest('.youtube-player').focus({ preventScroll: true });
            drag.reset();
          }}>Volver a la sección</button>}
        </div>
        {embeddedView && <p className="mt-3 text-sm text-muted">
          Esta página está dentro de una vista integrada. Si YouTube no carga, abre la dirección de Vite en Chrome o Edge.{' '}
          <a href={window.location.href} target="_blank" rel="noopener" className="text-accent underline">Abrir esta página en el navegador ↗</a>
        </p>}
        {track ? <>
          <p id="youtube-drag-help" className="youtube-drag-help mt-2">
            {drag.dragging ? 'Ya puedes moverlo. Suelta para dejarlo aquí.' : drag.holding ? 'Sigue presionando…' : 'Mantén 2 segundos sobre el título o el marco y arrastra.'}
            <span className="sr-only">También puedes enfocar este marco y usar las flechas. Escape lo devuelve a su sección.</span>
          </p>
          <h3 className="mt-3 break-words text-base font-semibold text-ink">{track.title}</h3>
          <div className="youtube-frame mt-3"><div ref={hostRef} className="youtube-frame-host" /></div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="button-secondary" disabled={!ready || (track.kind !== 'playlist' && !hasPrevious)} onClick={previous}>Anterior</button>
            <button type="button" className="button-secondary" disabled={!ready || (track.kind !== 'playlist' && !hasNext)} onClick={next}>Siguiente</button>
            <a href={youtubeUrl(track)} target="_blank" rel="noopener" className="text-sm text-accent underline">Abrir en YouTube ↗</a>
          </div>
          <p role="status" className="mt-2 text-sm text-muted">{notice}</p>
          {error && <div className="mt-3"><p role="alert" className="text-sm text-danger">{error}</p><button type="button" className="button-secondary mt-2" onClick={() => setRetry((value) => value + 1)}>Reintentar reproductor</button></div>}
        </> : <p className="mt-3 text-base leading-7 text-muted">Elige un video o una playlist para empezar. Puedes llevar el reproductor visible contigo mientras recorres nuestros recuerdos.</p>}
      </div>
    </div>
  );
}
