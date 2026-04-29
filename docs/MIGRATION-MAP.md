# Migration Map: v2 Functions → v3 Files

## Source: bomedia-email-composer.html (~4100 lines)

### Legend
- **[PORT]** = Copy and convert to JSX/modern JS
- **[ADAPT]** = Needs significant changes for v3 architecture
- **[SKIP]** = Not needed (replaced by v3 patterns)
- **[NEW]** = Doesn't exist in v2, needs to be created

---

## 1. app-data.jsx — Data & Constants

| v2 Function/Variable | Line | Action | Notes |
|---|---|---|---|
| `DEFAULT_PRODUCTS` | 249 | [PORT] | Array of 14 products with i18n per lang |
| `LANGS` | 267 | [PORT] | `['es','fr','de','en','nl']` |
| `LANG_LABELS` | 268 | [PORT] | `{es:'ES ...', ...}` |
| `getDefaultState()` | 617 | [PORT] | brands, composedBlocks, prewrittenTexts, standaloneBlocks, templates |
| `createBlock(type)` | 666 | [ADAPT] | Use UUID instead of counter. Add new block types from v3 (header, footer). |
| `blockIdCounter` | 665 | [ADAPT] | Replace with UUID generator |
| `innerBlockIdCounter` | 1373 | [ADAPT] | Replace with UUID generator |

**v3 equivalent data** (currently hardcoded in app-main.jsx):
- `BRANDS` → Replace with data from `getDefaultState().brands`
- `PRODUCTS` → Replace with `DEFAULT_PRODUCTS`
- `PREWRITTEN_TEXTS` → Replace with `getDefaultState().prewrittenTexts`
- `TEMPLATES` → Replace with `getDefaultState().templates`
- `STANDALONE_BLOCKS` → Replace with `getDefaultState().standaloneBlocks`

---

## 2. app-i18n.jsx — Internationalization

| v2 Function | Line | Action | Notes |
|---|---|---|---|
| `getLocalizedProduct(product, lang)` | 270 | [PORT] | Returns product with overridden name/desc/price for lang |
| `getLocalizedText(obj, field, lang)` | 280 | [PORT] | Returns field from i18n[lang] or fallback |
| `isAvailableInLang(item, lang)` | 287 | [PORT] | Checks if translation exists |
| `getTextInLanguage(block, lang, appState)` | 296 | [PORT] | Complex: resolves text from prewritten/composed/manual sources |
| `getHeroDataInLanguage(block, lang, appState)` | 345 | [PORT] | Resolves hero config with i18n |
| `mergeI18nFromDefaults(loadedData)` | 417 | [PORT] | Merges missing i18n from defaults into loaded data |

---

## 3. app-supabase.jsx — Persistence

| v2 Function | Line | Action | Notes |
|---|---|---|---|
| `SUPABASE_URL` | 480 | [PORT] | Constant |
| `SUPABASE_KEY` | 481 | [PORT] | Publishable key |
| `SUPABASE_TABLE` | 482 | [PORT] | `'composer_data'` |
| `SUPABASE_ROW_ID` | 483 | [PORT] | `'main'` |
| `supabaseFetch(method, body)` | 485 | [PORT] | Core fetch wrapper |
| `loadFromSupabase()` | 504 | [PORT] | GET → parse → return data |
| `saveToSupabase(data)` | 519 | [PORT] | PATCH with upsert |
| `supabaseBackupFetch(method, rowId, body)` | 530 | [PORT] | Backup table operations |
| `saveBackupToSupabase(data, reason)` | 553 | [PORT] | Create timestamped backup |
| `pruneSupabaseBackups()` | 569 | [PORT] | Keep last N backups |
| `listSupabaseBackups()` | 581 | [PORT] | List all backups |
| `loadSupabaseBackup(backupId)` | 589 | [PORT] | Load specific backup |
| `getStorageData()` | 600 | [PORT] | localStorage read |
| `saveStorageData(data)` | 609 | [PORT] | localStorage write |

---

## 4. app-email-gen.jsx — Email HTML Generation (CRITICAL)

| v2 Function | Line | Action | Notes |
|---|---|---|---|
| `CSS_BLOCK` | 941 | [PORT] | Email CSS string with responsive media queries |
| `escapeHtml(str)` | 764 | [PORT] | `&<>"'` escaping |
| `textBlockHtml(text)` | 769 | [PORT] | Handles rich HTML + plain text. Rich: sanitize + inline styles for h1/h2/h3/p/ul/ol/li/a. Plain: escape + paragraph wrap. |
| `productCardHtml(p, lang)` | 685 | [PORT] | Full product card (table layout, image, specs, price, CTA) |
| `productCardCompactHtml(p, lang)` | 714 | [PORT] | Compact card variant |
| `productSingleHtml(p, lang)` | 794 | [PORT] | Single product wrapper |
| `productPairHtml(p1, p2, lang)` | 799 | [PORT] | Two products side-by-side (table cells) |
| `productTrioHtml(p1, p2, p3, lang)` | 806 | [PORT] | Three products (table cells) |
| `brandStripHtml(key, lang, brands)` | 743 | [PORT] | Brand logo + link (table layout) |
| `freebirdHtml(config, lang)` | 814 | [PORT] | YouTube video thumbnail in table |
| `pimpamHeroHtml(config, lang)` | 841 | [ADAPT] | Hero with multiple CTA buttons. New `heroCtaButtons[]` array support. |
| `pimpamStepsHtml(config, lang)` | 918 | [PORT] | 4-step process (table cells) |
| `generateFullHtml(blocks, products, lang, brands, appState)` | 955 | [ADAPT] | Main orchestrator. Contains `resolveText()` and `resolveHero()`. Needs to handle new block types. |

---

## 5. app-security.jsx — Security

| v2 Function | Line | Action | Notes |
|---|---|---|---|
| `sha256Hash(str)` | 2652 | [PORT] | Web Crypto API |
| `DEFAULT_BO_HASH` | 2662 | [PORT] | "bomedia" hash |
| `DEFAULT_DATA_HASH` | 2663 | [PORT] | "bomedia2024" hash |
| `sanitizeHtml(html)` | 2666 | [PORT] | XSS removal (scripts, events, iframes, etc.) |
| `sanitizeJsonObj(obj)` | 2684 | [PORT] | Prototype pollution protection |
| `checkPasswordAsync(input, stored, default, cb)` | 2699 | [ADAPT] | Convert callback to async/await |

---

## 6. app-rich-editor.jsx — Rich Text Editor

| v2 Function | Line | Action | Notes |
|---|---|---|---|
| `RichTextEditor(props)` | 2130 | [ADAPT] | Convert from `React.createElement` to JSX. Fix bugs: toggle causes blank page, preview not updating. |

**Known v2 bugs to fix:**
1. Toggle rich text button crashes page to blank (likely state update issue)
2. Hero changes don't reflect in preview (resolveHero not picking up new fields)

---

## 7. Components — SKIP (already in v3)

These v2 components are REPLACED by v3 equivalents:

| v2 Component | v3 Equivalent |
|---|---|
| `SidebarSection` | `Sidebar` (app-compositor.jsx) |
| `BlockEditor` | `BlockCard` + `Inspector` |
| `EmailComposer` (main) | `App` (app-main.jsx) |
| `ProductSelect` | Product selector in Inspector |
| `BrandEditorModal` | `BrandBOEdit` in BackofficeDrawer |
| `ProductEditorModal` | `ProductBOEdit` in BackofficeDrawer |
| `TextEditorModal` | `TextBOEdit` in BackofficeDrawer |
| `TemplateEditorModal` | `TemplateBOEdit` in BackofficeDrawer |
| `StandaloneBlockEditorModal` | `StandaloneBOEdit` in BackofficeDrawer |
| `BlockEditorModal` | Inspector + BackofficeDrawer |
| `BlockLibraryPicker` | CommandPalette |
| SVG icons (ArrowUp, etc.) | `Icon` component |

---

## 8. State Management — Wire v2 logic into v3 App

The v3 `App` component needs these state hooks (from v2 `EmailComposer`):

| State | Source (v2 line) | Notes |
|---|---|---|
| `appState` / `setAppState` | 2736 | Main data state (products, brands, texts, etc.) |
| `blocks` / `setBlocks` | 2778 | Current email draft blocks |
| `lang` / `setLang` | 2633 | Current language |
| `appMode` / `setAppMode` | 2636 | 'compositor' or 'backoffice' |
| `boUnlocked` / `setBoUnlocked` | 2639 | Backoffice access state |
| `syncStatus` / `setSyncStatus` | 2750 | Supabase sync indicator |
| `copied` / `setCopied` | 2801 | Copy-to-clipboard feedback |
| `showPreview` / `setShowPreview` | 2804 | Toggle preview panel |
| `showHtmlCode` / `setShowHtmlCode` | 2807 | Toggle HTML source view |

---

## Execution Order

1. **app-data.jsx** — No dependencies. Port data first.
2. **app-i18n.jsx** — Depends on data types only.
3. **app-security.jsx** — No dependencies.
4. **app-supabase.jsx** — Depends on data types.
5. **app-email-gen.jsx** — Depends on i18n + data + security (sanitizeHtml).
6. **app-rich-editor.jsx** — Depends on security (sanitizeHtml).
7. **Wire into v3 components** — Connect all modules to existing v3 UI.
