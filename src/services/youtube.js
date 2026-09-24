const API_BASE = 'https://www.googleapis.com/youtube/v3/';
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,150}$/;
const configuredKey = import.meta.env?.VITE_YOUTUBE_API_KEY?.trim() || '';

export const hasYouTubeKey = Boolean(configuredKey);
export const YOUTUBE_STORAGE_KEY = 'mirukaleta.youtube.v1';
export const entryKey = (entry) => `${entry.kind}:${entry.id}`;

export function parseYouTubeUrl(value) {
  let url;
  try { url = new URL(value.trim()); } catch { throw new Error('Pega un enlace completo de YouTube.'); }
  const hosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'];
  if (url.protocol !== 'https:' || !hosts.includes(url.hostname) || url.username || url.password || url.port) {
    throw new Error('Usa un enlace HTTPS de youtube.com o youtu.be.');
  }
  const parts = url.pathname.split('/').filter(Boolean);
  const videoId = url.hostname === 'youtu.be' ? parts[0]
    : url.pathname === '/watch' ? url.searchParams.get('v')
      : ['shorts', 'embed', 'live'].includes(parts[0]) ? parts[1] : null;
  const playlistId = url.searchParams.get('list');
  if (playlistId && PLAYLIST_ID.test(playlistId)) return { kind: 'playlist', id: playlistId };
  if (videoId && VIDEO_ID.test(videoId)) return { kind: 'video', id: videoId };
  throw new Error('El enlace no contiene un video o una playlist de YouTube válidos.');
}

export function isSavedTrack(track) {
  return Boolean(track && (track.kind === 'video' ? VIDEO_ID.test(track.id) : track.kind === 'playlist' && PLAYLIST_ID.test(track.id))
    && typeof track.id === 'string' && typeof track.label === 'string' && track.label.length <= 160);
}

export function bookmarkOf(track, label = '') {
  const bookmark = { kind: track.kind, id: track.id, label: label.trim().slice(0, 160) };
  if (!isSavedTrack(bookmark)) throw new Error('No se pudo guardar este enlace de YouTube.');
  return bookmark;
}

export function youtubeUrl(track) {
  if (!isSavedTrack({ ...track, label: '' })) throw new Error('Enlace de YouTube inválido.');
  return track.kind === 'playlist' ? `https://www.youtube.com/playlist?list=${track.id}` : `https://www.youtube.com/watch?v=${track.id}`;
}

function decodeTitle(value) {
  return String(value || '').replace(/&(amp|quot|apos|lt|gt|#39|#x27);/gi, (entity) => ({
    '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&#39;': "'", '&#x27;': "'",
  })[entity.toLowerCase()] || entity).slice(0, 300);
}

export function normalizeVideo(item) {
  const id = item?.snippet?.resourceId?.videoId || item?.id?.videoId || item?.id;
  const snippet = item?.snippet;
  if (typeof id !== 'string' || !VIDEO_ID.test(id) || !snippet
    || item.status?.privacyStatus === 'private' || item.status?.embeddable === false
    || ['Deleted video', 'Private video'].includes(snippet.title)) return null;
  return { kind: 'video', id, title: decodeTitle(snippet.title) || 'Video de YouTube', artist: decodeTitle(snippet.videoOwnerChannelTitle || snippet.channelTitle) };
}

export function displayTrack(bookmark, metadata = {}) {
  const details = metadata[entryKey(bookmark)];
  return { ...bookmark, title: bookmark.label || details?.title || `${bookmark.kind === 'playlist' ? 'Playlist' : 'Video'} de YouTube · ${bookmark.id}`, artist: details?.artist || 'YouTube' };
}

export function mergeTracks(current, incoming) {
  const unique = new Map(current.map((track) => [entryKey(track), track]));
  incoming.forEach((track) => { if (!unique.has(entryKey(track))) unique.set(entryKey(track), track); });
  return [...unique.values()];
}

async function request(path, params, signal, apiKey = configuredKey) {
  if (!apiKey) throw new Error('Para buscar o importar canciones configura la clave de YouTube. Mientras tanto puedes pegar y reproducir enlaces.');
  const url = new URL(path, API_BASE);
  url.search = new URLSearchParams({ ...params, key: apiKey });
  const timeout = AbortSignal.timeout(15000);
  let response;
  try {
    response = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(timeout.aborted ? 'YouTube tardó demasiado. Inténtalo de nuevo.' : 'No se pudo conectar con YouTube. Revisa tu conexión.');
  }
  let result;
  try { result = await response.json(); } catch { throw new Error('YouTube devolvió una respuesta que no pudimos leer.'); }
  if (!response.ok) {
    const reason = result?.error?.errors?.[0]?.reason;
    if (['quotaExceeded', 'dailyLimitExceeded'].includes(reason) || response.status === 429) throw new Error('Se agotó la cuota de consultas de YouTube. Puedes seguir reproduciendo enlaces y volver a buscar cuando se restablezca.');
    if (['playlistNotFound', 'playlistItemsNotAccessible', 'playlistOperationUnsupported'].includes(reason) || response.status === 404) throw new Error('Esta playlist no está disponible. Prueba una playlist pública; las listas privadas y «Ver más tarde» no se pueden importar aquí.');
    if (response.status === 400 || response.status === 403) throw new Error('YouTube rechazó la consulta. Revisa que la clave esté activa, YouTube Data API v3 esté habilitada y este dominio esté autorizado.');
    throw new Error('YouTube no pudo completar la consulta. Inténtalo de nuevo.');
  }
  if (!result || !Array.isArray(result.items)) throw new Error('YouTube devolvió una respuesta que no pudimos leer.');
  return result;
}

export async function searchTracks(query, signal, apiKey) {
  const term = query.trim();
  if (term.length < 2) throw new Error('Escribe al menos dos letras para buscar.');
  const result = await request('search', { part: 'snippet', type: 'video', videoEmbeddable: 'true', videoSyndicated: 'true', maxResults: '20', q: term }, signal, apiKey);
  return result.items.map(normalizeVideo).filter(Boolean);
}

export async function importPlaylist(value, signal, apiKey) {
  const playlist = parseYouTubeUrl(value);
  if (playlist.kind !== 'playlist') throw new Error('Pega un enlace que incluya una playlist de YouTube.');
  let pageToken = '';
  let received = 0;
  let tracks = [];
  const visitedTokens = new Set();
  do {
    signal?.throwIfAborted();
    if (visitedTokens.has(pageToken)) throw new Error('YouTube repitió una página de la playlist. No se guardaron resultados parciales.');
    visitedTokens.add(pageToken);
    const page = await request('playlistItems', { part: 'snippet,status', playlistId: playlist.id, maxResults: '50', ...(pageToken ? { pageToken } : {}) }, signal, apiKey);
    received += page.items.length;
    tracks = mergeTracks(tracks, page.items.map(normalizeVideo).filter(Boolean));
    pageToken = page.nextPageToken || '';
    if (typeof pageToken !== 'string') throw new Error('No se pudo leer la siguiente página de la playlist.');
  } while (pageToken);
  return { tracks, received };
}

export async function fetchMetadata(bookmarks, signal, apiKey) {
  const details = [];
  for (const kind of ['video', 'playlist']) {
    const ids = [...new Set(bookmarks.filter((item) => item.kind === kind).map((item) => item.id))];
    for (let index = 0; index < ids.length; index += 50) {
      const page = await request(kind === 'video' ? 'videos' : 'playlists', { part: 'snippet', id: ids.slice(index, index + 50).join(','), maxResults: '50' }, signal, apiKey);
      details.push(...page.items.map((item) => kind === 'video' ? normalizeVideo(item)
        : typeof item?.id === 'string' && PLAYLIST_ID.test(item.id) && item.snippet
          ? { kind, id: item.id, title: decodeTitle(item.snippet.title), artist: decodeTitle(item.snippet.channelTitle) } : null).filter(Boolean));
    }
  }
  return details;
}
