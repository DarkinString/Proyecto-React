# Assets del poro

Preparados con la herramienta integrada **ImageGen**, a partir de las dos referencias que compartiste. Una petición por imagen, sin variantes. Se conservaron los PNG originales generados, con transparencia real, dentro del proyecto.

| Archivo | Uso |
| --- | --- |
| `src/assets/images/poro/poro.png` | Compañero fijo; se presenta a 120px en móvil y 144px en escritorio. |
| `src/assets/images/poro/porogalleta.png` | Imagen de 40px que sustituye visualmente al cursor sobre el poro. |

Ambos archivos son de 1254 × 1254 píxeles, RGBA. Las cuatro esquinas tienen alpha 0. El tamaño visible se ajusta con CSS; no recortamos ni modificamos los archivos generados después de la generación. La galleta conserva transparencia también en la mordida.

Las importaciones de Vite empaquetan sus rutas. No dependen de la carpeta temporal de tus adjuntos ni de las carpetas internas de generación.

## Prompt exacto del poro

```text
Use case: background-extraction
Asset type: transparent PNG illustration asset for a personal romantic landing page.
Input images: Image 1 is the edit target and the exact visual reference.
Primary request: Extract the Poro from Image 1 with extremely high fidelity. Change only the white background and excess blank space to genuine transparent alpha. Preserve the existing hand-drawn illustration style, bold black outline, cream-white fur with subtle shading, both brown striped horns, shiny black eyes, little feet, compact rounded silhouette, and large pink tongue sticking out. Keep the entire body, horns, hair tuft and tongue visible with no cropping.
Composition/framing: a single Poro centered, tightly framed with a small clear transparent margin of about 3–5% around its full silhouette.
Scene/backdrop: entirely transparent alpha, not white, not a checkerboard pattern.
Constraints: preserve the reference proportions, pose, colors, texture and all subject details. Remove only the white background; do not add any floor, external shadow, glow, text, watermark, border, objects, scenery or duplicate character. Deliver a single transparent PNG.
```

## Prompt exacto de la porogalleta

```text
Use case: background-extraction
Asset type: transparent PNG cursor illustration to be rendered at 40px on a personal romantic landing page.
Input images: Image 1 is the edit target and the exact visual reference.
Primary request: Extract only the main brown porogalleta cookie from Image 1 with extremely high fidelity. Keep the circular chunky brown baked cookie, engraved dark spiral design, painterly texture, dimensional toasted edges and the prominent bite missing from the lower-left side. Remove the blue/cyan aura, all blue background, and both detached floating crumbs completely. The bite opening must be genuine transparent alpha.
Composition/framing: one cookie centered, tight square framing with minimal clear transparent margin of about 3% around the whole cookie.
Scene/backdrop: genuinely transparent alpha, not white and not a checkerboard pattern.
Constraints: preserve the reference cookie's exact recognizable shape, warm brown colors and spiral engraving. Clean readable silhouette suitable for a 40px cursor; no external glow, shadow, aura, crumbs, particles, objects, text, watermark or border. Deliver a single transparent PNG.
```
