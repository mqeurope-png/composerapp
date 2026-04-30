# Bomedia Email Composer · v4 · Documentación técnico-funcional

> **Propósito de este documento**: alimentar a otra IA generalista para que produzca un manual de usuario de cara a comerciales y administradores. Cubre toda la superficie funcional, los flujos típicos y la arquitectura subyacente.
>
> **Versión**: v4.0 (abril 2026) — añade AI agent sobre v3 + todas las mejoras intermedias.

---

## 1. Qué es la app

**Bomedia Email Composer** es una webapp single-page para construir emails comerciales HTML multi-idioma combinando bloques predefinidos. La usa el equipo de ventas de Bomedia S.L. (distribuidor español de impresoras UV-LED y DTF de las marcas artisJet, MBO, MBO DTF, PimPam Vending, FLUX, SmartJet).

El comercial:
1. Elige una plantilla o monta el email desde cero arrastrando bloques (productos, textos, hero, sección 2/3 columnas, vídeo, CTA, etc.).
2. Personaliza textos en español/francés/alemán/inglés/holandés.
3. Copia el HTML resultante o lo pega en su cliente de email (Gmail, Outlook).

El admin:
- Gestiona el catálogo de productos, marcas, plantillas, textos pre-escritos, bloques compuestos, CTAs guardados y usuarios.
- Configura el asistente IA (API key + tonos por idioma por usuario).

---

## 2. Arquitectura

- **Runtime**: 100 % cliente, sin build step.
  - React 18 desde CDN (unpkg)
  - Babel-standalone transpila JSX en el navegador en vivo
  - Un único `index.html` carga ~12 ficheros `.jsx` separados
- **Persistencia**: Supabase REST API (tabla `composer_data`, fila `main`) + cache en `localStorage`. Drafts del canvas en `localStorage` por usuario.
- **Sesión**: `sessionStorage` para guardar el usuario activo (per pestaña).
- **Storage de imágenes**: WordPress REST API en `boprint.net` (App Password).
- **IA**: OpenAI (`gpt-4o-mini` para texto, `gpt-4o` para el agente con tool-use).
- **Deploy**: Netlify, conectado al repo `mqeurope-png/composerapp` (rama `main`).

### Estructura de ficheros

```
bomedia-v4/
├── index.html             ← shell + CSS + carga de scripts
├── CLAUDE.md              ← guía del proyecto para agentes Claude Code
├── docs/                  ← este manual y otros docs
└── src/
    ├── app-data.jsx        ← catálogo por defecto, factory de bloques, migraciones
    ├── app-i18n.jsx        ← resolución de textos por idioma (getLocalizedText…)
    ├── app-security.jsx    ← SHA-256, sanitizeHtml, hashes de password por defecto
    ├── app-supabase.jsx    ← carga/guardado en Supabase + uploads imagen
    ├── app-openai.jsx      ← wrapper de la API OpenAI
    ├── app-email-gen.jsx   ← genera el HTML final del email a partir de blocks
    ├── app-rich-editor.jsx ← editor rich-text inline (negrita, h1/2/3, lista, color)
    ├── app-ai-agent.jsx    ← agente IA con tool-use (NUEVO en v4)
    ├── app-compositor.jsx  ← Sidebar, Canvas, PreviewPanel, AiAgentModal
    ├── app-inspector.jsx   ← panel de edición de bloque seleccionado
    ├── app-backoffice.jsx  ← Backoffice (todas las tabs admin/comercial)
    └── app-main.jsx        ← App root, estado global, routing
```

---

## 3. Modelo de datos (`appState`)

El estado entero vive en `appState` y se sincroniza con Supabase. Estructura:

```js
{
  brands: [
    { id, label, logo, color, divider, logoHeight, logoText, visible,
      url: { es, fr, de, en, nl }, urlLabel: { es, fr, de, en, nl } }
  ],
  products: [
    { id, brand, name, badge, badgeBg, badgeColor, img, desc, area, alt,
      feat1, feat2, price, link, accent, gradient, visible,
      i18n: { fr: {desc, feat1, feat2, price, link, badge}, de: {…}, en: {…}, nl: {…} } }
  ],
  prewrittenTexts: [
    { id, name, icon, brand, text, visible,
      i18n: { fr: { text }, de: { text }, en: { text }, nl: { text } } }
  ],
  templates: [
    { id, name, desc, colorClass, brand, blocks: [textIds], compositorBlocks: [blockSpecs], visible,
      i18n: { fr: { name, desc }, … } }
  ],
  composedBlocks: [
    { id, title, desc, priceRange, colorTag, introText, brandStrip, blockType,
      products: [productIds], includeHero, includeSteps, visible,
      i18n: { fr: { title, desc, introText }, … } }
  ],
  standaloneBlocks: [
    { id, title, desc, icon, iconBg, brand, section, blockType, visible,
      config: { ... }, i18n: { ... } }
  ],
  ctaBlocks: [
    { id, name, title, subtitle, bullets[], text, url, bg, color, align,
      panelBg, panelBorder, visible }
  ],
  users: [
    { id, name, role, passwordHash, hiddenItems, aiStyles, lastLang }
  ],
  uploadedImages: [
    { url, name, size, addedAt }
  ],
  openaiKey: 'sk-...',
}
```

### Notas de schema

- **`visible: false`** = oculto del listado. No se borra, solo deja de aparecer.
- **`hiddenItems` por usuario** = `{ collection: { itemId: true } }` para ocultar items de un comercial sin afectar a otros.
- **`i18n` puede estar en cualquier item con campos textuales** y siempre solo guarda los idiomas distintos del español (es es la base).
- **`lang === 'es'`** siempre toma el campo base, ignora `i18n`.

---

## 4. UI: tres modos principales

### 4.1 Modo Compositor (default)

Layout: **Sidebar (izquierda) | Canvas (centro) | Preview (derecha, redimensionable)**

#### Sidebar (Biblioteca)
- Buscador local
- Chips de marca (filtran productos / textos / plantillas / compuestos)
- Filtros tipo (Todos / Productos / Compuestos / Heroes / Vídeos / Marcas)
- Filtros precio (<10k / 10–20k / ≥20k / Consultar)
- Tabs: **Bloques** (productos + compuestos + standalones), **Plantillas**, **Textos**
- En el tab Bloques hay siempre arriba un grupo **Layout** (2 columnas, 3 columnas).
- Click en cualquier item → se añade al canvas.

#### Canvas (centro)
- Cabecera: nombre del email (Email sin título o nombre de plantilla en edición), botones:
  - **↺ ↻** Undo / Redo (Ctrl+Z / Ctrl+Shift+Z)
  - **+ Nuevo** (vacía el canvas, pide confirm)
  - **Guardar como plantilla**
  - **`</>` HTML** (menú: copiar / abrir / preview)
  - **Enviar** (copia HTML al portapapeles como rich content)
  - **✨ IA** (botón rosa, abre modal del agente — solo v4)
- Lista vertical de bloques. Cada uno con:
  - Barra superior: handle de drag, tag del tipo, dot del color de marca, acciones (Editar / Subir / Bajar / Duplicar / Borrar)
  - Cuerpo: render visual del bloque (foto + nombre + precio para producto, texto editable inline para text blocks, etc.)
- Botones de inserción "+" entre bloques y al final.
- **Drag-drop reorder** desde el handle (icono ⋮⋮). Aparece línea negra arriba/abajo del bloque destino indicando dónde caerá.

#### Preview (derecha)
- Tabs **Visual / HTML**
- Visual: iframe con el HTML renderizado como lo verá el destinatario
- HTML: textarea con el código fuente
- Botón **"Copiar HTML"**
- Toggle **monitor / móvil** para ver responsive
- Botón **maximizar** para ver a pantalla completa

### 4.2 Modo Backoffice (acceso restringido)

Sidebar de tabs:
- **Productos** (admin/comercial)
- **Marcas** (admin/comercial)
- **Textos** pre-escritos (admin/comercial)
- **Plantillas** (admin/comercial)
- **Bloques sueltos** (admin/comercial)
- **Compuestos** (admin/comercial)
- **CTAs** (admin/comercial)
- **Usuarios** (solo admin)
- **Asistente IA** (solo admin)
- **Mi tono IA** (solo comerciales)
- **Ajustes** (solo admin)

Cada tab tiene barra superior con buscador + chips de marca, y botones **+ Nuevo** + **Exportar JSON**.

Click en un item → drawer lateral con el editor.

### 4.3 Modal del agente IA (v4)

Botón **✨ IA** del canvas → abre modal flotante centrado con:
- Header rosa-violeta gradiente
- Bloque de **Ejemplos** (5 prompts pre-hechos clicables)
- **Textarea** para escribir el prompt
- Botón **Enviar** (Ctrl+Enter también)
- Log en vivo: 🤔 Pensando → → tool_call → ✓ resultado → 🤖 respuesta final
- Cuando termina, botones **Aplicar al canvas** / **Otra petición**

El agente trabaja sobre una **copia** del canvas. Solo al pulsar **Aplicar** los cambios se persisten al canvas real. Hasta entonces puedes cancelar sin riesgo.

---

## 5. Bloques: tipos disponibles

### 5.1 Bloques de contenido directo

| Tipo | Descripción | Campos clave |
|---|---|---|
| `text` | Párrafo de texto editable | `_overrides`/`overridesByLang` con `{lang: contenido}`, opcional `_sourceType`/`_sourceId` para vincular a un texto pre-escrito |
| `product_single` | Tarjeta de un producto | `product1` (id) |
| `product_pair` | Dos tarjetas lado a lado | `product1`, `product2` |
| `product_trio` | Tres tarjetas lado a lado | `product1`, `product2`, `product3` |
| `brand_strip` | Logo + URL de marca, divisor | `brand` (id) |
| `brand_artisjet/mbo/pimpam/flux` | Variantes legacy del strip | — |
| `pimpam_hero` (también `hero`, `product_hero`) | Banner grande con título / subtítulo / bullets / botones | `heroImage`, `heroTitle`, `heroSubtitle`, `heroBullets[]`, `heroCtaButtons[{text,url,bg,color}]`, `heroBgColor` |
| `pimpam_steps` | Strip de 4 pasos numerados | `steps[{n,t,s}]`, `stepsBgColor`, `stepsBorderColor` |
| `freebird` / `video` | Embed de vídeo YouTube | `youtubeUrl`, `thumbnailOverride` |
| `image` | Imagen sola con alt y link opcional | `src`, `alt`, `link`, `align`, `widthPct` |
| `cta` | Tarjeta CTA con título + bullets + botón | `title`, `subtitle`, `bullets[]`, `text`, `url`, `bg`, `color`, `align`, `panelBg`, `panelBorder` |

### 5.2 Bloques contenedor

| Tipo | Descripción |
|---|---|
| `section` (`section_2col` / `section_3col`) | Sección multi-columna. Tiene `columns: [{blocks:[...]}, ...]`. Las columnas pueden contener cualquier bloque "atómico" (text, image, video, product_single, cta). En móvil hacen stack vertical automáticamente |
| `composed` | Referencia a un bloque compuesto guardado. Tiene `composedId`. El bloque compuesto se expande a runtime con sus contenidos (intro + brand strip + productos + hero/steps opcionales) |

### 5.3 Cómo se añaden bloques

- **Click en un item del Sidebar** → se añade al final del canvas.
- **Click en un + entre bloques** → abre el command palette (Cmd+K) e inserta tras esa posición.
- **Click en "+ Añadir bloque" al final** → abre command palette, añade al final.
- **Botón "+ Añadir a columna N"** dentro de una sección → abre un picker reducido (solo Texto / Producto / Imagen / Vídeo / Botón CTA) y añade dentro de esa columna.

---

## 6. Editor de bloques (Inspector)

Click en cualquier bloque → en el panel derecho aparece el panel de edición específico. Cada tipo tiene su editor:

- **Text**: editor rich (negrita, cursiva, h1/h2/h3, listas, alineación, color de texto, color de fondo, link, eliminar formato). Toggle de fuente. Botón **✨ IA** para reescribir o generar texto desde notas.
- **Product**: selector de producto + override por idioma (badge, descripción, link, etc.).
- **Hero**: imagen (upload/biblioteca/URL), título, subtítulo, bullets, botones CTA múltiples con bg/color.
- **Steps**: 4 pasos editables (número/título/subtítulo), color de fondo y borde.
- **Image**: URL, alt, link, alineación, slider de ancho %.
- **CTA**: título / subtítulo / bullets / texto botón / URL / colores botón / colores panel / alineación.
- **Composed**: muestra los productos linkados, brand strip, intro text, opciones hero/steps. Editable desde Backoffice → Compuestos.

Cualquier campo de imagen tiene los **3 botones**: pegar URL / **Biblioteca** (modal con todas las imágenes conocidas: subidas previas + productos + marcas + heroes) / **Subir** (file picker, sube a boprint.net).

---

## 7. Sistema multi-usuario

`appState.users[]` con dos roles:
- **`admin`**: acceso total al Backoffice, gestiona usuarios, ve la API key de OpenAI, etc.
- **`commercial`**: ve los tabs Productos/Marcas/Textos/Plantillas/Bloques/Compuestos/CTAs en modo lectura/edición + tab "Mi tono IA". No ve Usuarios ni Ajustes ni la API key.

Cada usuario tiene:
- `passwordHash` (SHA-256, configurable por admin)
- `hiddenItems`: items que oculta de su vista (sin afectar a otros)
- `aiStyles`: prompt de tono y estilo de la IA por idioma
- `lastLang`: último idioma que tenía activo (se restaura al login)

**Login**: pantalla con dropdown de usuarios + campo password.

**Sesión**: persiste por pestaña (`sessionStorage`).

**Drafts del canvas**: cada usuario tiene su propio borrador en `localStorage` con clave `bomedia_draft_blocks_<userId>`. Al cambiar de usuario se restaura el suyo.

---

## 8. Internacionalización

5 idiomas: `es` (base), `fr`, `de`, `en`, `nl`.

Switcher en la cabecera (chips ES FR DE EN NL).

### Cómo se resuelve el texto a idioma

- **Productos**: `getLocalizedProduct(p, lang)` → devuelve copia del producto con campos sobreescritos por `p.i18n[lang]`.
- **Textos pre-escritos**: `getLocalizedText(obj, 'text', lang)` → si existe `obj.i18n[lang].text`, usa ese; si no, fallback al `obj.text` base.
- **Plantillas / Compuestos / Bloques**: igual, vía `getLocalizedText`.
- **Bloques de tipo text en canvas**: pueden tener `_overrides`/`overridesByLang` con `{lang: contenido manual}`. Si están, ganan sobre la fuente vinculada.

### Auto-traducción en BO

Tab **Asistente IA → "Auto-traducir nombres"**:
- Detecta items que les falten traducciones de `name` / `desc` / `title` / `text` / `introText`.
- Llama a OpenAI en lotes pequeños con un prompt que **prohíbe traducir nombres de máquinas y marcas**.
- Aplica los resultados en una sola transacción.
- Toggle "Sobrescribir traducciones existentes" para forzar regeneración.

### Backoffice respeta el idioma activo

Las listas de Productos / Textos / Plantillas / Bloques / Compuestos muestran nombres y descripciones en el idioma del switcher. Si un item no tiene traducción en ese idioma, fallback a español.

---

## 9. Catálogo (lo que viene de fábrica)

### 9.1 Marcas (6)

- **artisjet** — artisJet (azul, oklch 55% 0.18 255)
- **mbo** — MBO UV-LED (violeta, 295)
- **mbo_dtf** — MBO DTF (rosa-magenta, 0)
- **pimpam** — PimPam Vending (naranja, 45)
- **smartjet** — SmartJet (teal, 180)
- **flux** — FLUX (azul-gris, 210)

(El brand `bomedia` también existe como marca interna pero no aparece en filtros).

### 9.2 Productos (~40 entre defaults + lo que se añada)

Ejemplos:
- artisJet: Young (9.300 €), 3000Pro Freebird, Proud (cards), 5000U (A2+ Freebird), 6090Trust (Gran Formato)
- MBO UV-LED: 3050, 4060 (top ventas), 6090 (semiformato), 1015 (industrial), UV1612G/UV1812/UV2513 (gran/super formato)
- PimPam: CaseBox, Custom
- SmartJet: FLEX ONE (entry), FLEX 297 (versátil), FLEX ULTRA (avanzada), FLEX 324 (alta producción)

Cada producto tiene `i18n` con traducciones a fr/de/en/nl de descripción, features y a veces precio (€ formateado por idioma).

### 9.3 Textos pre-escritos (~18)

Ej: `text-001` Intro UV-LED genérica, `text-002` Transición a MBO, `text-003` Transición a PimPam, `text-004` Mención Freebird, `text-005` Cierre comercial, `text-006` Intro SmartJet, `text-007` Cierre SmartJet FESPA, `text-textil-dtf`, etc.

Todos con i18n a 4 idiomas.

### 9.4 Plantillas (~13)

Pre-armados completos. Ej: `tpl-001` Compactas UV-LED, `tpl-005` SmartJet FLEX FESPA.

Cada plantilla tiene una lista de bloques que cargan al canvas al hacer click.

### 9.5 Bloques sueltos / standalones (~29)

Hero / video / brand strip / steps reutilizables. Ej: `sb-001` Brand artisJet, `sb-008` PimPam Hero, `sb-009` PimPam 4 Pasos.

### 9.6 Compuestos (~15)

Mini-emails empaquetados. Ej: `block-001` Entry Level MBO 3050+4060, `block-009` PimPam Vending CaseBox+Custom, `block-012` SmartJet FLEX Gama Completa.

### 9.7 CTAs guardados

Inicialmente vacío. El admin los crea desde Backoffice → CTAs → + Nuevo (título, subtítulo, bullets, texto botón, URL, colores).

---

## 10. Persistencia

### 10.1 Supabase

- URL: `https://midvgxxndddasxlnstkg.supabase.co`
- Tabla: `composer_data`, fila `id = main`
- Auth: API key publishable embedida en el cliente (es safe — solo permite ops permitidas por RLS)
- Auto-save: 1.5s debounce tras cualquier edición → PATCH a Supabase
- Backups: tabla `composer_backups` con filas `backup_<timestamp>`, mantiene las últimas 5

### 10.2 localStorage

- `bomedia_composer_data`: snapshot del `appState` (cache, hidrata al arrancar antes de Supabase)
- `bomedia_draft_blocks_<userId>`: borrador del canvas por usuario
- `bomedia_session_user`: usuario activo (la sesión)
- `bomedia_ai_styles`: legacy fallback para tonos IA si no hay user

### 10.3 sessionStorage

- `bomedia_openai_key`: legacy (ahora se guarda en `appState.openaiKey`)
- `bomedia_session_user`: usuario activo de la pestaña

### 10.4 Imagen storage

`uploadImage(file, opts)` en `app-supabase.jsx` actualmente apunta a `boprint.net`:
- `POST https://boprint.net/wp-json/wp/v2/media`
- Autenticación: Basic con WordPress App Password
- Devuelve la `source_url` pública (`https://boprint.net/wp-content/uploads/...`)
- Las URL subidas se trackean en `appState.uploadedImages` (cap 200, dedupe por URL)

Función biblioteca: `ImageLibraryModal` recoge URLs de productos, marcas, heroes y uploads tracked → grid con thumbs + filtros por origen.

---

## 11. Generación de email HTML

Función central: **`generateFullHtml(blocks, products, lang, brands, appState)`** en `app-email-gen.jsx`.

Estrategia:
1. Convierte blocks v3 → blocks v2 (legacy schema) vía `v3BlocksToV2Blocks`.
2. Itera bloques y dispatcha a helpers específicos:
   - `textBlockHtml(text, opts)` — párrafo con tipografía
   - `productSingleHtml(p, lang)` / `productPairHtml(p1, p2, lang)` / `productTrioHtml(p1, p2, p3, lang)` — tarjetas con `<table>` rígido
   - `brandStripHtml(brandId, lang, brands)` — logo + link
   - `pimpamHeroHtml(config, lang)` — hero responsive
   - `pimpamStepsHtml(config, lang)` — strip de pasos
   - `freebirdHtml(config, lang)` — vídeo YouTube
   - `imageBlockHtml(b)` — imagen
   - `ctaBlockHtml(b)` — card CTA con tabla + h3 + ul + tabla-button
   - `sectionHtml` (inline en `renderBlock`) — tabla anidada con `<td class="col-half">` o `col-third`
3. Wrap en `<html><head><CSS_BLOCK></head><body><table class="wrap">...</table></body></html>`.

**`CSS_BLOCK`** incluye media queries que en móvil:
- `.wrap { width: 100% !important }`
- `.col-half, .col-third { display: block !important; width: 100% !important }`
- Cards de producto y pasos hacen stack

**Outlook compat**: todo es `<table>` (cero divs/flex), pesos y radios inline, fallback `valign`/`align`.

**Sanitización**: `escapeHtml()` para entidades, `sanitizeHtml()` (XSS) para rich text del usuario.

---

## 12. Asistente IA (v4)

Dos surfaces:

### 12.1 Generación in-line (en cada Inspector de texto)

Botón **✨ IA** en el editor de bloque text. Abre popover con:
- **Modo Generar**: input "describe la idea" → llama a `callOpenAI({notes, lang, mode:'generate'})` → genera párrafo en idioma activo con tono del user.
- **Modo Reescribir**: toma el texto actual + instrucciones opcionales → llama con `mode:'rewrite'`.

Modelo: `gpt-4o-mini`. Tono del user (`appState.users[i].aiStyles[lang]`) + system prompt fijo de copywriter B2B UV-LED.

### 12.2 Agente con tool-use (canvas, **NUEVO en v4**)

Botón **✨ IA** en la cabecera del canvas → modal `AiAgentModal`.

User escribe en lenguaje natural; el agente decide qué herramientas usar y las ejecuta sobre una **copia** del canvas. Al terminar, user revisa y aplica.

#### Catálogo inyectado en system prompt

Cada vez que el agente arranca, se construye un índice compacto (~1 KB) con:
- Estado actual del canvas (idioma, número de bloques, lista breve de cada uno)
- Marcas disponibles (id + label)
- Productos (id + brand + badge + name + área + precio + snippet del desc)
- Plantillas, textos, compuestos, standalones, CTAs

Los detalles completos se obtienen on-demand vía tools `get_product`, `get_text`, etc.

#### Las 13 tools

| Tool | Función |
|---|---|
| `read_canvas` | Devuelve estado actual del canvas (id, type, fields clave por bloque) |
| `set_language(lang)` | Cambia el idioma activo (es/fr/de/en/nl) |
| `add_block(type, params, position?)` | Añade un bloque. type ∈ {text, text_from_library, product_single, product_pair, product_trio, brand_strip, cta, saved_cta, image, video, pimpam_hero, pimpam_steps, composed, section_2col, section_3col} |
| `add_block_to_column(sectionId, columnIndex, type, params)` | Añade un bloque dentro de una columna de una sección |
| `update_block(id, patch)` | Patchea campos de un bloque existente. Para texto: `patch.overridesByLang.<lang>` |
| `delete_block(id)` | Borra un bloque (top-level o dentro de sección) |
| `reorder_blocks([ids])` | Reordena top-level. IDs ausentes van al final |
| `clear_canvas(confirmed:true)` | Vacía. Requiere flag explícito |
| `load_template(templateId)` | Carga plantilla (destructivo) |
| `get_product(productId)` | Detalles completos del producto |
| `get_text(textId)` | Detalles completos de un texto pre-escrito |
| `get_template(templateId)` | Detalles de plantilla |
| `get_composed(composedId)` | Detalles de un compuesto |

#### Salvaguardas

- **Validación de IDs**: si el modelo intenta añadir un producto/texto/compuesto con un id inventado, devuelve error con sugerencias de IDs reales.
- **Filtro de placeholders**: si el modelo escribe URLs como `"url_de_contacto"`, `"sb-vid-mbo-uv"`, `"https://example.com"`, `"#"`, el wrapper las blanquea automáticamente antes de meter el block.
- **CTA sin URL**: el email-gen usa `<span>` (no clickable, mismo styling) con comentario `<!-- TODO: añadir URL al CTA antes de enviar -->`.
- **Modelo**: `gpt-4o` (no mini). Coste ~$0.01 por interacción.
- **Max iteraciones**: 12. Si no termina, error.
- **Trabajo sobre copia**: aplicar requiere clic explícito.

#### Coste y rate

~$0.01-0.02 por interacción (gpt-4o, ~3000 input tokens + ~500 output). 1000 interacciones = ~$15. No hay rate limiting; el límite real es la quota de la API key de OpenAI.

---

## 13. Editor rich-text de texto inline

Componente `RichTextEditor` (en `app-rich-editor.jsx`), basado en `contenteditable` + `document.execCommand`:

- Botones de formato: párrafo / H1 / H2 / H3
- Marca: bold / italic / underline / strikethrough
- Listas: ul / ol
- Alineación: left / center / right / justify
- Color de texto + color de fondo (paletas pre-fijadas + custom)
- Link / unlink
- Limpiar formato
- Tamaño de fuente (input numérico)

Almacena el HTML resultante en `block._richHtml` (es) o `block._richHtmlByLang[lang]` (otros idiomas).

---

## 14. Flujos típicos del comercial

### 14.1 Crear un email rápido desde plantilla

1. Sidebar → tab Plantillas → click en una (ej. "Compactas UV-LED")
2. El canvas se llena con sus bloques
3. Selecciona un bloque de texto, edita el saludo personalizando con el nombre del cliente
4. Cambia idioma con el chip arriba (FR/DE/EN/NL) si toca
5. Cabecera canvas → **Enviar** → copia HTML al portapapeles
6. Pega en Gmail compose → se inserta como rich content

### 14.2 Construir desde cero con la IA

1. Lienzo vacío → cabecera canvas → **✨ IA**
2. _"Crea un email para Juan, dueño de un taller de cartelería interesado en producción industrial gran formato MBO. Estructura: brand strip, intro saludando, 3 columnas con UV1612G/UV1812/UV2513, cierre y CTA reservar demo"_
3. Espera el log → revisa → **Aplicar al canvas**
4. Editar lo que no encaje, **Enviar**

### 14.3 Traducir email existente a francés

1. Canvas con email en español → cambia el switcher de idioma a FR
2. Productos/marcas se traducen automáticamente (datos i18n del catálogo)
3. Textos: si tienen i18n.fr ya se ven traducidos. Si no, abrir cada texto → **✨ IA** → "Reescribir" en francés.
4. O atajo: usar el agente IA con _"Traduce todos los textos del canvas al francés. No cambies los productos."_

### 14.4 Guardar como plantilla

1. Construir el email
2. Cabecera canvas → **Guardar como plantilla** → modal: nombre, descripción, marca principal, color tag → Guardar
3. La plantilla queda disponible en Sidebar → Plantillas y en Backoffice → Plantillas

---

## 15. Flujos típicos del admin

### 15.1 Añadir un producto nuevo

1. Backoffice → Productos → **+ Nuevo**
2. Drawer: pega imagen (URL / Biblioteca / Subir), nombre, badge, descripción ES, área, alt, features, precio, link, marca
3. Cambia el chip de idioma a FR/DE/EN/NL y rellena descripción/precio en cada idioma (o usa la auto-traducción)
4. Guardar → aparece en el catálogo de todos los users

### 15.2 Crear un nuevo CTA reusable

1. Backoffice → CTAs → **+ Nuevo**
2. Nombre interno (lo verás en el picker), título h3, subtítulo, bullets, texto botón, URL, colores
3. Guardar
4. Cualquier comercial puede insertarlo desde el canvas → **+ Añadir bloque** → Botón CTA → submenú con CTAs guardados

### 15.3 Auto-traducir todo el catálogo

1. Backoffice → Asistente IA
2. Configura API key OpenAI si no está
3. Bloque "Auto-traducir nombres" → marca FR/DE/EN/NL → opcionalmente "Sobrescribir existentes" → **Traducir ahora**
4. Espera el log → cuando termine, todo el catálogo tiene nombres traducidos

### 15.4 Backup y migración

- **Exportar**: Backoffice → header → Exportar → descarga `bomedia-backup-<timestamp>.json` con todo el `appState`
- **Importar**: Backoffice → Ajustes → Importar JSON
  - **Fusionar**: añade items nuevos por id (no machaca lo existente)
  - **Reemplazar todo**: machaca el `appState` entero (pide confirm)
- **Recargar desde la nube**: descarta cambios locales no sincronizados y vuelve a leer Supabase

### 15.5 Crear un comercial nuevo

1. Backoffice → Usuarios → **+ Nuevo** (botón "Nuevo usuario")
2. Drawer: nombre, rol commercial, password (se hashea SHA-256), aiStyles por idioma (opcional)
3. Guardar → el user puede hacer login

---

## 16. Atajos de teclado

- `Cmd/Ctrl + K` → Command palette (buscar y añadir bloques)
- `Cmd/Ctrl + Z` → Undo del canvas
- `Cmd/Ctrl + Shift + Z` o `Cmd/Ctrl + Y` → Redo
- `Esc` → cerrar modal/popover activo
- En modal IA: `Cmd/Ctrl + Enter` envía el prompt

Los atajos no afectan a inputs/textareas (puedes seguir usando Ctrl+Z normal mientras escribes en un campo).

---

## 17. Seguridad

- **Passwords**: SHA-256 vía Web Crypto API. Hashes default por env: admin = "boadmin1" (o similar), comerciales custom.
- **Sanitización**: `sanitizeHtml()` filtra rich-text del usuario contra XSS antes de meter en email-gen.
- **CSP** en `index.html` restringe `connect-src` a Supabase + OpenAI + boprint.net + self.
- **API key OpenAI** vive en `appState.openaiKey` → Supabase. Cualquiera con acceso admin a BO puede leerla. La password de admin debe ser fuerte.
- **WordPress App Password** para uploads: hardcodeada en `app-supabase.jsx` (riesgo aceptado por el cliente, mitigable rotando la app password en WordPress si se compromete).

---

## 18. Comportamientos curiosos / gotchas

- **Imágenes en email rendering**: tienen `width:100%; max-width:100%` para que rellenen su columna. NO hay máximos en px → se adaptan al contenedor.
- **Heroes**: usan `<img>` plano (no padding-bottom trick), porque Gmail/Outlook rompen el trick.
- **Brand strips de marca `none`**: no se renderizan (compuestos pueden tener `brandStrip:'none'`).
- **Templates legacy**: pueden tener `tpl.blocks = ['text-001', 'block-002', …]` (refs) o `tpl.compositorBlocks = [{type, ...}, ...]` (inline). Ambos schemas se soportan.
- **Hero unificado**: `pimpam_hero`, `product_hero`, `hero` todos se renderizan con `pimpamHeroHtml`. El editor del Inspector los trata como un único concepto.
- **Inserción tras un bloque**: hay un estado `insertAfter` que se setea cuando clicas un "+" intermedio. Validado contra NaN/SyntheticEvent (bug pasado).
- **Drafts vs auto-save**: el draft del canvas (los blocks) NO se guarda en Supabase, solo en localStorage. Sí se guarda en Supabase: el catálogo, las plantillas, los textos, los users, etc.

---

## 19. Cómo deshacer una catástrofe

- **Edición individual**: Ctrl+Z hasta 50 pasos atrás en el canvas.
- **Cambio masivo accidental** (ej. agente vació el canvas): Ctrl+Z también funciona después de aplicar el agente.
- **Pérdida de datos del catálogo en Supabase**: BO → Ajustes → Recargar desde la nube (si hay cambios locales no sincronizados que machacaron Supabase, esta función no los recupera). Solución: backups manuales periódicos vía **Exportar JSON**.
- **API key de OpenAI comprometida**: BO → Asistente IA → borra la key → genera una nueva en `platform.openai.com` → pega.
- **App Password de boprint comprometida**: WordPress → Users → bo-uploader → Application Passwords → Revoke. Crea una nueva. Edita `BOPRINT_WP_APP_PASSWORD` en `app-supabase.jsx` (cambio de código + redeploy).

---

## 20. Glosario rápido

- **Block / Bloque**: unidad atómica del canvas. Tiene `id`, `type` y campos según tipo.
- **Section / Sección**: bloque contenedor con columnas, cada una con sus propios bloques internos.
- **Template / Plantilla**: pre-armado completo. Cargarla machaca o inserta una secuencia de bloques.
- **Composed / Compuesto**: mini-email empaquetado (intro + brand strip + productos + opcional hero/steps). Se referencia en el canvas con `composedId`.
- **Standalone block / Bloque suelto**: hero/video/strip pre-configurado guardado como entidad independiente. Reutilizable.
- **Pre-written text / Texto pre-escrito**: párrafos guardados con id, traducción y meta. Se referencian en el canvas con `textId`.
- **CTA**: tarjeta llamada a la acción (titulo + bullets + botón).
- **Brand strip**: barra horizontal con logo de marca + URL.
- **Hero**: banner grande visualmente impactante con imagen, texto y botones.
- **Working copy**: copia del canvas que el agente IA mutua antes de pedir confirmación.

---

## 21. Para escribir el manual de usuario

Sugerencias para la otra IA que use este documento:

1. **Audiencia 1: comerciales** — necesitan saber cómo usar el modo Compositor + Inspector. Centrarse en flujos cortos (crear email rápido, traducir, guardar plantilla, copiar HTML al email cliente).
2. **Audiencia 2: admin** — necesitan saber cómo gestionar el catálogo, usuarios, traducciones automáticas y backup.
3. **Audiencia 3: power user** — el agente IA es la feature estrella; merece su propia sección con ejemplos de prompts y cómo iterar.

Estructura recomendada del manual final:
1. Introducción y primer login
2. Tour del compositor (sidebar / canvas / preview)
3. Construir un email paso a paso (con screenshots si es posible)
4. Trabajar con idiomas
5. Usar el agente IA (con 5+ ejemplos de prompts)
6. Backoffice (admin)
7. Multi-usuario y permisos
8. Atajos y trucos
9. Solución de problemas frecuentes
10. Glosario

---

*Fin del documento técnico. Versión generada el 30 abril 2026 para v4.0 — AI agent.*
