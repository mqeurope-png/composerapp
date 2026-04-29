# Config & Endpoints Reference

## Supabase
- URL: `https://midvgxxndddasxlnstkg.supabase.co`
- Key: `sb_publishable_uiXB5JmZfPETeyGn3Rsw_Q_D7SLaJNd` (publishable, safe for client)
- Main table: `composer_data` (row: `main`)
- Backup table: `composer_backups`
- API format: REST via `/rest/v1/{table}` with `apikey` and `Authorization` headers

## Password Hashes (SHA-256)
- Backoffice ("bomedia"): `a1bfe0bf4fa8f02f1969c64276b15f55e455b3dd9f50f11a22fb8c284a9c2f48`
- Data ("bomedia2024"): `6fab52fdf6384db663c2aae68b921a907422f9bdd102fbd35a90fc71dc8423ea`

## CDN Dependencies
### v3 (current)
- React 18.3.1: `https://unpkg.com/react@18.3.1/umd/react.development.js`
- ReactDOM 18.3.1: `https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js`
- Babel Standalone: `https://unpkg.com/@babel/standalone/babel.min.js`

### v2 (reference — may switch to these for production)
- React 18.2.0: `https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js`
- ReactDOM 18.2.0: `https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js`

## Fonts (v3)
- Geist: `https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/`
- Instrument Serif: Google Fonts

## OpenAI Integration
- Key stored in `sessionStorage` (ephemeral, never synced)
- Used for text rewriting/translation suggestions
- Endpoint: `https://api.openai.com` (via CSP)

## Brands
| ID | Label | Color | Primary URL (ES) |
|---|---|---|---|
| artisjet | artisJet | #2563eb | boprint.net |
| mbo | MBO Printers | #7c3aed | mboprinters.com |
| pimpam | PimPam Vending | #ea580c | pimpam-vending.com |
| flux | FLUX | #64748b | (no default URL in v2) |
| bomedia | Bomedia | #1a1918 | bomedia.es |

## CSP (Content Security Policy) — v2
```
default-src 'none';
script-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline';
style-src 'self' 'unsafe-inline';
connect-src https://api.openai.com https://midvgxxndddasxlnstkg.supabase.co;
img-src * data: blob:;
font-src 'self' https://fonts.gstatic.com;
```
Note: v3 will need to add `https://unpkg.com` and `https://cdn.jsdelivr.net` to script-src/font-src.

## localStorage Keys
- `bomedia_composer_data` — full app state (products, brands, texts, etc.)
- `bomedia_draft_blocks` — current email draft blocks array
