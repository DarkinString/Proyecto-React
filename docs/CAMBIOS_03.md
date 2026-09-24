# Etapa 3: cartas, tema y música

Esta guía explica el código incorporado en la tercera etapa. Léela junto a los archivos mencionados: los fragmentos muestran las líneas esenciales y cada sección explica las funciones completas por bloques. [APRENDER.md](APRENDER.md) introduce la sintaxis. Las guías anteriores conservan las versiones históricas.

## 1. Cómo se conectan las piezas

```text
App → useTheme → atributo data-theme del documento → colores CSS
    → Header → enlaces nativos y botón de tema
    → WelcomeSection → botón de portada + LettersSection
    → MusicSection → TrackList + MusicPlayer

LettersSection ─┐
                ├→ useStoredCollection → localCollections → localStorage
MusicSection ───┘
    └→ services/audius.js → API pública de Audius
```

**Componente** significa interfaz; **hook**, lógica reutilizable conectada a React; **servicio**, funciones que consultan una API. Las utilidades de almacenamiento no necesitan React, por eso podemos probarlas por separado.

No hay backend propio. Las cartas se quedan en el navegador. Las consultas de música sí salen a Audius, que proporciona datos y audio. Más adelante un backend permitiría compartir cartas entre dispositivos; todavía no lo implementamos.

## 2. Guardar datos y recuperarlos

### Las tres claves

| Clave | Contenido |
| --- | --- |
| `mirukaleta.letters.v1` | Arreglo JSON de cartas: `id`, `title`, `body`, `createdAt`. |
| `mirukaleta.music.v1` | Arreglo JSON de canciones: `id`, `title`, `artist`, `duration`, `artwork`, `permalink`. |
| `mirukaleta.theme` | Texto `light` o `dark`. |

Una **clave** es el nombre con el que buscamos un valor. `localStorage` guarda texto: `JSON.stringify(...)` transforma arreglos y objetos en texto, y `JSON.parse(...)` hace el recorrido inverso. `v1` identifica el formato inicial de nuestras colecciones.

El almacenamiento corresponde al navegador y al **origen**: protocolo, dirección y puerto. `localhost` y `127.0.0.1` son orígenes distintos, aunque ambos abran esta computadora. Usa la misma URL de Vite para recuperar tus datos. No es un envío de cartas a la otra persona ni una copia sincronizada. Borrar los datos del sitio elimina lo guardado.

### `src/utils/localCollections.js`

**`readCollection(storage, key, validateItem)`**:

1. `getItem(key)` lee el texto. Si devuelve `null`, la colección todavía no existe y devolvemos `[]`.
2. `JSON.parse(raw)` interpreta ese texto.
3. `Array.isArray(items)` comprueba que sea una lista; `items.every(validateItem)` exige que cada elemento tenga el formato correcto.
4. Si algo falla, `throw new Error(...)` interrumpe la operación. No convertimos datos ilegibles en una lista vacía para luego sobrescribirlos.
5. Si todo es válido, `return items` entrega la colección.

**`updateCollection(storage, key, validateItem, updater)`** vuelve a leer lo guardado, calcula `next = updater(current)`, valida ese resultado, escribe con `setItem` y lo devuelve. Leer justo antes de escribir reduce el riesgo de ignorar cambios recientes de otra pestaña; no convierte el navegador en una base de datos con transacciones entre usuarios.

Recibir `storage` como parámetro permite usar el almacenamiento real en la aplicación y uno de prueba en los tests.

### `src/hooks/useStoredCollection.js`

```jsx
const [items, setItems] = useState([]);
const [storageError, setStorageError] = useState('');
```

La primera línea recuerda lo que debemos dibujar. La segunda recuerda un error visible. `useState` pertenece a la sesión actual; `localStorage` conserva el contenido después de recargar.

El **`useEffect` de lectura** define `refresh`, lo ejecuta una vez y escucha el evento `storage`. Ese evento avisa de cambios hechos desde otras pestañas del mismo origen. `refresh(event)` ignora otras claves, lee la colección y actualiza el estado, o muestra un error si no puede hacerlo.

```jsx
return () => window.removeEventListener('storage', refresh);
```

Esta es la **limpieza del efecto**: retira la escucha cuando deja de ser necesaria. `[key, validateItem]` contiene sus dependencias; si cambian, React vuelve a configurar el efecto. La pestaña que escribe actualiza su propio estado mediante `updateItems`, porque no recibe su propio evento `storage`.

**`updateItems(updater)`** usa `updateCollection`, muestra el resultado y devuelve `true` cuando pudo guardarlo. Si falla, conserva los datos anteriores, muestra un error y devuelve `false`. Está envuelta en `useCallback` para conservar la función mientras sus dependencias no cambien. Esto no guarda datos por sí mismo.

## 3. El formulario y el historial de cartas

### `src/features/letters/letterModel.js`

`LETTERS_KEY` contiene el nombre de almacenamiento. **`isLetter(value)`** devuelve un booleano: exige identificador de texto, título y cuerpo no vacíos, un máximo de 80 y 4000 caracteres respectivamente y una fecha interpretable. `Boolean(...)` convierte la comprobación en `true` o `false`.

### `src/features/letters/LettersSection.jsx`

```jsx
const { items: letters, updateItems, storageError } = useStoredCollection(LETTERS_KEY, isLetter);
```

Las llaves extraen propiedades. `items: letters` da el nombre local `letters` a la propiedad `items`. Pasamos `isLetter` como función para que el hook compruebe cada elemento cuando lea o escriba.

`title`, `body` y `notice` son estados de texto: título en edición, cuerpo en edición y mensaje de confirmación. No guardamos el borrador automáticamente.

**`saveLetter(event)`**, paso a paso:

1. `event.preventDefault()` evita la recarga normal del formulario.
2. `trim()` quita espacios de los extremos. Si título o cuerpo quedan vacíos, se muestra un aviso y `return` termina la función.
3. `crypto.randomUUID()` crea un identificador para la nueva carta. `new Date().toISOString()` guarda una fecha estándar.
4. `updateItems((current) => [letter, ...current])` crea una lista con la carta nueva al principio. `...current` expande las cartas anteriores; no las reemplaza.
5. Solo si guardar devuelve `true`, limpiamos los campos con `setTitle('')` y `setBody('')` y mostramos la confirmación. Si falla, el texto escrito permanece para poder recuperarlo.

En el formulario, `value={title}` muestra el estado y `onChange={(event) => setTitle(event.target.value)}` lo actualiza al escribir. Lo mismo ocurre con `body`. `required` y `maxLength` ayudan desde HTML; la función también valida porque los datos pueden venir del almacenamiento.

`letters.map(...)` dibuja las cartas. `key={letter.id}` permite a React reconocer cada entrada. `<details>` y `<summary>` proporcionan apertura y cierre nativos, también con teclado; ya no usamos `isLetterOpen`. `Intl.DateTimeFormat('es-MX', ...)` presenta la fecha para leerla y `<time dateTime={...}>` conserva su valor interpretable.

`whitespace-pre-wrap` mantiene los saltos de línea y `break-words` permite ajustar texto largo. `{letter.body}` muestra texto: escribir `<b>hola</b>` en una carta no lo convierte en HTML. Todavía no hay edición ni borrado de cartas en la interfaz.

`relationship.letter` permanece en el archivo de datos como texto histórico del primer ejercicio. No alimenta el formulario ni el historial actual.

## 4. Tema día y noche

### `src/hooks/useTheme.js`

**`initialTheme()`** intenta leer `mirukaleta.theme`. Solo acepta `light` o `dark`. Si no existe una preferencia válida, usa `window.matchMedia('(prefers-color-scheme: dark)')` para tomar la preferencia inicial del dispositivo. Un `try/catch` permite seguir usando la página si el navegador bloquea el almacenamiento.

```jsx
const [theme, setTheme] = useState(initialTheme);
```

Entregamos la función a React para calcular el valor inicial. No llamamos a `initialTheme()` en cada renderizado.

El **efecto dependiente de `[theme]`** coloca `data-theme` en `<html>`, define `colorScheme` para controles nativos y guarda la preferencia. Si no puede guardarla, el cambio funciona durante esa sesión. El hook no escucha cambios posteriores del tema del sistema ni los cambios de tema de otras pestañas.

**`toggleTheme()`** usa `setTheme((current) => current === 'light' ? 'dark' : 'light')`. La función recibe el estado anterior y el ternario elige el contrario. El hook devuelve `{ theme, toggleTheme }`.

### `App`, `Header` y CSS

`App` llama al hook y pasa `theme` y `onToggleTheme` a `Header`. El botón usa `onClick={onToggleTheme}` y anuncia la acción disponible: activar día o activar noche. El nombre accesible se actualiza con el estado.

En `index.css`, `:root[data-theme="dark"]` cambia variables de color. Las clases como `text-ink` y `bg-accent` mantienen su nombre y reciben los nuevos valores. `--color-on-accent` permite que el texto del botón contraste en los dos temas; `--surface`, `--field`, `--bubble` y las variables de fondo cambian paneles, campos y burbuja del poro. La opacidad de las luces baja en modo noche.

## 5. Navegación y botón de portada

Los enlaces de `Header` conservan `href="#historia"`, `#recuerdos`, `#musica` y `#juegos`. No interceptamos su clic: el navegador actualiza el fragmento de la dirección y permite regresar usando su historial.

En CSS, `scroll-behavior: smooth` suaviza esos saltos y `scroll-padding-top` deja espacio superior. La consulta `prefers-reduced-motion: reduce` y la regla `html:has([data-motion="off"])` desactivan el desplazamiento animado cuando corresponde.

La duración del desplazamiento suave la elige el navegador. No añadimos una espera que bloquee el clic antes de empezar a moverse.

El control manual de movimiento ahora está en `Footer`, como casilla «Reducir movimiento». `App` combina `motionEnabled` con la preferencia del dispositivo para calcular `animate`. Pasa `motionReduced={!animate}` para marcar la casilla, `systemReduced` para desactivarla si el dispositivo ya exige reducir movimiento y `onToggleMotion` para alternar la elección manual. La preferencia de accesibilidad del dispositivo siempre se respeta.

El **botón de portada** ejecuta `scrollToSection('historia')` mediante una función flecha. En `src/utils/scrollToSection.js`, esa función:

1. Busca la sección por identificador con `document.getElementById`.
2. Consulta movimiento reducido y la pausa manual de la página.
3. Llama a `scrollIntoView` con comportamiento `instant` o `smooth` y alineación al comienzo.

`target?.scrollIntoView(...)` usa encadenamiento opcional: si el elemento no existe, evita llamar al método. Este botón desplaza la vista sin modificar el fragmento de la dirección.

## 6. Audius: la capa que habla con internet

`src/services/audius.js` concentra la integración. La interfaz no conoce todos los campos originales de Audius; recibe un objeto pequeño y consistente.

| Función | Qué hace |
| --- | --- |
| `validId` | Acepta identificadores de 1 a 100 letras, números, guiones y guiones bajos. |
| `httpsUrl` | Interpreta una URL y acepta HTTPS sin usuario ni contraseña; devuelve texto vacío si no sirve. |
| `audiusPermalink` | Convierte rutas relativas en enlaces completos y permite enlaces a `audius.co`. |
| `normalizeTrack` | Omite canciones eliminadas, no reproducibles o con acceso restringido. Extrae identificador, título, artista, duración y enlaces. |
| `isSavedTrack` | Valida el formato interno cuando recuperamos o guardamos una canción. |
| `request` | Hace la petición común y convierte fallos de conexión, tiempo o respuesta en errores legibles. |
| `searchTracks` | Valida la búsqueda, pide hasta 20 resultados y conserva los que pasan la normalización. |
| `parsePlaylistUrl` | Acepta enlaces HTTPS de Audius, normaliza el dominio y retira parámetros y fragmentos. |
| `importPlaylist` | Resuelve el enlace, comprueba que sea playlist o álbum y obtiene sus canciones. |
| `streamUrl` | Construye la dirección de audio para un identificador válido. |
| `mergeTracks` | Une canciones sin duplicar identificadores y conserva el orden existente. |

### Peticiones, errores y cancelación

**`request(path, params, signal)`** construye una `URL` y utiliza `URLSearchParams` para codificar los parámetros, incluido `app_name: 'Mirukaleta'`, que es un nombre de aplicación y no una credencial. `fetch` consulta el servicio. Como tarda, la función es `async` y utiliza `await` para continuar cuando llegue la respuesta.

`AbortSignal.timeout(15000)` limita la espera a 15 segundos. `AbortSignal.any(...)` combina ese límite con la señal de cancelación de la interfaz. `response.ok` comprueba el estado HTTP; el código 429 recibe un mensaje específico. `response.json()` interpreta la respuesta y comprobamos que contenga `data`.

`try` contiene la operación que puede fallar; `catch` recibe su error. Un error lanzado en el servicio llega al componente para mostrarse con `role="alert"`.

**`searchTracks`** recorta los espacios, exige al menos dos caracteres, consulta `/tracks/search` y verifica que `data` sea un arreglo. `map(normalizeTrack)` convierte cada resultado y `filter(Boolean)` elimina los valores `null` de canciones descartadas. Por eso una consulta de hasta 20 resultados puede mostrar menos canciones.

### Importar una playlist

**`importPlaylist`** primero valida el enlace y consulta `/resolve`. La integración acepta el recurso como objeto o como primer elemento de un arreglo, ya que la respuesta REST observada devolvió un arreglo. Luego comprueba su identificador y `playlist_name` y consulta `/playlists/{id}/tracks`.

En esa ruta se procesa el arreglo completo recibido: no añadimos una paginación que el endpoint no documenta. El resultado incluye `received`, cantidad recibida, y `expected`, cantidad declarada si existe. El componente puede informar si llegaron menos canciones o si algunas no tenían reproducción pública. La [referencia de playlists](https://docs.audius.co/sdk/playlists/) documenta la lectura de canciones por identificador; la [referencia de resolve](https://docs.audius.co/sdk/resolve/) explica la conversión de enlaces a recursos. El contrato REST está en la [especificación oficial](https://api.audius.co/v1/swagger.yaml).

Importar copia los datos disponibles a nuestra lista local. No crea ni modifica una playlist en Audius ni la mantiene sincronizada si cambia después.

**`mergeTracks`** usa un `Map`: cada identificador puede tener una sola entrada. Primero carga las canciones actuales y después incorpora las nuevas que todavía no existen. `[...tracks.values()]` devuelve otra vez un arreglo.

### Alcance del acceso público

Esta versión usa `fetch` directamente, sin instalar el SDK ni pedir credenciales. En la comprobación del **21 de septiembre de 2026** respondieron públicamente búsqueda, resolución, canciones de playlist y streaming; la ruta de audio redirigió a una respuesta de audio 206, que entrega contenido parcial para reproducción. La [guía oficial](https://docs.audius.co/sdk/) presenta la configuración con API key. Que estos accesos funcionaran sin clave en esa fecha no garantiza que las condiciones permanezcan iguales.

El catálogo es independiente y la disponibilidad depende del contenido publicado en Audius. No incluimos canciones ni playlists predeterminadas.

## 7. La pantalla de música

En `MusicSection.jsx`, `savedTracks` viene de `useStoredCollection`. Los demás estados describen el formulario, resultados, carga, errores, avisos y canción elegida. `searched` distingue entre no haber buscado y una búsqueda válida sin resultados.

`searchController` e `importController` usan **`useRef`**. Una referencia conserva su `.current` entre renderizados sin pedir que React dibuje otra vez. Aquí guardan los controladores de peticiones pendientes. El efecto con dependencias `[]` devuelve una limpieza que cancela ambos al desmontar el componente.

### Funciones de interacción

- **`search(event)`** evita el envío normal, cancela una búsqueda anterior y crea un `AbortController`. Limpia resultados y errores, activa «Buscando…», espera `searchTracks` y muestra los datos si la petición sigue vigente. En `finally` retira la carga solo si ese controlador sigue siendo el actual. Así una respuesta antigua no pisa una búsqueda nueva.
- **`play(track)`** elige la canción e incrementa `playRequest`. Ese contador permite solicitar reproducción otra vez aunque la canción elegida sea la misma.
- **`addTrack(track)`** une una canción con la colección usando `mergeTracks` y muestra confirmación si logró guardarla.
- **`removeTrack(id)`** conserva con `filter` las canciones cuyo identificador es distinto y guarda la nueva lista. Quitarla de la lista no elimina nada en Audius ni detiene por sí mismo la canción actual.
- **`addPlaylist(event)`** captura el enlace enviado, cancela una importación previa, espera la consulta y une las canciones. Cuenta las nuevas, las omitidas y una posible respuesta incompleta. Solo limpia el campo si aún contiene el enlace que se envió: conserva una nueva URL que hayas escrito durante la espera.
- **`playNext()`** elige el elemento siguiente si existe. No vuelve al principio al terminar la última canción.

`new Set(savedTracks.map(...))` forma un conjunto de identificadores para detectar canciones ya agregadas. `findIndex` encuentra la posición de la canción actual. `hasNext` es verdadero únicamente cuando esa canción pertenece a la lista guardada y hay otra después.

## 8. Reproductor y filas de canciones

### `MusicPlayer.jsx`

`audioRef` apunta al elemento `<audio>`. El efecto depende de `track?.id` y `playRequest`; intenta `audioRef.current.play()` después de elegir una canción. Esa llamada devuelve una promesa: si el navegador no inicia la reproducción, `.catch(...)` muestra una indicación para usar los controles nativos.

La variable `cancelled` cambia a `true` en la limpieza para que el fallo tardío de un intento anterior no muestre un aviso sobre otra selección. No es el controlador de las búsquedas: cada mecanismo limpia su propia operación.

`controls` muestra los controles del navegador; `preload="none"` evita pedir una precarga anticipada. `onPlaying` limpia el error, `onError` informa un fallo del audio y `onEnded` llama a `onNext`. El botón «Siguiente en tu lista» usa la misma función y se desactiva cuando no hay siguiente.

El reproductor permanece montado al desplazarnos por las secciones: cambiar la zona visible no cambia de página ni destruye el audio. Al recargar se pierde la canción elegida y su posición, aunque la lista guardada permanezca.

### `TrackList.jsx`

**`formatDuration(seconds)`** redondea hacia abajo, divide entre 60 para obtener minutos y usa el resto `% 60` para los segundos. `padStart(2, '0')` escribe dos dígitos, por ejemplo `3:07`.

El componente recorre `tracks` y dibuja título, artista, duración, enlace a Audius y controles. Según las props, muestra «Agregar» o «Quitar». `savedIds.has(track.id)` detecta canciones ya guardadas y desactiva su botón de agregar. Los `aria-label` incluyen el título para distinguir controles de varias canciones.

## 9. Estilos y accesibilidad de esta etapa

`.surface-panel` da un fondo y borde compartidos a cartas y reproductor. `.field` unifica campos; `.button-primary` y `.button-secondary` unifican botones y su estado desactivado. Las filas musicales permiten envolver contenido para ajustarse a pantallas estrechas. Los colores proceden de variables para adaptarse al tema.

Las etiquetas permanecen visibles, los mensajes de confirmación usan `role="status"`, los errores usan `role="alert"` y el foco de teclado conserva su contorno. Los estados de carga desactivan los botones correspondientes. La carta aprovecha controles HTML nativos y el audio empieza tras una elección de quien visita la página.

## 10. Cómo ejecutar y comprobar

```powershell
npm.cmd run dev
npm.cmd test
npm.cmd run build
```

Ejecuta cada comando cuando corresponda. El servidor de desarrollo permanece activo en su terminal; usa otra para las pruebas. Abre la URL que muestra Vite, no Live Server. `npm.cmd run preview` sirve la compilación después de generar `dist/`.

El comando `test` ejecuta `node --test`. Los archivos en `tests/` comprueban el almacenamiento validado, el formato de cartas y las funciones de Audius. Esas pruebas no sustituyen reproducir audio en el navegador ni garantizan disponibilidad futura del servicio.

### Comprobación de esta etapa: 21 de septiembre de 2026

- Compilación de producción completada y 30 pruebas unitarias aprobadas.
- Carta y tema recuperados después de recargar; contenido como `<b>literal</b>` se mostró como texto.
- Búsqueda real con resultados públicos, reproducción con avance de tiempo y continuidad al navegar a Historia.
- Importación real de una playlist pública de 14 canciones.
- Revisión a 1280 px y 390 px sin desbordamiento horizontal y desplazamiento sin animación al pausar el movimiento.

Los datos de esas pruebas se utilizaron en un origen separado. La vista principal conserva sus cartas y lista iniciales vacías; las comprobaciones no añaden contenido predeterminado.

Para practicar, sigue los [ejercicios actuales](APRENDER.md#12-ejercicios-con-la-versión-actual): primero una carta, después el tema y por último una canción. Cada paso enseña una parte distinta del recorrido entre un evento, el estado, el almacenamiento y la pantalla.
