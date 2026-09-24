import { useEffect, useRef, useState } from 'react';
import Section from '../../components/ui/Section.jsx';
import useStoredCollection from '../../hooks/useStoredCollection.js';
import scrollToSection from '../../utils/scrollToSection.js';
import { bookmarkOf, displayTrack, entryKey, fetchMetadata, hasYouTubeKey, importPlaylist, isSavedTrack, mergeTracks, searchTracks, YOUTUBE_STORAGE_KEY } from '../../services/youtube.js';
import { classifyMusicInput, youtubeSearchUrl } from './musicInput.js';
import MusicPlayer from './MusicPlayer.jsx';
import TrackList from './TrackList.jsx';
import './music.css';

export default function MusicSection() {
  const { items: bookmarks, updateItems, storageError } = useStoredCollection(YOUTUBE_STORAGE_KEY, isSavedTrack);
  const [metadata, setMetadata] = useState({});
  const [metadataError, setMetadataError] = useState('');
  const [input, setInput] = useState('');
  const [label, setLabel] = useState('');
  const [results, setResults] = useState([]);
  const [searchedTerm, setSearchedTerm] = useState('');
  const [externalSearch, setExternalSearch] = useState('');
  const [busy, setBusy] = useState(null);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playRequest, setPlayRequest] = useState(0);
  const requestController = useRef(null);
  const selection = classifyMusicInput(input);
  const isLink = selection.kind === 'video' || selection.kind === 'playlist';
  const savedTracks = bookmarks.map((bookmark) => displayTrack(bookmark, metadata));
  const savedIds = new Set(bookmarks.map(entryKey));
  const currentKey = currentTrack ? entryKey(currentTrack) : '';
  const currentIndex = savedTracks.findIndex((track) => entryKey(track) === currentKey);
  const hasNext = currentIndex >= 0 && currentIndex < savedTracks.length - 1;
  const hasPrevious = currentIndex > 0;

  function rememberMetadata(tracks) {
    setMetadata((current) => ({ ...current, ...Object.fromEntries(tracks.map((track) => [entryKey(track), track])) }));
  }

  useEffect(() => {
    if (!hasYouTubeKey || bookmarks.length === 0) return;
    const controller = new AbortController();
    setMetadataError('');
    fetchMetadata(bookmarks, controller.signal).then((tracks) => {
      if (!controller.signal.aborted) rememberMetadata(tracks);
    }).catch((error) => {
      if (!controller.signal.aborted) setMetadataError(`${error.message} Tus enlaces guardados siguen disponibles.`);
    });
    return () => controller.abort();
  }, [bookmarks]);

  useEffect(() => () => requestController.current?.abort(), []);

  function stopRequest() {
    requestController.current?.abort();
    requestController.current = null;
    setBusy(null);
  }

  function editInput(value) {
    stopRequest();
    setInput(value);
    setResults([]);
    setSearchedTerm('');
    setExternalSearch('');
    setFormError('');
    setNotice('');
  }

  function startRequest(kind) {
    stopRequest();
    const controller = new AbortController();
    requestController.current = controller;
    setBusy(kind);
    setFormError('');
    setNotice('');
    return controller;
  }

  function play(track, scroll = true) {
    setCurrentTrack(track);
    setPlayRequest((request) => request + 1);
    if (scroll && !document.querySelector('.youtube-player--floating')) scrollToSection('youtube-player');
  }

  function saveTrack(track, ownLabel = '') {
    const bookmark = bookmarkOf(track, ownLabel);
    if (savedIds.has(entryKey(bookmark))) { setNotice('Este enlace ya está en nuestra lista.'); return false; }
    const saved = updateItems((current) => mergeTracks(current, [bookmark]));
    if (saved) setNotice(`«${displayTrack(bookmark, metadata).title}» quedó en nuestra lista.`);
    return saved;
  }

  function removeTrack(key) {
    if (updateItems((current) => current.filter((track) => entryKey(track) !== key))) setNotice('Enlace quitado de nuestra lista local.');
  }

  async function search(term) {
    const externalUrl = youtubeSearchUrl(term);
    setResults([]);
    setSearchedTerm('');
    if (!hasYouTubeKey) {
      stopRequest();
      setExternalSearch(externalUrl);
      setNotice('Busca en YouTube y pega aquí el enlace para escucharlo juntos.');
      // Ocurre directamente durante el envío del formulario, antes de esperar cualquier promesa.
      window.open(externalUrl, '_blank', 'noopener');
      return;
    }
    setExternalSearch('');
    const controller = startRequest('search');
    try {
      const tracks = await searchTracks(term, controller.signal);
      if (controller.signal.aborted) return;
      rememberMetadata(tracks);
      setResults(tracks);
      setSearchedTerm(term);
    } catch (error) {
      if (!controller.signal.aborted) setFormError(error.message);
    } finally {
      if (requestController.current === controller) { requestController.current = null; setBusy(null); }
    }
  }

  async function importSongs(url) {
    const controller = startRequest('import');
    try {
      const playlist = await importPlaylist(url, controller.signal);
      if (controller.signal.aborted) return;
      if (!playlist.tracks.length) throw new Error('Esta playlist no tiene videos públicos disponibles para importar.');
      let added = 0;
      const saved = updateItems((current) => {
        const merged = mergeTracks(current, playlist.tracks.map((track) => bookmarkOf(track)));
        added = merged.length - current.length;
        return merged;
      });
      if (saved) {
        rememberMetadata(playlist.tracks);
        const omitted = playlist.received - playlist.tracks.length;
        setNotice(`${added} videos nuevos agregados.${omitted ? ` Se omitieron ${omitted} elementos repetidos o no disponibles.` : ''} La reproducción depende de los permisos de cada video.`);
      }
    } catch (error) {
      if (!controller.signal.aborted) setFormError(error.message);
    } finally {
      if (requestController.current === controller) { requestController.current = null; setBusy(null); }
    }
  }

  async function submitMusic(event) {
    event.preventDefault();
    setFormError('');
    setNotice('');
    const chosen = classifyMusicInput(input);
    try {
      if (chosen.kind === 'empty') throw new Error('Escribe una canción, un artista o pega un enlace de YouTube.');
      if (chosen.kind === 'invalid') throw new Error(chosen.error);
      if (chosen.kind === 'query') { await search(chosen.value); return; }
      const action = event.nativeEvent.submitter?.value || 'play';
      if (action === 'import' && chosen.kind === 'playlist' && hasYouTubeKey) {
        await importSongs(chosen.value);
        return;
      }
      stopRequest();
      const track = displayTrack(bookmarkOf(chosen, label), metadata);
      if (action === 'save') {
        if (saveTrack(track, label)) { setInput(''); setLabel(''); }
      } else play(track);
    } catch (error) { setFormError(error.message); }
  }

  return (
    <Section id="musica" number="03" title="Lo nuestro suena a…">
      <p className="mb-6">Nuestra canción puede empezar con un nombre, un artista o un enlace.</p>
      <MusicPlayer track={currentTrack} playRequest={playRequest} hasNext={hasNext} hasPrevious={hasPrevious}
        onNext={() => { if (hasNext) play(savedTracks[currentIndex + 1], false); }}
        onPrevious={() => { if (hasPrevious) play(savedTracks[currentIndex - 1], false); }} />

      <form onSubmit={submitMusic} className="mt-8">
        <label htmlFor="music-input" className="block text-base font-semibold text-ink">¿Qué escuchamos juntos?</label>
        <p id="music-input-help" className="mt-1 text-sm text-muted">Escribe una canción o artista, o pega un enlace de video o playlist de YouTube.</p>
        <input id="music-input" className="field mt-3 w-full" value={input} onChange={(event) => editInput(event.target.value)}
          type="text" maxLength={2000} required autoComplete="off" aria-describedby="music-input-help music-input-context"
          placeholder="Canción, artista o enlace de YouTube" />
        <p id="music-input-context" className="mt-2 text-sm text-muted">
          {isLink ? selection.kind === 'playlist' ? 'Playlist lista para escuchar o guardar completa.' : 'Video listo para escuchar o guardar.'
            : !hasYouTubeKey ? 'Busca en YouTube y pega aquí el enlace.' : 'Busca aquí y elige tu próximo recuerdo.'}
        </p>
        {isLink && <details className="mt-3 text-sm text-muted">
          <summary className="cursor-pointer text-accent">Ponerle un nombre especial (opcional)</summary>
          <label htmlFor="music-label" className="mt-3 block">Nombre para este recuerdo</label>
          <input id="music-label" className="field mt-2 w-full" value={label} onChange={(event) => setLabel(event.target.value)} maxLength={160} placeholder="Por ejemplo: nuestra canción del viaje" />
        </details>}
        <div className="mt-4 flex flex-wrap gap-3">
          {isLink ? <>
            <button type="submit" name="action" value="play" className="button-primary" disabled={Boolean(busy)}>Escuchar {selection.kind === 'playlist' ? 'playlist' : 'canción'}</button>
            <button type="submit" name="action" value="save" className="button-secondary" disabled={Boolean(busy)}>Guardar en nuestra lista</button>
            {selection.kind === 'playlist' && hasYouTubeKey && <button type="submit" name="action" value="import" className="button-secondary" disabled={Boolean(busy)}>{busy === 'import' ? 'Importando…' : 'Importar sus canciones'}</button>}
          </> : <button type="submit" name="action" value="search" className="button-primary" disabled={Boolean(busy)}>{busy === 'search' ? 'Buscando…' : hasYouTubeKey ? 'Buscar' : 'Buscar en YouTube ↗'}</button>}
          {busy && <button type="button" className="button-secondary" onClick={() => {
            const wasImport = busy === 'import';
            stopRequest();
            setNotice(wasImport ? 'Importación cancelada. Nuestra lista sigue igual.' : 'Búsqueda cancelada.');
          }}>Cancelar</button>}
        </div>
      </form>
      {formError && <p role="alert" className="mt-3 text-sm text-danger">{formError}</p>}
      <p role="status" className="mt-3 text-sm text-muted">{busy === 'search' ? 'Consultando YouTube…' : busy === 'import' ? 'Leyendo todas las canciones de la playlist…'
        : searchedTerm ? `${results.length} videos encontrados para «${searchedTerm}».` : ''}</p>
      {externalSearch && <p className="mt-3 text-sm text-muted">Si la búsqueda no se abrió, <a href={externalSearch} target="_blank" rel="noopener" className="text-accent underline">ábrela aquí en YouTube ↗</a>.</p>}
      <TrackList tracks={results} savedIds={savedIds} currentKey={currentKey} onPlay={play} onAdd={saveTrack} />
      <p role="status" className="mt-3 text-sm text-accent">{notice}</p>
      {storageError && <p role="alert" className="mt-3 text-sm text-danger">{storageError}</p>}

      <div className="mt-8 border-t border-line/70 pt-6">
        <h3 className="font-serif text-2xl text-ink">Nuestra lista para escuchar</h3>
        <p className="mt-2 text-sm text-muted">Guardada en este navegador. {savedTracks.length} {savedTracks.length === 1 ? 'enlace' : 'enlaces'}.</p>
        {savedTracks.length === 0 && <p className="mt-3 text-base text-muted">Todavía está vacía. La primera canción la elegimos nosotros.</p>}
        <TrackList tracks={savedTracks} currentKey={currentKey} onPlay={play} onRemove={removeTrack} />
        {metadataError && <p role="status" className="mt-3 text-sm text-muted">{metadataError}</p>}
      </div>
      <details className="mt-6 text-sm text-muted">
        <summary className="cursor-pointer">Sobre la música y tu privacidad</summary>
        <p className="mt-2">La música continúa al recorrer las secciones; puedes pausar desde el video. YouTube mantiene sus controles y la disponibilidad de cada video.</p>
        <p className="mt-2">Guardamos tus enlaces y nombres en este navegador. Quitar un enlace aquí no cambia tu cuenta de YouTube. Al buscar en una nueva pestaña o abrir el reproductor, YouTube recibe datos de conexión según su <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-accent underline">política de privacidad</a>. Se aplican los <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener" className="text-accent underline">términos de YouTube</a>.</p>
      </details>
    </Section>
  );
}
