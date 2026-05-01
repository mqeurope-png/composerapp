#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${1:-/workspace/social-post-studio}"

if [ -d "$TARGET_DIR" ]; then
  echo "El directorio $TARGET_DIR ya existe. Cancelo para no sobreescribir." >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

git init -b main
npm create vite@latest . -- --template react
npm install
npm install express cors dotenv openai

cat > .env.example <<ENV
OPENAI_API_KEY=
PORT=8787
ENV

echo "Repositorio creado en: $TARGET_DIR"
echo "Siguiente paso: cd $TARGET_DIR && npm run dev"
