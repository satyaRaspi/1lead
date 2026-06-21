@echo off
setlocal
set ROOT=%~dp0
echo Starting Truflux Website First Build v1.0.15...
echo This will open backend and frontend command windows.
echo Stable mode: backend does not use --reload, so local database changes will not restart the app.

start "Truflux Backend" cmd /k "cd /d %ROOT%backend && py -m venv .venv && .venv\Scripts\activate && python -m pip install --upgrade pip setuptools wheel && python -m pip install --no-cache-dir -r requirements.txt && python -c ""import fastapi, uvicorn, multipart; print('Backend dependencies OK')"" && python -m uvicorn main:app --host 127.0.0.1 --port 8000"
start "Truflux Frontend" cmd /k "cd /d %ROOT%frontend && npm install --no-fund --no-audit && set VITE_API_BASE=http://127.0.0.1:8000&& npm run dev -- --host 127.0.0.1 --port 5173"

echo Backend:  http://127.0.0.1:8000/api/health
echo Frontend: http://127.0.0.1:5173
echo Admin:    http://127.0.0.1:5173/admin
endlocal
