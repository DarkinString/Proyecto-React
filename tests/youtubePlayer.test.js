import test from 'node:test';
import assert from 'node:assert/strict';
import { youtubeEmbedUrl } from '../src/services/youtubePlayer.js';

test('el iframe usa privacidad mejorada, origen real, controles y selección sin pedir clave de datos', () => {
  const url = new URL(youtubeEmbedUrl({ kind: 'video', id: 'Abc123_-xyz' }, 'http://localhost:5173'));
  assert.equal(url.origin, 'https://www.youtube-nocookie.com');
  assert.equal(url.pathname, '/embed/Abc123_-xyz');
  assert.equal(url.searchParams.get('origin'), 'http://localhost:5173');
  assert.equal(url.searchParams.get('enablejsapi'), '1');
  assert.equal(url.searchParams.get('controls'), '1');
  assert.equal(url.searchParams.get('autoplay'), '0');
  assert.equal(url.searchParams.has('key'), false);
});

test('la selección de playlist se conserva en el src inicial del iframe', () => {
  const url = new URL(youtubeEmbedUrl({ kind: 'playlist', id: 'PL_prueba123456789' }, 'https://ejemplo.test'));
  assert.equal(url.pathname, '/embed/videoseries');
  assert.equal(url.searchParams.get('list'), 'PL_prueba123456789');
  assert.equal(url.searchParams.get('listType'), 'playlist');
});

test('rechaza abrir desde archivo, un origen ficticio o identificadores inválidos', () => {
  for (const origin of ['null', 'file:///C:/landing/index.html', 'javascript:alert(1)', 'https://user:secret@ejemplo.test', 'https://ejemplo.test/otra-ruta']) {
    assert.throws(() => youtubeEmbedUrl({ kind: 'video', id: 'Abc123_-xyz' }, origin), /Vite|servidor HTTP/);
  }
  assert.throws(() => youtubeEmbedUrl({ kind: 'video', id: '../otro' }, 'https://ejemplo.test'), /válidos/);
});

function browserMock(t) {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const scripts = [];
  const timers = [];
  const fakeWindow = { setTimeout: (callback) => { timers.push(callback); return 0; } };
  const fakeDocument = {
    createElement: (tag) => ({ tagName: tag, removed: false, remove() { this.removed = true; } }),
    head: { appendChild: (script) => scripts.push(script) },
  };
  Object.defineProperty(globalThis, 'window', { value: fakeWindow, configurable: true });
  Object.defineProperty(globalThis, 'document', { value: fakeDocument, configurable: true });
  t.after(() => {
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow); else delete globalThis.window;
    if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument); else delete globalThis.document;
  });
  return { fakeWindow, scripts, timers };
}

test('montajes concurrentes comparten descarga y callback global de la API', async (t) => {
  const { fakeWindow, scripts } = browserMock(t);
  const { loadYouTubePlayer } = await import('../src/services/youtubePlayer.js?test=concurrent');
  let previousCalled = 0;
  const previous = () => { previousCalled += 1; };
  fakeWindow.onYouTubeIframeAPIReady = previous;
  const first = loadYouTubePlayer();
  const second = loadYouTubePlayer();
  assert.equal(first, second);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, 'https://www.youtube.com/iframe_api');
  fakeWindow.YT = { Player: class {} };
  fakeWindow.onYouTubeIframeAPIReady();
  assert.equal(await first, fakeWindow.YT);
  assert.equal(await second, fakeWindow.YT);
  assert.equal(previousCalled, 1);
  assert.equal(fakeWindow.onYouTubeIframeAPIReady, previous);
});

test('un fallo de descarga limpia su script y permite un reintento real', async (t) => {
  const { fakeWindow, scripts } = browserMock(t);
  const { loadYouTubePlayer } = await import('../src/services/youtubePlayer.js?test=retry');
  const first = loadYouTubePlayer();
  scripts[0].onerror();
  await assert.rejects(first, /No se pudo cargar/);
  assert.equal(scripts[0].removed, true);
  const next = loadYouTubePlayer();
  assert.notEqual(next, first);
  assert.equal(scripts.length, 2);
  fakeWindow.YT = { Player: class {} };
  fakeWindow.onYouTubeIframeAPIReady();
  assert.equal(await next, fakeWindow.YT);
});

test('el timeout de API devuelve error y no deja una promesa bloqueada para siempre', async (t) => {
  const { scripts, timers } = browserMock(t);
  const { loadYouTubePlayer } = await import('../src/services/youtubePlayer.js?test=timeout');
  const pending = loadYouTubePlayer();
  timers[0]();
  await assert.rejects(pending, /No se pudo cargar/);
  assert.equal(scripts[0].removed, true);
  const retry = loadYouTubePlayer();
  assert.equal(scripts.length, 2);
  scripts[1].onerror();
  await assert.rejects(retry);
});
