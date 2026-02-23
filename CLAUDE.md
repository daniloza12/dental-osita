# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
# Desarrollo — abrir directamente en navegador (sin servidor)
# Funciona con file:// porque el JS no usa módulos ES
start index.html

# Servidor local de desarrollo (puerto 8080)
python -m http.server 8080

# Build de producción → genera /dist
npm run build

# Build + servidor de preview en puerto 8081
npm run preview

# Solo servir /dist ya generado
npm run serve
```

El build tarda ~350ms y no requiere configuración previa más allá de `npm install`.

## Arquitectura

**Sitio estático de una sola página** (single-file SPA sin framework). No hay router, bundler ni transpilación en desarrollo — se edita directamente `index.html` y los archivos en `css/` y `js/`.

### CSS — capas ordenadas (orden de carga importa)

| Archivo | Responsabilidad |
|---|---|
| `css/base.css` | Todos los design tokens (`--color-*`, `--space-*`, `--radius-*`, etc.) en `:root`. Reset moderno. |
| `css/layout.css` | `.container`, `.section`, grids de cada sección, header/footer, breakpoints responsivos. |
| `css/components.css` | Estilos visuales de componentes (botones, cards, hero, formulario, animaciones reveal). |
| `css/utilities.css` | Helpers, keyframes de animación (`float`, `twinkle`, `pulse-whatsapp`, etc.). |

En build, los 4 se concatenan y minifican en `dist/css/style.min.css`.

### JS — IIFE único, sin módulos ES

`js/main.js` es un IIFE (`(function(){ ... })()`) que incluye todo: validación, animaciones, navegación, contadores. **No usar `import`/`export` ni `type="module"`** — el sitio debe funcionar con `file://` sin servidor.

El script añade `class="js"` a `<html>` en el momento de carga. Todas las animaciones reveal dependen de `.js` como selector padre en CSS, lo que garantiza que el contenido sea visible aunque JS falle (progressive enhancement).

### Sistema de animaciones reveal

- **`.reveal`** — aplica con variantes `--left`, `--right`, `--scale`. `IntersectionObserver` añade `.is-visible` cuando el elemento entra en viewport.
- **`.reveal-group` + `.reveal-item`** — para grupos con animación escalonada (stagger 110ms entre hijos).
- **`data-hero="N"`** — elementos del hero animados en secuencia al cargar (150ms + 130ms × índice).
- **`data-counter="N"`** — números animados con easing cúbico al entrar en viewport.

### Build pipeline (`build.js`)

Ejecuta 5 pasos en serie:
1. **Clean** — elimina `/dist` y lo recrea.
2. **CSS** — concatena los 4 archivos → minifica con `clean-css` nivel 2.
3. **JS** — minifica con `terser` (compress + mangle, 2 passes).
4. **Imágenes** — genera `logo.jpg` (optimizado), `logo.webp`, `logo@2x.webp`, `logo-sm.webp` con `sharp`.
5. **HTML** — reemplaza referencias CSS/JS por las minificadas, envuelve logos en `<picture>` con sources WebP, minifica con `html-minifier-terser`.

El HTML usa regex string-replace para actualizar referencias; si se cambia la estructura de los `<link>` o el `<script>` en `index.html`, verificar que los patrones en `buildHTML()` sigan coincidiendo.

## Información del cliente

- **Clínica**: Dra. Bania Carola Abrego Salinas — Odontología Integral
- **WhatsApp**: `+51 955553513` → links usan `https://wa.me/51955553513`
- **COP**: 40617 (Colegio Odontológico del Perú)
- **Color primario**: `#9B3B9B` (púrpura extraído del logo)
- **Logo fuente**: `assets/logo/logo.jpg` (580×582px, oso con diente en círculo púrpura)

## Pendientes de personalizar

- **Dominio real**: reemplazar `drabaniaabrego.com` en `<link rel="canonical">` y `og:url` dentro de `index.html`.
- **Dirección física**: el `contact-item` de ubicación actualmente redirige a WhatsApp — reemplazar cuando se tenga la dirección.
- **Redes sociales**: `href="#"` en los links de Facebook e Instagram del footer.
- **Backend formulario**: el envío es simulado (timeout de 1.8s). Integrar con un servicio real (Formspree, EmailJS, etc.) en `simulateSubmit()` dentro de `js/main.js`.

## Deploy

Subir **únicamente el contenido de `/dist`** al hosting. El `dist/.htaccess` incluido configura GZIP, caché agresiva por tipo de archivo y redirect HTTPS automático (Apache/cPanel).
