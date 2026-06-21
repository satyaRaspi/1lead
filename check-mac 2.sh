#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "Truflux Website v1.0.9 Mac readiness check"
echo "------------------------------------------"
echo "Folder: $ROOT"
echo "Python: $(python3 --version 2>/dev/null || echo 'not found')"
echo "Node:   $(node -v 2>/dev/null || echo 'not found')"
echo "npm:    $(npm -v 2>/dev/null || echo 'not found')"
echo "Port 8000 users: $(lsof -ti tcp:8000 2>/dev/null || echo 'none')"
echo "Port 5173 users: $(lsof -ti tcp:5173 2>/dev/null || echo 'none')"
echo "Backend requirements:"
sed 's/^/  - /' "$ROOT/backend/requirements.txt"
echo "\nTo start clean: ./reset-and-run-mac.sh"
