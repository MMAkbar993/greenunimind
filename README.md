# GreenUniMind

An online course marketplace where teachers publish and sell courses and students learn at their own pace. Live at **[www.greenunimind.com](https://www.greenunimind.com)**.

- **Frontend:** React + Vite + TypeScript, Tailwind, shadcn/ui (Radix), Redux Toolkit, TanStack Query (`frontend/`)
- **Backend:** Node.js + Express, MongoDB via Mongoose (`backend/`)
- **Services:** Stripe and Stripe Connect (payments and teacher payouts), Google Gemini (AI course tools), Cloudinary (media and video), SMTP email

---

## Features

**For students**
- Browse, search and filter courses by category and sub-category, with personalised recommendations
- Buy courses through Stripe and get a PDF invoice, plus a certificate on completion
- Video lectures with quality selection, progress tracking, notes and bookmarks
- Course Q&A, reviews, achievements and messaging with teachers

**For teachers**
- Onboarding and a teacher dashboard
- Course builder with lectures, outlines and categories
- AI writing tools (Gemini): improve titles, subtitles and descriptions, suggest a category, generate a course outline
- Stripe Connect onboarding for payouts, with account status, retry and audit log
- Revenue, analytics and monthly reports

**Platform**
- Email/password auth with JWT access and refresh tokens and 2FA (TOTP)
- Separate rate limits for auth, AI, payment and upload endpoints
- Security middleware: Helmet, HPP, Mongo query sanitising, CORS allow-list

---

## Project structure

```
frontend/   React + Vite app (student and teacher UI)
backend/    Express API
  routes/        one file per area (auth, courses, lectures, payments, stripeConnect, ai, analytics, ...)
  controllers/   route handlers
  models/        Mongoose schemas
  middleware/    auth, rate limiting, uploads, errors
  scripts/       seed scripts
deploy/     VPS deploy script, PM2 config, Nginx config
.github/    GitHub Actions workflow that deploys to the VPS
```

More detail on the data model is in [`backend/README.md`](backend/README.md) and [`backend/BACKEND_DOCUMENTATION.md`](backend/BACKEND_DOCUMENTATION.md).

---

## Running locally

Requires Node 20+ and a MongoDB database (local or Atlas).

```bash
# 1. Backend
cd backend
cp .env.example .env      # fill in MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET at minimum
npm install
npm run seed:courses      # optional: load sample courses
npm run dev

# 2. Frontend (second terminal)
cd frontend
cp .env.example .env      # set VITE_API_BASE_URL to your backend, e.g. http://localhost:5000/api
npm install
npm run dev
```

Optional services fall back gracefully when their keys are missing: without Stripe keys payments run in dev mode, and without email settings messages are logged to the console. AI features need `GEMINI_API_KEY`.

---

## Configuration

All settings come from environment variables. Every variable is listed, with comments, in:

| File | What it covers |
|---|---|
| `backend/.env.example` | Port, MongoDB, JWT secrets, Gemini, allowed frontend URLs, rate limits, Stripe, SMTP |
| `frontend/.env.example` | API and WebSocket URLs, OAuth client IDs, feature flags |

Never commit a filled-in `.env`.

---

## Deployment

Production runs on a VPS: Nginx serves the built frontend and proxies `/api` to the Express backend, which runs under PM2 and connects to MongoDB Atlas. Pushing to the main branch triggers the GitHub Actions workflow in `.github/workflows/deploy-vps.yml`.

The full step-by-step guide is in [`DEPLOYMENT_VPS.md`](DEPLOYMENT_VPS.md). The frontend can also be deployed to Cloudflare Pages with `npm run pages:deploy`.

---

Built by [Muhammad Mujeeb Akbar](https://mmakbar.vercel.app/) · [Case study](https://mmakbar.vercel.app/work/greenunimind.html)
