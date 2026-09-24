import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyMusicInput, youtubeSearchUrl } from '../src/features/music/musicInput.js';

test('distingue vacío y títulos de canciones, incluidos acentos, signos y dos puntos', () => {
  assert.deepEqual(classifyMusicInput('  '), { kind: 'empty', value: '' });
  for (const title of ['Canción para ti', 'Amor: contigo', 'Él & ella', '¿Y si fuera ella?']) {
    assert.deepEqual(classifyMusicInput(`  ${title}  `), { kind: 'query', value: title });
  }
});

test('reconoce videos y playlists con sus enlaces originales sin alterar la selección', () => {
  const video = classifyMusicInput('https://youtu.be/Abc123_-xyz?si=compartido');
  assert.equal(video.kind, 'video');
  assert.equal(video.id, 'Abc123_-xyz');
  const playlist = classifyMusicInput('https://www.youtube.com/watch?v=Abc123_-xyz&list=PL_prueba123456789');
  assert.equal(playlist.kind, 'playlist');
  assert.equal(playlist.id, 'PL_prueba123456789');
});

test('admite enlaces habituales pegados sin https al principio', () => {
  for (const url of ['youtu.be/Abc123_-xyz', 'www.youtube.com/watch?v=Abc123_-xyz', 'music.youtube.com/watch?v=Abc123_-xyz']) {
    const parsed = classifyMusicInput(url);
    assert.equal(parsed.kind, 'video');
    assert.equal(parsed.id, 'Abc123_-xyz');
    assert.ok(parsed.value.startsWith('https://'));
  }
});

test('un enlace inválido o de otro proveedor produce error, no una búsqueda falsa', () => {
  for (const value of ['https://youtube.com.evil.test/watch?v=Abc123_-xyz', 'https://youtube.com/watch?v=roto', 'https://spotify.com/track/123', 'javascript:alert(1)', 'data:text/html,malicioso', 'file:///C:/video.mp4']) {
    const parsed = classifyMusicInput(value);
    assert.equal(parsed.kind, 'invalid', value);
    assert.ok(parsed.error);
  }
});

test('la búsqueda externa usa exclusivamente YouTube y codifica el texto sin convertirlo en URL', () => {
  const term = 'Él & ella? #amor = canción';
  const url = new URL(youtubeSearchUrl(` ${term} `));
  assert.equal(url.origin, 'https://www.youtube.com');
  assert.equal(url.pathname, '/results');
  assert.equal(url.searchParams.get('search_query'), term);
  assert.deepEqual([...url.searchParams.keys()], ['search_query']);
});

test('la búsqueda externa valida longitud sin enviar nada', () => {
  assert.throws(() => youtubeSearchUrl(' '), /al menos dos/);
  assert.throws(() => youtubeSearchUrl('a'), /al menos dos/);
  assert.throws(() => youtubeSearchUrl('x'.repeat(121)), /hasta 120/);
  assert.doesNotThrow(() => youtubeSearchUrl('x'.repeat(120)));
});
