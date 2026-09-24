// Generador reproducible de «Un ratito contigo». No utiliza muestras ni música de terceros.
// Ejecuta: node scripts/generate-game-ambience.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const sampleRate = 32000;
const secondsPerBeat = 60 / 64;
const duration = 32 * secondsPerBeat;
const length = sampleRate * duration;
const left = new Float64Array(length);
const right = new Float64Array(length);
const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);

function note(midi, beat, beats, amplitude, instrument, pan = 0) {
  const start = Math.round(beat * secondsPerBeat * sampleRate);
  const seconds = beats * secondsPerBeat;
  const samples = Math.ceil(seconds * sampleRate);
  const hz = frequency(midi);
  const leftGain = Math.cos((pan + 1) * Math.PI / 4);
  const rightGain = Math.sin((pan + 1) * Math.PI / 4);
  for (let index = 0; index < samples; index += 1) {
    const time = index / sampleRate;
    const angle = 2 * Math.PI * hz * time;
    let wave;
    let envelope;
    if (instrument === 'pad') {
      wave = Math.sin(angle) + .18 * Math.sin(angle * 2) + .08 * Math.sin(angle * 3);
      envelope = Math.sin(Math.PI * time / seconds) ** 2;
    } else if (instrument === 'bell') {
      wave = Math.sin(angle) + .24 * Math.sin(angle * 2.001) + .08 * Math.sin(angle * 3.98);
      envelope = (1 - Math.exp(-time / .012)) * Math.exp(-time / .9);
    } else {
      // Los armónicos altos desaparecen antes: un timbre de piano cálido y redondo.
      wave = Math.sin(angle) + .36 * Math.sin(angle * 2.001) * Math.exp(-time * 1.8)
        + .13 * Math.sin(angle * 3.003) * Math.exp(-time * 3)
        + .045 * Math.sin(angle * 4.005) * Math.exp(-time * 4.5);
      envelope = (1 - Math.exp(-time / .008)) * Math.exp(-time / 1.25);
    }
    const release = Math.min(1, Math.max(0, (seconds - time) / .15));
    const value = amplitude * wave * envelope * release;
    // Las colas que cruzan el final vuelven al inicio: el archivo forma un ciclo continuo.
    const target = (start + index) % length;
    left[target] += value * leftGain;
    right[target] += value * rightGain;
  }
}

const chords = [
  [48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 57, 60], [43, 50, 55, 62],
  [48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 57, 60], [43, 50, 55, 59],
];
for (const [bar, chord] of chords.entries()) {
  chord.forEach((midi, index) => note(midi, bar * 4, 4.7, .055, 'pad', (index - 1.5) * .24));
  note(chord[0] - 12, bar * 4, 3, .13, 'piano', -.08);
  for (let beat = 0; beat < 4; beat += 1) {
    note(chord[(beat + 1) % 4] + 12, bar * 4 + beat + .5, 2, .095, 'piano', beat % 2 ? .22 : -.22);
  }
}

const melody = [
  [0, 72, 2], [1.5, 76, 1.5], [2.5, 79, 1.5], [3.5, 76, 1.5],
  [4.5, 72, 2], [6, 71, 1.5], [7, 69, 1.5],
  [8, 72, 2], [9.5, 76, 1.5], [11, 74, 1.5],
  [12.5, 71, 2], [14, 67, 2.2],
  [16, 72, 2], [17.5, 76, 1.5], [18.5, 79, 1.5], [19.5, 76, 1.5],
  [20.5, 81, 2], [22, 79, 2],
  [24, 76, 2], [25.5, 74, 1.5], [27, 72, 1.5],
  [28.5, 71, 1.5], [30, 72, 2.8],
];
melody.forEach(([beat, midi, beats], index) => {
  note(midi, beat, beats, .31, 'piano', .06);
  if (index % 3 === 0) note(midi + 12, beat + .015, 2.6, .046, 'bell', -.2);
});

// Reverberación circular: pequeños ecos estéreo conservan la continuidad del bucle.
const wetLeft = new Float64Array(left);
const wetRight = new Float64Array(right);
for (const [seconds, gain] of [[.113, .18], [.173, .15], [.281, .12], [.421, .1], [.613, .07], [.887, .05], [1.193, .035], [1.597, .02]]) {
  const delay = Math.round(seconds * sampleRate);
  for (let index = 0; index < length; index += 1) {
    const source = (index - delay + length) % length;
    wetLeft[index] += right[source] * gain;
    wetRight[index] += left[source] * gain;
  }
}

let peak = 0;
for (let index = 0; index < length; index += 1) {
  wetLeft[index] = Math.tanh(wetLeft[index] * 1.5);
  wetRight[index] = Math.tanh(wetRight[index] * 1.5);
  peak = Math.max(peak, Math.abs(wetLeft[index]), Math.abs(wetRight[index]));
}
const normalization = .84 / peak;
const wav = Buffer.alloc(44 + length * 4);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVE', 8);
wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(2, 22); wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 4, 28);
wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(length * 4, 40);
let sumSquares = 0;
for (let index = 0; index < length; index += 1) {
  const l = wetLeft[index] * normalization;
  const r = wetRight[index] * normalization;
  wav.writeInt16LE(Math.round(l * 32767), 44 + index * 4);
  wav.writeInt16LE(Math.round(r * 32767), 46 + index * 4);
  sumSquares += l * l + r * r;
}
const directory = fileURLToPath(new URL('../src/assets/audio/', import.meta.url));
mkdirSync(directory, { recursive: true });
writeFileSync(fileURLToPath(new URL('../src/assets/audio/un-ratito-contigo.wav', import.meta.url)), wav);
console.log(JSON.stringify({ duration, sampleRate, channels: 2, bytes: wav.length, peak: .84, rms: Math.sqrt(sumSquares / (length * 2)), loopBoundaryDifference: Math.max(Math.abs(wetLeft[0] - wetLeft.at(-1)), Math.abs(wetRight[0] - wetRight.at(-1))) * normalization }, null, 2));
