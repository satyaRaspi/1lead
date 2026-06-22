#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "Resetting local Python and Node installs for Truflux Website v1.0.22..."
rm -rf "$ROOT/backend/.venv" "$ROOT/frontend/node_modules" "$ROOT/frontend/dist" "$ROOT/logs"
exec "$ROOT/run-mac.sh"
