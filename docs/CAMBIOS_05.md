# Etapa 5 · Mover, escuchar y mirar de cerca

## Cómo abrir el proyecto desde VS Code

En la terminal de VS Code, situada en la carpeta del proyecto, ejecuta:

```powershell
npm.cmd run dev:browser
```

Vite compila React y abre la landing en tu navegador predeterminado. Si Vite ya está funcionando, abre la dirección que muestra la terminal (normalmente `http://127.0.0.1:5173/`) en Chrome o Edge. Una vista integrada de un editor puede impedir que YouTube reciba la identificación de la página. La integración muestra el código de error disponible y ofrece reintentar; configurar una clave de búsqueda no soluciona un error de reproducción 153. Consulta [YOUTUBE.md](YOUTUBE.md).

## 1. Un gesto compartido: `useFloatingDrag`

Este hook comparte la lógica entre el reproductor y el poro. **Hook** significa una función que usa las herramientas de React para gestionar estado y comportamiento reutilizable.

- `enabled` permite arrastrar el reproductor solo cuando está flotando.
- `holdDelay` diferencia agarrar una barra inmediatamente de mantener presionado al poro durante 320 milisegundos.
- `position` guarda las coordenadas. Al cambiar con `setPosition`, React actualiza el estilo `left/top` del elemento fijo.
- `positionRef` conserva esas coordenadas para eventos y observadores sin esperar otro render.
- `attachRef` recibe el nodo HTML; reconecta `ResizeObserver` si cambia el portal del poro.
- `place` mide el tamaño actual y usa `clampFloatingPosition` para limitar la posición a la pantalla.
- `onPointerDown` inicia un gesto. Los eventos Pointer funcionan tanto con mouse como con dedo y lápiz.
- `activate` marca el elemento como agarrado y activa su animación. El reproductor necesita moverse al menos 5 píxeles para distinguir arrastre de clic.
- `move` calcula la diferencia entre el punto inicial y el cursor actual; suma esa diferencia a la posición original.
- Si el poro se mueve más de 12 píxeles antes de completar la pulsación prolongada, se cancela ese gesto. Se sigue esperando la liberación para evitar una galleta accidental.
- `finish` cancela el temporizador y elimina los eventos. No quedan gestos activos después de soltar, cancelar o salir de la ventana.
- `suppressClick` distingue soltar después de arrastrar de un clic normal. Así alimentar y mover son acciones diferentes.
- `onKeyDown` permite mover con flechas, acelerar con Mayús y restablecer con Escape.
- `reset` devuelve el elemento a su ubicación habitual.

Los eventos de movimiento se escuchan en `window`, para continuar el gesto fuera del botón. Mientras se arrastra, los iframes no interceptan el puntero. Al terminar vuelven a funcionar normalmente.

## 2. El poro y su animación

`PoroCompanion` aplica las propiedades del hook a su botón. Un toque breve entrega una galleta; mantener presionado permite llevarlo por la pantalla. La animación `poro-carried` lo eleva y balancea suavemente. La preferencia de movimiento reducido desactiva la animación.

En móvil el poro mantiene su espacio junto al juego hasta que decides moverlo. `attachButton` conserva el foco del teclado cuando cambia de portal; `resetPosition` lo devuelve a su sitio con foco accesible. No se guardan las coordenadas: al recargar vuelve a su lugar original.

## 3. Barra de navegación siempre visible

`Header` utiliza `position: sticky` y `top: 0`. Permanece arriba durante el desplazamiento y conserva su espacio en el documento. Su fondo evita que el contenido interfiera con los enlaces.

`ResizeObserver` mide su altura, que puede variar al cambiar el ancho de la pantalla. Guarda la medida en la variable CSS `--header-height`. `scroll-padding-top` usa esa medida para que los enlaces internos no dejen los títulos debajo de la barra. En móvil, el menú admite desplazamiento horizontal.

## 4. Música tranquila y coleccionables

- [Cómo funciona la composición original del juego](CAMBIOS_05_AUDIO.md): Web Audio, notas, volumen, pausas y coordinación con YouTube.
- [Cómo funciona el carrusel y el visor](CAMBIOS_05_COLECCIONABLES.md): deslizamiento, navegación, diálogo, foco y premios bloqueados.

La melodía del juego se inicia mediante el clic de comenzar, sin añadir canciones a la biblioteca de YouTube. Las imágenes desbloqueadas se abren en un diálogo grande; las bloqueadas conservan su candado.

## Ejercicios pequeños

1. Cambia `holdDelay: 320` por `500` y compara cuánto tarda el poro en dejarse agarrar.
2. Lee `clampFloatingPosition` y calcula el límite derecho de una ventana de 400 píxeles en una pantalla de 1280: `1280 - 400 - 8 = 872`.
3. Cambia el volumen con el control del juego y sigue el valor desde `changeVolume` hasta `master.gain`.
4. Abre una imagen con Enter y ciérrala con Escape: observa que el foco regresa al botón que la abrió.

Las pruebas automáticas comprueban reglas y ciclos de carga; las pruebas de navegador comprueban interacción real. La reproducción de contenido externo necesita verificarse aparte en el navegador que utilices.

## Comprobación de esta versión

- 65 pruebas automáticas aprobadas y compilación de producción correcta.
- Arrastre real del reproductor comprobado con puntero; mantiene la posición al soltar.
- Carrusel avanzó al segundo tesoro. El visor mostró la imagen grande, cerró con Escape y devolvió el foco al botón original.
- La barra permaneció en `top: 0` al desplazarse. La vista móvil de 390 × 844 no tuvo desbordamiento horizontal.
- El poro pasó de su lugar junto al juego a posición flotante con las flechas; Escape restauró ubicación y foco.
- La interfaz confirmó que el contexto de audio comenzó desde el clic y respondió a pausar, reanudar, silenciar y activar. No se grabó ni se evaluó auditivamente el sonido en esta comprobación.
- YouTube siguió agotando el tiempo de espera en la vista integrada durante la prueba final. La reproducción real todavía debe comprobarse en Chrome o Edge abriendo la URL de Vite; no está acreditada por las pruebas unitarias.
