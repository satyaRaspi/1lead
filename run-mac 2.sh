#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"
LOG_DIR="$ROOT/logs"
PYTHON_CMD="${PYTHON_CMD:-python3}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
mkdir -p "$LOG_DIR"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

printf "\nStarting Truflux Website First Build v1.0.14 for macOS...\n"
printf "Stable mode: no uvicorn --reload, so SQLite/uploads will not trigger backend restarts.\n"
printf "The frontend package lock is intentionally omitted; npm installs from the public npm registry.\n\n"

cleanup() {
  printf "\nStopping Truflux local servers...\n"
  if [[ -n "${BACKEND_PID:-}" ]]; then kill "$BACKEND_PID" 2>/dev/null || true; fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
  if [[ -n "${TAIL_PID:-}" ]]; then kill "$TAIL_PID" 2>/dev/null || true; fi
}
trap cleanup INT TERM EXIT

kill_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
      printf "Port %s is already in use. Stopping old process(es): %s\n" "$port" "$pids"
      kill $pids 2>/dev/null || true
      sleep 1
    fi
  fi
}

wait_for_url() {
  local url="$1"
  local label="$2"
  for i in {1..40}; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      printf "%s is ready.\n" "$label"
      return 0
    fi
    sleep 0.5
  done
  printf "\n%s did not become ready.\n" "$label"
  return 1
}

kill_port "$BACKEND_PORT"
kill_port "$FRONTEND_PORT"

printf "[1/5] Preparing Python backend...\n"
cd "$BACKEND_DIR"
"$PYTHON_CMD" -m venv .venv
# shellcheck disable=SC1091
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install --no-cache-dir -r requirements.txt
python - <<'PY'
import fastapi, uvicorn, multipart
print('Backend dependencies OK')
PY

printf "\n[2/5] Starting backend on http://127.0.0.1:%s ...\n" "$BACKEND_PORT"
: > "$BACKEND_LOG"
python -m uvicorn main:app --host 127.0.0.1 --port "$BACKEND_PORT" > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
if ! wait_for_url "http://127.0.0.1:$BACKEND_PORT/api/health" "Backend"; then
  printf "\nBackend log:\n"
  cat "$BACKEND_LOG" || true
  exit 1
fi

printf "\n[3/5] Preparing Node frontend...\n"
cd "$FRONTEND_DIR"
if ! command -v node >/dev/null 2>&1; then
  printf "Node.js is not installed or not available in PATH. Install Node.js LTS and run again.\n"
  exit 1
fi
printf "Node version: %s\n" "$(node -v)"
printf "npm version:  %s\n" "$(npm -v)"
npm install --no-fund --no-audit

printf "\n[4/5] Verifying frontend build...\n"
npm run build > "$LOG_DIR/frontend-build.log" 2>&1 || { printf "Frontend build failed. Log:\n"; cat "$LOG_DIR/frontend-build.log"; exit 1; }
printf "Frontend build OK.\n"

printf "\n[5/5] Starting frontend on http://127.0.0.1:%s ...\n" "$FRONTEND_PORT"
: > "$FRONTEND_LOG"
VITE_API_BASE="http://127.0.0.1:$BACKEND_PORT" npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
if ! wait_for_url "http://127.0.0.1:$FRONTEND_PORT" "Frontend"; then
  printf "\nFrontend log:\n"
  cat "$FRONTEND_LOG" || true
  exit 1
fi

printf "\nReady. Open these URLs:\n"
printf "Backend health: http://127.0.0.1:%s/api/health\n" "$BACKEND_PORT"
printf "Frontend:       http://127.0.0.1:%s\n" "$FRONTEND_PORT"
printf "Admin:          http://127.0.0.1:%s/admin\n" "$FRONTEND_PORT"
printf "\nAdmin login: admin / truflux@123\n"
printf "\nLogs:\n  %s\n  %s\n" "$BACKEND_LOG" "$FRONTEND_LOG"
printf "\nPress Ctrl+C to stop both servers.\n\n"

tail -n +1 -f "$BACKEND_LOG" "$FRONTEND_LOG" &
TAIL_PID=$!
wait "$BACKEND_PID" "$FRONTEND_PID"
