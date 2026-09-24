# Mirukaleta · Para ti

Landing romántica para aprender React juntos. La cuarta etapa incorpora un juego de combinar figuras, recuerdos coleccionables y música de YouTube. Conserva las cartas, el modo día/noche, el fondo celeste, violeta y lila y el poro que recibe porogalletas y te anima al jugar.

**Etapa 5:** ventanas arrastrables, poro que puedes llevar por la pantalla, melodía original del juego, navegación fija y carrusel con visor ampliado. La explicación está en [docs/CAMBIOS_05.md](docs/CAMBIOS_05.md).

**Etapa actual: 6.** Un solo campo musical, reproducción al recorrer secciones, arrastre mediante pulsación de dos segundos, melodía local del juego y destellos en el fondo. Explicación de funciones y decisiones en [docs/CAMBIOS_06.md](docs/CAMBIOS_06.md).

## Abrir el proyecto

Abre una terminal en esta carpeta y ejecuta:

```powershell
npm.cmd run dev
```

Abre **la URL que imprima Vite**, por ejemplo `http://127.0.0.1:5173/`. El puerto puede cambiar si está ocupado. Mantén esa terminal abierta; `Ctrl+C` detiene el servidor. Usa esta URL para ver React y Tailwind: abrir `index.html` directamente o con Live Server no ejecuta la transformación de Vite.

Si acabas de descargar el proyecto, instala primero las dependencias con `npm.cmd ci`. En otras terminales puedes escribir `npm`; usamos `npm.cmd` para evitar restricciones de scripts de PowerShell.

| Comando | Para qué sirve |
| --- | --- |
| `npm.cmd run dev` | Desarrollar y actualizar la página al guardar. |
| `npm.cmd run dev:browser` | Iniciar Vite y abrir la landing en el navegador predeterminado, fuera de la vista integrada de VS Code. |
| `npm.cmd test` | Ejecutar pruebas unitarias con el ejecutor integrado de Node. |
| `npm.cmd run build` | Generar los archivos de producción en `dist/`. |
| `npm.cmd run preview` | Revisar localmente la compilación ya generada. |

Compilar y abrir una vista previa no publica el sitio.

## Qué puedes hacer ahora

- Recorrer las secciones con los enlaces del encabezado o el botón de portada.
- Escribir cartas con título, guardarlas y abrirlas desde su historial.
- Cambiar entre modo día y noche y conservar la preferencia.
- Pegar enlaces de videos o playlists de YouTube, reproducirlos y guardarlos en tu lista local.
- Buscar música e importar videos de playlists públicas al configurar una clave de YouTube Data API v3.
- Elegir un sobrenombre y dificultad, combinar figuras y descubrir tres imágenes por niveles.
- Conseguir puntos, combos, récords de tiempo y una calificación de una a tres estrellas.
- Desbloquear imágenes en Coleccionables y volver a jugar para mejorar tus resultados.
- Alimentar al poro con clic, toque o teclado y pausar las animaciones. Se respeta el movimiento reducido del dispositivo.
- Mantener dos segundos sobre el poro o el marco del reproductor y arrastrarlos; las flechas ofrecen una alternativa con teclado.
- Escuchar «Un ratito contigo» mientras juegas, con pausa, silencio y volumen independientes.
- Recorrer los coleccionables en un carrusel y ampliar las imágenes desbloqueadas en un diálogo.

La música comienza cuando eliges un video y no se pausa por recorrer secciones, aunque el reproductor permanezca en Música. La lista inicial está vacía: no hay canciones ni playlists predeterminadas. La disponibilidad depende de los permisos de cada video. La melodía local del juego se reproduce por separado, con su propio volumen. Las tres imágenes del juego son ilustraciones provisionales propias: después las sustituiremos por fotos de la relación.

## Qué queda guardado

| Dato | Clave en `localStorage` | Al recargar |
| --- | --- | --- |
| Cartas guardadas con el formulario | `mirukaleta.letters.v1` | Se recuperan título, texto y fecha. |
| Favoritos de YouTube | `mirukaleta.youtube.v1` | Se recuperan identificadores y etiquetas propias. |
| Victorias del juego | `mirukaleta.game.records.v1` | Se recuperan marcador, estrellas y coleccionables. |
| Tema | `mirukaleta.theme` | Se aplica `light` o `dark`. |

`localStorage` pertenece a este navegador y al origen de la página: protocolo, dirección y puerto. Usa la misma URL de Vite para volver a ver tus datos. Otro navegador, dispositivo o puerto tiene su propio almacenamiento. Borrar los datos del sitio también borra estas cartas y listas.

Las cartas no se envían a otra persona y no hay una cuenta ni un backend que las sincronice. La lista guarda referencias a YouTube, no descarga audios. Los borradores, búsquedas, video actual, posición de reproducción, galletitas y partidas en curso se reinician al recargar. El marcador compara el mejor intento de cada sobrenombre para un mismo nivel y dificultad; es local.

Si falla el guardado, aparece un aviso. Una colección que no se pueda leer o validar no se sobrescribe automáticamente. Las cartas todavía no tienen controles de edición o borrado.

## Configurar YouTube

Reproducir enlaces pegados no requiere una clave propia. Sin clave, buscar un nombre abre la búsqueda oficial de YouTube en otra pestaña. Para consultar resultados dentro de la landing e importar los videos de una playlist, configura YouTube Data API v3 siguiendo [docs/YOUTUBE.md](docs/YOUTUBE.md). La variable se coloca en `.env.local`:

```dotenv
VITE_YOUTUBE_API_KEY=tu_clave
```

Reinicia Vite después de cambiarla. `.env.example` sirve como plantilla. Una variable `VITE_` se incorpora al navegador; configura las restricciones de la clave según la guía. Los favoritos antiguos de Audius permanecen en su clave anterior y no se convierten automáticamente a YouTube.

## Estructura

```text
Mirukaleta/
├── public/favicon.svg
├── src/
│   ├── app/App.jsx                    Orden y estado general de la página
│   ├── assets/
│   │   ├── images/poro/               Poro y porogalleta locales
│   │   ├── images/memories/           Ilustraciones provisionales del juego
│   │   ├── audio/                     Melodía original del juego en WAV
│   │   └── fonts/                     Reservado para fuentes locales
│   ├── components/
│   │   ├── effects/InteractiveBackground.jsx
│   │   ├── layout/Header.jsx          Enlaces y control de tema
│   │   ├── layout/Footer.jsx          Pie y control de movimiento
│   │   └── ui/Section.jsx             Marco compartido de sección
│   ├── data/
│   │   ├── relationship.js            Textos de portada
│   │   ├── poroMessages.js            Comentarios del poro
│   │   └── gameLevels.js              Imágenes y títulos de los niveles
│   ├── features/
│   │   ├── welcome/WelcomeSection.jsx Portada y formulario de cartas
│   │   ├── letters/LettersSection.jsx Formulario e historial
│   │   ├── letters/letterModel.js     Clave y validación de cartas
│   │   ├── music/MusicSection.jsx     Búsqueda, importación y lista
│   │   ├── music/MusicPlayer.jsx      Reproductor de YouTube
│   │   ├── music/TrackList.jsx        Filas de canciones y botones
│   │   ├── poro/PoroCompanion.jsx
│   │   ├── story/StorySection.jsx
│   │   ├── gallery/GallerySection.jsx
│   │   ├── games/GamesSection.jsx     Formulario, partida y resultados
│   │   ├── games/MatchBoard.jsx       Figuras, teclado y gestos
│   │   ├── games/match3.js            Motor puro de combinaciones
│   │   ├── games/useMatchGame.js      Reloj, animaciones y estado
│   │   ├── games/gameProgress.js      Victorias, premios y marcador
│   │   └── collectibles/CollectiblesSection.jsx
│   ├── hooks/
│   │   ├── useReducedMotion.js        Preferencia de movimiento
│   │   ├── useTheme.js                Tema y persistencia
│   │   ├── useStoredCollection.js     Estado conectado a localStorage
│   │   └── useGameProgress.js         Persistencia de victorias
│   ├── services/youtube.js            Enlaces, búsquedas y playlists
│   ├── utils/
│   │   ├── localCollections.js        Leer y guardar colecciones
│   │   └── scrollToSection.js         Botón de portada
│   ├── styles/index.css               Tailwind, temas y estilos
│   └── main.jsx                       Entrada de React
├── docs/
│   ├── APRENDER.md                    Fundamentos de React
│   ├── CAMBIOS_04.md                  Juego, premios y música actual
│   ├── YOUTUBE.md                     Configuración de credenciales
│   ├── CAMBIOS_03.md                  Historia: cartas, tema y Audius
│   ├── CAMBIOS_02.md                  Historia: fondo y poro
│   ├── CODIGO_EXPLICADO.md            Historia: primera versión
│   └── ASSETS_PORO.md                 Origen de las imágenes
├── tests/                            Pruebas con Node, sin red real
│   ├── localCollections.test.js
│   ├── letterModel.test.js
│   ├── gameProgress.test.js
│   ├── match3.test.js
│   └── youtube.test.js
├── .env.example
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

`node_modules/` contiene dependencias y `dist/` la compilación; se generan automáticamente. Las carpetas reservadas de assets usan `.gitkeep` para conservarse en Git. YouTube reproduce desde su servicio; no añadimos videos ni audios a los assets locales.

## Para aprender paso a paso

1. Lee [APRENDER.md](docs/APRENDER.md) para ubicar componentes, props, eventos y estado.
2. Cambia una frase de portada en `src/data/relationship.js` y guarda.
3. Escribe una carta desde la página, guárdala y recarga usando la misma URL.
4. Sigue [CAMBIOS_03.md](docs/CAMBIOS_03.md) para entender el almacenamiento de cartas.
5. Juega un nivel y lee [CAMBIOS_04.md](docs/CAMBIOS_04.md) junto al motor y sus pruebas.
6. Configura YouTube con su guía y prueba búsquedas, enlaces y tu lista propia.

Para colocar fotos reales, añádelas a `src/assets/images/memories/`, impórtalas en `src/data/gameLevels.js` y actualiza `image`, `alt` e `isPlaceholder`. Conserva los identificadores de nivel para mantener los premios ya ganados.

Usamos React con JavaScript, Vite y Tailwind 4. Los enlaces entre secciones pertenecen a una sola página: no necesitamos un enrutador. Las guías anteriores conservan sus ejemplos históricos. La propiedad `relationship.letter` también se conserva del primer ejercicio, pero la interfaz actual no la utiliza; las nuevas cartas se escriben desde el formulario.
