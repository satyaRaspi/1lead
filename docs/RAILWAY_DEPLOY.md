# Railway Deployment — Truflux Website v1.0.23

This build is Railway-ready as a single service.

## Why v1.0.23 fixes the Railpack error

Railway/Railpack previously detected Node at the repository root but did not find a start command. This version adds:

- Root `package.json` start/build scripts
- Root `requirements.txt`
- `Dockerfile`
- `railway.json` forcing Dockerfile deployment
- FastAPI production serving for the built React/Vite frontend

## Recommended Railway setup

1. Push this folder to GitHub.
2. Create a Railway project from the GitHub repository.
3. Railway should detect `railway.json` and use the Dockerfile.
4. Set these environment variables in Railway:

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<change-this>
ADMIN_TOKEN=<change-this-long-random-token>
PUBLIC_BASE_URL=https://<your-railway-domain>
```

5. Deploy.
6. Open:

```text
https://<your-railway-domain>/api/health
https://<your-railway-domain>/
https://<your-railway-domain>/admin
```

## If Railway still uses Railpack instead of Dockerfile

In Railway service settings, set the builder to Dockerfile or redeploy after confirming `railway.json` is committed at the repository root.

## Local Docker test

```bash
docker build -t truflux-website:1.0.23 .
docker run --rm -p 8000:8000 -e PORT=8000 truflux-website:1.0.23
```

Then open:

```text
http://127.0.0.1:8000
http://127.0.0.1:8000/admin
http://127.0.0.1:8000/api/health
```

## v1.0.23 note: Vite build fix

If Railway showed `sh: 1: vite: not found`, use v1.0.23 or later. The fix removes the frontend lock file and updates the Dockerfile to install Vite before running the production build.
