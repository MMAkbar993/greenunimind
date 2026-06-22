# GreenUniMind — VPS Deployment Guide (GitHub → 72.62.75.62)

Deploy **GreenUniMind** on your existing VPS **without touching other websites**.

This guide uses **isolation by design**:

| Resource | GreenUniMind only | Other sites |
|----------|-------------------|-------------|
| App folder | `/var/www/greenunimind` | Their own folders |
| Nginx config | `/etc/nginx/sites-available/greenunimind.conf` | Untouched |
| PM2 process | `greenunimind-api` | Their own processes |
| Backend port | `127.0.0.1:5001` (localhost) | Other ports |
| SSL cert | `www.greenunimind.com` only | Their domains |

**Do not edit** `default`, other `sites-available/*` files, or global `nginx.conf` except the standard `include sites-enabled/*` line (usually already present).

---

## Stack overview

```
Browser
   │
   ▼
Nginx (port 443) ── www.greenunimind.com
   ├── /          → static files (Vite React build)
   └── /api/*     → proxy → Node backend (127.0.0.1:5001)
                              │
                              ▼
                         MongoDB Atlas (cloud)
```

- **Frontend:** Vite + React → build to `frontend/dist`
- **Backend:** Express on port `5001` (PM2)
- **Database:** MongoDB Atlas (already in `.env` — stays external)

---

## Part 1 — One-time VPS setup

SSH into the server:

```bash
ssh root@72.62.75.62
```

### 1.1 Inspect existing setup (read-only)

Before changing anything, list what is already running:

```bash
# See other websites — DO NOT modify these files
ls -la /etc/nginx/sites-enabled/

# See ports already in use (pick a free port for GreenUniMind)
ss -tlnp | grep -E ':(80|443|3000|5000|5001|8080)'

# See existing PM2 apps
pm2 list
```

If port `5001` is taken, use `5010` everywhere below and update `PORT` in backend `.env`.

### 1.2 Install Node.js 20 (if not installed)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v   # should show v20.x
npm -v
```

### 1.3 Install PM2 (if not installed)

```bash
npm install -g pm2
```

### 1.4 Create isolated app directory

```bash
mkdir -p /var/www/greenunimind
chown -R $USER:$USER /var/www/greenunimind
```

---

## Part 2 — Push code to GitHub

On your **local machine** (Windows), from the project folder:

```powershell
cd E:\fiverr\greenunimind_frontend

# Initialize git (skip if repo already exists)
git init
git add frontend backend deploy .github
git commit -m "Initial commit for VPS deployment"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/greenunimind.git
git branch -M main
git push -u origin main
```

> **Important:** Never commit `.env` files. They contain secrets. Only commit `.env.example` files.

Add to `.gitignore` at project root if missing:

```
backend/.env
frontend/.env
frontend/.env.production
node_modules/
frontend/dist/
backend/uploads/*
!backend/uploads/.gitkeep
```

---

## Part 3 — Clone on VPS

Back on the VPS:

```bash
cd /var/www/greenunimind
git clone https://github.com/YOUR_USERNAME/greenunimind.git .
```

Or, if the repo is private, use a **deploy key** (recommended):

```bash
# On VPS — generate deploy key
ssh-keygen -t ed25519 -C "greenunimind-deploy" -f ~/.ssh/greenunimind_deploy -N ""

# Show public key — add this in GitHub → Repo → Settings → Deploy keys
cat ~/.ssh/greenunimind_deploy.pub

# Clone with deploy key
GIT_SSH_COMMAND='ssh -i ~/.ssh/greenunimind_deploy -o IdentitiesOnly=yes' \
  git clone git@github.com:YOUR_USERNAME/greenunimind.git /var/www/greenunimind
```

---

## Part 4 — Backend setup

### 4.1 Create production environment file

```bash
nano /var/www/greenunimind/backend/.env
```

Copy values from your local `backend/.env` and set production values:

```env
PORT=5001
NODE_ENV=production

# Required
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_strong_secret
JWT_REFRESH_SECRET=your_strong_refresh_secret
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# CORS — your live frontend URL(s), comma-separated
CLIENT_URL=https://www.greenunimind.com,https://greenunimind.com

# AI, Stripe, Email, Cloudinary — copy from your local .env
GEMINI_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
EMAIL_HOST=...
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASS=...
EMAIL_FROM="GreenUniMind" <noreply@greenunimind.com>
```

Save: `Ctrl+O`, Enter, `Ctrl+X`.

### 4.2 Install dependencies and start with PM2

```bash
cd /var/www/greenunimind/backend
npm ci --omit=dev

# Start using the ecosystem file (isolated process name)
pm2 start /var/www/greenunimind/deploy/ecosystem.config.cjs
pm2 save
pm2 startup   # run the command it prints so PM2 survives reboot
```

Verify backend:

```bash
curl http://127.0.0.1:5001/api/health
# Expected: {"success":true,"message":"GreenUniMind API is running."}
```

---

## Part 5 — Frontend build

### 5.1 Create production env for Vite

```bash
nano /var/www/greenunimind/frontend/.env.production
```

```env
VITE_NODE_ENV=production

# Same domain — nginx proxies /api to backend (no CORS issues)
VITE_API_BASE_URL=https://www.greenunimind.com/api

VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_REDIRECT_URI=https://www.greenunimind.com/oauth/callback/google

VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_PRESET=your_preset
```

### 5.2 Build

```bash
cd /var/www/greenunimind/frontend
npm ci
npm run build
```

Output goes to `frontend/dist/`.

---

## Part 6 — Nginx (new site only)

### 6.1 Copy the site config

```bash
cp /var/www/greenunimind/deploy/nginx-greenunimind.conf \
   /etc/nginx/sites-available/greenunimind.conf
```

Edit domain if needed:

```bash
nano /etc/nginx/sites-available/greenunimind.conf
```

### 6.2 Enable **only** this site (do not disable others)

```bash
ln -sf /etc/nginx/sites-available/greenunimind.conf /etc/nginx/sites-enabled/greenunimind.conf

# Test config — MUST pass before reload
nginx -t

# Reload nginx (safe — does not stop other sites)
systemctl reload nginx
```

### 6.3 DNS

Point your domain to the VPS:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `72.62.75.62` |
| A | `www` | `72.62.75.62` |

Wait for DNS propagation (5–30 minutes).

### 6.4 SSL (only for GreenUniMind domain)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d www.greenunimind.com -d greenunimind.com
```

Certbot will modify **only** `greenunimind.conf`. Other site certs are untouched.

---

## Part 7 — GitHub Actions auto-deploy

Every push to `main` can deploy automatically.

### 7.1 Add GitHub secrets

In GitHub → **Settings → Secrets and variables → Actions**, add:

| Secret | Value |
|--------|-------|
| `VPS_HOST` | `72.62.75.62` |
| `VPS_USER` | `root` (or a dedicated deploy user) |
| `VPS_SSH_KEY` | Private SSH key that can log into the VPS |
| `VPS_PORT` | `22` (optional) |

### 7.2 Workflow file

The workflow is at `.github/workflows/deploy-vps.yml`. On push to `main` it:

1. SSH into VPS
2. `git pull`
3. Rebuild frontend
4. Restart backend via PM2
5. Reload nginx

Manual deploy from VPS:

```bash
bash /var/www/greenunimind/deploy/deploy.sh
```

---

## Part 8 — OAuth & Stripe webhooks

Update these in **Google Cloud Console**, **Stripe Dashboard**, etc.:

| Service | URL |
|---------|-----|
| Google OAuth redirect | `https://www.greenunimind.com/oauth/callback/google` |
| Stripe webhook | `https://www.greenunimind.com/api/payments/webhook` (confirm route in backend) |

Backend `CLIENT_URL` must include `https://www.greenunimind.com`.

---

## Part 9 — Updating the site

### Manual update on VPS

```bash
cd /var/www/greenunimind
git pull origin main
bash deploy/deploy.sh
```

### What `deploy.sh` does

1. `npm ci` + build frontend
2. `npm ci` backend
3. `pm2 restart greenunimind-api`
4. `nginx -t && systemctl reload nginx`

---

## Safety checklist — do not break other websites

- [ ] Only create `/var/www/greenunimind` — never delete `/var/www/*` siblings
- [ ] Only add `greenunimind.conf` in nginx — never edit other site configs
- [ ] Use `nginx -t` before every reload
- [ ] Use `systemctl reload nginx` — not `restart` (zero downtime for other sites)
- [ ] Backend binds to `127.0.0.1:5001` only — not `0.0.0.0`
- [ ] PM2 app name is `greenunimind-api` — never `pm2 delete all`
- [ ] Run `certbot` only for `greenunimind.com` domains
- [ ] Never commit `.env` to GitHub

---

## Troubleshooting

### Frontend loads but API fails

```bash
curl http://127.0.0.1:5001/api/health
pm2 logs greenunimind-api --lines 50
```

### 502 Bad Gateway

Backend is down or wrong port in nginx config:

```bash
pm2 status
ss -tlnp | grep 5001
```

### React routes return 404

Nginx must have `try_files $uri $uri/ /index.html;` (included in `deploy/nginx-greenunimind.conf`).

### CORS errors

Set `CLIENT_URL=https://www.greenunimind.com` in `backend/.env` and restart PM2.

### Check nginx error log for this site only

```bash
tail -f /var/log/nginx/greenunimind-error.log
```

---

## Quick reference

| Item | Value |
|------|-------|
| VPS IP | `72.62.75.62` |
| App path | `/var/www/greenunimind` |
| Frontend build | `/var/www/greenunimind/frontend/dist` |
| Backend port | `5001` (localhost) |
| PM2 name | `greenunimind-api` |
| Nginx config | `/etc/nginx/sites-available/greenunimind.conf` |
| Health check | `https://www.greenunimind.com/api/health` |
