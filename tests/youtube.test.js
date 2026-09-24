import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { bookmarkOf, displayTrack, entryKey, fetchMetadata, importPlaylist, isSavedTrack, mergeTracks, normalizeVideo, parseYouTubeUrl, searchTracks, youtubeUrl } from '../src/services/youtube.js';
import { playerErrorMessage } from '../src/services/youtubePlayer.js';

const KEY = 'clave-de-prueba-sin-acceso-real';
const ID = 'Abc123_-xyz';
const ID2 = 'Xyz987_-abc';
const LIST = 'PL_prueba123456789';
const response = (data, status = 200) => new Response(JSON.stringify(data), { status });
const video = (id = ID, extra = {}) => ({ id: { videoId: id }, snippet: { title: 'Amor &amp; cielo', channelTitle: 'Canal de prueba' }, ...extra });

beforeEach((t) => { t.mock.method(globalThis, 'fetch', async () => { throw new Error('Red desactivada durante pruebas.'); }); });

test('acepta formatos de video oficiales y elimina parámetros de seguimiento', () => {
  for (const url of [`https://youtu.be/${ID}?si=tracking`, `https://www.youtube.com/watch?v=${ID}&t=23`, `https://music.youtube.com/watch?v=${ID}`, `https://m.youtube.com/shorts/${ID}`, `https://www.youtube.com/embed/${ID}`]) {
    const entry = parseYouTubeUrl(url);
    assert.deepEqual(entry, { kind: 'video', id: ID });
    assert.equal(youtubeUrl(entry), `https://www.youtube.com/watch?v=${ID}`);
  }
});

test('conserva playlist en enlaces watch y playlist', () => {
  for (const url of [`https://www.youtube.com/playlist?list=${LIST}`, `https://www.youtube.com/watch?v=${ID}&list=${LIST}`]) {
    assert.deepEqual(parseYouTubeUrl(url), { kind: 'playlist', id: LIST });
  }
});

test('rechaza dominios impostores, protocolos y formatos inválidos', () => {
  for (const url of [`https://youtube.com.evil.test/watch?v=${ID}`, `http://youtube.com/watch?v=${ID}`, `https://user:secret@youtube.com/watch?v=${ID}`, `https://youtube.com:8443/watch?v=${ID}`, 'javascript:alert(1)', 'https://youtube.com/watch?v=corto', 'https://youtube.com/channel/12345678910']) {
    assert.throws(() => parseYouTubeUrl(url), Error, url);
  }
});

test('los favoritos guardan solo selección y etiqueta propia, sin metadatos ni claves', () => {
  const normalized = normalizeVideo(video());
  const saved = bookmarkOf({ ...normalized, apiKey: KEY, privateToken: 'no-guardar' }, '  Nuestra canción  ');
  assert.deepEqual(saved, { kind: 'video', id: ID, label: 'Nuestra canción' });
  assert.equal(isSavedTrack(saved), true);
  assert.equal(isSavedTrack({ ...saved, id: '../otra-ruta' }), false);
  assert.equal(isSavedTrack({ ...saved, label: 'x'.repeat(161) }), false);
  assert.equal(normalized.title, 'Amor & cielo');
  assert.equal(displayTrack(saved).title, 'Nuestra canción');
  assert.equal(displayTrack(bookmarkOf(normalized), { [entryKey(normalized)]: normalized }).title, 'Amor & cielo');
});

test('normalizar descarta contenido privado, eliminado y sin permiso de incrustación conocido', () => {
  assert.equal(normalizeVideo(video(ID, { status: { embeddable: false } })), null);
  assert.equal(normalizeVideo(video(ID, { status: { privacyStatus: 'private' } })), null);
  assert.equal(normalizeVideo(video(ID, { snippet: { title: 'Deleted video' } })), null);
  assert.equal(normalizeVideo({ id: '../id', snippet: {} }), null);
  assert.equal(normalizeVideo(null), null);
});

test('mezcla listas sin duplicar y conserva el orden y las etiquetas del usuario', () => {
  const first = bookmarkOf({ kind: 'video', id: ID }, 'Nuestra favorita');
  const second = bookmarkOf({ kind: 'video', id: ID2 });
  assert.deepEqual(mergeTracks([first], [bookmarkOf(first), second, second]), [first, second]);
});

test('sin clave se informa configuración pendiente sin consultar la red', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => { throw new Error('No llamar'); });
  await assert.rejects(searchTracks('amor', undefined, ''), /configura la clave/);
  assert.equal(mock.mock.callCount(), 0);
});

test('búsqueda solicita videos incrustables y maneja texto con caracteres especiales', async (t) => {
  t.mock.method(globalThis, 'fetch', async (input, { signal }) => {
    const url = new URL(input);
    assert.equal(url.origin, 'https://www.googleapis.com');
    assert.equal(url.pathname, '/youtube/v3/search');
    assert.equal(url.searchParams.get('q'), 'piano & amor');
    assert.equal(url.searchParams.get('videoEmbeddable'), 'true');
    assert.equal(url.searchParams.get('type'), 'video');
    assert.equal(url.searchParams.get('key'), KEY);
    assert.ok(signal instanceof AbortSignal);
    return response({ items: [video()] });
  });
  assert.equal((await searchTracks('  piano & amor ', undefined, KEY))[0].id, ID);
});

test('importa todas las páginas, elimina repetidos y descarta privados', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (input) => {
    const url = new URL(input);
    calls += 1;
    assert.equal(url.pathname, '/youtube/v3/playlistItems');
    assert.equal(url.searchParams.get('playlistId'), LIST);
    assert.equal(url.searchParams.get('maxResults'), '50');
    if (calls === 1) return response({ items: [video()], nextPageToken: 'pagina2' });
    assert.equal(url.searchParams.get('pageToken'), 'pagina2');
    return response({ items: [video(), video(ID2), video(ID, { status: { privacyStatus: 'private' } })] });
  });
  const playlist = await importPlaylist(`https://www.youtube.com/playlist?list=${LIST}`, undefined, KEY);
  assert.equal(calls, 2);
  assert.equal(playlist.received, 4);
  assert.deepEqual(playlist.tracks.map((track) => track.id), [ID, ID2]);
});

test('un fallo en una página no presenta ni guarda una importación parcial', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => ++calls === 1
    ? response({ items: [video()], nextPageToken: 'segunda' }) : response({ error: {} }, 503));
  await assert.rejects(importPlaylist(`https://www.youtube.com/playlist?list=${LIST}`, undefined, KEY), /no pudo completar/);
});

test('evita bucles si el proveedor repite un token de paginación', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => response({ items: [video()], nextPageToken: 'repetida' }));
  await assert.rejects(importPlaylist(`https://www.youtube.com/playlist?list=${LIST}`, undefined, KEY), /repitió una página/);
  assert.equal(mock.mock.callCount(), 2);
});

test('distingue cuota agotada, clave rechazada y playlist privada', async (t) => {
  for (const [reason, pattern] of [['quotaExceeded', /agotó la cuota/], ['keyInvalid', /clave esté activa/], ['playlistItemsNotAccessible', /playlist no está disponible/]]) {
    t.mock.method(globalThis, 'fetch', async () => response({ error: { errors: [{ reason }] } }, 403));
    await assert.rejects(searchTracks('amor', undefined, KEY), pattern);
  }
});

test('respuesta malformada no se presenta como resultados vacíos', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => response({ message: 'no items' }));
  await assert.rejects(searchTracks('amor', undefined, KEY), /no pudimos leer/);
});

test('cancelar conserva el motivo de cancelación y aborta fetch', async (t) => {
  t.mock.method(globalThis, 'fetch', async (input, { signal }) => new Promise((resolve, reject) => {
    if (signal.aborted) reject(signal.reason);
    else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }));
  const controller = new AbortController();
  const pending = searchTracks('amor', controller.signal, KEY);
  controller.abort();
  await assert.rejects(pending, (error) => error === controller.signal.reason);
});

test('recupera títulos actuales de favoritos sin modificar su etiqueta local', async (t) => {
  t.mock.method(globalThis, 'fetch', async (input) => {
    const url = new URL(input);
    assert.equal(url.pathname, '/youtube/v3/videos');
    assert.equal(url.searchParams.get('id'), ID);
    return response({ items: [video()] });
  });
  const saved = bookmarkOf({ kind: 'video', id: ID }, 'Mi etiqueta');
  const metadata = await fetchMetadata([saved], undefined, KEY);
  assert.equal(metadata[0].title, 'Amor & cielo');
  assert.equal(saved.label, 'Mi etiqueta');
});

test('errores del reproductor explican permiso, privacidad e identificación de origen', () => {
  assert.match(playerErrorMessage(101), /únicamente en YouTube/);
  assert.match(playerErrorMessage(150), /únicamente en YouTube/);
  assert.match(playerErrorMessage(100), /eliminado o es privado/);
  assert.match(playerErrorMessage(153), /VS Code.*HTTP de Vite.*Chrome o Edge/);
});
