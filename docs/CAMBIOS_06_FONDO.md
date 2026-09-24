# Fondo · Estrellas y destellos suaves

Agregamos una capa de estrellas sobre el fondo existente. Conservamos el degradado, las dos luces ambientales, las imágenes y el brillo que sigue al cursor. Los colores proceden de las variables celeste, violeta y lila que ya cambian con el modo día/noche.

## Archivos

- `src/components/effects/InteractiveBackground.jsx`: conserva el seguimiento del cursor y dibuja las estrellas.
- `src/components/effects/starfield.css`: define sus formas, tamaños y animación.

## 1. Datos que no cambian al interactuar

La constante `stars` comienza con 32 pares de posiciones `[x, y]`. Representan porcentajes del ancho y alto de la pantalla, por lo que se adaptan al tamaño de la ventana.

La primera llamada a `.map()` transforma cada par en un objeto:

| Propiedad | Para qué sirve |
| --- | --- |
| `id` | Identificador estable para la `key` de React. |
| `x`, `y` | Posición horizontal y vertical. |
| `sparkle` | Decide si dibujamos un destello de cuatro puntas o un punto luminoso. |
| `size` | Tamaño en píxeles; los destellos son mayores que los puntos. |
| `duration` | Duración de un ciclo completo, entre ocho y catorce segundos. |
| `delay` | Desfase negativo para que las estrellas comiencen en momentos distintos de su ciclo. |
| `color` | Elige una de las variables de color existentes. |

`%` obtiene el resto de una división: por ejemplo, `index % 3 === 0` selecciona uno de cada tres elementos. Las posiciones se declaran fuera del componente para no regenerarlas con cada render. No necesitamos azar ni un temporizador de JavaScript.

## 2. De los datos a la pantalla

La segunda llamada a `stars.map()` crea un `<span>` por estrella. `style` comunica sus propiedades a CSS mediante variables como `--star-x` y `--star-duration`.

`aria-hidden="true"` marca la capa como decorativa y `pointer-events: none` permite interactuar con los controles que están por delante. Ninguna estrella recibe el foco del teclado.

La prop `animate` que ya recibía `InteractiveBackground` también controla `data-animate`. Si es `false`, las estrellas conservan su dibujo sin animarse. El efecto existente `followPointer` y su limpieza siguen funcionando como antes.

## 3. Cómo dibujamos y animamos

Los puntos usan `border-radius: 50%`; los destellos recortan un pseudoelemento con `clip-path: polygon(...)`. Son formas de CSS, sin descargar imágenes nuevas.

`currentColor` hace que la forma y su brillo hereden el color de la estrella. `translate(-50%, -50%)` centra cada figura sobre su coordenada.

`background-star-breathe` cambia suavemente la opacidad de 0.16 a 0.52 y el tamaño de 0.88 a 1.12. `ease-in-out` suaviza el inicio y el final: el destello permanece visible y no produce encendidos bruscos.

En pantallas de 600 píxeles o menos ocultamos uno de cada cuatro elementos con `:nth-child(4n)`: quedan 24 estrellas. Además, `prefers-reduced-motion: reduce` desactiva la animación desde CSS aunque la prop aún no se haya actualizado.

Para practicar, cambia una coordenada y observa su nueva posición. Después modifica una duración; un número mayor produce un destello más lento. Los textos, las fotos y las luces existentes no necesitan cambiar para hacerlo.
