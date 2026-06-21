# Truflux Website First Build v1.0.16
# Railway-ready single-service deployment.
# Builds the Vite frontend, then serves it from the Python FastAPI backend.

FROM node:20-slim AS frontend-build
WORKDIR /app/frontend

# Copy only package.json first for better Docker cache.
# Do not copy package-lock.json because earlier builds contained environment-specific registry URLs.
COPY frontend/package.json ./package.json

# Install Vite and all frontend dependencies needed for build.
RUN npm install --include=dev --no-audit --no-fund

COPY frontend/ ./
RUN ./node_modules/.bin/vite build

FROM python:3.11-slim AS runtime
WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY backend/requirements.txt ./backend/requirements.txt
RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

WORKDIR /app/backend
EXPOSE 8000
CMD ["sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
