#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"

cd "$SERVER_DIR"

if [ ! -d node_modules ]; then
  npm install
fi

if [ ! -f .env ]; then
  cp .env.example .env
fi

echo "Iniciando beta en http://localhost:8787"
exec npm run dev
