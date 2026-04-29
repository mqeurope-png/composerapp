# Bomedia Email Composer v3 — Migration Project

## What Is This?

A single-page email composer app for **Bomedia S.L.**, a Spanish distributor of UV-LED printers (artisJet, MBO, PimPam Vending, FLUX). The app lets sales reps build multi-language HTML emails by combining predefined blocks: text, product cards, brand strips, heroes, steps, and video embeds.

**We are migrating from v2 (monolithic HTML, raw `React.createElement`) to v3 (modular JSX + Babel, modern UI).**

## Architecture

### Runtime Stack (NO build step — runs entirely in-browser)
- **React 18** from CDN (UMD in v2, unpkg in v3)
- **Babel Standalone** for in-browser JSX transpilation (v3 only)
- **Supabase** for cloud sync (REST API, no SDK)
- **localStorage** for local persistence + drafts
- **sessionStorage** for OpenAI API key (ephemeral)
- **Web Crypto API** for SHA-256 password hashing
- Single HTML file loads separate `.jsx` files via `<script type="text/babel" src="...">`

### File Structure
```
bomedia-v3/
  index.html              ← Main HTML shell (CSS, fonts, script loading)
  src/
    app-main.jsx           ← App root, routing, state, tweaks panel
    app-compositor.jsx     ← Sidebar, Canvas, PreviewPanel, CommandPalette
    app-inspector.jsx      ← Inspector panel (block editing)
    app-backoffice.jsx     ← Backoffice CRUD views
    app-data.jsx           ← [TO CREATE] Data layer, default state, products, texts
    app-email-gen.jsx      ← [TO CREATE] HTML email generation functions
    app-supabase.jsx       ← [TO CREATE] Supabase sync, localStorage, backup
    app-security.jsx       ← [TO CREATE] SHA-256, sanitizeHtml, password logic
    app-rich-editor.jsx    ← [TO CREATE] Rich text editor (contentEditable)
    app-i18n.jsx           ← [TO CREATE] Language resolution functions
```

### v2 Source (reference)
```
bomedia-email-composer.html  ← ~4100 lines, everything in one file
```

## Key Concepts

### Block System
Blocks are the atomic units of the email. Each block has a `type` and type-specific fields:

| Type | Description | Key Fields |
|------|-------------|------------|
| `text` | Text paragraph | `_sourceType`, `_overrides`, `_richHtml`, `i18n` |
| `product_single` | One product card | `product1` (product ID) |
| `product_pair` | Two products side-by-side | `product1`, `product2` |
| `product_trio` | Three products | `product1`, `product2`, `product3` |
| `brand_artisjet/mbo/pimpam/flux` | Brand logo strip | `brand` |
| `freebird` | YouTube video embed | `youtubeUrl`, `thumbnailOverride` |
| `pimpam_hero` | Hero banner | `heroImage`, `heroTitle`, `heroSubtitle`, `heroBullets[]`, `heroCtaButtons[]`, `heroBgColor` |
| `pimpam_steps` | 4-step process | `steps[]` (n, t, s), `stepsBgColor`, `stepsBorderColor` |
| `composed` | Container with `innerBlocks[]` | `innerBlocks[]`, `introText`, `brandStrip`, `products[]`, `blockType` |

### Composed Blocks
Pre-built email sections stored in `appState.composedBlocks`. Each has:
- An `introText` (with i18n)
- A `brandStrip` reference
- Products to display
- Optional hero/steps

### Text Resolution (i18n)
Two systems coexist:
1. **Reference-based** (new): block stores `_sourceType: 'prewritten'/'composed'` + `_sourceId` + `_overrides: {es: "...", fr: "..."}`. Text resolved at render via `getTextInLanguage(block, lang, appState)`.
2. **Inline** (legacy): block has `text` + `i18n: {fr: {text: "..."}}`. Resolved via `getLocalizedText(obj, field, lang)`.

### Data Model (`appState`)
```
{
  brands: [{ id, label, logo, url:{es,fr,de,en,nl}, urlLabel:{...}, color, divider, logoHeight, visible }],
  products: [{ id, name, desc, price, area, img, feat1, feat2, brand, badge, visible, i18n:{fr:{name,desc,price},...} }],
  composedBlocks: [{ id, title, desc, priceRange, colorTag, introText, brandStrip, blockType, products:[], includeHero, includeSteps, visible, i18n:{fr:{introText},...} }],
  prewrittenTexts: [{ id, name, icon, brand, text, visible, i18n:{fr:{text},...} }],
  standaloneBlocks: [{ id, title, desc, icon, iconBg, brand, section, blockType, config:{...}, visible }],
  templates: [{ id, name, colorClass, brand, blocks:['text-001','block-002',...], visible }],
  boPasswordHash: "sha256...",
  dataPasswordHash: "sha256..."
}
```

### Products (DEFAULT_PRODUCTS)
11 products across 3 brands:
- **artisJet**: young, 3000pro, proud, 5000u, 6090trust
- **MBO**: mbo3050, mbo4060, mbo6090, mbo1015, uv1612g, uv1812, uv2513
- **PimPam**: casebox, custom

Each product has full i18n for name, desc, price across es/fr/de/en/nl.

### Supabase Integration
- URL: `https://midvgxxndddasxlnstkg.supabase.co`
- Table: `composer_data`, row ID: `main`
- Backup table: `composer_backups`
- Functions: `loadFromSupabase()`, `saveToSupabase(data)`, `saveBackupToSupabase()`, `pruneSupabaseBackups()`, `listSupabaseBackups()`, `loadSupabaseBackup(id)`

### Password System
- Two passwords: backoffice access + data operations (import/export/reset)
- Default backoffice password: "bomedia" (SHA-256 hash stored)
- Default data password: "bomedia2024"
- Hashed via `crypto.subtle.digest('SHA-256', ...)`

### HTML Email Generation
The core business logic — generates table-based HTML for email clients:
- `generateFullHtml(blocks, products, lang, brands, appState)` — main orchestrator
- `textBlockHtml(text)` — renders text with rich HTML support
- `productCardHtml(p, lang)` — single product card (table layout)
- `productCardCompactHtml(p, lang)` — compact variant
- `productSingleHtml(p, lang)` — wrapper for single product
- `productPairHtml(p1, p2, lang)` — two products side by side
- `productTrioHtml(p1, p2, p3, lang)` — three products
- `brandStripHtml(key, lang, brands)` — brand logo + link strip
- `freebirdHtml(config, lang)` — YouTube video thumbnail
- `pimpamHeroHtml(config, lang)` — hero banner with CTA buttons
- `pimpamStepsHtml(config, lang)` — 4-step process display
- `CSS_BLOCK` — inline CSS for email (responsive media queries)
- `escapeHtml(str)` — HTML entity escaping
- `sanitizeHtml(html)` — XSS protection for rich HTML

ALL email HTML uses `<table>` layouts (no divs/flexbox) for email client compatibility.

## Migration Plan

### Phase 1: Data Layer (`app-data.jsx`)
Port from v2:
- `DEFAULT_PRODUCTS` array with full i18n
- `getDefaultState()` — brands, composedBlocks, prewrittenTexts, standaloneBlocks, templates
- `createBlock(type)` — block factory
- `LANGS`, `LANG_LABELS` constants
- Wire data into v3 App component (replace hardcoded PRODUCTS/TEMPLATES/etc.)

### Phase 2: i18n & Resolution (`app-i18n.jsx`)
Port from v2:
- `getLocalizedProduct(product, lang)`
- `getLocalizedText(obj, field, lang)`
- `isAvailableInLang(item, lang)`
- `getTextInLanguage(block, lang, appState)`
- `getHeroDataInLanguage(block, lang, appState)`
- `mergeI18nFromDefaults(loadedData)`

### Phase 3: Persistence (`app-supabase.jsx`)
Port from v2:
- `supabaseFetch(method, body)` with auth headers
- `loadFromSupabase()`, `saveToSupabase(data)`
- `supabaseBackupFetch()`, `saveBackupToSupabase()`, `pruneSupabaseBackups()`, `listSupabaseBackups()`, `loadSupabaseBackup()`
- `getStorageData()`, `saveStorageData(data)` (localStorage)
- Draft blocks auto-save to localStorage

### Phase 4: Email Generation (`app-email-gen.jsx`)
Port from v2 (CRITICAL — this is the core business value):
- `CSS_BLOCK` — email CSS
- `escapeHtml()`, `sanitizeHtml()`
- All HTML generators (product cards, brand strips, hero, steps, video)
- `generateFullHtml()` — main orchestrator with `resolveText()` and `resolveHero()` inner functions
- Wire into v3 PreviewPanel to show real email HTML (not React components)

### Phase 5: Security (`app-security.jsx`)
Port from v2:
- `sha256Hash(str)` via Web Crypto API
- Password verification logic
- `sanitizeJsonObj()` — prototype pollution protection for JSON imports
- Default password hashes

### Phase 6: Rich Text Editor (`app-rich-editor.jsx`)
New feature (was being added to v2 with bugs):
- `RichTextEditor` component with contentEditable
- Toolbar: format (p/h1/h2/h3), bold/italic/underline/strikethrough, lists, alignment, colors, links
- `document.execCommand` API for formatting
- Toggle between rich HTML and plain text modes
- `_richHtml` property on blocks

### Phase 7: Wire Everything Together
- Connect data layer to Sidebar (real products, texts, templates, standalone blocks)
- Connect email generation to PreviewPanel (real HTML preview, not mock)
- Connect persistence (Supabase + localStorage) to App state
- Connect Inspector edits to email output
- Connect Backoffice CRUD to data persistence
- Add composed block editing (BlockEditorModal equivalent)

### Phase 8: New v3 Features
- Command palette search across real data
- Theme system (already in v3 shell)
- Lock/unlock per standalone block
- Type filter for standalone blocks sidebar
- Multiple CTA buttons in heroes
- OpenAI integration for text rewriting

## Code Style Rules

- JSX syntax (not `React.createElement`)
- Function components with hooks (no classes)
- `const` for components and constants, `let` for mutable
- Spanish for UI labels, English for code identifiers
- No semicolons at end of JSX return statements
- Components exported via `Object.assign(window, { ComponentName })` for cross-file access
- All components must work without a build step (Babel transpiles in browser)

## Important Notes

- The v3 shell (index.html + current JSX files) is a UI PROTOTYPE. The data is hardcoded/mock.
- The v2 (bomedia-email-composer.html) is the working production app with all business logic.
- Migration = port v2 business logic into v3 UI shell.
- Email HTML MUST use table-based layout (not divs/flexbox) for email client compatibility.
- The Supabase key in v2 is a publishable key (safe to include in client code).
- The app runs 100% client-side — no server, no build step, no Node.js.
