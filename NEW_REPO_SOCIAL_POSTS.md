# Nuevo repositorio: app de generación de posts sociales

Este documento deja preparado el arranque de un nuevo proyecto separado de `composerapp`, orientado a generar contenido para **Instagram, Facebook y LinkedIn**.

## Nombre sugerido
- `social-post-studio`

## Stack sugerido
- Frontend: React + Vite
- Backend: Node.js + Express
- IA: OpenAI Responses API
- Persistencia: Supabase (opcional)

## MVP (v1)
1. Selector de red social (Instagram/Facebook/LinkedIn).
2. Selector de tono (profesional, cercano, inspirador, ventas).
3. Entrada de brief:
   - objetivo
   - audiencia
   - producto/servicio
   - CTA
4. Generación de:
   - post principal
   - variantes A/B
   - hashtags sugeridos
5. Exportar/copy al portapapeles.

## Estructura de carpetas recomendada
```txt
social-post-studio/
  src/
    app/
    components/
    lib/
  server/
    routes/
    services/
  prompts/
  docs/
  .env.example
```

## Comandos para crearlo localmente
```bash
cd /workspace
mkdir social-post-studio
cd social-post-studio

git init -b main
npm create vite@latest . -- --template react
npm install
npm install express cors dotenv openai
```

## Siguientes pasos
- Definir prompts por red social en `prompts/`.
- Implementar endpoint `POST /api/generate-post`.
- Añadir plantillas base por plataforma.
