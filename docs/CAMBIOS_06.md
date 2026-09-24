# Etapa 6 · Música continua, pulsación larga y destellos

Esta etapa corrige las interacciones que probamos juntos. Mantiene las secciones, las imágenes, las cartas y la paleta celeste, violeta y lila.

## 1. Cómo usarlo

- **Música:** escribe un nombre o pega un enlace en «¿Qué escuchamos juntos?». El mismo campo adapta sus acciones. Sin clave, buscar abre YouTube; pega después el enlace para reproducirlo aquí. Con clave, los resultados aparecen dentro de la landing. No hay campos deshabilitados esperando credenciales.
- **Reproductor:** mantén el clic o el dedo **dos segundos sobre el título o el marco**, luego arrastra y suelta. Una línea indica la espera. El propio video conserva sus controles de YouTube; empieza el gesto fuera de ellos. «Volver a la sección» devuelve la tarjeta a Música sin reiniciar el video.
- **Poro:** un clic breve le da una galleta. Mantener dos segundos sobre su imagen permite cargarlo y arrastrarlo. El aro anuncia la espera y el balanceo acompaña el movimiento.
- **Teclado:** enfoca el marco del reproductor o el botón del poro con Tab. Las flechas desplazan 10 px; Shift + flechas desplaza 30 px. Escape restablece la posición.
- **Juego:** «Escuchar melodía» permite probar la pieza antes de empezar. Al comenzar o reanudar una partida suena automáticamente, salvo que la hayas silenciado. Tiene volumen propio.
- **Fondo:** aparecen destellos lentos usando los colores existentes. «Reducir movimiento», en el pie, los deja estáticos; también se respeta la preferencia del dispositivo.

## 2. Un campo, varias intenciones

Lee [CAMBIOS_06_MUSICA.md](CAMBIOS_06_MUSICA.md) para la explicación de cada función del formulario. La idea es distinguir **lo que escribiste** antes de elegir una acción:

```text
Texto → buscar en YouTube / buscar con API
Enlace de video → escuchar o guardar
Enlace de playlist → escuchar, guardar o importar sus canciones con API
```

No se añade una canción ni una playlist predeterminada a nuestra lista.

## 3. Por qué la música se detenía al bajar

`MusicPlayer.jsx` tenía un `IntersectionObserver`: una API que informa si un elemento se ve en la pantalla. Cuando el video dejaba de verse, nuestro código llamaba a `pauseVideo()`. Esa era una decisión del componente, no un fallo de la búsqueda.

Se retiró esa pausa por visibilidad. El reproductor permanece montado dentro de `MusicSection`; recorrer las secciones no cambia el enlace ni destruye el iframe. «Montado» significa que React conserva el elemento en el documento, aunque esté fuera de la parte visible.

| Bloque de `MusicPlayer.jsx` | Qué hace y por qué |
| --- | --- |
| `hostRef` | Señala el contenedor donde YouTube crea su iframe. React administra el exterior; YouTube administra el video. |
| `playerRef` / `playerReadyRef` | Conservan el controlador del proveedor y si está listo. Los `ref` sobreviven a los renders sin generar otro render por sí mismos. |
| `trackRef` / `nextRef` | Los callbacks de YouTube consultan la selección y la acción siguientes más recientes. |
| Primer `useEffect` | Crea la instancia al elegir contenido; la limpia al cambiar de video, reintentar o desmontar. Sus dependencias no incluyen scroll ni posición flotante. |
| `onReady` | Confirma que el proveedor está listo e intenta reproducir. Si el navegador exige un gesto, el aviso invita a pulsar ▶. |
| `onStateChange` | Limpia avisos cuando empieza a sonar y anuncia a la música del juego que YouTube tiene el turno. |
| Efecto de `playRequest` | Permite reanudar el mismo enlace sin reconstruirlo ni reiniciar su tiempo. |
| Efecto de `mirukaleta:audio-start` | Pausa YouTube cuando empieza la melodía del juego, evitando dos piezas simultáneas. |
| `floating` | Solo controla la presentación de la tarjeta. La reproducción no depende de este estado. |
| `onDragStart` / `onReset` | Sacan la tarjeta de su sección al completar la pulsación y la devuelven al restablecer la posición. |

La pausa manual, cambiar de canción y comenzar la música del juego siguen siendo acciones distintas del scroll. El navegador y YouTube pueden aplicar sus propias restricciones; conservar el iframe no evita esas restricciones externas.

## 4. Cómo funciona la pulsación de dos segundos

Dividimos el trabajo para poder comprenderlo y probarlo:

### `utils/holdGesture.js`: el reloj del gesto

`createHoldGesture(...)` recibe el punto inicial y tres callbacks: `onHold`, `onMove` y `onFinish`. Un **callback** es una función que entregamos para ejecutarla cuando ocurra algo.

- `latest` recuerda la posición más reciente del puntero.
- `held` indica que transcurrieron los 2 000 milisegundos.
- `finished` impide ejecutar dos veces una limpieza o arrastrar después de soltar.
- `moved` recuerda un movimiento mayor de 12 px, solo para evitar que un intento de arrastre dé una galleta accidental.
- `schedule(...)` inicia el temporizador. Al terminar, activa el gesto y comunica la posición más reciente. Sus valores predeterminados son `setTimeout` y `clearTimeout`; las pruebas pueden sustituirlos.
- `move(point)` actualiza la posición. **Mover el mouse antes de terminar la espera ya no cancela el gesto**, que era uno de los problemas anteriores.
- `finish()` cancela el reloj y comunica si hay que descartar el clic posterior. Soltar antes del plazo nunca activa un arrastre tardío.

### `hooks/useFloatingDrag.js`: conectar el gesto a React y al navegador

Un **hook** reúne estado y comportamiento reutilizables. Lo comparten el poro y el reproductor.

| Función o estado | Explicación |
| --- | --- |
| `position` | Guarda `{ x, y }`; `null` significa utilizar la posición habitual del CSS. |
| `holding` / `dragging` | Separan la espera del movimiento para mostrar una animación distinta en cada fase. |
| `positionRef` | Permite a los eventos leer las coordenadas actuales sin esperar al siguiente render. |
| `options` | Mantiene las opciones y callbacks actuales, incluso dentro de un temporizador que ya comenzó. |
| `place(next)` | Pide a `clampFloatingPosition` una posición que mantenga el elemento dentro de la pantalla y actualiza solo si cambia. |
| `attachRef(element)` | Recibe el elemento DOM y observa cambios de tamaño con `ResizeObserver`. Si el texto o el viewport cambian, vuelve a ajustar la posición. |
| Efectos | Reaccionan al resize, limpian listeners al desmontar y cancelan el gesto cuando se deshabilita. |
| `reset()` | Termina cualquier gesto, elimina coordenadas y avisa al reproductor que vuelva a su sección. |
| `isNestedControl(event)` | Protege botones, enlaces y campos interiores: pulsarlos no inicia un arrastre del marco. |
| `onPointerDown(event)` | Acepta el puntero principal y botón izquierdo; recuerda origen, punto inicial e identificador del puntero. |
| `setPointerCapture(pointerId)` | Mantiene el gesto asociado al elemento aunque el cursor salga de la imagen o pase por el iframe. |
| Callback `onHold` | Tras dos segundos activa la presentación flotante y el estado de arrastre. |
| Callback `onMove` | Suma al origen la diferencia entre el puntero actual y el inicial. Esa diferencia es el desplazamiento. |
| Callback `onFinish` | Libera captura, borra listeners, termina las animaciones y evita el clic accidental durante 500 ms. |
| `onKeyDown` | Ofrece flechas y Escape como alternativa accesible. Ignora los controles interiores. |
| `handleProps` | Agrupa los eventos que se conectan mediante `{...drag.handleProps}`. Evita también el arrastre nativo de imágenes y el menú contextual sobre la superficie. |
| `suppressClick()` | Permite al poro decidir si un clic fue el final de un arrastre en lugar de una petición de comida. |

`pointerup`, `pointercancel`, pérdida de captura y pérdida de foco terminan el gesto. Esto evita que quede una ventana pegada al cursor si la interacción se interrumpe.

### `PoroCompanion.jsx`: conservar el elemento mientras lo levantamos

En pantallas pequeñas, el poro ocupa un espacio junto al tablero. Antes, pasar a flotante cambiaba su nodo de lugar mediante un portal y podía perderse el gesto táctil. Ahora el portal permanece en el mismo contenedor; cambiar `data-docked` y las coordenadas CSS lo convierte en flotante. Las galletas y los mensajes siguen siendo estado del mismo componente.

### CSS: informar sin añadir otro botón

`data-holding` muestra un aro en el poro y una línea creciente en el reproductor. `data-dragging` activa el balanceo o la sombra al levantarlo. La espera dura lo mismo que el temporizador: `2s`. `pointer-events: none` en los adornos deja pasar los clics. Las reglas de movimiento reducido conservan una señal estática.

## 5. La melodía ahora es un archivo real

`src/assets/audio/un-ratito-contigo.wav` contiene «Un ratito contigo», una pieza original de 30 segundos con piano, campanillas y acordes suaves. Se repite mediante `loop` de `<audio>`. La guía [CAMBIOS_05_AUDIO.md](CAMBIOS_05_AUDIO.md) se actualizó para explicar el reproductor nativo, la generación del archivo, sus funciones y los eventos.

El volumen inicial es 55%. El botón de prueba permite escucharlo antes de la partida. Los estados vienen de eventos reales como `playing` o `error`; no mostramos que está sonando solo por pulsar el botón.

`yieldedToMusic` significa que YouTube tomó temporalmente el turno. Es distinto de `enabled`, la preferencia de escuchar música: empezar otra partida puede recuperar la melodía sin deshacer un silencio elegido por la usuaria.

## 6. Estrellas sin modificar la composición

Lee [CAMBIOS_06_FONDO.md](CAMBIOS_06_FONDO.md). Se añade una capa de 32 puntos y estrellas —24 visibles en móvil— con posiciones estables. Las luces ambientales y el brillo que sigue al cursor siguen funcionando. Los destellos toman los colores de las variables ya existentes y no reciben eventos del puntero.

## 7. Comprobaciones y ejercicio

`npm.cmd test` comprueba el plazo exacto, movimiento durante la espera, clic breve, cancelación y límites del arrastre; además, los datos musicales, el motor del juego, almacenamiento y validez del WAV. `npm.cmd run build` genera la versión de producción.

Prueba tú: pulsa el poro y suelta inmediatamente; debe recibir una galleta. Después mantenlo dos segundos, arrástralo y suelta; debe cambiar de posición sin sumar otra galleta. Repite sobre el título del reproductor y baja a otra sección sin hacerlo flotante: el scroll ya no ejecuta una pausa.

**Ejercicio para aprender:** encuentra `holdDelay: 2000` en ambos componentes. Ese número expresa milisegundos, mientras el CSS usa segundos. Si quisieras cambiar el plazo, ¿qué valores tendrías que mantener sincronizados para que la animación siga representando la espera real?
