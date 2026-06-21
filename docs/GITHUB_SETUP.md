# GitHub Setup

## 1. Create a new empty GitHub repository

Example name:

```text
truflux-website
```

Do not add a README, license, or `.gitignore` on GitHub because this project already includes them.

## 2. Initialize Git locally

From the extracted project folder:

```bash
git init
git add .
git commit -m "Initial commit: Truflux website first build v1.0.16"
```

## 3. Connect to GitHub

Replace the URL with your actual repository URL:

```bash
git branch -M main
git remote add origin https://github.com/<your-user-or-org>/truflux-website.git
git push -u origin main
```

## 4. Usual update flow

```bash
git status
git add .
git commit -m "Describe the change"
git push
```

## 5. Files intentionally excluded from Git

The `.gitignore` excludes local runtime and generated files such as:

- `backend/.venv/`
- `frontend/node_modules/`
- `frontend/dist/`
- local SQLite databases
- uploaded PDFs/posters, except `.gitkeep` folder placeholders
- logs
- local `.env` files

Use `.env.example` files as templates and keep real secrets out of Git.
