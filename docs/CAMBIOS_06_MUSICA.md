# Etapa 06: una sola entrada para nuestra música

La sección Música tiene un solo campo: **¿Qué escuchamos juntos?**. Acepta el nombre de una canción, un artista, un enlace a un video o una playlist. Siempre puedes escribir en él, incluso si todavía no configuramos una clave de búsqueda.

No se agregaron canciones, playlists ni favoritos predeterminados. Tu lista existente conserva la misma clave de `localStorage`: `mirukaleta.youtube.v1`.

## Cómo cambia la interfaz según lo que escribes

| Entrada | Acciones disponibles |
| --- | --- |
| Nombre de canción o artista, sin clave | **Buscar en YouTube ↗** abre la búsqueda oficial en otra pestaña. Después puedes pegar el enlace que elijas aquí. |
| Nombre de canción o artista, con clave | **Buscar** consulta la API y muestra resultados reales dentro de la landing. |
| Enlace a un video | **Escuchar canción** y **Guardar en nuestra lista**. |
| Enlace a una playlist | **Escuchar playlist** y **Guardar en nuestra lista**; la playlist se conserva como un enlace completo. |
| Enlace a una playlist, con clave | También aparece **Importar sus canciones** para agregarlas individualmente. |

El nombre personalizado vive dentro de **Ponerle un nombre especial (opcional)**, un bloque plegable que aparece al reconocer un enlace. Ya no ocupa un campo permanente junto a otros formularios.

Sin clave no simulamos resultados de una API. El mensaje dice **Busca en YouTube y pega aquí el enlace**. Si el navegador bloquea la pestaña nueva, un enlace debajo permite abrir esa misma búsqueda manualmente.

## Qué archivos cambiaron

- `src/features/music/MusicSection.jsx`: concentra formularios, resultados, acciones y favoritos.
- `src/features/music/musicInput.js`: clasifica lo que escribes y construye la búsqueda externa.
- `tests/musicInput.test.js`: verifica entradas y enlaces de búsqueda.

La integración de reproducción que ya confirmaste en tu navegador sigue utilizando los servicios existentes. Esta parte no cambia el proveedor, los permisos del video ni el formato de la colección guardada.

## `musicInput.js`: entender antes de actuar

### `classifyMusicInput(value)`

1. `value.trim()` quita espacios al principio y al final. Si no queda texto, devuelve `kind: 'empty'`.
2. Las expresiones regulares reconocen si parece un enlace. Un título como `Amor: contigo` sigue siendo una búsqueda; `https://...` se trata como URL.
3. Enlaces habituales como `youtu.be/...` reciben el prefijo `https://` cuando lo omitiste al pegarlos.
4. `parseYouTubeUrl` reutiliza la validación existente: comprueba dominio y extrae el identificador. Así no se acepta un sitio que solo se parezca a YouTube.
5. Devuelve `kind: 'video'`, `kind: 'playlist'` o `kind: 'query'`. Si el enlace no sirve, devuelve `kind: 'invalid'` y su explicación.

La función no descarga datos, abre ventanas ni cambia React. Solo transforma una entrada en una decisión que podemos probar sin navegador.

### `youtubeSearchUrl(query)`

Valida que la búsqueda tenga entre 2 y 120 caracteres. Después crea una `URL` cuyo destino fijo es `https://www.youtube.com/results` y añade `search_query` mediante `searchParams.set`.

Esto conserva correctamente acentos, espacios y símbolos. Por ejemplo, el `&` de `Él & ella` sigue formando parte del nombre y no crea un parámetro diferente.

## `MusicSection.jsx`: un formulario y acciones contextuales

### Estado y valores derivados

| Nombre | Responsabilidad |
| --- | --- |
| `input` | Texto del único campo principal. |
| `label` | Nombre opcional que escribiste para un favorito. |
| `selection` | Resultado de `classifyMusicInput(input)`; se calcula a partir del texto actual. |
| `isLink` | Indica si podemos ofrecer escuchar y guardar. |
| `results` / `searchedTerm` | Resultados reales y consulta a la que pertenecen. |
| `externalSearch` | URL de la búsqueda externa, para mostrar un enlace alternativo. |
| `busy` | `null`, `'search'` o `'import'`; controla el aviso de progreso y el botón Cancelar. |
| `formError` | Un solo lugar para los errores del formulario. |
| `notice` | Confirmaciones y explicaciones breves. |
| `requestController` | Referencia a la consulta que todavía podemos cancelar. |

Los demás estados conservan su función: selección del reproductor, lista local y títulos actuales en memoria.

### Las funciones del formulario

- **`editInput(value)`** cancela una consulta anterior antes de cambiar el texto. También limpia resultados y avisos que pertenecían a la consulta vieja. Así, al reemplazar un nombre por una playlist, no aparecen después resultados atrasados de ese nombre.
- **`stopRequest()`** llama a `abort()`, descarta el controlador y limpia el estado de carga. No borra favoritos.
- **`startRequest(kind)`** cancela el trabajo anterior, crea un `AbortController` nuevo y marca si estamos buscando o importando.
- **`submitMusic(event)`** evita la recarga del formulario con `preventDefault()`, clasifica la entrada y elige la acción. `event.nativeEvent.submitter?.value` identifica el botón pulsado; al enviar un enlace con Enter, la acción predeterminada es escucharlo.
- **`search(term)`** abre la búsqueda oficial si no hay clave; `window.open` ocurre durante el envío del formulario, sin esperar ninguna petición. Con clave llama al servicio existente, espera resultados y comprueba que la petición no haya sido cancelada antes de mostrarlos.
- **`importSongs(url)`** espera todas las páginas antes de escribir. Si cancelas, cambias el campo o falla una página, no guarda una importación parcial. Los resultados se mezclan por identificador para evitar duplicados.
- **`saveTrack(track, ownLabel)`** conserva un favorito en el formato existente. Si ya está en la lista, lo avisa. El campo y el nombre se limpian únicamente después de guardar correctamente; si falla `localStorage`, puedes reintentar.
- **`removeTrack(key)`** quita el favorito de este navegador. No elimina contenido de una cuenta de YouTube.

### Por qué usamos un solo controlador de peticiones

Antes cada formulario mantenía su propia consulta. Ahora solo hay una intención activa en el campo. Compartir `requestController` permite detener la operación anterior cuando escribes otra cosa o pulsas Cancelar.

En `finally` comparamos `requestController.current === controller`: una petición antigua no debe quitar el indicador de carga de una petición más reciente.

### JSX: qué se muestra y por qué

- El campo principal usa `type="text"`; `type="url"` impediría enviar nombres de canciones.
- `maxLength={2000}` permite pegar enlaces largos; el límite específico de una búsqueda se revisa al buscar.
- `required` ayuda a evitar envíos vacíos. El código también valida, porque la interfaz no reemplaza la validación de las funciones.
- No hay `disabled` en el campo principal. Puedes corregirlo durante una consulta; hacerlo cancela esa consulta.
- `isLink ? ... : ...` decide qué botones mostrar. No crea formularios separados.
- `selection.kind === 'playlist' && hasYouTubeKey` muestra importación solo cuando existe una playlist y se configuró la capacidad de consultarla.
- `<details>` y `<summary>` ofrecen la etiqueta opcional plegable usando controles nativos del navegador.
- `role="status"` comunica progreso y confirmaciones; `role="alert"` comunica errores.

## Reproducción y navegación

La música continúa al recorrer las secciones y puedes pausarla desde el video. El reproductor puede llevarse y moverse por la página; el comportamiento de arrastre y reproducción lo controla `MusicPlayer.jsx`. El navegador conserva sus propias reglas sobre reproducción y pestañas.

## Cómo comprobarlo

1. Escribe el nombre de una canción sin clave configurada: debe abrir una búsqueda oficial y mostrar la indicación de pegar un enlace.
2. Pega un enlace de video: deben aparecer Escuchar y Guardar, sin formularios extra.
3. Pega una playlist: debe poder escucharse o guardarse completa sin clave. Con clave configurada aparece la importación individual.
4. Guarda un favorito con nombre opcional, recarga y verifica que sigue en la lista.
5. Con clave, inicia una consulta y cambia el texto o cancélala: no deben mostrarse resultados atrasados ni guardarse importaciones parciales.

Pruebas automáticas:

```powershell
node --test tests/musicInput.test.js tests/youtube.test.js tests/youtubePlayer.test.js
npm.cmd run build
```

Las pruebas de API usan respuestas simuladas. Que pasen no demuestra que una clave real esté habilitada ni que queden consultas disponibles en Google Cloud. La reproducción en tu navegador fue confirmada por ti; la búsqueda integrada y la importación real siguen necesitando la clave indicada en `docs/YOUTUBE.md`.
