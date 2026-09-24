# Coleccionables · Carrusel y visor de imágenes

Los tesoros ahora se recorren en un carrusel horizontal. Cada tarjeta conserva su condición de desbloqueo, estrellas, mejor tiempo y número de victorias. No hay reproducción automática del carrusel.

## 1. Cómo se utiliza

- Desliza horizontalmente en una pantalla táctil o utiliza los botones anterior y siguiente.
- Los puntos inferiores llevan a un tesoro concreto. El indicador muestra su posición.
- Con el foco en el carrusel, las flechas izquierda/derecha recorren imágenes; Inicio/Fin llevan a los extremos.
- Pulsa una imagen ganada para abrirla en tamaño grande. Cierra con **Cerrar**, Escape o pulsando el fondo exterior.
- Las tarjetas bloqueadas muestran únicamente su candado y el requisito del nivel: no incluyen una imagen ni un botón para ampliarla.

## 2. El componente del carrusel

En `src/features/collectibles/CollectiblesSection.jsx` reutilizamos `records` y `getLevelCollection`. La navegación es un cambio de presentación; no altera victorias ni concede premios.

`track` es una referencia al contenedor desplazable. `activeIndex` indica cuál de sus tarjetas está más cerca del centro. `openLevel` guarda el nivel elegido para ampliar; `null` significa que el visor está cerrado.

| Función o bloque | Qué hace y por qué |
| --- | --- |
| `updateActive` | Compara el centro visible del carrusel con el centro de cada tarjeta y actualiza el indicador, también al deslizar con el dedo. |
| `goTo` | Limita el destino entre el primer y último tesoro y usa `scrollTo` para mover solamente el contenedor horizontal. |
| `navigateWithKeyboard` | Traduce flechas, Inicio y Fin en destinos; cancela su desplazamiento predeterminado mientras el carrusel tiene foco. |
| `visibleLevel` | Vuelve a comprobar el desbloqueo antes de mostrar el visor; un premio retirado desde otra pestaña deja de mostrarse. |
| Botón de imagen | Guarda el nivel en `openLevel`; `aria-haspopup="dialog"` avisa de que abre una ventana. |
| `aria-current` / `aria-live` | Señalan el punto seleccionado y anuncian la posición actual a tecnologías de asistencia. |

En `collectibles.css`, `display: flex` coloca las tarjetas en una fila. `flex: 0 0 100%` reserva una vista completa para cada tarjeta y `overflow-x: auto` permite deslizar. `scroll-snap-type` y `scroll-snap-align` hacen que el desplazamiento termine alineado con una tarjeta.

El desplazamiento usa `smooth` normalmente e `instant` cuando se solicita movimiento reducido. También respetamos la casilla manual de reducción de movimiento de la página. Los botones y puntos tienen áreas de interacción de al menos 44 píxeles.

## 3. El visor reutilizable

`src/components/ui/ImageLightbox.jsx` recibe `src`, `alt`, `title`, `caption` y `onClose`. Estas props permiten usar el mismo visor con otra imagen sin copiar su comportamiento.

`createPortal` dibuja el diálogo directamente en `document.body`. Sigue siendo un hijo de React, pero no queda limitado por el recorte del carrusel. El elemento nativo `<dialog>` se abre con `showModal()`: lleva la ventana a la capa superior, deja el fondo inactivo y mantiene la navegación por teclado dentro.

El efecto de apertura recuerda el elemento que tenía el foco, bloquea el desplazamiento del fondo y enfoca el botón de cierre. Su limpieza cierra el diálogo, restaura el desplazamiento anterior y devuelve el foco al botón que abrió la imagen si sigue en la página.

`onCancel` atiende Escape. Detenemos el cierre automático para que `onClose` actualice también el estado de React. En `onClick`, comparar `target` y `currentTarget` distingue el fondo del diálogo de la imagen y sus controles; pulsar la imagen no cierra el visor.

`useId` genera el identificador que conecta el título con `aria-labelledby`. `imageLightbox.css` conserva los colores del tema activo y usa `object-fit: contain` para enseñar la imagen completa, sin recortarla. El tamaño máximo depende de la ventana para funcionar también en móviles.

Las ilustraciones provisionales siguen identificadas como tales. Al sustituirlas por fotos en `src/data/gameLevels.js`, tanto el carrusel como el visor utilizarán automáticamente esas imágenes.
