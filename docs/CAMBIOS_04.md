# Etapa 4 · Piezas de nosotros y música de YouTube

Ahora tenemos un juego de combinar figuras, premios coleccionables y música de YouTube. Esta guía explica las funciones nuevas por bloques; la sintaxis básica de JSX, props y eventos sigue en [APRENDER.md](APRENDER.md).

## 1. El recorrido de una partida

1. Escribe un sobrenombre de 1 a 24 caracteres y elige Fácil, Medio o Difícil.
2. Comienza el primer recuerdo. Los siguientes se habilitan al completar el anterior.
3. Intercambia dos figuras vecinas para formar líneas de tres o más iguales.
4. Cada figura eliminada revela una parte de la ilustración del nivel.
5. Al alcanzar el objetivo recibes de una a tres estrellas y se guarda la victoria.
6. La imagen aparece en Coleccionables; puedes seguir al siguiente recuerdo o mejorar tu resultado.

El objetivo se mide en **figuras eliminadas**, no en puntos. Una combinación válida consume un movimiento; un intento que no combina nada no lo consume. Al agotar movimientos sin completar la imagen puedes volver a intentarlo.

Las imágenes actuales son ilustraciones provisionales: todavía no representan fotos reales de la relación.

## 2. Por qué separamos estos archivos

| Archivo dentro de `src/` | Responsabilidad |
| --- | --- |
| `features/games/match3.js` | Reglas del tablero y cálculo de jugadas. |
| `features/games/useMatchGame.js` | Estado de la partida, reloj, animaciones y mensajes. |
| `features/games/MatchBoard.jsx` | Botones del tablero, teclado y gestos. |
| `features/games/GamesSection.jsx` | Formulario, marcador, imagen, resultado y controles. |
| `features/games/gameProgress.js` | Validación de victorias, premios y clasificación. |
| `hooks/useGameProgress.js` | Conexión entre victorias y `localStorage`. |
| `features/collectibles/CollectiblesSection.jsx` | Álbum de imágenes desbloqueadas. |
| `data/gameLevels.js` | Datos e imágenes de los tres niveles. |

El motor recibe datos y devuelve datos nuevos. No dibuja botones ni accede al navegador. Así podemos comprobar sus reglas sin abrir React y cambiar el diseño sin reescribir el juego.

## 3. El tablero es una lista de números

`SIZE = 6` significa seis filas y seis columnas: 36 casillas. Cada número de `board` identifica un tipo de figura. `MatchBoard` convierte esos números en corazones, diamantes, flores, estrellas, perlas o lunas.

```js
const row = Math.floor(index / SIZE);
const column = index % SIZE;
```

`index` es la posición dentro de la lista. Dividir entre seis y quitar decimales obtiene la fila; `%` devuelve el resto y obtiene la columna. Ambas empiezan en cero. La interfaz les suma uno para mostrarlas como fila 1, columna 1.

Un ejemplo: el índice 8 corresponde a fila interna 1, columna interna 2; la persona lo ve en fila 2, columna 3.

## 4. Las funciones del motor

| Función en `match3.js` | Qué hace y por qué |
| --- | --- |
| `validateTypes` / `validateBoard` | Rechazan tipos o tableros inválidos antes de calcular una jugada. |
| `randomIndex` | Convierte un valor aleatorio entre 0 y 1 en una posición válida. |
| `areAdjacent` | Acepta vecinos horizontales o verticales; impide diagonales y saltos entre filas. |
| `findMatches` | Recorre filas y columnas buscando grupos consecutivos de al menos tres. |
| `swappedBoard` | Copia el tablero con `[...board]` e intercambia dos posiciones en la copia. |
| `findPossibleMove` | Prueba intercambios vecinos y devuelve una jugada posible para las pistas. |
| `createBoard` | Genera un tablero sin combinaciones ya hechas y con al menos una jugada. |
| `refillBoard` | Quita las coincidencias, baja las figuras restantes y rellena los huecos superiores. |
| `resolveMove` | Calcula el intercambio completo, cascadas, figuras, puntos y combos. |
| `levelSettings` | Ajusta objetivo, movimientos y tiempo según dificultad y nivel. |
| `rateStars` | Calcula la calificación final a partir de tiempo y combos. |

`findMatches` usa un `Set`: si una figura pertenece a una línea horizontal y otra vertical, se cuenta una sola vez en esa oleada.

`rng = Math.random` permite usar azar normal al jugar y una secuencia controlada en las pruebas. `createBoard` tiene intentos limitados y un tablero de respaldo para evitar búsquedas interminables.

## 5. Cascadas, combos y puntos

Una **cascada** ocurre cuando las figuras que caen forman otra combinación, sin gastar un movimiento adicional. `resolveMove` guarda cada oleada en `steps`; React utiliza esa secuencia para mostrar lo que ocurrió.

- Primera oleada: cada figura vale 100 puntos.
- Segunda oleada: cada figura vale 200 puntos.
- Tercera oleada: cada figura vale 300 puntos; el multiplicador sigue aumentando.
- Una oleada suma un combo si elimina cuatro o más figuras, o si pertenece a una cascada posterior a la primera.

La fórmula es `matched.length * 100 * (waveIndex + 1)`. `matched.length` cuenta las figuras; `waveIndex` empieza en cero, por eso sumamos uno.

Una oleada aporta como máximo un combo aunque cumpla ambas condiciones. Si el tablero queda sin jugadas, el motor lo renueva sin cobrar otro movimiento. También limita la resolución a 40 oleadas para evitar una cadena interminable.

## 6. Dificultad y estrellas

Estos son los valores iniciales del nivel 1, definidos en `DIFFICULTIES`:

| Dificultad | Tipos de figura | Movimientos | Objetivo | Estrella por tiempo | Estrella por combos |
| --- | --- | --- | --- | --- | --- |
| Fácil | 4 | 20 | 92 figuras | 150 s o menos | 3 o más |
| Medio | 5 | 20 | 83 figuras | 180 s o menos | 4 o más |
| Difícil | 6 | 20 | 81 figuras | 210 s o menos | 5 o más |

Cada nivel siguiente añade seis figuras al objetivo, dos movimientos y 30 segundos al umbral de tiempo. Con más tipos de figura resulta menos frecuente encontrar coincidencias.

Fácil tiene un objetivo mayor porque cuatro tipos producen muchas más cascadas. La calibración inicial comparó 200 partidas reproducibles por dificultad: usando siempre la primera jugada posible ganaron aproximadamente el 91 %, 70 % y 48 %. Ajustaremos estos valores al jugar; son una referencia de equilibrio, no una garantía para cada partida.

```js
return 1 + Number(elapsedSeconds <= config.starTime)
  + Number(comboCount >= config.starCombos);
```

Esta función se llama **al ganar**: el `1` premia completar el nivel. Cada comparación produce `true` o `false`; `Number` los convierte en `1` o `0`. La estrella de tiempo y la estrella de combos se consiguen de forma independiente. Los puntos sirven para el marcador.

## 7. El hook que coordina la partida

`useMatchGame` usa `useState` para los datos que React muestra y `useRef` para información que debe conservarse entre eventos sin provocar otro render por sí misma.

| Función o referencia | Qué coordina |
| --- | --- |
| `game` / `gameRef` / `commit` | `commit` actualiza la referencia inmediata y el estado visible con la misma partida. |
| `start` | Valida el sobrenombre, crea el tablero, reinicia el reloj y asigna un `runId` único. |
| `swap` | Pide al motor la jugada y bloquea nuevos intercambios mientras muestra sus oleadas. |
| `finishMove` | Acumula puntuación, revisa victoria o derrota y prepara el resultado final. |
| `elapsed` / `stopClock` | Calculan tiempo real transcurrido y conservan lo acumulado al detenerse. |
| `pause` / `resume` | Detienen o reanudan el reloj y cambian el estado de la partida. |
| `hint` | Encuentra dos figuras que pueden combinarse y devuelve sus posiciones. |
| `reset` | Cancela trabajo pendiente y vuelve a la selección inicial. |
| `announce` | Actualiza el mensaje del juego y avisa al poro mediante `onMessage`. |

Las fases son `setup`, `playing`, `paused`, `won` y `lost`. Comparar `game.phase` permite mostrar el formulario, tablero, pausa o resultado correspondientes.

El reloj usa `performance.now()`, un contador de tiempo transcurrido. El intervalo de 250 ms actualiza su lectura en pantalla: no suma segundos suponiendo que todos los intervalos lleguen puntuales.

`visibilitychange` detecta que cambiaste de pestaña y pausa la partida. La pausa oculta el tablero y excluye ese tiempo del récord. Debes pulsar **Seguir jugando** para retomarla.

`pending` conserva el identificador del temporizador; `pendingStep` guarda la oleada que debe continuar después de una pausa. Cambiar de pestaña detiene también esa animación. `generation` distingue una partida de la anterior. Al reiniciar se cancelan animaciones pendientes. Los efectos devuelven funciones de limpieza para retirar eventos e intervalos cuando dejan de necesitarse.

## 8. Tocar, deslizar o usar teclado

`MatchBoard` mantiene `selected` para la figura elegida y `focused` para la casilla accesible con Tab. `choose` selecciona la primera figura, la deselecciona si repites y pide el intercambio al elegir una vecina.

`keyboard` mueve el foco con flechas y cancela la selección con Escape. Enter o Espacio activan el botón. `cells` guarda referencias a los botones para llamar a `.focus()`.

Los eventos de puntero registran dónde comienza un gesto y comparan su desplazamiento horizontal y vertical al terminar. La captura del puntero conserva el gesto aunque el dedo salga del botón; una marca temporal evita interpretar el mismo deslizamiento como otro clic.

`aria-label` nombra fila, columna y figura; `aria-pressed` anuncia la selección. Las piezas tienen formas y colores distintos, de modo que el color no es la única pista.

## 9. Cómo se descubre la imagen y habla el poro

`GamesSection` calcula `cleared / settings.target`: la proporción del objetivo alcanzado. La convierte en hasta 36 cuadros revelados usando `Math.floor` y `Math.min`. La capa que cubre la ilustración retira cuadros a medida que avanzas.

`begin` comprueba el formulario e inicia el nivel. `saveWin` intenta guardar su resultado y muestra el mensaje de récord cuando corresponde. El botón de siguiente nivel requiere que el premio se haya guardado; si falla, puedes reintentar sin perder ese resultado de la pantalla.

`App` guarda `gameMessage`. El juego recibe `setGameMessage` como `onPoroMessage` y el poro recibe el texto mediante una prop. Así ambos se comunican sin que el tablero necesite acceder directamente a otro componente.

`App` también guarda `gameDock`, el elemento HTML que reserva un lugar para el poro. `GamesSection` recibe `setGameDock` como **callback ref**: React llama a esa función con el elemento al montarlo y con `null` al retirarlo. El lugar aparece en el formulario o antes del tablero, según la fase.

`PoroCompanion` recibe `gameDock` y consulta `matchMedia('(max-width: 1023px)')`. En esas pantallas, mientras la sección activa es Juegos, `createPortal` dibuja al poro dentro del lugar reservado. Su componente conserva el estado de las galletitas y el personaje ocupa espacio sin tapar fichas. En escritorio continúa flotando.

El poro anima al empezar, ante combinaciones, al ganar y al establecer un récord. También recibe comentarios periódicos durante el juego. Las frases son genéricas hasta que agreguemos datos reales de la relación.

## 10. Qué se guarda y cómo se desbloquea un premio

Una victoria contiene `id`, `nickname`, `difficulty`, `levelId`, `points`, `elapsedSeconds`, `comboCount`, `stars` y `completedAt`. `crypto.randomUUID()` identifica el intento; `new Date().toISOString()` registra cuándo terminó.

`isGameRecord` valida tipos, límites y fecha. `addGameRecord` evita repetir un `id`, por lo que reintentar un guardado no entrega dos premios por la misma victoria.

`useGameProgress` utiliza `useStoredCollection` con la clave **`mirukaleta.game.records.v1`**. Relee el almacenamiento antes de añadir, conserva resultados de otras pestañas y comunica errores. `saveResult` devuelve `{ saved, isRecord }` para que la interfaz sepa qué ocurrió.

`getLevelCollection` busca victorias de un nivel y obtiene desbloqueo, mejores estrellas, menor tiempo y número de victorias. El álbum deriva sus premios de estos registros; no guarda otra lista que pueda quedarse desactualizada.

`getLeaderboard` compara el mismo nivel y dificultad, ordena por puntos y desempata por menor tiempo. Muestra hasta cinco sobrenombres, conservando el mejor intento de cada uno. `isTimeRecord` exige superar el tiempo anterior; la primera victoria establece el primer récord.

Todo pertenece al navegador y origen actuales. Las partidas en curso se reinician al recargar; se conservan las victorias. El marcador es local, sin cuentas ni sincronización entre dispositivos.

## 11. Dónde pondremos sus fotos

Las ilustraciones están en `src/assets/images/memories/`. Abre `src/data/gameLevels.js`: cada objeto tiene `id`, `title`, `description`, `image`, `alt` e `isPlaceholder`.

Para sustituir una ilustración, añade su foto a esa carpeta, impórtala, asígnala a `image`, escribe un `alt` que la describa y cambia `isPlaceholder` a `false`. Conserva el `id` del nivel para mantener sus victorias y desbloqueos. Podemos ajustar el encuadre después de elegir las fotos.

`CollectiblesSection` muestra un candado mientras el nivel está bloqueado. Al desbloquearlo muestra la imagen y un `<details>` con `<summary>` para abrir su vista completa usando ratón, toque o teclado.

## 12. YouTube y el siguiente ejercicio

`services/youtube.js` interpreta enlaces, consulta resultados y normaliza datos. `MusicSection` coordina formularios y favoritos; `MusicPlayer` utiliza el reproductor de YouTube. No hay canciones ni playlists predeterminadas.

Puedes pegar enlaces para reproducir videos o playlists sin una clave propia. La búsqueda y la importación de los videos de una playlist utilizan **YouTube Data API v3** y requieren configurar `VITE_YOUTUBE_API_KEY` en `.env.local`. Después reinicia Vite. Consulta los pasos y restricciones en [YOUTUBE.md](YOUTUBE.md).

La nueva lista usa `mirukaleta.youtube.v1`. Guarda identificadores y etiquetas propias; los datos antiguos de Audius no se convierten automáticamente en enlaces de otro catálogo. El reproductor permanece visible y cada video depende de los permisos de reproducción de YouTube.

Para practicar: cambia una frase de ánimo, modifica un objetivo en `DIFFICULTIES` y observa cómo cambia el progreso. Después sigue `resolveMove` junto a sus pruebas para entender una cascada antes de cambiar sus puntos.

Ejecuta `npm.cmd test` para comprobar las reglas, `npm.cmd run build` para compilar y `npm.cmd run dev` para probar la interfaz. Las pruebas automáticas y la revisión en el navegador cubren cosas diferentes: las primeras comprueban cálculos; la segunda permite revisar controles, animaciones y servicios externos.

## 13. Comprobaciones de esta etapa

En el navegador se completó una partida Fácil con **16,300 puntos, 12 combos, 1:27 y tres estrellas**. El premio y el marcador permanecieron después de recargar; el siguiente nivel inició una partida nueva y la pausa manual detuvo el reloj. Ese registro se creó durante la prueba en el origen separado `localhost`; no viene precargado en el proyecto.

La versión final aprobó **54 pruebas y la compilación de producción**. En una pantalla de 390 × 844 se revisó el modo noche y se intercambiaron dos figuras mediante arrastre: concedió 300 puntos y consumió un movimiento. El poro ocupó su espacio sobre el tablero, sin tapar fichas. También se guardó un enlace de YouTube y se recuperó al recargar.

El poro detecta la sección más cercana a una línea situada al 30 % de la pantalla. `requestAnimationFrame` agrupa los eventos de desplazamiento en una lectura por fotograma; `ResizeObserver` repite la medición cuando el juego cambia de altura. La limpieza cancela la lectura pendiente y retira los observadores y eventos.

Estas comprobaciones no acreditan reproducción real de YouTube ni consultas con una clave de API configurada. El iframe de la vista previa quedó vacío y agotó el tiempo de espera; la búsqueda y la importación se probaron con respuestas simuladas.
