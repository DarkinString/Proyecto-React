# Música real para acompañar el juego

El juego utiliza **«Un ratito contigo»**, una composición instrumental original guardada en `src/assets/audio/un-ratito-contigo.wav`. Combina un timbre de piano cálido, campanillas discretas y acordes suaves. Dura **30 segundos**, a **64 pulsos por minuto**, y se repite mientras juegas.

Ahora usamos un archivo de audio y el reproductor nativo del navegador. Esto permite comprobar la duración, la carga, los errores y el avance real de la reproducción. Sustituye la síntesis en vivo de la primera versión.

## Lo que puedes hacer

- Antes de jugar, pulsa **Escuchar melodía** para probarla. **Detener muestra** termina esa prueba.
- La melodía comienza al iniciar o reanudar una partida, salvo que hayas elegido silenciarla.
- **Silenciar melodía** es tu preferencia: se conserva durante esta visita hasta que la actives otra vez.
- La pausa del juego, el final de un nivel y cambiar de pestaña detienen el sonido.
- El volumen inicial es **55%** y puedes cambiarlo.
- Si comienza YouTube, la melodía cede el audio. Esa cesión es temporal: iniciar otra partida recupera la melodía si no la habías silenciado expresamente.
- Abrir la página carga la información del archivo, pero no lo reproduce.

No añadimos esta pieza a la biblioteca de YouTube ni ponemos una canción o playlist predeterminada allí.

## 1. El archivo de música y su generación

`scripts/generate-game-ambience.mjs` contiene la partitura y el generador. Se ejecuta con:

```powershell
node scripts/generate-game-ambience.mjs
```

No descarga muestras, canciones ni librerías. Produce un WAV PCM de 16 bits, estéreo, a 32 000 muestras por segundo, con un tamaño aproximado de **3.84 MB**.

### La partitura

`chords` reúne los acordes de ocho compases. `melody` contiene tríos de números: momento, nota y duración. Las alturas usan la numeración MIDI: 60 es do central. No se conecta ningún dispositivo MIDI; es solamente una manera de escribir notas.

`frequency(midi)` transforma esa nota en hercios mediante `440 * 2 ** ((midi - 69) / 12)`. La referencia 69 corresponde a la nota la de 440 Hz.

### Cómo construimos los instrumentos

`note` suma ondas sinusoidales para cada nota:

- El piano combina una frecuencia principal y armónicos que se desvanecen a distintas velocidades.
- Las campanillas usan armónicos más brillantes y duran poco.
- El fondo sostenido entra y sale gradualmente para acompañar la melodía.

`pan` reparte cada instrumento entre los canales izquierdo y derecho. La envolvente controla cómo empieza y termina una nota; evita cortes instantáneos que podrían producir chasquidos.

### Un bucle continuo

Las notas que cruzan el final del archivo continúan al principio con un índice circular. La reverberación hace lo mismo: sus pequeños ecos conservan las colas al repetir. No agregamos un silencio entre vueltas.

El generador normaliza el pico a **0.84** y conserva margen antes de saturar. La versión incluida tiene un nivel RMS aproximado de **0.225**: esta medida confirma que el archivo contiene una señal sostenida y no una pista casi muda. Estas mediciones no sustituyen una escucha en tus altavoces.

### Cómo se guarda

El encabezado WAV describe formato, canales, frecuencia y tamaño. Después se escriben las muestras de los dos canales como números enteros de 16 bits. El resultado ya está incluido: no necesitas ejecutar el generador para usar la página.

## 2. El servicio: `gameAmbience.js`

`createGameAmbience(audio, callbacks)` recibe un elemento `<audio>` real. Importar el módulo o crear el servicio no comienza la reproducción.

`startFromGesture` llama a `audio.play()` directamente desde un clic. Su promesa permite detectar bloqueos del navegador. El servicio escucha eventos del elemento:

| Evento | Qué hacemos |
| --- | --- |
| `canplay` | Sabemos que hay datos para reproducir. |
| `playing` | Confirmamos que comenzó la reproducción y avisamos a YouTube. |
| `waiting` | Mostramos que se están cargando datos. |
| `pause` | Reflejamos la pausa real. |
| `error` | Mostramos el fallo y permitimos reintentar. |

La interfaz solo informa **reproduciendo** cuando llega `playing`; pulsar el botón o resolver una promesa no inventa ese estado.

`wanted` recuerda si todavía se solicita reproducción. `generation` diferencia intentos viejos de intentos nuevos. Si una promesa llega después de pausar o desmontar, estas comprobaciones impiden que reinicie música inesperadamente.

`pause` conserva la posición del archivo y lo detiene. `setVolume` convierte el porcentaje al intervalo 0–1 de HTML. `dispose` retira listeners y pausa el elemento al desmontarlo.

## 3. El hook: `useGameAmbience.js`

El hook une el servicio con React y el juego:

- `audioRef`: referencia al elemento nativo.
- `enabled`: preferencia explícita de escuchar o silenciar.
- `yieldedToMusic`: cesión temporal a YouTube; es independiente de `enabled`.
- `volume`: porcentaje elegido.
- `status`: estado real comunicado por el servicio.
- `previewing`: si estamos escuchando la muestra antes de jugar.

`startFromGesture` se usa al comenzar o reanudar. `listen` permite escuchar antes de jugar y vuelve a habilitar el sonido si estaba silenciado. `toggle` cambia la preferencia o recupera el audio después de YouTube.

Un efecto observa la fase: salir de `playing` detiene el audio. Otro escucha la visibilidad de la pestaña y los eventos entre reproductores. Ambos limpian sus recursos al desmontarse.

La muestra es una excepción explícita: solo comienza por pulsar **Escuchar melodía** en la pantalla de preparación.

## 4. El componente: `GameAmbience.jsx`

El componente importa el WAV con Vite y lo asigna al elemento:

```jsx
<audio ref={audioRef} src={ambienceTrack} loop preload="metadata" />
```

- `ref` permite acceder al reproductor desde el hook.
- `src` es la URL local que prepara Vite.
- `loop` repite la pieza.
- `preload="metadata"` permite conocer sus datos sin reproducirla automáticamente.

Los botones y el deslizador controlan ese mismo elemento. `data-audio-status` expone su estado en el DOM para verificarlo durante el desarrollo.

## 5. Coordinación con YouTube

Los dos reproductores comparten este evento local de la página:

```js
window.dispatchEvent(new CustomEvent('mirukaleta:audio-start', {
  detail: { source: 'game' }, // YouTube publica 'youtube'.
}));
```

Cada uno ignora su propia fuente. Cuando YouTube empieza, el juego pausa su melodía y marca la cesión temporal. Cuando la melodía empieza realmente, YouTube recibe la indicación de ceder el audio.

Esto no envía datos a Internet y no requiere credenciales. El WAV se sirve junto con el resto de la página.

## Verificación

`tests/gameAmbience.test.js` verifica:

1. Que no hay reproducción sin la llamada desde un gesto y que solo `playing` confirma el inicio.
2. Que pausar o desmontar cancela una respuesta tardía de `play()`.
3. Que un bloqueo puede reintentarse.
4. Que el archivo es WAV PCM estéreo de 30 segundos, contiene señal suficiente y no satura.

En el navegador puedes comprobar el elemento `audio`: `duration` debe ser 30, `currentTime` debe avanzar al reproducir y `paused` debe cambiar al pausar. El volumen real también depende del navegador, del sistema y de tus altavoces.

Referencias: [HTMLMediaElement.play()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play), [evento playing](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playing_event) y [HTMLMediaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement).
