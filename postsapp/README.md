# postsapp

App para generar posts para Instagram, Facebook y LinkedIn.

## Estructura
- `client/`: frontend sencillo (HTML/CSS/JS)
- `server/`: API Express para generar contenido
- `prompts/`: prompts por plataforma

## Ejecutar
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Luego abre `client/index.html` en navegador (o sírvelo con cualquier static server) y configura la URL de API.


## Reutilizar catálogo existente
Ver `docs/CATALOG_INTEGRATION.md` para conectar exportes de `composerapp` y aprovechar traducciones, links localizados e imágenes de biblioteca.


## Beta rápida (lo mínimo para validar)
1. Exporta estado JSON desde composerapp (Backoffice).
2. En `server/.env` pon `APP_STATE_FILE=/ruta/export.json`.
3. Arranca server con `npm run dev` en `postsapp/server`.
4. Abre `postsapp/client/index.html`, elige idioma y producto de catálogo, y genera posts.


## Arranque 1 comando
Desde `postsapp/` ejecuta:
```bash
./start-beta.sh
```
Luego abre `http://localhost:8787` en el navegador.


## Sin subir archivos (pegar JSON)
Si no puedes subir el JSON, abre la beta en `http://localhost:8787`, despliega **"Cargar JSON del catálogo"**, pega el contenido completo del export y pulsa **Importar catálogo**.
