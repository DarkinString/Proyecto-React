# Música de YouTube: configuración y recorrido por el código

Esta etapa reemplaza la integración de Audius. No hay canciones ni playlists precargadas. Los enlaces anteriores de Audius permanecen intactos en su clave antigua de `localStorage`; la nueva lista usa `mirukaleta.youtube.v1`.

## 1. Integración por enlace, sin clave de datos

La sección Música tiene un solo campo, **¿Qué escuchamos juntos?**. Puedes escribir una canción o artista, o pegar un enlace a un video o playlist. Con un enlace aparecen **Escuchar** y **Guardar en nuestra lista**, más una etiqueta opcional plegable. Sin clave, escribir un nombre abre la búsqueda oficial en YouTube para que elijas y pegues aquí el enlace; el campo siempre permanece habilitado.

La integración utiliza el reproductor oficial de YouTube. Un enlace `watch` que también contenga `list` selecciona esa playlist completa; para elegir solo el video, usa su enlace sin `list`. También aceptamos enlaces `youtu.be`, YouTube Music, Shorts y transmisiones `/live/` con un identificador de video válido.

El iframe utiliza el dominio oficial `youtube-nocookie.com`, correspondiente al [modo de privacidad mejorada de YouTube](https://support.google.com/youtube/answer/171780?hl=es). Ese modo conserva los requisitos de referencia del sitio y los permisos de cada video; no garantiza que un contenido restringido se pueda ver ni elimina todos los intercambios de datos con Google.

Guardar crea un favorito local. No agrega canciones a tu cuenta de YouTube. Puedes quitar cada favorito con **Quitar**. Los títulos personalizados ayudan a reconocer tus enlaces cuando aún no hay una clave configurada.

**Estado de verificación:** confirmaste que YouTube ya reproduce en tu navegador. La búsqueda integrada y la importación individual de canciones siguen necesitando una clave real; sus pruebas automáticas utilizan respuestas simuladas. La búsqueda externa y la reproducción por enlace no necesitan esa clave.

### Si trabajas desde VS Code

VS Code es donde editamos los archivos. Para probar YouTube, abre la landing en una ventana normal de **Chrome o Edge** usando la dirección HTTP que imprime Vite. Una vista previa integrada puede tratar de otra forma las referencias del navegador; todavía no se ha confirmado que esa sea la causa de tu error.

En la terminal de VS Code, ejecuta `npm.cmd run dev` y abre la dirección que aparezca, habitualmente `http://127.0.0.1:5173/` o `http://localhost:5173/`. También puedes usar `npm.cmd run dev:browser` para pedirle a Vite que abra el navegador predeterminado. No abras `index.html` directamente con `file://` ni uses Live Server para este proyecto React.

Si la aplicación detecta que está dentro de otro marco (`window.self !== window.top`), muestra **Abrir esta página en el navegador**. El enlace conserva la referencia de navegación con `rel="noopener"`, sin `noreferrer`. Algunas vistas integradas funcionan como ventana principal y no permiten detectarlas así; que no aparezca el aviso no confirma que estés en un navegador independiente.

Si sigue fallando en Chrome o Edge con la dirección de Vite, revisa el **código exacto** que aparece en el reproductor o en el aviso. Ese código permite distinguir referencia del sitio, permisos del video y contenido privado.

## 2. Activar búsqueda integrada e importación de canciones

Para consultar resultados dentro de la landing e importar canciones individualmente necesitamos una **API key**, una clave que identifica tu proyecto de Google al consultar datos públicos. La búsqueda externa sigue disponible sin ella. No necesitamos iniciar sesión de YouTube dentro de la landing ni un secreto de OAuth para estas funciones. Google explica estos requisitos en la [introducción a YouTube Data API](https://developers.google.com/youtube/v3/getting-started).

1. Entra a [Google Cloud Console](https://console.cloud.google.com/) con tu cuenta y crea o selecciona un proyecto.
2. Abre **APIs y servicios → Biblioteca** y habilita **YouTube Data API v3**.
3. En **APIs y servicios → Credenciales**, crea una **clave de API**.
4. Edita esa clave: en restricciones de aplicación elige **Sitios web** y permite las direcciones desde las que realmente abrirás la landing. Para nuestro servidor habitual:

   ```text
   http://127.0.0.1:5173/*
   http://localhost:5173/*
   ```

5. En restricciones de API, limita la clave a **YouTube Data API v3**. Agrega el dominio de producción cuando publiquemos la página; si cambia el puerto de Vite, también actualiza la dirección autorizada.
6. En la raíz del proyecto, copia `.env.example` a `.env.local`. Escribe tu clave después del signo `=`:

   ```dotenv
   VITE_YOUTUBE_API_KEY=tu_clave_de_api
   ```

7. Detén Vite con `Ctrl+C` y vuelve a iniciarlo con `npm.cmd run dev`. Vite lee las variables al iniciar; después de publicar habría que volver a compilar.

La clave con prefijo `VITE_` forma parte del código que recibe el navegador: **no es secreta**. Por eso debe tener restricciones de sitio y API; no pongas contraseñas ni secretos OAuth en este archivo. `.env.local` ya está excluido de Git. Las restricciones siguen las [prácticas de Google para claves de API](https://docs.cloud.google.com/docs/authentication/api-keys-best-practices).

Con la clave activa podrás buscar por canción o artista y traer los videos de una playlist pública. La disponibilidad de un video sigue dependiendo de su propietario, región y permisos. Las listas privadas y «Ver más tarde» requieren otro flujo de autorización y no forman parte de esta etapa.

Las consultas consumen cuota del proyecto; consulta tus límites reales en Google Cloud. Buscamos al pulsar **Buscar**, no con cada letra. La [referencia de búsqueda](https://developers.google.com/youtube/v3/docs/search/list) explica sus parámetros y cuota actual.

## 3. Reproducción y ventana flotante

El reproductor mantiene los controles de YouTube. Mantener dos segundos sobre el título o el marco permite levantarlo y arrastrarlo; **Volver a la sección** lo regresa a Música. Es el mismo iframe, de modo que moverlo no reinicia el video. No hay un botón para activar el movimiento.

Puedes llevar la tarjeta a otro lugar con el mouse o el dedo, o enfocar su marco con Tab y moverla con las flechas. Una línea indica la espera de dos segundos y una animación de sombra y tamaño acompaña el arrastre; se desactivan al reducir movimiento. El gesto comienza fuera del video y conserva libres los controles de YouTube. El borde de la pantalla limita la posición para que puedas recuperar la tarjeta.

La música continúa al recorrer las secciones; puedes pausarla desde el video. El navegador puede aplicar sus propias reglas de reproducción o solicitar un toque inicial. Las pestañas no garantizan reproducción en segundo plano.

La música del juego y YouTube se coordinan mediante el evento local `mirukaleta:audio-start`. Si comienza la del juego, YouTube se pausa. Cuando YouTube realmente empieza a reproducir, avisa con `source: 'youtube'` para que el juego pueda pausar su música. Este evento no envía datos a ningún servidor.

YouTube no permite convertir su reproductor en audio oculto ni separar la pista de audio. El iframe mide al menos 200 × 200 píxeles, conserva sus funciones y muestra el enlace al contenido original. Consulta las [políticas de YouTube](https://developers.google.com/youtube/terms/developer-policies) y sus [funciones mínimas del reproductor](https://developers.google.com/youtube/terms/required-minimum-functionality).

## 4. Carpetas y responsabilidades

```text
src/
  services/
    youtube.js           URLs, datos públicos, favoritos y paginación
    youtubePlayer.js     Carga compartida del reproductor y mensajes de error
  features/music/
    MusicSection.jsx     Formularios, lista local y coordinación
    MusicPlayer.jsx      IFrame oficial, navegación y visibilidad
    TrackList.jsx        Filas de resultados y favoritos
    music.css            Tamaños del iframe y tarjeta flotante
tests/
  youtube.test.js         Pruebas de URLs, API, paginación y persistencia
  youtubePlayer.test.js   Origen del iframe, descarga compartida y reintentos
```

## 5. `youtube.js`, función por función

| Elemento | Qué hace y por qué |
| --- | --- |
| `API_BASE` | Fija el dominio oficial de las consultas. Un enlace pegado nunca se convierte directamente en el destino de `fetch`. |
| `VIDEO_ID`, `PLAYLIST_ID` | Expresiones regulares que revisan el formato de los identificadores. No prueban que el contenido exista: eso lo decide YouTube. |
| `configuredKey` | Lee `import.meta.env.VITE_YOUTUBE_API_KEY`. El `?.` tolera que no exista y `|| ''` utiliza una cadena vacía en ese caso. |
| `hasYouTubeKey` | Convierte la presencia de una clave en `true` o `false`; permite explicar por qué la búsqueda aún no está habilitada. No confirma que Google acepte esa clave. |
| `YOUTUBE_STORAGE_KEY` | Nombre de nuestra nueva colección local. No mezcla favoritos de proveedores distintos. |
| `entryKey(entry)` | Une tipo e identificador, por ejemplo `video:...`. React y la lista usan esa identidad estable. |
| `parseYouTubeUrl(value)` | Descompone el enlace con `URL`, comprueba HTTPS y dominio y extrae el identificador del video o de la playlist. Descarta parámetros de seguimiento al reconstruir el enlace. |
| `isSavedTrack(track)` | Verifica tipo, identificador y longitud de la etiqueta antes de leer o guardar una colección. |
| `bookmarkOf(track, label)` | Produce el favorito mínimo: `{ kind, id, label }`. Guarda la etiqueta que escribiste; no guarda claves ni la respuesta completa de Google. |
| `youtubeUrl(track)` | Reconstruye un enlace oficial a partir de datos validados. Se usa para abrir el contenido en YouTube. |
| `decodeTitle(value)` | Convierte entidades como `&amp;` a texto legible. React sigue mostrando ese texto sin interpretarlo como HTML. |
| `normalizeVideo(item)` | Unifica respuestas de búsqueda, videos y playlists; omite contenido eliminado, privado o con un bloqueo de incrustación conocido. |
| `displayTrack(bookmark, metadata)` | Prefiere tu etiqueta; si no hay etiqueta, muestra el título actual recuperado; si no hay datos, muestra el tipo y el identificador. |
| `mergeTracks(current, incoming)` | Usa un `Map` para conservar el orden y agregar solo favoritos nuevos. Importar dos veces no duplica la lista ni borra tus etiquetas. |
| `request(path, params, signal, apiKey)` | Construye la petición, añade la clave y espera JSON. Distingue errores de cuota, acceso, conexión y formato. `AbortSignal.timeout` limita la espera a 15 segundos y `AbortSignal.any` acepta también una cancelación de la interfaz. |
| `searchTracks(query, signal)` | Valida el texto y consulta `search.list` con `type=video`, `videoEmbeddable=true` y `videoSyndicated=true`. Devuelve hasta 20 resultados de esa búsqueda. |
| `importPlaylist(value, signal)` | Consulta `playlistItems.list` de 50 en 50; `nextPageToken` indica si falta otra página. Solo devuelve el resultado al terminar: un fallo intermedio no se guarda como una importación completa. |
| `fetchMetadata(bookmarks, signal)` | Recupera títulos actuales con `videos.list` y `playlists.list`, agrupando como máximo 50 identificadores por consulta. |

La importación recorre todas las páginas disponibles de la [API de elementos de playlist](https://developers.google.com/youtube/v3/docs/playlistItems/list). Tiene un botón **Cancelar**, y detecta tokens repetidos para evitar un bucle si el proveedor responde de forma incoherente.

## 6. `MusicSection.jsx`: del campo único a React

- `useState` conserva el campo principal, la etiqueta opcional, resultados, avisos y selección del reproductor. Cambiar un estado hace que React actualice la vista.
- `useStoredCollection` conserva los favoritos entre recargas. Primero comprueba y escribe la colección, luego actualiza la pantalla; si falla el almacenamiento, no presenta el guardado como exitoso.
- `metadata` contiene títulos y canales recuperados de YouTube **solo en memoria**. Al recargar se consultan de nuevo si hay clave. Así los favoritos locales son tus selecciones y etiquetas, y no una copia permanente de información de YouTube.
- El primer `useEffect` carga esos títulos cuando cambia la lista. Su `return` cancela una petición antigua para que no sobrescriba resultados nuevos.
- `useRef` conserva un `AbortController` sin provocar renders. `editInput` cancela la operación anterior cuando modificas el campo; `stopRequest` y `startRequest` coordinan búsqueda e importación.
- `play` elige el video y aumenta `playRequest`. Ese número permite volver a solicitar reproducción del mismo video. También lleva la vista al reproductor, salvo que ya esté flotando, y respeta la preferencia de movimiento.
- `submitMusic` utiliza `preventDefault()` para que el formulario no recargue la página. Clasifica el texto y usa `submitter.value` para identificar si se pulsó escuchar, guardar o importar.
- `search` abre la búsqueda oficial de YouTube cuando no hay clave. Con clave, muestra carga, espera resultados reales y limpia la carga en `finally`.
- `importSongs` espera todas las páginas antes de guardar. Aparece como acción solo con un enlace de playlist y una clave configurada. Calcula cuántos elementos nuevos entraron y explica si hubo repetidos o videos no disponibles.
- `saveTrack` y `removeTrack` actualizan favoritos locales. No modifican ninguna playlist de una cuenta de YouTube.
- `currentIndex`, `hasNext` y `hasPrevious` conectan los botones del reproductor con la posición en nuestra lista.
- El formulario usa `label` y `htmlFor` para asociar instrucciones y campos; `required` y `maxLength` ayudan a validar; `role="status"` comunica progreso y `role="alert"` comunica errores a lectores de pantalla. El campo principal es de tipo texto para aceptar tanto nombres como enlaces.

El recorrido detallado de cada función y la clasificación de entradas está en [CAMBIOS_06_MUSICA.md](./CAMBIOS_06_MUSICA.md).

## 7. `MusicPlayer.jsx` y `youtubePlayer.js`

`loadYouTubePlayer()` devuelve una **Promise**: una promesa de que el script oficial estará listo. Comparte la misma descarga entre montajes. Esto importa porque `StrictMode` de React puede montar, limpiar y volver a montar efectos durante desarrollo. Si el script falla, limpia su intento y permite reintentar.

`youtubeEmbedUrl(track, siteOrigin)` prepara la dirección inicial del iframe. Comprueba el video o la playlist y acepta únicamente el origen HTTP/HTTPS real de la página. Abrir `index.html` directamente como archivo no proporciona un origen web válido: por eso utilizamos Vite. Esta validación no fabrica una referencia ni evita restricciones de YouTube.

El componente guarda el objeto de YouTube en `playerRef`, porque es un controlador externo a React. `hostRef` señala el contenedor que React administra. Creamos un `div` interior mediante `document.createElement('div')` y lo entregamos a `new YT.Player(mount, { ...options, events })`. YouTube reemplaza ese nodo interior por su iframe y administra su conexión con la API, mientras React conserva el contenedor exterior.

El primer efecto crea el reproductor únicamente después de elegir contenido. `host` selecciona `https://www.youtube-nocookie.com`; `videoId` entrega el identificador si elegiste un video; `playerVars` configura controles, reproducción en línea, `autoplay=0`, origen real y, cuando corresponde, la playlist. El `<meta name="referrer" content="strict-origin-when-cross-origin">` de `index.html` establece la política de referencia antes de que YouTube cree el iframe. El título accesible del iframe se establece cuando la API informa que está lista. Los eventos del proveedor coordinan el estado:

Sus dependencias incluyen el tipo y el identificador del enlace. Elegir otro contenido reemplaza el iframe anterior incluso si nunca llegó a `onReady`; reintentar reconstruye el enlace actual. Activar el modo flotante conserva el mismo iframe.

| Evento o bloque | Explicación |
| --- | --- |
| `onReady` | Cancela el temporizador, marca el reproductor como listo, asigna el título accesible y solicita reproducir. La configuración inicial ya contiene la selección, así que no vuelve a cargar el mismo video. |
| `onStateChange` | Informa reproducción, pausa y final. Al terminar un video de nuestra lista, avanza si existe otro. Una playlist de YouTube mantiene su propia secuencia. |
| `onError` | Conserva el código y traduce el problema: privado, eliminado, incrustación deshabilitada o identificación del sitio. Cancela el temporizador para que un mensaje genérico no sustituya al error preciso. |
| `onAutoplayBlocked` | Explica que hace falta pulsar reproducir dentro del iframe. |
| Temporizador de carga | Muestra un error y ofrece reintentar si el iframe no informa que está listo en 20 segundos. El aviso no demuestra cuál fue la causa del fallo. |
| Limpieza del efecto | Cancela temporizadores y destruye el reproductor al desmontar para no dejar sonido ni objetos huérfanos. |
| Cambio de selección | Destruye la instancia anterior y construye el iframe con la nueva selección, incluso si el anterior nunca llegó a estar listo. `playerReadyRef` se limpia inmediatamente para no enviar comandos a una instancia retirada. |
| `playRequest` | Permite volver a solicitar reproducción de la misma selección. Si está lista, llama a `playVideo()` y conserva el punto de reproducción. |
| `floating` | Cambia únicamente la clase CSS que posiciona la tarjeta. El iframe sigue montado. |
| `useFloatingDrag` | Comparte el comportamiento de arrastre con otros elementos de la página. Su `ref` señala la tarjeta, `style` aplica sus coordenadas y `handleProps` conecta el marco que se puede arrastrar tras dos segundos. Ignora botones, campos y enlaces interiores. Al volver a la sección, `reset()` descarta la posición flotante. |

Estas funciones y eventos corresponden a la [referencia oficial de IFrame Player API](https://developers.google.com/youtube/iframe_api_reference). No utilizamos extracción de audio, descargas ni un reproductor de terceros.

## 8. `TrackList.jsx` y estilos

`tracks.map(...)` crea una fila por entrada. `key={entryKey(track)}` ayuda a React a seguir cada fila cuando cambia la lista. Los botones invocan funciones recibidas por props: la fila presenta contenido; `MusicSection` decide qué hacer con él.

`onAdd` existe para resultados de búsqueda; `onRemove` existe para favoritos. Esa diferencia reutiliza el mismo componente sin copiar todas las filas. El botón Agregar se desactiva si el favorito ya está guardado.

En `music.css`, `aspect-ratio: 16 / 9` mantiene una proporción cómoda y `min-height: 200px` protege el tamaño mínimo en móviles. El contenedor interior ocupa todo el espacio. `position: fixed` permite que la tarjeta flotante acompañe el scroll; `z-index` la coloca sobre el contenido. Los colores reutilizan las variables de día y noche de la landing.

`data-holding` indica la espera y `data-dragging` activa el realce mientras se mueve. `touch-action: none` en los títulos y la indicación del gesto evita que arrastrar con el dedo compita con el scroll. El resto de la tarjeta admite desplazamiento vertical para alcanzar controles si la pantalla es baja. Las transiciones afectan sombra, borde y tamaño: las coordenadas siguen al puntero directamente.

## 9. Cómo verificar esta etapa

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

Las 22 pruebas automáticas de `tests/youtube.test.js` y `tests/youtubePlayer.test.js` pasan sin consultar YouTube. Verifican enlaces válidos e impostores, favoritos sin datos extra, duplicados, filtros de disponibilidad, solicitudes, páginas múltiples, errores, cancelación, construcción del iframe y recuperación de la descarga de la API. No reproducen videos ni validan credenciales reales.

La clave real se configura localmente. Hasta entonces, **búsqueda e importación reales con Google quedan pendientes de credenciales**; sus rutas se prueban con respuestas simuladas.

**Confirmaste reproducción real en tu navegador.** El enlace **Abrir en YouTube** permite consultar el contenido original cuando un video no autorice incrustación o no esté disponible. Esa confirmación no sustituye la comprobación de la búsqueda integrada con una clave real.

Para continuar la comprobación, abre Vite en tu navegador habitual, pega un video que permita incrustación y pulsa reproducir dentro del iframe. Después de configurar la clave, busca una canción e importa una playlist pública pequeña; vuelve a cargar la página y confirma que siguen tus favoritos.

### Distinguir errores

- **Código 153:** YouTube no recibió una identificación válida del sitio, como la cabecera HTTP `Referer`. El meta `referrer` de la página conserva la política `strict-origin-when-cross-origin`; una restricción del navegador o del entorno puede impedir el envío de la referencia. Si estás usando la vista integrada de VS Code, prueba la dirección HTTP de Vite en Chrome o Edge. Una clave de búsqueda no corrige este error. Abrir el enlace del iframe directamente en una pestaña tampoco reproduce las mismas condiciones de referencia de una página que lo incrusta.
- **Código 100:** el contenido es privado o fue eliminado.
- **Código 101 o 150:** el propietario no permite verlo incrustado. Usa **Abrir en YouTube** o elige otro video.
- **Espera agotada:** la API o el iframe no confirmó que estuviera listo. No es un diagnóstico de credenciales ni demuestra un error concreto del video. **Reintentar reproductor** inicia otra instancia; elegir otro enlace también reemplaza la instancia anterior.
