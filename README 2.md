# Truflux Technologies Website — First Build v1.0.0

This is a local demo build for the rebuilt **Truflux Technologies** website.

It demonstrates:

- Elegant first page using Truflux brand colors
- Four service lines: Consulting, Data & Insights, Innovation, AI Products & Platforms
- Gated whitepaper access after audience data capture
- Admin upload section for whitepapers and posters
- Launch scheduling for whitepapers
- LinkedIn post generator with UTM tracking links
- Lead capture dashboard
- Lightweight analytics event capture
- Node.js frontend + Python FastAPI backend

## Tech Stack

- **Frontend:** React + Vite running on Node.js
- **Backend:** Python FastAPI
- **Database:** SQLite for local demo
- **Uploads:** Local file storage under `backend/storage/`

## Default URLs

- Website: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Backend health check: `http://localhost:8000/api/health`

## Admin Login

- Username: `admin`
- Password: `truflux@123`

## Run Locally — macOS / Linux

Open Terminal 1:

```bash
cd truflux_website_first_build_v1_0_0/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open Terminal 2:

```bash
cd truflux_website_first_build_v1_0_0/frontend
npm install
npm run dev
```

Then open `http://localhost:5173`.

## Run Locally — Windows

Open Command Prompt 1:

```bat
cd truflux_website_first_build_v1_0_0\backend
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open Command Prompt 2:

```bat
cd truflux_website_first_build_v1_0_0\frontend
npm install
npm run dev
```

Then open `http://localhost:5173`.

## Flow to Test

1. Open the homepage.
2. Go to **Whitepapers**.
3. Click **Unlock Whitepaper**.
4. Fill the audience form and give consent.
5. Download the PDF.
6. Go to **Admin** and check leads/analytics.
7. In Admin, upload a new whitepaper PDF, poster and launch schedule.
8. Open **Launch & LinkedIn** and generate a LinkedIn post with UTM tracking link.

## LinkedIn Integration in This First Build

This version includes **manual assisted LinkedIn posting**:

- Upload poster
- Add launch schedule
- Generate LinkedIn-ready post copy
- Generate UTM tracking link
- Copy post text
- Use the poster asset for manual LinkedIn posting

Direct LinkedIn API posting is intentionally not enabled in this first local build because it requires LinkedIn Developer App setup, OAuth permissions, secure token storage, organization posting approval and callback URLs.

## Suggested Next Build v1.1.0

- Real email notifications to Truflux team
- Password change and user roles
- Production PostgreSQL database
- Cloud file storage
- LinkedIn OAuth posting
- GA4 / GTM integration
- SEO admin controls per page
- Blog/insights publishing
- Whitepaper preview pages


## macOS note for v1.0.2

The `run-mac.sh` script now runs backend and frontend in the same Terminal window. This avoids AppleScript quoting errors such as:

```text
syntax error: A identifier can’t go after this “"”. (-2740)
```

Recommended command:

```bash
chmod +x run-mac.sh reset-and-run-mac.sh run-backend-mac.sh run-frontend-mac.sh
./reset-and-run-mac.sh
```

If you want separate terminals, run these two commands in two different Terminal windows:

```bash
./run-backend-mac.sh
```

```bash
./run-frontend-mac.sh
```

Open:

```text
http://localhost:5173
```

Backend health check:

```text
http://localhost:8000/api/health
```

## v1.0.7 update
- Removed the remaining directional/chevron-style treatment from the whitepaper tiles.
- Replaced whitepaper tiles with full gradient cards using Truflux blue/navy styling.


## v1.0.10 update
- Added AI Whitepaper Detail Fill in Admin > Upload & Schedule. Upload/select a PDF and the system reads the document to pre-fill title, category, summary, long description, SEO title, meta description and LinkedIn launch copy.
- Uses local PDF text extraction and rule-based AI-style summarisation for offline demo. Production can connect the same endpoint to an LLM service.
