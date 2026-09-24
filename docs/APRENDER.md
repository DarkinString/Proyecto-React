# Aprendamos con nuestra landing

**Etapa actual: 6.** El formulario musical único, la pulsación de dos segundos, la música continua y los destellos se explican en [CAMBIOS_06.md](CAMBIOS_06.md). La navegación fija y el carrusel se explican en [CAMBIOS_05.md](CAMBIOS_05.md). El motor del juego está explicado en [CAMBIOS_04.md](CAMBIOS_04.md). Configura la búsqueda musical con [YOUTUBE.md](YOUTUBE.md). Esta guía conserva los fundamentos y ejercicios de la etapa 3; sus ejemplos de Audius describen la integración anterior.

Empieza con un texto, después entiende un componente y luego sigue el recorrido de una carta desde el formulario hasta el almacenamiento. Esta guía usa la tercera etapa. [CAMBIOS_03.md](CAMBIOS_03.md) explica sus funciones y bloques con más detalle.

[CODIGO_EXPLICADO.md](CODIGO_EXPLICADO.md) y [CAMBIOS_02.md](CAMBIOS_02.md) son documentos históricos: conservan la carta fija que se abría con `isLetterOpen`. La versión actual permite escribir varias cartas y abrirlas con `<details>` y `<summary>`.

## 1. Cómo llega el código a la pantalla

```text
index.html
  → src/main.jsx
    → src/app/App.jsx
      → Header + WelcomeSection + otras secciones + Footer + PoroCompanion
                  ↓
             LettersSection

src/styles/index.css → estilos de toda la página
src/data/relationship.js → textos de portada
```

El navegador recibe HTML. Ese HTML carga `main.jsx`. React usa el elemento `root` para mostrar `App`. Los componentes describen cada parte de la página. Vite transforma JSX y estilos para que el navegador pueda utilizarlos.

Ejecuta `npm.cmd run dev` en la carpeta del proyecto y abre la URL que indique Vite. Live Server y abrir `index.html` directamente no realizan esa transformación. Al guardar un archivo, Vite actualiza la vista.

## 2. Qué es un componente

Un componente es una función que describe una parte de la interfaz. Este ejemplo reducido enseña su forma; el `Footer` real también contiene clases y controles:

```jsx
export default function Footer() {
  return <footer>Hecho con amor.</footer>;
}
```

- `export default`: permite importar el componente desde otro archivo.
- `function Footer()`: declara una función. Un componente comienza con mayúscula.
- `{ ... }`: encierra las instrucciones de esa función.
- `return`: devuelve lo que React debe mostrar.
- `<footer>...</footer>`: es JSX, una sintaxis parecida a HTML dentro de JavaScript.
- `;`: termina la instrucción. La `}` final cierra la función.

Escribir `<Footer />` le pide a React que incluya ese componente.

## 3. Importaciones y rutas

```jsx
import Footer from '../components/layout/Footer.jsx';
```

`import` trae algo de otro archivo. `../` sube una carpeta desde el archivo actual; `./` comienza en su propia carpeta. Las rutas cambian según dónde escribas la importación.

Una importación con llaves, como `import { relationship }`, pide una exportación con ese nombre. Sin llaves importamos la exportación predeterminada. Respeta las mayúsculas y minúsculas de los nombres para que también funcione en otros sistemas.

## 4. JSX: texto y JavaScript juntos

```jsx
<p className="text-accent">{relationship.dedication}</p>
```

- `<p>` representa un párrafo y `</p>` lo cierra.
- `className` añade clases CSS; en JSX se usa en lugar de `class`.
- `text-accent` aplica nuestro color de acento.
- Las llaves dentro de JSX evalúan una expresión de JavaScript.
- `relationship.dedication` obtiene esa propiedad del objeto de textos.

Las llaves cambian de significado según su contexto: también delimitan funciones, crean objetos o extraen propiedades.

## 5. Props: datos de entrada

```jsx
<Section id="historia" number="01" title="Así comenzó lo nuestro">
  <p>Este espacio espera nuestro primer recuerdo.</p>
</Section>
```

Las **props** son los datos que recibe un componente. Aquí enviamos `id`, `number` y `title`. El contenido entre etiquetas llega en una prop especial llamada `children`.

`Section({ id, number, title, children })` extrae propiedades del objeto recibido: eso es **desestructuración**. El hijo lee las props; no las modifica directamente.

Una prop también puede ser una función. `Header` recibe `onToggleTheme` para avisar que se pulsó el control de tema. Así un botón puede cambiar un estado que vive fuera del encabezado.

## 6. Estado: la memoria del formulario

En `LettersSection.jsx` encontrarás:

```jsx
const [title, setTitle] = useState('');
```

- `const` crea una variable que no reasignamos directamente.
- `useState` es un hook de React: recuerda un valor entre renderizados.
- `''` es el texto inicial, vacío.
- Los corchetes extraen dos elementos del arreglo devuelto por `useState`.
- `title` contiene el texto actual; `setTitle` solicita actualizarlo.

Un **renderizado** es el cálculo que React hace de la interfaz con los datos actuales. Cada renderizado recibe su propio valor de `title`. No hacemos `title = 'Hola'`; usamos `setTitle('Hola')`.

```jsx
<input value={title} onChange={(event) => setTitle(event.target.value)} />
```

Este ejemplo reduce el campo real a sus dos piezas principales:

1. `value={title}` muestra el valor que recuerda React.
2. `onChange` recibe el evento de edición.
3. `event.target.value` lee el texto del campo.
4. `setTitle(...)` actualiza el estado y React vuelve a mostrarlo.

Es un **campo controlado**. `useState` no conserva datos al recargar. Para guardar las cartas utilizamos además `localStorage`.

## 7. Eventos: cuándo ejecutar una función

```jsx
<form onSubmit={saveLetter}>
```

Entregamos la función para ejecutarla cuando se envíe el formulario. Escribir `onSubmit={saveLetter()}` la ejecutaría al renderizar. `saveLetter(event)` usa `event.preventDefault()` para evitar que el envío HTML recargue la página, valida los textos y solicita guardarlos.

```jsx
onClick={() => scrollToSection('historia')}
```

Aquí hay una función flecha que se ejecuta con el clic y pasa `'historia'` a otra función. No llama a `scrollToSection` al dibujar el botón.

Otros eventos actuales son `onEnded` cuando termina una canción y `onError` si el elemento de audio falla.

## 8. Listas, condiciones y HTML accesible

```jsx
{letters.length === 0 && <p>La primera carta todavía está por escribir.</p>}
```

`===` compara; `&&` muestra el párrafo si la condición es verdadera. `letters.map(...)` construye un elemento por carta. `key={letter.id}` permite a React identificar cada una aunque cambie su posición.

Las cartas guardadas usan `<details>` con un `<summary>`: el navegador sabe abrir, cerrar y manejar ese control con teclado. No hace falta un estado React para cada apertura. La apertura no se guarda al recargar.

- `header`, `nav`, `main`, `section` y `footer` describen el papel del contenido.
- Hay un `h1` principal y títulos de sección con `h2`.
- Los enlaces usan `href="#historia"`: el navegador conserva el fragmento y su historial.
- `label` da nombre a cada campo; un placeholder no sustituye esa etiqueta.
- `type="submit"` envía un formulario; `type="button"` ejecuta otras acciones.
- `role="status"` anuncia confirmaciones y `role="alert"` señala errores.
- `aria-hidden="true"` evita anunciar adornos como corazones.
- El enlace «Saltar al contenido» y el contorno de foco ayudan con el teclado.

## 9. Hooks: una idea para cada uno

| Herramienta | Idea | Ejemplo del proyecto |
| --- | --- | --- |
| `useState` | Recordar algo que afecta a la pantalla. | Texto de una carta o canción elegida. |
| `useEffect` | Sincronizar con algo fuera del cálculo de React. | Aplicar el tema al documento o escuchar almacenamiento. |
| `useRef` | Conservar una referencia sin provocar un renderizado al cambiarla. | El elemento `<audio>` o una petición cancelable. |
| `useCallback` | Conservar una función mientras no cambien sus dependencias. | `updateItems` en el hook de almacenamiento. |

Los hooks se llaman al principio del componente o de otro hook, fuera de bucles y condiciones. La función de limpieza de un efecto retira escuchas o cancela trabajo pendiente. [CAMBIOS_03.md](CAMBIOS_03.md) explica su uso real.

## 10. Cómo leer Tailwind y los temas

```jsx
className="mt-4 whitespace-pre-wrap break-words text-base leading-7 text-ink"
```

Esta línea de las cartas añade margen, conserva saltos de línea, permite partir palabras largas, define tamaño e interlineado y usa el color del texto. Las clases sin prefijo aplican desde los anchos pequeños; `sm:` cambia un estilo desde el punto de ruptura correspondiente. Las secciones mantienen una columna.

`src/styles/index.css` define colores por su función: `--color-ink`, `--color-accent`, etc. `:root[data-theme="dark"]` cambia sus valores para la noche. El componente sigue usando `text-ink` en ambos temas.

Usamos Tailwind 4 con su plugin de Vite y `@import "tailwindcss"`. Esta configuración no necesita ejecutar `tailwindcss init`. Escribe nombres completos de clases para que Tailwind los detecte.

## 11. Dónde colocar los assets

Un **asset** es un archivo que utiliza la página: una foto, canción o fuente.

| Carpeta | Contenido | Forma de uso |
| --- | --- | --- |
| `src/assets/images/` | Imágenes locales; ya incluye el poro. | Importación desde un componente o archivo de datos. |
| `src/assets/audio/` | Reservado para futuros audios locales. | Importación al añadir una función que use esos archivos. |
| `src/assets/fonts/` | Reservado para fuentes locales. | Regla `@font-face` al incorporarlas. |
| `public/` | Archivos que conservan su nombre, como el favicon. | URL desde la raíz, por ejemplo `/favicon.svg`. |

Vite procesa los assets importados desde `src`; los de `public` se copian directamente. Los `.gitkeep` solo conservan carpetas vacías en Git.

Ejemplo futuro desde `GallerySection.jsx`, **solo después de añadir el archivo real**:

```jsx
import firstPhoto from '../../assets/images/primera-foto.webp';

// Dentro del JSX:
<img src={firstPhoto} alt="Descripción del recuerdo que aparece en la foto" />
```

`firstPhoto` recibe la URL generada por Vite; `src` indica la imagen y `alt` describe su contenido. La música actual viene por streaming de Audius: no se copia a la carpeta `audio`.

## 12. Ejercicios con la versión actual

Haz uno a la vez:

1. Cambia `dedication` en `src/data/relationship.js`, guarda y observa la portada. `relationship.letter` es un dato histórico conservado; ya no alimenta la interfaz.
2. Escribe una carta de prueba, guárdala, recarga la misma URL y abre su título. Sigue `saveLetter` para encontrar dónde se crea su identificador.
3. Escribe un título formado solo por espacios y un cuerpo válido. Observa por qué `trim()` importa aunque el campo tenga `required`.
4. Cambia a modo noche, recarga y localiza `mirukaleta.theme` en Almacenamiento local de las herramientas del navegador. Limítate a leerla mientras aprendes.
5. Busca una canción en Audius. Escúchala, agrégala a tu lista y recarga: comprueba qué se conserva. Quita la canción de prueba cuando termines.
6. Abre dos pestañas con la misma URL. Guarda una carta en una y observa cómo la otra recibe el cambio de `storage`.
7. Pulsa un enlace del encabezado y observa el `#` en la dirección. Prueba el botón de portada: desplaza mediante una función y no modifica el fragmento.

Usa textos de práctica: todavía no existe un botón para editar o borrar cartas. Puedes leer el almacenamiento para entenderlo sin borrar todos los datos del sitio.

## Documentación para seguir aprendiendo

- [Inicio rápido de React](https://react.dev/learn): componentes, JSX, props y estado.
- [Guía de Vite](https://vite.dev/guide/): desarrollo y compilación.
- [Tailwind con Vite](https://tailwindcss.com/docs/installation/using-vite): plugin e importación de CSS.
- [Nuestra tercera etapa](CAMBIOS_03.md): persistencia, temas, navegación y música sobre el código real.
