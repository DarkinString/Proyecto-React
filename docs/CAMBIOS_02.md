# Etapa 2 · Un fondo continuo y nuestro poro

Esta guía explica las funciones y estilos añadidos o modificados. Los números de línea corresponden a la segunda versión. Las líneas vacías separan ideas; `//` y `/* */` son comentarios; las llaves y etiquetas de cierre terminan el bloque que abrieron.

## Qué cambió

1. Todas las secciones, incluida la portada y su carta, están una debajo de otra.
2. Un solo fondo fijo combina celeste, violeta y lila. Sus luces se mueven lentamente y una zona iluminada sigue al ratón.
3. El poro permanece en una esquina al desplazarnos. Su mensaje depende de la sección visible.
4. Sobre el poro, el ratón se representa con una porogalleta. Clic, toque, Enter o espacio lo alimentan.
5. Un botón permite pausar el movimiento. También respetamos la preferencia del dispositivo de reducir animaciones.

Los datos de la relación todavía no se han proporcionado. Las frases del poro son generales y editables en `src/data/poroMessages.js`. El personaje no genera respuestas con inteligencia artificial durante la visita: elige textos locales según la sección y la acción.

## Mapa de responsabilidades

```text
App
├── useReducedMotion → consulta una preferencia del navegador
├── InteractiveBackground → luces y posición del puntero
├── Header → enlaces y control de movimiento
├── main → portada, historia, recuerdos, música, juegos
├── Footer
└── PoroCompanion
    ├── poroMessages → comentario de cada sección
    ├── feedingMessages → respuesta al comer
    └── imágenes PNG → poro y cursor de porogalleta
```

## 1. Dos conceptos nuevos: efectos y referencias

**`useEffect`** conecta un componente con algo externo a React, como los eventos de la ventana o un observador del navegador. La función que devuelve el efecto sirve para desconectarlo cuando corresponde. Esto evita duplicar escuchas o dejar temporizadores activos al desmontar un componente. [Referencia de React](https://react.dev/reference/react/useEffect).

**`useRef`** conserva un valor entre renderizados, dentro de `.current`, sin provocar un nuevo render al cambiarlo. Aquí lo usamos para guardar el identificador de un temporizador y referencias a elementos visuales. Las posiciones de las luces y la galleta cambian directamente en sus estilos; el contenido y el estado de la aplicación siguen controlados por React. [Referencia de React](https://react.dev/reference/react/useRef).

```jsx
const feedingTimeout = useRef(null);
```

`null` indica que aún no hay un temporizador. Después `.current` guarda el identificador que entrega `setTimeout`; así podemos cancelar exactamente ese temporizador.

## 2. `src/app/App.jsx`

| Línea | Explicación |
| --- | --- |
| 1 | Importa `useState` para guardar la elección de movimiento. |
| 2–3 | Importan encabezado y pie de página, respectivamente. |
| 4 | Importa el fondo interactivo. |
| 5 | Importa el compañero poro. |
| 6 | Importa nuestro hook de movimiento reducido. |
| 7–11 | Importan, en orden, portada, historia, galería, música y juegos. |
| 13 | Comentario que explica que `App` organiza la página. |
| 14 | Declara y exporta el componente. |
| 15 | Inicia la elección manual de movimiento en `true`. |
| 16 | Lee si el dispositivo prefiere movimiento reducido. |
| 17 | `&&` exige que ambas condiciones se cumplan: elección activada y preferencia reducida desactivada. `!` invierte el segundo valor. |
| 19 | Comienza el JSX devuelto. |
| 20 | Crea el contenedor general. `data-motion` toma `on` u `off`; CSS lee ese atributo para decidir si anima. |
| 21 | Renderiza el fondo y le pasa la prop `animate`. |
| 22 | Conserva el enlace para saltar la navegación con teclado. |
| 23–27 | Renderizan `Header`: las líneas 24 y 25 le pasan las preferencias; la 26 entrega una función que invierte la elección manual. |
| 28 | Abre el contenido principal. `page-content` permite reservar espacio lateral al poro en escritorio. |
| 29–33 | Renderizan las cinco secciones una tras otra. Quitamos la cuadrícula del padre: ya no hay dos columnas de capítulos. |
| 34 | Cierra `main`. |
| 35 | Renderiza el pie. |
| 36 | Renderiza un solo poro fuera de las secciones; no se reinicia al cambiar de capítulo. |
| 37–39 | Cierran el contenedor, el `return` y la función. |

Un atributo `data-*` guarda información propia de la página en un elemento HTML. No tiene conducta automática: nosotros decidimos cómo leerlo desde CSS o JavaScript.

## 3. `src/hooks/useReducedMotion.js`

| Línea | Explicación |
| --- | --- |
| 1 | Importa los hooks de efectos y estado. |
| 3 | Comentario: explica por qué compartimos esta lógica. |
| 4 | Declara nuestro hook. El prefijo `use` identifica una función que utiliza hooks de React. |
| 5–7 | Crean el estado. La función flecha de la línea 6 consulta `matchMedia` al inicializar y devuelve `.matches`, un booleano. |
| 9 | Abre el efecto que seguirá cambios en la preferencia. |
| 10 | Obtiene el objeto que representa la consulta de movimiento reducido. |
| 11 | Declara `updatePreference`. |
| 12 | Copia el valor actual de `.matches` al estado. |
| 13 | Cierra la función. |
| 14 | Sincroniza la preferencia al activar el efecto. |
| 15 | Escucha el evento `change`, por si se modifica la preferencia con la página abierta. |
| 16 | Devuelve la limpieza: retira exactamente esa función del evento. |
| 17 | Cierra el efecto. `[]` indica que no depende de valores cambiantes del componente. |
| 19 | Devuelve el booleano para que `App` lo utilice. |
| 20 | Cierra el hook. |

Este proyecto se renderiza en el navegador con Vite. Si más adelante añadimos renderizado en servidor, revisaremos el acceso inicial a `window`, porque no existe en ese entorno.

## 4. `src/components/effects/InteractiveBackground.jsx`

| Línea | Explicación |
| --- | --- |
| 1 | Importa `useEffect` y `useRef`. |
| 3 | Declara el componente y recibe `animate`. |
| 4 | Prepara la referencia al contenedor del fondo. |
| 6 | Abre el efecto. |
| 7 | Si las animaciones están desactivadas, termina sin añadir eventos. |
| 8 | Guarda el identificador del próximo fotograma programado; `let` permite reasignarlo. |
| 10 | Declara `followPointer`, que recibe el evento del puntero. |
| 11 | Ignora eventos que no procedan de un ratón. El desplazamiento táctil conserva su función normal. |
| 12 | Cancela una actualización pendiente si acaba de llegar una posición más reciente. |
| 13 | Programa el cambio visual para el próximo fotograma con `requestAnimationFrame`. |
| 14 | Guarda la coordenada horizontal en la variable CSS `--pointer-x`. `?.` evita acceder a un elemento ausente; la plantilla de texto añade `px`. |
| 15 | Hace lo mismo con la posición vertical y `--pointer-y`. |
| 16–17 | Cierran la función del fotograma y `followPointer`. |
| 19 | Escucha `pointermove`. `passive: true` comunica que no cancelaremos la acción predeterminada del evento. |
| 20 | Comienza la función de limpieza. |
| 21 | Retira la escucha de movimiento. |
| 22 | Cancela un fotograma pendiente. |
| 23 | Cierra la limpieza. |
| 24 | Declara `[animate]` como dependencia. Cambiarla provoca limpieza y nueva configuración. |
| 26 | Comienza el JSX. |
| 27 | Conecta el elemento a la referencia y lo declara decorativo con `aria-hidden`. |
| 28 | Crea la luz celeste. |
| 29 | Crea la luz lila. |
| 30 | Crea el brillo cuya posición depende del puntero. |
| 31–33 | Cierran contenedor, `return` y componente. |

El fondo no necesita estado de React para cada píxel recorrido. Solo actualizamos dos variables CSS y dejamos que el navegador dibuje el degradado.

## 5. `src/features/poro/PoroCompanion.jsx`

### Estado y observación del capítulo

| Línea | Explicación |
| --- | --- |
| 1 | Importa efecto, referencia y estado. |
| 2 | Importa la URL del PNG transparente del poro. Vite se encarga de resolverla. |
| 3 | Importa la URL de la porogalleta. |
| 4 | Importa comentarios por sección y respuestas al comer. |
| 6 | Declara el componente. |
| 7 | Guarda la sección activa; comienza en `inicio`. |
| 8 | Guarda el número de galletitas recibidas; comienza en cero. |
| 9 | Guarda si está comiendo; comienza en `false`. |
| 10 | Guarda una referencia al temporizador de alimentación. |
| 11 | Guarda una referencia a la imagen que sustituye visualmente al cursor. |
| 13 | Abre el efecto de detección de capítulos. |
| 14 | Selecciona los elementos marcados con `data-poro-section`. |
| 15 | Declara una variable reasignable para el observador. |
| 17 | Declara `observeSections`, que configura o vuelve a configurar la observación. |
| 18 | Desconecta el observador previo, si existe. `?.` permite la primera ejecución sin error. |
| 19 | Comentario que explica por qué calculamos márgenes en píxeles. |
| 20 | Calcula un margen superior equivalente al 15% de la altura de ventana. |
| 21 | Calcula un margen inferior equivalente al 55% de esa altura. |
| 22 | Crea `IntersectionObserver` y su función de respuesta. El navegador avisa al cambiar las intersecciones. |
| 23 | Recorre las entradas notificadas. |
| 24 | Si una sección intersecta la franja de lectura, guarda su `id` como sección activa. |
| 25 | Cierra el recorrido. |
| 26 | Define los márgenes superior, derecho, inferior e izquierdo. Los negativos reducen la zona observada. `threshold: 0` detecta la entrada o salida del borde. |
| 27 | Registra cada sección en el observador. |
| 28 | Cierra `observeSections`. |
| 30 | Ejecuta la primera configuración. |
| 31 | Vuelve a calcularla si cambia el tamaño de la ventana. |
| 32 | Abre la limpieza del efecto. |
| 33 | Desconecta el observador. |
| 34 | Retira la escucha de redimensionamiento. |
| 35–36 | Cierran limpieza y efecto; no hay dependencias variables. |

La franja útil va aproximadamente desde el 15% hasta el 45% de la altura de la ventana. Al pasar un capítulo por ella, el poro cambia de frase. Utilizamos píxeles calculados desde `innerHeight` porque los porcentajes de `rootMargin` se resuelven respecto al ancho de la raíz. [Especificación de Intersection Observer](https://www.w3.org/TR/intersection-observer/#dom-intersectionobserver-rootmargin).

### Alimentar y representar el cursor

| Línea | Explicación |
| --- | --- |
| 38–40 | Registran una limpieza que cancela el temporizador de alimentación cuando se desmonta el componente. |
| 42 | Declara `feedPoro`, la acción de alimentar. |
| 43 | Suma una galletita a partir del valor anterior. |
| 44 | Activa el estado de comer. |
| 45 | Cancela el temporizador anterior para que una galleta reciente tenga su reacción completa. |
| 46 | Programa terminar de comer dentro de 2400 milisegundos y guarda ese temporizador. La función flecha es la acción futura. |
| 47 | Cierra `feedPoro`. |
| 49 | Comentario que explica por qué no guardamos coordenadas en estado. |
| 50 | Declara `moveCookie`, que recibe un evento de puntero. |
| 51 | Guarda el tipo de puntero en `data-pointer` del botón. `currentTarget` es el botón que tiene el manejador. |
| 52 | Termina si no es un ratón o aún no existe la imagen. `||` significa «o». |
| 53 | Coloca el borde izquierdo de la galleta en la coordenada horizontal del puntero. CSS la centra sobre ese punto. |
| 54 | Hace lo mismo con la coordenada vertical. |
| 55 | Cierra `moveCookie`. |
| 57 | Declara `hideCookie`. |
| 58 | Limpia el tipo de puntero para que CSS oculte la galleta al salir o cancelar un gesto. |
| 59 | Cierra la función. |
| 61–63 | Calculan el mensaje. Al comer se usa una respuesta de `feedingMessages`; de lo contrario, el comentario de la sección. `??` vuelve al saludo inicial si no existe la clave. |

En la línea 62, `(snacks - 1) % feedingMessages.length` recorre las respuestas de forma circular. Los índices empiezan en cero; `%` calcula el resto. Con tres mensajes, las primeras cuatro galletas eligen índices 0, 1, 2 y 0. La rama de comer solo se activa después de recibir una galleta.

Los eventos de puntero permiten distinguir ratón, toque y lápiz. Comprobar `pointerType` evita mostrar un cursor de ratón en una pantalla táctil, incluso en equipos con ambos dispositivos.

### El JSX del poro

| Línea | Explicación |
| --- | --- |
| 65 | Comienza la interfaz devuelta. |
| 66 | Abre un `aside` con un nombre accesible; representa contenido complementario. |
| 67 | Abre el globo de texto. |
| 68 | Muestra su título. |
| 69 | Muestra el mensaje calculado. |
| 70 | Cierra el globo. |
| 71 | Agrupa el botón y la información de alimentación. |
| 72–73 | Abren un botón nativo de acción. Funciona con ratón, toque y teclado. |
| 74 | Conecta el clic con `feedPoro`. |
| 75 | Posiciona la galleta al entrar el puntero en el botón. |
| 76 | Actualiza su posición mientras se mueve. |
| 77 | Oculta la galleta cuando el puntero sale. |
| 78 | También la oculta si el navegador cancela el gesto. |
| 79 | Asigna la clase que controla el tamaño y la interacción. |
| 80 | Expone el estado de comer a CSS como `data-eating`. |
| 81 | Da un nombre accesible al botón aunque su contenido principal sea una imagen. |
| 82 | Relaciona el botón con sus instrucciones visibles. |
| 83 | Termina de abrir la etiqueta del botón. |
| 84 | Muestra el poro. El `alt` vacío evita repetir el nombre ya comunicado por el botón. Las dimensiones reservan espacio y `draggable="false"` evita arrastrar la imagen. |
| 85 | Añade la imagen decorativa del cursor, de 40 × 40 píxeles, y conecta `cookieRef`. |
| 86 | Mientras come, muestra un corazón. `key={snacks}` permite que cada galleta produzca un nuevo corazón. |
| 87 | Cierra el botón. |
| 88 | Muestra instrucciones válidas tanto para ratón como para toque. |
| 89 | Muestra el contador actual. |
| 90 | Cierra el grupo de acciones. |
| 91 | Anuncia el resultado de alimentar a lectores de pantalla. `sr-only` oculta el texto visualmente, y el ternario ajusta singular y plural. |
| 92–94 | Cierran `aside`, `return` y componente. |

El mensaje de cada capítulo no es una región de anuncio automático: así no interrumpe continuamente la lectura asistida al desplazarse. El resultado de una acción explícita de alimentar sí se anuncia con `role="status"`.

## 6. `src/data/poroMessages.js`

| Línea | Explicación |
| --- | --- |
| 1–2 | Aclaran que los textos esperan datos reales y que cada clave coincide con un identificador HTML. |
| 3 | Exporta el objeto de comentarios por sección. |
| 4 | Saludo de la portada. |
| 5 | Comentario de historia. |
| 6 | Comentario de recuerdos. |
| 7 | Comentario de música. |
| 8 | Comentario de juegos. |
| 9 | Cierra el objeto. |
| 11 | Exporta el arreglo de respuestas al comer. |
| 12–14 | Sus tres elementos son los textos que alternan al alimentar. |
| 15 | Cierra el arreglo. |

**Tu próxima práctica:** cambia solo el valor de `historia`, guarda y desplázate a ese capítulo. Conserva el nombre de la clave y escribe una frase breve con un dato real de ustedes.

## 7. Cambios en los componentes existentes

### `Header.jsx`

Las líneas 1–6 siguen declarando enlaces. En la línea 8 recibe ahora tres props: elección de movimiento, preferencia del dispositivo y función para alternar. Las líneas 9–19 conservan encabezado y navegación, con el nuevo acento violeta y borde semitransparente.

| Línea | Explicación del nuevo control |
| --- | --- |
| 20 | Abre el botón. |
| 21 | Declara que ejecuta una acción. |
| 22 | Entrega a `onClick` la función recibida desde `App`. |
| 23 | Desactiva el botón si el dispositivo pidió reducir el movimiento. |
| 24 | Comunica si el movimiento está activo mediante `aria-pressed`. |
| 25 | Aplica altura mínima, borde, redondeado y colores. `disabled:cursor-default` evita sugerir que un botón desactivado puede pulsarse. |
| 26 | Termina la apertura del botón. |
| 27 | Elige entre «Movimiento reducido», «Pausar movimiento» y «Activar movimiento». Son dos ternarios anidados. |
| 28 | Cierra el botón. |
| 29–32 | Cierran contenedor, encabezado, `return` y componente. |

### `Section.jsx`

Las líneas 1–3 conservan comentario, declaración con props y `return`. La línea 4 incorpora `data-poro-section`, que permite al poro reconocerla, y `story-section`, que le da altura mínima. Mantiene el título accesible, el margen de navegación, un separador y más espacio vertical. La línea 5 muestra el número; la 6, el título; la 7, los hijos con ancho de lectura limitado. Las líneas 8–10 cierran sección, `return` y función.

### `WelcomeSection.jsx`

Las líneas 1–10 mantienen las importaciones, estado y función de la carta. En la línea 12 comienza su JSX.

| Línea | Explicación actual |
| --- | --- |
| 13 | La portada usa flujo vertical con `space-y-12` y la marca `data-poro-section`. |
| 14 | Abre el grupo de dedicatoria y título. |
| 15 | Muestra la dedicatoria en violeta. |
| 16 | Muestra el título con ancho máximo de 48rem, tamaño de 3rem y de 4.5rem desde `sm`. |
| 17 | Muestra la introducción con ancho máximo de 36rem. |
| 18 | Conserva el enlace a historia, ahora con el nuevo acento. |
| 19 | Cierra el grupo de textos. |
| 20 | Abre la carta con un fondo blanco al 35%, borde claro y esquinas suaves: el fondo general sigue siendo visible. |
| 21 | Integra el corazón decorativo en el rótulo de la carta. |
| 22 | Muestra el título de la carta con margen superior. |
| 23 | Muestra su introducción en el color secundario. |
| 24–28 | Abren el botón y conservan tipo, clic y relación accesible con la carta. |
| 29 | Aplica botón violeta, texto blanco, esquinas redondas y un cambio de color al pasar el cursor. |
| 30–32 | Terminan la apertura, muestran el texto según el estado y cierran el botón. |
| 33 | Conserva el contenido con `hidden`; actualiza el color del separador. |
| 34 | Muestra el texto de la carta. |
| 35–39 | Cierran contenido, panel, sección, `return` y componente. |

### Galería, música, juegos, pie y favicon

- `GallerySection.jsx`, línea 6: la zona pendiente de foto tiene altura mínima de 13rem, esquinas redondeadas, borde violeta discontinuo y fondo blanco al 20%.
- `MusicSection.jsx` y `GamesSection.jsx`, línea 7: el texto «Próximamente» usa `text-accent` en lugar del color anterior. Su lógica no cambia.
- `Footer.jsx`, línea 3: añade `page-footer` para reservar espacio al poro y ajusta la transparencia del borde.
- `public/favicon.svg`, líneas 2–3: el fondo ahora es violeta y el corazón celeste. Se conserva el mismo dibujo vectorial.

## 8. `src/styles/index.css`, por bloques y propiedades

Las clases de Tailwind siguen resolviendo la distribución sencilla. CSS propio describe las capas, animaciones y estados del poro. Un selector seguido de `{` abre una regla; `}` la termina. Las comas en una lista de selectores aplican las mismas propiedades a varios elementos.

### Tema y reglas base · líneas 1–29

La línea 1 importa Tailwind. La 3 explica el tema y la 4 lo abre. Las líneas 5–12 declaran, respectivamente, los colores `paper`, `accent`, `violet`, `sky`, `lilac`, `ink`, `muted` y `line`. Las líneas 13–14 conservan las fuentes y la 15 cierra el tema.

Las líneas 17–23 abren la capa base y las reglas del cuerpo: eliminan margen (19), fijan fondo (20), color (21) y fuente (22). Las líneas 25–28 conservan el contorno visible de foco: 3px del color actual y 5px de separación. La 29 cierra la capa.

### Fondo y separación · líneas 31–84

| Líneas | Propiedades y razón |
| --- | --- |
| 31–34 | `.page-shell`: `isolation: isolate` crea un contexto propio de capas; `min-height: 100svh` llena como mínimo la altura pequeña del viewport. |
| 36–43 | `.interactive-background`: `fixed` lo conserva en la ventana; `inset: 0` cubre sus cuatro bordes; `z-index: -1` lo coloca detrás dentro del contexto; `overflow: hidden` recorta luces; `pointer-events: none` deja pasar interacciones; `linear-gradient` combina los tres tonos en diagonal. |
| 45–53 | `.ambient-light`: posición absoluta, ancho limitado con `min`, relación cuadrada con `aspect-ratio`, círculo con `border-radius`, desenfoque de 55px y opacidad 0.6. La animación `drift` dura 18s, acelera y frena suavemente, se repite y alterna dirección. |
| 55–59 | La luz celeste empieza parcialmente fuera por arriba e izquierda. Su degradado radial se vuelve transparente al 70% del recorrido. |
| 61–66 | La luz lila empieza parcialmente fuera por derecha y abajo. El retraso negativo de 9s hace que su animación comience en una fase distinta. |
| 68–72 | `.pointer-glow` ocupa el fondo y dibuja un degradado circular de 24rem en `--pointer-x` / `--pointer-y`; usa 35% y 30% si aún no hay coordenadas. El blanco incluye transparencia. |
| 74–76 | `min-height: 23rem` da a cada capítulo su propio espacio, incluso antes de añadir recuerdos. |
| 78–80 | Una sombra muy tenue distingue la carta sin tapar el fondo. |
| 82–84 | El pie reserva 15rem adicionales en pantallas pequeñas para poder desplazar el último contenido por encima del poro fijo. |

### Compañero, globo y botón · líneas 86–130

| Líneas | Propiedades y razón |
| --- | --- |
| 86–96 | `.poro-companion`: `fixed` lo mantiene visible; `z-index: 20` lo coloca encima; `max` y `env` respetan márgenes y áreas seguras; `flex` ordena globo y personaje; `align-items` los centra; `gap` los separa; `min` limita el ancho; `pointer-events: none` deja pasar clics fuera del botón. |
| 98–107 | `.poro-bubble`: `flex: 1` ocupa espacio disponible; `min-width: 0` permite encogerse; `padding` separa texto y borde; borde, radio, fondo casi opaco y sombra mantienen la lectura; `overflow-wrap: anywhere` evita desbordamiento por palabras muy largas. |
| 109–112 | El mensaje usa letra de 0.875rem y altura de línea de 1.5 veces su tamaño. |
| 114–116 | `flex: 0 0 7.5rem` reserva espacio para el personaje y sus instrucciones. |
| 118–130 | El botón tiene posición relativa para anclar el corazón; bloque de 7.5rem por lado, márgenes automáticos, sin borde y con fondo transparente. El radio redondea su zona. `touch-action: manipulation` permite los gestos habituales; `pointer-events: auto` reactiva interacción solo aquí y `cursor: pointer` sirve de comportamiento base. |

### Porogalleta como cursor · líneas 132–153

| Líneas | Propiedades y razón |
| --- | --- |
| 132–143 | `.cookie-cursor`: comienza oculta; usa posición fija y coordenadas iniciales fuera de vista. Tiene capa 40, ancho y alto de 40px. `object-fit: contain` conserva la proporción. `translate(-50%, -50%)` centra la imagen sobre la coordenada del puntero. `pointer-events: none` impide que la galleta intercepte el clic destinado al poro. |
| 145 | La consulta comprueba que exista al menos un dispositivo con hover y un puntero preciso. |
| 146–148 | Solo con `data-pointer="mouse"` y hover ocultamos el cursor nativo. |
| 150–152 | En esa misma situación mostramos la galleta. |
| 153 | Cierra la consulta. |

La imagen conserva su PNG original y su transparencia. El tamaño de 40px es de presentación en CSS. Al salir, cancelarse el puntero o usar toque, vuelve la representación normal del dispositivo.

### Reacciones y teclado · líneas 155–195

| Líneas | Propiedades y razón |
| --- | --- |
| 155–162 | El poro llena el botón, conserva proporciones y recibe una sombra sobre su silueta. `poro-float` lo balancea cada 5s; la transición de `scale` suaviza el cambio de tamaño en 180ms. |
| 164–166 | Al acercar el cursor, el poro aumenta a 1.06 veces su tamaño. |
| 168–170 | Si `data-eating="true"`, sustituye el balanceo por `poro-chomp` cada 400ms. Se repite mientras siga comiendo; el temporizador de React finaliza ese estado. |
| 172–180 | El corazón está colocado arriba a la derecha, tiene color de acento y tamaño de 1.75rem, deja pasar eventos y sube durante 900ms. `both` conserva los estilos iniciales/finales de esa animación. |
| 182–191 | El comentario y `.skip-link` conservan el enlace de teclado: posición absoluta, márgenes de 1rem, capa 30, desplazamiento vertical fuera de vista, fondo y relleno. |
| 193–195 | Al recibir foco, el enlace vuelve a su posición visible. |

### Escritorio y animaciones · líneas 197–261

| Líneas | Propiedades y razón |
| --- | --- |
| 197 | Abre cambios desde 64rem de ancho. |
| 198–200 | El contenido reserva 19rem a la derecha para el compañero. Esto no crea una segunda columna de capítulos. |
| 202–207 | El poro se alinea al margen del contenido con `max` y `calc`, queda a 2rem del borde inferior, limita su ancho a 14rem y coloca globo encima del personaje. |
| 209–211 | Restablece el reparto flexible del grupo de acciones. |
| 213–216 | Aumenta el botón del poro a 9rem por lado. |
| 218–221 | El pie usa 3rem abajo y reserva también 19rem a la derecha. |
| 222 | Cierra la consulta de escritorio. |
| 224–226 | `drift`: al final desplaza las luces un 12% y 15% de sus dimensiones y las amplía a 1.12. |
| 228–230 | `poro-float`: a mitad del ciclo sube 6px y gira 2 grados; vuelve después al punto de partida. |
| 232–234 | `poro-chomp`: a mitad del ciclo sube 7px, se ensancha ligeramente y se comprime verticalmente para simular un pequeño bocado. |
| 236–238 | `heart-rise`: sube el corazón 35px y reduce su opacidad a cero. |
| 240–246 | Si `data-motion="off"`, quita animaciones y transiciones de luces, imagen y corazón. Los selectores tienen suficiente especificidad para vencer también al estado de comer. |
| 248–250 | Con pausa, elimina el aumento de escala por hover. |
| 252–256 | La consulta de movimiento reducido desactiva animaciones y transiciones también desde CSS. El selector incluye `data-eating` para cubrir ambos valores del atributo. |
| 258–260 | Evita el aumento de tamaño al pasar el ratón cuando se pide reducir movimiento. |
| 261 | Cierra la consulta. |

**Especificidad** significa la prioridad de un selector CSS frente a otro. No basta con escribir `animation: none` al final si una regla anterior tiene más prioridad. Aquí la pausa cubre explícitamente al botón y su imagen para que también detenga la animación de comer.

## 9. Nuevas utilidades de Tailwind

| Clase | Qué aporta |
| --- | --- |
| `text-accent`, `bg-accent`, `border-accent` | El nuevo color violeta principal. |
| `text-white`, `bg-white/35`, `bg-white/20` | Texto blanco y fondos blancos con 35% o 20% de opacidad de color. |
| `border-line/60`, `/70`, `border-white/80`, `border-violet/50` | Colores de borde con la opacidad indicada, sin volver transparente el texto. |
| `rounded-full`, `rounded-2xl`, `rounded-3xl` | Esquinas totalmente redondas, radio de 1rem o de 1.5rem. |
| `space-y-12` | Separación vertical de 3rem entre hijos de la portada. |
| `max-w-xl`, `max-w-2xl`, `max-w-3xl` | Anchos máximos de 36rem, 42rem y 48rem. |
| `sm:text-4xl`, `sm:text-7xl` | Tamaños de 2.25rem y 4.5rem desde 40rem de ancho. |
| `min-h-52` | Altura mínima de 13rem para la futura foto. |
| `mb-1`, `mb-4`, `mt-5`, `px-4` | Margen inferior de 0.25rem o 1rem, margen superior de 1.25rem y relleno horizontal de 1rem. |
| `font-semibold` | Peso de letra 600. |
| `relative` | Crea una referencia de posición sin sacar el elemento del flujo. |
| `hover:bg-violet`, `hover:bg-white/40` | Cambios de fondo al pasar el cursor. |
| `disabled:cursor-default` | Cursor normal cuando el botón está desactivado. |
| `sr-only` | Mantiene el texto disponible para lectores de pantalla sin mostrarlo visualmente. |

El resto de utilidades de espaciado, bordes y tipografía se introdujo en la primera etapa. Las clases con nombres propios, como `poro-bubble`, se definen en nuestro CSS.

## 10. Práctica guiada para esta etapa

1. Cambia una frase en `poroMessages.js` y visita su sección.
2. Alimenta al poro varias veces: el contador debe aumentar y volverá al comentario del capítulo 2.4 segundos después del último clic.
3. Mueve el ratón dentro y fuera del poro: la galleta debe aparecer únicamente encima de él.
4. Pulsa «Pausar movimiento» y aliméntalo: el texto y el contador siguen funcionando mientras las animaciones permanecen quietas.
5. Activa la preferencia de reducir movimiento en tu dispositivo y vuelve a la página: mostrará «Movimiento reducido».

No necesitas modificar todas estas piezas a la vez. Lo más sencillo para continuar es personalizar las frases; después podemos estudiar `feedPoro` y `useEffect` por separado.
