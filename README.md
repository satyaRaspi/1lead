# Truflux Technologies Website — First Build v1.0.15

Git-ready local build for the rebuilt **Truflux Technologies** website.

## What is included

- Public Truflux website with refined dark industrial branding
- Service lines: Consulting, Data & Insights, Innovation, AI Products & Platforms
- Gated whitepaper access after audience data capture
- Admin panel with left-side menu
- Whitepaper PDF upload, poster upload and launch scheduling
- AI-style PDF detail extraction for whitepaper metadata
- LinkedIn post generator and Sales Navigator assisted import workflow
- Lead Agent with CIO discovery/import workflow
- Contact dialog and contact enquiry capture
- Lead, contact and analytics dashboards
- CSV exports
- Node.js frontend + Python FastAPI backend
- GitHub-ready `.gitignore`, `.gitattributes`, `.env.example`, setup docs and CI workflow

## Tech stack

- **Frontend:** React + Vite running on Node.js
- **Backend:** Python FastAPI
- **Database:** SQLite for local demo
- **Uploads:** Local file storage under `backend/storage/`

## Default URLs

- Website: `http://127.0.0.1:5173`
- Admin: `http://127.0.0.1:5173/admin`
- Backend API: `http://127.0.0.1:8000`
- Health check: `http://127.0.0.1:8000/api/health`

## Admin login

```text
Username: admin
Password: truflux@123
```

For production, change these through environment variables before deployment.

## Run locally on macOS / Linux

```bash
chmod +x run-mac.sh reset-and-run-mac.sh run-backend-mac.sh run-frontend-mac.sh check-mac.sh
./reset-and-run-mac.sh
```

Or run separately:

Terminal 1:

```bash
./run-backend-mac.sh
```

Terminal 2:

```bash
./run-frontend-mac.sh
```

## Run locally on Windows

```bat
run-windows.bat
```

## Check local environment on Mac

```bash
./check-mac.sh
```

## GitHub setup

See:

```text
docs/GITHUB_SETUP.md
```

Quick commands:

```bash
git init
git add .
git commit -m "Initial commit: Truflux website first build v1.0.15"
git branch -M main
git remote add origin https://github.com/<your-user-or-org>/truflux-website.git
git push -u origin main
```

## Environment variables

Template files are included:

```text
.env.example
backend/.env.example
frontend/.env.example
```

Do not commit real `.env` files.

## Important local-demo notes

- The local build uses SQLite and local file storage.
- Uploaded whitepapers/posters are excluded from Git by default.
- LinkedIn Sales Navigator is implemented as an assisted/import workflow, not scraping.
- Direct LinkedIn API posting requires a LinkedIn Developer app, OAuth setup, approved scopes and secure token storage.

## Suggested next build

- Production PostgreSQL database
- Cloud file storage
- Secure admin user management
- Real email sending
- GA4/GTM production tracking
- Server-side LinkedIn OAuth integration
- Deployment configuration for Railway/Vercel/Cloudflare

## Railway deployment note for v1.0.15

This version includes a `Dockerfile` and `railway.json` so Railway deploys the app as one service. The frontend is built during deployment and served by the Python FastAPI backend.

See `docs/RAILWAY_DEPLOY.md` for the full deployment steps.
