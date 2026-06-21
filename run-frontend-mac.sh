#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/frontend"
npm install --no-fund --no-audit
VITE_API_BASE="http://127.0.0.1:8000" npm run dev -- --host 127.0.0.1 --port 5173
