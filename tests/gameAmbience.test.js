import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGameAmbience } from '../src/features/games/gameAmbience.js';

class FakeAudio extends EventTarget {
  paused = true;
  muted = false;
  volume = 1;
  loop = false;
  plays = 0;
  pauses = 0;
  play() {
    this.plays += 1;
    this.paused = false;
    return new Promise((resolve, reject) => { this.finishPlay = resolve; this.rejectPlay = reject; });
  }
  pause() {
    this.pauses += 1;
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  }
  startPlaying() {
    this.paused = false;
    this.dispatchEvent(new Event('playing'));
    this.finishPlay();
  }
}

test('play se invoca dentro del gesto y solo playing confirma reproducción real', async () => {
  const audio = new FakeAudio();
  const statuses = [];
  let starts = 0;
  const music = createGameAmbience(audio, { onStatus: (status) => statuses.push(status), onStart: () => { starts += 1; } });
  assert.equal(audio.plays, 0);
  assert.equal(audio.volume, .55);
  assert.equal(audio.loop, true);
  music.startFromGesture();
  assert.equal(audio.plays, 1);
  assert.equal(statuses.at(-1), 'loading');
  audio.finishPlay();
  await Promise.resolve();
  assert.equal(starts, 0);
  assert.equal(statuses.at(-1), 'loading');
  audio.dispatchEvent(new Event('playing'));
  assert.equal(starts, 1);
  assert.equal(statuses.at(-1), 'playing');
  music.startFromGesture();
  assert.equal(audio.plays, 1);
  music.pause();
  assert.equal(audio.paused, true);
  assert.equal(statuses.at(-1), 'paused');
  music.dispose();
});

test('pausar durante un play pendiente impide una reproducción tardía', async () => {
  const audio = new FakeAudio();
  let starts = 0;
  const music = createGameAmbience(audio, { onStart: () => { starts += 1; } });
  music.startFromGesture();
  music.pause();
  audio.startPlaying();
  await Promise.resolve();
  assert.equal(starts, 0);
  assert.equal(audio.paused, true);
  music.dispose();
});

test('desmontar durante play limpia eventos y detiene una respuesta tardía', async () => {
  const audio = new FakeAudio();
  let starts = 0;
  const music = createGameAmbience(audio, { onStart: () => { starts += 1; } });
  music.startFromGesture();
  music.dispose();
  audio.startPlaying();
  await Promise.resolve();
  assert.equal(starts, 0);
  assert.equal(audio.paused, true);
});

test('una denegación del navegador se muestra como bloqueo y permite reintentar', async () => {
  const audio = new FakeAudio();
  const statuses = [];
  const music = createGameAmbience(audio, { onStatus: (status) => statuses.push(status) });
  music.startFromGesture();
  audio.rejectPlay(Object.assign(new Error('El navegador requiere un gesto.'), { name: 'NotAllowedError' }));
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(statuses.at(-1), 'blocked');
  music.startFromGesture();
  audio.startPlaying();
  await Promise.resolve();
  assert.equal(statuses.at(-1), 'playing');
  music.dispose();
});

test('el archivo local contiene 30 segundos de audio estéreo audible, sin clipping ni salto brusco en el bucle', () => {
  const wav = readFileSync(new URL('../src/assets/audio/un-ratito-contigo.wav', import.meta.url));
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
  assert.equal(wav.readUInt16LE(20), 1);
  assert.equal(wav.readUInt16LE(22), 2);
  assert.equal(wav.readUInt32LE(24), 32000);
  assert.equal(wav.readUInt16LE(34), 16);
  assert.equal((wav.length - 44) / (32000 * 4), 30);
  let sumSquares = 0;
  let peak = 0;
  for (let offset = 44; offset < wav.length; offset += 2) {
    const sample = wav.readInt16LE(offset) / 32768;
    peak = Math.max(peak, Math.abs(sample));
    sumSquares += sample * sample;
  }
  const rms = Math.sqrt(sumSquares / ((wav.length - 44) / 2));
  assert.ok(rms > .15 && rms < .3, 'La pieza debe tener señal sostenida, no una pista casi muda.');
  assert.ok(peak > .7 && peak < .9, 'Conservamos margen antes de saturar.');
  for (const channel of [0, 2]) {
    const first = wav.readInt16LE(44 + channel);
    const last = wav.readInt16LE(wav.length - 4 + channel);
    assert.ok(Math.abs(first - last) / 32768 < .04);
  }
});
