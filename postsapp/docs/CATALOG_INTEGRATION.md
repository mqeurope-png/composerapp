# Reutilizar catálogo + traducciones + links + biblioteca de imágenes

Esta app puede leer el **estado exportado** de la app principal (`composerapp`) y reutilizar:
- productos
- campos traducidos por idioma (`i18n`)
- enlaces traducidos (`i18n.<lang>.link`)
- imágenes base y traducidas (`img` + `i18n.<lang>.img`)
- biblioteca de imágenes subidas (`uploadedImages`)

## 1) Exportar estado desde la app principal
En Backoffice → exporta el estado completo a un JSON.

## 2) Configurar `postsapp/server/.env`
```env
APP_STATE_FILE=/ruta/al/export.json
```

## 3) Endpoints nuevos
- `GET /api/catalog/products?lang=es|en|fr|de|nl`
  - devuelve productos con descripción, link e imagen localizados.
- `GET /api/catalog/images`
  - devuelve todas las URLs de imágenes conocidas (catálogo + subidas).

## Uso recomendado
Al generar un post:
1. Elegir idioma objetivo.
2. Obtener productos con `lang` correspondiente.
3. Usar `link` ya traducido y la imagen resultante del catálogo.
4. Si no hay imagen en producto, usar una de `/api/catalog/images`.
